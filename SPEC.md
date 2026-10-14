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



---

# 31. v5.1 선택지별 피드백·간호 판단·결과 복습

## 31.1 데이터 계약

- 기존 `SCENARIO_SCHEMA_VERSION=1`를 유지한다. v5.1 콘텐츠 `firstClinicalScenario.version`은 2다.
- 선택지 객체 `choices[].feedback`: 해당 선택의 적절성·오개념을 설명하는 선택적 비어 있지 않은 문자열.
- 문항 객체 `questions[].nursingFocus`: 문제에 관련된 간호 사정·보고 및 환자 안전 포인트를 요약한 선택적 비어 있지 않은 문자열.
- `validateScenarioDefinition()`은 이러한 선택 필드가 제공되었을 때 문자열 유효성을 검사한다. 정의에 필드가 없어도 v4.9/v5.0 스키마 1 호환성은 유지한다.
- 첫 사례의 3문항·9개 선택지에는 모두 피드백이, 3문항에는 모두 간호 핵심 내용이 연결된다.
- 기존 `rationale`과 `sourceIds`는 문항의 공통 근거와 출처를 유지한다. 선택지별 설명은 이 근거를 대신하지 않는다.

## 31.2 UI 동작

- 사용자 답안 제출 뒤 피드백 패널에 **내 선택 → 선택지별 이유 → 정답 → 공통 근거 해설 → 간호 사정·보고 핵심 → 출처**를 구분해 표시한다.
- `scenarioRuntime.session.answers`는 정답 선택·완료 요약의 유일한 기록원이다. `scenarioLatestFeedback`는 현재 피드백을 임시 표시하는 UI 전용 객체로 유지한다.
- 기존 `submitScenarioAnswer()` 반환값·정답 판정 로직은 변경하지 않고 렌더링 시 정의 데이터에서 선택지별 자료를 조회한다.
- 모든 문항 완료 뒤 `scenarioResultReview`에 질문·내 선택·정답·정오 여부를 텍스트로 표시한다. 사용자 정의 콘텐츠는 `textContent`로만 대입하며 HTML을 주입하지 않는다.
- 다시 풀기·종료·모드 전환 시 이전 답안은 기존 정책대로 초기화된다. 피드백·복습 영역도 상태 변경을 통해 정상적으로 다시 렌더링해야 한다.
- 기존 일반 RAAS 진행·약물·생리 계산·그래프·Canvas·경로 시연 및 정보 모달에 영향을 주지 않는다.
- 이 패치에서는 새로운 임상 사례, 환자별 검사 수치 예측, 자동 처방 결정, 문항 난이도·점수 가중치, 영구 저장을 구현하지 않는다.

## 31.3 임상 근거 및 위험

- KDIGO 2024 CKD Guideline Section 3.6을 따른다: Practice Point 3.6.2의 ACEi/ARB 시작·증량 후 혈압·크레아티닌·K⁺ 확인 및 Recommendation 3.6.4의 CKD 환자 ACEi·ARB·직접 레닌 억제제 병용 회피.
- 2~4주 추적은 지침상 일반 권고이며 현재 GFR·K⁺와 환자 상태에 따라 적절한 추적 간격이 달라질 수 있다.
- 오답 해설은 간호 사정과 안전 의사소통을 안내하되 사용자에게 임의 처방·투약 중단을 지시하지 않는다.
- 실제 환자별 검사값·치료 반응·약동학은 기존 모델에서 계산하지 않는다.

## 31.4 회귀 검사

- `tests/regression-v5.0.cjs`는 `backups/v5.0.html`을 기준으로 해당 버전의 동작을 검증하도록 고정한다. 그 외 과거 백업은 변경하지 않는다.
- `tests/regression-v5.1.cjs`에서 9개 선택지의 개별 해설·간호 포인트, 정답·오답 스타일, 결과 복습, 스키마 선택 필드 유효성, 이전 v5.0 일반/시나리오 상태 및 경로 시연 동작을 검증한다.
- 자동 JavaScript mock DOM/Canvas 테스트와 실제 데스크톱·모바일 브라우저의 시각/키보드/터치 검증은 구별한다.



---

# 32. v5.2 단계형 간호 행동 판단 교육

## 32.1 교육 데이터와 근거 범위

