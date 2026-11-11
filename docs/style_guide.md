# 오늘의 장바구니 스타일 가이드

기준: `docs/plan.md` 전체, 특히 2·4·5·7절. 이 문서는 디자인 명세이며 구현 완료를 뜻하지 않는다. 서비스명은 사용자 확정 이름인 오늘의 장바구니를 사용한다.

## 1. 디자인 원칙

1. **재료와 수량을 먼저 읽는다.** 그래서 화면에서는 재료명·총량을 첫 줄, 사용 메뉴·메뉴별 수량을 다음 줄에 놓고 숫자는 오른쪽 정렬한다.
2. **누적한 선택이 보인다.** 그래서 화면에서는 `추천 메뉴`·`장보기 목록` 상단에 `선택 메뉴`를 놓고 식재료·추천 방식 변경 후에도 유지한다.
3. **추천 근거와 데이터 한계를 구분한다.** 그래서 화면에서는 실제 활용 재료·추가 일반 재료 수만 표시하고 `수량 미기재`와 서로 다른 단위를 그대로 보여준다.

디자인 취향 입력은 예시만 있고 선택된 값이 없는 것으로 해석한다. 깔끔하고 믿음직한 생활 도구 분위기, 초록 계열, 밝은 화면만 사용, 사진 없이도 완성되는 텍스트 중심 디자인을 채택한다 **(가정)**. 특정 참고 서비스는 지정하지 않는다 **(가정)**. 아래의 배치·크기·색·기본 선택값 중 계획서에 없는 값은 디자인 구현을 위한 **(가정)**이다.

## 2. 색상

| 이름 | HEX | 쓰는 곳 |
|---|---|---|
| 주색 | #166534 | 주요 버튼, 선택 탭, 체크 표시, 링크 |
| 보조색 | #DCFCE7 | 선택 재료·선택 탭 배경; 글자는 #166534 |
| 배경 | #F8FAFC | 페이지 전체 |
| 면 | #FFFFFF | 카드, 입력칸, 헤더 |
| 글자 | #0F172A | 본문, 제목, 수량 |
| 흐린 글자 | #475569 | 설명, 메타 정보, 비활성 글자 |
| 테두리 | #64748B | 입력칸, 버튼, 체크박스 경계 |
| 성공 | #166534 | 저장·복사 성공, 배경 #DCFCE7 |
| 경고 | #854D0E | 저장 불가 안내, 배경 #FEF3C7 |
| 오류 | #B91C1C | 오류·위험 버튼, 안내 배경 #FEE2E2 |

추가 상태 색: 주색 hover #14532D, pressed #052E16, 위험 hover #991B1B, 위험 pressed #7F1D1D, 보조 hover #F1F5F9, 보조 pressed #E2E8F0, 비활성 배경 #E2E8F0. 다크 테마는 제공하지 않는다 **(가정)**.

WCAG 상대 휘도 공식으로 계산한 대비(소수 둘째 자리 반올림): #0F172A/#FFFFFF 17.85:1, #475569/#FFFFFF 7.58:1, #475569/#F8FAFC 7.24:1, #FFFFFF/#166534 7.13:1, #166534/#DCFCE7 6.49:1, #854D0E/#FEF3C7 6.15:1, #B91C1C/#FEE2E2 5.30:1, 비활성 #475569/#E2E8F0 6.15:1. 본문은 4.5:1 이상, 컨트롤 경계는 3:1 이상을 유지한다. 광고 내부 디자인은 서비스 색으로 위장하지 않는다.

## 3. 글자

