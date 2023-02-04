import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { config } from './config';
import { auth } from './auth';


function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


function ItemInfo({ info }) {

  if (typeof info === 'string' ||
    typeof info === 'undefined') {
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


function Item({ listview, index, item }) {
  let navigate = useNavigate();

  function itemClick(e) {
    if (item.type === 's3' ||
      typeof item.info !== 'string')
      return;
    // no selection, select a single one regardless of modifier keys
    if (listview.sel.indices.length === 0 ||
      // no modifier keys
      (!(e.ctrlKey || e.metaKey || e.shiftKey) &&
        // 1 selected, not the currently selected one
        // select the new one
        ((listview.sel.indices.length === 1 &&
        listview.sel.indices[0] !== index) ||
        // more than 1 item are selected
        listview.sel.indices.length > 1))) {
      listview.set_sel({
        anchor:   index,
        indices:  [index],
        items:    [item],
      });
    // selected clicked again, remove selection regardless of
    // modifier keys
    } else if (listview.sel.indices.length === 1 &&
      listview.sel.indices[0] == index) {
      listview.set_sel({
        anchor:   -1,
        indices:  [],
        items:    [],
      });
    // shift pressed, calculate the new selection according
    // to the anchor
    } else if (listview.sel.anchor !== -1 &&
      e.shiftKey) {
      var indices_ = [];
      var items_ = [];
      for (var i = Math.min(listview.sel.anchor, index); i <= Math.max(listview.sel.anchor, index); i++) {
        if (listview.items[i].type === 's3' ||
          typeof listview.items[i].info !== 'string')
          continue;
        indices_.push(i);
        items_.push(listview.items[i]);
      }
      listview.set_sel({
        anchor:   listview.sel.anchor,
        indices:  indices_,
        items:    items_,
      });
    // ctrl/cmd pressed, add or remove selection
    } else if (e.ctrlKey || e.metaKey) {
      // remove existing
      var idx_ = listview.sel.indices.indexOf(index);
      if (idx_ >= 0) {
        var indices_ = listview.sel.indices.slice();
        var items_ = listview.sel.items.slice();
        indices_.splice(idx_, 1);
        items_.splice(idx_, 1);
        listview.set_sel({
          anchor:   index,
          indices:  indices_,
          items:    items_,
        });
      // add new
      } else {
        listview.set_sel({
          anchor:   index,
          indices:  listview.sel.indices.concat([index]),
          items:    listview.sel.items.concat([listview.items[index]]),
        });
      }
    }
  }

  function folderDblClick(e) {
    listview.set_loaded(false);
    listview.set_sel({ anchor: -1, indices: [], items: [] });
    if (listview.set_path) {
      listview.set_path(typeof listview.path === 'undefined' ? item.name : (listview.path + '|' + item.name));
      return;
    }
    navigate("/documents/" + (typeof listview.path === 'undefined' ? item.name : (listview.path + '|' + item.name)));
  }
  function parentFolderDblClick(e) {
    listview.set_loaded(false);
    if (typeof listview.path !== 'undefined') {
      listview.set_sel({ anchor: -1, indices: [], items: [] });
      let idx = listview.path.lastIndexOf("|");
      if (idx > 0) {
        let newPath = listview.path.substr(0, idx);
        if (listview.set_path)
          listview.set_path(newPath);
        else
          navigate("/documents/" + newPath);
        return;
      }
      if (listview.set_path)
        listview.set_path(void 0);
      else
        navigate("/documents");
    }
  }
  function fileDblClick(e) {
    listview.set_loaded(false);
    if (listview.set_path)
      return;
    navigate("/documents/" + (listview.path ? listview.path : '|') + "/" + item.name);
  }

  let hoverCls = 'hover:bg-slate-100';
  let selCls = hoverCls + ' border-b-slate-100';
  if (listview.sel.indices.indexOf(index) >= 0)
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
      <td className="bg-transparent text-xs">{formatBytes(item.size)}</td>
      <td className="bg-transparent text-xs">{(new Date(item.date)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'})}</td>
      <ItemInfo info={ item.info }/>
    </tr>
  )
}


function ParentFolderItem({ listview }) {
  const parentFolder = { type: 'parent_folder' };

  if (listview.path &&
    listview.path != 'root') {
    return (
      <Item listview={ listview } index={ -1 } item={ parentFolder } />
    )
  }
  return (null)
}


function AllItems({ listview }) {

  let renderedItems = (null);
  if (listview.items)
    renderedItems = (listview.items.map(( item, idx ) => (
      <Item key={ idx } listview={ listview } index={ idx } item={ item } />
    )))

  return (
    <tbody>
      <ParentFolderItem listview={ listview } />
      { renderedItems }
      { listview.set_path?(null):(
      <tr>
        <td colSpan="5">
          <div className="text-center text-slate-400 cursor-default"><i className="icon-docs mr-2"/>Drop files here to upload</div>
        </td>
      </tr>
      )}
    </tbody>
  )
}


export default function ListView({ listview, dropzone }) {

  // const allItems = {
  //   root: [
  //     { type: 'folder', name: '2021 Sustainability Reports', info: '52 files'},
  //     { type: 'folder', name: '2022 Sustainability Reports', info: '67 files'},
  //     { type: 'folder', name: '2023 Sustainability Reports', info: '67 files'},
  //     { type: 's3', name: 'Demo S3 Bucket', info: '17 files'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
  //       status: 'Analyzing (53 of 150 pages) ...'
  //     }},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
  //       status: 'Analyzing (63 of 150 pages) ...'
  //     }},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 1, size: '2.1MB', date: 'Aug 31, 2021' , info: {
  //       status: 'Analyzing (73 of 150 pages) ...'
  //     }},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 2, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //   ],
  //   '2021 Sustainability Reports': [
  //     { type: 'folder', name: 'Another sub folder', info: '2 files'},
  //   ],
  //   '2021 Sustainability Reports|Another sub folder': [
  //     { type: 'folder', name: 'empty folder', info: '2 files'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //     { type: 'file', name: '2021-tesla-impact-report.pdf', id: 3, size: '2.1MB', date: 'Aug 31, 2021' , info: '144 pages'},
  //   ],
  //   '2022 Sustainability Reports': [
  //     { type: 'folder', name: 'Another sub folder', info: '2 files'},
  //   ],
  //   '2023 Sustainability Reports': [
  //     { type: 'folder', name: 'Another sub folder', info: '2 files'},
  //   ],
  // };
  const refScroll = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  function trackRefScroll(e) {
    setScrollTop(refScroll.current.scrollTop);
  };

  useEffect(() => {
    setTimeout(() => listview.refresh(listview.path));
  }, [ listview.path ]);

  if (!listview.loaded)
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
        <AllItems listview={ listview } />
      </table>
    </div>
  )

  // a listview with dropzone support
  if (typeof dropzone !== 'undefined')
    return (
      <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto" ref={refScroll} onScroll={trackRefScroll}>
        <div {...dropzone.getRootProps({
            className: 'absolute left-0 right-0 top-0 bottom-0 outline-none dropzone',
          })}>
          <input {...dropzone.getInputProps()} />
          <div className={`${ dropzone.isDragActive ? '':'hidden' } z-50 border-2 border-teal-500 bg-teal-200/20 absolute left-0 right-0 h-full dropzone grid place-items-center`} style={{ top: scrollTop + 'px' }}>
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
