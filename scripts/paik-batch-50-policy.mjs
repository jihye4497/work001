// Reviewed editorial selection. Source quantities are in the corresponding review file.
// For ranges, preserve the source range and use its upper bound for calculation.
export const batch50 = [
 ['wk8FkdJ8hm0','짜장라면 오믈렛',1,'볶음','한식 주메뉴'],
 ['5e5fp21dqWA','매콤달걀덮밥',1,'덮밥','한식 주메뉴'],
 ['NEvFwzLsn6M','원팬 비빔밥',1,'비빔밥','한식 주메뉴'],
 ['-yCwkUS0ECE','기름떡볶이',3,'볶음','한식 주메뉴',[2,3]],
 ['5-a5CPASYBc','달걀만두',2,'전','한식 반찬'],
 ['KbWtIU129hw','보쌈 무김치',2,'무침','한식 반찬'],
 ['cUQzxhmYdGs','양배추전',2,'전','한식 반찬',[1,2]],
 ['hg31ssLQWUk','전복솥밥',2,'밥','한식 주메뉴',[1,2]],
 ['Jq2SwKMw8vI','전자레인지 비빔밥',1,'비빔밥','한식 주메뉴'],
 ['qioLJwafP8I','참치밥전',2,'전','한식 주메뉴',[1,2]],
 ['EhTxL1sWnMI','초계라면',1,'국수','한식 주메뉴'],
 ['nQaR6cwSmQk','가지덮밥',1,'덮밥','한식 주메뉴'],
 ['wTtHP5qFOio','들기름 막라면',1,'국수','한식 주메뉴'],
 ['WT9tCViPddU','돼지갈비찜',4,'찜','한식 주메뉴',[3,4]],
 ['ysCrvaErHKE','소고기 메추리알 장조림',8,'조림','한식 반찬'],
 ['ceSuK8MVEb4','달래장',4,'양념장','한식 반찬'],
 ['7VNH9Fvvus0','햄감자채볶음',4,'볶음','한식 반찬'],
 ['p6r5xcrG6u0','허니버터고구마',2,'구이','한식 반찬'],
 ['_MhD25Ip3bc','소고기 떡국',2,'국','한식 국·찌개'],
 ['J4qwXDjduQw','소고기 육전',3,'전','한식 반찬'],
 ['py6778lywEg','왕가래떡 떡볶이',2,'조림','한식 주메뉴'],
 ['87zznFb0-us','빨간 어묵',4,'조림','한식 반찬',[3,4]],
 ['SILoOGBiAyA','부대볶음',2,'볶음','한식 주메뉴'],
 ['Zkxiydlmplw','오징어뭇국',4,'국','한식 국·찌개'],
 ['YLd78Yqoy9I','꽃게 해장국',4,'국','한식 국·찌개'],
 ['JrTVWvj8uhs','들기름 두부구이',4,'구이','한식 반찬'],
 ['fpqJOFMfhmk','명란 크림파스타',1,'파스타','양식'],
 ['RmZyxKOUbfs','메추리알 장조림',10,'조림','한식 반찬'],
 ['-Imo0xgUQG0','도토리 묵사발',2,'냉국','한식 주메뉴'],
 ['e--h7ax_6pQ','참치김치찌개',2,'찌개','한식 국·찌개'],
 ['uu8BqXy6lf4','맑은 미역국',4,'국','한식 국·찌개'],
 ['Mfnwc1dc0MY','차돌박이 된장찌개',4,'찌개','한식 국·찌개'],
 ['SeUG8iRDE_g','콩나물국',4,'국','한식 국·찌개'],
 ['rLDquEv-ZJg','황태미역국',4,'국','한식 국·찌개'],
 ['p7HGmwiuuvE','햄김치찌개',3,'찌개','한식 국·찌개'],
 ['o3aLEbn2n5Y','치즈등갈비',3,'조림','한식 주메뉴'],
 ['0wqp-Ii5wQM','부추완자전',4,'전','한식 반찬'],
 ['YEG1UYY_1E4','오징어 삼겹살 불고기',3,'볶음','한식 주메뉴'],
 ['oFiRqNH2BaI','홍합밥',3,'밥','한식 주메뉴'],
 ['mZ2C8gEw8Vk','갈치조림',2,'조림','한식 주메뉴'],
 ['MTF3kcG6mmI','장칼국수',1,'국수','한식 주메뉴'],
 ['tCe6B6U8wHw','단무지무침',3,'무침','한식 반찬'],
 ['B2s5seuBCn0','애호박 고추장찌개',3,'찌개','한식 국·찌개'],
 ['N0imcLgooRI','공심채볶음',2,'볶음','그 밖'],
 ['gVw9OXujilo','간장 전복구이',2,'구이','한식 주메뉴'],
 ['llZ1ii59BVs','유부우동',1,'국수','일식'],
 ['l3-pOzj3c6g','채소냉국수',1,'국수','한식 주메뉴'],
 ['vjWddRRR58M','간장냉국수',1,'국수','한식 주메뉴'],
 ['1F4soB3rlMI','에그 인 헬',3,'조림','양식',[2,3]],
 ['-8qL_l94cJ8','누룽지백숙',2,'탕','한식 국·찌개']
];

// Exact source-group scaling. Intermediate dishes are not purchased again.
export function groupPolicy(videoId,group) {
 if(videoId==='llZ1ii59BVs' && group==='유부조림')return {scale:3/10,reason:'유부조림 10개 중 우동에 쓰는 3개 분량만 반영'};
 if(['l3-pOzj3c6g','vjWddRRR58M'].includes(videoId) && /육수/.test(group))return {scale:1/4,reason:'원본 4인분 육수 중 완성 국수 1인분 분량'};
 if(videoId==='1F4soB3rlMI' && /^소스/.test(group))return {scale:1/2,reason:'원본 에그인헬에 사용하는 소스 1/2양만 반영'};
 if(videoId==='-8qL_l94cJ8' && /전기밥솥/.test(group))return {omit:true,reason:'같은 요리의 대체 조리법. 냄비 조리 버전으로 등록하여 중복 합산 방지'};
 return {scale:1};
}
export const intermediateRows = new Map([
 ['llZ1ii59BVs',['유부조림 3개']],
 ['nQaR6cwSmQk',['양념장 전량']],
 ['7VNH9Fvvus0',['데친 감자채 전량']],
 ['1F4soB3rlMI',['소스 1/2양(약500g)']],
 ['gVw9OXujilo',['데친 전복 5마리(15미)']]
]);
