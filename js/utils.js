/**
 * 유틸리티 함수들
 * 수학 계산, 벡터 연산, 기타 도우미 함수들
 */

// ===== 수학 유틸리티 =====

/**
 * 각도를 -π ~ π 범위로 정규화
 */
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/**
 * 도를 라디안으로 변환
 */
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * 라디안을 도로 변환
 */
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * 값을 min~max 범위로 제한
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 선형 보간
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ===== 벡터 계산 =====

/**
 * 두 점 사이의 거리 계산
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 점 사이의 각도 계산
 */
function angleBetweenPoints(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 벡터의 크기 계산
 */
function vectorMagnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * 벡터 정규화
 */
function normalizeVector(x, y) {
    const magnitude = vectorMagnitude(x, y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
        x: x / magnitude,
        y: y / magnitude
    };
}

/**
 * 벡터 내적
 */
function dotProduct(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}

/**
 * 벡터 외적 (2D에서는 스칼라 반환)
 */
function crossProduct(x1, y1, x2, y2) {
    return x1 * y2 - y1 * x2;
}

// ===== 기하학 유틸리티 =====

/**
 * 점이 선분에서 가장 가까운 점 찾기
 */
function closestPointOnLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
        return { x: x1, y: y1, t: 0 };
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    
    return {
        x: x1 + t * dx,
        y: y1 + t * dy,
        t: t
    };
}

/**
 * 점과 선분 사이의 최단 거리
 */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const closest = closestPointOnLineSegment(px, py, x1, y1, x2, y2);
    return distance(px, py, closest.x, closest.y);
}

// ===== 배열 유틸리티 =====

/**
 * 배열에서 최솟값을 가진 요소의 인덱스 찾기
 */
function findMinIndex(array, keyFunc = (x) => x) {
    if (array.length === 0) return -1;
    
    let minIndex = 0;
    let minValue = keyFunc(array[0]);
    
    for (let i = 1; i < array.length; i++) {
        const value = keyFunc(array[i]);
        if (value < minValue) {
            minValue = value;
            minIndex = i;
        }
    }
    
    return minIndex;
}

// ===== 색상 유틸리티 =====

/**
 * HSL을 RGB 헥스 문자열로 변환
 */
function hslToHex(h, s, l) {
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
    const m = lDecimal - c / 2;
    
    let r, g, b;
    
    if (hDecimal < 1/6) [r, g, b] = [c, x, 0];
    else if (hDecimal < 2/6) [r, g, b] = [x, c, 0];
    else if (hDecimal < 3/6) [r, g, b] = [0, c, x];
    else if (hDecimal < 4/6) [r, g, b] = [0, x, c];
    else if (hDecimal < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);
    
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

/**
 * 값에 따른 색상 그라데이션 생성 (빨강-노랑-초록)
 */
function valueToColor(value, min = -1, max = 1) {
    const normalizedValue = clamp((value - min) / (max - min), 0, 1);
    
    if (normalizedValue <= 0.5) {
        // 빨강에서 노랑으로
        const t = normalizedValue * 2;
        return hslToHex(t * 60, 100, 50);
    } else {
        // 노랑에서 초록으로
        const t = (normalizedValue - 0.5) * 2;
        return hslToHex(60 + t * 60, 100, 50);
    }
}

// ===== 성능 유틸리티 =====

/**
 * 함수 실행 시간 측정
 */
function measureTime(func, name = 'Function') {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`⏱️ ${name} 실행 시간: ${(end - start).toFixed(3)}ms`);
    return result;
}

/**
 * 쓰로틀링 (함수 호출 빈도 제한)
 */
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function(...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// ===== 디버깅 유틸리티 =====

/**
 * 객체를 보기 좋게 로그 출력
 */
function logObject(obj, name = 'Object') {
    console.group(`📋 ${name}`);
    for (const [key, value] of Object.entries(obj)) {
        console.log(`${key}:`, value);
    }
    console.groupEnd();
}

/**
 * Canvas에 디버그 정보 표시
 */
function drawDebugText(ctx, text, x, y, color = '#00ff00', fontSize = 12) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;
    ctx.fillText(text, x, y);
    ctx.restore();
}

/**
 * Canvas에 점 표시 (디버깅용)
 */
function drawDebugPoint(ctx, x, y, color = '#ff0000', radius = 3) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Canvas에 벡터 표시 (디버깅용)
 */
function drawDebugVector(ctx, startX, startY, endX, endY, color = '#00ff00', lineWidth = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 화살표 머리 그리기
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowLength * Math.cos(angle - arrowAngle),
        endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowLength * Math.cos(angle + arrowAngle),
        endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
    ctx.restore();
}

// ===== 전역 노출 =====
window.Utils = {
    // 수학
    normalizeAngle,
    degreesToRadians,
    radiansToDegrees,
    clamp,
    lerp,
    
    // 벡터
    distance,
    angleBetweenPoints,
    vectorMagnitude,
    normalizeVector,
    dotProduct,
    crossProduct,
    
    // 기하학
    closestPointOnLineSegment,
    distanceToLineSegment,
    
    // 배열
    findMinIndex,
    
    // 색상
    hslToHex,
    valueToColor,
    
    // 성능
    measureTime,
    throttle,
    
    // 디버깅
    logObject,
    drawDebugText,
    drawDebugPoint,
    drawDebugVector
};

console.log('🔧 utils.js 로드 완료');