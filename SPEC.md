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

* 사용 설명서 시스템
* Canvas 클릭 학습
* 단계별 상세 팝업
* 생리 변화 그래프
* 임상 시나리오 모드
* 모바일 전용 인터페이스
* 약물 차단 로직의 재설계

향후 버전에서 별도로 구현한다.

---

# 20. Codex 작업 규칙

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
