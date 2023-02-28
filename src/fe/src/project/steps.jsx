import { useState, useEffect } from 'react';
import { scn } from "../shared/styles";
import { AutoAvatar, Tag, renderTableStructure, renderTextStructure } from '../shared/widgets';
import { getColor } from '../shared/colors';
import ListView from '../shared/listview';
import ListPreview from '../shared/listpreview';
import ToolStrip from '../shared/toolstrip';
import { config } from '../shared/config';
import { auth, user } from '../shared/user';


var steps = [
  { title: 'Choose Files', icon: 'icon-docs', subtitle: 'Choose folders and files to process' },
  { title: 'Filters and Tags', icon: 'icon-tag', subtitle: 'Choose filters their corresponding tags to apply' },
  { title: 'Run', icon: 'icon-play', subtitle: 'Run filters against documents for results' },
  { title: 'Save', icon: 'icon-floppy', subtitle: 'Save the project' },
];


function _gen2CPrompt(num1, name1, num2, name2, reversed=false) {
  var prompt_ = '';
  if (reversed) {
    if (num2 > 0)
      prompt_ += num2 + ' ' + name2;
    if (num1 > 0) {
      if (prompt_)
        prompt_ += ' in ';
      prompt_ += num1 + ' ' + name1;
    }
  }
  else {
    if (num1 > 0)
      prompt_ += num1 + ' ' + name1;
    if (num2 > 0) {
      if (prompt_)
        prompt_ += ' and ';
      prompt_ += num2 + ' ' + name2;
    }
  }
  return prompt_;
}


function buildProjectArgument(filters_tags, listview) {
  // use a { 'filter_name': ['labels'] } format for back end
  var filters = {};
  for (var key in filters_tags) {
    if (!filters_tags.hasOwnProperty(key))
      continue;
    if (!filters_tags[key])
      continue;
    if (!key.startsWith('filter__'))
      continue;
    var filter = key.substr(8);
    var tp = filter.indexOf('__');
    if (tp < 0 &&
      !filters.hasOwnProperty(filter))
      filters[filter] = [];
    else {
      filters[filter.substr(0, tp)].push(filter.substr(tp + 7));
    }
  }
  // use a [ {type: 'folder', name: 'demo'} ] format for back end
  var lv_sel = [];
  listview.sel.items.map((item) => {
    lv_sel.push({ type: item.type, name: item.name });
  });
  return {
    'filters': filters,
    'files': lv_sel,
    'path': listview.path,
  }
}


function Steps({ stepper }) {

  function goStep(e) {
    var targetStep = parseInt(e.currentTarget.getAttribute('data-step-index'));
    if (targetStep <= stepper.step)
      stepper.set_step(targetStep);
  }

  return (
    <ul className="steps steps-vertical">
      { steps.map(( step_, idx ) => (
          <li key={idx} className={`step relative ${stepper.step >= idx?'step-primary':''}`}>
            <button className="p-0 bg-transparent border-0 w-[12rem] hover:font-bold focus:outline-0" onClick={ goStep } data-step-index={idx}>
              <div className={`${ scn.stepTitle }`}><i className={`${step_.icon} mr-2 text-slate-400`}/>{step_.title}</div>
              <div className={`${ scn.stepSubtitle } ${ stepper.prompt[idx]?'text-teal-600 font-bold':'font-normal'} `}>{ stepper.prompt[idx]?stepper.prompt[idx]:step_.subtitle}</div>
            </button>
          </li>
        ))}
    </ul>
  )
}


