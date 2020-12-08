'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _msal = require('msal');

var Msal = _interopRequireWildcard(_msal);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

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
  launchApp: null,
  accessToken: null,
  scopes: [],
  cacheLocation: null
};

function authCallback(errorDesc, token, error, tokenType) {
  if (errorDesc && errorDesc.indexOf('AADB2C90118') > -1) {
    redirect();
  } else if (errorDesc) {
    state.stopLoopingRedirect = true;
  } else {
    acquireToken();
  }
}

function redirect() {
  acquireToken();
}

function acquireToken(successCallback) {
  var user = window.msal.getUser(state.scopes);
  if (!user) {
    window.msal.loginRedirect(state.scopes);
  } else {
    window.msal.acquireTokenSilent(state.scopes).then(function (accessToken) {
      if (state.cacheLocation === LOCAL_STORAGE) {
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
        window.msal.acquireTokenRedirect(state.scopes);
      }
    });
  }
}

function _acquireTokenWithoutLogin(successCallback) {
  var user = window.msal.getUser(state.scopes);
  if (user) {
    window.msal.acquireTokenSilent(state.scopes).then(function (accessToken) {
      if (state.cacheLocation === LOCAL_STORAGE) {
        window.localStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken);
      } else {
        window.sessionStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken);
      }

      state.accessToken = accessToken;
      if (successCallback) {
        successCallback();
      }
    });
  }
}

var cleanUpStorage = function cleanUpStorage(cacheLocation) {
  if (cacheLocation === LOCAL_STORAGE) {
    window.localStorage.removeItem(AUTHORIZATION_KEY);
  } else if (cacheLocation === SESSION_STORAGE) {
    window.sessionStorage.removeItem(AUTHORIZATION_KEY);
  }
};

var authentication = {
  initialize: function initialize(config) {
    var tenantSubdomain = config.tenant.split('.')[0];
    var instance = 'https://' + tenantSubdomain + '.b2clogin.com/tfp/';
    var authority = '' + instance + config.tenant + '/' + config.signInPolicy;
    cleanUpStorage(config.cacheLocation);
    var scopes = config.scopes;
    if (!scopes || scopes.length === 0) {
      console.log('To obtain access tokens you must specify one or more scopes. See https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-access-tokens');
      state.stopLoopingRedirect = true;
    }
    state.scopes = scopes;
    state.cacheLocation = config.cacheLocation;

    if (config.redirectUri) {
      new Msal.UserAgentApplication(config.clientId, authority, authCallback, {
        cacheLocation: config.cacheLocation,
        redirectUri: config.redirectUri,
        postLogoutRedirectUri: config.postLogoutRedirectUri,
        validateAuthority: false
      });
    } else {
      new Msal.UserAgentApplication(config.clientId, authority, authCallback, {
        cacheLocation: config.cacheLocation,
        validateAuthority: false
      });
    }
  },
  run: function run(launchApp) {
    state.launchApp = launchApp;
    if (!window.msal.isCallback(window.location.hash) && window.parent === window && !window.opener) {
      if (!state.stopLoopingRedirect) {
        acquireToken();
      }
    }
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
        key: 'componentWillMount',
        value: function componentWillMount() {
          var _this2 = this;

          acquireToken(function () {
            _this2.setState({
              signedIn: true
            });
          });
        }
      }, {
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
    return window.msal.logout();
  },
  getAccessToken: function getAccessToken() {
    return state.accessToken;
  },
  acquireTokenWithoutLogin: function acquireTokenWithoutLogin(callback) {
    return _acquireTokenWithoutLogin(callback);
  }
};

exports.default = authentication;