import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-regex';
import 'prismjs/themes/prism.css';


function FilterDropdown({ filters, setFilters, current, setCurrent, setCode }) {

  function filterClick(e) {
    var fname = e.currentTarget.getAttribute('data-filter-name');
    setCurrent(fname);
    setCode(filters[fname]);
  };

  return (
    <div className="dropdown dropdown-top dropdown-end absolute left-2 top-0.5 right-[66px]">
      <label tabIndex="0" className="btn normal-case min-h-fit h-8 pt-2 pl-2 pr-6 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 truncate block"><span className="text-slate-400 mr-2">Filter</span><span className="">{ current }</span>
        <i className="icon-down-dir pl-3 pr-2 text-slate-500 absolute right-2 top-2"/>
      </label>
      <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded max-h-96 w-72 overflow-auto">
        <li className="block border-b border-slate-100" key={0}><a className="block border border-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500">New Filter</a></li>
        { Object.keys(filters).map((filter) => (
          <li className="block" key={ filter }><a className="block border border-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500" onClick={ filterClick } data-filter-name={ filter }>{ filter }</a></li>
          ))}
      </ul>
    </div>
  )
}


export default function DocumentFilterDeck() {
  const [filters, setFilters] = useState({
    'GHG emission': 'GHG.*',
    'GHG emission in tables': 'table:GHG.*',
    'A very very very very very very long name': 'nada'
  });
  const [current, setCurrent] = useState(Object.keys(filters)[0]);
  const [code, setCode] = useState(filters[current]);

  return (
    <div className="ml-2">
      <div className="h-9 bg-slate-100 items-center w-full">
        <FilterDropdown filters={ filters } setFilters={ setFilters } current={ current } setCurrent={ setCurrent } setCode={ setCode }/>
        <button className="w-[60px] btn normal-case min-h-fit h-8 bg-teal-100 border-teal-400 text-teal-600 hover:bg-white hover:border-slate-200 m-0.5 absolute top-0 right-0">Go</button>
      </div>
      <div className="absolute bottom-0 top-9 left-2 right-0 border border-slate-100 overflow-auto">
        <Editor
          value={code}
          onValueChange={code => setCode(code)}
          highlight={code => highlight(code, languages.regex)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
          }}
        />
     </div>
    </div>
  )
}