function StepChooseFiles({ stepper, listview }) {
  useEffect(() => {
    var folders = [];
    var files = [];
    for (var i = 0; i < listview.sel.items.length; i++) {
      var item = listview.sel.items[i];
      if (item.type === 'file')
        files.push(item);
      else if (item.type === 'folder')
        folders.push(item);
    }
    var prompt_ = _gen2CPrompt(folders.length, 'folders', files.length, 'files');
    stepper.set_prompt(
      stepper.prompt.map((p, idx) => idx == 0?prompt_:p)
    );
  }, [listview.sel]);

  return (
    <div className="text-base text-slate-600 absolute left-1 right-0 bottom-0 top-1">

      <div className="left-2 top-1 absolute">
        <ToolStrip listview={ listview }/>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
        <div className="absolute left-0 top-0 bottom-0" style={{ right: '14rem' }}>
          <ListView listview={ listview }/>
        </div>
        <div className="absolute top-0 right-0 bottom-0" style={{ width: '14rem' }}>
          <ListPreview listview={ listview }/>
        </div>
      </div>
    </div>
  )
}


function StepFiltersTags({ stepper, run }) {

  const [ filters, setFilters ] = useState({});

  useEffect(() => {
    user.pullFilters((_filters) => {
      setFilters(_filters);
    });
  }, []);

  // init checkboxes
  useEffect(() => {
    // already set in review mode, do not init
    if (Object.keys(run.filters_tags).length > 0)
      return;
    var fts = {};
    Object.entries(filters).map(([k, v]) => {
      if (v &&
        v.labels &&
        v.labels.length > 0) {
        fts['filter__' + k] = true;
        for (var i = 0; i < v.labels.length; i++)
          fts['filter__' + k + '__tag__' + v.labels[i]] = true;
      } else
        fts['filter__' + k] = false;
    });
    run.set_filters_tags(fts);
  }, [ filters ]);

  // initialize the selection with all possible filters and tags
  useEffect(() => {
    var filterCount = 0,
        tagCount = 0;
    var allowedFilters = {};
    for (var key in run.filters_tags) {
      if (!run.filters_tags.hasOwnProperty(key))
        continue;
      if (key.startsWith('__'))
        continue;
      if (run.filters_tags[key]) {
        var tagPos = key.indexOf('__tag__');
        if (tagPos < 0) {
          filterCount++;
          allowedFilters[key] = true;
        } else {
          if (allowedFilters[key.substr(0, tagPos)])
            tagCount++;
        }
      }
    }
    if (filterCount === 0 &&
      tagCount === 0)
      stepper.set_prompt(
        stepper.prompt.map((p, idx) => idx == 1?'':p)
      );
    else {
      var prompt_ = _gen2CPrompt(filterCount, 'filters', tagCount, 'tags');
      stepper.set_prompt(
        stepper.prompt.map((p, idx) => idx == 1?prompt_:p)
      );
    }
  }, [ run.filters_tags ]);


  function checkboxChange(e) {
    var key = e.target.getAttribute('data-checkbox-key');
    var newSetting = {};
    newSetting[key] = !run.filters_tags[key];
    run.set_filters_tags({ ...run.filters_tags, ...newSetting});
  }

  // render labels
  let labels = {};
  Object.entries(filters).map(([k, v]) => {
    labels[k] = [];
    if (v &&
      v.labels &&
      v.labels.length > 0) {
      v.labels.map((label, idx) => {
        labels[k].push(<span key={idx} className="whitespace-nowrap inline-block mr-4 h-8"><input type="checkbox" className="checkbox checkbox-sm mr-2 align-middle" data-checkbox-key={'filter__' + k + '__tag__' + label} checked={ run.filters_tags.hasOwnProperty('filter__' + k + '__tag__' + label)?run.filters_tags['filter__' + k + '__tag__' + label]:false } onChange={checkboxChange}/><Tag label={label} color={getColor(idx, 1)} /></span>);
      });
    } else
      labels[k].push(<span key={k} className="mr-4 h-8">(No Tags)</span>)
  });

  if (Object.keys(run.filters_tags).length == 0)
    return (null);

  return (
    <div className="text-base text-slate-600 absolute left-3 right-0 bottom-0 top-1 overflow-y-auto">
    { Object.entries(filters).map(([k, v]) => (
      <div className={`my-3 form-control`} key={k}>
        <div className={`inline-flex ${ Object.keys(v).length == 0?'opacity-40':''}`}>
          <input type="checkbox" className="checkbox checkbox-primary mr-2" data-checkbox-key={'filter__' + k} disabled={Object.keys(v).length == 0 || !v.labels || v.labels.length == 0} checked={ run.filters_tags.hasOwnProperty('filter__' + k)?run.filters_tags['filter__' + k]:false } onChange={checkboxChange}/>
          <AutoAvatar name={k} width={2} height={1.5} textSize="text-sm"/>
          <span className="ml-2">{k}</span>
        </div>
        <div className={`ml-8 mt-2 ${run.filters_tags.hasOwnProperty('filter__' + k) && run.filters_tags['filter__' + k]?'':'opacity-40'}`}>
          {labels[k]}
        </div>
      </div>
    ))}
    </div>
  )
}


