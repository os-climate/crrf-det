import { useState, useRef, useEffect } from 'react';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-regex';
import 'prismjs/themes/prism.css';
import { scn } from '../shared/styles';
import { AutoAvatar, Tag } from '../shared/widgets';
import { getColor } from '../shared/colors';
import { config } from '../shared/config';
import { auth, user } from '../shared/user';


function FilterDropdown({ filters, current, setCurrent, menuFunc }) {

  function filterClick(e) {
    var fname = e.currentTarget.getAttribute('data-filter-name');
    // clears focus from dropdown so it closes
    document.activeElement.blur();
    setCurrent(fname);
  };

  return (
    <div className="dropdown absolute left-3 top-0.5" style={{ maxWidth: 'calc(100% - 3rem)'}}>
      <label tabIndex="0" className="btn normal-case min-h-fit h-9 pt-2.5 pl-2 pr-6 bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200 truncate block"><span className="text-slate-400 mr-2">Filter</span><span className="">{ current }</span>
        <i className="icon-down-dir pl-3 pr-2 text-slate-500 absolute right-2 top-3"/>
      </label>
      <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded max-h-[65vh] w-80 overflow-auto">
        <li className="block border-b border-slate-100" key={0}><a className={scn.menuA} onClick={ menuFunc.newFilter }><i className="icon-plus mr-1"/> New Filter</a></li>
        { Object.keys(filters).map((filter) => (
          <li key={ filter }><a className={`${scn.menuA} inline-flex`} onClick={ filterClick } data-filter-name={ filter }>
            <AutoAvatar name={ filter } width={2} height={1.5} textSize="text-sm"/>
          { filter }</a></li>
          ))}
      </ul>
    </div>
  )
}


