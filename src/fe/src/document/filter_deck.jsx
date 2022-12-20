import { useState, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-regex';
import 'prismjs/themes/prism.css';
import { scn } from '../shared/styles';
import { AutoAvatar, Tag } from '../shared/widgets';
import { getColor } from '../shared/colors';


function FilterDropdown({ filters, setFilters, current, setCurrent, setCode, menuFunc }) {

  function filterClick(e) {
    var fname = e.currentTarget.getAttribute('data-filter-name');
    setCurrent(fname);
    setCode(filters[fname].code?filters[fname].code:'');
  };

  return (
    <div className="dropdown dropdown-top dropdown-end absolute left-2 top-0.5 right-[106px]">
      <label tabIndex="0" className="btn normal-case min-h-fit h-9 pt-2.5 pl-2 pr-6 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 truncate block"><span className="text-slate-400 mr-2">Filter</span><span className="">{ current }</span>
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


function OptionDropdown({ menuFunc }) {

  return (
    <div className="dropdown dropdown-top dropdown-end absolute w-[32px] absolute top-0.5 right-0">
      <label tabIndex="0" className="btn normal-case min-h-fit h-9 pt-2.5 pl-2 pr-6 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 block"><i className="icon-dot-3 rotate-90"/>
      </label>
      <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded max-h-[65vh] w-60 overflow-auto">
        <li className="block" key={0}><a className={scn.menuA} onClick={ menuFunc.renameFilter }><i className="icon-pencil mr-1"/> Rename</a></li>
        <li className="block" key={1}><a className={scn.menuA} onClick={ menuFunc.manageTags }><i className="icon-window mr-1"/> Manage Tags</a></li>
      </ul>
    </div>
  )
}


function renderTags(labels, manageTagsFunc) {
  let tags = [];
  if (labels) {
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i].trim();
      if (!label)
        continue;
      tags.push(<Tag key={i} label={ label } color={ getColor(i, 1) } onClick={ manageTagsFunc }/>);
    }
  }
  return tags;
}


function TagView({ filters, current, menuFunc }) {
  let tags = renderTags(filters[current].labels, menuFunc.manageTags);

  return (
    <div className="absolute left-0 bottom-0 h-10 right-0 border-t border-t-slate-100 p-0.5 overflow-x-auto overflow-y-hidden whitespace-nowrap">
      { tags.length > 0?(<div className="mt-1">{tags}</div>):(
      <button className={`btn normal-case h-9 text-slate-500 ${scn.clearButton}`} onClick={ menuFunc.manageTags }><i className="icon-tag mr-1"/>Manage Tags for this Filter</button>
      )}
    </div>
  )
}


export default function DocumentFilterDeck() {

  const [filters, setFilters] = useState({
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
  });
  const [current, setCurrent] = useState(Object.keys(filters)[0]);
  const [code, setCode] = useState(filters[current].code);
  const [filterName, setFilterName] = useState('');
  const [filterNameMode, setFilterNameMode] = useState('');
  const [tags, setTags] = useState('');
  const refDlgFilterName = useRef();
  const refDlgTags = useRef();

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
    console.log('doNewFilter');
    refDlgFilterName.current.checked = false;
  }
  function doRenameFilter(e) {
    console.log('doRenameFilter');
    refDlgFilterName.current.checked = false;
  }
  function manageTags(e) {
    setTags(filters[current].labels);
    refDlgTags.current.checked = true;
  }
  function closeTags(e) {
    refDlgTags.current.checked = false;
  }
  function doUpdateTags(e) {
    refDlgTags.current.checked = false;
  }

  function filterNameChange(e) {
    setFilterName(e.target.value);
  }
  function tagsChange(e) {
    setTags(e.target.value.split(','));
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
            }>
              { filterNameMode === 'new'?(<span>Create</span>):(null) }
              { filterNameMode === 'rename'?(<span>Rename</span>):(null) }
            </button>
          </div>
        </div>
      </div>

      <input type="checkbox" id="dialog-tags" className="modal-toggle" ref={ refDlgTags } />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Manage Tags</h3>
          <div className="form-control w-full">
            <p className="py-3">Enter comma(,)-delimited tags to describe the possible indicators in the content filtered by <span className="font-bold">{current}</span>:</p>
            <textarea className="border border-slate-200 rounded-md px-2 w-full h-24" placeholder="comma delimited tags" onChange={tagsChange} defaultValue={tags}></textarea>
          </div>
          <div className="py-2 w-full">
            {renderTags(tags)}
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeTags }>Cancel</button>
            <button className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500 text-white" onClick={ doUpdateTags }>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="ml-2">
      <div className="h-10 bg-slate-100 items-center w-full">
        <FilterDropdown filters={ filters } setFilters={ setFilters } current={ current } setCurrent={ setCurrent } setCode={ setCode } menuFunc={{ newFilter: newFilter }}/>
        <button className={`w-[60px] absolute top-0 right-9 ${scn.primaryButton}`}>Go</button>
        <OptionDropdown menuFunc={{ renameFilter: renameFilter, manageTags: manageTags }}/>
      </div>
      <div className="absolute bottom-0 top-10 left-2 right-0 border border-slate-100 overflow-auto">
        <Editor
          value={code}
          onValueChange={code => setCode(code)}
          highlight={code => highlight(code, languages.regex)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
          }}
          className="absolute left-0 top-0 right-0 bottom-10"
        />
        <TagView filters={ filters } current={ current } menuFunc={{ manageTags: manageTags }}/>
     </div>
     { dialogs }
    </div>
  )
}