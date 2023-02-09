import { useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { scn } from './styles';
import { config } from './config';
import { auth } from './auth';
import { useFocus } from './utils';


function CurrentFolderDropdown({ menuFunc }) {

  return (
    <div>
      <ul tabIndex={0} className="dropdown-content menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded w-48">
        <li className="border-b border-slate-100"><a className={scn.menuA} onClick={ menuFunc.newFolder }><i className="icon-folder text-slate-500 mr-3"/>New Folder</a></li>
        <li><a className={scn.menuA} onClick={ menuFunc.connectS3 }><i className="icon-upload-cloud text-slate-500 mr-3"/>Connect S3 Bucket</a></li>
        <li className=""><a className={scn.menuA} onClick={ menuFunc.upload }><i className="icon-upload text-slate-500 mr-3"/>Upload Files</a></li>
      </ul>
    </div>
  )
}


function FolderButton({ idx, folders, listview, file, menuFunc }) {
  var folder = folders[idx];
  let navigate = useNavigate();

  function buttonClick(e) {
    let path = "";
    for (var i = 0; i <= idx; i++) {
      if (i == 0) {
        path += folders[i];
        continue;
      }
      path += "|" + folders[i];
    }
    if (listview.set_path)
      listview.set_path(path);
    else
      navigate('/documents/' + path);
  }

  if (idx == folders.length - 1 &&
    !file &&
    !listview.set_path)
    return (
      <span>
        <i className="icon-right-open text-slate-300"/>
        <div className="dropdown">
          <label tabIndex={0} className={`cursor-pointer items-center ${scn.clearButton}`}>
            <i className="icon-folder text-slate-500 pl-1 pr-6"/>
            {folder} <FolderCount sel={ listview.sel.indices.length } count={ listview.items.length }/>
            <i className="icon-down-dir pl-3 pr-2 text-slate-500"/>
          </label>
          <CurrentFolderDropdown menuFunc={ menuFunc }/>
        </div>
      </span>
    )
  return (
    <span>
      <i className="icon-right-open text-slate-300"/>
      <button className={scn.clearButton} onClick={buttonClick}><i className="icon-folder text-slate-500 pl-1 pr-6"/>{folder}</button>
    </span>
  )
}


function FolderCount({ sel, count }) {

  if (count <= 0)
    return (null)

  if (sel == 0)
    return (
      <span className="ml-2 h-4 px-1 font-black text-xs text-white rounded-full bg-slate-400">{ count }</span>
    )

  return (
    <span className="ml-2 h-4 px-1 text-xs text-white rounded-full bg-slate-400"><span className="font-black">{ sel }</span>/<span className="font-black">{ count }</span></span>
  )

}


function DocumentsButton({ listview }) {
  let navigate = useNavigate();

  function goDocuments() {
    if (listview.set_path)
      listview.set_path(undefined);
    else
      navigate("/documents");
  }

  return (
    <button className={scn.clearButton} onClick={ goDocuments }><i className="icon-archive text-slate-500 pl-1 pr-6"/>Documents</button>
  );
}


export default function ToolStrip({ listview, uploadFunc }) {

  const { file } = useParams();
  const refDlgNewFolder = useRef();
  const refDlgConnectS3 = useRef();
  const [ name, setName ] = useState('');
  const [ input_focus_ref, set_input_focus ] = useFocus();

  let folders = [];
  if (typeof listview.path !== 'undefined' &&
    listview.path &&
    listview.path != '|')
    folders = listview.path.split('|');

  // Dialog handlers
  function newFolder(e) {
    setName('');
    document.activeElement.blur();
    refDlgNewFolder.current.checked = true;
    setTimeout(() => {
      set_input_focus();
    }, 250);
  }
  function closeNewFolder(e) {
    refDlgNewFolder.current.checked = false;
  }
  function createFolder(e) {
    auth.post({base: '/files/new', folder: listview.path}, {
      body: JSON.stringify({ name: name })
    }, ( data ) => {
      if (data.status == 'ok') {
        listview.refresh(listview.path);
      } else {
        console.warn('unhandled data', data);
      }
    });
  }

  function connectS3(e) {
    document.activeElement.blur();
    refDlgConnectS3.current.checked = true;
  }
  function closeConnectS3(e) {
    refDlgConnectS3.current.checked = false;
  }

  function upload(e) {
    document.activeElement.blur();
    uploadFunc();
  }

  // A single "Documents" dropdown button
  let documentsButton = (
    <div className="dropdown">
      <label tabIndex={0} className={`cursor-pointer items-center ${scn.clearButton}`}>
        <i className="icon-archive text-slate-500 pl-1 pr-6"/>
        Documents <FolderCount sel={ listview.sel.indices.length } count={ listview.items.length }/>
        <i className="icon-down-dir pl-3 pr-2 text-slate-500"/>
      </label>
      <CurrentFolderDropdown menuFunc={ { newFolder: newFolder, connectS3: connectS3, upload: upload } }/>
    </div>
  );
  // "Documents" non-dropdown button shows up whenever viewing a
  // file or in at least one level folder.
  if (file ||
    folders.length > 0 ||
    listview.set_path)
    documentsButton = (<DocumentsButton listview={ listview }/>);

  // A file button appears only when viewing a file
  let fileButton = (null);
  if (file)
    fileButton = (
      <span>
        <i className="icon-right-open text-slate-300"/>
        <button className={scn.clearButton}>
          <i className="icon-doc-text text-slate-500 pl-1 pr-6"/>{ file }
        </button>
      </span>
    )

  // Dialogs
  let dialogs = (
    <div>
      <input type="checkbox" id="dialog-new-folder" className="modal-toggle" ref={ refDlgNewFolder } />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">New Folder</h3>
          <div className="form-control w-full">
            <p className="py-3">Enter a name to create a new folder</p>
            <input ref={ input_focus_ref } type="text" placeholder="Name of the Folder" className={ scn.input } onChange={ e => setName(e.target.value) } value={ name }/>
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeNewFolder }>Cancel</button>
            <label htmlFor="dialog-new-folder" className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500 text-white" disabled={ name.length == 0 } onClick={ createFolder }>Create</label>
          </div>
        </div>
      </div>


      <input type="checkbox" id="dialog-connect-s3" className="modal-toggle" ref={ refDlgConnectS3 } />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Connect an S3 Bucket</h3>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Bucket Location</span>
            </label>
            <input type="text" placeholder="s3://" className={ scn.input } />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">AccessKeyId</span>
            </label>
            <input type="text" placeholder="AccessKeyId" className={ scn.input } />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">SecretAccessKey</span>
            </label>
            <input type="text" placeholder="SecretAccessKey" className={ scn.input } />
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeConnectS3 }>Cancel</button>
            <label htmlFor="dialog-connect-s3" className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500 text-white">Connect</label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      { documentsButton }
      {
        folders.map((folder, idx) => (
          <FolderButton key={ idx } idx={ idx } folders={ folders } listview={ listview } file={ file } menuFunc={ { newFolder: newFolder, connectS3: connectS3, upload: upload } }/>
        ))
      }
      { fileButton }
      { dialogs }
    </div>
  )
}