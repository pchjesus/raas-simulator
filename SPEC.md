# RAAS Simulator Specification

## 1. 문서 목적

이 문서는 RAAS Simulator가 현재 어떤 규칙으로 동작해야 하는지를 정의한다.

`DEVLOG.md`가 개발 과정의 역사와 변경 사항을 기록한다면, 본 문서는 현재 구현에서 유지되어야 하는 시스템 규칙을 정의한다.

코드를 수정할 때는 현재 코드와 함께 이 문서를 기준으로 기존 동작의 변경 여부를 판단한다.

---

# 2. 기본 시스템

## 2.1 실행 환경

현재 프로그램은 HTML, CSS, JavaScript를 하나의 `index.html`에 포함하는 구조이다.

외부 JavaScript 라이브러리는 사용하지 않는다.

Canvas API를 이용하여 RAAS pathway를 렌더링한다.

---

# 3. RAAS 단계

RAAS 단계는 다음 순서와 인덱스를 가진다.

| index | 단계             |
| ----: | -------------- |
|     0 | 혈압 감소          |
|     1 | Renin          |
|     2 | Angiotensin I  |
|     3 | ACE            |
|     4 | Angiotensin II |
|     5 | AT1 receptor   |
|     6 | Aldosterone    |
|     7 | Na⁺ / Water    |
|     8 | 혈압 회복          |

단계의 순서와 의미는 기존 학습 흐름을 유지해야 한다.

---

# 4. 진행 상태

현재 진행 상태는 두 가지 값을 분리하여 관리한다.

## 4.1 currentStep

현재 사용자가 화면에서 보고 있는 단계.

초기값:

```javascript
-1
```

`-1`은 RAAS 시작 전 상태를 의미한다.

---

## 4.2 maxReachedStep

사용자가 실제로 진행하여 도달한 최대 단계.

초기값:

```javascript
-1
```

사용자가 이전 단계로 이동해도 `maxReachedStep`은 감소하지 않는다.

따라서 다음과 같은 상태가 가능하다.

```text
currentStep = 3
maxReachedStep = 6
```

이 상태에서는 3단계를 현재 보고 있지만 6단계까지 진행한 기록이 존재한다.

---

# 5. Canvas 표시 규칙

각 단계의 기본 색상은 회색이다.

```text
미진행 = 회색
```

실제로 진행 완료된 단계는 빨간색으로 표시한다.

```text
진행 완료 = 빨간색
```

현재 사용자가 보고 있는 단계는 파란색으로 표시한다.

```text
현재 단계 = 파란색
```

적용된 약물의 작용 위치는 노란색으로 표시한다.

```text
약물 작용 위치 = 노란색
```

---

# 6. Canvas 색상 우선순위

색상이 중복되는 경우 다음 우선순위를 적용한다.

```text
1. 약물 작용 위치
2. 현재 단계
3. 진행 완료 단계
4. 미진행 단계
```

즉 현재 단계가 약물 작용 위치와 동일한 경우:

```text
노란색
```

을 표시해야 하며 파란색으로 덮어쓰면 안 된다.

현재 구현에서는 Canvas의 색상 조건을 위 순서에 맞게 처리한다.

---

# 7. 약물 데이터

현재 약물은 6종이다.

## 7.1 ACE inhibitor

대표 약물:

* Enalapril
* Lisinopril

작용 위치:

```text
ACE
```

blockStep:

```text
3
```

교육용 약물 효과:

```text
ACE 차단 → Ang II 생성 감소
```

---

## 7.2 Aldosterone antagonist

대표 약물:

* Spironolactone
* Eplerenone

작용 위치:

```text
Aldosterone
```

blockStep:

```text
6
```

교육용 약물 효과:

```text
Aldosterone receptor 차단 → Na⁺ / Water 보유 감소
```

---

## 7.3 ARB

대표 약물:

* Losartan
* Valsartan

작용 위치:

