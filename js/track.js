// ===== track.js (Modified for Larger Oval Track) =====

class Track {
    constructor(data) {
        this.centerLine = data.centerLine || [];
        this.innerBoundary = data.innerBoundary || [];
        this.outerBoundary = data.outerBoundary || [];
        this.startPoint = data.startPoint || { x: 0, y: 0, angle: 0 };
        this.name = data.name || 'Default Track';
        this.trackWidth = data.trackWidth || 40;
    }
    
    render(ctx) {
        if (this.centerLine.length < 2) return;
        
        // 트랙 외곽선 그리기
        this.drawBoundary(ctx, this.outerBoundary, '#444', 3);
        this.drawBoundary(ctx, this.innerBoundary, '#444', 3);
        
        // 트랙 중앙선 그리기 (점선)
        this.drawCenterLine(ctx);
        
        // 시작점 표시
        this.drawStartPoint(ctx);
    }
    
    drawBoundary(ctx, boundary, color, lineWidth) {
        if (boundary.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        
        const firstPoint = boundary[0];
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < boundary.length; i++) {
            const point = boundary[i];
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    
    drawCenterLine(ctx) {
        if (this.centerLine.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        
        const firstPoint = this.centerLine[0];
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < this.centerLine.length; i++) {
            const point = this.centerLine[i];
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    
    drawStartPoint(ctx) {
        const start = this.startPoint;
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // START 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('START', start.x, start.y + 3);
        ctx.restore();
    }
    
    calculateError(vehicleX, vehicleY) {
        if (this.centerLine.length < 2) return 0;
        
        let minDistance = Infinity;
        let closestIndex = 0;
        let closestPoint = null;
        
        // 가장 가까운 트랙 포인트 찾기
        for (let i = 0; i < this.centerLine.length; i++) {
            const point = this.centerLine[i];
            const distance = this.distance(vehicleX, vehicleY, point.x, point.y);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
                closestPoint = point;
            }
        }
        
        if (!closestPoint) return 0;
        
        // 다음 포인트로 트랙 방향 계산
        const nextIndex = (closestIndex + 1) % this.centerLine.length;
        const nextPoint = this.centerLine[nextIndex];
        
        // 트랙 방향 벡터
        const trackDx = nextPoint.x - closestPoint.x;
        const trackDy = nextPoint.y - closestPoint.y;
        
        // 차량까지의 벡터
        const vehicleDx = vehicleX - closestPoint.x;
        const vehicleDy = vehicleY - closestPoint.y;
        
        // 외적을 이용한 좌/우 판정
        const crossProduct = this.crossProduct(trackDx, trackDy, vehicleDx, vehicleDy);
        
        // 부호가 있는 오차 (양수: 오른쪽, 음수: 왼쪽)
        return crossProduct > 0 ? minDistance : -minDistance;
    }
    
    getClosestTrackPoint(vehicleX, vehicleY) {
        if (this.centerLine.length === 0) return null;
        
        let minDistance = Infinity;
        let closestPoint = null;
        let closestIndex = 0;
        
        for (let i = 0; i < this.centerLine.length; i++) {
            const point = this.centerLine[i];
            const distance = this.distance(vehicleX, vehicleY, point.x, point.y);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
                closestIndex = i;
            }
        }
        
        return {
            point: closestPoint,
            index: closestIndex,
            distance: minDistance
        };
    }
    
    // 유틸리티 함수들
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    crossProduct(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }
}

// ===== 기존 함수들 (호환성 유지) =====
function createOvalTrack(centerX, centerY, radiusX, radiusY, points = 60) {
    const centerLine = [];
    const innerBoundary = [];
    const outerBoundary = [];
    const trackWidth = 40;
    
    // 1.5배로 크기 조정
    radiusX = radiusX * 1.5;
    radiusY = radiusY * 1.5;
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        centerLine.push({ x, y });
        
        const innerX = centerX + Math.cos(angle) * (radiusX - trackWidth / 2);
        const innerY = centerY + Math.sin(angle) * (radiusY - trackWidth / 2);
        innerBoundary.push({ x: innerX, y: innerY });
        
        const outerX = centerX + Math.cos(angle) * (radiusX + trackWidth / 2);
        const outerY = centerY + Math.sin(angle) * (radiusY + trackWidth / 2);
        outerBoundary.push({ x: outerX, y: outerY });
    }
    
    return {
        name: 'F1 Oval Track (1.5x Larger)',
        centerLine,
        innerBoundary,
        outerBoundary,
        startPoint: { x: centerX + radiusX, y: centerY, angle: Math.PI / 2 },
        trackWidth
    };
}

const DEFAULT_TRACK_DATA = createOvalTrack(360, 270, 160, 110);

function changeTrackAndReset(newTrackData) {
    try {
        console.log(`🔄 트랙 교체: ${newTrackData.name}`);
        
        if (typeof SimulationState !== 'undefined' && SimulationState.isRunning) {
            if (typeof pauseSimulation === 'function') pauseSimulation();
        }
        
        const newTrack = new Track(newTrackData);
        window.track = newTrack;
        if (typeof track !== 'undefined') track = newTrack;
        
        const startPoint = newTrackData.startPoint;
        if (typeof vehicle !== 'undefined' && vehicle.reset) {
            vehicle.reset(startPoint.x, startPoint.y, startPoint.angle);
        }
        
        if (typeof currentController !== 'undefined' && currentController && currentController.reset) {
            currentController.reset();
        }
        
        if (typeof performanceMetrics !== 'undefined' && performanceMetrics && performanceMetrics.reset) {
            performanceMetrics.reset();
        }
        
        if (typeof trajectoryHistory !== 'undefined' && trajectoryHistory && trajectoryHistory.clear) {
            trajectoryHistory.clear();
        }
        
        if (typeof resetSimulation === 'function') resetSimulation();
        if (typeof render === 'function') setTimeout(() => render(), 100);
        
        console.log(`✅ 트랙 교체 완료: ${newTrackData.name}`);
        return true;
        
    } catch (error) {
        console.error('❌ 트랙 교체 실패:', error);
        return false;
    }
}

// ===== 테스트 함수들 =====
function testTrackConnectivity(trackData) {
    console.log(`🧪 ${trackData.name} 연결성 테스트...`);
    
    const points = trackData.centerLine;
    let maxGap = 0;
    let totalGaps = 0;
    let problemCount = 0;
    
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const gap = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
        
        if (gap > 10) {
            console.warn(`❌ 큰 간격: ${i-1}→${i}, 거리: ${gap.toFixed(3)}px`);
            problemCount++;
        }
        
        maxGap = Math.max(maxGap, gap);
        totalGaps += gap;
    }
    
