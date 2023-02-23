import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { config } from './shared/config';
import { auth } from './shared/user';
import toast from 'react-hot-toast';
import { CenteredTitle } from './shared/widgets';


export default function Register() {
  const { invite_code } = useParams();

  const [ invite, setInvite ] = useState(invite_code);
  const [ username, setUsername ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ cpassword, setCPassword ] = useState('');
  const [ error, setError ] = useState('');
  const [ working, setWorking ] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // password checker
    if (!invite ||
      invite.length == 0)
      setError('Registration requires an invite code.');
    else if (username.length == 0)
      setError('Please enter the user name.');
    else if (password.length == 0)
      setError('Please enter the password.');
    else if (cpassword.length == 0)
      setError('Please enter password confirmation.');
    else if (password != cpassword)
      setError('Password confirmation must match.');
    else
      setError('');
  }, [ invite, username, password, cpassword ]);

  function doRegister(e) {
    setWorking(true);
    setTimeout(() => {
      fetch(config.endpoint_base + '/users/new_from_invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password, invite: invite })
      })
      .then(( response ) => response.json())
      .then(( data ) => {
        if (data.status == 'ok') {
          toast.success("Registration succeeded.");
          navigate("/");
        } else {
          toast.error("Registration has failed!");
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
          <p className="pt-6 pb-3 font-bold">
            User Registration
          </p>
          <p className="pb-3 pt-3">
            <input type="text" placeholder="Invite" onChange={ e => setInvite(e.target.value) } value={ invite } className="input input-bordered w-full max-w-xs mb-3" />
            <input type="text" placeholder="User name" onChange={ e => setUsername(e.target.value) } value={ username } className="input input-bordered w-full max-w-xs mb-3" />
            <input type="password" placeholder="Password" onChange={ e => setPassword(e.target.value) } value={ password } className="input input-bordered w-full max-w-xs mb-3" />
            <input type="password" placeholder="Confirm Password" onChange={ e => setCPassword(e.target.value) } value={ cpassword } className="input input-bordered w-full max-w-xs" />
          </p>
          <p className="pb-6 pt-3">
            { error }
          </p>
          <div className="h-14">
          { working ? (
          <progress className="progress w-56"></progress>
          ):(
          <button className="btn btn-primary btn-wide" disabled={ error.length != 0 } onClick={ doRegister }>Register</button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}