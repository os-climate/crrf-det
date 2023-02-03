import { config } from './config';


const auth = {
  getToken: function() {
    return localStorage.getItem(config.storage_key);
  },
  saveToken: function(token) {
    if (token)
      localStorage.setItem(config.storage_key, token);
    else
      localStorage.removeItem(config.storage_key);
  }
};


export { auth };
