export const requiresInteraction = errorMessage => {
  if (!errorMessage || !errorMessage.length) {
    return false;
  }

  return (
    errorMessage.indexOf("consent_required") > -1 ||
    errorMessage.indexOf("interaction_required") > -1 ||
    errorMessage.indexOf("login_required") > -1
  );
};

export const isIE = () => {
  const ua = window.navigator.userAgent;
  const msie = ua.indexOf("MSIE ") > -1;
  const msie11 = ua.indexOf("Trident/") > -1;

  // If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
  // const isEdge = ua.indexOf("Edge/") > -1;

  return msie || msie11;
};

export const initializeConfig = (config) => {
  const tenantSubdomain = config.tenant.split('.')[0]
  const instance = `https://${tenantSubdomain}.b2clogin.com/`
  const authority = `${instance}${config.tenant}/${config.signInPolicy}`

  msalAppConfig.auth.clientId = config.clientId
  msalAppConfig.auth.authority = authority
  msalAppConfig.auth.redirectUri = config.redirectUri
  msalAppConfig.auth.postLogoutRedirectUri = config.postLogoutRedirectUri
  msalAppConfig.cache.cacheLocation = config.cacheLocation

  B2C_SCOPES.API_ACCESS.scopes = config.scopes
};

export const B2C_SCOPES = {
  API_ACCESS: {
    scopes: []
  }
};

export const msalAppConfig = {
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