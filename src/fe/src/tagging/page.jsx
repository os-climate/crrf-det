import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import oscLogo from '../assets/osc-logo-gray.png'
import toast from 'react-hot-toast';
import { scn } from '../shared/styles';
import { auth } from '../shared/user';
import TaggingView from './view';


var id_toast_loading_annotation = null;


function ProjectSelector({ setProject }) {

  const [ projects, setProjects ] = useState([]);
  const [ selected, setSelected ] = useState('none');

  const navigate = useNavigate();

  useEffect(() => {
    auth.get({base: '/projects/list_tagging'}, {}, (data) => {
      if (data.data)
        setProjects(data.data);
    });
  }, []);

  function selectProject(e) {
    id_toast_loading_annotation = toast.loading(<span>Loading { selected }</span>);
    auth.get({base: '/projects/open_tagging/' + selected}, {}, (data) => {
      if (!data.data)
        toast.error(<span>Error: Failed to open { selected }.</span>, {
          id: id_toast_loading_annotation
        });
      else {
        toast.success(<span>Project { selected } loaded successfully.</span>, {
          id: id_toast_loading_annotation
        });
        setProject(selected);
      }
    });
  }

  function doLogOut(e) {
    auth.saveToken(null);
    navigate('/');
    auth.statusChanged();
  }

  return (<div className="p-3">
    <div className="text-slate-600">Select a Project to Start Annotation</div>
    <div className="my-3">
      <select className="select select-bordered w-full max-w-xs" value={ selected } onChange={ e => setSelected(e.target.value) }>
        <option disabled value="none">Select a Project</option>
      { projects.map((name, idx) => (
        <option value={ name } key={ idx }>{ name }</option>
      ))}
      </select>
    </div>
    <div>
      <button className={`btn px-8 py-0 ${scn.primaryButton}`} onClick={ selectProject } disabled={ selected == 'none' }>Go</button>
    </div>
    <div className="mt-5">
      <div className="h-px bg-slate-200 w-full my-5"></div>
      <button className={`${scn.primaryButton}`} onClick={ doLogOut }>Log Out</button>
    </div>
  </div>)
}


export default function TaggingPage() {

  const [ project, setProject ] = useState();

  return (
    <div>
      <div className="p-3 bg-slate-100 border-b border-slate-200 text-center flex items-center" style={{ height: '50px' }}>
        <img src={oscLogo} className="w-6 h-6"/>
        <span className="ml-3 text-slate-600">CRRF Data Extraction</span>
        <span className="ml-2 text-teal-500 text-sm"><i className="icon-tag mr-1"/>Annotation</span>
      </div>
      { project?(<TaggingView project={ project }/>):(<ProjectSelector setProject={ setProject }/>) }
    </div>
  )
}
