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

v4.6 이전의 진행 제한에 사용된 필드. 현재는 8을 유지하는 호환성 필드이며 다음 단계 탐색을 제한하지 않는다.

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

# 10. 현재 약물 생리 기여 억제 모델 (v4.6 이후)

약물 적용은 단계 진행을 멈추지 않는다. `nextStep()`은 약물 투여 여부와 관계없이 0~8단계 이동을 허용한다.

`drugData[].suppressedRaasSteps`에 지정된 단계의 교육용 수치 기여만 제외한다. 약물 자체의 `physiologyEffect`는 기존 수치 그대로 별도 가산된다. `calculatePhysiologyAtStep(reachedStep,drugId)`가 순수 계산을 담당하고 `calculatePhysiology()`는 기존 `physiology` 객체를 유지한 채 갱신한다.

| 약물 | 수치 기여 제외 단계 | 설명 |
|---|---|---|
| ACE inhibitor | 4, 6, 7 | Ang II 생성 감소와 후속 기여 단순화 |
| ARB | 4, 6, 7 | AT1 관련 생리 효과 감소의 단순화 |
| β blocker | 4, 6, 7 | Renin 분비 감소에 따른 후속 기여 단순화 |
| Aldosterone antagonist | 6, 7 | 수용체 작용·염분 수분 보유 관련 효과 |
| Loop diuretic | 7 | 신세뇨관 Na⁺/Water 기여 감소 |
| Thiazide diuretic | 7 | 신세뇨관 Na⁺/Water 기여 감소 |

이는 **현재 교육용 모델에서 특정 수치 기여를 제외**한다는 뜻이지, 실제 생리적 경로가 완전히 중단되거나 약물에 100% 반응한다는 뜻은 아니다. 약물 적용 시점부터 실제로 일어난 변화를 시간 흐름에 따라 재구성하지도 않는다.

`maxReachedStep`에 도달한 현 상태를 기준으로 현재 적용된 약물의 가상 효과를 재계산한다. `currentStep`을 이전 단계로 이동해도 `maxReachedStep`과 현재 생리값은 줄지 않는다. `drugAppliedStep`은 마지막 적용 시점을 기록하지만 현재 기여 억제 판정에는 사용되지 않는다.

이 정책은 v4.5 이전의 `limitStep=blockStep` 기반 진행 제한을 대체한다. 과거 버전은 변경 없이 백업된다.

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

* 별도의 단계별 상세 모달(기존 Canvas 아래 상세 학습 패널은 구현됨)
* 임상 시나리오 모드
* 모바일 전용 인터페이스
* 임상적으로 검증된 약동학·시간 경과·피드백 모델

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
3. 약물 적용·제거 및 현재 단계 진행과 약물 생리 효과 억제의 분리.
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
* 실제 진행 기록과 무관하게 모든 9개 단계의 설명을 조회할 수 있다.

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

기전 표시는 시각적·교육적 표현일 뿐 RAAS가 완전히 중단된다는 의미가 아니다. v4.6 이후 `limitStep`은 8로 유지하는 호환성 필드이며 진행을 제한하지 않는다. `isStepBlocked()`는 `suppressedRaasSteps`에 따른 교육용 생리 기여의 계산상 제외에만 사용한다. 미래 모델 변경 시 시각 표시만이 아닌 생리 계산과 표시의 일관성을 별도로 검증해야 한다.

## 23.3 변경 금지 사항

v4.5에서 `stageData[].effect`, `drugData[].physiologyEffect`, `blockStep`, `state.progress`, `state.drug`, `calculatePhysiology()`, `nextStep()`, `previousStep()`, 초기화·약물 제거 로직 및 v4.4 학습 이벤트는 변경하지 않는다.

## 23.4 테스트와 미검증 범위

`tests/regression-v4.5.cjs`를 통해 이전 v4.4 백업과 동일한 동작 시퀀스에서 상태, 약물, 생리 수치, UI 패널 및 Canvas 경로 명령을 비교한다. 6종 약물의 기전 표식과 단계·연결 구간을 별도로 확인한다.

모의 DOM/Canvas 검증은 실제 브라우저 픽셀 출력, 클릭·터치 정밀도, 스크롤, 포커스, 네이티브 모달 접근성까지 보증하지 않는다.


