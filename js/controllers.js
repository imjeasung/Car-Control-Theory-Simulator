// ===== controllers.js (Standard Version - Complete MPC) =====
/**
 * 제어 알고리즘들 (교육용 제거 후 표준 버전)
 * 다양한 제어기 구현
 * 
 * 🔧 수정사항: 교육용 관련 코드 제거, 완전한 MPC 유지
 */

// 기본 제어기 클래스
class Controller {
    constructor(name) {
        this.name = name;
        this.isActive = false;
        this.parameters = {};
    }
    
    compute(error, deltaTime) {
        return 0; // 기본 구현
    }
    
    reset() {
        // 제어기 상태 초기화
    }
    
    setParameter(name, value) {
        this.parameters[name] = value;
    }
}

// ===== MPC Controller Implementation =====
/**
 * Model Predictive Control (모델 예측 제어)
 * 표준 버전 - 기본 개념에 초점
 * 🔧 수정: 교육용 진단 제거, 안전한 에러 처리 유지
 */
class MPCController extends Controller {
    constructor(horizonN = 10, weightQ = 10.0, weightR = 1.0, predictionDt = 0.1) {
        super('MPC');
        
        // MPC 파라미터
        this.parameters.horizonN = horizonN;
        this.parameters.weightQ = weightQ;
        this.parameters.weightR = weightR;
        this.parameters.predictionDt = predictionDt;
        
        // 예측 모델 (단순 차량 운동학)
        this.vehicleModel = {
            speed: 50,
            maxSteeringAngle: Math.PI / 2,
            steeringMultiplier: 0.02
        };
        
        // MPC 상태 변수
        this.predictedStates = [];
        this.controlSequence = [];
        this.costHistory = [];
        
        // 트랙 참조 저장
        this.trackReference = null;
        
        console.log('🧠 MPC 제어기 생성 완료:', {
            horizon: horizonN,
            weightQ: weightQ,
            weightR: weightR,
            predictionDt: predictionDt
        });
    }
    
    /**
     * 파라미터 업데이트 메서드 오버라이드
     */
    setParameter(name, value) {
        super.setParameter(name, value);
        
        // 파라미터 변경 시 상태 초기화
        if (['horizonN', 'weightQ', 'weightR', 'predictionDt'].includes(name)) {
            this.predictedStates = [];
            this.controlSequence = [];
        }
    }
    
    /**
     * MPC 메인 제어 함수
     */
    compute(error, deltaTime, vehicleState = null) {
        try {
            const startTime = performance.now();
            
            // 트랙 참조 저장
            if (typeof window !== 'undefined' && window.track && !this.trackReference) {
                this.trackReference = window.track;
            }
            
            // 1. 현재 상태 추정
            const currentState = this.estimateCurrentState(error, vehicleState);
            
            // 2. 미래 궤적 예측
            const referenceTrajectory = this.generateReferenceTrajectory(currentState);
            
            // 3. 최적 제어 시퀀스 계산
            const optimalControls = this.optimizeControlSequence(currentState, referenceTrajectory, error);
            
            // 4. 첫 번째 제어 입력 적용
            const controlOutput = optimalControls.length > 0 ? optimalControls[0] : 0;
            
            // 5. 예측 데이터 저장
            this.savePredictionData(currentState, referenceTrajectory, optimalControls);
            
            return controlOutput;
            
        } catch (error) {
            console.error('🚨 MPC 계산 에러:', error);
            return 0; // 안전한 기본값
        }
    }
    
    /**
     * 현재 상태 추정
     */
    estimateCurrentState(error, vehicleState) {
        if (vehicleState) {
            return {
                x: vehicleState.x,
                y: vehicleState.y,
                angle: vehicleState.angle,
                speed: vehicleState.speed || this.vehicleModel.speed,
                error: error
            };
        }
        
        return {
            x: 0,
            y: error,
            angle: 0,
            speed: this.vehicleModel.speed,
            error: error
        };
    }
    
