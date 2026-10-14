# RAAS Simulator v5.7–v5.8: 교육·Lab 통합 상세 설계 (2026-10-14)

> 기준: v5.5.2 `main`. 구현 범위는 v5.6 반응형 → v5.7 학습 → v5.8 임상 → v5.9 검증. 이 문서는 구현 완료의 증명이 아니다.

## 1. 기존 코드 확인
- 학습 `learningStudyView`: 9단계 선택과 6약물 선택은 독립적인 read-only UI; `renderLearningLibrary()`가 원본 `stageData`, `clinicalStageNotes`, `drugData`, `clinicalDrugNotes`를 읽는다.
- 임상: `scenarioRuntime.session.answers`가 판단 답안, `scenarioActionAnswers`가 행동 답안을 저장한다. `scenarioLatestFeedback` / `scenarioActionPhase`는 문제별 해설 위치를 보존한다. `switchStudyMode`는 이를 유지하지만 복습에서 학습 이동/복귀는 미지원이다.
- 기존 2사례: CKD+ACEi 3판단/3행동, HFrEF+MRA 2판단/2행동. `observations`는 검사 **수치 미제시**로 명시한다. 판단·행동 문제에는 검사 기록 누락을 전제로 하는 문제가 있다.
- 결과 복습은 최대 3개 고정 DOM 슬롯 + 초과 시 일반 텍스트 fallback. 오답 정렬과 관련 학습 연결이 없다.
- RAAS의 Na⁺/GFR/BP 등은 임상 검사 예측값이 아닌 단순화 모델. 임상 Lab에 절대 바인딩 금지.

## 2. v5.7 수용 기준
1. 코스 5단원(활성 조건, 전환, 알도스테론/수분/혈압, 6약물, 최종정리), 내부 9개 단계 및 6약물 원본 참조.
2. 안내 코스와 자유 탐색을 명확히 구분하되 자료는 동일. 코스 진도는 학습 로컬 상태만 변경. 자유 탐색은 코스 진도/시뮬레이터의 `state.progress`/`state.drug`/`physiology`/임상 세션 불변.
3. 한 번에 한 단원/항목을 우선 표시하고, 긴 본문은 핵심 → 안전한 간호 확인 → 심화/출처 disclosure. 근거는 확인된 공식 URL만 사용.
4. Lab 참고 항목은 K⁺(혈청), 혈청 Cr, eGFR, BP, UACR을 적응증·약물과 연결하되, 정상범위는 기관/검사법·환자 상황에 따라 달라질 수 있음을 표시. `eGFR`은 계산 수치이며 혈액검사 직접 측정 항목이 아님; BP는 활력징후.
5. 메뉴·긴 용어·출처 링크는 320px/200%, 키보드 접근에서 겹치지 않는다.
6. 학습 복귀가 상위 메뉴 전환과 달리 임상 답안을 지우지 않아야 한다.

## 3. v5.8: 의학/데이터/채점 분리
### 사례별 Lab 매핑 및 정보 공개 규칙
- **원래 임상 판단→기존 간호 행동**의 질문·선택지·답안은 수정하지 않는다. 검사 미확인 전제의 문항이 있으므로 원래 답안을 제출하기 전에 가상 Lab을 보여주지 않는다.
- 문제별 행동 **해설 후**에 `별도의 추가 평가 시점에서 확보된 가상 검사 예시`를 보여준다. 원래 문항의 검사 결과가 소급 제공된 것처럼 설명하지 않는다. 필요한 문항에만 표를 제공한다.
- Lab은 정의된 정적 시나리오 자료이며 `calculatePhysiology...` / Canvas / 약물 적용 / 실제 환자 예측값과 독립.
- CKD ACEi monitoring / follow-up: 기저 및 가상의 후속 Cr, K⁺, eGFR 변화와 검사 시점. dual-raas: 잘못된 병용을 식별하는 **약물 목록**이 핵심이므로 Lab 숫자 카드 생략(임상 관련성 우선).
- HFrEF MRA safety: 별도 추후 검사값의 K⁺/eGFR을 확인한 위험 상황, 처방자가 적합성 판단. MRA followup: 기저/후속 검사 비교 및 재검·보고 필요성. MRA 시작 권고의 eGFR>30, K⁺<5.0(2022 AHA/ACC/HFSA)와 투여 중 K⁺ 5.5 미만 유지 요건을 혼동하지 않는다.
- 정보는 `시점`, `항목`, `결과 및 단위`, `참고/비교`, `간호 해석`, `출처`로 분리. eGFR을 Cr에서 자동 계산하지 않는다. 가상의 수치들이 수학적으로 유도된 관계라는 주장은 금지.
- 환자 치료·용량·중단 자동권고 금지. 이상 시 재검/상태 확인/처방·기관 지침 확인/담당 의료진 보고를 우선. 출처는 KDIGO 2024 §3.6, AHA/ACC/HFSA 2022 §7.3.3, NICE NG106(2025) §1.7.3–1.7.5.
### 복습 및 상태
- 모든 임상 판단·행동 문항을 동적 배열로 렌더링하고 **오답 우선 정렬**, 정답은 details로 접기. 문항 수 3개 제한 금지.
- 복습에서 `relatedStage`/`relatedDrug`의 curated mapping을 사용. 직접 선택하면 학습 탭에서 해당 위치를 열고, `임상으로 복귀` 버튼은 기존 `scenarioRuntime`, `scenarioLatestFeedback`, `scenarioActionPhase`, 답안 객체 변경 없이 탭 복귀.
- 복습 카드의 관련 학습은 임상 해설의 정확한 주제를 가리킨다. CKD dual-raas → ACEi/ARB; MRA-safety/follow-up → MRA 및 알도스테론 단계. 임의 자동 추천 금지.
- 결과 복습을 완료한 상태만 동적 목록 공개. 새로고침 초기화 유지; 명시적 사례 재시작/종료만 답안 삭제.
- 안전상 필수 해설/보고·추적은 접근 가능한 기본 텍스트, 추가 근거는 disclosure.