---

# 24. 진행·생리 효과 분리 (v4.6)

- 단계 진행: `nextStep()`은 약물 선택과 무관하게 최종 8단계까지 허용.
- 상태: `currentStep`, `maxReachedStep` 의미 및 이전 단계 조회 기록 유지.
- 생리 모델: `calculatePhysiologyAtStep(step,drugId)`는 `baseline`, `raasEffect`, `drugEffect`, `effect`, `current` 객체를 반환하는 순수 함수.
- `calculatePhysiology()`는 기존 `physiology` 객체의 식별성을 유지하여 UI·다른 참조자의 상태를 깨지 않는다.
- 계산 결과는 현재 적용 약물 가정에 따른 정적인 모델상 비교로, 약효 발현 속도나 이전 약물 잔류 효과를 반영하지 않는다.
- 진행 초기화는 약물 유지, 전체 초기화는 진행·약물 모두 초기화. 약물 제거는 진행 기록 유지.
- v4.5 이전의 수치 모델과 약물 사용 중 결과는 의도적으로 달라지며, 6종 약물 효과의 고정값은 수정하지 않는다.

# 25. 생리 변수 비교 그래프 (v4.7)

- 위치: 기존 생리 변수 패널 아래 별도 `physiologyGraph` Canvas. 기존 900×380 RAAS pathway Canvas는 변경 없음.
- 시리즈: `getGraphSeries(key,drugId)`가 0~8단계의 무약물·현재 약물 가정 결과를 각각 9개 반환.
- 계산 소스: `calculatePhysiologyAtStep()`만 활용하며 그래프 전용 별도 생리식을 만들지 않는다.
- 변수 선택: `graphVariable`의 bp/sodium/volume/gfr. 선택 변경은 그래프만 재그리며 약물·진행·계산 상태를 변경하지 않는다.
- 색상: 파랑 실선=무약물, 보라 점선=적용 약물 가정; 현재 약물이 없으면 중복 선은 그리지 않는다.
- `maxReachedStep`을 세로 점선으로 표시한다. `currentStep` 되돌리기는 실제 최대 도달 이력을 바꾸지 않는다.
- X축=RAAS 단계 인덱스(시간이 아님), Y축=선택 변수의 교육용 수치; GFR처럼 상수인 값에도 0이 아닌 안전한 축 범위를 보장한다.
- 그래프 데이터는 저장되는 시계열이 아니며 약동학적·임상적 변화 예측으로 사용하지 않는다.

검증: `tests/regression-v4.6.cjs`와 `tests/regression-v4.7.cjs`의 모의 DOM/Canvas 자동 검증. 실제 브라우저 시각·모바일·접근성 검증은 미실시.


---

# 26. 키보드·클릭 학습 대상 시각적 표시 (v4.7.1)

- `learningFocusIndex`는 학습 조회 위치만 저장하는 별도 UI 상태로, RAAS 진행 상태 및 생리 계산과 무관하다.
- `showStageLearning(index)` 호출 시 학습 정보 패널 갱신과 `draw()` 재렌더링을 수행하며, `calculatePhysiology()`, `refreshScreen()`, `drawPhysiologyGraph()`는 호출하지 않는다.
- `drawLearningSelection()`은 경로 상자의 기존 배경색을 바꾸지 않고, 선택 상자 안쪽에 초록색 굵은 테두리와 상단 '조회' 표식을 그린다. 약물 기전 시각화 레이어와 별개다.
- 마우스 클릭과 키보드 ←/→, Home/End, Enter/Space는 동일한 학습 조회를 수행한다.
- Tab으로 Canvas에 포커스를 맞춘다. 방향키는 단계 선택과 상세 설명 패널 표시를 동시에 수행한다. Enter/Space는 같은 단계를 다시 표시한다.
- Escape 또는 학습 패널의 닫기 버튼은 선택을 -1로 되돌리고, 학습 패널을 숨기고, 기본 학습 힌트를 복원하며, 선택 테두리를 제거한다. Canvas 포커스는 유지/복귀한다.
- 선택 안내 텍스트는 Canvas 아래에 항상 보여야 하며, 상태 문구가 이를 덮어쓰지 않는다.
- 클릭 위치 판정, 키보드 초점 CSS, 기존 단계 색상 우선순위, 약물 6종, v4.6 모델 및 v4.7 그래프 동작을 변경하지 않는다.
- v4.7 모델과 맞지 않는 오래된 Canvas 약물 설명만 정정한다.
- 재현 가능 회귀 테스트: `tests/regression-v4.7.1.cjs`와 기존 `tests/regression-v4.6.cjs`, `tests/regression-v4.7.cjs`.
- 실 브라우저 시각·접근성·포커스 동작은 사용자 수동 확인 전까지 미검증.


