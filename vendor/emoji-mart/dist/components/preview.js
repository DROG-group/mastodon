"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("../utils");

var _nimbleEmoji = _interopRequireDefault(require("./emoji/nimble-emoji"));

var _skinsEmoji = _interopRequireDefault(require("./skins-emoji"));

var _skinsDot = _interopRequireDefault(require("./skins-dot"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Preview = /*#__PURE__*/function (_React$PureComponent) {
  (0, _inherits2["default"])(Preview, _React$PureComponent);

  var _super = _createSuper(Preview);

  function Preview(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, Preview);
    _this = _super.call(this, props);
    _this.data = props.data;
    _this.state = {
      emoji: null
    };
    return _this;
  }

  (0, _createClass2["default"])(Preview, [{
    key: "render",
    value: function render() {
      var emoji = this.state.emoji,
          _this$props = this.props,
          emojiProps = _this$props.emojiProps,
          skinsProps = _this$props.skinsProps,
          showSkinTones = _this$props.showSkinTones,
          title = _this$props.title,
          idleEmoji = _this$props.emoji,
          i18n = _this$props.i18n,
          showPreview = _this$props.showPreview;

      if (emoji && showPreview) {
        var emojiData = (0, _utils.getData)(emoji, null, null, this.data),
            _emojiData$emoticons = emojiData.emoticons,
            emoticons = _emojiData$emoticons === void 0 ? [] : _emojiData$emoticons,
            knownEmoticons = [],
            listedEmoticons = [];
        emoticons.forEach(function (emoticon) {
          if (knownEmoticons.indexOf(emoticon.toLowerCase()) >= 0) {
            return;
          }

          knownEmoticons.push(emoticon.toLowerCase());
          listedEmoticons.push(emoticon);
        });
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview"
        }, /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-emoji",
          "aria-hidden": "true"
        }, (0, _nimbleEmoji["default"])(_objectSpread({
          key: emoji.id,
          emoji: emoji,
          data: this.data
        }, emojiProps))), /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-data",
          "aria-hidden": "true"
        }, /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-name"
        }, emoji.name), /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-shortnames"
        }, emojiData.short_names.map(function (short_name) {
          return /*#__PURE__*/_react["default"].createElement("span", {
            key: short_name,
            className: "emoji-mart-preview-shortname"
          }, ":", short_name, ":");
        })), /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-emoticons"
        }, listedEmoticons.map(function (emoticon) {
          return /*#__PURE__*/_react["default"].createElement("span", {
            key: emoticon,
            className: "emoji-mart-preview-emoticon"
          }, emoticon);
        }))));
      } else {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview"
        }, /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-emoji",
          "aria-hidden": "true"
        }, idleEmoji && idleEmoji.length && (0, _nimbleEmoji["default"])(_objectSpread({
          emoji: idleEmoji,
          data: this.data
        }, emojiProps))), /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-data",
          "aria-hidden": "true"
        }, /*#__PURE__*/_react["default"].createElement("span", {
          className: "emoji-mart-title-label"
        }, title)), showSkinTones && /*#__PURE__*/_react["default"].createElement("div", {
          className: "emoji-mart-preview-skins".concat(skinsProps.skinEmoji ? ' custom' : '')
        }, skinsProps.skinEmoji ? /*#__PURE__*/_react["default"].createElement(_skinsEmoji["default"], {
          skin: skinsProps.skin,
          emojiProps: emojiProps,
          data: this.data,
          skinEmoji: skinsProps.skinEmoji,
          i18n: i18n,
          onChange: skinsProps.onChange
        }) : /*#__PURE__*/_react["default"].createElement(_skinsDot["default"], {
          skin: skinsProps.skin,
          i18n: i18n,
          onChange: skinsProps.onChange
        })));
      }
    }
  }]);
  return Preview;
}(_react["default"].PureComponent);

exports["default"] = Preview;
Preview.propTypes
/* remove-proptypes */
= {
  showSkinTones: _propTypes["default"].bool,
  title: _propTypes["default"].string.isRequired,
  emoji: _propTypes["default"].string.isRequired,
  emojiProps: _propTypes["default"].object.isRequired,
  skinsProps: _propTypes["default"].object.isRequired
};
Preview.defaultProps = {
  showSkinTones: true,
  onChange: function onChange() {}
};