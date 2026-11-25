import test from 'node:test';
import assert from 'node:assert/strict';
import {quantity,totalText,selectedCopyText} from '../js/shopping-list.js';
test('목록은 소수1자리까지 올림하고 상세는2자리까지 표시',()=>{
 for(const [value,list,detail] of [[1/3,'0.4개','0.33개'],[2/3,'0.7개','0.67개'],[33.75,'33.8개','33.75개'],[6.666666,'6.7개','6.67개'],[1.01,'1.1개','1.01개'],[1.1,'1.1개','1.1개'],[2,'2개','2개'],[0,'0개','0개']]){
  assert.equal(quantity(value,'개'),list);assert.equal(quantity(value,'개',{detail:true}),detail);
 }
 assert.equal(quantity(null,'g'),'수량 미기재');
 assert.equal(quantity(2,null,{detail:true}),'수량 미기재');
 assert.equal(quantity(0.1+0.2,'g'),'0.3g');
 assert.equal(quantity(1e-17,'g'),'0.1g');
 assert.equal(quantity(2.00000001,'g'),'2.1g');
 assert.ok(!quantity(Number.MAX_VALUE,'g').includes('∞'));
});
test('합산은 원래값으로 하고 표시와 복사에서만 올림',()=>{
 const row={ingredient:{id:'potato',name:'감자'},totals:new Map([['개',1/3+1/3],['g',33.75]]),unknown:false};
 const before=[...row.totals];
 assert.equal(totalText(row),'0.7개 + 33.8g');
 assert.equal(selectedCopyText([row],['potato']),'감자: 0.7개 + 33.8g');
 assert.deepEqual([...row.totals],before);
});
