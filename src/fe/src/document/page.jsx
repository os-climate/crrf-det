import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import DocumentListView from './list_view';
import DocumentPreview from './preview';
import DocumentToolstrip from './toolstrip';
import DocumentView from './view';
import DocumentFilterDeck from './filter_deck';
import DocumentStructure from './structure';


function Content({ previewWidth, path, file, listSel, setListSel, listCount, setListCount, getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, uploadFunc, pageNum, setPageNum }) {

  const [mode, setMode] = useState('text');
  const [text, setText] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableBoxes, setTableBoxes] = useState([]);
  const [tableBoxHL, setTableBoxHL] = useState(-1);
  const [textBoxes, setTextBoxes] = useState([]);
  const [textBoxHL, setTextBoxHL] = useState(-1);

  if (!file)
    return (
      <div>
        <div className="absolute left-0 top-0 bottom-0" style={{ right: previewWidth }}>
          <DocumentListView path={ path } listSel={ listSel } setListSel={ setListSel } setListCount={ setListCount } getRootProps={ getRootProps } getInputProps={ getInputProps } isDragActive={ isDragActive } isDragAccept={ isDragAccept } isDragReject={ isDragReject } uploadFunc={ uploadFunc }/>
        </div>
        <div className="absolute top-0 right-0 bottom-0" style={{ width: previewWidth }}>
          <DocumentPreview listSel={ listSel } listCount={ listCount }/>
        </div>
      </div>
    )

  return (
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
  )
}


function Uploader({ files, isComplete }) {
  if (isComplete)
    return (
      <div>
        <div>{files.length} files uploaded.</div>
        <progress className="progress progress-success w-56" value="100" max="100"></progress>
      </div>
    )

  return (
    <div>
      <div>Uploading {files[0].name} (1 / {files.length}) ...</div>
      <progress className="progress progress-info w-56" value="40" max="100"></progress>
    </div>
  )
}


export default function DocumentPage({ previewWidth }) {

  const { path, file } = useParams();
  const [ listSel, setListSel ] = useState({
    anchor:   -1,
    indices:  [],
    items:    [],
  });
  const [ listCount, setListCount ] = useState(0);
  const [ pageNum, setPageNum ] = useState(1);

  if (typeof previewWidth === 'undefined')
    previewWidth = '20rem';

  const {getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open} = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    noClick: true,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length === 0) {
        toast.error(<span>Only files with <span className="font-bold">.pdf</span> extension are accepted.</span>, {
          duration: 5000,
          position: 'bottom-right'
        })
        return;
      }
      const id = toast.loading(<Uploader files={ acceptedFiles } isComplete={ false }/>, {
        position: 'bottom-right'
      });
      setTimeout(() => {
        toast.success(<Uploader files={ acceptedFiles } isComplete={ true }/>, {
          id: id,
          duration: 5000
        })
      }, 10000);
    }
  });

  return (
    <div className="text-base">

      <div className="left-2 top-1 absolute">
        <DocumentToolstrip listSel={ listSel } listCount={ listCount } uploadFunc={ open }/>
      </div>

      <div className="left-2 top-11 right-2 bottom-2 absolute">
        <Content previewWidth={ previewWidth } path={ path } file={ file } listSel={ listSel } setListSel={ setListSel } listCount={ listCount } setListCount={ setListCount } getRootProps={ getRootProps } getInputProps={ getInputProps } isDragActive={ isDragActive } isDragAccept={ isDragAccept } isDragReject={ isDragReject } uploadFunc={ open } pageNum={ pageNum } setPageNum={ setPageNum } />
      </div>

    </div>
  )
}