- `firstClinicalScenario.version=3`, `SCENARIO_SCHEMA_VERSION=1` 유지.
- 문항별 선택적 `actionExercise`: `prompt`, `choices[{id,text,feedback}]`, `correctChoiceId`, `rationale`, `assessment`, `escalation`, `teaching`, `sourceIds`.
- `validateScenarioDefinition()`은 추가 필드가 있을 때 형식·정답 ID·선택지 중복·출처 연결을 검증한다. 추가 필드가 없는 이전 스키마 1 사례도 허용한다.
- CKD/ACE 억제제 사례의 세 지식 문항에 각각 1개의 행동 문항을 연결한다. KDIGO 2024 CKD Practice Point 3.6.2, Recommendation 3.6.4 범위에서 기전과 모니터링/병용 관련 안전 행동을 교육한다.
- 검사·재진 계획, 담당 의료진·약사 확인과 환자 교육은 **교육용 간호 행동 예시**다. 실제 환자 치료·약물 처방·검사 처방을 이 앱이 결정하는 것은 아니다.

## 32.2 단계 전이

1. 기존 3지선다 임상 판단 제출 후 `scenarioLatestFeedback`를 통해 v5.1 개별 선택지 해설을 표시한다.
2. 문항에 `actionExercise`가 있으면 **다음 문항** 대신 **다음: 간호 행동 판단**을 표시한다. 임상 해설만 보고 다음 문항을 건너뛰는 동작은 허용하지 않는다.
3. 행동 선택 문제를 열면 `scenarioActionPhase="select"`, 기존 문항의 해설은 숨긴다. 행동 선택은 `scenarioActionAnswers[question.id]`에 기록하고 `scenarioActionPhase="review"`로 이동한다.
4. 행동 피드백에는 내 선택·선택지별 해설·권장 행동·근거·추가 사정·확인/보고·환자 교육·출처를 표시한다.
5. 후속 행동 해설 후에만 **다음 문항** 또는 **결과 보기**를 활성화한다.
6. `actionExercise`가 없는 과거 스키마 1 정의는 기존 v5.1 진도 동작(지식 해설 → 다음 문항)을 지원한다.
7. 완료 화면에서는 지식 문항의 정답 개수·문항별 복습과 행동 문항의 적절한 선택 개수·선택별 복습을 구분한다.

## 32.3 상태 경계 및 회귀 보호

- 시나리오 지식 정답은 `scenarioRuntime.session.answers`; 간호 행동 선택은 UI 전용 `scenarioActionAnswers`; 현재 행동 진행은 `scenarioActionPhase`에만 기록한다.
- `scenarioLatestFeedback`는 해당 지식 문항에서 선택한 응답의 결과만 보유한다. 정답 채점 모델, `submitScenarioAnswer()` 반환값 및 기존 생리 계산을 변경하지 않는다.
- 재시작, 시나리오 종료, 일반 학습 전환/재진입 시 `resetScenarioActions()`를 호출하여 이전 행동 선택이 남지 않게 한다.
- 읽기 전용 UI와 정적 해설은 `textContent`를 사용한다. 약물 적용·RAAS 상태·기존 그래프·Canvas/키보드 조회·시연 타이머, v4.10 정보 팝업은 변경하지 않는다.
- 자동 검사 `tests/regression-v5.2.cjs`에서 모든 3×3 행동 선택지를 검증하며, 기존 v4.5~v5.1 회귀 스위트와 함께 수행한다.
- v5.1 자기 테스트는 이전 `backups/v5.1.html`에서 실행하도록 고정하고 과거 백업은 수정하지 않는다.
- 실제 브라우저의 모달·포커스·화면 크기·터치 검증은 사용자 추후 점검 항목으로 남긴다.



---

# 33. v5.3 사례 선택 및 HFrEF/MRA 교육 사례

## 33.1 사례 카탈로그의 UX 규칙

