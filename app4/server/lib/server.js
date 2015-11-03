var _inherits = require("babel-runtime/helpers/inherits").default;

var _classCallCheck = require("babel-runtime/helpers/class-call-check").default;

var _Object$entries = require("babel-runtime/core-js/object/entries").default;

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default").default;

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _requestPromise = require("request-promise");

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDomServer = require("react-dom/server");

var _reactDomServer2 = _interopRequireDefault(_reactDomServer);

var JSONView = (function (_React$Component) {
  _inherits(JSONView, _React$Component);

  function JSONView() {
    _classCallCheck(this, JSONView);

    _React$Component.apply(this, arguments);
  }

  JSONView.prototype.render = function render() {
    var value = this.props.data;
    if (typeof value === 'object') {
      return _react2.default.createElement(
        "div",
        { className: "json-object" },
        _Object$entries(value).map(function (_ref) {
          var k = _ref[0];
          var v = _ref[1];
          return _react2.default.createElement(
            "div",
            { className: "json-object-entry" },
            k,
            " ",
            typeof v
          );
        })
      );
    }
  };

  return JSONView;
})(_react2.default.Component);

var app = _express2.default();

app.get('/', function (req, res) {
  res.send("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>app4</title>\n</head>\n<body>\n  " + _reactDomServer2.default.renderToString(_react2.default.createElement(
    "p",
    null,
    "Hi everyone..."
  )) + "\n\n  <script src=\"/client.js\"></script>\n</body>\n</html>\n");
});

app.get('/apitest', function (req, res, next) {
  _requestPromise2.default({
    uri: 'https://api.github.com/repos/meteor/meteor/git/commits/90e5d3ea739834fca9937bea0935590215eefa85',
    qs: {
      access_token: '9968a96970c44765d175c5a12280d63ca5ff4e7b'
    },
    json: true,
    headers: {
      'User-Agent': 'dgreensp GitScope'
    },
    resolveWithFullResponse: true
  }).catch(function (error) {
    res.json({ error: error });
  }).then(function (response) {
    res.send(_reactDomServer2.default.renderToString(_react2.default.createElement(JSONView, { data: response })));
  }).catch(next);
});

app.use(_express2.default.static('public'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});