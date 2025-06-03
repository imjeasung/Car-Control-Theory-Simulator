/**
 * F1 자율주행 제어 시뮬레이터 - 메인 애플리케이션 (확장 버전)
 * 
 * 전역 상태 관리 및 메인 애니메이션 루프 담당
 * 
 * 새로 추가된 기능:
 * - 제어 성능 메트릭 자동 계산
 * - 궤적 히스토리 표시
 * - 다중 제어기 비교 준비
 */

// ===== 성능 메트릭 클래스 =====
class PerformanceMetrics {
    constructor() {
        this.errorHistory = [];
        this.maxHistoryLength = 500;
        
        this.metrics = {
            overshoot: 0,
            settlingTime: 0,
            steadyStateError: 0,
            riseTime: 0,
            meanSquaredError: 0,
            integralAbsoluteError: 0
        };
        
        this.settlingBand = 0.05; // 5%
        this.steadyStateWindow = 3.0; // 3초
        this.trackRadius = 135; // 새로운 트랙 크기에 맞춤 (160px radiusX 기준)
        this.isSettled = false;
        this.maxError = 0;
    }
    
    addDataPoint(time, error, controlOutput) {
        this.errorHistory.push({ time, error, controlOutput });
        
        if (this.errorHistory.length > this.maxHistoryLength) {
            this.errorHistory.shift();
        }
        
        this.updateMetrics();
    }
    
    updateMetrics() {
        if (this.errorHistory.length < 2) return;
        
        this.calculateOvershoot();
        this.calculateSettlingTime();
        this.calculateSteadyStateError();
        this.calculateMSE();
        this.calculateIAE();
    }
    
    calculateOvershoot() {
        let maxAbsError = 0;
        for (const point of this.errorHistory) {
            const absError = Math.abs(point.error);
            if (absError > maxAbsError) {
                maxAbsError = absError;
            }
        }
        this.metrics.overshoot = (maxAbsError / this.trackRadius) * 100;
        this.maxError = maxAbsError;
    }
    
    calculateSettlingTime() {
        if (this.errorHistory.length < 10) {
            this.metrics.settlingTime = 0;
            return;
        }
        
        const settlingThreshold = this.trackRadius * this.settlingBand;
        let settlingStartTime = -1;
        
        for (let i = this.errorHistory.length - 1; i >= 0; i--) {
            const point = this.errorHistory[i];
            if (Math.abs(point.error) > settlingThreshold) {
                if (i < this.errorHistory.length - 1) {
                    settlingStartTime = this.errorHistory[i + 1].time;
                }
                break;
            }
        }
        
        if (settlingStartTime > 0) {
            const currentTime = this.errorHistory[this.errorHistory.length - 1].time;
            this.metrics.settlingTime = currentTime - settlingStartTime;
            this.isSettled = this.metrics.settlingTime > 1.0;
        }
    }
    
    calculateSteadyStateError() {
        if (this.errorHistory.length === 0) return;
        
        const currentTime = this.errorHistory[this.errorHistory.length - 1].time;
        const windowStart = currentTime - this.steadyStateWindow;
        
        const recentData = this.errorHistory.filter(point => point.time >= windowStart);
        
        if (recentData.length === 0) {
            this.metrics.steadyStateError = 0;
            return;
        }
        
        let sumAbsError = 0;
        for (const point of recentData) {
            sumAbsError += Math.abs(point.error);
        }
        
        this.metrics.steadyStateError = sumAbsError / recentData.length;
    }
    
    calculateMSE() {
        if (this.errorHistory.length === 0) return;
        
        let sumSquaredError = 0;
        for (const point of this.errorHistory) {
            sumSquaredError += point.error * point.error;
        }
        
        this.metrics.meanSquaredError = sumSquaredError / this.errorHistory.length;
    }
    
    calculateIAE() {
        if (this.errorHistory.length < 2) return;
        
        let integralError = 0;
        
        for (let i = 1; i < this.errorHistory.length; i++) {
            const prev = this.errorHistory[i - 1];
            const curr = this.errorHistory[i];
            const deltaTime = curr.time - prev.time;
            const avgAbsError = (Math.abs(prev.error) + Math.abs(curr.error)) / 2;
            
            integralError += avgAbsError * deltaTime;
        }
        
        this.metrics.integralAbsoluteError = integralError;
    }
    