- 시나리오 모드 진입 시 `scenarioCaseCatalog`에서 **CKD·ACEi / HFrEF·MRA** 두 개의 독립적인 버튼 카드를 표시한다. 기존 `scenarioSessionContent`는 사례 선택 전에는 숨긴다.
- `scenarioCaseRegistry`는 앱에 정적으로 포함된 두 시나리오 정의와 출처 링크만 사용한다. 임의 문자열을 기반으로 알 수 없는 사례를 실행하지 않는다.
- 사용자가 카드를 선택해야 `enterScenarioMode(definition)`가 호출되며, 시나리오 선택 화면 자체에서는 `scenarioRuntime.mode="normal"` 및 `session=null`을 유지한다. 단, 화면의 모드 버튼 표시는 ‘임상 시나리오’가 활성 상태이다.
- **다른 사례 선택**은 현재 답안·간호 행동 기록을 폐기하고 카탈로그로 돌아간다. 풀이 중 카드는 보이지 않으므로 실수로 다른 사례를 선택할 위험을 낮춘다.
- 일반 RAAS 모드로 돌아갈 때는 사례·답안·행동 상태를 초기화하고 기존 RAAS 계산·그래프·약물·진행 상태를 보존한다. 임상 모드를 재진입하면 카탈로그부터 다시 표시한다.
- 기존 v5.2 지식→해설→간호 행동→행동 해설→다음 문항/결과 흐름은 유지한다. 2문항과 3문항에서 문제 수와 점수는 정적 정의 길이로 계산한다.
- 사례별 출처 링크는 신뢰할 수 있는 고정 URL을 가진 카탈로그 등록값에 따라 교체한다. 새로운 사례에서는 문헌 2종을 모두 연결한다.
- 900px RAAS Canvas 및 생리변수·그래프 화면은 변경하지 않는다.

## 33.2 신규 HFrEF/MRA 사례

- 사례 ID `hf-mra-monitoring`, `schemaVersion=1`, `version=1`, `modelPolicy="reference-only"`.
- 증상이 있는 HFrEF 성인 환자의 MRA(스피로놀락톤) 시작 검토를 가정한 **교육용** 상황. 실제 환자 검사·약물 투여 결과값 없음.
- 지식 판단 2문항: (1) MRA 시작 전 혈청 K⁺/신기능·약물 확인, (2) 시작/증량 뒤 전해질·신기능 추적.
- 간호 행동 2문항: (1) 기초검사 확인·의료진 의사소통, (2) 추적검사·재진 일정 확인 및 환자 교육.
- 지식 2×3지선다 + 간호 행동 2×3지선다 = 총 12개 정적 선택지별 해설. 기존 CKD 사례의 3+3문항은 변경하지 않는다.
- 근거 `aha-2022`: AHA/ACC/HFSA 2022 심부전 가이드라인 §7.3.3. 증상 있는 HFrEF에서 MRA 선택 시 eGFR >30 mL/min/1.73 m², 혈청 K⁺ <5.0 mEq/L 조건과 이후 모니터링 강조.
- 근거 `nice-2025`: NICE NG106, 2025 개정 권고 1.7.3–1.7.5. MRA 전 신기능/전해질 확인, 시작·증량 후 1~2주 검사, 최대 내약 용량에서 안정된 뒤 3~6개월 정기 검사 및 신기능 위험 시 추가 평가.
- 위 조건은 권고문의 의학적 처방 기준 설명이며, 시뮬레이터가 실제 처방 적합성이나 투여 여부를 판단하지 않는다.

## 33.3 회귀·검증 기준

- 같은 사례의 `다시 풀기`는 지식·행동 답안만 초기화하고 카탈로그로 돌아가지 않는다.
- 서로 다른 사례의 `question.id`가 우연히 같더라도 답안이 남지 않도록 `enterScenarioMode` / `exitScenarioMode`와 `resetScenarioActions`로 경계를 보장한다.
- 새로운 모드 진입 때 경로 시연 타이머를 일시정지하고 기존 재생 인덱스를 보존한다.
- 기존 v5.2 자기 테스트는 `backups/v5.2.html`을 대상으로 고정, 신규 `tests/regression-v5.3.cjs`는 선택 전 진입 차단·두 사례 전체 풀이·다른 사례 전환·각 원문 URL·정답/오답·과거 모델 일치성을 검사한다.
- 실제 브라우저 및 모바일·키보드 시각 검증을 완료로 처리하지 않는다.


---

# 34. v5.4 시나리오 학습 정보 계층·진행 표시 보호 규칙

## 34.1 변경 범위

