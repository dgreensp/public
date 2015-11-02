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
  )) + "\n\n  <script src=\"/test.js\"></script>\n</body>\n</html>\n");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7dUJBQW9CLFNBQVM7Ozs7OEJBQ1QsaUJBQWlCOzs7O3FCQUNuQixPQUFPOzs7OzhCQUNFLGtCQUFrQjs7OztJQUV2QyxRQUFRO1lBQVIsUUFBUTs7V0FBUixRQUFROzBCQUFSLFFBQVE7Ozs7O0FBQVIsVUFBUSxXQUNaLE1BQU0sR0FBQSxrQkFBRztBQUNQLFFBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzlCLFFBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO0FBQzdCLGFBQU87O1VBQUssU0FBUyxFQUFDLGFBQWE7UUFDaEMsZ0JBQWUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUN4QixVQUFDLElBQUs7Y0FBSixDQUFDLEdBQUYsSUFBSztjQUFGLENBQUMsR0FBSixJQUFLO2lCQUFLOztjQUFLLFNBQVMsRUFBQyxtQkFBbUI7WUFDMUMsQ0FBQzs7WUFBRyxPQUFPLENBQUM7V0FDUDtTQUFBLENBQUM7T0FDUCxDQUFDO0tBQ1I7R0FDRjs7U0FYRyxRQUFRO0dBQVMsZ0JBQU0sU0FBUzs7QUFjdEMsSUFBTSxHQUFHLEdBQUcsbUJBQVMsQ0FBQzs7QUFFdEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFLO0FBQ3pCLEtBQUcsQ0FBQyxJQUFJLDJIQVFOLHlCQUFlLGNBQWMsQ0FBQzs7OztHQUFxQixDQUFDLGtFQUt0RCxDQUFDO0NBQ0YsQ0FBQyxDQUFDOztBQUVILEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUs7QUFDdEMsMkJBQVE7QUFDTixPQUFHLEVBQUUsaUdBQWlHO0FBQ3RHLE1BQUUsRUFBRTtBQUNGLGtCQUFZLEVBQUUsMENBQTBDO0tBQ3pEO0FBQ0QsUUFBSSxFQUFFLElBQUk7QUFDVixXQUFPLEVBQUU7QUFDUCxrQkFBWSxFQUFFLG1CQUFtQjtLQUNsQztBQUNELDJCQUF1QixFQUFFLElBQUk7R0FDOUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLEtBQUssRUFBSztBQUNsQixPQUFHLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBQyxDQUFDLENBQUM7R0FDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQVEsRUFBSztBQUNwQixPQUFHLENBQUMsSUFBSSxDQUFDLHlCQUFlLGNBQWMsQ0FBQyw4QkFBQyxRQUFRLElBQUMsSUFBSSxFQUFFLFFBQVEsQUFBQyxHQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ3RFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDaEIsQ0FBQyxDQUFDOztBQUVILEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQVEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7O0FBRWxDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVk7QUFDeEMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztBQUNwQyxNQUFJLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDOztBQUVqQyxTQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNsRSxDQUFDLENBQUMiLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSBcImV4cHJlc3NcIjtcbmltcG9ydCByZXF1ZXN0IGZyb20gXCJyZXF1ZXN0LXByb21pc2VcIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBSZWFjdERPTVNlcnZlciBmcm9tIFwicmVhY3QtZG9tL3NlcnZlclwiO1xuXG5jbGFzcyBKU09OVmlldyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMucHJvcHMuZGF0YTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwianNvbi1vYmplY3RcIj5cbiAgICAgICAge09iamVjdC5lbnRyaWVzKHZhbHVlKS5tYXAoXG4gICAgICAgICAgKFtrLHZdKSA9PiA8ZGl2IGNsYXNzTmFtZT1cImpzb24tb2JqZWN0LWVudHJ5XCI+XG4gICAgICAgICAgICB7a30ge3R5cGVvZiB2fVxuICAgICAgICAgICAgPC9kaXY+KX1cbiAgICAgIDwvZGl2PjtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAuZ2V0KCcvJywgKHJlcSwgcmVzKSA9PiB7XG4gIHJlcy5zZW5kKGBcbjwhRE9DVFlQRSBodG1sPlxuPGh0bWwgbGFuZz1cImVuXCI+XG48aGVhZD5cbiAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gIDx0aXRsZT5hcHA0PC90aXRsZT5cbjwvaGVhZD5cbjxib2R5PlxuICAke1JlYWN0RE9NU2VydmVyLnJlbmRlclRvU3RyaW5nKDxwPkhpIGV2ZXJ5b25lLi4uPC9wPil9XG5cbiAgPHNjcmlwdCBzcmM9XCIvdGVzdC5qc1wiPjwvc2NyaXB0PlxuPC9ib2R5PlxuPC9odG1sPlxuYCk7XG59KTtcblxuYXBwLmdldCgnL2FwaXRlc3QnLCAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgcmVxdWVzdCh7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9tZXRlb3IvbWV0ZW9yL2dpdC9jb21taXRzLzkwZTVkM2VhNzM5ODM0ZmNhOTkzN2JlYTA5MzU1OTAyMTVlZWZhODUnLFxuICAgIHFzOiB7XG4gICAgICBhY2Nlc3NfdG9rZW46ICc5OTY4YTk2OTcwYzQ0NzY1ZDE3NWM1YTEyMjgwZDYzY2E1ZmY0ZTdiJ1xuICAgIH0sXG4gICAganNvbjogdHJ1ZSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdkZ3JlZW5zcCBHaXRTY29wZSdcbiAgICB9LFxuICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlXG4gIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIHJlcy5qc29uKHtlcnJvcn0pO1xuICB9KS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgIHJlcy5zZW5kKFJlYWN0RE9NU2VydmVyLnJlbmRlclRvU3RyaW5nKDxKU09OVmlldyBkYXRhPXtyZXNwb25zZX0vPikpO1xuICB9KS5jYXRjaChuZXh0KTtcbn0pO1xuXG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKCdwdWJsaWMnKSk7XG5cbnZhciBzZXJ2ZXIgPSBhcHAubGlzdGVuKDMwMDAsIGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvc3QgPSBzZXJ2ZXIuYWRkcmVzcygpLmFkZHJlc3M7XG4gIHZhciBwb3J0ID0gc2VydmVyLmFkZHJlc3MoKS5wb3J0O1xuXG4gIGNvbnNvbGUubG9nKCdFeGFtcGxlIGFwcCBsaXN0ZW5pbmcgYXQgaHR0cDovLyVzOiVzJywgaG9zdCwgcG9ydCk7XG59KTtcbiJdfQ==