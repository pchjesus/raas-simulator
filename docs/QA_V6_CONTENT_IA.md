# v6 후속 콘텐츠 IA — QA 및 리뷰

기준 `f4bbd9f41b84b6ac459bab5009050990558c1cff`, base `feat/learning-experience-v6`, head `feat/v6-learning-content-ia`. 설계/16항목 매핑: `DESIGN_V6_CONTENT_IA.md`. main 병합·배포 없음.

## 구현과 보존

항목별 질문/선행 개념/기전/비채점 활동/확인 근거/해석을 연결했다. 1~4 기전 추적, 5~9 인과 설명, 10~15 표적·감시 비교, 10의 기존 ACEi 실습, 16의 기존 임상 연결을 사용한다. 전체 경로는 펼치기로, 선택 메뉴는 자유 탐색에서 제공하며 진도는 유지한다.

시뮬레이터는 조회/진행/최대 도달/약물을 구분해 먼저 표시하고 Canvas→기존 조작→기전→현재값→그래프 순으로 배치했다. 기존 상세 기전이 열리면 중복 요약을 숨긴다. 현재값/단위와 모델 경계는 기본 표시하고 원본 계산 분해는 펼칠 수 있다. 임상 사정/보고/교육을 원래 답변 공개 게이트 안에서 기본 흐름에 배치했다. 문항·정답·Lab 값/공개 함수는 불변이다.

약물 표적 설명은 기존 visualization/clinicalDrugNotes를 읽고 모델상의 연관 위치와 구별한다. Loop/Thiazide에 NKCC2/NCC 및 RAAS 직접 차단 아님을 표시한다. Ang II의 복수 작용은 원본 clinicalStageNotes[4]를 기본 표시한다. 새 임상 값/정답/점수/숙달 판정 없음. 임상 검토는 기존 출처 연결/표현·모델 분리 코드 검토이며 전문가 검증을 의미하지 않는다.

## 실행 기록

Linux, Node 24.19.0, Playwright 1.56.0, Chromium 141. FAST → FOCUSED → FULL 순서로 실행. 아래 값은 현재 후보의 로컬 실행 결과이며 GitHub Actions와 별개다.

| 검사 | 결과 | 범위 |
|---|---|---|
| 기존 Node 18개 + v6 무결성 1개 | PASS 11,107 checks | 과거/현재 모델·자료·문법·새 후보 백업 |
| browser-v5.5.2 | PASS 33 | 동결 Canvas/키보드 |
| browser-v5.9 | PASS 56 | 동결 임상/모바일/Lab |
| browser-v5.9.1 | PASS 103 | 현재 후보 가독성/그래프/학습/두 임상 사례 |
| browser-v6 | PASS 212 | 현재 후보 실습/튜토리얼/상태 격리/포커스/좁은 화면 |
| browser-v5.9 (RAAS_TEST_TARGET=index.html) | PASS 56 | 현재 CKD 3+3 및 HFrEF 2+2 전체 문항·Lab 게이트·왕복 |
| browser-content-ia | PASS 198 | 16항목 원본/정보 순서/전후 상태/약물 표적/계산·그래프 비교/임상 간호 기본 표시 |
| B+ scope self-test | PASS | 분류 계약 |
| 실기기/Safari/수동 스크린리더/의학 전문가/학생 학습 효과 | NOT RUN | 별도 검토 |

확대는 기존 720 CSS px 상당 뷰포트 조건을 자동 검사했다. 실제 브라우저 확대 UI·기기·보조공학 검증은 NOT RUN. PhET/LOOPY 공식 사이트는 네트워크 403으로 내용 미확인; 외부 미감/팔레트/제어판을 가져오지 않았으며 사용자의 명시적 교육 구조 계약과 기존 승인 시각 지침을 적용했다.

`browser-content-ia`는 이전 v6 후보와 모든 7개 약물 가정×10개 진행 위치의 계산 결과 및 4변수 그래프 series, Canvas/그래프 bitmap을 직접 비교한다. 신규 질문은 채점되지 않고, 원본 16항목의 간호/출처 연결을 검사한다. 모바일 320/360/390/430px·데스크톱, 실습 전 공개 금지·메인 상태 격리, 투어 후 임상 기록 보존을 확인한다.

## 증거·변경 파일·리뷰

스크린샷: `artifacts/content-ia/learning-{390,1440}.png`, `simulation-{390,1440}.png`, `clinical-{390,1440}.png`, `practice-1440.png`, `tutorial-1440.png`. 직접 시각 확인했으며 사용자 디자인 승인을 뜻하지 않는다. 원래 v6 스크린샷/백업은 보존했다. 현재 실행물과 `backups/v6.0-content-ia.html`은 동일하다.

변경 파일: index.html, 새 후보 백업, tests/browser-content-ia.cjs, tests/browser-v6.cjs(ACEi 진입 및 캡처 경로), tests/regression-v6.cjs(최신 백업 연결), .github/workflows/raas-v5.5.2-qa.yml(후속 base/신규 검사), README.md, SPEC.md, DEVLOG.md, docs/DESIGN_V6_CONTENT_IA.md, docs/SIMULATOR_LEARNING_EXPERIENCE_KIT_v0.1.md, 본 QA 및 PR 설명, 신규 캡처. 기존 assertion/안전 검사를 제거하지 않았다.

리팩터링: 국소 UI 재배치와 16항목 프롬프트 매핑으로 제한했다. 원본 데이터/엔진/임상 컨트롤러를 재작성하지 않았으며 광범위한 분리는 보류한다. 스킬의 추가 project-health 참조는 제공 경로에서 읽을 수 없어 현재 source/diff/회귀 근거로 판단했다.

사용자 리뷰: 질문과 활동의 적절성, 전체 경로의 선택 공개, 실제 표적/모델 표기의 명확성, 기본 간호 정보와 세부 근거의 균형. 기존 v6 브랜치 대상 PR이며 main 병합·공개는 디자인 검토 후 별도 진행한다.
