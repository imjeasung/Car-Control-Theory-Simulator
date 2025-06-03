# 🏎️ 차량 제어 시뮬레이터

<div align="center">

![Car Control Simulator](https://img.shields.io/badge/F1-Control%20Simulator-red?style=for-the-badge&logo=formula1)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Canvas](https://img.shields.io/badge/HTML5%20Canvas-orange?style=for-the-badge&logo=html5&logoColor=white)

**제어 이론을 시각적으로 학습할 수 있는 교육용 웹 시뮬레이터**

[🚀 **라이브 데모**](https://imjeasung.github.io/Car-Control-Theory-Simulator) | [📖 사용법](#-사용법) | [🎓 교육적 가치](#-교육적-가치)

</div>

---

## 🌟 주요 기능

### 🎛️ **다양한 제어 알고리즘 지원**
- **수동 제어**: 방향키로 직접 조작
- **ON/OFF 제어**: 임계값 기반 방방 제어
- **P 제어**: 비례 제어 (빠른 응답, 정상상태 오차 존재)
- **PI 제어**: 비례-적분 제어 (정상상태 오차 제거)
- **PD 제어**: 비례-미분 제어 (오버슈트 감소)
- **PID 제어**: 비례-적분-미분 제어 (종합적 성능)
- **MPC 제어**: 모델 예측 제어 (고급 제어 기법)

### 📊 **실시간 성능 메트릭**
- **종합 성능 점수** (0-100점)
- **오버슈트** 분석
- **정착시간** 측정
- **정상상태 오차** 계산
- **RMS 오차** 및 **IAE** 분석

### 🛤️ **시각적 분석 도구**
- **궤적 히스토리** 추적
- **실시간 오차** 시각화
- **제어 출력** 모니터링
- **차량 상태** 표시

---

## 🎮 사용법

### 🌐 온라인에서 바로 사용
1. [**라이브 데모 링크**](https://imjeasung.github.io/Car-Control-Theory-Simulator)를 클릭
2. 제어기 타입 선택
3. 파라미터 조정
4. ▶️ 시작 버튼 클릭!

### 💻 로컬 실행
```bash
# 저장소 복제
git clone https://github.com/imjeasung/Car-Control-Theory-Simulator.git

# 폴더 이동
cd F1-Control-Theory-Simulator

# 웹 서버 실행 (선택사항)
python -m http.server 8000
# 또는
npx serve

# 브라우저에서 index.html 열기
```

### ⌨️ 단축키
- **스페이스바**: 시작/일시정지
- **R**: 리셋
- **T**: 궤적 히스토리 토글
- **C**: 궤적 삭제
- **방향키**: 수동 제어 시 조향

---

## 🎓 교육적 가치

### 📚 **제어 이론 학습**
- 다양한 제어기의 **특성 비교**
- **파라미터 변화**에 따른 성능 변화 관찰
- **실시간 피드백**으로 즉각적인 학습 효과

### 🔬 **실험적 학습**
- **극한 파라미터** 설정으로 불안정성 관찰
- **성능 메트릭**으로 객관적 평가
- **시행착오**를 통한 직관적 이해

### 🎯 **실용적 응용**
- **주행시스템** 기술의 기초 이해
- **로보틱스** 제어 시스템 학습
- **산업 제어** 시스템 원리 습득

---

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas API
- **Architecture**: 모듈식 설계 (MVC 패턴)
- **Features**: 반응형 디자인, PWA 지원

---

## 📊 성능 메트릭 해석

| 메트릭 | 설명 | 좋은 값 |
|--------|------|---------|
| **오버슈트** | 목표값 초과 정도 | <10% |
| **정착시간** | 안정화까지 시간 | <3초 |
| **정상상태오차** | 최종 추종 오차 | <5px |
| **종합 점수** | 전체적 성능 평가 | >80점 |

---

## 🎨 스크린샷

```
🚗 차량이 트랙을 따라 움직이며...
📊 실시간으로 성능 메트릭이 업데이트됩니다!
🛤️ 궤적 히스토리로 주행 패턴을 분석할 수 있어요.
```

---


## 🤝 기여하기

기여를 환영합니다! 다음과 같은 방식으로 참여하세요:

1. **Fork** 이 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/AmazingFeature`)
3. **변경사항 커밋** (`git commit -m 'Add some AmazingFeature'`)
4. **브랜치에 Push** (`git push origin feature/AmazingFeature`)
5. **Pull Request** 열기

### 🐛 버그 리포트
이슈 탭에서 버그를 신고해주세요. 다음 정보를 포함해주세요:
- 브라우저 정보
- 재현 단계
- 예상 동작 vs 실제 동작

---

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👨‍💻 개발자

**[imjeasung]** - *Initial work*

- 📧 Email: jeasunglim39@gmail.com
- 🐙 GitHub: [@imjeasung](https://github.com/imjeasung)

---

## 🙏 감사의 말

- 제어 이론 교육에 관심을 가져주신 모든 분들께
- 오픈소스 커뮤니티의 지속적인 지원에

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! ⭐**

![Star this repo](https://img.shields.io/github/stars/imjeasung/Car-Control-Theory-Simulator?style=social)

</div>
