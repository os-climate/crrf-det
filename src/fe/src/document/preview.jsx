function Thumbnail({ itemData }) {
  if (!itemData)
    return (null)

  return (
    <div className="relative">
    { itemData.thumbs.slice().reverse().map((url, idx) => (
      <img key={ idx } className="absolute rounded border border-slate-500/50 right-0 hover:z-20" style={{top: (idx * 20) + 'px', width: (100 - (itemData.thumbs.length - idx) * 5) + '%'}} src={ url }/>
    ))}
    </div>
  )
}


function HasSelection({ listSel, listCount }) {

  const previewData = {
    '2021-tesla-impact-report.pdf': {
      'thumbs': [
        '/2021-tesla-impact-report.thumb.1.jpg',
        '/2021-tesla-impact-report.thumb.2.jpg',
        '/2021-tesla-impact-report.thumb.3.jpg',
        '/2021-tesla-impact-report.thumb.4.jpg',
        '/2021-tesla-impact-report.thumb.5.jpg',
      ]
    }
  }

  let details;
  let thumbs = (null);

  if (listSel.items.length == 1) {
    var item = listSel.items[0];
    if (item.type === 'file') {
      details = (
        <tr>
          <td className="align-top"><i className="icon-doc-text mx-2 text-teal-500 text-lg"/></td><td className="align-top text-slate-700">
            <div className="text-lg">{ item.name }</div>
            <div className="text-sm text-slate-400">{ item.size } / { item.info }</div>
            <div className="text-sm text-slate-400">{ item.date }</div>
          </td>
        </tr>
      )
      thumbs = (
        <div className="ml-1 mr-1 mt-2">
          <Thumbnail itemData={ previewData[item.name] }/>
        </div>
      )
    } else
      details = (
        <tr>
          <td className="align-top"><i className="icon-folder mx-2 text-teal-500 text-lg"/></td><td className="align-top text-slate-700">
            <div className="text-lg">{ item.name }</div>
            <div className="text-sm text-slate-400">{ item.info }</div>
          </td>
        </tr>
      )
  } else {
    var folders = [];
    var files = [];
    for (var i = 0; i < listSel.items.length; i++) {
      var item = listSel.items[i];
      if (item.type === 'file')
        files.push(item);
      else if (item.type === 'folder')
        folders.push(item);
    }
    details = [];
    if (folders.length > 0)
      details.push(
        <tr>
          <td className="align-top"><i className="icon-folder mx-2 text-teal-500 text-lg"/></td><td className="align-top text-slate-700">
            <div className="text-lg">{ folders.length } folders</div>
            { folders.map((item) => (
              <div className="text-sm text-slate-400">{ item.name }<span className="ml-2 text-xs">{ item.info }</span></div>
            ))}
          </td>
        </tr>
      );
    if (files.length > 0)
      details.push(
        <tr>
          <td className="align-top"><i className="icon-doc-text mx-2 text-teal-500 text-lg"/></td><td className="align-top text-slate-700">
            <div className="text-lg">{ files.length } files</div>
            { files.map((item) => (
              <div className="text-sm text-slate-400">{ item.name }<span className="ml-2 text-xs">{ item.info }</span></div>
            ))}
          </td>
        </tr>
      );
  }

  return (
    <div className="p-3">
      <table>
        <tbody>
        { details }
        </tbody>
      </table>
      { thumbs }
    </div>
  )
}


function NoSelection({ listSel, listCount }) {
  return (
    <div className="p-3">
      Showing { listCount } files and folders.
    </div>
  )
}


export default function DocumentPreview({ listSel, listCount }) {
  if (listSel.items.length == 0)
    return (
      <div className="ml-1">
        <NoSelection listSel={ listSel } listCount={ listCount }/>
      </div>
    )

  return (
    <div className="ml-1">
      <HasSelection listSel={ listSel } listCount={ listCount }/>
    </div>
  )
}