// note on window.msal usage. There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function and these occur before
// any local assignment can take place. Not nice but its how it works.
import * as Msal from 'msal'
import React from 'react'

const LOCAL_STORAGE = 'localStorage'
const SESSION_STORAGE = 'sessionStorage'
const AUTHORIZATION_KEY = 'Authorization'

const state = {
  stopLoopingRedirect: false,
  launchApp: null,
  accessToken: null,
  scopes: [],
  cacheLocation: null
}

function authCallback (errorDesc, token, error, tokenType) {
  if (errorDesc && errorDesc.indexOf('AADB2C90118') > -1) {
    redirect()
  } else if (errorDesc) {
    state.stopLoopingRedirect = true
  } else {
    acquireToken()
  }
}

function redirect () {
  acquireToken()
}

function acquireToken (successCallback) {
  const user = window.msal.getUser(state.scopes)
  if (!user) {
    window.msal.loginRedirect(state.scopes)
  } else {
    window.msal.acquireTokenSilent(state.scopes).then(accessToken => {
      if (state.cacheLocation === LOCAL_STORAGE) {
        window.localStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken)
      } else {
        window.sessionStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken)
      }

      state.accessToken = accessToken
      if (state.launchApp) {
        state.launchApp()
      }
      if (successCallback) {
        successCallback()
      }
    }, error => {
      if (error) {
        window.msal.acquireTokenRedirect(state.scopes)
      }
    })
  }
}

function acquireTokenWithoutLogin (successCallback) {
  const user = window.msal.getUser(state.scopes)
  if (user) {
    window.msal.acquireTokenSilent(state.scopes).then(accessToken => {
      if (state.cacheLocation === LOCAL_STORAGE) {
        window.localStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken)
      } else {
        window.sessionStorage.setItem(AUTHORIZATION_KEY, 'Bearer ' + accessToken)
      }

      state.accessToken = accessToken
      if (successCallback) {
        successCallback()
      }
    })
  }
}

const cleanUpStorage = cacheLocation => {
  if (cacheLocation === LOCAL_STORAGE) {
    window.localStorage.removeItem(AUTHORIZATION_KEY)
  } else if (cacheLocation === SESSION_STORAGE) {
    window.sessionStorage.removeItem(AUTHORIZATION_KEY)
  }
}

const authentication = {
  initialize: (config) => {
    const tenantSubdomain = config.tenant.split('.')[0]
    const instance = `https://${tenantSubdomain}.b2clogin.com/tfp/`
    const authority = `${instance}${config.tenant}/${config.signInPolicy}`
    cleanUpStorage(config.cacheLocation)
    let scopes = config.scopes
    if (!scopes || scopes.length === 0) {
      console.log('To obtain access tokens you must specify one or more scopes. See https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-access-tokens')
      state.stopLoopingRedirect = true
    }
    state.scopes = scopes
    state.cacheLocation = config.cacheLocation

    if (config.redirectUri) {
      new Msal.UserAgentApplication(
        config.clientId,
        authority,
        authCallback,
        {
          cacheLocation: config.cacheLocation,
          redirectUri: config.redirectUri,
          postLogoutRedirectUri: config.postLogoutRedirectUri,
          validateAuthority: false
        }
      )
    } else {
      new Msal.UserAgentApplication(
        config.clientId,
        authority,
        authCallback,
        {
          cacheLocation: config.cacheLocation,
          validateAuthority: false
        }
      )
    }
  },
  run: (launchApp) => {
    state.launchApp = launchApp
    if (!window.msal.isCallback(window.location.hash) && window.parent === window && !window.opener) {
      if (!state.stopLoopingRedirect) {
        acquireToken()
      }
    }
  },
  required: (WrappedComponent, renderLoading) => {
    return class extends React.Component {
      constructor (props) {
        super(props)
        this.state = {
          signedIn: false,
          error: null
        }
      }

      componentWillMount () {
        acquireToken(() => {
          this.setState({
            signedIn: true
          })
        })
      }

      render () {
        if (this.state.signedIn) {
          return (<WrappedComponent {...this.props} />)
        }
        return typeof renderLoading === 'function' ? renderLoading() : null
      }
    }
  },
  signOut: () => window.msal.logout(),
  getAccessToken: () => state.accessToken,
  acquireTokenWithoutLogin: (callback) => acquireTokenWithoutLogin(callback)
}

export default authentication
