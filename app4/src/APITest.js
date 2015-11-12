import React from "react";
import "./APITest.less";

export default class APITest extends React.Component {
  render() {
    return <div>
      <div>{String(this.props.response && this.props.response.body.length)}</div>
      <div>{JSON.stringify(this.props)}</div>
      </div>;
  }
}

APITest.propTypes = {
  response: React.PropTypes.object,
  error: React.PropTypes.object
};
