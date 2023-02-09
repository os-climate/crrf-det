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

  /* for 'list view' mode */
  const { path, file } = useParams();
  listview.path = path;

  /* for 'document view' mode */
  const [ page, set_page ] = useState(1);
  const [ mode, set_mode ] = useState('text');
  const [ text, set_text ] = useState([]);
  const [ table, set_table ] = useState([]);
  const [ textbox, set_textbox ] = useState([]);
  const [ texthl, set_texthl ] = useState(-1);
  const [ tablebox, set_tablebox ] = useState([]);
  const [ tablehl, set_tablehl ] = useState(-1);
  const pagecontent = { page, set_page, mode, set_mode, text, set_text, table, set_table, textbox, set_textbox, texthl, set_texthl, tablebox, set_tablebox, tablehl, set_tablehl };

  /* for filters in 'document view' mode */
  const [ working, set_working ] = useState(false);
  const [ result, set_result ] = useState({});
  const filterstatus = { working, set_working, result, set_result };

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
            <DocumentView path={ path } file={ file } pagecontent={ pagecontent }/>
          </div>
          <div className="absolute right-0 w-96 top-0 bottom-40">
            <DocumentStructure path={ path } file={ file } pagecontent={ pagecontent }/>
          </div>
          <div className="absolute right-0 w-96 h-40 bottom-0">
            <DocumentFilterDeck path={ path } file={ file } filterstatus={ filterstatus } />
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