---

# 27. RAAS 경로 시연 (v4.8)

## 사용자 관찰 동작

- 사용자가 명시적으로 `경로 시연`을 시작할 때만 1~9단계 순서로 이동한다. 자동 실행하지 않는다.
- 재생 간격은 850ms. 재생/일시정지/이어보기/종료/완료 후 재시연을 지원한다.
- Canvas의 진청색 점선 상자 테두리와 '시연' 표식, 실시간 진행 단계 텍스트가 시연 상태를 표현한다.
- 초록색 테두리·'조회' 표식은 키보드/클릭 학습 선택을 나타내므로 시연과 다른 의미를 갖는다.
- 화면 읽기를 위해 버튼 `aria-pressed`와 상태 `role=status` 사용.

## 상태·생리 모델 보호

- `flowDemo.index`는 9단계 시연 인덱스다. `flowDemo.timer`는 **한 번에 하나**만 유지하며 일시정지/완료/종료 시 제거한다.
- `advanceFlowDemo()`, `toggleFlowDemo()`, `stopFlowDemo()`는 `draw()`만 호출한다. `nextStep()`, `refreshScreen()`, `calculatePhysiology()`, `updateInfo()`, `drawPhysiologyGraph()` 호출 금지.
- `state.progress`, `state.drug`, `physiology`, `learningFocusIndex`, `getGraphSeries()` 값은 시연 조작으로 바뀌지 않는다.
- 기존 `drawPathway()`, `drawDrugMechanism()`, `drawLearningSelection()`은 유지하고 `drawFlowDemo()` 레이어만 추가한다.
- 약물별 기전, 900×380 Canvas 좌표/클릭 판정, 6종 약물 및 모든 초기화 규칙은 보존한다.
- 약물을 적용한 채 9단계 시연을 할 수 있으나 이것은 실제 약동학적 흐름이나 임상 정량 예측을 뜻하지 않는다.

검증: `tests/regression-v4.8.cjs` (모의 DOM/Canvas 및 결정적 타이머 테스트, 171항목). 실 브라우저 시각·포커스·모바일 테스트는 별도 필요.


---

# 28. v4.9 임상 시나리오 기반의 데이터·상태·계산 경계

## 28.1 지원 범위

v4.9는 내부 설계 기반 버전이다. 현재의 일반 학습 화면과 생리 모델은 변경하지 않는다.

- 독립적인 시나리오 UI, 실제 임상 사례, 환자별 임상 결과 계산, 데이터 영구 저장은 v4.9 범위가 아니다.
- 시나리오 정의는 정적 데이터이며, 세션은 문제 진행과 답안을 저장하는 일시적 메모리 상태다.
- 사용자가 브라우저를 새로고침하면 시나리오 세션을 자동 복원하지 않는다.
- 현재 시나리오 진입 버튼 및 브라우저 표시 로직은 연결하지 않는다. 해당 UX는 v5.0에서 별도 확정한다.

## 28.2 정의 데이터 계약

`SCENARIO_SCHEMA_VERSION = 1`이며 정의는 아래 필드를 사용한다.

