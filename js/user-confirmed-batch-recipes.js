// Explicit user decision, 2026-11-25: all 34 formerly undecided calculation modes
// use the original registered full recipe as one manufacturing batch.
// This confirms the mode, not an author's yield or new serving estimate.
export const USER_CONFIRMED_BATCH_RECIPES=Object.fromEntries([
 'paik-u1m21zlfVLo','paik-dQnjf9ouGgk','paik-wAktJuv7REY',
 'caden-D_jIsgBZCuU','caden-1sptmEHbDI0','caden-zs-OdDdvREM',
 'moony-oHCQFYHVPEc','moony-nlZ-yrWMRoE','moony-ujOBiIDASmI','moony-a5XNbDPJqO8',
 'moony-jr6nFMZQI-E','moony-5u3v77i7nHU','moony-AtkGm8jphd0','moony-SWP0xcychyk',
 'moony-NHo36S_25a4','moony-K5yZt5hf72Q','moony-0y3Juik_1Zk',
 'mincook-blog-785','mincook-blog-591','mincook-blog-593','mincook-blog-586',
 'mincook-blog-543','mincook-blog-361','mincook-blog-348','mincook-blog-303',
 'mincook-blog-288','mincook-blog-281','mincook-blog-250','mincook-blog-235',
 'mincook-blog-226','mincook-blog-206','mincook-blog-197','mincook-blog-159','mincook-blog-112'
].map(id=>[id,{reason:'2026-11-25 사용자 명시 결정: 계산방식 미정34건은 모두 원문 전체1회 제조량으로 계산. 기존 추정인분은 보관하고 인원자동비례를 중단. 원작자 명시 인분/완성개수를 확인했다는 의미 아님.'}]));

const sourceRow=(ingredientId,amount,unit,source)=>({ingredientId,amount,unit,note:`2026-11-25 공식 원문 추가 대조: ${source}`});
export const BATCH_SOURCE_ADDITIONS={
 'mincook-blog-112':[
  sourceRow('mfds-ingredient-14f15f969649',1,'줌','파절이 / 파채 크게 한 줌'),
  sourceRow('onion',0.5,'개','파절이 / 양파 1/2개'),
  sourceRow('mfds-ingredient-1ad0b371b22f',1,'줌','파절이 / 부추 한 줌'),
  sourceRow('mfds-ingredient-e957e8de9164',10,'장','파절이 / 깻잎10장'),
  sourceRow('chili',2,'숟가락','파절이 / 고춧가루2숟가락'),
  sourceRow('mfds-ingredient-860fd4a93c7c',2,'숟가락','파절이 / 진간장2숟가락'),
  sourceRow('mfds-ingredient-847a7670d00e',2,'숟가락','파절이 / 미림2숟가락'),
  sourceRow('sugar',1,'숟가락','파절이 / 설탕1숟가락'),
  sourceRow('syrup',1,'숟가락','파절이 / 물엿1숟가락'),
  sourceRow('sesame-oil',1,'숟가락','파절이 / 참기름1숟가락'),
  sourceRow('sesame-seeds',1,'숟가락','파절이 / 참깨1숟가락')
 ],
 'mincook-blog-348':[sourceRow('sesame-seeds',null,null,'본문 마무리 깨 / 수량 미기재')]
};
