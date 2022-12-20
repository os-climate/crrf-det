import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scn } from '../shared/styles';
import ProjectPreview from './preview';
import ProjectNew from './new';
import { AutoAvatar } from '../shared/widgets';


const projects = [
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


function ProjectAvatar({ index, curPrjIdx, setCurPrjIdx, project }) {

  function selectProject(e) {
    setCurPrjIdx(parseInt(e.currentTarget.getAttribute('data-project-index')));
  }

  return (
    <div className="inline-block w-36 text-center align-middle">
      <button className={`mt-2 p-2 bg-white hover:border-teal-500 ${ index === curPrjIdx?'border-teal-500':''}`} onClick={selectProject} data-project-index={index}>
        <AutoAvatar name={ project.name } width={6} height={6} margin={2} textSize="text-3xl" styledTextSize="text-6xl" />
      </button>
      <div className={`w-36 text-slate-600 ${ index === curPrjIdx?'font-bold':''}`}>{ project.name }</div>
    </div>
  )
}


export default function ProjectPage() {
  const { name } = useParams();

  const [mode, setMode] = useState('objective');
  const [curPrjIdx, setCurPrjIdx] = useState(-1);

  return (
    <div className="text-base">
      { name && name === '__new__' ? (<ProjectNew/>):(null) }
      { typeof name === 'undefined'? (
        <div>
          <div className="left-2 top-1 absolute right-0 h-10 flex items-center">
            <input type="text" placeholder={`Search ${projects.length} projects ...`} className={`${scn.input} max-w-xs h-9 mr-2`} />
            <Link to="/projects/__new__" className={`${scn.primaryButton}`}><i className="icon-plus mr-1"/>New Project</Link>
          </div>

          <div className="left-2 top-11 right-1/3 bottom-2 absolute overflow-auto">
          { projects.map((project, idx) => (
            <ProjectAvatar key={idx} index={idx} curPrjIdx={curPrjIdx} setCurPrjIdx={setCurPrjIdx} project={project}/>
            ))}
          </div>

          <ProjectPreview mode={mode} setMode={setMode} project={ curPrjIdx >= 0?projects[curPrjIdx]:null }/>
        </div>
      ):(null)}
    </div>
  )
}
