import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";


function ItemInfo({ info }) {

  if (typeof info === 'string') {
    return (
      <td className="text-xs bg-transparent">
        {info}
      </td> 
    )
  }

  return (
    <td className="text-xs bg-transparent">
      <div className="flex items-center text-teal-600">
        <span className="w-4 h-4 mr-2 rounded-full animate-spin border border-solid border-[2px] border-slate-200 border-t-teal-500"></span>
        {info.status}
      </div>
    </td> 
  )

}


function Item({ asPicker, listSel, setListSel, index, path, setPath, item, items, setLoaded }) {
  let navigate = useNavigate();

  function itemClick(e) {
    if (item.type === 's3' ||
      typeof item.info !== 'string')
      return;
    // no selection, select a single one regardless of modifier keys
    if (listSel.indices.length === 0 ||
      // no modifier keys
      (!(e.ctrlKey || e.metaKey || e.shiftKey) &&
        // 1 selected, not the currently selected one
        // select the new one
        ((listSel.indices.length === 1 &&
        listSel.indices[0] !== index) ||
        // more than 1 item are selected
        listSel.indices.length > 1))) {
      setListSel({
        anchor:   index,
        indices:  [index],
        items:    [item],
      });
    // selected clicked again, remove selection regardless of
    // modifier keys
    } else if (listSel.indices.length === 1 &&
      listSel.indices[0] == index) {
      setListSel({
        anchor:   -1,
        indices:  [],
        items:    [],
      });
    // shift pressed, calculate the new selection according
    // to the anchor
    } else if (listSel.anchor !== -1 &&
      e.shiftKey) {
      var indices_ = [];
      var items_ = [];
      for (var i = Math.min(listSel.anchor, index); i <= Math.max(listSel.anchor, index); i++) {
        if (items[i].type === 's3' ||
          typeof items[i].info !== 'string')
          continue;
        indices_.push(i);
        items_.push(items[i]);
      }
      setListSel({
        anchor:   listSel.anchor,
        indices:  indices_,
        items:    items_,
      });
    // ctrl/cmd pressed, add or remove selection
    } else if (e.ctrlKey || e.metaKey) {
      // remove existing
      var idx_ = listSel.indices.indexOf(index);
      if (idx_ >= 0) {
        var indices_ = listSel.indices.slice();
        var items_ = listSel.items.slice();
        indices_.splice(idx_, 1);
        items_.splice(idx_, 1);
        setListSel({
          anchor:   index,
          indices:  indices_,
          items:    items_,
        });
      // add new
      } else {
        setListSel({
          anchor:   index,
          indices:  listSel.indices.concat([index]),
          items:    listSel.items.concat([items[index]]),
        });
      }
    }
  }

  function folderDblClick(e) {
    setLoaded(false);
    setListSel({ anchor: -1, indices: [], items: [] });
    if (asPicker) {
      setPath(typeof path === 'undefined' ? item.name : (path + '|' + item.name));
      return;
    }
    navigate("/documents/" + (typeof path === 'undefined' ? item.name : (path + '|' + item.name)));
  }
  function parentFolderDblClick(e) {
    setLoaded(false);
    if (typeof path !== 'undefined') {
      setListSel({ anchor: -1, indices: [], items: [] });
      let idx = path.lastIndexOf("|");
      if (idx > 0) {
        let newPath = path.substr(0, idx);
        if (asPicker)
          setPath(newPath);
        else
          navigate("/documents/" + newPath);
        return;
      }
      if (asPicker)
        setPath(void 0);
      else
        navigate("/documents");
    }
  }
  function fileDblClick(e) {
    setLoaded(false);
    if (asPicker)
      return;
    navigate("/documents/" + (path ? path : '|') + "/" + item.name);
  }

  let hoverCls = 'hover:bg-slate-100';
  let selCls = hoverCls + ' border-b-slate-100';
  if (listSel.indices.indexOf(index) >= 0)
    selCls = 'bg-teal-100 border-b-teal-100';

  if (item.type == 'folder') {
    return (
      <tr className={`${ selCls } cursor-default border-b`} onDoubleClick={folderDblClick} onClick={ itemClick }>
        <td className="bg-transparent"><i className="icon-folder text-slate-500"/></td>
        <td className="bg-transparent">{item.name}</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="text-xs bg-transparent">{item.info}</td> 
      </tr>
    )
  } else if (item.type == 'parent_folder') {
    return (
      <tr className={`${ hoverCls } cursor-default border-b border-b-slate-100`} onDoubleClick={parentFolderDblClick}>
        <td className="bg-transparent"><i className="icon-folder text-slate-500"/></td>
        <td className="bg-transparent">.. (Parent Folder)</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
      </tr>
    )
  } else if (item.type == 's3') {
    return (
      <tr className={`${ hoverCls } cursor-default border-b border-b-slate-100`} onClick={ itemClick }>
        <td className="bg-transparent"><i className="icon-cloud text-slate-500"/></td>
        <td className="bg-transparent">{item.name}</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="text-xs bg-transparent">{item.info}</td> 
      </tr>
    )
  }

  // files
  let trCls = '';
  let iconCls = 'icon-doc-text text-slate-500';
  if (typeof item.info !== 'string') {
    trCls = 'text-slate-400';
    iconCls = 'icon-doc text-slate-300';
    selCls = 'border-b-slate-100';
  }
  return (
    <tr className={`${ trCls } ${ selCls } border-b cursor-default`} onClick={ itemClick } onDoubleClick={ fileDblClick }>
      <td className="bg-transparent"><i className={`${ iconCls }`}/></td>
      <td className="bg-transparent">{item.name}</td>
      <td className="bg-transparent text-xs">{item.size}</td>
      <td className="bg-transparent text-xs">{item.date}</td>
      <ItemInfo info={ item.info }/>
    </tr>
  )
}