- 두 사례의 카드에서 주제·문항 수와 시작 안내를 분리해 표시하며, 사례 선택과 답안 초기화 이벤트 흐름을 변경하지 않는다.
- 풀이 중 `scenarioActiveCaseLabel`은 등록된 시나리오 정의의 제목을 반영한다. 현재 선택 사례는 카탈로그로 돌아간 뒤에만 교체할 수 있다.
- `scenarioLearningProgress`는 기존 세션 답안 `scenarioRuntime.session.answers`, 간호 행동 `scenarioActionAnswers`, 현재 해설/행동 표시 단계 `scenarioActionPhase`와 `scenarioLatestFeedback`에서 **계산만** 한다. 새 진도 저장소나 임상 판단 상태를 생성하지 않는다.
- 진도 완료 수는 각각 답안이 기록된 개수이며, 학습 진행 안내이지 임상 안전성이나 간호사 자격을 평가하는 지표가 아니다. 답안을 재시작·종료·사례 전환하면 기존 정책대로 초기화하고 표시도 파생해 갱신한다.
- 해설은 기존 문항의 근거·선택·환자 교육 문구를 유지하되 정답/행동 근거와 간호 행동의 세 후속 항목을 의미별로 구획한다. 새 검사·투약 결론 또는 수치 계산을 추가하지 않는다.
- 좁은 화면의 개선 범위는 `scenario-view`와 그 자손의 카드·버튼·해설에 한정한다. 일반 RAAS Canvas, 그래프, 생리 수치, 시연 타이머, 설명서 모달은 수정하지 않는다.

## 34.2 테스트 및 미완료 항목

- `tests/regression-v5.3.cjs`의 역사적 실행 대상을 동결 `backups/v5.3.html`로 옮기고, 새 `tests/regression-v5.4.cjs`는 `index.html`을 시험한다.
- 기존 v4.5~v5.3 7,355항목과 v5.4 804항목, 총 8,159항목의 결정적 자동 검사 통과. 범위는 V8/메모리 fs 어댑터 및 모의 DOM/Canvas이며, Node.js CLI와 실제 브라우저 수동 시각·포커스·터치·스크린리더 검증 완료를 뜻하지 않는다.
- 단계별 설명의 탭/아코디언 선택, 일반 모드 모바일 Canvas 화면 구성 및 별도 UX 설계는 추후 사용자 결정 대상이다.

---

# 35. v5.4.1 일반 RAAS 학습 패널 아코디언

- 기존 `stageDetailPanel`의 제목·간단 요약·닫기 버튼·학습 안내는 그대로 유지한다.
- 정보는 세 개의 **native HTML details/summary** 그룹을 사용한다.
  - `stageMechanismDetails` (기전): 학습 설명, 의학·생리학 심화, 교육용 단계 생리 효과. 처음에 **열림**.
  - `stageNursingDetails` (간호 사정): 간호 사정·안전 포인트. 처음에 **닫힘**.
  - `stageDrugsEvidenceDetails` (약물·근거): 연관 약물 학습, 연관 약물 효과, 기존 근거 표기. 처음에 **닫힘**.
- 각 그룹은 서로 독립적으로 열고 닫을 수 있다. 단계 이동·학습 패널 닫기 이후에도 열림 상태는 HTML 요소에 유지되며, 새로고침 시 초기 상태로 돌아간다. 별도 저장·채점·학습 진행 상태를 만들지 않는다.
- 기존 `stageDetailLearning` / `stageDetailClinical` / `stageDetailEffect` / `stageDetailNursing` / `stageDetailDrugClinical` / `stageDetailDrugs` / `stageDetailEvidence` DOM ID를 각각 정확히 한 번만 유지한다.
- `showStageLearning()`·`closeStageLearning()` 및 Canvas·생리·약물·그래프·시연·임상 사례 로직은 변경하지 않는다. v5.4와 `<script>` 본문이 일치해야 한다.
- 출처 및 교육용 생리 효과는 정보용이며 실제 환자 반응의 예측값이 아니다.
- `tests/regression-v5.4.cjs`는 동결 `backups/v5.4.html`을 대상으로 하고 새 `tests/regression-v5.4.1.cjs`가 현재 `index.html`을 검사한다.
- V8/모의 DOM·Canvas 기준 역사적 8,159개 + 신규 1,491개 = **9,650개** 통과. 브라우저 실제 native details 상호작용과 키보드·모바일·스크린리더 확인은 별도 미완료.

---

# 36. v5.5 3영역 학습 UX·세션 보존 계약

