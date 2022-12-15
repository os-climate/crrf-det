import { useState, useEffect } from 'react';
import { getColor } from '../shared/colors';


function TextStructure({ text, pageNum, setTextBoxHL }) {

  function highlightTextBox(e) {
    setTextBoxHL(parseInt(e.currentTarget.getAttribute('data-textbox-index')));
  }
  function resetHighlightTextBox(e) {
    setTextBoxHL(-1);
  }

  return (
    <div>
    { text.map((p, idx) => (
      <p key={idx} className="text-sm mb-2 py-1 px-2 border rounded italic" data-textbox-index={idx} style={{ backgroundColor: getColor(idx, 0.0625), borderColor: getColor(idx, 0.1625) }} onMouseEnter={highlightTextBox} onMouseLeave={resetHighlightTextBox}>{p.content}</p>
      ))}
    </div>
  )
}


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
      rendered_body.push(<tr className="odd:bg-white" key={ i + '_' + j }>{rendered_row}</tr>);
    }
    rendered.push(<table key={ i } className="table-fixed mb-2 border" data-tablebox-index={i} style={{backgroundColor: getColor(i, 0.0625), borderColor: getColor(i, 0.1625) }} onMouseEnter={highlightTableBox} onMouseLeave={resetHighlightTableBox}><thead><tr style={{ backgroundColor: getColor(i, 0.1625) }}>{rendered_head}</tr></thead><tbody>{rendered_body}</tbody></table>);
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


function ModeTab({ mode, setMode }) {
  let modes = {
    'text': 'Text',
    'table': 'Tables',
  }

  function switchMode(e) {
    setMode(e.currentTarget.getAttribute('data-mode'));
  }

  return (
    <div className="h-9 bg-slate-100 items-center justify-center inline-flex w-full rounded-t-md">
      { Object.entries(modes).map(([key, value]) => (
        <button key={ key } className={`btn normal-case min-h-fit h-8 rounded m-0.5 ${ mode === key?('bg-slate-600 text-white font-bold'):('bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200')}`} onClick={ switchMode } data-mode={ key }>{ value }</button>
        ))}
    </div>
  )
}


export default function DocumentStructure({ pageNum, setTableBoxes, setTableBoxHL, setTextBoxes, setTextBoxHL }) {

  const [text, setText] = useState([]);
  const [tables, setTables] = useState([]);
  const [mode, setMode] = useState('text');

  const pageChange = async () => {
    const res = await fetch('/page.' + pageNum + '.json');
    const c = await res.json();
    var tables_ = [];
    var text_ = [];
    var tableBoxes_ = [];
    var textBoxes_ = [];
    for (var i = 0; i < c.content.length; i++) {
      var box = c.content[i].box;
      var box_ = [box[0] / c.height, box[1] / c.width, box[2] / c.height, box[3] / c.width];
      if (c.content[i].type === 'text') {
        text_.push(c.content[i]);
        textBoxes_.push(box_);
      } else if (c.content[i].type === 'table') {
        tables_.push(c.content[i]);
        tableBoxes_.push(box_);
      }
    }
    setText(text_);
    setTextBoxes(textBoxes_);
    setTables(tables_);
    setTableBoxes(tableBoxes_);
  };

  useEffect(() => {
    pageChange();
  }, [ pageNum ]);

  return (
    <div className="ml-2">
      <ModeTab mode={ mode } setMode={ setMode }/>
      <div className="absolute bottom-0 top-9 left-2 right-0 border border-slate-100 overflow-auto p-2 text-xs">
        { mode == 'table'?(<TablesStructure tables={ tables } pageNum={ pageNum } setTableBoxHL={ setTableBoxHL }/>):(null) }
        { mode == 'text'?(<TextStructure text={ text } pageNum={ pageNum } setTextBoxHL={ setTextBoxHL }/>):(null) }
     </div>
    </div>
  )
}
