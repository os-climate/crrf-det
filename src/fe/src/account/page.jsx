import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scn } from "../shared/styles";
import { auth, user } from '../shared/user';


export default function AccountPage() {
  const [ working, setWorking ] = useState(false);
  const [ cpass, setCPass ] = useState('');
  const [ npass, setNPass ] = useState('');
  const [ cnpass, setCNPass ] = useState('');
  const [ error, setError ] = useState('');
  const [ type, setType ] = useState('none');
  const [ ginvite, setGInvite ] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // password checker
    if (cpass.length == 0)
      setError('Please enter the current password.');
    else if (npass.length == 0)
      setError('Please enter the new password.');
    else if (npass == cpass)
      setError('New password must not be the same as the current one.');
    else if (cnpass.length == 0)
      setError('Please confirm the new password.');
    else if (cnpass != npass)
      setError('New password confirmation must match.');
    else
      setError('');
  }, [ cpass, npass, cnpass ]);

  function doChangePassword(e) {

  }

  function doGenerateInvite(e) {
    auth.post({base: '/users/generate_invite'}, {
      body: JSON.stringify({ level: type })
    }, (data) => {
      if (!data)
        return;
      var url = window.location.protocol + "//" + window.location.host + '/#/register/' + data.data;
      setGInvite(url);
      navigator.clipboard.writeText(url);
    });
  }

  function doLogOut(e) {
    auth.saveToken(null);
    navigate('/');
    auth.statusChanged();
  }

  return (
    <div className="text-base">

      <div className="left-2 top-1 absolute">
        <span className="px-2 py-1 border border-white block"><i className="icon-archive text-slate-500 pl-1 pr-6"/>My Account (Administrator)</span>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
        <div className="ml-2 mb-2">
          <strong>Change Password</strong>
        </div>
        <div className="ml-2 mb-2">
          <input type="password" placeholder="Current Password" className="input input-bordered w-full max-w-xs" onChange={ e => setCPass(e.target.value) } value={ cpass }/>
        </div>
        <div className="ml-2 mb-2">
          <input type="password" placeholder="New Password" className="input input-bordered w-full max-w-xs" onChange={ e => setNPass(e.target.value) } value={ npass }/>
        </div>
        <div className="ml-2 mb-2">
          <input type="password" placeholder="Confirm New Password" className="input input-bordered w-full max-w-xs" onChange={ e => setCNPass(e.target.value) } value={ cnpass }/>
        </div>
        <div className="ml-2 mb-2">
          <div className="mb-2">
          { error.length == 0?
          (<span>You will need to log in again using the new password after the change.</span>):
          (<span className="text-error">{error}</span>)}
          </div>
          <button className={`${scn.primaryButton} ${working?'loading':''}`} disabled={ error.length != 0 || working } onClick={ doChangePassword }>{ working?(<span>Changing Password ...</span>):(<span>Change Password</span>)}</button>
        </div>

        <div className="ml-2 mt-9 mb-2">
          <strong>Generate an Invitation</strong>
        </div>
        <div className="ml-2 mb-2">
          <select className="select select-bordered w-full max-w-xs" value={ type } onChange={ e => setType(e.target.value) }>
            <option disabled value="none">Pick a Type</option>
            <option value="100">Common User</option>
            <option value="0">Administrator</option>
          </select>
        </div>
        <div className="ml-2 mb-2">
          <button className={`${scn.primaryButton}`} onClick={ doGenerateInvite } disabled={ type == 'none' }>Generate</button>
          { ginvite.length > 0?(
            <span className="ml-2">Invite link <strong>{ ginvite }</strong> is copied to clipboard!</span>
            ):(null)}
        </div>

        <div className="ml-2 mt-9 mb-2">
          <strong>Log Out</strong>
        </div>
        <div className="ml-2 mb-2">
          <button className={`${scn.primaryButton}`} onClick={ doLogOut }>Log Out</button>
        </div>
      </div>

    </div>
  )
}