## 36.1 화면 계약

- `normalStudyView`: ① 시뮬레이터, 기존 9단계 Canvas / 계산 / 약물 / 그래프 / 시연 / v5.4.1 아코디언.
- `learningStudyView`: ② 학습, 기존 `stageData` (9단계) · `clinicalStageNotes` (기전/간호/근거) · `drugData` 및 `clinicalDrugNotes` (6종 약물)을 **읽기만** 한다. 사용자의 단계·약물 학습 드롭다운은 시뮬레이터의 `state.drug` 또는 `state.currentStep`을 수정하지 않는다.
- `scenarioStudyView`: ③ 임상 적용, 기존 스키마 1·두 임상 사례·근거·채점 유지. 기존 `normalModeButton`, `scenarioModeButton` ID 보존; `learningModeButton` 추가.
- 탭 전환은 화면의 `hidden`·`aria-pressed` 표시만 갱신한다. 시뮬레이션 자동 시연이 켜진 상태에서 다른 탭으로 이동하면 일시정지하고 시연 위치는 보존한다.

## 36.2 임상 학습 표시

- 사례별 환자 상황·학습 목표 접이식 블록, '환자 파악 → 임상 판단 → 간호 행동 → 결과 복습' 로드맵, 단계별 현재 할 일 안내를 제공한다. 지표는 기존 `scenarioRuntime.session`, `scenarioLatestFeedback`, `scenarioActionPhase`, `scenarioActionAnswers`에서 파생한다.
- 질문과 간호 행동 선택 후 **원래 질문 + 내 선택 + 권장 답안**을 각각 제목과 카드로 표시한다. 정오답 판단 및 해설·출처는 기존 시나리오 정의를 참조하며 답안 판정 함수를 변경하지 않는다. 근거·간호 사정/보고·교육·서지 표기는 접이식 `details`로 확인한다. 색상만으로 정오답을 구분하지 않는다.
- 결과는 문항별 카드와 정오답 라벨을 표시한다. 현재 2개 사례의 최대 3문항을 담는 정적 카드 3칸이며, 향후 정의가 3문항을 초과하면 기존 전체 텍스트 복습을 추가 노출하여 내용 누락을 방지한다.
- 완료 화면에서만 볼 수 있는 `scenarioTakeawaysDialog`는 두 사례에 근거한 추가 사정·확인/보고·환자 교육의 간결한 교육 요약을 제공한다. 처방 적합성 판단이나 개별 환자 반응 예측을 하지 않는다.
- 설명서 `helpDialog`는 모든 탭에서 공통 접근하며 열었던 트리거에 포커스를 되돌린다. 기존 시뮬레이터용 `helpOpenButton`도 유지한다.

## 36.3 세션·초기화 경계

- **탭 이동 ≠ 학습 종료:** `switchStudyMode("normal"|"learning"|"scenario")`는 `showClinicalCaseCatalog()` / `exitScenarioMode()`를 호출하여 활성 세션을 초기화하면 안 된다.
- **명시적 종료:** `scenarioRestartButton`은 같은 사례의 지식·간호 행동 답안 초기화, `scenarioBackToCasesButton`은 사례 세션 종료 후 카탈로그 표시, `scenarioExitButton`은 명시적 종료 및 시뮬레이터 복귀.
- 새로고침/새 페이지는 임상 세션을 보존하지 않는다. 영구 저장, 브라우저 스토리지, 서버 저장 없음.
- 시뮬레이터의 기존 생리 계산 / Canvas / 약물 / 그래프 / 모달 / 시연은 영향을 받지 않아야 한다. 임상 사례의 문항 내용·정답 데이터·참고문헌 ID와 `SCENARIO_SCHEMA_VERSION=1`은 동결한다.

## 36.4 검증·미완료

- 기존 v4.5~v5.4.1: **13개 스위트 / 9,650개 모의 DOM/Canvas 검사** 통과.
- 신규 `tests/regression-v5.5.cjs`: **701개 검사** 통과. 7개 약물 상태, 단계 조회, 탭 전환 후 모델 일치, 2개 사례 전체 풀이 및 답안 보존, 오답 비교와 문헌, 간호 행동, 결과·팝업, 되풀기/종료, 시연 일시정지를 확인.
- 총 **14개 스위트 / 10,351개** 자동 검사 통과. 실행 환경은 V8 + 메모리 fs 어댑터 + 가상 DOM/Canvas; Node.js CLI / 실제 브라우저 레이아웃·포커스·모바일 키보드/터치·스크린리더는 별도 수동 확인 필요.

