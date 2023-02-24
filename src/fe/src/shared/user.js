import { config } from './config';
import toast from 'react-hot-toast';


let authStatusChangeCallback = null;
let userLevel = 10000;


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
  getLevel: function() {
    return userLevel;
  },
  saveLevel: function(level) {
    userLevel = level;
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
        toast.error("User authentication expired.");
        auth.saveToken(null);
        authStatusChangeCallback();
      }
      else if (response.status == 403) {
        toast.error("You don't have access to this function.");
        return;
      }
      return {
        'status': 'fetch_error',
        'response': response
      }
    })
    .then(data_func);
  }
};


const user = {
  pullFilters: function(setFilters) {
    auth.get({base: '/filters'}, {}, ( data ) => {
      if (data.status == 'ok') {
        var f = data.data;
        if (Object.keys(f).length == 0)
          f = {
            'GHG Table': { query: 'table:GHG' }
          };
        var c = Object.keys(f)[0];
        setFilters(f);
      } else {
        console.warn('unhandled data', data);
      }
    });
  }
};

export {
  auth,
  user
};
