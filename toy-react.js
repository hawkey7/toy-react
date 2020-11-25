const RENDER_TO_DOM = Symbol("render to dom")

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(name, value) {
    if(name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === 'className') {
        this.root.setAttribute('class', value)
      } else {
        this.root.setAttribute(name, value)
      }
    }
  }

  appendChild(component) {
    let range = document.createRange()
    console.log('this.root.childNodes', this.root.childNodes)
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this.root = null
    this._range = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  [RENDER_TO_DOM](range) { // 递归，渲染进range里面，最终还是渲染到text和element
    this._range = range
    console.log('this.render()', ) //this.render() 得到的是最外层的div ---- ElementWrapper
    this.render()[RENDER_TO_DOM](range)
  }
  rerender() {
    this._range.deleteContents()
    this[RENDER_TO_DOM](this._range)
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState
      this.rerender()
      return 
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] !== null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }
  // get root() {
  //   if (!this._root) {
  //     this._root = this.render().root // 接口保持一致
  //   }
  //   return this._root
  // }
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
      if (child === null) {
        continue
      }
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
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  console.log('render', component)
  component[RENDER_TO_DOM](range)
}