---

# 37. v5.5.1 콘텐츠 중심 설명·모델 안내 분리

## 37.1 학습 텍스트 계약

- 학습과 시뮬레이터 단계 상세 설명은 동일한 `stageData.learningDetail`, `clinicalStageNotes`·`clinicalDrugNotes`를 계속 사용한다.
- 단계 학습 본문에서 프로그램 내부 계산/수치 미적용/K⁺ 미계산 등 시스템 설명을 반복하지 않는다. 대신 RAAS 자극·효소·수용체·체액량 조절의 **의학/생리학 내용**과 임상적 사정의 의미를 우선한다.
- 학습 본문에서 모델 주의사항을 덜더라도 혈압의 반드시 정상화되지 않음, 혈청 Na⁺ 농도와 체내 총 Na⁺ 보유량의 구분, K⁺ 및 신기능 추적과 안전한 보고 원칙 등 **임상적으로 중요한 의미는 보존**한다.
- 임상 두 사례의 `questions`/ `choices`/ `correctChoiceId`/ `feedback`/ `rationale`/ `references` 등 평가·근거 콘텐츠는 변경하지 않는다. `caseContext` 및 `observations`의 중복 '교육용/가상' 수식과 안내문은 간결화할 수 있다.
- 단계 생리 효과값(`stageData.effect`), 약물 계산(`drugData`), 병태생리 엔진, 그래프, 시나리오 세션/스키마는 보존한다.

## 37.2 도움말 접근성과 안전 계약

- `modelPolicyButton`은 모든 3영역 공통 상단에서 `modelPolicyDialog`를 연다. 그래프 옆 `graphPolicyButton`도 동일 모달을 연다. 닫기·Esc·팝업 바깥 클릭 후 초점은 실제 실행한 버튼으로 복귀한다.
- 모달은 가상 생리값, 시간축이 아닌 9단계 그래프, 총 체내 Na⁺와 혈청 농도의 차이, K⁺ 미계산/GFR 고정값, 실제 환자 반응과 '혈압 회복'의 구별, 실제 처방·검사 결정 및 역량 평가에 사용할 수 없는 임상 교육 자료라는 주의를 포함한다.
- 일반 교육 본문과 단계별 심화 영역에서 모델 수치를 숨길 때는 `stage-model-note`를 별도 접이식 UI로 제공하여 기존 `stageDetailEffect` ID와 정량 교육 정보를 유지한다.
- 임상 적용의 환자 정보·필수 안전 문구는 간결하게 유지하며 사용자 오용 가능성이 높은 안내를 모두 제거하지 않는다.
- 팝업을 열거나 닫을 때 `state`, `physiology`, `scenarioRuntime`, `scenarioActionAnswers`, 약물 적용 상태는 변경하지 않는다.

## 37.3 검증

- `tests/regression-v4.7.cjs`와 `tests/regression-v5.5.cjs`는 각각 자기 버전 동결 백업에 고정해 미래 UI 문장 수정과 역사적 계산 회귀의 비교를 분리한다.
- 기존 v4.5~v5.5 14개 스위트 **10,351항목** 및 v5.5.1 신규 **519항목**, 합계 **15개 스위트 10,870항목 통과**.
- V8 + 메모리 파일시스템 + mock DOM/Canvas 자동 검사이며, 실제 Node.js CLI와 브라우저 모달·키보드/모바일·시각/접근성 검증은 별도로 완료해야 한다.

---

# 38. 사용자 승인 v6.0 이전 로드맵 계약 (계획 / 미구현, 2026-10-13)

> 공식 단일 원본: [ROADMAP.md](ROADMAP.md). 이 절은 **향후 구현할 기능의 승인 요구사항 및 보호 경계**이며, v5.5.1 현재 기능이 이미 완료되었다는 의미가 아니다.

## 38.1 확정된 교육·화면 UX 선택

