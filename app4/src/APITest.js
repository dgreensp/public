import React from "react";
import "./APITest.less";

export default class APITest extends React.Component {
  render() {
    return <div>{JSON.stringify(this.props)}</div>;
  }
};

APITest.propTypes = {
  response: React.PropTypes.object,
  error: React.PropTypes.object
};
