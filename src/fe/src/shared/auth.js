import { config } from './config';


let authStatusChangeCallback = null;


const auth = {
  getToken: function() {
    return localStorage.getItem(config.storage_key);
  },
  saveToken: function(token) {
    if (token)
      localStorage.setItem(config.storage_key, token);
    else
      localStorage.removeItem(config.storage_key);
  },
  setStatusChangeCallback: function(func) {
    authStatusChangeCallback = func;
  },
  statusChanged: function() {
    authStatusChangeCallback();
  },
  get: function(endpoint, params, data_func) {
    return auth.fetch('GET', endpoint, params, data_func);
  },
  post: function(endpoint, params, data_func) {
    return auth.fetch('POST', endpoint, params, data_func);
  },
  /*
  auth.fetch provides re-login form display upon http
  401 error of any fetch action.
   */
  fetch: function(verb, endpoint, params, data_func) {
    if (typeof(endpoint) == 'object') {
      let _ = endpoint.base;
      var hasFolder = false;
      if (endpoint.folder &&
        endpoint.folder !== '|') {
        _ += '/' + endpoint.folder;
        hasFolder = true;
      }
      if (endpoint.rest) {
        if (!hasFolder)
          _ += '/';
        _ += endpoint.rest;
      }
      endpoint = _;
    }
    fetch(config.endpoint_base + endpoint, {
      method: verb,
      headers: {
        'Authorization': 'Bearer ' + auth.getToken()
      },
      ...params
    })
    .then(( response ) => {
      if (response.status == 200) {
        return response.json();
      }
      // reauth?
      else if (response.status == 401) {
        auth.saveToken(null);
        authStatusChangeCallback();
      }
      return {
        'status': 'fetch_error',
        'response': response
      }
    })
    .then(data_func);
  }
};


export { auth };
