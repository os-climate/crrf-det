import { useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';


function CurrentFolderDropdown({ menuFunc }) {

  return (
    <div>
      <ul tabIndex={0} className="dropdown-content menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded w-48">
        <li className="border-b border-slate-100"><a className="hover:text-slate-500" onClick={ menuFunc.newFolder }><i className="icon-folder text-slate-500"/>New Folder</a></li>
        <li><a className="hover:text-slate-500" onClick={ menuFunc.connectS3 }><i className="icon-upload text-slate-500"/>Connect S3 Bucket</a></li>
        <li className=""><a className="hover:text-slate-500" onClick={ menuFunc.upload }><i className="icon-upload text-slate-500"/>Upload Files</a></li>
      </ul>
    </div>
  )
}


function FolderButton({ idx, folders, listSel, listCount, file, menuFunc }) {
  var folder = folders[idx];
  let navigate = useNavigate();

  if (idx == folders.length - 1 &&
    !file)
    return (
      <span>
        <i className="icon-right-open text-slate-300"/>
        <div className="dropdown">
          <label tabIndex={0} className="cursor-pointer hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit items-center">
            <i className="icon-folder text-slate-500 pl-1 pr-6"/>
            {folder} <FolderCount sel={ listSel } count={ listCount }/>
            <i className="icon-down-dir pl-3 pr-2 text-slate-500"/>
          </label>
          <CurrentFolderDropdown menuFunc={ menuFunc }/>
        </div>
      </span>
    )
  return (
    <span>
      <i className="icon-right-open text-slate-300"/>
      <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit" onClick={(node, event) => {
        let path = "/documents/";
        for (var i = 0; i <= idx; i++) {
          if (i == 0) {
            path += folders[i];
            continue;
          }
          path += "|" + folders[i];
        }
        navigate(path);
      }}><i className="icon-folder text-slate-500 pl-1 pr-6"/>{folder}</button>
    </span>
  )
}


function FolderCount({ sel, count }) {

  if (count <= 0)
    return (null)

  if (sel.length == 0)
    return (
      <span className="ml-2 h-4 px-1 font-bold text-xs text-white rounded-full bg-slate-400">{ count }</span>
    )

  return (
    <span className="ml-2 h-4 px-1 font-bold text-xs text-white rounded-full bg-slate-400">{ sel.length }/{ count }</span>
  )

}


function DocumentsButton() {
  let navigate = useNavigate();

  function goDocuments() {
    navigate("/documents");
  }

  return (
    <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit" onClick={ goDocuments }><i className="icon-archive text-slate-500 pl-1 pr-6"/>Documents</button>
  );
}


export default function DocumentToolstrip({ listSel, listCount, uploadFunc }) {

  const { path, file } = useParams();
  const refDlgNewFolder = useRef();
  const refDlgConnectS3 = useRef();

  let folders = [];
  if (typeof path !== 'undefined' &&
    path !== '|')
    folders = path.split('|');

  // Dialog handlers
  function newFolder(e) {
    document.activeElement.blur();
    refDlgNewFolder.current.checked = true;
  }
  function closeNewFolder(e) {
    refDlgNewFolder.current.checked = false;
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
      <label tabIndex={0} className="cursor-pointer hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit items-center">
        <i className="icon-archive text-slate-500 pl-1 pr-6"/>
        Documents <FolderCount sel={ listSel } count={ listCount }/>
        <i className="icon-down-dir pl-3 pr-2 text-slate-500"/>
      </label>
      <CurrentFolderDropdown menuFunc={ { newFolder: newFolder, connectS3: connectS3, upload: upload } }/>
    </div>
  );
  // "Documents" non-dropdown button shows up whenever viewing a
  // file or in at least one level folder.
  if (file ||
    folders.length > 0)
    documentsButton = (<DocumentsButton/>);

  // A file button appears only when viewing a file
  let fileButton = (null);
  if (file)
    fileButton = (
      <span>
        <i className="icon-right-open text-slate-300"/>
        <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit">
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
            <input type="text" placeholder="Name of the Folder" className="input input-bordered w-full" />
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeNewFolder }>Cancel</button>
            <label htmlFor="dialog-new-folder" className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500">Create</label>
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
            <input type="text" placeholder="s3://" className="input input-bordered w-full" />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">AccessKeyId</span>
            </label>
            <input type="text" placeholder="AccessKeyId" className="input input-bordered w-full" />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">SecretAccessKey</span>
            </label>
            <input type="text" placeholder="SecretAccessKey" className="input input-bordered w-full" />
          </div>
          <div className="modal-action">
            <button className="btn bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-200 hover:border-slate-400" onClick={ closeConnectS3 }>Cancel</button>
            <label htmlFor="dialog-connect-s3" className="btn bg-teal-300 hover:bg-teal-600 hover:border-teal-700 border-teal-500">Connect</label>
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
          <FolderButton key={ idx } idx={ idx } folders={ folders } listSel={ listSel } listCount={ listCount } file={ file } menuFunc={ { newFolder: newFolder, connectS3: connectS3, upload: upload } }/>
        ))
      }
      { fileButton }
      { dialogs }
    </div>
  )
}