    getPerformanceScore() {
        const m = this.metrics;
        
        const overshootScore = Math.max(0, 100 - m.overshoot * 2);
        const settlingScore = Math.max(0, 100 - m.settlingTime * 10);
        const steadyStateScore = Math.max(0, 100 - m.steadyStateError * 2);
        const mseScore = Math.max(0, 100 - Math.sqrt(m.meanSquaredError) * 0.1);
        
        const totalScore = (overshootScore * 0.3 + settlingScore * 0.3 + 
                           steadyStateScore * 0.2 + mseScore * 0.2);
        
        return Math.round(totalScore);
    }
    
    reset() {
        this.errorHistory = [];
        this.isSettled = false;
        this.maxError = 0;
        
        for (const key in this.metrics) {
            this.metrics[key] = 0;
        }
    }
}

// ===== 궤적 히스토리 클래스 =====
class TrajectoryHistory {
    constructor(maxPoints = 200) {
        this.points = [];
        this.maxPoints = maxPoints;
        this.isEnabled = true;
        this.colors = {
            recent: 'rgba(255, 255, 0, 0.8)',    // 최근: 노란색
            middle: 'rgba(255, 165, 0, 0.6)',    // 중간: 주황색  
            old: 'rgba(255, 0, 0, 0.4)'          // 오래된: 빨간색
        };
    }
    
    addPoint(x, y, time, error) {
        if (!this.isEnabled) return;
        
        this.points.push({ x, y, time, error });
        
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }
    
    render(ctx) {
        if (!this.isEnabled || this.points.length < 2) return;
        
        ctx.save();
        
        // 궤적을 그라데이션으로 그리기
        for (let i = 1; i < this.points.length; i++) {
            const prev = this.points[i - 1];
            const curr = this.points[i];
            
            // 시간에 따른 색상 결정
            const ageRatio = i / this.points.length;
            let color;
            
            if (ageRatio < 0.3) {
                color = this.colors.old;
            } else if (ageRatio < 0.7) {
                color = this.colors.middle;
            } else {
                color = this.colors.recent;
            }
            
            // 선분 그리기
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, ageRatio * 3);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    clear() {
        this.points = [];
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        console.log('🛤️ 궤적 히스토리:', this.isEnabled ? 'ON' : 'OFF');
    }
}

// ===== 전역 변수 =====
let canvas;
let ctx;
let animationId;

// 시뮬레이션 객체들
let track;
let vehicle;
let currentController;
let performanceMetrics;
let trajectoryHistory;

// 시뮬레이션 상태
const SimulationState = {
    isRunning: false,
    isPaused: false,
    time: 0,
    deltaTime: 0,
    lastTime: 0,
    
    // 성능 모니터링
    fps: 60,
    frameCount: 0,
    fpsTime: 0,
    
    // 시뮬레이션 속도
    timeScale: 1.0,
    
    // 제어 데이터
    currentError: 0,
    controlOutput: 0,
    
    // 디버그 모드
    debugMode: true,
    
    // 새로운 기능 토글
    showTrajectory: true,
    showMetrics: true,

    leftPressed: false,
    rightPressed: false,
    steeringInput: 0,
    maxSteering: 1.0
};

// 캔버스 설정
const CANVAS_CONFIG = {
    width: 720,
    height: 540,
    backgroundColor: '#1a1a1a'
};

// ===== 초기화 함수 =====
function init() {
    console.log('🚀 F1 제어 시뮬레이터 초기화 시작...');
    
    // Canvas 설정
    setupCanvas();
    
    // 시뮬레이션 객체 생성
    setupSimulationObjects();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // UI 초기화
    initializeUI();
    
    // 첫 화면 렌더링
    render();
    
    console.log('✅ 초기화 완료!');
    console.log('📊 Canvas 크기:', CANVAS_CONFIG.width, 'x', CANVAS_CONFIG.height);
    console.log('🏁 트랙 포인트 수:', track.centerLine.length);
    console.log('🎨 새로운 3열 레이아웃: 제어설정(왼쪽) + 시뮬레이션(가운데) + 성능메트릭(오른쪽)');
    console.log('🧠 MPC 제어기 지원:', window.Controllers.MPCController ? '✅' : '❌');
}

// ===== 시뮬레이션 객체 설정 =====
function setupSimulationObjects() {
    // 트랙 생성
    track = new Track(DEFAULT_TRACK_DATA);
    window.track = track;
    console.log('🏁 트랙 생성 완료:', track.name);
    
    // 차량 생성
    const startPoint = track.startPoint;
    vehicle = new Vehicle(startPoint.x, startPoint.y, startPoint.angle);
    window.vehicle = vehicle;
    console.log('🚗 차량 생성 완료 - 시작 위치:', startPoint.x, startPoint.y);
    
    // 기본 제어기 생성
    currentController = Controllers.createController('manual');
    window.currentController = currentController;
    console.log('🎛️ 기본 제어기 생성:', currentController.name);
    
    // 성능 메트릭 생성
    performanceMetrics = new PerformanceMetrics();
    window.performanceMetrics = performanceMetrics;
    console.log('📊 성능 메트릭 생성 완료');
    
    // 궤적 히스토리 생성
    trajectoryHistory = new TrajectoryHistory();
    window.trajectoryHistory = trajectoryHistory;
    console.log('🛤️ 궤적 히스토리 생성 완료');
}

// ===== Canvas 설정 =====
function setupCanvas() {
    canvas = document.getElementById('trackCanvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = CANVAS_CONFIG.width;
    canvas.height = CANVAS_CONFIG.height;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    
    console.log('🖼️ Canvas 설정 완료:', canvas.width, 'x', canvas.height);
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 시뮬레이션 제어 버튼
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    
    // 속도 조절 슬라이더
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        SimulationState.timeScale = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = e.target.value + 'x';
    });
    
