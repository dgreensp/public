CommonJSFormatter = require('babel-core/lib/transformation/modules/common');

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

MyFormatter = function () {
  return CommonJSFormatter.apply(this, arguments);
};

_inherits(MyFormatter, CommonJSFormatter);

MyFormatter.prototype.transform = function transform(program) {
  this.hasDefaultOnlyExport = false;
  CommonJSFormatter.prototype.transform.apply(this, arguments);
};

module.exports = MyFormatter;
