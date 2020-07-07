'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _msal = require('msal');

var msal = _interopRequireWildcard(_msal);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _authUtils = require('./auth-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // note on window.msal usage. There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function and these occur before
// any local assignment can take place. Not nice but its how it works.


var LOCAL_STORAGE = 'localStorage';
var SESSION_STORAGE = 'sessionStorage';
var AUTHORIZATION_KEY = 'Authorization';

var state = {
  stopLoopingRedirect: false,
  config: {
    scopes: [],
    cacheLocation: null
  },
  launchApp: null,
  accessToken: null,
  msalObj: null
};

var msalApp = void 0;

function acquireToken(successCallback) {
  var account = msalApp.getAccount();

  if (!account) {
    msalApp.loginRedirect(_authUtils.B2C_SCOPES.API_ACCESS);
  } else {
    msalApp.acquireTokenSilent(_authUtils.B2C_SCOPES.API_ACCESS).then(function (accessToken) {
      if (_authUtils.msalAppConfig.cache.cacheLocation === LOCAL_STORAGE) {
        window.localStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken);
      } else {
        window.sessionStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken);
      }

      state.accessToken = accessToken;
      if (state.launchApp) {
        state.launchApp();
      }
      if (successCallback) {
        successCallback();
      }
    }, function (error) {
      if (error) {
        msalApp.acquireTokenRedirect(_authUtils.B2C_SCOPES.API_ACCESS);
      }
    });
  }
}

var authentication = {
  initialize: function initialize(config) {
    (0, _authUtils.initializeConfig)(config);
    msalApp = new msal.UserAgentApplication(_authUtils.msalAppConfig);
  },
  run: function run(launchApp) {
    state.launchApp = launchApp;
    msalApp.handleRedirectCallback(function (error) {
      if (error) {
        var errorMessage = error.errorMessage ? error.errorMessage : "Unable to acquire access token.";
        console.log(errorMessage);
      }
    });
    acquireToken();
  },
  required: function required(WrappedComponent, renderLoading) {
    return function (_React$Component) {
      _inherits(_class, _React$Component);

      function _class(props) {
        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props));

        _this.state = {
          signedIn: false,
          error: null
        };
        return _this;
      }

      _createClass(_class, [{
        key: 'render',
        value: function render() {
          if (this.state.signedIn) {
            return _react2.default.createElement(WrappedComponent, this.props);
          }
          return typeof renderLoading === 'function' ? renderLoading() : null;
        }
      }]);

      return _class;
    }(_react2.default.Component);
  },
  signOut: function signOut() {
    return msalApp.logout();
  },
  getAccessToken: function getAccessToken() {
    return state.accessToken;
  }
};

exports.default = authentication;