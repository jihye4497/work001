// Initial navigation classification for newly imported menus only.
// Existing hand-reviewed classifications always take precedence.
export function classifyMfdsMenu(row) {
  const n=row.RCP_NM, source=row.RCP_PAT2;
  const western=/파스타|스파게티|스테이크|리조또|리소토|라타투이|라따뚜이|굴라쉬|웰링턴|커틀렛|프리타타|파니니|뇨키|빠에야|그라탕|포타주|스튜|샐러드|피자|샌드위치|수프|스프|피클|크로켓|테린|라자냐|카나페/.test(n);
  const japanese=/일본|초밥|스시|소바|가라아게|다마고|우동|데리야키|지라시|샤브샤브/.test(n);
  const chinese=/중국|고추잡채|칠리새우|탕수|완탕|마파|딤섬|짜장|자장|빠스|팔보채|유산슬|라조기|깐풍|유린기/.test(n);
  const other=/태국|인도|타코|토르티야|또띠아|토르티아|팟타이|커리|카레|사모사|니고랭|월남쌈|쌀국수/.test(n);
  const koreanAccent=/김치|고추장|청국장|된장|시래기|장아찌|묵은지|곤드레|갓김치/.test(n);
  let category;
  if(source==='후식' || /푸딩|라떼|음료|주스|쥬스|펀치|차$|에이드|젤리|잼$|요거트$|티라미수|판나코타|파나코타|몽블랑/.test(n)) category='그 밖';
  else if(koreanAccent&&(western||japanese||chinese||other)) category='퓨전';
  else if(western) category='양식';
  else if(japanese) category='일식';
  else if(chinese) category='중식';
  else if(other) category='그 밖';
  const soup=/국$|국[,& ]|찌개|탕$|전골|냉국/.test(n);
  const meal=source==='밥'||/밥|죽$|국수|면$|수제비/.test(n);
  const dual=/잡채|두부.*(?:구이|조림|전)|계란|달걀|부침|전$|완자/.test(n);
  const main=/소고기|쇠고기|돼지|삼겹|닭|오리|갈비|불고기|수육|보쌈|스테이크|오징어|낙지|주꾸미|삼치|갈치|고등어|코다리|명태|도미|민어|광어|장어|전복|새우|꽃게|족발/.test(n);
  const role=soup?'국·찌개':meal?'한그릇':dual?'겸용':main?'주메뉴':source==='반찬'?'반찬':'기타';
  const categories=category?[category]:soup?['한식 국·찌개']:meal?['한식 주메뉴']:dual?['한식 주메뉴','한식 반찬']:main?['한식 주메뉴']:source==='반찬'?['한식 반찬']:['그 밖'];
  return {recipeId:`mfds-cookrcp01-${row.RCP_SEQ}`,name:n,categories,mealRole:role,classificationNote:'신규 메뉴명·원본 요리종류 기반 초기 편집 분류; 음식 기원을 확정하지 않음'};
}