    // 제어기 선택
    document.getElementById('controllerType').addEventListener('change', onControllerChange);
    
    // 새로운 토글 버튼들 (있는 경우)
    const trajectoryToggle = document.getElementById('trajectoryToggle');
    if (trajectoryToggle) {
        trajectoryToggle.addEventListener('change', (e) => {
            SimulationState.showTrajectory = e.target.checked;
            trajectoryHistory.isEnabled = e.target.checked;
        });
    }
    
    const metricsToggle = document.getElementById('metricsToggle');
    if (metricsToggle) {
        metricsToggle.addEventListener('change', (e) => {
            SimulationState.showMetrics = e.target.checked;
        });
    }
    
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ': // 스페이스바로 시작/일시정지
                e.preventDefault();
                if (SimulationState.isRunning) {
                    pauseSimulation();
                } else {
                    startSimulation();
                }
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                resetSimulation();
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                SimulationState.debugMode = !SimulationState.debugMode;
                console.log('🔧 디버그 모드:', SimulationState.debugMode ? 'ON' : 'OFF');
                break;
            case 't':
            case 'T':
                e.preventDefault();
                trajectoryHistory.toggle();
                SimulationState.showTrajectory = trajectoryHistory.isEnabled;
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                trajectoryHistory.clear();
                console.log('🧹 궤적 히스토리 삭제');
                break;
            case 'ArrowLeft':
                if (currentController && currentController.name === 'Manual') {
                    e.preventDefault();
                    SimulationState.leftPressed = true;
                }
                break;
            case 'ArrowRight':
                if (currentController && currentController.name === 'Manual') {
                    e.preventDefault();
                    SimulationState.rightPressed = true;
                }
                break;
        }
    });
    document.addEventListener('keyup', (e) => {
        // 🆕 방향키 해제
        if (currentController && currentController.name === 'Manual') {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    SimulationState.leftPressed = false;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    SimulationState.rightPressed = false;
                    break;
            }
        }
    });

    console.log('🎮 이벤트 리스너 등록 완료');
    
}


// ===== UI 초기화 =====
function initializeUI() {
    updateParameterPanel('manual');
    updateButtonStates();
    updateInfoPanel();
    updateMetricsPanel();
    
    console.log('🎛️ UI 초기화 완료');
}

