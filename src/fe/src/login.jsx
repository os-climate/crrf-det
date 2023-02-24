import { useState } from 'react';
import { config } from './shared/config';
import { auth } from './shared/user';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from "react-router-dom";
import { CenteredTitle } from './shared/widgets';


export default function Login({ setRefresh }) {
  const [ username, setUsername ] = useState();
  const [ password, setPassword ] = useState();
  const [ working, setWorking ] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  function doLogin(e) {
    setWorking(true);
    setTimeout(() => {
      fetch(config.endpoint_base + '/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      })
      .then(( response ) => response.json())
      .then(( data ) => {
        if (data.status == 401)
          toast.error("Wrong user name or password!");
        else if (data.status == 500)
          toast.error("Internal system error! Please try again later.");
        else if (data.status == 'ok') {
          auth.saveToken(data.data.token);
          auth.saveLevel(data.data.level);
          setTimeout(() => {
            let targetUrl = location.pathname;
            if (targetUrl == '/') {
              if (data.data.level == 0)
                targetUrl = '/documents';
              else
                targetUrl = '/tagging';
            }
            navigate(targetUrl);
            auth.statusChanged();
          });
        }
        setWorking(false);
      });
    });
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center mb-20">
        <div className="max-w-md">
          <CenteredTitle />
          <p className="pt-6 pb-3">
            Please login to continue.
          </p>
          <p className="pb-6 pt-3">
            <input type="text" placeholder="User name" onChange={ e => setUsername(e.target.value) } className="input input-bordered w-full max-w-xs mb-3" />
            <input type="password" placeholder="Password" onChange={ e => setPassword(e.target.value) } className="input input-bordered w-full max-w-xs" />
          </p>
          <div className="h-14">
          { working ? (
          <progress className="progress w-56"></progress>
          ):(
          <button className="btn btn-primary btn-wide" onClick={ doLogin }>Login</button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}