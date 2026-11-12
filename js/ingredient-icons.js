// Small local SVG icons; no image downloads or icon library.
const PATHS={
 '우리 집 재료':'M6 3h12v18H6V3Zm0 7h12M9 6v1m0 6v3',
 '장바구니 재료':'M4 10h16l-2 11H6L4 10Zm4 0 4-7 4 7M9 15h6m-3-3v6',
 '제철':'M19 4C10 3 4 6 4 12a7 7 0 0 0 7 7c6 0 9-6 8-15ZM5 19l9-9M9 15V9',
 '농산물':'m14 8 3 3-9 9-4-1-1-4 9-9 2 2Zm1-2 1-4m2 5 4-1m-8 5 2 2m-6 1 2 2',
 '육·수산':'M18 12c-5-7-10-7-15 0 5 7 10 7 15 0Zm0 0 4-5v10l-4-5ZM8 9v6M13 11h.01',
 '기타':'m3 8 9-5 9 5v11H3V8Zm0 0 9 5 9-5M12 13v6M8 6l9 5',
 '양념':'M9 3h6v4H9V3Zm-1 4h8l2 5v9H6v-9l2-5Zm-2 7h12M10 17h4'
};
export function ingredientIcon(category) {
 const create=tag=>document.createElementNS?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);
 const icon=create('svg');
 for(const [name,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'ingredient-category-icon'}))icon.setAttribute(name,value);
 const path=create('path');path.setAttribute('d',PATHS[category]||PATHS['기타']);icon.append(path);return icon;
}
