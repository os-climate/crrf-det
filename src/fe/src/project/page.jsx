import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scn } from '../shared/styles';
import ProjectPreview from './preview';
import ProjectNew from './new';
import { AutoAvatar } from '../shared/widgets';
import { auth, user } from '../shared/user';


const projects_ = [
  { name: 'Test' },
  { name: 'Test2' },
  { name: 'US Listed 2022' },
  { name: '2022 Oil'},
  { name: '2022 Energy'},
  { name: 'Trial 20221212'},
  { name: 'Trial 20221213'},
  { name: 'Trial 20221214'},
  { name: 'Shiming\'s first batch'},
  { name: 'Shiming\'s 1230939030349 batch'},
];


function hash(input) {
  var hash_ = 0,
    i, chr;
  if (input.length === 0) return hash_;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash_ = ((hash << 5) - hash_) + chr;
    hash_ |= 0; // Convert to 32bit integer
  }
  return hash_;
}


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
      console.log('projIndex changed', projects[projIndex], projName, data);
    });
  }, [ projIndex ]);

  return (
    <div>
      <div className="left-2 top-1 absolute right-0 h-10 flex items-center">
        <input type="text" placeholder={`Search ${projects.length} projects ...`} className={`${scn.input} max-w-xs h-9 mr-2`} />
        <Link to="/projects/__new__" className={`${scn.primaryButton}`}><i className="icon-plus mr-1"/>New Project</Link>
      </div>

      <div className="left-2 top-11 right-1/2 bottom-2 absolute overflow-auto">
      { projects.map((project, idx) => (
        <ProjectAvatar key={idx} index={idx} projIndex={projIndex} setProjIndex={setProjIndex} project={project}/>
        ))}
      </div>

      <ProjectPreview detail={ detail }/>
    </div>
  )
}


export default function ProjectPage({ listview }) {
  const { name } = useParams();

  return (
    <div className="text-base">
      { name && name === '__new__' ? (<ProjectNew listview={ listview } />):(null) }
      { typeof name === 'undefined'? (<ProjectList/>):(null)}
    </div>
  )
}
