# v6.0 후보 검증

기준 SHA `8586ea555fc875ff47c13eff64dad7f8104494b7`. 실행 환경 Linux, Node 24.19.0, Playwright 1.56.0, Chromium 141. 로컬 검증이며 GitHub Actions 통과 주장 아님.

| 검사 | 결과 | 범위 |
|---|---|---|
| 기존 Node 18스위트 | PASS 11,097 checks | 역사적 회귀/기존 기능 |
| regression-v6.cjs | PASS 10 checks | 두 inline script 문법, 모델/약물/임상/학습/Lab 자료 동일, 현재 후보 백업 동일 |
| browser-v5.5.2.cjs | PASS 33 checks | 동결 v5.5.2 Canvas·키보드·모바일 |
| browser-v5.9.cjs | PASS 56 checks | 동결 v5.9 시나리오·모바일·Lab |
| browser-v5.9.1.cjs | PASS 103 checks | 현재 v6 화면의 가독성/그래프/학습/두 임상 사례/왕복 |
| RAAS_TEST_TARGET=index.html browser-v5.9.cjs | PASS 56 checks | 현재 v6 화면의 전체 CKD 3+3, HFrEF 2+2, Lab 게이트·오답 복습 |
| browser-v6.cjs | PASS 212 checks | 허브/16항목/9단계 실습/순수 엔진 결과/전후 상태/7단계 투어/키보드/ESC/복귀/부재 대상/320~1440px/reduced motion |
| B+ scope self-test | PASS | CI 분류 검사 |
| 실기기·Safari·수동 스크린리더·의료전문가·학생 학습 효과 | NOT RUN | 별도 검토 필요 |

200% 확대는 720 CSS px 축소 뷰포트 상당 조건만 자동 검사했다. 실제 브라우저 확대 UI·실기기 터치·스크린리더 낭독 검증은 NOT RUN이다. 데스크톱/모바일 캡처를 직접 확인했다. 시각적 검토는 사용자 디자인 승인과 구별한다.

역사적 v5.9.1 소스 계약은 동결 백업에서 계속 검사한다. 후보 버전의 무결성과 데이터 불변은 새 regression-v6가 검사한다. 기존 검사/assertion을 삭제하지 않았다. v5.9 브라우저 검사는 동결 기본 경로를 유지하며 현재 화면에 실행할 때 v5.9.1부터 도입된 자유 탐색 주제 버튼을 사용한다.

재현: `for test in tests/regression-*.cjs; do node "$test" || exit; done` 이후 네 browser 스위트 및 `RAAS_TEST_TARGET=index.html node tests/browser-v5.9.cjs`. Playwright 설치는 기존 CI와 같은 1.56.0. 별도 빌드 없이 index.html 직접 실행 및 file:// Chromium 검증.

스크린샷: `artifacts/v6/`의 home/learning/simulation/clinical 390·1440px, practice 및 tutorial 1440px. 후보 백업: `backups/v6.0-candidate.html`; 안정 기준 백업 v5.9.1은 변경하지 않음.

리팩터링 판정: 국소 UI 어댑터만 추가. 도메인 엔진 복제 없이 실습 상태를 분리했으며 광범위한 모델 모듈화는 현재 목표에 실익이 없어 보류한다. 신규 공통 키트는 설계 계약이며 다른 프로젝트 엔진을 합치지 않는다.

잔여: GitHub API 접근이 Forbidden으로 차단되어 PR 생성 미완료. Git 읽기/작업 브랜치 푸시는 성공. 기존 인증을 교체하거나 토큰을 요청하지 않았다. 환경 설정 초안에 api.github.com 허용 추가를 저장했다. main 병합 없음.
