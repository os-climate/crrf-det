import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ListView from '../shared/listview';
import ListPreview from '../shared/listpreview';
import ToolStrip from '../shared/toolstrip';
import DocumentView from './view';
import DocumentFilterDeck from './filter_deck';
import DocumentStructure from './structure';
import { init_dropzone } from './upload';


export default function DocumentPage({ listview, previewWidth }) {

  const [ mode, setMode ] = useState('text');

  /* for 'list view' mode */
  const { path, file } = useParams();
  listview.path = path;

  /* for 'document view' mode */
  const [ pageNum, setPageNum ] = useState(1);
  const [ text, setText ] = useState([]);
  const [ tables, setTables ] = useState([]);
  const [ tableBoxes, setTableBoxes ] = useState([]);
  const [ tableBoxHL, setTableBoxHL ] = useState(-1);
  const [ textBoxes, setTextBoxes ] = useState([]);
  const [ textBoxHL, setTextBoxHL ] = useState(-1);

  if (typeof previewWidth === 'undefined')
    previewWidth = '20rem';

  const dropzone = init_dropzone(path, listview.refresh);

  return (
    <div className="text-base">

      <div className="left-2 top-1 absolute">
        <ToolStrip listview={ listview } uploadFunc={ dropzone.open }/>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
      { file ? (
        // 'document view' mode
        <div>
          <div className="absolute left-0 right-96 top-0 bottom-0">
            <DocumentView path={ path } file={ file } pageNum={ pageNum } setPageNum={ setPageNum } mode={ mode } setMode={ setMode } tables={ tables } tableBoxes={ tableBoxes } tableBoxHL={ tableBoxHL } setTableBoxHL={ setTableBoxHL } text={ text } textBoxes={ textBoxes } textBoxHL={ textBoxHL } setTextBoxHL={ setTextBoxHL }/>
          </div>
          <div className="absolute right-0 w-96 top-0 bottom-40">
            <DocumentStructure pageNum={ pageNum } mode={ mode } setMode={ setMode } tables={ tables } setTables={ setTables } setTableBoxes={ setTableBoxes } tableBoxHL={ tableBoxHL } setTableBoxHL={ setTableBoxHL } text={ text } setText={ setText } setTextBoxes={ setTextBoxes } textBoxHL={ textBoxHL } setTextBoxHL={ setTextBoxHL }/>
          </div>
          <div className="absolute right-0 w-96 h-40 bottom-0">
            <DocumentFilterDeck/>
          </div>
        </div>
      ) : (
        // 'list view' mode
        <div>
          <div className="absolute left-0 top-0 bottom-0" style={{ right: previewWidth }}>
            <ListView listview={ listview } dropzone={ dropzone }/>
          </div>
          <div className="absolute top-0 right-0 bottom-0" style={{ width: previewWidth }}>
            <ListPreview listview={ listview }/>
          </div>
        </div>
      )}
      </div>

    </div>
  )
}
