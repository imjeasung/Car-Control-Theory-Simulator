// ===== vehicle.js (Enhanced for Standard Use) =====
/**
 * 차량 모델 (교육용 모드 제거 후 표준 버전)
 * 차량의 물리적 특성과 움직임 담당
 */

class Vehicle {
    constructor(x = 0, y = 0, angle = 0) {
        // 위치 및 방향
        this.x = x;
        this.y = y;
        this.angle = angle; // 라디안
        
        // 운동 상태
        this.speed = 50; // 픽셀/초
        this.steeringAngle = 0; // 조향각
        this.acceleration = 0;
        
        // 물리적 제한
        this.maxSteeringAngle = Math.PI / 2; // 90도
        this.maxAcceleration = 100;
        this.maxSpeed = 100;
        this.minSpeed = 0;
        
        // 시각적 속성
        this.width = 12;
        this.length = 20;
        this.color = '#ff4444';
        
        console.log('🚗 차량 모델 생성 - 최대 조향각:', Utils.radiansToDegrees(this.maxSteeringAngle), '도');
    }
    
    update(deltaTime) {
        // 속도 업데이트
        this.speed += this.acceleration * deltaTime;
        this.speed = Utils.clamp(this.speed, this.minSpeed, this.maxSpeed);
        
        // 위치 업데이트 (간단한 운동학 모델)
        this.x += this.speed * Math.cos(this.angle) * deltaTime;
        this.y += this.speed * Math.sin(this.angle) * deltaTime;
        
        // 방향 업데이트
        if (this.speed > 0) {
            // 기본 조향 효과 (교육용 민감도 제거)
            const steeringEffect = this.steeringAngle * this.speed * deltaTime * 0.03;
            this.angle += steeringEffect;
            this.angle = Utils.normalizeAngle(this.angle);
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        
        // 조향각에 따른 색상 변화 (교육용 피드백 단순화)
        const steeringRatio = Math.abs(this.steeringAngle) / this.maxSteeringAngle;
        if (steeringRatio > 0.7) {
            this.color = '#ff0000'; // 극한 조향 시 빨간색
        } else if (steeringRatio > 0.3) {
            this.color = '#ff8800'; // 중간 조향 시 주황색
        } else {
            this.color = '#ff4444'; // 정상 조향 시 기본 빨간색
        }
        
        // 차량 몸체 (삼각형)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.length / 2);
        ctx.lineTo(-this.width / 2, this.length / 2);
        ctx.lineTo(this.width / 2, this.length / 2);
        ctx.closePath();
        ctx.fill();
        
        // 윤곽선
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 조향 방향 표시 (조건 단순화)
        if (Math.abs(this.steeringAngle) > 0.1) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const indicatorLength = this.length * 0.8;
            const indicatorX = indicatorLength * Math.sin(this.steeringAngle);
            const indicatorY = -indicatorLength * Math.cos(this.steeringAngle);
            ctx.lineTo(indicatorX, indicatorY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    setSteeringAngle(angle) {
        // 조향각 제한 (교육용 극한 상황 제거)
        this.steeringAngle = Utils.clamp(angle, -this.maxSteeringAngle, this.maxSteeringAngle);
    }
    
    setAcceleration(accel) {
        this.acceleration = Utils.clamp(accel, -this.maxAcceleration, this.maxAcceleration);
    }
    
    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 50;
        this.steeringAngle = 0;
        this.acceleration = 0;
        this.color = '#ff4444'; // 색상 리셋
    }
    
    /**
     * 현재 조향각 상태 반환 (교육용 분석 단순화)
     */
    getSteeringStatus() {
        const angleDegrees = Utils.radiansToDegrees(this.steeringAngle);
        const ratio = Math.abs(this.steeringAngle) / this.maxSteeringAngle;
        
        let status = 'normal';
        if (ratio > 0.8) status = 'extreme';
        else if (ratio > 0.5) status = 'high';
        else if (ratio > 0.2) status = 'moderate';
        
        return {
            angle: this.steeringAngle,
            degrees: angleDegrees,
            ratio: ratio,
            status: status,
            color: this.color
        };
    }
}

window.Vehicle = Vehicle;
console.log('🚗 Enhanced vehicle.js 로드 완료 - 표준 차량 동작 지원');