```text
AT1 receptor
```

blockStep:

```text
5
```

교육용 약물 효과:

```text
AT1 receptor 차단 → Ang II 작용 억제
```

---

## 7.4 β blocker

대표 약물:

* Metoprolol
* Atenolol

작용 위치:

```text
Renin
```

blockStep:

```text
1
```

교육용 약물 효과:

```text
Renin 분비 감소
```

---

## 7.5 Loop diuretic

대표 약물:

* Furosemide

작용 위치:

```text
Na⁺ / Water
```

blockStep:

```text
7
```

교육용 약물 효과:

```text
Na⁺ / Water 재흡수 감소
```

---

## 7.6 Thiazide diuretic

대표 약물:

* Hydrochlorothiazide

작용 위치:

```text
Na⁺ / Water
```

blockStep:

```text
7
```

교육용 약물 효과:

```text
Na⁺ 재흡수 감소 → 체액 감소
```

---

# 8. 약물 상태

약물 관련 상태는 다음 개념을 가진다.

```text
selectedDrug
```

사용자가 선택창에서 선택한 약물.

```text
appliedDrug
```

현재 실제로 시뮬레이터에 적용된 약물.

```text
drugAppliedStep
```

약물을 적용한 당시의 현재 단계.

```text
limitStep
```

현재 구현에서 약물 적용 후 다음 단계 진행을 제한하기 위해 사용되는 값.

---

# 9. 약물 적용

약물 적용 버튼을 누르면 선택창의 약물을 `appliedDrug`로 적용한다.

약물이 적용되면:

1. 현재 약물이 변경된다.
2. 약물 적용 시점이 기록된다.
3. 약물의 작용 위치가 Canvas에 표시된다.
4. 생리 변수 계산을 다시 수행한다.
5. 화면을 다시 렌더링한다.

---

# 10. 현재 약물 차단 모델

현재 구현에서는 약물 적용 시 `blockStep` 이후의 일부 단계가 계산상 차단될 수 있다.

현재 `isStepBlocked()`는 약물 적용 시점과 blockStep을 함께 고려한다.

현재 구현은 다음과 같은 교육용 모델을 사용한다.

```text
약물 적용
↓
작용 위치
↓
그 이후 일부 단계의 RAAS 효과 제한
```

다만 현재의 `limitStep` 구조는 약물 적용 후 실제 진행 자체를 제한한다는 별도의 설계상 한계를 가진다.

이 문제는 현재 SPEC의 동작 규칙을 임의로 변경하여 해결하지 않는다.

향후 시뮬레이션 모델을 재설계할 때 별도로 검토한다.

---

# 11. 생리 변수

초기 생리 변수는 다음과 같다.

```javascript
bp = 120
sodium = 140
volume = 100
gfr = 120
```

단위:

```text
혈압 = mmHg
Na⁺ = mmol/L
혈액량 = %
GFR = mL/min
```

---

# 12. 생리 계산 구조

최종 생리 효과는 다음 구조로 계산한다.

```text
RAAS 영향 + 약물 영향 = 전체 변화
```

그리고:

```text
기본값 + 전체 변화 = 현재값
```

각 변수는 다음 구조를 가진다.

```text
baseline
raasEffect
drugEffect
effect
current
```

---

# 13. 현재 RAAS 생리 효과 모델

현재 단계별 교육용 생리 효과는 다음과 같다.

## Angiotensin II 단계

```text
혈압 +10
```

## Aldosterone 단계

```text
Na⁺ +5
혈액량 +10
```

## Na⁺ / Water 단계

```text
혈압 +5
```

현재 GFR에는 별도의 단계 효과가 지정되어 있지 않다.

---

# 14. 현재 약물 생리 효과 모델

현재 구현된 교육용 수치는 다음과 같다.

### ACE inhibitor

```text
혈압 -15
Na⁺ -3
```

### Aldosterone antagonist