export default function DocumentFilterDeck({ path, file, pagecontent, filterstatus }) {

  // const [filters, setFilters] = useState({
  //   'Scope 1/2/3 Emissions': { query: 'table:GHG', labels: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 1+2+3'] },
  //   'Emissions reduction target': { query: 'emission reduction target', labels: ['Relative emissions reduction target', 'Absolute emissions reduction target']},
  //   'Intensity reduction target': { labels: ['Relative intensity reduction target', 'Absolute intensity reduction target']},
  //   'SBTi certification of target': { labels: ['SBTi certification of target']},
  //   'Climate commitment scenario': {},
  //   'Steel production': {},
  //   'Electricity production': {labels: ['Electricity production (total)']},
  //   'Electricity capacity': {labels: ['Electricity capacity (total)']},
  //   'Power production': {labels: ['Nuclear power production', 'Wind power production', 'Solar power production', 'Hydropower production']},
  //   'Automobile production': {labels: ['Automobile production', 'Automobile EV production', 'Automobile EV share', ]},
  //   'Automobile intensity': {},
  //   'O&G production (total)': {},
  //   'Hydrocarbons Reserves': {labels: ['Total Proven Hydrocarbons Reserves', 'Total Probable Hydrocarbons Reserves', 'Estimated Proven Hydrocarbons Reserves', 'Estimated Probable Hydrocarbons Reserves']},
  //   'Total Volume of Hydrocarbons Production': {},
  //   'Total Volume of Crude Oil Liquid Production': {},
  //   'Total Volume of Crude Natural Gas Liquid Production': {},
  //   'Total Volume of Crude Natural Gas Production': {},
  //   'Total Production Coal': {},
  //   'Total Production Lignite': {},
  //   'Total Production Hard Coal': {},
  //   'Total Capacity Coal': {},
  //   'Total Capacity Lignite': {},
  //   'Total Capacity Hard Coal': {},
  // });
  const [filters, setFilters] = useState({});
  const [current, setCurrent] = useState();
  const [query, setQuery] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterNameMode, setFilterNameMode] = useState('');
  const [tags, setTags] = useState('');
  const [ working, setWorking ] = useState(false);
  const [ pending, setPending ] = useState(false);
  const refDlgFilterName = useRef();
  const refDlgTags = useRef();

  useEffect(() => {
    user.pullFilters(setFilters);
  }, []);

  useEffect(() => {
    var lsCurrent = localStorage.getItem('det_current_filter_name');
    if (lsCurrent &&
      filters.hasOwnProperty(lsCurrent)) {
      setCurrent(lsCurrent);
    } else if (Object.keys(filters).length > 0) {
      var c = Object.keys(filters)[0];
      setCurrent(c);
    }
  }, [ filters ]);

  useEffect(() => {
    if (current &&
      filters.hasOwnProperty(current)) {
      setQuery(filters[current].query);
      if (filters[current].labels)
        setTags(filters[current].labels.join(','))
      else
        setTags('');
      localStorage.setItem('det_current_filter_name', current);
    }
  }, [ current ]);

  useEffect(() => {
    setPending(true);
    if (window.filter_update_timer)
      clearTimeout(window.filter_update_timer);
    window.filter_update_timer = setTimeout(() => {
      if (!current ||
        !filters.hasOwnProperty(current)) {
        setPending(false);
        return;
      }
      var filter = filters[current];
      filter.query = query;
      if (tags.length > 0)
        filter.labels = tags.split(',');
      else
        filter.labels = [];
      auth.post({base: '/filters/' + encodeURIComponent(current)}, {
        body: JSON.stringify({'filter': filter})
      }, (data) => {
        setPending(false);
      })
    }, 2500);
  }, [ query, tags ]);

  // Dialog handlers
  function newFilter(e) {
    document.activeElement.blur();
    setFilterName('');
    setFilterNameMode('new');
    refDlgFilterName.current.checked = true;
  }
  function renameFilter(e) {
    document.activeElement.blur();
    setFilterName(current);
    setFilterNameMode('rename');
    refDlgFilterName.current.checked = true;
  }
  function closeFilterName(e) {
    refDlgFilterName.current.checked = false;
  }
  function doNewFilter(e) {
    if (filterName.length > 0 &&
      !filters.hasOwnProperty(filterName)) {
      var newFilter = {};
      newFilter[filterName] = {
        query: ''
      };
      localStorage.setItem('det_current_filter_name', filterName);
      setFilters({...filters, ...newFilter});
    }
    refDlgFilterName.current.checked = false;
  }
  function doRenameFilter(e) {
    if (filterName.length > 0 &&
      !filters.hasOwnProperty(filterName)) {
      setPending(true);
      var changedFilter = filters[current];
      changedFilter.new_name = filterName;
      localStorage.setItem('det_current_filter_name', filterName);
      auth.post({base: '/filters/' + encodeURIComponent(current)}, {
        body: JSON.stringify({'filter': changedFilter})
      }, (data) => {
        setPending(false);
        user.pullFilters(setFilters);
      })
    }
    refDlgFilterName.current.checked = false;
  }

  function filterNameChange(e) {
    setFilterName(e.target.value);
  }

  function runFilter(e) {
    filterstatus.set_working(true);
    auth.post({base: '/docs', folder: path, rest: '/' + file}, {
      body: JSON.stringify({'terms': query})
    }, ( data ) => {
      var id = data.data;
      if (window.run_filter_timer)
        clearTimeout(window.run_filter_timer)
      window.run_filter_timer = setTimeout(() => {
        pollFilter(id);
      }, 1000);
    });
  }
  function pollFilter(id) {
    auth.get({base: '/docs', folder: path, rest: '/' + file + '/search/' + id}, {}, ( data ) => {
      if (data.status !== 'ok') {
        window.run_filter_timer = setTimeout(() => {
          pollFilter(id);
        }, 1000);
        return;
      }
      filterstatus.set_result(data.data);
      filterstatus.set_working(false);
      pagecontent.set_page(1);
    });
  }

  // Dialogs
  let dialogs = (
    <div>
      <input type="checkbox" id="dialog-filter-name" className="modal-toggle" ref={ refDlgFilterName } />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            { filterNameMode === 'new'?(<span>New Filter</span>):(null) }
            { filterNameMode === 'rename'?(<span>Rename Filter</span>):(null) }
          </h3>
          <div className="form-control w-full">
            <p className="py-3">Enter a name for the filter</p>
            <table>
              <tbody>
                <tr>
                  <td className="w-3 pr-1"><AutoAvatar name={ filterName } width={3} height={3} textSize="text-base" styledTextSize="text-lg"/></td>
                  <td><input type="text" placeholder="Name of the Filter" className={`${ scn.input } h-12`} value={filterName} onChange={filterNameChange}/></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeFilterName }>Cancel</button>
            <button className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500 text-white" onClick={
              filterNameMode === 'new'?doNewFilter:(filterNameMode === 'rename'?doRenameFilter:null)
            } disabled={ filterName.length == 0 }>
              { filterNameMode === 'new'?(<span>Create</span>):(null) }
              { filterNameMode === 'rename'?(<span>Rename</span>):(null) }
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  var colorSet = ['bg-slate-100', 'border-slate-100', 'focus:bg-slate-100'];
  if (pending)
    colorSet = ['bg-amber-200', 'border-amber-200', 'focus:bg-amber-200'];

  return (
    <div className="ml-2">
      <div className={`h-10 items-center w-full rounded-t-md ${colorSet[0]}`}>
        <FilterDropdown filters={ filters } current={ current } setCurrent={ setCurrent } menuFunc={{ newFilter: newFilter }}/>
        <button className="absolute right-1 top-0.5 btn px-2 min-h-fit h-9 bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent"><i className="icon-pencil" onClick={ renameFilter }/></button>
      </div>
      <div className="absolute bottom-0 top-10 left-2 right-0 overflow-auto">
        <div className={`form-control border-l relative ${colorSet[1]}`}>
          <i className="absolute icon-search left-3 top-3 text-slate-300"/>
          <div className="flex">
            <input type="text" placeholder="Search in document" className={`pl-10 input input-bordered w-full rounded-none border-0 hover:outline-0 focus:outline-0 border-b ${colorSet[1]} ${colorSet[2]}`} value={ query } onChange={ e => setQuery(e.target.value) } onKeyPress={ (e) => {(e.key == 'Enter' ? runFilter():null)} }/>
            <button className={`btn rounded-none px-8 py-0 text-lg ${scn.primaryButton}`} onClick={ runFilter } disabled={ filterstatus.working }>Go</button>
          </div>
        </div>
        <div className={`form-control border-l border-r relative ${colorSet[1]}`}>
          <i className="absolute icon-tag left-3 top-3 text-slate-300"/>
          <div className="flex">
            <input type="text" placeholder="Comma-delimited tags" className={`pl-10 input input-bordered w-full rounded-none border-0 hover:outline-0 focus:outline-0 border-b ${colorSet[1]} ${colorSet[2]}`} value={ tags } onChange={ e => setTags(e.target.value) }/>
          </div>
        </div>
     </div>
     { dialogs }
    </div>
  )
}