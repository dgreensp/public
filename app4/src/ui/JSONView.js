import React from "react";
import "./JSONView.less";

class JSONView extends React.Component {
  render() {
    const value = this.props.data;
    if (typeof value === 'object') {
      return <div className="json-object">
        {Object.entries(value).map(
          ([k,v]) => <div className="json-object-entry">
            {k} {typeof v}
            </div>)}
      </div>;
    }
  }
}
