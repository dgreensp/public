import React from "react";
import ReactDOM from "react-dom";

Object.assign(WEBPACK, {
  React, ReactDOM,
  ComponentPage: {
    initPage(componentName, {props = null} = {}) {
      ReactDOM.render(React.createElement(WEBPACK[componentName].default, props),
                      document.getElementById('page'));
    }
  }
});