function ParentFolderItem({ asPicker, listSel, setListSel, path, setPath, setLoaded }) {
  const parentFolder = { type: 'parent_folder' };

  if (path &&
    path != 'root') {
    return (
      <Item asPicker={asPicker} listSel={ listSel } setListSel={ setListSel } index={ -1 } path={ path } setPath={ setPath } item={ parentFolder } setLoaded={setLoaded}/>
    )
  }
  return (null)
}


function AllItems({ asPicker, listSel, setListSel, path, setPath, items, setLoaded }) {

  let renderedItems = (null);
  if (items)
    renderedItems = (items.map(( item, idx ) => (
      <Item asPicker={ asPicker } key={ idx } listSel={ listSel } setListSel={ setListSel } index={ idx } path={ path } setPath={ setPath } item={ item } items={ items } setLoaded={ setLoaded }/>
    )))

  return (
    <tbody>
      <ParentFolderItem asPicker={ asPicker } listSel={ listSel } setListSel={ setListSel } path={ path } setPath={ setPath } setLoaded={setLoaded}/>
      { renderedItems }
      { asPicker?(null):(
      <tr>
        <td colSpan="5">
          <div className="text-center text-slate-400 cursor-default"><i className="icon-docs mr-2"/>Drop files here to upload</div>
        </td>
      </tr>
      )}
    </tbody>
  )
}


export default function DocumentListView({ asPicker, path, setPath, listSel, setListSel, setListCount, getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, uploadFunc }) {

  const allItems = {
    root: [
      { type: 'folder', name: '2021 Sustainability Reports', info: '52 files'},
      { type: 'folder', name: '2022 Sustainability Reports', info: '67 files'},
      { type: 'folder', name: '2023 Sustainability Reports', info: '67 files'},
      { type: 's3', name: 'Demo S3 Bucket', info: '17 files'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
        status: 'Analyzing (53 of 150 pages) ...'
      }},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
        status: 'Analyzing (63 of 150 pages) ...'
      }},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
        status: 'Analyzing (73 of 150 pages) ...'
      }},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
    ],
    '2021 Sustainability Reports': [
      { type: 'folder', name: 'Another sub folder', info: '2 files'},
    ],
    '2021 Sustainability Reports|Another sub folder': [
      { type: 'folder', name: 'empty folder', info: '2 files'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
      { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
    ],
    '2022 Sustainability Reports': [
      { type: 'folder', name: 'Another sub folder', info: '2 files'},
    ],
    '2023 Sustainability Reports': [
      { type: 'folder', name: 'Another sub folder', info: '2 files'},
    ],
  };
  const refScroll = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  function trackRefScroll(e) {
    setScrollTop(refScroll.current.scrollTop);
  };

  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      var items_ = allItems[path ? path : 'root'];
      if (items_)
        setListCount(items_.length);
      else
        setListCount(0);
      setItems(items_);
      setLoaded(true);
    }, 1000);
  }, [path]);

  if (!loaded)
    return (
      <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto">
        <div className="flex items-center text-teal-600">
          <span className="w-5 h-5 mr-3 rounded-full animate-spin border border-solid border-[3px] border-slate-200 border-t-teal-500"></span>
          Loading ...
        </div>
      </div>
    )

  var table = (
    <div className="mr-1">
      <table className="table-compact border-collapse w-full select-none">
        <thead className="sticky top-0 cursor-default text-sm z-10">
          <tr className="backdrop-blur-md h-9">
            <th className="sticky w-8" style={{ boxShadow: '0 1px #2dd4bf' }}></th>
            <th className="sticky text-left" style={{ boxShadow: '0 1px #2dd4bf' }}>Name</th>
            <th className="sticky" style={{ boxShadow: '0 1px #2dd4bf' }}>Size</th>
            <th className="sticky" style={{ boxShadow: '0 1px #2dd4bf' }}>Date</th>
            <th className="sticky text-left" style={{ boxShadow: '0 1px #2dd4bf' }}>Info</th>
          </tr>
        </thead>
        <AllItems asPicker={asPicker} listSel={ listSel } setListSel={ setListSel } path={ path } setPath={setPath} items={ items } setLoaded={setLoaded}/>
      </table>
    </div>
  )

  // a listview with dropzone support
  if (typeof getRootProps !== 'undefined' &&
    typeof getInputProps !== 'undefined')
    return (
      <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto" ref={refScroll} onScroll={trackRefScroll}>
        <div {...getRootProps({
            className: 'absolute left-0 right-0 top-0 bottom-0 dropzone',
          })}>
          <input {...getInputProps()} />
          <div className={`${ isDragActive ? '':'hidden' } z-50 border-2 border-teal-500 bg-teal-200/20 absolute left-0 right-0 h-full dropzone grid place-items-center`} style={{ top: scrollTop + 'px' }}>
            <div className="bg-white py-5 px-8 rounded-lg">
              <div className="text-2xl text-center text-teal-600"><i className="icon-upload"/></div>
              <div className="text-xl text-center text-teal-700">Drop files to upload</div>
            </div>
          </div>
          {table}
        </div>
      </div>
    )

  // a listview without dropzone
  return (
    <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto">
      {table}
    </div>
  )
}
