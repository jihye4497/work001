// Reviewed conjunctions between dishes/sauces, not syllables inside food names.
const connectors=new Map([
 ...['3297','95','93','94','628','865','3576','732','89','91','506','613','82','648','655','589','594','596','597','627','3243','3763','3773','745','3233'].map(id=>[`mfds-cookrcp01-${id}`,'와']),
 ['mincook-blog-673','와'],['mincook-blog-200','과'],['mincook-blog-112','과']
]);
export const PAIRED_MENU_IDS=new Set(connectors.keys());
export function pairedMenuName(recipe){
 const connector=connectors.get(recipe.id);
 return connector&&recipe.name.includes(connector)?recipe.name.replace(connector,' & ').replace(/\s+/g,' ').trim():recipe.name.replace(/\s*[&＆]\s*/g,' & ');
}