    /**
     * 참조 궤적 생성
     */
    generateReferenceTrajectory(currentState) {
        const trajectory = [];
        const N = this.parameters.horizonN;
        const dt = this.parameters.predictionDt;
        
        for (let i = 0; i < N; i++) {
            const futureTime = i * dt;
            const referenceError = 0; // 목표는 항상 중앙선
            
            trajectory.push({
                time: futureTime,
                x: currentState.x + this.vehicleModel.speed * Math.cos(0) * futureTime,
                y: referenceError,
                angle: 0,
                error: referenceError
            });
        }
        
        return trajectory;
    }
    
    /**
     * 최적 제어 시퀀스 계산
     */
    optimizeControlSequence(currentState, referenceTrajectory, currentError) {
        const N = this.parameters.horizonN;
        let bestControls = new Array(N).fill(0);
        let bestCost = Infinity;
        
        try {
            // Q, R 기반 동적 제어 후보 생성
            const controlCandidates = this.generateControlCandidates(currentError);
            
            for (const controlSequence of controlCandidates) {
                const cost = this.evaluateCostFunction(currentState, referenceTrajectory, controlSequence);
                
                if (cost < bestCost) {
                    bestCost = cost;
                    bestControls = [...controlSequence];
                }
            }
            
            this.costHistory.push(bestCost);
            this.controlSequence = bestControls;
            
        } catch (error) {
            console.error('🚨 MPC 최적화 에러:', error);
        }
        
        return bestControls;
    }
    
    /**
     * Q, R 기반 동적 제어 후보 생성
     */
    generateControlCandidates(currentError = 0) {
        const candidates = [];
        const N = this.parameters.horizonN;
        const Q = this.parameters.weightQ;
        const R = this.parameters.weightR;
        
        // Q/R 비율에 따른 제어 특성 결정
        const qrRatio = Q / R;
        
        const errorMagnitude = Math.abs(currentError);
        const errorSign = Math.sign(currentError);
        const controlDirection = -errorSign;
        
        // Q/R 비율에 따른 기본 제어 강도 조절
        let baseControl;
        if (qrRatio > 50) {
            baseControl = Math.min(2.0, errorMagnitude / 20.0);
        } else if (qrRatio > 10) {
            baseControl = Math.min(1.5, errorMagnitude / 30.0);
        } else if (qrRatio > 1) {
            baseControl = Math.min(1.0, errorMagnitude / 50.0);
        } else if (qrRatio > 0.1) {
            baseControl = Math.min(0.5, errorMagnitude / 70.0);
        } else {
            baseControl = Math.min(0.2, errorMagnitude / 100.0);
        }
        
        // Q/R 비율에 따른 제어 패턴 다양성
        const controlStrengths = qrRatio > 10 
            ? [0.5, 1.0, 1.5, 2.0]     // 적극적
            : qrRatio > 1
            ? [0.2, 0.5, 1.0, 1.5]     // 보통
            : [0.1, 0.2, 0.5, 1.0];    // 부드러움
        
        // 기본 패턴: 직진
        candidates.push(new Array(N).fill(0));
        
        // Q/R 기반 적응적 제어 패턴 생성
        for (const strength of controlStrengths) {
            const controlValue = controlDirection * baseControl * strength;
            
            if (qrRatio > 10) {
                // 높은 Q: 즉시 강력한 제어
                candidates.push(new Array(N).fill(controlValue));
                
                const aggressivePattern = [];
                for (let i = 0; i < N; i++) {
                    const factor = i < N/4 ? 1.5 : 0.8;
                    aggressivePattern.push(controlValue * factor);
                }
                candidates.push(aggressivePattern);
                
            } else if (qrRatio < 1) {
                // 높은 R: 점진적이고 부드러운 제어
                const gentlePattern = [];
                for (let i = 0; i < N; i++) {
                    const factor = Math.min(1.0, (i + 1) / (N * 0.7));
                    gentlePattern.push(controlValue * factor);
                }
                candidates.push(gentlePattern);
                
            } else {
                // 균형잡힌 제어
                candidates.push(new Array(N).fill(controlValue));
                
                const balancedPattern = [];
                for (let i = 0; i < N; i++) {
                    const factor = i < N/3 ? 1.0 : 0.6;
                    balancedPattern.push(controlValue * factor);
                }
                candidates.push(balancedPattern);
            }
        }
        
        return candidates;
    }
    