| 필드 | 형태 | 역할 |
|---|---|---|
| `schemaVersion` | 숫자 1 | 데이터 스키마 버전 |
| `id` | 소문자와 하이픈 식별자 | 사례 고유 ID |
| `version` | 양의 정수 | 사례 콘텐츠 버전 |
| `title`, `caseContext` | 비어 있지 않은 문자열 | 제목과 사례 설명 |
| `objectives` | 문자열 배열, 최소 1개 | 교육 목표 |
| `observations` | `{label, value}` 문자열 객체 배열 | 정적인 관찰 정보 |
| `references` | `{id, citation}` 배열, 최소 1개 | 근거 자료 연결 |
| `questions` | 최소 1개 문제 | `id`, `prompt`, `choices`, `correctChoiceId`, `rationale`, `sourceIds` |
| `modelPolicy` | `"reference-only"` | 생리 계산 결과를 환자 예측치로 해석하지 않는 정책 |

각 문항에는 두 개 이상의 유효한 선택지가 필요하다. 중복 ID, 존재하지 않는 정답 ID, 누락·미등록 출처 ID, 잘못된 스키마 및 임상 예측을 허용하는 모델 정책은 검증에서 거부한다.

`validateScenarioDefinition()`은 `{valid, errors}`를 반환하며 일반 RAAS 상태를 수정하지 않는다.

## 28.3 실행 상태 계약

`scenarioRuntime`은 기존 `state` 및 `physiology`에 병합하지 않는다.

- 최초 상태: `{mode:"normal", definition:null, session:null}`.
- `enterScenarioMode(definition)`: 유효성을 확인하고 원본 정의를 JSON으로 복사한 후 독립 세션을 시작한다.
- `submitScenarioAnswer(choiceId)`: 현재 문제에 존재하는 선택지만 기록한다. 정답 여부와 정적 해설·출처 ID를 돌려주며 일반 생리 계산은 호출하지 않는다.
- `resetScenarioSession()`: 현재 시나리오의 풀이만 처음부터 다시 시작한다. 모드 밖에서는 `false`를 반환한다.
- `exitScenarioMode()`: 세션과 사례 정의를 버리고 일반 모드로 돌아간다.
- 세션은 `scenarioId`, `scenarioVersion`, `schemaVersion`, `questionIndex`, `answers`, `status`를 갖는다.
- 마지막 문제의 답안을 제출하면 `status:"completed"`가 되고 추가 제출을 거부한다.

시나리오 진입·풀이·초기화·종료는 다음 항목을 **수정해서는 안 된다**.

1. `state.progress.currentStep` 및 `maxReachedStep`
2. `state.drug`와 약물 6종의 상태
3. `physiology` 객체 및 참조 식별성
4. `learningFocusIndex`
5. `flowDemo` 인덱스·타이머·일시정지 상태
6. Canvas와 생리 그래프 렌더링
7. 일반 학습의 기존 초기화 규칙

## 28.4 생리 계산과 임상 근거

`calculatePhysiologyAtStep()`은 v4.6부터 유지된 **교육용 가상 모델**이며 기존 약물·단계 수치를 변경하지 않는다.

v4.9의 시나리오 엔진은 이 함수를 호출하지 않는다. 미래 시나리오 화면에서 이를 활용한다면 환자 관찰 정보와 분리된 개념 설명으로 명확히 구분해야 한다. 실제 환자 예측, 시간 경과, 약동학, K⁺ 또는 신기능 피드백은 별도 임상 근거 및 모델 검증이 선행되지 않는 한 구현하지 않는다.

## 28.5 테스트

- `tests/regression-v4.9.cjs`: 유효·무효 사례, 세션 수명주기, 일반 모드 불변, 7개 약물 시나리오별 v4.8 대비 진행/생리 계산/그래프 동일성.
- 기존 v4.6, v4.7, v4.7.1, v4.8 테스트 유지.
- v4.5 자기 회귀 검사는 현재 `index.html` 대신 기존 `backups/v4.5.html`과 `backups/v4.4.html`을 비교.
- 모의 DOM/Canvas 검사는 실제 브라우저의 픽셀·터치·접근성·초점 동작을 보증하지 않는다.



---

# 29. v4.10 의학·간호 교육 심화와 아이콘형 정보 모달

## 29.1 교육 콘텐츠 경계