- **학습:** 안내형 학습 코스와 자유 탐색을 병행한다. 기존 9단계·약물 6종 교육 데이터가 기준이고, 5단원은 학습용 그룹으로만 사용한다. 코스 진행이 자유 탐색이나 임상 세션을 차단하지 않아야 한다.
- **모바일:** 좁은 화면에서 RAAS 단계 카드 중심으로 제시하고 전체 Canvas는 별도 탐색한다. 데스크톱의 900px Canvas를 단순 축소하지 않으며, 카드/Canvas 양쪽 조회는 `state.progress`나 `physiology`를 불필요하게 변경하지 않는다.
- **개발 방향:** 기존 기능 안정성, 학습 효과, 가독성과 실제 브라우저 검증을 새 환자 사례·생리 변수 추가보다 우선한다.
- **임상 적용:** 오답 우선·정답 접기, 전체 사례 및 문항 내 진행 구분, 출처 직접 조회, 틀린 개념 → 학습 단계·약물 이동 → 동일 임상 답안 유지, 동적 복습 목록.
- **콘텐츠 계층:** 핵심 기전→임상·간호 의미→심화·근거 순서. 중복 시스템 설명은 보조 안내로 제공하되 임상 안전에 필수인 K⁺·신기능·환자 상태·처방 확인은 남긴다.

## 38.2 버전·회귀·임상 계약

- `v5.5.2`는 화면 제목이 아직 v5.3인 버그와 과거 설명서 표현을 먼저 해결한다. **문서화 커밋만으로 앱 버전을 올리지 않는다.**
- `v5.6`은 반응형 레이아웃과 Canvas 좌표/키보드/터치/그래프 품질을 대상으로 하며, 임상 채점·약물·생리 계산식 변경과 분리한다.
- `v5.7`은 콘텐츠 재사용과 학습 자유 탐색, `v5.8`은 현재 두 사례의 복습 UX, `v5.9`는 모델 표기·의학적 정확성·단일 HTML 유지보수와 실제 브라우저 품질에 집중한다.
- 기존 임상 시나리오 `questions`/정답/근거, RAAS 단계·약물 6종, 진행·시연·그래프, `modelPolicyDialog`, 세 탭 간 답안 유지/명시적 초기화/새로고침 초기화가 보호 대상이다.
- Na⁺/GFR 등의 라벨을 변경하기 전에 현재 표시값·단위·모델 한계를 검증한다. **기존 계산식을 검증 없이 실제 혈청 Na⁺/GFR의 생리적 예측이라고 재해석하거나 변경하지 않는다.**
- 완료 게이트는 [ROADMAP.md](ROADMAP.md)의 v6.0 진입 기준에 따른다. 역사적 모의 DOM/Canvas 15개 스위트, 10,870개 검사는 기준선이며 **실제 브라우저 검증 완료로 간주하지 않는다**.

## 38.3 변경 수행 원칙

각 버전의 설계→영향 검토→작은 코드 패치→신규/전체 회귀→브라우저 검증(가능 범위)→문서·백업→PR→main 확인 순서를 적용한다. 신규 버전의 구체적인 화면 배치/근거 표현이 새로운 중요한 UX 결정을 낳을 경우 추천안·대안을 설명한다. 이미 승인된 위 세 선택을 반복 확인하지 않는다.

---

# 37. v5.5.2 메뉴·버전·설명서 유지 계약

- `<title>`, `<h1>`, 임상 적용의 현재 버전 배지는 모두 `v5.5.2`이며 과거 버전의 패치 내역은 역사 기록으로 보존한다.
- `.study-mode-primary`에는 시뮬레이터/학습/임상 적용 버튼, `.study-mode-secondary`에는 사용법/모델·안전 버튼을 표시한다. `role=group`은 화면 독해와 키보드/보조공학 구분만을 위한 것이며, 기존 이벤트/상태 전환을 대체하지 않는다.
- `helpDialog`에서 사용 중인 상위 명칭은 **시뮬레이터/학습/임상 적용**이다. 답안 보존/명시적 초기화/시연 일시정지를 명확하게 유지한다.
- v5.5.1의 JavaScript 엔진, RAAS 9단계, 약물 6종, 4개 변수/그래프, Canvas/키보드, 모든 임상 질문·정답·출처·모달/탭 세션 이벤트는 변경하지 않는다.
- 기존 Canvas 900px/레이아웃 1100px는 v5.6 모바일 적응 전까지 미해결이다. 수동 브라우저 QA와 자동 헤드리스 Chromium 결과를 혼동하지 않는다.