    /**
     * 비용 함수 계산
     */
    evaluateCostFunction(currentState, referenceTrajectory, controlSequence) {
        let totalCost = 0;
        let state = { ...currentState };
        
        const Q = this.parameters.weightQ;
        const R = this.parameters.weightR;
        const dt = this.parameters.predictionDt;
        
        for (let i = 0; i < controlSequence.length; i++) {
            const control = controlSequence[i];
            const reference = referenceTrajectory[i];
            
            // 다음 상태 예측
            state = this.predictNextState(state, control, dt);
            
            // 비용 계산
            const trackingError = Math.pow(state.error - reference.error, 2);
            const controlEffort = Math.pow(control, 2);
            
            totalCost += Q * trackingError + R * controlEffort;
        }
        
        return totalCost;
    }
    
    /**
     * 다음 상태 예측
     */
    predictNextState(state, steeringInput, dt) {
        const speed = this.vehicleModel.speed;
        const steeringMultiplier = this.vehicleModel.steeringMultiplier;
        
        // 안전한 Utils 사용
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const normalizeAngle = (angle) => {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
        };
        
        // 조향각 제한 적용
        const steeringAngle = clamp(steeringInput, 
                                  -this.vehicleModel.maxSteeringAngle, 
                                   this.vehicleModel.maxSteeringAngle);
        
        // 단순 운동학 모델
        const newAngle = state.angle + steeringAngle * speed * dt * steeringMultiplier;
        const newX = state.x + speed * Math.cos(newAngle) * dt;
        const newY = state.y + speed * Math.sin(newAngle) * dt;
        
        // 실제 트랙 오차 계산
        let newError = 0;
        try {
            if (this.trackReference && this.trackReference.calculateError) {
                newError = this.trackReference.calculateError(newX, newY);
            } else {
                // 폴백: 원형 트랙 가정
                const centerX = 360;
                const centerY = 270;
                const targetRadius = 135;
                const distFromCenter = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);
                newError = distFromCenter - targetRadius;
            }
        } catch (error) {
            // 안전한 폴백
            newError = newY;
        }
        
        return {
            x: newX,
            y: newY,
            angle: normalizeAngle(newAngle),
            speed: speed,
            error: newError
        };
    }
    
    /**
     * 예측 데이터 저장
     */
    savePredictionData(currentState, referenceTrajectory, optimalControls) {
        this.predictedStates = [];
        let state = { ...currentState };
        
        for (let i = 0; i < optimalControls.length; i++) {
            state = this.predictNextState(state, optimalControls[i], this.parameters.predictionDt);
            this.predictedStates.push({ ...state, control: optimalControls[i] });
        }
    }
    
    /**
     * MPC 상태 리셋
     */
    reset() {
        this.predictedStates = [];
        this.controlSequence = [];
        this.costHistory = [];
        
        console.log('🔄 MPC 제어기 리셋 완료');
    }
    
    /**
     * MPC 진단 정보 반환
     */
    getDiagnostics() {
        return {
            horizonN: this.parameters.horizonN,
            currentCost: this.costHistory.length > 0 ? this.costHistory[this.costHistory.length - 1] : 0,
            predictedStates: this.predictedStates.slice(0, 5),
            controlSequence: this.controlSequence.slice(0, 5),
            parameters: { ...this.parameters }
        };
    }
}

// 수동 제어기
class ManualController extends Controller {
    constructor() {
        super('Manual');
    }
    
    compute(error, deltaTime) {
        return 0; // 수동 제어 시에는 사용자 입력 사용
    }
}

// ON/OFF 제어기
class OnOffController extends Controller {
    constructor(threshold = 20) {
        super('ON/OFF');
        this.parameters.threshold = threshold;
    }
    
