import { useState, useEffect } from 'react';


function TablesStructure({ tables, pageNum, setTableBoxHL }) {

  function highlightTableBox(e) {
    setTableBoxHL(parseInt(e.currentTarget.getAttribute('data-tablebox-index')));
  }
  function resetHighlightTableBox(e) {
    setTableBoxHL(-1);
  }

  let rendered = [];
  for (var i = 0; i < tables.length; i++) {
    var table = tables[i].content;
    var rendered_head = [];
    var rendered_body = []
    for (var k = 0; k < table[0].length; k++) {
      var col = table[0][k];
      rendered_head.push(<th key={ i + '_0_' + k }>{col}</th>);
    }
    for (var j = 1; j < table.length; j++) {
      var row = table[j];
      var rendered_row = [];
      for (var k = 0; k < row.length; k++) {
        var col = row[k];
        rendered_row.push(<td key={ i + '_' + j + '_' + k } className="px-2 py-1">{col}</td>);
      }
      rendered_body.push(<tr key={ i + '_' + j }>{rendered_row}</tr>);
    }
    rendered.push(<table key={ i } className="table-fixed mb-2 border table-zebra" data-tablebox-index={i} onMouseEnter={highlightTableBox} onMouseLeave={resetHighlightTableBox}><thead><tr className="bg-slate-100">{rendered_head}</tr></thead><tbody>{rendered_body}</tbody></table>);
  }

  if (rendered.length === 0) {
    rendered.push(<div key="none" className="italic text-slate-500 text-base text-center mt-2">No tables on page {pageNum}</div>)
  }

  return (
    <div>
    { rendered }
    </div>
  )
}


export default function DocumentStructure({ pageNum, setTableBoxes, setTableBoxHL }) {

  const [text, setText] = useState([]);
  const [tables, setTables] = useState([]);

  const pageChange = async () => {
    const res = await fetch('/page.' + pageNum + '.json');
    const c = await res.json();
    var tables_ = [];
    var text_ = [];
    var tableBoxes_ = [];
    for (var i = 0; i < c.content.length; i++) {
      if (c.content[i].type === 'text')
        text_.push(c.content[i]);
      else if (c.content[i].type === 'table') {
        tables_.push(c.content[i]);
        var box = c.content[i].box;
        tableBoxes_.push([box[0] / c.height, box[1] / c.width, box[2] / c.height, box[3] / c.width]);
      }
    }
    setText(text_);
    setTables(tables_);
    setTableBoxes(tableBoxes_);
  };

  useEffect(() => {
    pageChange();
  }, [ pageNum ]);

  return (
    <div className="ml-2">
      <div className="h-9 bg-slate-100 items-center justify-center inline-flex w-full rounded-t-md">
        <button className="btn normal-case min-h-fit h-8 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 m-0.5">Text</button>
        <button className="btn normal-case min-h-fit h-8 bg-slate-600 text-white font-bold rounded m-0.5">Tables</button>
      </div>
      <div className="absolute bottom-0 top-9 left-2 right-0 border border-slate-100 overflow-auto px-2 py-1 text-xs">
        <TablesStructure tables={ tables } pageNum={ pageNum } setTableBoxHL={ setTableBoxHL }/>
     </div>
    </div>
  )
}