// ===== 시뮬레이션 제어 함수 =====
function startSimulation() {
    if (!SimulationState.isRunning) {
        SimulationState.isRunning = true;
        SimulationState.isPaused = false;
        SimulationState.lastTime = performance.now();
        
        animationId = requestAnimationFrame(gameLoop);
        
        updateButtonStates();
        console.log('▶️ 시뮬레이션 시작');
    }
}

function pauseSimulation() {
    if (SimulationState.isRunning) {
        SimulationState.isPaused = true;
        SimulationState.isRunning = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        updateButtonStates();
        console.log('⏸️ 시뮬레이션 일시정지');
    }
}

function resetSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    SimulationState.isRunning = false;
    SimulationState.isPaused = false;
    SimulationState.time = 0;
    SimulationState.frameCount = 0;
    SimulationState.fpsTime = 0;
    SimulationState.currentError = 0;
    SimulationState.controlOutput = 0;
    
    const startPoint = track.startPoint;
    vehicle.reset(startPoint.x, startPoint.y, startPoint.angle);
    
    if (currentController && currentController.reset) {
        currentController.reset();
    }
    
    // 새로운 객체들 리셋
    performanceMetrics.reset();
    trajectoryHistory.clear();
    
    render();
    updateButtonStates();
    updateInfoPanel();
    updateMetricsPanel();
    
    console.log('🔄 시뮬레이션 리셋');
}