## 4. 중요 위험 및 대응
| 위험 | 영향 | 방어 |
|---|---|---|
| 모바일 1100/900px 고정 | 앱 밖 넘침/선택 누락 | v5.6 모바일 단계 카드와 별도 전체 Canvas 가로 탐색; 기존 900px Canvas 계산 좌표 불변 |
| 코스와 자유 탐색 상태 공유 오류 | 의도치 않은 학습 진도/시뮬레이션 진행 | 코스 전용 상태 및 선택 setter, 과거 엔진 불변 테스트 |
| 모든 Lab 동시 공개 | 문제 '검사 미확인'과 모순/정답 힌트 누출 | 기존 답안+행동 제출 **후** 별도 시점의 결과만 제공 |
| 생리 Na⁺와 혈청 K⁺ 혼동 | 의학적 오해 | 임상 Lab 정적 저장; 시뮬레이터 수치와 단위·표시구역·주석 분리 |
| 검사값과 지침의 상충 | 위해 가능 학습 | 의학적 검토, 문항별 근거 URL, 처방 자동결정 금지 |
| 검사 자료를 모든 문항에 일률 삽입 | 임상적 맥락 무관 | 관련 문항에만 Lab; dual-raas는 중복 처방 중심 유지 |
| 모바일 카드 정보 과잉 | 질문과 필수 위험 안내가 화면 밖 | 기본 필수 정보 상단, 보충 자료 접기, 선택지 44px+, 한 열 레이아웃 |
| 고정 복습 슬롯 | 4번째 이후 문항 누락 | DOM 동적 목록, 원본 정답 ID 기반 정렬 및 누락 검증 |
| 학습 이동/복귀 시 재초기화 | 임상 기록 손실 | 최상위 탭의 render-only 전환 사용; 현 세션 스냅샷 왕복 테스트 |
| focus 분실 | 키보드/모바일 사용자 길 잃음 | 호출 버튼/복귀 버튼 명시 및 focus, 모달 close 회귀검증 |

## 5. 검증 게이트
- 역사적 릴리스 검사는 각 동결 백업에서, 현 버전 검사는 index.html+동결 백업에서 실행.
- JS 구문, HTML ID 중복, 데이터·정답·출처 연결, 안전 문구, 신설 코스/임상 상태 테스트, 320/360/390/430/1365 Chromium, 키보드/Canvas/모달, 2사례 모든 판단/행동 경로 확인.
- '모의 DOM 검사', '실제 Node', 'headless Chromium', '실기기 모바일/Safari·수동 스크린리더'는 구분. 미수행은 미검증이며 v6.0 무조건 진입 금지.

## 출처
- KDIGO CKD Work Group (2024). KDIGO 2024 CKD guideline, §3.6. https://kdigo.org/guidelines/ckd-evaluation-and-management/
- Heidenreich et al. (2022). 2022 AHA/ACC/HFSA Guideline for the management of heart failure, §7.3.3. https://www.jacc.org/doi/10.1016/j.jacc.2021.12.012
- NICE (2025). NG106, §§1.7.3–1.7.5. https://www.nice.org.uk/guidance/ng106/chapter/recommendations
