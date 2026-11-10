export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key in node && !key.startsWith('aria')) node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of [children].flat(Infinity)) {
    if (child !== null && child !== undefined) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
export const button = (label, action, cls = 'secondary', attrs = {}) => el('button', { type: 'button', class: `button ${cls}`, onclick: action, ...attrs }, label);
export const link = (label, href, cls = '') => el('a', { href, class: cls }, label);
export function empty(title, text, href, label) {
  return el('div', { class: 'empty' }, [el('h2', {}, title), el('p', {}, text), href ? link(label, href, 'button primary') : null]);
}
