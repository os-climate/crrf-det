import React, { useEffect } from 'react';
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
      <div className="flex items-center text-blue-600">
        <div className="w-4 h-4 mr-2 rounded-full animate-spin border border-solid border-2 border-blue-500 border-t-transparent"></div>
        {info.status}
      </div>
    </td> 
  )

}


function Item({ listSel, setListSel, index, path, item }) {
  let navigate = useNavigate();

  function findListSelIndices() {
    var ret = [];
    for (var i = 0; i < listSel.length; i++) {
      ret.push(listSel[i].itemIndex);
    }
    return ret;
  }

  function itemClick(e) {
    if (item.type === 's3')
      return;
    if (typeof item.info !== 'string')
      return;
    var selIndices = findListSelIndices();
    if (selIndices.length > 0) {
      if (selIndices.indexOf(index) >= 0)
        setListSel([]);
      else
        setListSel([Object.assign({}, item, { itemIndex: index })]);
    } else {
      setListSel([Object.assign({}, item, { itemIndex: index })]);
    }
  }

  function itemDblClick(e) {
    navigate("/documents/" + (path ? path : '|') + "/" + item.name);
  }

  let hoverCls = 'hover:bg-slate-100';
  let selCls = hoverCls;
  if (findListSelIndices().indexOf(index) >= 0)
    selCls = 'bg-sky-100';

  if (item.type == 'folder') {
    return (
      <tr className={`${ selCls } cursor-default`} onDoubleClick={(node, event) => {
        navigate("/documents/" + (typeof path === 'undefined' ? item.name : (path + '|' + item.name)));
        setListSel([]);
      }} onClick={ itemClick }>
        <td className="bg-transparent"><i className="icon-folder text-slate-500"/></td>
        <td className="bg-transparent">{item.name}</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="text-xs bg-transparent">{item.info}</td> 
      </tr>
    )
  } else if (item.type == 'parent_folder') {
    return (
      <tr className={`${ hoverCls } cursor-default`} onDoubleClick={(node, event) => {
        if (typeof path !== 'undefined') {
          let idx = path.lastIndexOf("|");
          if (idx > 0) {
            let newPath = path.substr(0, idx);
            navigate("/documents/" + newPath);
            setListSel([]);
            return;
          }
          setListSel([]);
          navigate("/documents");
        }
      }}>
        <td className="bg-transparent"><i className="icon-folder text-slate-500"/></td>
        <td className="bg-transparent">.. (Parent Folder)</td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
        <td className="bg-transparent"></td> 
      </tr>
    )
  } else if (item.type == 's3') {
    return (
      <tr className={`${ hoverCls } cursor-default`} onClick={ itemClick }>
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
    selCls = '';
  }
  return (
    <tr className={`${ trCls } ${ selCls } cursor-default`} onClick={ itemClick } onDoubleClick={ itemDblClick }>
      <td className="bg-transparent"><i className={`${ iconCls }`}/></td>
      <td className="bg-transparent">{item.name}</td>
      <td className="bg-transparent text-xs">{item.size}</td>
      <td className="bg-transparent text-xs">{item.date}</td>
      <ItemInfo info={ item.info }/>
    </tr>
  )
}


function ParentFolderItem({ listSel, setListSel, path }) {
  const parentFolder = { type: 'parent_folder' };

  if (path &&
    path != 'root') {
    return (
      <Item key='parent_folder' listSel={ listSel } setListSel={ setListSel } index={ -1 } path={ path } item={ parentFolder } />
    )
  }
  return (null)
}


function AllItems({ listSel, setListSel, path, items }) {

  if (!items)
    return (
      <tbody>
        <ParentFolderItem listSel={ listSel } setListSel={ setListSel } path={ path }/>
      </tbody>
    )

  return (
    <tbody>
      <ParentFolderItem listSel={ listSel } setListSel={ setListSel } path={ path }/>
    { items.map(( item, idx ) => (
      <Item key={ idx } listSel={ listSel } setListSel={ setListSel } index={ idx } path={ path } item={ item }/>
    )) }
    </tbody>
  )
}


export default function DocumentListView({ listSel, setListSel, setListCount, path }) {

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

  let items = allItems[path ? path : 'root'];

  useEffect(() => {
    if (items)
      setListCount(items.length);
    else
      setListCount(0);
  }, [path]);

  return (
    <div className="mr-1">
      <table className="table table-compact w-full select-none">
        <thead className="sticky top-0 cursor-default bg-slate-100">
          <tr>
            <th className="text-xs w-8"></th>
            <th className="text-xs">Name</th> 
            <th className="text-xs">Size</th> 
            <th className="text-xs">Date</th> 
            <th className="text-xs">Info</th> 
          </tr>
        </thead>
        <AllItems listSel={ listSel } setListSel={ setListSel } path={ path } items={ items }/>
      </table>
    </div>
  )
}
