"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var requiresInteraction = exports.requiresInteraction = function requiresInteraction(errorMessage) {
  if (!errorMessage || !errorMessage.length) {
    return false;
  }

  return errorMessage.indexOf("consent_required") > -1 || errorMessage.indexOf("interaction_required") > -1 || errorMessage.indexOf("login_required") > -1;
};

var isIE = exports.isIE = function isIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ") > -1;
  var msie11 = ua.indexOf("Trident/") > -1;

  // If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
  // const isEdge = ua.indexOf("Edge/") > -1;

  return msie || msie11;
};

var initializeConfig = exports.initializeConfig = function initializeConfig(config) {
  var tenantSubdomain = config.tenant.split('.')[0];
  var instance = "https://" + tenantSubdomain + ".b2clogin.com/";
  var authority = "" + instance + config.tenant + "/" + config.signInPolicy;

  msalAppConfig.auth.clientId = config.clientId;
  msalAppConfig.auth.authority = authority;
  msalAppConfig.auth.redirectUri = config.redirectUri;
  msalAppConfig.auth.postLogoutRedirectUri = config.postLogoutRedirectUri;
  msalAppConfig.cache.cacheLocation = config.cacheLocation;

  B2C_SCOPES.API_ACCESS.scopes = config.scopes;
};

var B2C_SCOPES = exports.B2C_SCOPES = {
  API_ACCESS: {
    scopes: []
  }
};

var msalAppConfig = exports.msalAppConfig = {
  auth: {
    clientId: "",
    authority: "",
    redirectUri: "",
    validateAuthority: false,
    postLogoutRedirectUri: ""
  },
  cache: {
    cacheLocation: "",
    storeAuthStateInCookie: isIE()
  }
};