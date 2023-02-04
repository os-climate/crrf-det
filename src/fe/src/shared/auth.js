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
  /*
  auth.fetch provides re-login form display upon http
  401 error of any fetch action.
   */
  fetch: function(endpoint, params, data_func) {
    fetch(endpoint, params)
    .then(( response ) => {
      // reauth?
      if (response.status == 401) {
        auth.saveToken(null);
        authStatusChangeCallback();
        //console.log('response', response);
      } else
        return response.json();
    })
    .then(data_func);
  }
};


export { auth };