// ===== 메인 게임 루프 =====
function gameLoop(currentTime) {
    SimulationState.deltaTime = (currentTime - SimulationState.lastTime) / 1000;
    SimulationState.deltaTime *= SimulationState.timeScale;
    SimulationState.deltaTime = Math.min(SimulationState.deltaTime, 1/30);
    SimulationState.lastTime = currentTime;
    
    SimulationState.time += SimulationState.deltaTime;
    
    calculateFPS(currentTime);
    
    update(SimulationState.deltaTime);
    render();
    updateInfoPanel();
    updateMetricsPanel();
    
    if (SimulationState.isRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}
// ===== 수동 제어 입력 계산 =====
function updateSimulationState() {
    if (currentController && currentController.name === 'Manual') {
        // 방향키 입력에 따른 조향각 계산
        if (SimulationState.leftPressed && !SimulationState.rightPressed) {
            SimulationState.steeringInput = -SimulationState.maxSteering; // 왼쪽
        } else if (SimulationState.rightPressed && !SimulationState.leftPressed) {
            SimulationState.steeringInput = SimulationState.maxSteering;  // 오른쪽
        } else {
            SimulationState.steeringInput = 0; // 직진
        }
    } else {
        SimulationState.steeringInput = 0;
    }
}
// ===== 업데이트 함수 =====
function update(deltaTime) {
    if (!vehicle || !track || !currentController) return;
    
    // 1. 현재 오차 계산
    SimulationState.currentError = track.calculateError(vehicle.x, vehicle.y);
    updateSimulationState();

    // 2. 제어기로 조향각 계산
    if (currentController.name === 'Manual') {
        // 🆕 수동 제어: 방향키 입력 사용
        SimulationState.controlOutput = SimulationState.steeringInput;
    // 2. 제어기로 조향각 계산
    // MPC는 추가 차량 상태 정보가 필요
    }else if (currentController.name === 'MPC') {
        const vehicleState = {
            x: vehicle.x,
            y: vehicle.y,
            angle: vehicle.angle,
            speed: vehicle.speed
        };
        SimulationState.controlOutput = currentController.compute(SimulationState.currentError, deltaTime, vehicleState);
    } else {
        SimulationState.controlOutput = currentController.compute(SimulationState.currentError, deltaTime);
    }
    
    // 3. 조향각을 차량에 적용
    vehicle.setSteeringAngle(SimulationState.controlOutput);
    
    // 4. 차량 상태 업데이트
    vehicle.update(deltaTime);
    
    // 5. 성능 메트릭 데이터 추가
    performanceMetrics.addDataPoint(SimulationState.time, SimulationState.currentError, SimulationState.controlOutput);
    
    // 6. 궤적 히스토리 추가
    trajectoryHistory.addPoint(vehicle.x, vehicle.y, SimulationState.time, SimulationState.currentError);
}

// ===== 렌더링 함수 =====
function render() {
    // 화면 클리어
    ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 1. 궤적 히스토리 렌더링 (트랙 아래)
    if (SimulationState.showTrajectory) {
        trajectoryHistory.render(ctx);
    }
    
    // 2. 트랙 렌더링
    if (track) {
        track.render(ctx);
    }
    
    // 3. 차량 렌더링
    if (vehicle) {
        vehicle.render(ctx);
    }
    
    // 4. 디버그 정보 렌더링
    //if (SimulationState.debugMode) {
    //    renderDebugInfo();
    //}
    
    // 5. 시뮬레이션 정지 시 안내 메시지
    if (!SimulationState.isRunning) {
        renderPauseMessage();
    }
}

// ===== 디버그 정보 렌더링 =====
function renderDebugInfo() {
    if (!vehicle || !track) return;
    
    // 오차 벡터 표시
    const closestTrackInfo = track.getClosestTrackPoint(vehicle.x, vehicle.y);
    if (closestTrackInfo) {
        Utils.drawDebugPoint(ctx, closestTrackInfo.point.x, closestTrackInfo.point.y, '#00ff00', 4);
        Utils.drawDebugVector(ctx, vehicle.x, vehicle.y, closestTrackInfo.point.x, closestTrackInfo.point.y, '#ff0000', 2);
    }
    
    // MPC 예측 궤적 표시
    if (currentController.name === 'MPC' && currentController.getDiagnostics) {
        const mpcDiag = currentController.getDiagnostics();
        renderMPCPrediction(mpcDiag);
    }
    
    // 차량 정보 텍스트
    const debugText = [
        `Error: ${SimulationState.currentError.toFixed(1)}px`,
        `Control: ${SimulationState.controlOutput.toFixed(3)}`,
        `Speed: ${vehicle.speed.toFixed(1)}px/s`,
        `Angle: ${Utils.radiansToDegrees(vehicle.angle).toFixed(1)}°`,
        `Score: ${performanceMetrics.getPerformanceScore()}/100`
    ];
    
    // MPC 추가 정보
    if (currentController.name === 'MPC' && currentController.getDiagnostics) {
        const mpcDiag = currentController.getDiagnostics();
        debugText.push(`MPC Cost: ${mpcDiag.currentCost.toFixed(1)}`);
        debugText.push(`Computation: ${mpcDiag.computationTime.toFixed(1)}ms`);
    }
    
    debugText.forEach((text, index) => {
        Utils.drawDebugText(ctx, text, 10, 20 + index * 15, '#00ff00', 12);
    });
}

// ===== MPC 예측 궤적 렌더링 =====
function renderMPCPrediction(mpcDiag) {
    const predictedStates = mpcDiag.predictedStates;
    if (!predictedStates || predictedStates.length < 2) return;
    
    ctx.save();
    
    // 예측 궤적 그리기
    ctx.strokeStyle = '#00ffff'; // 시아노 색
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 점선으로 예측임을 표시
    ctx.beginPath();
    
    // 현재 위치에서 시작
    ctx.moveTo(vehicle.x, vehicle.y);
    
    // 예측된 위치들 연결
    for (let i = 0; i < predictedStates.length; i++) {
        const state = predictedStates[i];
        // 상대적 예측을 절대 좌표로 변환 (단순화)
        const predX = vehicle.x + state.x - predictedStates[0].x;
        const predY = vehicle.y + state.y - predictedStates[0].y;
        ctx.lineTo(predX, predY);
        
        // 예측 포인트 표시
        Utils.drawDebugPoint(ctx, predX, predY, '#00ffff', 2);
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // 점선 리셋
    ctx.restore();
}

// ===== 일시정지 메시지 렌더링 =====
function renderPauseMessage() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('시뮬레이션 준비 완료', centerX, centerY - 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('시작 버튼을 누르거나 스페이스바를 눌러주세요', centerX, centerY - 20);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('단축키: 스페이스바(시작/정지) | R(리셋) | D(디버그) | T(궤적) | C(궤적삭제)', centerX, centerY + 20);
}

// ===== FPS 계산 =====
function calculateFPS(currentTime) {
    SimulationState.frameCount++;
    
    if (currentTime - SimulationState.fpsTime >= 1000) {
        SimulationState.fps = SimulationState.frameCount;
        SimulationState.frameCount = 0;
        SimulationState.fpsTime = currentTime;
    }
}

// ===== UI 업데이트 함수들 =====
function updateButtonStates() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (SimulationState.isRunning) {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
    } else {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
    }
}

function updateInfoPanel() {
    document.getElementById('errorValue').textContent = SimulationState.currentError.toFixed(1);
    document.getElementById('controlOutput').textContent = SimulationState.controlOutput.toFixed(3);
    document.getElementById('vehicleSpeed').textContent = vehicle ? vehicle.speed.toFixed(0) : '0';
    document.getElementById('timeElapsed').textContent = SimulationState.time.toFixed(1);
    document.getElementById('fpsCounter').textContent = SimulationState.fps;
}

// ===== 새로운 메트릭 패널 업데이트 =====
function updateMetricsPanel() {
    if (!SimulationState.showMetrics || !performanceMetrics) return;
    
    const metrics = performanceMetrics.metrics;
    const score = performanceMetrics.getPerformanceScore();
    
    // 메트릭 값들 업데이트
    const updateMetricValue = (id, value, unit = '') => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = typeof value === 'number' ? value.toFixed(1) + unit : value;
        }
    };
    
    updateMetricValue('overshootValue', metrics.overshoot, '%');
    updateMetricValue('settlingTimeValue', metrics.settlingTime, 's');
    updateMetricValue('steadyStateErrorValue', metrics.steadyStateError, 'px');
    updateMetricValue('performanceScore', score, '/100');
    updateMetricValue('mseValue', Math.sqrt(metrics.meanSquaredError), '');
    updateMetricValue('iaeValue', metrics.integralAbsoluteError, '');
    
    // MPC 전용 정보 업데이트
    if (currentController.name === 'MPC' && currentController.getDiagnostics) {
        const mpcDiag = currentController.getDiagnostics();
        
        // MPC 추가 메트릭이 있다면 표시
        const mpcInfoElement = document.getElementById('mpcInfo');
        if (mpcInfoElement) {
            mpcInfoElement.innerHTML = `
                <small>
                    🧠 <strong>MPC 상태:</strong><br>
                    • 호라이즌: ${mpcDiag.horizonN}스텝<br>
                    • 계산시간: ${mpcDiag.computationTime.toFixed(1)}ms<br>
                    • 현재비용: ${mpcDiag.currentCost.toFixed(1)}<br>
                    • 예측정확도: ${mpcDiag.predictionAccuracy.toFixed(0)}%
                </small>
            `;
        }
    }
}