폰트: **Noto Sans KR**, 무료 상업 사용 가능한 SIL Open Font License 1.1. [Noto 공식 라이선스 안내](https://notofonts.github.io/noto-docs/website/use/). Google Fonts CSS로 400·600·700을 불러온다. 외부 폰트 통신과 관련한 고지는 실제 배포 조건에 맞춰 작성한다. 불러오기 실패 시 sans-serif로 즉시 읽을 수 있어야 한다.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap">
```

| 용도 | 크기 | 굵기 | 줄 간격 |
|---|---|---|---|
| 큰 제목 | 휴대폰 28px / PC 36px | 700 | 40px / 48px |
| 제목 | 22px | 700 | 32px |
| 본문 | 16px | 400 | 26px |
| 작은 글자 | 16px | 400 | 24px |
| 버튼 | 16px | 600 | 24px |

수량은 18px·700·28px, `font-variant-numeric: tabular-nums`. 모든 설명·오류·광고 라벨도 16px 이상. 한글은 `word-break: keep-all; overflow-wrap: anywhere`, 자간 0px. 고정 높이 텍스트 박스 및 말줄임으로 핵심 재료·수량을 숨기지 않는다.

## 4. 간격과 모양

사용자 승인 변경(2026-11-10): 아래 기존 기준 중 충돌하는 값은 다음 압축 명세를 우선한다. 본문·보조 글자는 16px 이상, 터치 영역은 48px 이상을 유지한다.

- 공통 패널 안쪽 12px, 섹션 간 16px, 버튼 사이 8px. 추천 카드 사이 8px, 카드 제목 18px/24px·700, 보조 정보 16px/24px·400. 내용이 길면 높이는 자동으로 늘어난다.
- 상단 헤더는 `position:sticky; top:0; z-index:10`, 로고 행 최소 48px + 내비게이션 행 최소 48px. 인원은 상단 설정 링크에서 한 번만 표시한다. 포커스 이동은 헤더 96px + 여백 16px을 고려한다.
- 추천 방식과 음식 종류는 각각 한 줄 가로 스크롤, 버튼 padding 8px 12px·높이 최소 48px·gap 8px·줄바꿈 없음. 음식 종류는 `aria-pressed`와 `✓`로 다중 선택을 표시한다.
- 추천 카드에서 큰 인분 경고 상자와 추천 번호를 제거한다. 제목·담기·`⋯`를 한 행, 인분·조리 유형을 다음 행, 핵심 추천 이유를 마지막 행에 놓는다. 추정 글자 #854D0E, 일반 보조 글자 #475569, 배경 #FFFFFF.
- 제외 관리창은 휴대폰 width 100%·height 100dvh·padding 16px·radius 0px, 768px 이상에서는 최대 폭 720px·높이 85dvh·radius 12px. 창 내부만 스크롤하며 검색 결과는 처음 10개와 10개씩 더 보기를 제공한다. 확인 문구·복원·취소·닫기는 48px 이상 클릭 영역을 유지한다.
- 추가 CSS 변수는 공통 `:root`에 `--compact-title:18px`, `--header-layer:10`, `--manager-width:720px`, `--compact-header:48px`, `--manager-desktop-height:85dvh`로 모은다.

- 간격 단계: 4, 8, 12, 16, 24, 32, 48, 64px. 제목-설명 8px, 필드 간 24px, 섹션 간 32px, 본문-푸터 48px.
- 모서리: 입력·버튼 8px, 카드·알림 12px, 재료 선택 버튼·메뉴 버튼 8px. 선 1px solid #64748B.
- 그림자: 일반 카드 없음; 확인창에만 `0 8px 24px #0F172A26`.
- 콘텐츠 최대 폭 1120px, 읽기 전용 본문 720px, 기본 설정 640px. 좌우 여백: 휴대폰 16px, 태블릿 24px, PC 32px. 카드 안쪽 16px(PC 24px).
- 헤더는 고정하지 않는다. 로고 행 최소 64px, 핵심 내비게이션 행 최소 48px. 콘텐츠 상단 여백 24px. 모달 외 z-index를 높이지 않는다.

## 5. 구성 요소

| 요소 | 크기·색 | 상태·동작 |
|---|---|---|
| 기본 버튼 | 최소 높이 48px, padding 12px 16px, #166534/#FFFFFF | hover #14532D, pressed #052E16; 비활성 #E2E8F0/#475569, disabled 적용 |
| 보조 버튼 | 최소 높이 48px, 흰 면·#166534 글자·1px 경계 | hover #F1F5F9, pressed #E2E8F0; 비활성은 기본과 동일 |
| 위험 버튼 | 최소 높이 48px, #B91C1C/#FFFFFF | hover #991B1B, pressed #7F1D1D; `새 장보기 시작` 확인에 사용 |
| 입력칸 | width 100%, min-height 48px, padding 12px, 글자 16px, 흰 면 | 선택/focus 2px #166534; 오류 2px #B91C1C + 아래 오류 문장; placeholder #475569 |
| 재료 버튼·탭 | min-height 48px, padding 12px, gap 8px, 기본 흰 면 | 선택 #DCFCE7/#166534 + 체크 아이콘 또는 3px 밑줄; 색만으로 선택 표현 금지 |
| 카드 | width 100%, padding 16px, gap 12px, 흰 면, 1px 경계 | 추천 카드 제목·이유·담기 순; 담기 직후 후보에서 제외·재계산, 중복 담기 차단 |
| 목록 행 | min-height 64px, padding 16px 0, 아래 1px 경계 | 재료명·총량 다음에 사용 메뉴; 구매 체크 후 위치·수량 유지, 재료명에만 취소선 |
| 체크박스 | 표시 24×24px, 클릭 영역 최소 48×48px | checked #166534 + 흰 체크; 체크 문구와 programmatic label 연결 |
| 알림 메시지 | padding 16px, radius 12px, 글자 16px, 아이콘 24px | 성공·경고·오류 색상 표 적용, 항상 설명 문장; 복사 성공만 4초 뒤 사라짐 |
| 빈 화면 | padding 24px, gap 16px, 흰 면 | 제목 22px·설명 16px·기존 화면 이동 버튼 48px; 장식 이미지 없음 |
| 불러오는 중 표시 | 텍스트 16px + 24px 회전 표시, 영역 min-height 96px | `재료를 불러오는 중이에요.` 등; aria-busy, role=status, prefers-reduced-motion에서 회전 중지 |
| 선택 메뉴 | padding 16px, 메뉴 버튼 min-height 48px, 줄바꿈 허용 | 버튼 `오징어볶음 · 1회`; 클릭 시 해당 버튼 아래 인라인 `− 1회 +`와 삭제 표시 |
| 횟수 편집 | −/+ 각 48×48px, 횟수 18px, gap 8px | 기본 1회, 1회에서 − 비활성; 삭제 별도 버튼, 인원 편집 없음 |
| 확인창 | width min(계산 가능한 가용 폭, 400px), padding 24px, radius 12px | `새 장보기 시작` 클릭에만 열림; 취소·확인 각 min-height 48px; 바깥 배경 #0F172A80 |

공통 focus-visible: `outline: 3px solid #166534; outline-offset: 3px`. 링크는 밑줄 1px, 색 #166534. 키보드 자동완성은 combobox/listbox, ↑↓ 이동·Enter 선택·Esc 닫기, 현재 결과와 개수 읽기 지원. 메뉴 횟수 펼침은 aria-expanded. 탭은 ←→로 이동, 활성 탭과 패널 연결. 확인창은 포커스 내부 유지·Esc 취소·닫은 뒤 호출 버튼으로 복귀한다. 초기 포커스는 취소에 둔다.

저장 실패 경고는 본문 제목 위에 지속 표시: `이 브라우저에 저장하지 못했어요. 지금 화면에서는 계속 사용할 수 있지만 다시 방문하면 내용이 남지 않을 수 있어요.` 손상 데이터는 `저장된 내용 일부를 읽지 못해 복구했어요. 선택 메뉴와 수량을 확인해 주세요.`로 실제 복구 결과와 일치시킨다. 오류로 전체 UI를 차단하지 않는다.

### 광고와 본문

- 승인 전 광고 슬롯·라벨·예약 공백 모두 숨김. 승인 후에만 wireframe에 지정된 자리당 1개 표시. 팝업·고정·전면 광고 없음 **(가정)**.
- 슬롯 위에 `광고`를 16px·#475569로 표시하고 위 경계 1px #64748B, padding-top 16px. 본문과 광고 간격 최소 32px.
- 광고 외곽과 모든 버튼·메뉴·체크박스·복사·더 보기의 클릭 영역 사이 최소 48px. 슬롯 뒤 푸터 링크도 최소 48px 이격. 버튼을 광고 옆에 배치하지 않는다. 이 수치는 서비스 배치 기준이며 광고 사업자 정책 충족을 보장하는 값은 아니다.
- 모바일 광고 컨테이너 width 100%, max-width 100%, 높이는 실제 광고 형식에 맞춰 지정. 광고가 본문을 덮거나 가로 스크롤을 만들면 해당 슬롯을 표시하지 않는다.

## 6. 화면 크기별 기준

| 구분 | 뷰포트 폭 | 달라지는 점 |
|---|---|---|
| 휴대폰 | 0~767px, 검증 기준 360px | 1열; 내비게이션 3등분·줄바꿈 허용; 탭은 3개 세로 배치; 주요 CTA 폭 100% |
| 태블릿 | 768~1023px | 추천 카드 2열·gap 16px; 추천 탭 가로 3등분; 글 본문 720px 이내 |
| PC | 1024px 이상 | 최대 1120px 가운데; 추천 카드 2열·gap 24px; 장보기 목록은 1열 유지; 버튼 width auto |

320px에서도 요소가 컨테이너 밖으로 나가지 않게 `min-width: 0`을 적용한다. 페이지·가이드·푸터는 높이 자동이며 본문 확대 200%에서 잘리지 않아야 한다. 모바일 고정 하단 바는 만들지 않는다.

## 7. 문구 말투

안내는 `~해요`, 버튼은 짧은 행동 명사·동사, 오류는 문제와 다음 행동을 함께 쓴다. 기존 화면·기능 이름은 그대로 사용한다.

| 종류 | 좋은 예 | 나쁜 예 |
|---|---|---|
| 버튼 | `추천 메뉴`, `목록 복사` | `마법처럼 최저가 식단 완성!` |
| 안내 | `추가 일반 재료 2종이 필요해요.` | `집에 있는 재료만으로 해결돼요.` |
| 오류 | `재료를 불러오지 못했어요. 다시 시도해 주세요.` | `오류 코드 E001` |

## 8. 코드에 적용하는 방법

HTML5 + CSS3에 맞춰 `css/style.css`에서 아래 값을 한곳에 관리한다. 외부 UI 프레임워크·빌드 시스템은 추가하지 않는다. 폰트 link는 위 3절을 각 HTML head에 넣는다. 아래는 구현 시 복사할 코드이며 이번 문서 작성에서 CSS 파일을 만들지는 않는다.

```css
:root {
  color-scheme: light;
  --font: 'Noto Sans KR', sans-serif;
  --primary: #166534; --primary-hover: #14532D; --primary-pressed: #052E16;
  --secondary: #DCFCE7; --bg: #F8FAFC; --surface: #FFFFFF;
  --text: #0F172A; --muted: #475569; --border: #64748B;
  --success: #166534; --success-bg: #DCFCE7;
  --warning: #854D0E; --warning-bg: #FEF3C7;
  --error: #B91C1C; --error-bg: #FEE2E2;
  --danger-hover: #991B1B; --danger-pressed: #7F1D1D;
  --soft-hover: #F1F5F9; --soft-pressed: #E2E8F0;
  --disabled-bg: #E2E8F0; --disabled-text: #475569;
  --overlay: #0F172A80;
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;
  --radius-control: 8px; --radius-card: 12px;
  --line: 1px; --focus: 3px solid #166534;
  --shadow-dialog: 0 8px 24px #0F172A26;
  --content-width: 1120px; --reading-width: 720px; --settings-width: 640px;
  --gutter: 16px; --touch: 48px; --header-height: 64px; --nav-height: 48px;
  --title-size: 28px; --title-line: 40px;
  --heading-size: 22px; --heading-line: 32px;
  --body-size: 16px; --body-line: 26px; --small-line: 24px;
  --quantity-size: 18px; --quantity-line: 28px;
  --weight-normal: 400; --weight-button: 600; --weight-heading: 700;
  --ad-content-gap: 32px; --ad-control-gap: 48px;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: var(--weight-normal) var(--body-size)/var(--body-line) var(--font);
  word-break: keep-all; overflow-wrap: anywhere; }
.container { width: 100%; max-width: var(--content-width); margin-inline: auto;
  padding-inline: var(--gutter); }
h1 { font-size: var(--title-size); line-height: var(--title-line); }
h2 { font-size: var(--heading-size); line-height: var(--heading-line); }
button, input, select, textarea { font: inherit; }
button, input, select { min-height: var(--touch); }
button { padding: 12px 16px; border-radius: var(--radius-control); }
:focus-visible { outline: var(--focus); outline-offset: 3px; }
a { color: var(--primary); text-decoration: underline; }
.quantity { font-size: var(--quantity-size); line-height: var(--quantity-line);
  font-weight: var(--weight-heading); font-variant-numeric: tabular-nums; }
.card-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
@media (min-width: 768px) {
  :root { --gutter: 24px; }
  .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  :root { --gutter: 32px; --title-size: 36px; --title-line: 48px; }
  .card-grid { gap: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

## 9. 하지 말 것

1. 본문·보조 문구를 16px 미만으로 줄이거나 색만으로 체크·오류·선택을 표시하지 않는다.
2. 가격 절감·영양 효과를 추정하는 배지, 할인 입력, 재고 입력, 결제·로그인을 넣지 않는다.
3. 다른 단위를 환산해 단일 숫자로 만들거나 `수량 미기재`를 0으로 보여주지 않는다.
4. 사진 부재를 외부 임의 사진·AI 생성 레시피로 메우거나 미검수 메뉴를 실제 추천처럼 노출하지 않는다.
5. 광고를 담기·복사·더 보기와 붙이거나, 페이지 이동·추천 방식 변경만으로 기존 메뉴를 초기화하지 않는다.


## 10. 사용자 승인 모바일 개편 (2026-11-11)

충돌 시 이 절을 우선한다. 기존 로고·HEX 색상·Noto Sans KR·16px 본문·48px 터치 영역을 유지한다. 실제 값은 `css/style.css`의 `:root`와 공통 구성 요소에서 가져온다.

- 홈 제목 `--home-title:32px`, 줄 간격 `--home-title-line:44px`; 소개 단계는 3열, 간격 12px이다. 인원 버튼은 4열·간격 8px이다.
- 보유·구매 예정 재료의 검색과 카테고리 버튼은 공통 구성 요소를 쓴다. 버튼 안쪽 4px 8px, 최소 높이 48px이다. 선택 배경 #DCFCE7·글자 #166534를 쓴다.
- 선택 메뉴는 휴대폰 2열, 768px 이상 3열, 간격 8px이다. 메뉴명과 ×횟수 다음 줄에 기준 인분을 16px·일반 굵기로 표시한다. 처음 3개와 전체 펼치기를 쓴다.
- 추천 방식은 2개 버튼으로 한 줄, 음식 종류는 가로 스크롤 한 줄이다. 관심 재료는 줄바꿈 가능한 다중 선택 버튼이다. 선택은 체크 문자와 aria-pressed로 함께 표시한다.
- 추천 카드는 모든 폭에서 2열·간격 8px·안쪽 12px이다. 제목 18px/24px·700, 기준 인분과 이유 16px/26px이다. 하단 담기와 더 보기는 `1fr 48px`, 간격 8px이다. 긴 메뉴명은 줄바꿈한다.
- 실제 이미지가 있을 때만 가로세로비 `--recipe-image-ratio:1.6`으로 표시한다. 이미지가 없으면 여백이나 대체 이미지를 넣지 않는다.
- 장보기 목록은 한 열이다. 재료명과 총량은 `1fr auto`, 간격 8px, 총량 18px/28px·700이다. 사용 메뉴는 16px/26px, 들여쓰기 48px이다. 여러 단위 총량은 줄바꿈한다.
- 본문 #0F172A/배경 #FFFFFF 약 17.85:1, 보조 글자 #475569/#FFFFFF 약 7.58:1, 선택 글자 #166534/#DCFCE7 약 6.49:1로 16px 텍스트 대비 4.5:1 이상을 유지한다.
- 상단 고정 로고 행 48px+내비게이션 48px, 홈 보유 재료 앵커 이동 시 이 높이만큼 스크롤 여백을 둔다. 화면 전체를 축소하거나 글자를 16px 미만으로 줄이지 않는다.

- 사용자 승인(2026-11-11): 핵심 3개 화면의 중복 큰 제목은 시각적으로 숨기고 접근성 제목은 유지한다. 상단 탭은 gap 8px·1px 테두리·8px 모서리·최소 높이 48px이다. 활성 탭은 #166534 배경·#FFFFFF 글자·700 굵기·aria-current로 구분한다. 화면 이름은 추천 메뉴로 통일한다.


## 11. 사용자 승인 전체 디자인 정리 (2026-11-11)

이 절이 이전의 테두리·탭·색상·폭 명세보다 우선한다. 기존 기능·화면 순서·SVG 로고·16px 본문·48px 터치 영역은 유지한다. 이미지 생성은 사용하지 않는다.

- 전체 배경 #FFFFFF, 본문 #17231B, 보조 글자 #58645D, 선택 배경 #E5F2DE, 선택 글자·주요 버튼 #166534다. 비선택 면 #F6F8F6, 구획 선 #E3E9E4, 입력·비선택 버튼 경계 #84918A다. 값은 css/style.css의 :root에 모은다.
- 공통 최대 폭 960px, 읽기 폭 720px; 휴대폰 여백 16px·태블릿 24px·PC 32px다. 섹션 간 24px, 버튼 간 8px다. 홈 보조 제목은 22px/32px로 큰 제목 32px/44px과 구분한다.
- 상단 탭은 배경·외곽 테두리 없이 3등분한다. 활성 탭은 초록 글자·굵기 700·3px 밑줄·aria-current다. 최소 높이 48px과 고정 헤더는 유지한다.
- 보유/새로 살 재료, 식사 인원, 선택 메뉴, 장보기 구획은 큰 테두리 상자를 없앤다. 필요 구획만 1px #E3E9E4 선과 16~24px 여백으로 나눈다. 선택 메뉴 버튼에는 연한 초록 배경을 유지한다.
- 재료 버튼은 비선택 흰 면·일반 글자·1px #84918A 경계, 선택 연초록 면·초록 글자·체크 문자다. 최소 높이 48px, 가로 padding 12px, 간격 8px다. 선택한 재료 수는 16px로 버튼과 한 줄 배치하되 좁으면 줄바꿈한다.
- 검색칸은 #F6F8F6 면·1px #84918A 경계·8px 모서리·왼쪽 검색 아이콘과 48px 안쪽 여백이다. 아이콘은 코드 SVG이며 별도 이미지 요청을 하지 않는다.
- 추천 방식은 중립 회색 묶음 안에 2개 버튼이다. 활성 방식은 흰 면·진한 글자·초록 밑줄, 음식 종류는 회색 버튼과 선택 연초록 버튼으로 구분한다.
- 추천 카드는 2열 유지, #F6F8F6 면·외곽선 없음·12px padding·12px 간격(태블릿 16px)이다. 제목 18px/24px, 나머지 글자 16px다. 담기는 흰 면·초록 글자·경계, 다음 단계 주요 행동만 진한 초록 버튼으로 강조한다.
- 장보기 목록은 한 열·재료명 왼쪽·총량 오른쪽, 행 간 1px 구획 선이다. 설정·제외 관리·가이드·정책·푸터도 같은 색과 경계 기준을 적용한다. 푸터는 #F6F8F6 면이다.

- 사용자 승인 예외(2026-11-11): 선택 메뉴의 기준 인분만 14px/20px·일반 굵기·#58645D로 표시한다. 메뉴명·횟수는 16px/24px을 유지한다. 메뉴명과 횟수는 minmax(0,1fr) max-content 2열, 간격 4px·안쪽 8px이다. 횟수는 줄바꿈하지 않고, 닫힌 메뉴명은 최대 2줄로 표시한다. 버튼을 펼치면 전체 이름을 표시하며 접근성 이름에도 전문을 유지한다. 다른 본문은 16px 이상을 유지한다.

- 사용자 승인 예외(2026-11-11): 장보기 재료 아래 사용 메뉴·인원·횟수·사용량도 14px/20px·#58645D로 표시한다. 메뉴명은 줄바꿈하고 인원·횟수 및 사용량은 각각 줄바꿈 없는 묶음으로 배치한다. 재료명·총량과 계산은 유지한다.

- 사용자 승인 재조정(2026-11-11): 선택 메뉴의 이름과 횟수는 양 끝 정렬 대신 이어 붙인다. 불고기·볶음·찌개 등 조리명 앞 또는 기존 공백에 줄바꿈 기회를 두고 마지막 단어와 ×횟수를 한 묶음으로 유지한다. 이름의 글자 중간 줄바꿈과 2줄 말줄임을 제거한다. 기준 인분 14px·안쪽 8px은 유지하고 원본 데이터는 바꾸지 않는다.
