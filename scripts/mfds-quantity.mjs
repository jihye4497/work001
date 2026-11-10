const fractions = { '½': .5, '⅓': 1/3, '⅔': 2/3, '¼': .25, '¾': .75, '⅛': .125 };
export function parsePlainAmount(written) {
  const match=written.match(/^(\d+\/\d+|\d+(?:\.\d+)?)\s*(mg|kg|g|ml|mL|L|㎖|개|장|대|마리|모|쪽|컵|알|T|t)(?:\s*\([^()]*\))?$/u);
  if(!match) throw Error('원문 수량·단위 확인 필요');
  const [numerator,denominator]=match[1].split('/').map(Number);
  const amount=denominator===undefined?numerator:numerator/denominator;
  if(!Number.isFinite(amount)||amount<=0) throw Error('원문 수량 범위 확인 필요');
  return {amount,unit:match[2]};
}
export function parseWrittenAmount(written) {
  if (['약간','소량','적당량'].includes(written)) return { amount: null, unit: null };
  const annotated = written.match(/^(\d+(?:\.\d+)?)(mg|g|ml|mL|개|장)\([^()]*\)$/u);
  if (annotated) return { amount: Number(annotated[1]), unit: annotated[2] };
  if (/각\s*(?:\d|[½⅓⅔¼¾⅛])|[~～]|\d\s*-\s*\d/u.test(written)) throw new Error('범위 또는 여러 재료의 분량은 별도 검수가 필요합니다.');
  const tail = written.split('=').at(-1).split(',').at(-1).trim();
  const match = tail.match(/(?:^|\s)(\d+[½⅓⅔¼¾⅛]|[½⅓⅔¼¾⅛]|\d+\/\d+|\d+(?:\.\d+)?)(g|kg|ml|mL|L|Ts|ts|T|t|개|쪽|컵|줌|장|대|마리|봉|모|팩|줄|포기|공기|cm|알|조각)$/u);
  if (!match) throw new Error('검수하지 않은 수량 표현입니다.');
  const value = match[1];
  let amount;
  if (value.includes('/')) { const [n,d] = value.split('/').map(Number); amount = n/d; }
  else if (fractions[value.at(-1)] !== undefined) amount = (Number(value.slice(0,-1)) || 0) + fractions[value.at(-1)];
  else amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('수량 범위를 확인하세요.');
  return { amount, unit: match[2] };
}
