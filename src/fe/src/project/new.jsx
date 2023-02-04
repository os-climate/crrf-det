import { useState, useEffect } from 'react';
import { scn } from "../shared/styles";
import { AutoAvatar, Tag, renderTableStructure, renderTextStructure } from '../shared/widgets';
import { getColor } from '../shared/colors';
import DocumentListView from '../document/list_view';
import DocumentPreview from '../document/preview';
import DocumentToolstrip from '../document/toolstrip';
import { config } from '../shared/config';
import { auth } from '../shared/auth';


var steps = [
  { title: 'Name', icon: 'icon-pencil', subtitle: 'Assign a name to the project' },
  { title: 'Choose Files', icon: 'icon-docs', subtitle: 'Choose folders and files to process' },
  { title: 'Filters and Tags', icon: 'icon-tag', subtitle: 'Choose filters their corresponding tags to apply' },
  { title: 'Review Results', icon: 'icon-book-open', subtitle: 'Review filter results' },
  { title: 'Export and More', icon: 'icon-briefcase', subtitle: 'Export the results and activate tagging' },
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


function Steps({ step, setStep, prompt }) {

  function goStep(e) {
    var targetStep = parseInt(e.currentTarget.getAttribute('data-step-index'));
    if (targetStep <= step)
      setStep(targetStep);
  }

  return (
    <ul className="steps steps-vertical">
      { steps.map(( step_, idx ) => (
          <li key={idx} className={`step relative ${step >= idx?'step-primary':''}`}>
            <button className="p-0 bg-transparent border-0 w-[12rem] hover:font-bold" onClick={ goStep } data-step-index={idx}>
              <div className={`${ scn.stepTitle }`}><i className={`${step_.icon} mr-2 text-slate-400`}/>{step_.title}</div>
              <div className={`${ scn.stepSubtitle } ${ prompt[idx]?'text-teal-600 font-bold':'font-normal'} `}>{ prompt[idx]?prompt[idx]:step_.subtitle}</div>
            </button>
          </li>
        ))}
    </ul>
  )
}


function StepName({ stepNext, prompt, setPrompt, name, setName }) {

  function onNameChange(e) {
    setName(e.target.value);
  }

  useEffect(() => {
    setPrompt(
      prompt.map((p, idx) => idx == 0?name:p)
    );
  }, [name]);

  return (
    <div className="text-slate-600 mt-2">
      <table><tbody><tr><td>
        <input type="text" placeholder="Name of the Project" className={`${ scn.input } h-9 w-96 mr-2`} onChange={onNameChange} value={ name }/>
        </td><td>
        <button className={scn.primaryButton} onClick={ stepNext }>Next</button>
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


function StepChooseFiles({ stepNext, prompt, setPrompt, path, setPath, listview }) {
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
    setPrompt(
      prompt.map((p, idx) => idx == 1?prompt_:p)
    );
  }, [listview.sel]);

  return (
    <div className="text-base text-slate-600 absolute left-1 right-0 bottom-0 top-1">

      <div className="left-2 top-1 absolute">
        <DocumentToolstrip asPicker={ true } pickerPath={path} setPickerPath={setPath} listview={ listview }/>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
        <div className="absolute left-0 top-0 bottom-0" style={{ right: '14rem' }}>
          <DocumentListView asPicker={ true } path={ path } setPath={setPath} listview={ listview }/>
        </div>
        <div className="absolute top-0 right-0 bottom-0" style={{ width: '14rem' }}>
          <DocumentPreview listview={ listview }/>
        </div>
      </div>
    </div>
  )
}


function StepFiltersTags({ stepNext, prompt, setPrompt, filtersTags, setFiltersTags }) {

  let filters = {
    'Scope 1/2/3 Emissions': { code: 'table:GHG.*', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'] },
    'Emissions reduction target': { code: 'emission reduction target', labels: ['Relative emissions reduction target', 'Absolute emissions reduction target']},
    'Intensity reduction target': { labels: ['Relative intensity reduction target', 'Absolute intensity reduction target']},
    'SBTi certification of target': { labels: ['SBTi certification of target']},
    'Climate commitment scenario': {},
    'Steel production': {},
    'Electricity production': {labels: ['Electricity production (total)']},
    'Electricity capacity': {labels: ['Electricity capacity (total)']},
    'Power production': {labels: ['Nuclear power production', 'Wind power production', 'Solar power production', 'Hydropower production']},
    'Automobile production': {labels: ['Automobile production', 'Automobile EV production', 'Automobile EV share', ]},
    'Automobile intensity': {},
    'O&G production (total)': {},
    'Hydrocarbons Reserves': {labels: ['Total Proven Hydrocarbons Reserves', 'Total Probable Hydrocarbons Reserves', 'Estimated Proven Hydrocarbons Reserves', 'Estimated Probable Hydrocarbons Reserves']},
    'Total Volume of Hydrocarbons Production': {},
    'Total Volume of Crude Oil Liquid Production': {},
    'Total Volume of Crude Natural Gas Liquid Production': {},
    'Total Volume of Crude Natural Gas Production': {},
    'Total Production Coal': {},
    'Total Production Lignite': {},
    'Total Production Hard Coal': {},
    'Total Capacity Coal': {},
    'Total Capacity Lignite': {},
    'Total Capacity Hard Coal': {},
  };

  // initialize the selection with all possible filters and tags
  useEffect(() => {
    if (!filtersTags.__initialized) {
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
      fts.__initialized = true;
      setFiltersTags(fts);
    }
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
      setPrompt(
        prompt.map((p, idx) => idx == 2?'':p)
      );
    else {
      var prompt_ = _gen2CPrompt(filterCount, 'filters', tagCount, 'tags');
      setPrompt(
        prompt.map((p, idx) => idx == 2?prompt_:p)
      );
    }
  }, [filtersTags]);

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


function StepReviewResults({ stepNext, prompt, setPrompt, resultIndex, setResultIndex }) {
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
        setPrompt(
          prompt.map((p, idx) => idx == 3?prompt_:p)
        );
      }, 3000);
    }
  });

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


