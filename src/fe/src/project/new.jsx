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
  { title: 'Save and Export', icon: 'icon-floppy', subtitle: 'Save the project, export results, and activate tagging' },
];


function _gen2CPrompt(num1, name1, num2, name2) {
  var prompt_ = '';
  if (num1 > 0)
    prompt_ += num1 + ' ' + name1;
  if (num2 > 0) {
    if (prompt_)
      prompt_ += ' and ';
    prompt_ += num2 + ' ' + name2;
  }
  return prompt_;
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
  const [path, set_path] = useState();
  listview.path = path;
  listview.set_path = set_path;

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


function StepFiltersTags({ stepper, filtersTags, setFiltersTags }) {

  const [ filters, setFilters ] = useState({});

  useEffect(() => {
    user.pullFilters((_filters) => {
      setFilters(_filters);
    });
  }, []);

  // init checkboxes
  useEffect(() => {
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
    setFiltersTags(fts);
  }, [ filters ]);

  // initialize the selection with all possible filters and tags
  useEffect(() => {
    var filterCount = 0,
        tagCount = 0;
    var allowedFilters = {};
    for (var key in filtersTags) {
      if (!filtersTags.hasOwnProperty(key))
        continue;
      if (key.startsWith('__'))
        continue;
      if (filtersTags[key]) {
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
  }, [ filtersTags ]);


  function checkboxChange(e) {
    var key = e.target.getAttribute('data-checkbox-key');
    var newSetting = {};
    newSetting[key] = !filtersTags[key];
    setFiltersTags({ ...filtersTags, ...newSetting});
  }

  // render labels
  let labels = {};
  Object.entries(filters).map(([k, v]) => {
    labels[k] = [];
    if (v &&
      v.labels &&
      v.labels.length > 0) {
      v.labels.map((label, idx) => {
        labels[k].push(<span key={idx} className="whitespace-nowrap inline-block mr-4 h-8"><input type="checkbox" className="checkbox checkbox-sm mr-2 align-middle" data-checkbox-key={'filter__' + k + '__tag__' + label} checked={ filtersTags.hasOwnProperty('filter__' + k + '__tag__' + label)?filtersTags['filter__' + k + '__tag__' + label]:false } onChange={checkboxChange}/><Tag label={label} color={getColor(idx, 1)} /></span>);
      });
    } else
      labels[k].push(<span key={k} className="mr-4 h-8">(No Tags)</span>)
  });

  if (Object.keys(filtersTags).length == 0)
    return (null);

  return (
    <div className="text-base text-slate-600 absolute left-3 right-0 bottom-0 top-1 overflow-y-auto">
    { Object.entries(filters).map(([k, v]) => (
      <div className={`my-3 form-control`} key={k}>
        <div className={`inline-flex ${ Object.keys(v).length == 0?'opacity-40':''}`}>
          <input type="checkbox" className="checkbox checkbox-primary mr-2" data-checkbox-key={'filter__' + k} disabled={Object.keys(v).length == 0 || !v.labels || v.labels.length == 0} checked={ filtersTags.hasOwnProperty('filter__' + k)?filtersTags['filter__' + k]:false } onChange={checkboxChange}/>
          <AutoAvatar name={k} width={2} height={1.5} textSize="text-sm"/>
          <span className="ml-2">{k}</span>
        </div>
        <div className={`ml-8 mt-2 ${filtersTags.hasOwnProperty('filter__' + k) && filtersTags['filter__' + k]?'':'opacity-40'}`}>
          {labels[k]}
        </div>
      </div>
    ))}
    </div>
  )
}


function StepRun({ stepper, listview, filtersTags, resultIndex, setResultIndex }) {
  const [complete, setComplete] = useState(false);
  var results = [
    {
      file: '2021-tesla-impact-report.pdf',
      segments: [
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"GHG Emissions Scope 1, 2 and 3" },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"In 2021, we began measuring our Scope 1 and Scope 2 GHG emissions considering the principles and guidance of the GHG Protocol. We used the operational control approach methodology – accounting for GHG emissions from operations under our control. For detailed information on the scope of our calculations, please see page 139-142 of this report." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"While our total Scope 1 and Scope 2 emissions may increase on an absolute basis in the near term as we continue to open new factories, our goal is to reduce the emissions intensity from production as we push the boundaries of sustainable manufacturing and improve the efficiency of our operations. As part of our commitment to reducing our overall emissions in the long term we signed up for the Science-Based Target Initiative (SBTi) in 2021." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"table","content":[["Metric","Unit of Measure","Manufacturing","SSD 1","Other 2","TOTAL"],["Scope 1 GHG emissions","tCO 2 e","124,000","31,000","30,000","185,000*"],["Scope 2 GHG emissions (location-based)","tCO 2 e","342,000","35,000","26,000","403,000*"],["Scope 3 | Category 11: Use of Sold Products (EV charging)","tCO 2 e","","","","1,954,000"]] },
      ]
    },
    {
      file: '2021-tesla-impact-report2.pdf',
      segments: [
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"GHG Emissions Scope 1, 2 and 3" },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"In 2021, we began measuring our Scope 1 and Scope 2 GHG emissions considering the principles and guidance of the GHG Protocol. We used the operational control approach methodology – accounting for GHG emissions from operations under our control. For detailed information on the scope of our calculations, please see page 139-142 of this report." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"While our total Scope 1 and Scope 2 emissions may increase on an absolute basis in the near term as we continue to open new factories, our goal is to reduce the emissions intensity from production as we push the boundaries of sustainable manufacturing and improve the efficiency of our operations. As part of our commitment to reducing our overall emissions in the long term we signed up for the Science-Based Target Initiative (SBTi) in 2021." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"table","content":[["Metric","Unit of Measure","Manufacturing","SSD 1","Other 2","TOTAL"],["Scope 1 GHG emissions","tCO 2 e","124,000","31,000","30,000","185,000*"],["Scope 2 GHG emissions (location-based)","tCO 2 e","342,000","35,000","26,000","403,000*"],["Scope 3 | Category 11: Use of Sold Products (EV charging)","tCO 2 e","","","","1,954,000"]] },
      ]
    },
    {
      file: '2021-tesla-impact-report3.pdf',
      segments: [
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"GHG Emissions Scope 1, 2 and 3" },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"In 2021, we began measuring our Scope 1 and Scope 2 GHG emissions considering the principles and guidance of the GHG Protocol. We used the operational control approach methodology – accounting for GHG emissions from operations under our control. For detailed information on the scope of our calculations, please see page 139-142 of this report." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"text","content":"While our total Scope 1 and Scope 2 emissions may increase on an absolute basis in the near term as we continue to open new factories, our goal is to reduce the emissions intensity from production as we push the boundaries of sustainable manufacturing and improve the efficiency of our operations. As part of our commitment to reducing our overall emissions in the long term we signed up for the Science-Based Target Initiative (SBTi) in 2021." },
        { filter: 'Scope 1/2/3 Emissions', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'], "type":"table","content":[["Metric","Unit of Measure","Manufacturing","SSD 1","Other 2","TOTAL"],["Scope 1 GHG emissions","tCO 2 e","124,000","31,000","30,000","185,000*"],["Scope 2 GHG emissions (location-based)","tCO 2 e","342,000","35,000","26,000","403,000*"],["Scope 3 | Category 11: Use of Sold Products (EV charging)","tCO 2 e","","","","1,954,000"]] },
      ]
    },
  ];

  useEffect(() => {
    if (!complete) {
      setTimeout(() => {
        setComplete(true);
        setResultIndex(results.length - 1);
        var fileCount = results.length;
        var segCount = 0;
        for (var i = 0; i < results.length; i++)
          segCount += results[i].segments.length;
        var prompt_ = _gen2CPrompt(fileCount, 'files', segCount, 'segments');
        stepper.set_prompt(
          stepper.prompt.map((p, idx) => idx == 2?prompt_:p)
        );
      }, 3000);
    }
  });

  useEffect(() => {
    window.project_run_timer = setTimeout(() => {
      // use a { 'filter_name': ['labels'] } format for back end
      var filters = {};
      for (var key in filtersTags) {
        if (!filtersTags.hasOwnProperty(key))
          continue;
        if (!filtersTags[key])
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
      auth.post({base: '/projects/run'}, {
        body: JSON.stringify({
          'filters': filters,
          'files': lv_sel,
          'path': listview.path,
        })
      }, (data) => {
      })
    }, 1000);
    return () => {
      clearTimeout(window.project_run_timer);
    };
  }, []);

  function resultClick(e) {
    setResultIndex(parseInt(e.currentTarget.getAttribute('data-result-index')));
  }
  function renderSegment(seg, idx) {
    if (seg.type === 'table')
      return renderTableStructure(seg.content, idx);
    return renderTextStructure(seg.content, idx);
  }

  if (complete) {
    return (
      <div>
        <div className="absolute left-1 top-2 right-0 h-9">
          <button className="btn px-2 min-h-fit h-9 bg-white border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent">
            <i className="icon-left-dir"/>
          </button>
          <div className="dropdown w-1/2">
            <label tabIndex={0} className={`w-full cursor-pointer items-center ${scn.clearButton}`}>
              <i className="icon-doc-text text-slate-500 pl-1 pr-6"/>
              {results[resultIndex].file}
            </label>
            <ul tabIndex="0" className="dropdown-content menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded w-full">
              { results.map((result, idx) => (
              <li className="block" key={'r_' + idx}><a className={scn.menuA} onClick={resultClick} data-result-index={idx}><i className="icon-doc-text mr-1"/>{result.file }</a></li>
              ))}
            </ul>
          </div>
          <button className="btn px-2 min-h-fit h-9 bg-white border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent">
            <i className="icon-right-dir"/>
          </button>
        </div>
        <div className="absolute left-2 top-12 right-0 bottom-0 overflow-auto">
        { results[resultIndex].segments.map((seg, idx) => (
            <div key={'seg_' + idx} className="text-sm mb-3">
              {renderSegment(seg, idx)}
              <div className="text-slate-500 inline-block">
                <span className="mr-3">{seg.filter}</span>
                { seg.labels.map((label, idx) => (
                  <Tag key={'label_' + idx} label={label} color={getColor(idx, 1)} />
                ))}
              </div>
            </div>
          ))}
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


function StepSave({ stepper, name, setName }) {
  function onNameChange(e) {
    setName(e.target.value);
  }

  useEffect(() => {
    // setPrompt(
    //   prompt.map((p, idx) => idx == 0?name:p)
    // );
  }, [name]);

  return (
    <div>
      <div className="mt-3 mb-3">
        <label className="cursor-pointer label inline-flex text-slate-600">
          <input type="checkbox" className="checkbox checkbox-primary mr-2"/>
          <span>Activate this Project for Tagging</span>
        </label>
      </div>
      <div><button className={scn.primaryButton}>Download Results</button></div>
       <table><tbody><tr><td>
        <input type="text" placeholder="Name of the Project" className={`${ scn.input } h-9 w-96 mr-2`} onChange={onNameChange} value={ name }/>
        </td><td>
        </td></tr></tbody></table>
      <div>
        <div className="mt-2 mb-1">
          Generated project avatar:
        </div>
        <AutoAvatar name={ name } width={6} height={6} margin={2} textSize="text-3xl" styledTextSize="text-6xl" />
      </div>
    </div>
  )
}


function StepContent({ stepper, name, setName, listview }) {
  const [filtersTags, setFiltersTags] = useState({});
  const [resultIndex, setResultIndex] = useState(0);

  switch(stepper.step) {
  case 0:
    return (<StepChooseFiles stepper={ stepper } listview={ listview }/>);
  case 1:
    return (<StepFiltersTags stepper={ stepper } filtersTags={filtersTags} setFiltersTags={setFiltersTags}/>)
  case 2:
    return (<StepRun stepper={ stepper } listview={ listview } filtersTags={ filtersTags } resultIndex={resultIndex} setResultIndex={setResultIndex}/>)
  case 3:
    return (<StepSave stepper={ stepper } name={name} setName={setName}/>)
  }
}


export default function ProjectNew({ listview }) {
  const [step, set_step] = useState(0);
  const [prompt, set_prompt] = useState([null, null, null, null, null]);
  const [name, setName] = useState('');

  function step_next() {
    set_step(step + 1);
  }

  const stepper = { step, set_step, prompt, set_prompt, step_next };

  return (
    <div className="text-base">
      <div className="text-slate-600 left-2 top-1 absolute right-0 h-10 px-3 py-2"><i className="icon-briefcase text-slate-500 mr-3"/>Create a New Project</div>
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
        { step >= 0 && step < 4?(
        <button className={`${scn.primaryButton} absolute right-2 top-3.5`} onClick={ step_next }>Next</button>
        ):(null)}
      </div>
      <div className="absolute left-[16.5rem] px-3 py-2 top-[7rem] right-0 bottom-0">
        <StepContent stepper={ stepper } name={name} setName={setName} listview={ listview }/>
      </div>
    </div>
  )
}