function updateParameterPanel(controllerType) {
    if (window.uiManager && window.uiManager.updateController) {
        window.uiManager.updateController(controllerType);
    }
}

function onControllerChange(e) {
    const selectedController = e.target.value;
    
    currentController = Controllers.createController(selectedController);
    window.currentController = currentController;
    
    // 제어기 변경 시 메트릭 리셋
    performanceMetrics.reset();
    trajectoryHistory.clear();
    
    updateParameterPanel(selectedController);
    
    console.log('🎛️ 제어기 변경:', currentController.name);
}

// ===== 파라미터 업데이트 =====
function updateControllerParameter(paramName, value) {
    if (currentController && currentController.setParameter) {
        currentController.setParameter(paramName, value);
        console.log(`📊 ${paramName} = ${value}`);
    }
}

// ===== 에러 핸들링 =====
window.addEventListener('error', (e) => {
    console.error('❌ 전역 에러 발생:', e.error);
    if (SimulationState.isRunning) {
        pauseSimulation();
    }
});

// ===== 초기화 실행 =====
document.addEventListener('DOMContentLoaded', init);

// ===== 전역 함수 노출 =====
window.SimulationState = SimulationState;
window.updateControllerParameter = updateControllerParameter;
window.resetSimulation = resetSimulation;
window.PerformanceMetrics = PerformanceMetrics;
window.TrajectoryHistory = TrajectoryHistory;

console.log('📁 Enhanced main.js 로드 완료 - 성능 메트릭 & 궤적 히스토리 추가됨');