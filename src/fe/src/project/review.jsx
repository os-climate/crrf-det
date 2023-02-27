import { useState, useEffect } from 'react';
import { scn } from "../shared/styles";
import { Steps, StepContent, StepMaster, steps } from './steps';
import { auth, user } from '../shared/user';


export default function ProjectReview({ listview, name }) {
  const [ taskid, set_taskid ] = useState();
  const [ taskstatus, set_taskstatus ] = useState(false);
  const [ results, set_results ] = useState();
  const [ rindex, set_rindex ] = useState(-1);
  const [ segments, set_segments ] = useState();
  const [ filters_tags, set_filters_tags ] = useState({});

  const [ displayname, set_displayname ] = useState(name);

  const run = { taskid, set_taskid, taskstatus, set_taskstatus, results, set_results, rindex, set_rindex, segments, set_segments, filters_tags, set_filters_tags, name, displayname }

  const [ displayName, setDisplayName ] = useState(name);

  useEffect(() => {
    auth.get({base: '/projects/detail/' + name}, {}, (data) => {
      var p = data.data;
      set_displayname(p.name);
      set_taskid(p.run_id);
      listview.set_path(p.path);
      listview.try_select(p.files);
      var fts = {};
      for (var k in p.filters) {
        if (!p.filters.hasOwnProperty(k))
          continue;
        fts['filter__' + k] = true;
        for (let label of p.filters[k])
          fts['filter__' + k + '__tag__' + label] = true;
      }
      set_filters_tags(fts);
    });
  }, []);

  return (
    <div className="text-base">
      <div className="text-slate-600 left-2 top-1 absolute right-0 h-10 px-3 py-2"><i className="icon-briefcase text-slate-500 mr-3"/>Review Project <strong>{ displayname }</strong></div>
      <StepMaster listview={ listview } run={ run }/>
    </div>
  )
}
