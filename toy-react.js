const RENDER_TO_DOM = Symbol("render to dom")

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get vdom() {
    return this.render().vdom
  }
  [RENDER_TO_DOM](range) { // 递归，渲染进range里面，最终还是渲染到text和element
    console.log('RENDER_TO_DOM', this)
    this._range = range
    this._vdom = this.vdom
    //this.render() 得到的是最外层的div ---- ElementWrapper
    // this.render()[RENDER_TO_DOM](range)
    this._vdom[RENDER_TO_DOM](range);
    console.log('RENDER_TO_DOM _range', this._range)

  }
  // rerender() {
  //   this._range.deleteContents()
  //   this[RENDER_TO_DOM](this._range)
  // }
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        console.log('1')
        return false
      }

      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          console.log('2', name)
          return false
        } 
      }

      if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length){
        console.log('3')
        return false
      }

      if (newNode.type === '#text' && (newNode.content !== oldNode.content)) {
        console.log('4')
        return false
      }

      return true
    }
    let update = (oldNode, newNode) => {
      // type, props, children  根节点是否一致、children是否一致
      if(!isSameNode(oldNode, newNode)){
        console.log('not isSameNode', oldNode, newNode)
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range

      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren
      if(!newChildren || !newChildren.length) {
        return
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for(let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if(i < oldChildren.length) {
          console.log('oldNode', oldNode)
          update(oldChild, newChild)
        } else {
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffSet);
          range.setEnd(tailRange.endContainer, tailRange.endOffSet);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
          // TODO
        }
      }
    }
    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
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
    this.update()
  }

  

  // get root() {
  //   if (!this._root) {
  //     this._root = this.render().root // 接口保持一致
  //   }
  //   return this._root
  // }
}

class ElementWrapper extends Component{
  constructor(type) {
    super(type)
    this.type = type
  }
  // setAttribute(name, value) {
  //   if(name.match(/^on([\s\S]+)$/)) {
  //     this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
  //   } else {
  //     if (name === 'className') {
  //       this.root.setAttribute('class', value)
  //     } else {
  //       this.root.setAttribute(name, value)
  //     }
  //   }
  // }

  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom)
    return this
  }

  // appendChild(component) {
  //   let range = document.createRange()
  //   console.log('this.root.childNodes', this.root.childNodes)
  //   range.setStart(this.root, this.root.childNodes.length)
  //   range.setEnd(this.root, this.root.childNodes.length)
  //   component[RENDER_TO_DOM](range)
  // }
  [RENDER_TO_DOM](range) {
    // console.log('ele RENDER_TO_DOM', range)

    this._range = range
    console.log('ele RENDER_TO_DOM', this)
    let root = document.createElement(this.type)
    for (let name in this.props) {
      if(name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), this.props[name])
      } else {
        if (name === 'className') {
          root.setAttribute('class', this.props[name])
        } else {
          root.setAttribute(name, this.props[name])
        }
      }
    }
    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom)
    }
    for (let child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    // range.deleteContents()
    // replaceContent(range, root)
    // range.insertNode(root)
    replaceContent(range, root)
  }
}

class TextWrapper extends Component{
  constructor(content) {
    super(content)
    this.type = '#text'
    this.content = content
  }
  get vdom() {
    return this
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    const root = document.createTextNode(this.content)
    // range.deleteContents()
    // range.insertNode(root)
    replaceContent(range, root)
  }
}

function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()

  range.setStartBefore(node)
  range.setEndAfter(node)
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
        // console.log('arraychild', child)
        insertChildren(child)
      } else { // 节点对上被append
        // console.log('normal child', child)
        // console.log('e', child)
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
  // console.log('render', component)
  component[RENDER_TO_DOM](range)
}
