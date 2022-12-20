import { ModeTab } from '../shared/widgets';
import { AutoAvatar } from '../shared/widgets';
import { scn } from '../shared/styles';


export default function ProjectPreview({ mode, setMode, project }) {
  var curPrj = [];
  if (project) {
    curPrj.push(<table className="mb-2" key={project.name}><tbody><tr>
      <td className="align-top pr-2"><AutoAvatar name={ project.name } width={2} height={2} margin={2} textSize="text-lg" styledTextSize="text-lg" /></td>
      <td className="align-top">
        <div className="text-lg text-slate-700">{project.name}</div>
        <div className="text-sm text-slate-400">20 filters and 60 tags</div>
        <div className="text-sm text-slate-400">33 files</div>
        <div className="mt-2">
          <button className={scn.primaryButton}>Edit and Review</button>
        </div>
      </td>
    </tr></tbody></table>);
  }

  return (
    <div className="top-11 left-2/3 right-1 bottom-1 absolute">
      <div>{curPrj}</div>
      <ModeTab modes={ {'objective': 'Objective', 'files': 'Files'} } mode={mode} setMode={setMode}/>
      <div className="p-2 border border-slate-100">
        I'm project preview { project?project.name:'' }
      </div>
    </div>
  )
}