```text
혈압 -5
Na⁺ -5
혈액량 -10
```

### ARB

```text
혈압 -15
```

### β blocker

```text
혈압 -8
```

### Loop diuretic

```text
혈압 -10
Na⁺ -5
혈액량 -15
```

### Thiazide diuretic

```text
혈압 -5
Na⁺ -3
혈액량 -10
```

이 수치는 실제 임상 환자의 예측값이 아니라 시뮬레이터의 교육용 상대 변화량이다.

---

# 15. 생리 변수 업데이트

화면에는 각 변수에 대해 다음 정보를 표시한다.

```text
기본
변화
(RAAS 영향 / 약물 영향)
현재
```

변화량이 양수이면:

```text
+값 ↑
```

음수이면:

```text
-값 ↓
```

0이면:

```text
0
```

으로 표시한다.

---

# 16. 초기화 규칙

## 진행 초기화

`resetProgress()`는 다음을 초기화한다.

```text
currentStep = -1
maxReachedStep = -1
```

현재 약물 상태는 유지한다.

---

## 전체 초기화

`resetAll()`은 다음을 초기화한다.

```text
currentStep = -1
maxReachedStep = -1
selectedDrug = none
appliedDrug = none
drugAppliedStep = null
limitStep = 8
```

약물 선택창도 `none`으로 되돌린다.

---

# 17. 약물 제거

약물 제거 시:

```text
appliedDrug = none
drugAppliedStep = null
limitStep = 8
```

으로 변경한다.

약물 제거 후 생리 변수와 화면을 다시 계산한다.

---

# 18. 향후 구조 개선 시 유지해야 할 원칙

향후 리팩토링 과정에서도 다음 기능적 규칙은 유지해야 한다.

1. `currentStep`과 실제 진행 기록을 구분한다.
2. 약물 작용 위치는 현재 단계보다 시각적으로 우선한다.
3. 생리 변수는 RAAS 영향과 약물 영향을 구분하여 표시한다.
4. 약물 정보에는 작용 위치와 작용 설명이 포함되어야 한다.
5. 진행 초기화와 전체 초기화의 역할을 구분한다.
6. 기존 기능을 유지한 상태에서 구조를 개선한다.
7. 교육용 단순화 모델을 실제 임상적 정량 예측 모델로 오해하지 않도록 한다.

---

# 19. 현재 미구현 기능

다음 기능은 현재 구현된 것으로 간주하지 않는다.

* 단계별 상세 팝업
* 생리 변화 그래프
* 임상 시나리오 모드
* 모바일 전용 인터페이스
* 약물 차단 로직의 재설계

향후 버전에서 별도로 구현한다.

---

# 20. 사용 설명서 모달 (v4.3.4)

## 진입 및 종료

* 좌측 조작 패널의 `? 사용 설명서` 버튼으로 모달을 연다.
* `닫기` 버튼, `Esc` 및 모달 바깥 클릭으로 닫을 수 있다.
* 내용 영역 클릭과 스크롤은 모달을 닫지 않는다.
* 모달 종료 시 도움말 진입 버튼으로 포커스를 되돌린다.
* 모달은 브라우저 기본 `<dialog>`의 `showModal()`을 이용한다.
* 모달은 내부 스크롤을 사용하며 기존 Canvas 크기와 생리 변수 패널을 변경하지 않는다.

## 제공 내용

1. 다음/이전 단계와 진행 초기화/전체 초기화의 차이.
2. Canvas 색상과 우선순위(노랑 > 파랑 > 빨강 > 회색).
3. 약물 적용·제거 및 현재 `limitStep` 기반 진행 제한.
4. 기본값 + RAAS 효과 + 약물 효과 = 현재값.
5. GFR이 현재 모델에서 변하지 않는 점 및 모든 표시 수치가 임상 예측값이 아니라는 주의사항.

## 상태 분리

