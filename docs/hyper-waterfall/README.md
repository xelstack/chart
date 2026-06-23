# Hyper-Waterfall 문서

이 디렉터리는 rhwp의 Hyper-Waterfall 문서 체계를 chart library 프로젝트에 맞게 적용한다.

목적은 의도, 결정, 피드백, 기술 조사, 실패 이력을 보존해 새 AI 세션이 채팅 기억에 의존하지 않고 작업을 이어갈 수 있게 하는 것이다.

## 구조

```text
docs/hyper-waterfall/
  orders/           일일 작업 지시서: 지금 무엇을 할 것인가.
  plans/            수행계획서와 구현계획서.
  working/          단계별 완료보고.
  reports/          작업 최종보고서.
  feedback/         사람의 리뷰, 교정, 도메인 피드백.
  tech/             기술 조사와 결정.
  troubleshootings/ 실패 분석과 복구 기록.
  skills/           프로젝트 로컬 agent skill.
```

## 게이트 규칙

구현은 다음 조건을 모두 만족한 뒤 시작한다.

1. 작업 지시서가 있다.
2. 수행계획서가 있다.
3. 구현계획서가 있다.
4. 사람이 계획을 승인했다.