- `clinicalStageNotes`에는 RAAS 9단계별 의학·생리학 해설, 간호 사정·안전 포인트와 출처 번호를 저장한다.
- `clinicalDrugNotes`에는 ACEi, ARB, MRA, β blocker, loop, thiazide 이뇨제 6종의 임상 기전·간호 모니터링·출처 번호를 저장한다.
- 이 정적 해설 데이터는 `stageData[].effect` 및 `drugData[].physiologyEffect`를 대체하거나 수정하지 않는다.
- `showStageLearning(index)`는 기존 상세 조회 패널의 `stageDetailClinical`, `stageDetailNursing`, `stageDetailDrugClinical`, `stageDetailEvidence`에 `textContent`로 자료를 표시한다. 외부/동적 HTML로 삽입하지 않는다.
- 학습 대상 선택은 기존과 같이 `learningFocusIndex`와 `draw()`만 변경할 수 있다. 일반 진행·약물·생리 계산·그래프·시연 타이머는 변경하지 않는다.
- 임상 내용과 교육용 가상 수치의 의미를 구분한다. 특히 혈청 Na⁺ 변화 예측, GFR 시간 변화, K⁺의 정량 계산을 구현했다고 표시하지 않는다.

## 29.2 정보 팝업

- 좌측 조작 패널의 `helpOpenButton`(ⓘ 설명서)과 `changelogOpenButton`(▤ 패치 내역)으로 각각 독립된 native `<dialog>`를 연다.
- 모달은 `showModal()`과 `close()`를 사용하며, X(`helpCloseButton`/`changelogCloseButton`), Esc, 바깥 영역 클릭으로 종료한다.
- 바깥 클릭은 `event.target===dialog`이면서 클릭 지점이 `getBoundingClientRect()` 범위 밖인 경우에만 닫는다. 본문 클릭·스크롤은 닫기 명령이 아니다.
- native `close` 이벤트에서 원래 연 아이콘 버튼으로 키보드 포커스를 되돌린다.
- 버튼에는 `aria-controls`, `aria-haspopup`, 닫기 버튼에는 적절한 `aria-label`을 둔다.
- 설명서와 패치 내역 팝업은 시뮬레이션 `state`, `physiology`, Canvas, 비교 그래프, 시연 타이머, 시나리오 상태에 영향을 주지 않는다.
- 정보 본문이 길면 팝업 자체에서 스크롤되며 기존 900×380 경로 Canvas 및 생리 패널의 배치를 수정하지 않는다.

## 29.3 참고문헌·내용 검증

현재 콘텐츠의 중심 자료는 다음과 같다. 정확한 목록과 외부 링크는 설명서에서 확인한다.

1. Kaur & Rout (2026), NCBI StatPearls — RAAS 경로 및 생리 기전.
2. KDIGO CKD Work Group (2024), `Kidney International` — ACEi/ARB 관련 신기능·전해질 감시.
3. NICE (2025), NG106 — 심부전 약물 및 신기능·전해질 모니터링.
4. Ernstmeyer & Christman (Eds., 2024), `Nursing Fundamentals` 2nd ed. — 체액·전해질의 간호 사정.

출처에 없는 개별 환자별 약효 크기·경과를 임의로 생성하지 않는다. 실제 처방·투약·용량 변경은 본 도구에서 수행하지 않는다.

## 29.4 회귀 검증

- 기존 v4.5~v4.9의 회귀 검사 및 `tests/regression-v4.10.cjs`를 실행한다.
- 새 테스트는 9개 단계의 교육 자료, 6개 약물 자료, 설명서/패치 내역 팝업의 열기·X·바깥 클릭·Esc 상당 close 이벤트·포커스 복귀, 원상태 불변을 확인한다.
- 모의 DOM/Canvas는 실제 모바일·브라우저 픽셀/레이아웃과 native 키보드 동작까지 보증하지 않으므로 시각 검증을 별도로 기록한다.



---

# 30. v5.0 임상 시나리오 교육 모드 MVP

## 30.1 사용자 흐름

