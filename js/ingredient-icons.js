// Small local SVG icons; no image downloads or icon library.
const PATHS={
 '추가 구매 최소':'M5 10h14v10H5V10ZM3 13h2m14 0h2M4 7l15-3M12 3l1 2',
 '고른 재료 활용':'M4 3v6c0 3 6 3 6 0V3M7 3v18M18 3c-3 3-3 8 1 9V3Zm1 9v9',
 '우리 집 재료':'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',
 '장바구니 재료':'M6 13h20l-2 14H8L6 13Z M11 13l5-9 5 9 M12 18v5 M20 18v5',
 '제철':'M19 4C10 3 4 6 4 12a7 7 0 0 0 7 7c6 0 9-6 8-15ZM5 19l9-9M9 15V9',
 '농산물':'M13 8c-2-2-4-1-5 1C6 12 3 19 3 21c2 0 9-3 12-5 2-1 3-3 1-5l-3-3ZM14 8c-1-3 0-5 2-6 1 2 1 4-2 6Zm2 2c3-3 5-3 6-2-1 2-3 3-6 2M8 11l2 2m1 3 2 2',
 '육·수산':'M18 12c-5-7-10-7-15 0 5 7 10 7 15 0Zm0 0 4-5v10l-4-5ZM8 9v6M13 11h.01',
 '기타':'m3 8 9-5 9 5v11H3V8Zm0 0 9 5 9-5M12 13v6M8 6l9 5',
 '양념':'M9 3h6v4H9V3Zm-1 4h8l2 5v9H6v-9l2-5Zm-2 7h12M10 17h4'
};
export function ingredientIcon(category) {
 const create=tag=>document.createElementNS?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);
 const icon=create('svg');
 for(const [name,value] of Object.entries({viewBox:category==='장바구니 재료'?'0 0 32 32':'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':category==='장바구니 재료'?'2':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'ingredient-category-icon'}))icon.setAttribute(name,value);
 const path=create('path');path.setAttribute('d',PATHS[category]||PATHS['기타']);icon.append(path);return icon;
}
