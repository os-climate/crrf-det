import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DocumentListView from './list_view';
import DocumentPreview from './preview';
import DocumentToolstrip from './toolstrip';
import DocumentView from './view';

// https://merakiui.com/components/breadcrumbs


function Content({ path, file, listSel, setListSel, listCount, setListCount }) {

  if (!file)
    return (
      <div>
        <div className="absolute left-0 top-0 right-80 bottom-0 overflow-auto">
          <DocumentListView listSel={ listSel } setListSel={ setListSel } setListCount={ setListCount } path={ path }/>
        </div>
        <div className="absolute w-80 top-0 right-0 bottom-0">
          <DocumentPreview listSel={ listSel } listCount={ listCount }/>
        </div>
      </div>
    )

  return (
    <DocumentView path={ path } file={ file }/>
  )
}


export default function DocumentPage() {

  const { path, file } = useParams();
  const [ listSel, setListSel ] = useState([]);
  const [ listCount, setListCount ] = useState(-1);

  return (
    <div className="text-base">

      <div className="left-2 top-1 absolute">
        <DocumentToolstrip listSel={ listSel } listCount={ listCount }/>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
        <Content path={ path } file={ file } listSel={ listSel } setListSel={ setListSel } listCount={ listCount } setListCount={ setListCount } />
      </div>

    </div>
  )
}
