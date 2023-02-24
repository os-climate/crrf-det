import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scn } from '../shared/styles';
import ProjectPreview from './preview';
import ProjectNew from './new';
import ProjectReview from './review';
import { AutoAvatar } from '../shared/widgets';
import { auth, user } from '../shared/user';


function ProjectAvatar({ index, projIndex, setProjIndex, project }) {

  function selectProject(e) {
    setProjIndex(parseInt(e.currentTarget.getAttribute('data-project-index')));
  }

  return (
    <div className="inline-block w-36 text-center align-middle">
      <button className={`mt-2 p-2 bg-white hover:border-teal-500 ${ index === projIndex?'border-teal-500':''}`} onClick={selectProject} data-project-index={index}>
        <AutoAvatar name={ project.display_name } width={6} height={6} margin={2} textSize="text-3xl" styledTextSize="text-6xl" />
      </button>
      <div className={`w-36 text-slate-600 ${ index === projIndex?'font-bold':''}`}>{ project.display_name }</div>
    </div>
  )
}


function ProjectList() {
  const [ projIndex, setProjIndex ] = useState(-1);
  const [ projects, setProjects ] = useState([]);
  const [ detail, setDetail ] = useState();

  useEffect(() => {
    auth.get({base: '/projects'}, {}, (data) => {
      setProjects(data.data);
    })
  }, []);

  useEffect(() => {
    setProjIndex(-1);
  }, [ projects ]);

  useEffect(() => {
    if (projIndex < 0)
      return;
    var projName = projects[projIndex].name.substr(0, projects[projIndex].name.length - 5);
    auth.get({base: '/projects/detail/' + projName}, {}, (data) => {
      setDetail(data.data);
    });
  }, [ projIndex ]);

  return (
    <div>
      <div className="left-2 top-1 absolute right-0 h-10 flex items-center">
        <input type="text" placeholder={`Search ${projects?projects.length:0} projects ...`} className={`${scn.input} max-w-xs h-9 mr-2`} />
        <Link to="/projects/__new__" className={`${scn.primaryButton} min-h-[2.25rem] h-9`}><i className="icon-plus mr-1"/>New Project</Link>
      </div>

      <div className="left-2 top-11 right-1/2 bottom-2 absolute overflow-auto">
      { projects?projects.map((project, idx) => (
        <ProjectAvatar key={idx} index={idx} projIndex={projIndex} setProjIndex={setProjIndex} project={project}/>
        )):(null)}
      </div>

      <ProjectPreview detail={ detail }/>
    </div>
  )
}


export default function ProjectPage({ listview }) {
  const { name } = useParams();
  const [ path, set_path ] = useState();
  listview.path = path;
  listview.set_path = set_path;

  return (
    <div className="text-base">
      { typeof name === 'undefined' ? (<ProjectList/>):
        (<div>
        { name && name === '__new__' ? (<ProjectNew listview={ listview } />):(<ProjectReview listview={ listview } name={ name }/>) }
        </div>)
      }
    </div>
  )
}
