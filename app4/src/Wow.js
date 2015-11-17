import React from "react";
import "./Wow.less";

export default class Wow extends React.Component {
  foo() {
    alert("HI");
  }
  render() {
    return <span className="Wow-span" onClick={e => this.foo()}>
      {this.props.text}
    </span>;
  }
}