function StepRun({ stepper, listview, run }) {

  useEffect(() => {
    if (run.results)
      return;
    if (run.taskid) {
      getResults();
      return;
    }
    run.set_rindex(-1);
    run.set_segments(null);
    window.project_run_timer = setTimeout(() => {
      var prjArgs = buildProjectArgument(run.filters_tags, listview);
      auth.post({base: '/projects/run'}, {
        body: JSON.stringify(prjArgs)
      }, (data) => {
        run.set_taskid(data.data);
      })
    }, 1000);
    return () => {
      clearTimeout(window.project_run_timer);
    };
  }, []);

  function getResults() {
    auth.get({base: '/projects/results/' + run.taskid}, {}, (data) => {
      run.set_results(data.data);
      var prompt_ = _gen2CPrompt(Object.keys(data.data.files).length, 'files', data.data.segments_collected, 'segments', true);
      stepper.set_prompt(
        stepper.prompt.map((p, idx) => idx == 2?prompt_:p)
      );
      if (data.data.signature) {
        // enable download
        stepper.set_download(config.endpoint_base + '/projects/download_results/' + run.taskid + '?s=' + data.data.signature);
      }
    });
  }

  function pollTaskFinish() {
    auth.get({base: '/projects/is_finished/' + run.taskid}, {}, (data) => {
      run.set_taskstatus(data.data);
      if (data.data)
        window.project_is_finished_timer = setTimeout(pollTaskFinish, 1000);
      else if (data.data == null) {
        // pull project_run results
        setTimeout(getResults);
      }
    });
  }

  useEffect(() => {
    if (!run.taskid)
      return;
    if (window.project_is_finished_timer)
      clearTimeout(window.project_is_finished_timer);
    window.project_is_finished_timer = setTimeout(pollTaskFinish, 1000);
  }, [ run.taskid ]);

  useEffect(() => {
    if (!run.results)
      return;
    if (Object.keys(run.results.files).length > 0) {
      run.set_rindex(0);
    }
  }, [ run.results ]);

  useEffect(() => {
    if (run.rindex == -1)
      return;
    auth.get({base: '/projects/results/' + run.taskid + '/' + Object.keys(run.results.files)[run.rindex]}, {}, (data) => {
      run.set_segments(data.data);
    });
  }, [ run.rindex ]);

  function resultClick(e) {
    run.set_rindex(parseInt(e.currentTarget.getAttribute('data-result-index')));
  }
  function renderSegment(seg, idx) {
    if (seg.type === 'table')
      return renderTableStructure(seg.content, idx);
    return renderTextStructure(seg.content, idx);
  }

  if (run.results) {
    if (Object.keys(run.results.files).length == 0)
      return (
        <div className="text-xl">
          <div className="flex items-center text-teal-600">
            Run has finished but no segments have been collected.
          </div>
        </div>
      )
    else {
      return (
        <div>
          <div className="absolute left-1 top-2 right-0 h-9 pr-2">
            <button className="btn px-2 min-h-fit h-9 bg-white border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent">
              <i className="icon-left-dir"/>
            </button>
            <div className="dropdown w-1/2">
              <label tabIndex={0} className={`w-full cursor-pointer items-center ${scn.clearButton}`}>
                <i className="icon-doc-text text-slate-500 pl-1 pr-6"/>
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">{ Object.keys(run.results.files)[run.rindex] }</span>
              </label>
              <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded w-full max-h-96 overflow-auto">
                { Object.keys(run.results.files).map((file, idx) => (
                <li className="block w-full" key={'r_' + idx}><a className={`${scn.menuA} text-ellipsis overflow-hidden whitespace-nowrap`} onClick={resultClick} data-result-index={idx}><i className="icon-doc-text mr-1"/>{ file }</a></li>
                ))}
              </ul>
            </div>
            <button className="btn px-2 min-h-fit h-9 bg-white border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent">
              <i className="icon-right-dir"/>
            </button>
          </div>
          <div className="absolute left-2 top-12 right-0 bottom-0 overflow-auto">
          { run.segments?(<div>{
            Object.keys(run.segments).map(page => (
              <div key={ page }>On page { page }
                { Object.keys(run.segments[page]).map((cIdx, sIdx) => (
                  <div key={ page + '.' + cIdx } className="text-sm mb-3">
                    { renderSegment(run.segments[page][cIdx].content, sIdx) }
                    <div className="text-slate-500 inline-block">
                      { run.segments[page][cIdx].labels.map((labelSet, idx) => (
                        <div key={ page + '.' + cIdx + '.labels' + idx } className="mb-2">
                          { labelSet.map((label, idx) => (
                            <Tag key={'label_' + idx} label={label} color={getColor(idx, 1)} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          }</div>):(null) }
          </div>
        </div>
      )
    }
  }

  if (run.taskstatus == null)
    return (
      <div className="text-xl">
        <div className="flex items-center text-teal-600">
          Finished
        </div>
      </div>
    )
  else if (run.taskstatus != false) {
    return (
      <div className="text-xl">
        <div className="text-teal-600">
          <div>
            { run.taskstatus.message }
          </div>
          <progress className="progress progress-primary w-full" value={ run.taskstatus.step } max={ run.taskstatus.total }></progress>
        </div>
      </div>
    )
  }

  return (
    <div className="text-xl">
      <div className="flex items-center text-teal-600">
        <span className="w-5 h-5 mr-3 rounded-full animate-spin border border-solid border-[3px] border-slate-200 border-t-teal-500"></span>
        Processing ...
      </div>
    </div>
  )
}


function StepSave({ stepper, listview, run }) {
  const [ name, setName ] = useState(run.displayname?run.displayname:'');
  const [ saved, setSaved ] = useState(false);
  const [ working, setWorking ] = useState(false);
  const [ tgstatus, setTgstatus ] = useState({
    step:     0,
    total:    1,
    message:  'Processing ...'
  });
  const [ tgid, setTgid ] = useState();

  function doSave(e) {
    setWorking(true);
    var prjArgs = buildProjectArgument(run.filters_tags, listview);
    prjArgs.run_id = run.taskid;
    prjArgs.name = name;
    auth.post({base: '/projects/save'}, {
      body: JSON.stringify(prjArgs)
    }, (data) => {
      setSaved(true);
      setWorking(false);
    })
  }

  function doUpdate(e) {
    // not implemented
    setWorking(true);
    setWorking(false);
  }

  function doGenerateTagging(e) {
    var projName = name;
    if (run.name)
      projName = run.name;
    auth.post({base: '/projects/set_tagging/' + projName}, {
      body: JSON.stringify({})
    }, (data) => {
      setTgid(data.data);
    })
  }

  function pollTGFinish() {
    auth.get({base: '/projects/is_finished/' + tgid}, {}, (data) => {
      setTgstatus(data.data);
      if (data.data)
        window.tg_is_finished_timer = setTimeout(pollTGFinish, 1000);
      else if (data.data == null) {
        setWorking(false);
        setTgid(null);
      }
    });
  }

  useEffect(() => {
    if (!tgid)
      return;
    setWorking(true);
    if (window.tg_is_finished_timer)
      clearTimeout(window.tg_is_finished_timer);
    window.tg_is_finished_timer = setTimeout(pollTGFinish, 100);
  }, [ tgid ]);

  return (
    <div>
       <table><tbody><tr><td>
        <input type="text" placeholder="Name of the Project" className={`${ scn.input } h-9 w-96 mr-2`} onChange={ e => setName(e.target.value) } value={ name }/>
        </td><td>
        </td></tr></tbody></table>
      <div>
        <div className="mt-2 mb-1">
          Generated project avatar:
        </div>
        <AutoAvatar name={ name } width={6} height={6} margin={2} textSize="text-3xl" styledTextSize="text-6xl" />
      </div>
      <div className="mt-3">
        { run.displayname?
        (<div><button className={`${scn.primaryButton} ${working?'loading':''}`} disabled={ name.length == 0 || working } onClick={ doUpdate }>{ working?(<span>Working ...</span>):(<span>Update</span>)}</button>
        { saved?(<span className="ml-3">Updated!</span>):(null)}</div>):
        (<div><button className={`${scn.primaryButton} ${working?'loading':''}`} disabled={ name.length == 0 || working } onClick={ doSave }>{ working?(<span>Working ...</span>):(<span>Save</span>)}</button>
        { saved?(<span className="ml-3">Saved!</span>):(null)}</div>)
        }
      </div>
      { run.displayname || saved ? (<div className="mt-3">
        <button className={`${scn.primaryButton} ${working?'loading':''}`} disabled={ working } onClick={ doGenerateTagging }>{ working?(<span>Working ...</span>):(<span>Generate an Annotation Project</span>)}</button>
      </div>):(null)}
      <div className="mt-3">
      { (tgid && tgstatus) ? (
        <div className="text-teal-600">
          <div>
            { tgstatus.message }
          </div>
          <progress className="progress progress-primary w-full" value={ tgstatus.step } max={ tgstatus.total }></progress>
        </div>
      ):(null)}
      </div>
    </div>
  )
}


function StepContent({ stepper, listview, run }) {
  switch(stepper.step) {
  case 0:
    return (<StepChooseFiles stepper={ stepper } listview={ listview }/>);
  case 1:
    return (<StepFiltersTags stepper={ stepper } run={ run }/>)
  case 2:
    return (<StepRun stepper={ stepper } listview={ listview } run={ run }/>)
  case 3:
    return (<StepSave stepper={ stepper } listview={ listview } run={ run }/>)
  }
}


function StepMaster({ listview, run }) {
  const [ step, set_step ] = useState(0);
  const [ prompt, set_prompt ] = useState([null, null, null, null, null]);
  const [ download, set_download ] = useState();

  function step_next() {
    set_step(step + 1);
  }

  const stepper = { step, set_step, prompt, set_prompt, step_next, set_download };

  return (
    <div>
      <div className="absolute px-2 left-2 top-11 w-[16rem] bottom-0 border-t border-r border-slate-100 bg-slate-100">
        <Steps stepper={ stepper }/>
      </div>
      <div className="absolute left-[16.5rem] px-3 py-2 top-11 right-0 h-[4.5rem] border-t border-b border-slate-100">
        <div className="text-slate-600">
          <div className="text-lg"><i className={`${steps[step].icon} mr-2 text-slate-400`}/>{ steps[step].title }
          {prompt[step]?(
            <span className="ml-2 text-teal-600">({prompt[step]})</span>
          ):(null)}
          </div>
          <div className="text-base text-slate-400">{ steps[step].subtitle }</div>
        </div>
        <div className="absolute right-3.5 top-3">
          { download?(
          <a href={ download } className={`${scn.primaryButton}`} download>Download Results</a>
          ):(null)}
          { step >= 0 && step < 3?(
          <button className={`${scn.primaryButton} ml-3`} onClick={ step_next }>Next</button>
          ):(null)}
        </div>
      </div>
      <div className="absolute left-[16.5rem] px-3 py-2 top-[7rem] right-0 bottom-0">
        <StepContent stepper={ stepper } listview={ listview } run={ run }/>
      </div>
    </div>
  )
}


export {
  StepMaster,
  StepContent,
  Steps,
  steps
}
