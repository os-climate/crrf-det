import { useState, useEffect } from 'react';
import { scn } from "../shared/styles";
import { Steps, StepContent, StepMaster, steps } from './steps';


export default function ProjectNew({ listview }) {
  const [ taskid, set_taskid ] = useState();
  const [ taskstatus, set_taskstatus ] = useState(false);
  const [ results, set_results ] = useState();
  const [ rindex, set_rindex ] = useState(-1);
  const [ segments, set_segments ] = useState();
  const [ filters_tags, set_filters_tags ] = useState({});

  const run = { taskid, set_taskid, taskstatus, set_taskstatus, results, set_results, rindex, set_rindex, segments, set_segments, filters_tags, set_filters_tags }

  return (
    <div className="text-base">
      <div className="text-slate-600 left-2 top-1 absolute right-0 h-10 px-3 py-2"><i className="icon-briefcase text-slate-500 mr-3"/>Create a New Project</div>
      <StepMaster listview={ listview } run={ run }/>
    </div>
  )
}