- 상단 `normalModeButton` / `scenarioModeButton`은 `normalStudyView` / `scenarioStudyView`를 분리한다.
- 일반 모드에는 기존 전체 RAAS 조작 패널, 900×380 Canvas, 교육 자료, 생리 변수, 그래프, 경로 시연 및 안내 모달이 그대로 존재한다.
- 시나리오 모드는 별도의 본문 영역에서 상황·학습 목표·관찰 정보·문항을 제공한다.
- 풀이 흐름: **상황 조회 → 3지선다 답안 선택 → 정답/오답 표시·근거 설명 → 다음 문항 → 완료 결과·다시 풀기**.
- 답안 제출 후에는 같은 문항에 중복 답안을 제출할 수 없고 다음 문항 버튼을 눌러야 진행한다.
- 마지막 문항 답안 이후에는 근거를 확인한 다음 결과 보기로 최종 요약을 표시한다.

## 30.2 단일 검증 사례

- `firstClinicalScenario`은 정적 schemaVersion 1 JSON 구조의 가상 성인 CKD/알부민뇨 환자 설정이다.
- 개별 혈압·eGFR·크레아티닌·K⁺ 숫자를 만들어내지 않는다. 환자별 수치 예측은 지원하지 않는다.
- 질문 `monitoring`: ACEi 시작 후 혈압, 크레아티닌, 혈청 K⁺ 추적.
- 질문 `follow-up`: 현재 GFR/K⁺ 등 위험도에 따른 시작·증량 후 2~4주 이내 모니터링.
- 질문 `dual-raas`: ACEi+ARB 병용 상황 확인과 담당 의료진 의사소통.
- 근거는 **KDIGO 2024 CKD Guideline, Recommendation 3.6.4 및 Practice Point 3.6.2**. 각 질문에서 출처 `kdigo-2024`를 참조한다.
- 모든 문항의 해설은 정적 자료다. 기존 `calculatePhysiologyAtStep()` 값이나 시나리오 환자 관찰값에서 생성하지 않는다.
- 사용자 결과는 정답 선택 개수를 표시하는 학습 피드백일 뿐 환자 상태 평가나 임상 역량 인증이 아니다.

## 30.3 상태 전환 정책

- `scenarioRuntime`은 기존 일반 모델 `state`, `physiology`와 독립이다.
- `switchStudyMode("scenario")`: 시연 실행 중이면 `toggleFlowDemo()`로 **일시정지**하고 위치를 유지한다. `enterScenarioMode(firstClinicalScenario)`로 새 세션을 시작한다.
- `switchStudyMode("normal")`: `exitScenarioMode()`로 사례·답안 세션을 제거한다. 일반 RAAS 진행·약물·계산·그래프·선택 위치를 변경하지 않는다.
- 다시 진입하면 새로운 풀이를 시작하며, 명시적 `scenarioRestartButton`은 현재 시나리오 풀이만 초기화한다.
- 브라우저 새로고침이나 앱 재시작 후 풀이를 복원하지 않는다.
- `scenarioLatestFeedback`은 제출 후 근거 표시 단계의 UI 전용 상태이며, `scenarioRuntime.session.answers`가 점수 계산의 유일한 원천이다.
- 모달 정보 열기·닫기와 시나리오 진입은 서로의 계산을 호출하지 않는다.
- 화면 전환 뒤 키보드 포커스는 활성 모드 버튼으로 이동한다. 답안 선택 후는 다음 문항 버튼, 다음 문항으로 이동 후 첫 답안 버튼에 포커스한다.

## 30.4 회귀 및 접근성 검증

- 자동 테스트 `tests/regression-v5.0.cjs`는 기존 v4.10 백업과 7종 약물 조건의 상태·계산·그래프 동일성, 3문항 답안/중복 차단/결과/다시 풀기/중간 종료·재진입, 숨겨진 경로 시연 타이머 일시정지를 검사한다.
- 과거 v4.10 자기 회귀 테스트는 고정 `backups/v4.10.html`을 읽도록 범위를 정정했다. 기존 v4.10 백업은 수정하지 않는다.
- 실제 브라우저에서의 모드 전환, 시나리오 좁은 화면 배치, 탭 포커스, 출처 링크, 모달 접근성은 사용자 수동 확인을 대기한다. 시각 검증은 아직 통과로 기재하지 않는다.
- v5.0 MVP에는 영구 저장, 여러 임상 사례 선택, K⁺ 수치 모델, 실제 약물 효과 시간 경과·용량 및 처방 결정 기능을 추가하지 않는다.

