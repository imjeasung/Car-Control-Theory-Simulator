// ===== ui.js (Enhanced Version) =====
/**
 * UI 이벤트 처리 및 동적 UI 생성 (확장 버전)
 * 
 * 새로 추가된 기능:
 * - 메트릭 패널 토글 지원
 * - 궤적 히스토리 토글 지원
 * - 향상된 UI 관리
 */

class UIManager {
    constructor() {
        this.currentController = null;
        this.parameterElements = {};
        this.metricsVisible = true;
        this.trajectoryVisible = true;
    }
    
    init() {
        this.setupParameterPanel();
        this.setupFeatureToggles();
        this.setupMetricsPanel();
        console.log('🎨 Enhanced UI 매니저 초기화 완료');
    }
    
    setupParameterPanel() {
        console.log('🎛️ 파라미터 패널 설정');
    }
    
    /**
     * 새로운 기능 토글 설정
     */
    setupFeatureToggles() {
        // 궤적 히스토리 토글
        const trajectoryToggle = document.getElementById('trajectoryToggle');
        if (trajectoryToggle) {
            trajectoryToggle.addEventListener('change', (e) => {
                this.trajectoryVisible = e.target.checked;
                if (window.trajectoryHistory) {
                    window.trajectoryHistory.isEnabled = e.target.checked;
                }
                if (window.SimulationState) {
                    window.SimulationState.showTrajectory = e.target.checked;
                }
                console.log('🛤️ 궤적 히스토리:', e.target.checked ? 'ON' : 'OFF');
            });
        }
        
        // 메트릭 패널 토글
        const metricsToggle = document.getElementById('metricsToggle');
        if (metricsToggle) {
            metricsToggle.addEventListener('change', (e) => {
                this.toggleMetricsPanel(e.target.checked);
            });
        }
        
        console.log('🎛️ 기능 토글 설정 완료');
    }
    
