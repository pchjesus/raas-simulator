# feat: redesign RAAS learning entry, guided concepts and ACEi observation

초심자가 학습을 시작할 위치와 조작 결과의 의미를 찾기 어려웠던 흐름을 학습 허브→16항목의 목표·작용 위치→예상/관찰→기존 임상 사례로 연결합니다. 기존 3탭의 직접 이동과 900×380 Canvas/원본 그래프, 6종 약물, 모든 임상 문항·답안·공개 게이트를 유지합니다.

읽기 전용 실제 DOM 투어는 종료 시 화면·초점을 복귀합니다. ACEi 비채점 실습은 기존 순수 계산을 사용하고 메인/임상 상태를 쓰지 않습니다. RAM 세션 정책을 유지합니다. 공통 Learning Experience Kit은 설계 계약만 제공합니다.

검증: 기존/신규 Node 19스위트 11,107 checks, Chromium 460 checks 통과. 상세 결과·환경·NOT RUN 항목은 docs/QA_V6_LEARNING_EXPERIENCE.md. 캡처는 artifacts/v6/. 안정/후보 백업 모두 보존.

사용자 디자인 검토 전 main 병합 금지. 실기기/Safari/수동 스크린리더/전문가/학생 학습 효과는 NOT RUN. 화면 디자인·정보 밀도·튜토리얼 위치·예측 실습의 이해도를 검토해 주세요.