    const avgGap = totalGaps / (points.length - 1);
    console.log(`📊 연결성 결과:`);
    console.log(`   평균 간격: ${avgGap.toFixed(3)}px`);
    console.log(`   최대 간격: ${maxGap.toFixed(3)}px`);
    console.log(`   문제 개수: ${problemCount}개`);
    console.log(`   상태: ${maxGap < 6 ? '✅ 완벽' : maxGap < 10 ? '⚠️ 양호' : '❌ 문제'}`);
    
    return maxGap < 10;
}

function applyPerfectTrack(trackData) {
    const isConnected = testTrackConnectivity(trackData);
    
    if (isConnected) {
        console.log(`✅ 연결성 검증 통과! ${trackData.name} 적용`);
        changeTrackAndReset(trackData);
        return true;
    } else {
        console.error(`❌ 연결성 문제! ${trackData.name} 적용 취소`);
        return false;
    }
}

function runPerfectTrackTest() {
    console.log('🚀 완벽한 트랙 테스트 시작...');
    
    setTimeout(() => {
        console.log('1️⃣ 기본 타원형 트랙 (1.5x 크기)');
        applyPerfectTrack(DEFAULT_TRACK_DATA);
    }, 1000);
}

// ===== 전역 노출 =====
window.Track = Track;
window.DEFAULT_TRACK_DATA = DEFAULT_TRACK_DATA;
window.createOvalTrack = createOvalTrack;
window.changeTrackAndReset = changeTrackAndReset;
window.testTrackConnectivity = testTrackConnectivity;
window.applyPerfectTrack = applyPerfectTrack;
window.runPerfectTrackTest = runPerfectTrackTest;

console.log('🔥 ✅ 수정된 타원형 트랙 시스템 로드!');
console.log('🎯 사용법:');
console.log('- applyPerfectTrack(DEFAULT_TRACK_DATA)');
console.log('- runPerfectTrackTest() // 기본 타원형 트랙 테스트');