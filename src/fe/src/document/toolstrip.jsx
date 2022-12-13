import { Link, useParams, useNavigate } from 'react-router-dom';


function CurrentFolderDropdown() {
  return (
    <ul tabIndex={0} className="dropdown-content menu menu-compact drop-shadow-lg bg-base-100 rounded w-44">
      <li><a className="pr-6 hover:text-slate-500"><i className="icon-folder text-slate-500"/>New Folder</a></li>
      <li className="border-t border-slate-100"><a className="hover:text-slate-500"><i className="icon-upload text-slate-500"/>Upload Files</a></li>
    </ul>
  )
}


function FolderButton({ idx, folders, listSel, listCount, file }) {
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
          <CurrentFolderDropdown/>
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


export default function DocumentToolstrip({ listSel, listCount }) {

  const { path, file } = useParams();
  let navigate = useNavigate();

  let folders = [];
  if (typeof path !== 'undefined' &&
    path !== '|')
    folders = path.split('|');

  if (file) {
    return (
      <div>
        <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit" onClick={(node, event) => {
          navigate("/documents");
        }}><i className="icon-archive text-slate-500 pl-1 pr-6"/>Documents</button>
        {
          folders.map((folder, idx) => (
            <FolderButton idx={ idx } folders={ folders } listSel={ listSel } listCount={ listCount } file={ file }/>
          ))
        }
        <i className="icon-right-open text-slate-300"/>
        <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit">
          <i className="icon-doc-text text-slate-500 pl-1 pr-6"/>{ file }
        </button>
      </div>
    )
  }

  if (folders.length == 0)
    return (
      <div>
        <div className="dropdown">
          <label tabIndex={0} className="cursor-pointer hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit items-center">
            <i className="icon-archive text-slate-500 pl-1 pr-6"/>
            Documents <FolderCount sel={ listSel } count={ listCount }/>
            <i className="icon-down-dir pl-3 pr-2 text-slate-500"/>
          </label>
          <CurrentFolderDropdown/>
        </div>
      </div>
    )

  return (
    <div>
      <button className="bg-white hover:bg-slate-100 hover:border-slate-200 border border-white px-2 py-1 rounded inline-flex min-h-fit" onClick={(node, event) => {
        navigate("/documents");
      }}><i className="icon-archive text-slate-500 pl-1 pr-6"/>Documents</button>
      {
        folders.map((folder, idx) => (
          <FolderButton folder={ folder } idx={ idx } folders={ folders } listSel={ listSel } listCount={ listCount }/>
        ))
      }
    </div>
  )
}