    /**
     * 메트릭 패널 설정
     */
    setupMetricsPanel() {
        const metricsPanel = document.getElementById('metricsPanel');
        if (metricsPanel) {
            // 초기 상태 설정
            this.updateMetricsPanelVisibility();
            
            // 메트릭 패널 클릭 시 애니메이션 효과
            metricsPanel.addEventListener('click', () => {
                metricsPanel.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    metricsPanel.style.transform = 'scale(1)';
                }, 150);
            });
        }
        
        console.log('📊 메트릭 패널 설정 완료');
    }
    
    /**
     * 메트릭 패널 표시/숨김 토글
     */
    toggleMetricsPanel(visible) {
        this.metricsVisible = visible;
        
        if (window.SimulationState) {
            window.SimulationState.showMetrics = visible;
        }
        
        this.updateMetricsPanelVisibility();
        console.log('📊 메트릭 패널:', visible ? 'ON' : 'OFF');
    }
    
    /**
     * 메트릭 패널 가시성 업데이트 (독립 패널 버전)
     */
    updateMetricsPanelVisibility() {
        const metricsPanel = document.getElementById('metricsPanel');
        if (metricsPanel) {
            if (this.metricsVisible) {
                metricsPanel.style.display = 'flex';
                metricsPanel.style.opacity = '0';
                metricsPanel.style.transform = 'translateX(20px)';
                
                // 애니메이션 효과
                setTimeout(() => {
                    metricsPanel.style.transition = 'all 0.3s ease';
                    metricsPanel.style.opacity = '1';
                    metricsPanel.style.transform = 'translateX(0)';
                }, 10);
            } else {
                metricsPanel.style.transition = 'all 0.3s ease';
                metricsPanel.style.opacity = '0';
                metricsPanel.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    metricsPanel.style.display = 'none';
                }, 300);
            }
        }
    }
    
    updateController(controllerType) {
        console.log('🔄 제어기 업데이트:', controllerType);
        
        const parametersDiv = document.getElementById('parameters');
        parametersDiv.innerHTML = this.generateParameterHTML(controllerType);
        
        // 새 제어기의 파라미터 슬라이더 이벤트 등록
        this.setupParameterEvents(controllerType);
        
        // 제어기 변경 시 메트릭 리셋 알림
        this.showControllerChangeNotification(controllerType);
    }
    
    /**
     * 제어기 변경 알림 표시
     */
    showControllerChangeNotification(controllerType) {
        const configs = {
            manual: '수동 제어',
            onoff: 'ON/OFF 제어',
            p: 'P 제어',
            pi: 'PI 제어',
            pd: 'PD 제어',
            pid: 'PID 제어'
        };
        
        const controllerName = configs[controllerType] || controllerType;
        
        // 간단한 토스트 알림 (필요시)
        console.log(`🎛️ ${controllerName}로 변경됨 - 메트릭 리셋됨`);
    }
    
    generateParameterHTML(controllerType) {
        const configs = {
            manual: {
                title: '🎮 수동 제어',
                description: '방향키(←→)로 직접 조작합니다. 성능 메트릭으로 수동 조작 실력을 확인해보세요!',
                parameters: []
            },
            onoff: {
                title: 'ON/OFF 제어 (방방 제어)',
                description: '임계값 기준으로 최대 조향합니다.',
                parameters: [
                    { name: 'threshold', label: '임계값 (Threshold)', 
                      min: 0.1, max: 10, step: 0.1, default: 5, unit: 'px' },
                    { name: 'steeringAngle', label: '조향각 (Steering)', 
                      min: 0.1, max: 2.0, step: 0.1, default: 0.5, unit: '' } // 🔧 추가
                ]
            },
            p: {
                title: 'P 제어 (비례 제어)',
                description: '오차에 비례하여 제어합니다. 빠른 응답이지만 정상상태 오차가 존재합니다.',
                parameters: [
                    { name: 'kp', label: 'Kp (비례 게인)', min: 0.001, max: 2.0, step: 0.01, default: 0.01, unit: '' }
                ]
            },
            pi: {
                title: 'PI 제어 (비례-적분 제어)',
                description: '정상상태 오차를 제거합니다. 완벽한 추종 성능이지만 오버슈트 가능성이 있습니다.',
                parameters: [
                    { name: 'kp', label: 'Kp (비례 게인)', min: 0.001, max: 2.0, step: 0.01, default: 0.01, unit: '' },
                    { name: 'ki', label: 'Ki (적분 게인)', min: 0.0001, max: 1.0, step: 0.001, default: 0.001, unit: '' }
                ]
            },
            pd: {
                title: 'PD 제어 (비례-미분 제어)',
                description: '오버슈트를 감소시킵니다. 빠르고 안정적이지만 정상상태 오차가 존재합니다.',
                parameters: [
                    { name: 'kp', label: 'Kp (비례 게인)', min: 0.001, max: 2.0, step: 0.01, default: 0.01, unit: '' },
                    { name: 'kd', label: 'Kd (미분 게인)', min: 0.0001, max: 2.0, step: 0.001, default: 0.001, unit: '' }
                ]
            },
            pid: {
                title: 'PID 제어 (비례-적분-미분 제어)',
                description: '종합적인 제어 성능을 제공합니다. 이론적으로 최고 성능이지만 적절한 튜닝이 필요합니다.',
                parameters: [
                    { name: 'kp', label: 'Kp (비례 게인)', min: 0.001, max: 2.0, step: 0.01, default: 0.01, unit: '' },
                    { name: 'ki', label: 'Ki (적분 게인)', min: 0.0001, max: 1.0, step: 0.001, default: 0.001, unit: '' },
                    { name: 'kd', label: 'Kd (미분 게인)', min: 0.0001, max: 2.0, step: 0.001, default: 0.001, unit: '' }
                ]
            },
            mpc: {
                title: 'MPC 제어 (모델 예측 제어)',
                description: '미래를 예측하여 최적의 제어를 계산합니다. 고급 제어 기법으로 제약 조건과 예측 모델을 활용합니다.',
                parameters: [
                    { name: 'horizonN', label: 'N (예측 호라이즌)', min: 3, max: 20, step: 1, default: 10, unit: '스텝' },
                    { name: 'weightQ', label: 'Q (오차 가중치)', min: 0.1, max: 20.0, step: 0.1, default: 10.0, unit: '' },
                    { name: 'weightR', label: 'R (제어 가중치)', min: 0.01, max: 1.0, step: 0.01, default: 1.0, unit: '' },
                    { name: 'predictionDt', label: 'dt (예측 간격)', min: 0.05, max: 0.5, step: 0.05, default: 0.1, unit: '초' }
                ]
            }
        };
        
        const config = configs[controllerType] || configs.manual;
        
        let html = `
            <h3>📊 ${config.title}</h3>
            <p class="description" style="font-size: 0.85rem; color: #666; margin-bottom: 1rem; line-height: 1.4;">
                ${config.description}
            </p>
        `;
        
        if (config.parameters.length > 0) {
            html += '<div class="parameter-controls">';
            
            config.parameters.forEach(param => {
                html += `
                    <div class="parameter-item">
                        <div class="parameter-label">
                            <span>${param.label}</span>
                            <span class="parameter-value" id="${param.name}-value">${param.default}${param.unit}</span>
                        </div>
                        <input type="range" 
                               id="${param.name}-slider" 
                               min="${param.min}" 
                               max="${param.max}" 
                               step="${param.step}" 
                               value="${param.default}"
                               data-param="${param.name}"
                               data-unit="${param.unit}">
                    </div>
                `;
            });
            
            html += '</div>';
            
            // 향상된 성능 튜닝 팁 추가
            html += `
                <div class="tuning-tips" style="margin-top: 1rem; padding: 0.8rem; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <small style="color: #856404;">
                        <strong>💡 튜닝 팁:</strong> 
                        ${this.getTuningTips(controllerType)}
                    </small>
                </div>
            `;
            
            // 교육용 경고 메시지 추가
            html += `
                <div class="educational-warning" style="margin-top: 0.8rem; padding: 0.8rem; background: #f8d7da; border-radius: 6px; border-left: 4px solid #dc3545;">
                    <small style="color: #721c24;">
                        <strong>⚠️ 교육용 확장 범위:</strong> 
                        높은 게인 값(Kp>5)은 극도로 불안정한 동작을 유발할 수 있습니다. 
                        제어 이론의 불안정성을 학습하는 용도로 사용하세요.
                    </small>
                </div>
            `;
        } else {
            html += '<p style="color: #999; font-style: italic;">조정 가능한 파라미터가 없습니다. 성능 메트릭으로 수동 조작 실력을 확인해보세요!</p>';
        }
        
        return html;
    }
    
    /**
     * 제어기별 튜닝 팁 제공 (확장 버전)
     */
    getTuningTips(controllerType) {
        const tips = {
            onoff: '임계값을 줄이면 민감해지지만 진동이 증가합니다.',
            p: 'Kp를 늘리면 빠른 응답을 얻지만 진동이 생깁니다. Kp>5는 매우 불안정해집니다!',
            pi: 'Ki를 조심스럽게 증가시켜 정상상태 오차를 제거하세요. Kp가 높으면 Ki는 낮게 유지하세요.',
            pd: 'Kd는 진동을 억제하지만 너무 크면 노이즈에 민감해집니다. 높은 Kp에서 Kd로 안정화하세요.',
            pid: 'Kp → Kd → Ki 순서로 튜닝하는 것이 일반적입니다. 극한 값에서의 불안정성을 관찰해보세요.',
            mpc: 'N을 늘리면 더 정확하지만 계산량 증가. Q↑=정확도 중시, R↑=부드러운 제어. dt는 예측 정밀도를 조절합니다.'
        };
        
        return tips[controllerType] || '다양한 값을 시도해보며 최적의 성능을 찾아보세요.';
    }
    
    setupParameterEvents(controllerType) {
        const sliders = document.querySelectorAll('#parameters input[type="range"]');
        
        sliders.forEach(slider => {
            // 실시간 업데이트 이벤트
            slider.addEventListener('input', (e) => {
                this.handleParameterChange(e);
            });
            
            // 마우스 업 시 최종 업데이트
            slider.addEventListener('mouseup', (e) => {
                this.handleParameterChange(e, true);
            });
        });
    }
    
    /**
     * 파라미터 변경 처리 (향상된 버전)
     */
    handleParameterChange(e, isFinal = false) {
        const paramName = e.target.dataset.param;
        const unit = e.target.dataset.unit || '';
        const value = parseFloat(e.target.value);
        
        // 값 표시 업데이트
        const valueDisplay = document.getElementById(`${paramName}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = `${value}${unit}`;
            
            // 변경 시 하이라이트 효과
            if (isFinal) {
                valueDisplay.style.color = '#10b981';
                valueDisplay.style.fontWeight = 'bold';
                setTimeout(() => {
                    valueDisplay.style.color = '#4f46e5';
                    valueDisplay.style.fontWeight = '600';
                }, 200);
            }
        }
        
        // 제어기에 파라미터 실제 적용
        if (window.updateControllerParameter) {
            window.updateControllerParameter(paramName, value);
        }
        
        // 파라미터 변경 시 성능 메트릭 부분 리셋 (최종 변경 시에만)
        if (isFinal && window.performanceMetrics) {
            // 완전 리셋이 아닌 부분 리셋 (기존 데이터는 유지하되 새로운 측정 시작)
            console.log(`📊 ${paramName} 파라미터 최종 변경: ${value}${unit}`);
        }
    }
    
    /**
     * 메트릭 패널 실시간 업데이트 지원
     */
    updateMetricsDisplay(metrics) {
        if (!this.metricsVisible) return;
        
        const updateElement = (id, value, formatter = (v) => v.toFixed(1)) => {
            const element = document.getElementById(id);
            if (element) {
                const newValue = typeof formatter === 'function' ? formatter(value) : value;
                
                // 값이 변경되었을 때만 애니메이션 효과
                if (element.textContent !== newValue) {
                    element.style.transition = 'color 0.3s ease';
                    element.style.color = '#ffd700';
                    element.textContent = newValue;
                    
                    setTimeout(() => {
                        element.style.color = '#fff';
                    }, 300);
                }
            }
        };
        
        if (metrics) {
            updateElement('overshootValue', metrics.overshoot, v => v.toFixed(1) + '%');
            updateElement('settlingTimeValue', metrics.settlingTime, v => v.toFixed(1) + 's');
            updateElement('steadyStateErrorValue', metrics.steadyStateError, v => v.toFixed(1) + 'px');
            updateElement('mseValue', Math.sqrt(metrics.meanSquaredError), v => v.toFixed(2));
            updateElement('iaeValue', metrics.integralAbsoluteError, v => v.toFixed(1));
        }
    }
    
    /**
     * 성능 점수 업데이트 (특별 처리)
     */
    updatePerformanceScore(score) {
        if (!this.metricsVisible) return;
        
        const scoreElement = document.getElementById('performanceScore');
        if (scoreElement) {
            const newValue = `${score}/100`;
            
            if (scoreElement.textContent !== newValue) {
                scoreElement.textContent = newValue;
                
                // 점수에 따른 색상 변경
                let color = '#ffd700'; // 기본 금색
                if (score >= 80) {
                    color = '#10b981'; // 초록색 (우수)
                } else if (score >= 60) {
                    color = '#f59e0b'; // 주황색 (보통)
                } else {
                    color = '#ef4444'; // 빨간색 (개선 필요)
                }
                
                scoreElement.style.background = `linear-gradient(45deg, ${color}, #fff)`;
                scoreElement.style.webkitBackgroundClip = 'text';
                scoreElement.style.webkitTextFillColor = 'transparent';
                scoreElement.style.backgroundClip = 'text';
            }
        }
    }
}

// 전역 UI 매니저 인스턴스
window.uiManager = new UIManager();

// DOM 로드 후 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (window.uiManager) {
        window.uiManager.init();
    }
});

console.log('🎨 Enhanced ui.js 로드 완료 - 메트릭 & 궤적 토글 지원');