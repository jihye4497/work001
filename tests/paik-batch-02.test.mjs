import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/paik-batch-02-policy.mjs';
import {aggregate,totalText} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {recommend,searchMenus} from '../js/recommendations.js';
import {createStore,defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),catalog=await read('data/recipe-categories.json');
const review=await read('data/source/paik-batch-02-review.json');
const get=id=>recipes.find(r=>r.id===`paik-${id}`);
const rows=(id,servings)=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:servings??r.baseServings}],1);};
const amount=(id,name,servings)=>totalText(rows(id,servings).find(r=>r.ingredient.name===name));

test('second batch adds fifty distinct verified videos with canonical ingredient references and food classifications',()=>{
 assert.equal(review.entries.length,50);
 assert.equal(new Set(review.entries.map(e=>e.videoId)).size,50);
 validateData(ingredients,recipes);applyRecipeCategories(recipes,catalog);
 for(const e of review.entries){
  const r=get(e.videoId);assert.ok(r);assert.equal(r.sourceUrl,e.sourceUrl);assert.equal(r.imagePath,null);
  assert.equal(e.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
  assert.equal(e.ingredientHash,createHash('sha256').update(e.ingredientText).digest('hex'));
  assert.ok(e.ingredients.every(i=>e.ingredientText.includes(i.sourceText)));
  assert.equal(r.ingredients.length,e.ingredients.filter(i=>!i.omitted).length);
  assert.ok(searchMenus(recipes,r.name).some(x=>x.id===r.id));
 }
 assert.ok(review.entries.some(e=>e.videoId==='XtFqi5J2KqI'));
});

test('one-bowl components scale to the full two-portion sauce while half-batch sandwich filling does not double',()=>{
 assert.equal(amount('4LoyQQq2pgA','땅콩버터'),'64g');
 assert.equal(amount('4LoyQQq2pgA','오이'),'66g');
 assert.equal(amount('4LoyQQq2pgA','라면'),'2개');
 assert.equal(amount('4LoyQQq2pgA','오이',1),'33g');
 assert.equal(amount('LTVxirHWvh8','밥'),'5공기');
 assert.equal(amount('LTVxirHWvh8','밥',1),'1공기');
 assert.equal(amount('mjLPNh11_xs','통조림 참치'),'50g');
 assert.equal(amount('mjLPNh11_xs','식빵'),'2장');
 assert.equal(amount('XtFqi5J2KqI','식용유'),'14g');
 assert.equal(amount('XtFqi5J2KqI','새우젓'),'18g');
 assert.equal(amount('XtFqi5J2KqI','스파게티'),'100g');
});

test('pre-soak weight, comma-separated quantities, source serving ranges and alternative versions retain their intended amounts',()=>{
 assert.equal(amount('gJDxWPoMHgo','쌀국수'),'60g');
 assert.equal(amount('jN_inaLf9Zo','물'),'1,080ml');
 assert.equal(amount('iO0xX0AyS8M','닭'),'1팩');
 assert.equal(servingLabel(get('fVKaR66n9B4')),'3~4인분');
 assert.equal(servingLabel(get('2T7BfP1sx9g')),'2~3인분');
 assert.equal(amount('JxWbJX-UNwY','돼지 뒷다리살',1),'270g');
 assert.equal(get('7cCAlN06WPc').ingredients.filter(i=>i.note.startsWith('원문: 안심')).reduce((n,i)=>n+i.amount,0),300);
 assert.equal(rows('0CL9U_Se8Gs').some(r=>r.ingredient.name==='밥'),false);
 assert.equal(rows('Om6W3JBfmFU').some(r=>r.ingredient.name==='밥'),false);
});

test('both earlier batches survive selection restoration and new dishes participate in existing recommendation logic',()=>{
 const selections=[{recipeId:'paik-qWbHSOplcvY',servings:3,times:1},{recipeId:'paik-mZ2C8gEw8Vk',servings:2,times:1},{recipeId:'paik-nVzwOOJLt24',servings:4,times:1}];
 const mem=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)});store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
 const beef=ingredients.find(i=>i.name==='소고기 불고기용');
 const d={...defaultDraft(),selectedIngredientIds:[beef.id],activeInterestIds:[beef.id]};
 assert.ok(recommend(ingredients,recipes,d).some(x=>x.recipe.id==='paik-nVzwOOJLt24'));
 assert.equal(batch50.length,50);
});