* 설명서 열기·닫기는 `state.progress`, `state.drug`, `physiology`를 수정하지 않는다.
* 설명서 UI는 `refreshScreen()`, `calculatePhysiology()`, `draw()`, `updateInfo()`를 호출하지 않는다.
* 현재 CSS/HTML은 데스크톱 900×380 Canvas와 기존 조작 패널을 유지한다.

## 검증 한계

2026-10-09 자동 모의 DOM 기반 테스트로 설명서 조작과 기존 상태·Canvas 호출을 비교했다.
실제 브라우저에서의 레이아웃, 네이티브 `Esc`와 Tab 이동 및 모바일 접근성은 추가 수동 검증이 필요하다.

---

# 21. Canvas 단계 클릭 학습 (v4.4)

## 조회 전용 동작

* RAAS 단계 9개를 Canvas에서 클릭하거나 키보드로 탐색하면 별도의 상세 학습 패널을 연다.
* 조회 대상과 실제 진행 상태 `state.progress.currentStep`/`maxReachedStep`는 서로 다른 개념이다.
* 클릭으로 `nextStep()`, `previousStep()`, `refreshScreen()`이나 `calculatePhysiology()`를 실행하지 않는다.
* 약물 상태 `state.drug` 및 `physiology`, Canvas 색상과 진행 기록은 조회 전후 동일해야 한다.
* 적용된 약물의 진행 제한 밖에 있는 단계도 설명만 조회할 수 있다.

## 클릭 영역과 화면

* 클릭 가능한 영역은 `drawPathway()`에서 그리는 각 단계 상자(가로 85, 세로 70)이다.
* 시작 좌표는 (35, 55), 단계 간 가로 간격은 95이다.
* 좌표 기준은 `PATHWAY_LAYOUT` 상수로 통일하고 CSS 보더와 표시 배율을 보정한다.
* 연결선, 다른 Canvas 영역, 경계 밖은 선택하지 않는다.
* 상세 설명 패널은 Canvas 아래에 나타나며, 닫기 버튼으로 다시 숨길 수 있다.
* 기존 900×380 Canvas와 생리 변수 계산/UI를 유지한다.

## 접근성과 학습 정보

* Canvas는 키보드로 포커스할 수 있어야 한다.
* 방향키 좌우, Home, End 및 Enter/Space로 단계 학습을 진행할 수 있다.
* 화면에는 선택한 단계의 이름, 기존 설명, 확장 학습 문구, 정적인 모델 수치 효과 및 연관 약물을 표시한다.
* 교육 콘텐츠는 `stageData[].learningDetail`을 사용하며 수치 효과는 기존 `stageData[].effect`를 그대로 읽는다.
* 연관 약물은 `drugData`의 `blockStep`에서 도출한다. 선택 여부를 생리 계산으로 혼동하지 않는다.
* 실제 환자에게 적용 가능한 임상 예측값으로 설명하지 않는다.

## 검증 범위 및 한계

2026-10-09 자동화된 모의 DOM/Canvas 비교에서 기존 기능과 단계 조회 전후 상태가 일치했다.
9개 도형의 내부·경계·빈 공간, 확대·축소된 Canvas 좌표, 약물 6종 및 기존 사용 설명서 공존을 포함했다.
브라우저 실제 픽셀 렌더링·터치·스크롤·포커스 이동은 별도로 확인해야 한다.

---

# 22. Codex 작업 규칙

Codex가 코드를 수정할 때 다음 순서를 권장한다.

```text
1. README.md 확인
2. SPEC.md 확인
3. DEVLOG.md 확인
4. 현재 index.html 확인
5. 변경 대상과 기존 기능의 관계 분석
6. 구현
7. 기존 기능 회귀 여부 확인
8. 필요한 경우 DEVLOG.md 업데이트
9. SPEC의 현재 규칙이 변경되었다면 SPEC.md 업데이트
```

