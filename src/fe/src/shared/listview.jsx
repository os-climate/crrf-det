import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { config } from './config';
import { auth } from './auth';
import { scn } from './styles';
import { useFocus } from '../shared/utils';


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
  function showContextMenu(e) {
    e.preventDefault();
    var justClicked = false;
    // if nothing is selected, select something
    if (listview.sel.indices.length == 0) {
      itemClick(e);
      justClicked = true;
    }
    // display context menu
    if (e.target.tagName == 'TD' &&
      (listview.sel.indices.length > 0 ||
      justClicked)) {
      listview.set_ctx_mnsc(justClicked?1:listview.sel.indices.length);
      var tableBox = e.target.parentElement.parentElement.parentElement.getBoundingClientRect();
      listview.set_ctx_mnpos([e.clientX - tableBox.x, e.clientY - tableBox.y]);
    }
  }

  let hoverCls = 'hover:bg-slate-100';
  let selCls = hoverCls + ' border-b-slate-100';
  if (listview.sel.indices.indexOf(index) >= 0)
    selCls = 'bg-teal-100 border-b-teal-100';

  if (item.type == 'folder') {
    return (
      <tr className={`${ selCls } cursor-default border-b`} onDoubleClick={folderDblClick} onClick={ itemClick }  onContextMenu={ showContextMenu }>
        <td className="bg-transparent"><i className="icon-folder text-slate-500"/></td>
        <td className="bg-transparent">{item.name}</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="text-xs bg-transparent">{item.info}</td> 
      </tr>
    )
  } else if (item.type == 'parent_folder') {
    return (
      <tr className={`${ hoverCls } cursor-default border-b border-b-slate-100`} onDoubleClick={ parentFolderDblClick }>
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
    <tr className={`${ trCls } ${ selCls } border-b cursor-default`} onClick={ itemClick } onDoubleClick={ fileDblClick }onContextMenu={ showContextMenu }>
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


function ContextMenu({ listview }) {
  let style = { display: 'none' };
  if (listview.ctx_mnpos[0] >= 0 &&
    listview.ctx_mnpos[1] >= 0)
    style = { left: listview.ctx_mnpos[0], top: listview.ctx_mnpos[1] };

  function open(e) {
    console.log('open', e);
  }

  function rename(e) {
    listview.set_name(listview.sel.items[0].name);
    listview.set_dlg_rename(true);
    setTimeout(() => {
      listview.set_input_focus();
    }, 250);
  }

  function delete_(e) {
    listview.set_dlg_delete(true);
  }

  return (
    <ul className="menu menu-compact shadow-md bg-base-100 w-40 p-2 rounded-md border border-slate-100 absolute z-50" style={ style }>
      <li className="menu-title">
        <span>{ listview.ctx_mnsc } selected</span>
      </li>
      { listview.ctx_mnsc == 1?(<li><a onClick={ open }><i className="icon-up"/> Open</a></li>):(null) }
      { listview.ctx_mnsc == 1?(<li><a onClick={ rename }><i className="icon-pencil"/>Rename</a></li>):(null) }
      <li><a onClick={ delete_ }><i className="icon-trash"/>Delete</a></li>
    </ul>
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

  /* context menu support */
  const [ name, set_name ] = useState('');
  const [ ctx_mnpos, set_ctx_mnpos ] = useState([-1, -1]);
  const [ ctx_mnsc, set_ctx_mnsc ] = useState(-1);
  const [ dlg_delete, set_dlg_delete ] = useState(false);
  const [ dlg_rename, set_dlg_rename ] = useState(false);
  const [ input_focus_ref, set_input_focus ] = useFocus();
  listview.name = name;
  listview.set_name = set_name;
  listview.ctx_mnpos = ctx_mnpos;
  listview.set_ctx_mnpos = set_ctx_mnpos;
  listview.ctx_mnsc = ctx_mnsc;
  listview.set_ctx_mnsc = set_ctx_mnsc;
  listview.dlg_delete = dlg_delete;
  listview.set_dlg_delete = set_dlg_delete;
  listview.dlg_rename = dlg_rename;
  listview.set_dlg_rename = set_dlg_rename;
  listview.set_input_focus = set_input_focus;
  /* dialogs */
  const [ dlg_is_working, set_dlg_is_working ] = useState(false);

  useEffect(() => {
    setTimeout(() => listview.refresh(listview.path));
  }, [ listview.path ]);

  function onClick(e) {
    set_ctx_mnpos([-1, -1]);
  }

  function cancelDlgs(e) {
    listview.set_dlg_delete(false);
    listview.set_dlg_rename(false);
  }
  function doDeleteSelected(e) {
    set_dlg_is_working(true);
    let apiPath = '/files/delete';
    if (listview.path)
      apiPath += '/' + listview.path;
    setTimeout(() => {
      var filenames = [];
      for (let item of listview.sel.items)
        filenames.push(item.name);
      auth.post(config.endpoint_base + apiPath, {
        body: JSON.stringify({'name': filenames})
      }, ( data ) => {
        if (!data) {
          console.warn('returned data is null');
          return;
        }
        if (data.status == 'ok') {
          set_dlg_is_working(false);
          listview.set_dlg_delete(false);
          listview.refresh(listview.path);
        } else {
          console.warn('unhandled data', data);
        }
      });
    });
  }
  function doRenameSelected(e) {
    set_dlg_is_working(true);
    let apiPath = '/files/change';
    if (listview.path)
      apiPath += '/' + listview.path;
    setTimeout(() => {
      var oldName = listview.sel.items[0].name;
      auth.post(config.endpoint_base + apiPath, {
        body: JSON.stringify({'old_name': oldName, 'new_name': name})
      }, ( data ) => {
        if (!data) {
          console.warn('returned data is null');
          return;
        }
        if (data.status == 'ok') {
          set_dlg_is_working(false);
          listview.set_dlg_rename(false);
          listview.refresh(listview.path);
        } else {
          console.warn('unhandled data', data);
        }
      });
    });
  }

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
      <div className="absolute left-0 top-0 right-0 bottom-0 overflow-auto" ref={refScroll} onScroll={trackRefScroll} onClick={ onClick }>
        <ContextMenu listview={ listview }/>
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
        {/* dialogs */}
        <input type="checkbox" id="dlg-delete" className="modal-toggle"  />
        <div className={ (dlg_delete?'modal-open ':'') + "modal"}>
          <div className="modal-box">
            <h3 className="font-bold text-lg"><i className="icon-trash mr-3"/>Deleting { listview.sel.indices.length } selected files (folders)</h3>
            <p className="py-4">Deleted files cannot be recovered. Please proceed with caution!</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={ cancelDlgs } disabled={ dlg_is_working }>Cancel</button>
              <button className={ (dlg_is_working?'loading':'') + " btn btn-error" } disabled={ dlg_is_working } onClick={ doDeleteSelected }>Delete</button>
            </div>
          </div>
        </div>
        <input type="checkbox" id="dlg-rename" className="modal-toggle"  />
        <div className={ (dlg_rename?'modal-open ':'') + "modal"}>
          <div className="modal-box">
            <h3 className="font-bold text-lg"><i className="icon-trash mr-3"/>Rename</h3>
            <p className="pt-4">
            { listview.sel.items.length > 0 && listview.sel.items[0].type == 'folder' ? (<span>Rename a folder</span>):(<span>Rename a file</span>) }
            </p>
            <p className="py-4">
              <input ref={ input_focus_ref } type="text" placeholder="Name" onChange={ e => set_name(e.target.value) } className={ scn.input } onFocus={ e => e.target.select() } value={ name } />
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={ cancelDlgs } disabled={ dlg_is_working }>Cancel</button>
              <button className={ (dlg_is_working?'loading':'') + " btn btn-error" } disabled={ dlg_is_working || name.length == 0 || (listview.sel.indices.length == 1 && listview.sel.items[0].type == 'file' && !name.toLowerCase().endsWith('.pdf')) } onClick={ doRenameSelected }>Rename</button>
            </div>
          </div>
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
