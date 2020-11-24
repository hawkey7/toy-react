class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root // 接口保持一致
    }
    return this._root
  }
}

export const React = {}
React.createElement = (tagName, attributes, ...children) => { // 每个node节点创建 都会调用到此函数 
  // console.log('createElement', tagName, children)
  let e
  if(typeof tagName === 'string') {
    e = new ElementWrapper(tagName)
  } else {
    e = new tagName
  }
  for(let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for(let child of children) { // 节点对下，将直接子节点全部挂载上去
      if (typeof child === 'string') {
        child = new TextWrapper(child)
      }
      if ((typeof child === 'object') && (child instanceof Array)){ // child是个array，即二维数组展开（react的this.children会遇到）
        console.log('arraychild', child)
        insertChildren(child)
      } else { // 节点对上被append
        console.log('normal child', child)
        console.log('e', child)
        e.appendChild(child) // 非二维数组的直接插入
      }
    }
  }
  insertChildren(children)
  return e
}

export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}