function StepExports({ stepNext, prompt, setPrompt }) {
  return (
    <div>
      <div className="mt-3 mb-3">
        <label className="cursor-pointer label inline-flex text-slate-600">
          <input type="checkbox" className="checkbox checkbox-primary mr-2"/>
          <span>Activate this Project for Tagging</span>
        </label>
      </div>
      <div><button className={scn.primaryButton}>Download Results</button></div>
    </div>
  )
}


function StepContent({ step, stepNext, prompt, setPrompt, name, setName, path, setPath, listview, filtersTags, setFiltersTags, resultIndex, setResultIndex }) {
  switch(step) {
  case 0:
    return (<StepName stepNext={ stepNext } prompt={prompt} setPrompt={setPrompt} name={name} setName={setName}/>);
  case 1:
    return (<StepChooseFiles stepNext={ stepNext } prompt={prompt} setPrompt={setPrompt} path={path} setPath={setPath} listview={ listview }/>);
  case 2:
    return (<StepFiltersTags stepNext={ stepNext } prompt={prompt} setPrompt={setPrompt} filtersTags={filtersTags} setFiltersTags={setFiltersTags}/>)
  case 3:
    return (<StepReviewResults stepNext={ stepNext } prompt={prompt} setPrompt={setPrompt} resultIndex={resultIndex} setResultIndex={setResultIndex}/>)
  case 4:
    return (<StepExports/>)
  }
}


export default function ProjectNew() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [path, setPath] = useState();
  const [prompt, setPrompt] = useState([null, null, null, null, null]);
  const [filtersTags, setFiltersTags] = useState({});
  const [resultIndex, setResultIndex] = useState(0);

  /* file listview support */
  const [ sel, set_sel ] = useState({
    anchor:   -1,
    indices:  [],
    items:    [],
  });
  const [ items, set_items ] = useState([]);
  const [ loaded, set_loaded ] = useState(false);

  function refresh() {
    let apiPath = '/files';
    if (path)
      apiPath += '/' + path;
    auth.fetch(config.endpoint_base + apiPath, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + auth.getToken()
      }
    }, ( data ) => {
      if (!data)
        return;
      if (data.status == 'ok') {
        set_items(data.data);
        set_loaded(true);
      } else {
        console.warn('unhandled data', data);
      }
    });
  }

  const listview = { items, set_items, sel, set_sel, loaded, set_loaded, refresh };


  function stepNext() {
    setStep(step + 1);
  }

  return (
    <div className="text-base">
      <div className="text-slate-600 left-2 top-1 absolute right-0 h-10 px-3 py-2"><i className="icon-briefcase text-slate-500 mr-3"/>Create a New Project</div>
      <div className="absolute px-2 left-2 top-11 w-[16rem] bottom-0 border-t border-r border-slate-100 bg-slate-100">
        <Steps step={ step } setStep={ setStep } prompt={ prompt }/>
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
        { step > 0 && step < 4?(
        <button className={`${scn.primaryButton} absolute right-2 top-3.5`} onClick={ stepNext }>Next</button>
        ):(null)}
      </div>
      <div className="absolute left-[16.5rem] px-3 py-2 top-[7rem] right-0 bottom-0">
        <StepContent step={step} stepNext={stepNext} prompt={prompt} setPrompt={setPrompt} name={name} setName={setName} path={path} setPath={setPath} listview={ listview } filtersTags={filtersTags} setFiltersTags={setFiltersTags} resultIndex={resultIndex} setResultIndex={setResultIndex}/>
      </div>
    </div>
  )
}