    compute(error, deltaTime) {
        const threshold = this.parameters.threshold;
        
        if (error > threshold) {
            return -0.5; // 왼쪽으로 조향
        } else if (error < -threshold) {
            return 0.5;  // 오른쪽으로 조향
        } else {
            return 0;    // 직진
        }
    }
}

// P 제어기
class PController extends Controller {
    constructor(kp = 0.01) {
        super('P');
        this.parameters.kp = kp;
        this.lastError = 0;
    }
    
    compute(error, deltaTime) {
        this.lastError = error;
        
        return -this.parameters.kp * error;
    }
    
    reset() {
        this.lastError = 0;
    }
}

// PI 제어기
class PIController extends Controller {
    constructor(kp = 0.01, ki = 0.001) {
        super('PI');
        this.parameters.kp = kp;
        this.parameters.ki = ki;
        this.integral = 0;
        this.maxIntegral = 1000;
    }
    
    compute(error, deltaTime) {
        // 적분항 계산
        this.integral += error * deltaTime;
        this.integral = Math.min(Math.max(this.integral, -this.maxIntegral), this.maxIntegral);
        
        const proportional = -this.parameters.kp * error;
        const integral = -this.parameters.ki * this.integral;
        
        return proportional + integral;
    }
    
    reset() {
        this.integral = 0;
    }
}

// PD 제어기
class PDController extends Controller {
    constructor(kp = 0.01, kd = 0.001) {
        super('PD');
        this.parameters.kp = kp;
        this.parameters.kd = kd;
        this.previousError = 0;
    }
    
    compute(error, deltaTime) {
        const proportional = -this.parameters.kp * error;
        const derivative = -this.parameters.kd * (error - this.previousError) / deltaTime;
        
        this.previousError = error;
        
        return proportional + derivative;
    }
    
    reset() {
        this.previousError = 0;
    }
}

// PID 제어기
class PIDController extends Controller {
    constructor(kp = 0.01, ki = 0.001, kd = 0.001) {
        super('PID');
        this.parameters.kp = kp;
        this.parameters.ki = ki;
        this.parameters.kd = kd;
        this.integral = 0;
        this.previousError = 0;
        this.maxIntegral = 1000;
    }
    
    compute(error, deltaTime) {
        // 비례항
        const proportional = -this.parameters.kp * error;
        
        // 적분항
        this.integral += error * deltaTime;
        this.integral = Math.min(Math.max(this.integral, -this.maxIntegral), this.maxIntegral);
        const integral = -this.parameters.ki * this.integral;
        
        // 미분항
        const derivative = -this.parameters.kd * (error - this.previousError) / deltaTime;
        this.previousError = error;
        
        return proportional + integral + derivative;
    }
    
    reset() {
        this.integral = 0;
        this.previousError = 0;
    }
}

// ===== 단일 제어기 팩토리 함수 =====
/**
 * 모든 제어기 타입을 처리하는 통합 팩토리 함수
 */
function createController(type, params = {}) {
    let controller;
    
    switch (type) {
        case 'manual':
            controller = new ManualController();
            break;
        case 'onoff':
            controller = new OnOffController(params.threshold);
            break;
        case 'p':
            controller = new PController(params.kp);
            break;
        case 'pi':
            controller = new PIController(params.kp, params.ki);
            break;
        case 'pd':
            controller = new PDController(params.kp, params.kd);
            break;
        case 'pid':
            controller = new PIDController(params.kp, params.ki, params.kd);
            break;
        case 'mpc':
            controller = new MPCController(
                params.horizonN || 10,
                params.weightQ || 10.0,
                params.weightR || 1.0,
                params.predictionDt || 0.1
            );
            break;
        default:
            console.warn('알 수 없는 제어기 타입:', type);
            controller = new ManualController();
    }
    
    console.log(`🎛️ 제어기 생성: ${controller.name}`);
    return controller;
}

// ===== 전역 객체 등록 =====
window.Controllers = {
    Controller,
    ManualController,
    OnOffController,
    PController,
    PIController,
    PDController,
    PIDController,
    MPCController,
    createController
};

console.log('🎛️ ✅ controllers.js 로드 완료 - 표준 제어기 지원');