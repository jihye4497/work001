import { ingredientDisplayName, ingredientDetailNote } from './ingredient-display-names.js';
import { CATEGORIES } from './ingredients.js';
import { isCookingWater } from './ingredient-aliases.js';
import { servingLabel } from './servings.js';
import { ingredientKey, representativeIngredient } from './ingredient-matching.js';
import { canonicalIngredientName } from './ingredient-aliases.js';
import { preparationFamilyName } from './ingredient-preparations.js';
import { preparedPurchase, preparedSubstitution } from './prepared-ingredients.js';

export function selectedServings(selection, household) {
  return selection.servings ?? household * selection.times;
}

export function aggregate(ingredients, recipes, selectedRecipes, servings) {
  const byId = new Map(ingredients.map(i => [i.id, i]));
  const byRecipe = new Map(recipes.map(r => [r.id, r]));
  const rows = new Map();
  for (const selection of selectedRecipes) {
    const recipe = byRecipe.get(selection.recipeId);
    if (!recipe) throw new Error('선택 메뉴의 데이터를 찾을 수 없어요.');
    for (const item of recipe.ingredients) {
      const source = byId.get(selection.ingredientReplacements?.[item.ingredientId] || item.ingredientId);
      const prepared=preparedPurchase(item,recipe,byId,selection.ingredientReplacements?.[item.ingredientId]);
      const ingredient = representativeIngredient(prepared?.ingredient||source,byId);
      if (!ingredient) throw new Error('재료 데이터를 찾을 수 없어요.');
      const row = rows.get(ingredient.id) || { ingredient, totals: new Map(), unknown: false, uses: [] };
      const detailNote=ingredientDetailNote(byId.get(item.ingredientId));
      if(detailNote)row.detailNote=detailNote;
      const factor=selectedServings(selection, servings)/recipe.baseServings;
      const originalAmount=item.amount===null?null:item.amount*factor;
      const baseAmount=prepared?prepared.amount:item.amount;
      const amount=baseAmount===null?null:baseAmount*factor;
      const unit=prepared?prepared.unit:item.unit;
      if(prepared){
        row.preparationNeeds??=[];
        row.preparationNeeds.push({name:byId.get(item.ingredientId).name,amount:originalAmount,unit:item.unit,help:prepared.help});
      }
      // A yolk, a boiled egg and a whole egg cannot share a gram total.
      if(prepared?.skipQuantity) {
        // Liquid supplied by a can already listed in this same recipe adds no purchase amount.
      } else if(preparationFamilyName(ingredient)) {
        row.preparations ??= new Map();
        const form=canonicalIngredientName(source)||source.name;
        const part=row.preparations.get(form)||{totals:new Map(),unknown:false};
        if(amount===null||unit===null)part.unknown=true;
        else part.totals.set(unit,(part.totals.get(unit)||0)+amount);
        row.preparations.set(form,part);
        if(form===ingredient.name){row.totals=part.totals;row.unknown=part.unknown;}
      } else if (amount === null || unit === null) row.unknown = true;
      else row.totals.set(unit, (row.totals.get(unit) || 0) + amount);
      if (recipe.servingsStatus === 'estimated') row.estimated = true;
      row.uses.push({ originalIngredientName:byId.get(item.ingredientId)?.name, name: recipe.name, amount:prepared?originalAmount:amount, unit: item.unit, note: item.note, servingLabel: servingLabel(recipe), servings: selectedServings(selection, servings), times: 1 });
      rows.set(ingredient.id, row);
    }
  }
  return [...rows.values()].sort((a, b) => CATEGORIES.indexOf(a.ingredient.category) - CATEGORIES.indexOf(b.ingredient.category) || a.ingredient.name.localeCompare(b.ingredient.name, 'ko'));
}

export function quantity(amount, unit) {
  if (amount === null || unit === null) return '수량 미기재';
  // Display-only rounding; all aggregation uses original numbers.
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 }).format(amount)}${unit}`;
}
export function totalText(row) {
  if(row.preparations)return [...row.preparations].map(([form,part])=>`${row.preparations.size===1&&form===row.ingredient.name?'':`${ingredientDisplayName(form)} `}${totalText(part)}`).join(' + ');
  return [...row.totals].map(([unit, amount]) => quantity(amount, unit)).concat(row.unknown ? ['수량 미기재'] : []).join(' + ');
}
const isDrinkingWater = isCookingWater;
export function preparationText(row) {
 if(!row.preparationNeeds?.length)return '';
 const totals=new Map(),help=new Set();
 for(const n of row.preparationNeeds){
  const key=JSON.stringify([n.name,n.unit]),part=totals.get(key)||{...n,amount:0};
  part.amount=n.amount===null||part.amount===null?null:part.amount+n.amount;totals.set(key,part);help.add(n.help);
 }
 return [...totals.values()].map(n=>`${n.name} ${quantity(n.amount,n.unit)} 준비.`).concat([...help]).join(' ');
}

export function partitionShoppingRows(rows, pantryIds = [], ingredients = []) {
  const keys = new Set(ingredients.filter(i => pantryIds.includes(i.id)).map(ingredientKey));
  return ['구매할 재료', '우리 집 재료'].map(title => ({title, rows: rows.filter(row => {
    const coveredPreparation=ingredients.some(i=>pantryIds.includes(i.id)&&row.preparationNeeds?.some(n=>preparedSubstitution(n,i)));
    const group = pantryIds.includes(row.ingredient.id) || keys.has(ingredientKey(row.ingredient)) || coveredPreparation ? '우리 집 재료' : '구매할 재료';
    return group === title && (title !== '구매할 재료' || !isDrinkingWater(row.ingredient));
  })}));
}
export function recipeMaterialNames(recipe,ingredients,pantryIds=[],replacements={}) {
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:recipe.baseServings,ingredientReplacements:replacements}],1);
 const [buying,owned]=partitionShoppingRows(rows,pantryIds,ingredients);
 const names=items=>[...new Set(items.map(row=>ingredientDisplayName(row.ingredient)))];
 return {owned:names(owned.rows.filter(row=>!row.ingredient.isSeasoning)),buy:names(buying.rows)};
}
export function copyText(rows, checkedIds, pantryIds, ingredients = []) {
  const lines = [];
  const groups = pantryIds === undefined ? CATEGORIES.map(title => ({title, rows: rows.filter(r => r.ingredient.category === title)})) : partitionShoppingRows(rows, pantryIds, ingredients);
  for (const {title: category, rows: group} of groups) {
    if (!group.length) continue;
    lines.push(category);
    for (const row of group) lines.push(`[${checkedIds.includes(row.ingredient.id) ? 'x' : ' '}] ${ingredientDisplayName(row.ingredient)}: ${totalText(row)}${pantryIds !== undefined && row.ingredient.isSeasoning ? ' (양념)' : ''}${row.estimated ? ' (인분 추정 포함)' : ''}${preparationText(row)?` (${preparationText(row)})`:''}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

// Copy only explicitly selected purchase rows; leave the full-list exporter available for legacy callers.
export function selectedCopyText(rows, selectedIds) {
  const selected = new Set(selectedIds);
  return rows.filter(row=>selected.has(row.ingredient.id)&&!isDrinkingWater(row.ingredient)).map(row=>`${ingredientDisplayName(row.ingredient)}: ${totalText(row)}${preparationText(row)?` (${preparationText(row)})`:''}`).join('\n');
}
