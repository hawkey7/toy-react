import { React, Component, render } from './toy-react'

class MyComponent extends Component {
  render() {
    return (<div id='out'>
      <h1>my component</h1>
      {this.children}
    </div>)
  }
}

render(<MyComponent id="a" class="c">
  <div>abc</div>
  <div><span>haha</span><span>verygood <div>inner div</div></span></div>
</MyComponent>, document.body)

// document.body.appendChild(<Mycomponent id="haha" class="super">
//   <div><span>1</span></div>
//   <div><span>22</span></div>
// </Mycomponent>)