특히 기능 추가나 UI 변경이 기존 상태 관리, 계산 엔진, Canvas 표시 또는 화면 전환에 영향을 줄 가능성이 있는 경우 먼저 영향을 검토한다.

현재 구현되지 않은 기능을 임의로 추가하거나, 기존 규칙을 조용히 변경하지 않는다.


---

# 23. 약물 작용 기전 시각화 (v4.5)

## 23.1 적용 범위와 경계

v4.5는 현재 약물 상태를 읽어서 기존 Canvas 위에 **작용 기전 안내 표시만 추가**한다.

- `drugData[drugId].visualization`: `type`(link/node), 연결 구간 `afterStep` 또는 단계 `step`, 교육용 작용 설명 `mechanism`.
- `drawDrugMechanism()`: 적용 약물이 없으면 아무것도 그리지 않음. 약물이 있으면 보라색 표식을 연결선 또는 단계 하단에 그림.
- `draw()`: 기존 `drawPathway()` 후 약물 기전 레이어를 추가하고, `drawStatus()`, `drawDrugInfo()`, `drawDescription()`의 기존 호출 순서는 유지.

상자 간 실제 간격은 10px이며, 연결 구간의 사선은 그 간격 안에 위치해야 한다. 단계 상자 자체의 크기와 좌표, Canvas 900×380, 상세 학습 클릭 판정은 그대로 유지한다. 작용 설명은 기존 구분선(y=250) 위 빈 공간을 사용한다.

## 23.2 약물별 기전 표현

| 약물 | 표시 종류 | 위치 | 교육용 표현 |
| --- | --- | --- | --- |
| ACE inhibitor | link | ACE(3)와 Angiotensin II(4) 사이 | 전환 감소 |
| ARB | link | Angiotensin II(4)와 AT1 receptor(5) 사이 | AT1 수용체 작용 억제 |
| β blocker | node | Renin(1) 아래 | β1 매개 Renin 분비 감소 |
| Aldosterone antagonist | node | Aldosterone(6) 아래 | Aldosterone 수용체 작용 억제 |
| Loop diuretic | node | Na⁺/Water(7) 아래 | 굵은 상행각 NKCC2 억제 |
| Thiazide diuretic | node | Na⁺/Water(7) 아래 | 원위곡세뇨관 NCC 억제 |

신세뇨관의 해부학적 위치는 현행 RAAS 9단계에 개별적으로 존재하지 않아 Na⁺/Water를 개념적 요약 지점으로 사용한다. 보라색은 별도 표식이며 **노랑 > 파랑 > 빨강 > 회색**의 기존 단계 상자 색상 우선순위는 변하지 않는다.

기전 표시는 시각적·교육적 표현일 뿐 RAAS가 완전히 중단된다는 의미가 아니다. 현행 단순화된 `limitStep` 진행 제한과 `isStepBlocked()` 생리 계산 제한은 여전히 기존 동작 그대로 유지한다. 미래 모델 변경 시 시각 표시만이 아닌 생리 계산과 표시의 일관성을 별도로 검증해야 한다.

## 23.3 변경 금지 사항

v4.5에서 `stageData[].effect`, `drugData[].physiologyEffect`, `blockStep`, `state.progress`, `state.drug`, `calculatePhysiology()`, `nextStep()`, `previousStep()`, 초기화·약물 제거 로직 및 v4.4 학습 이벤트는 변경하지 않는다.

## 23.4 테스트와 미검증 범위

`tests/regression-v4.5.cjs`를 통해 이전 v4.4 백업과 동일한 동작 시퀀스에서 상태, 약물, 생리 수치, UI 패널 및 Canvas 경로 명령을 비교한다. 6종 약물의 기전 표식과 단계·연결 구간을 별도로 확인한다.

모의 DOM/Canvas 검증은 실제 브라우저 픽셀 출력, 클릭·터치 정밀도, 스크롤, 포커스, 네이티브 모달 접근성까지 보증하지 않는다.
