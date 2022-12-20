import { useState, useRef, useEffect } from 'react';
import { getColor } from '../shared/colors';
import { ModeTab, renderTableStructure, renderTextStructure } from '../shared/widgets';


function isElementVisible(el) {
  // taken from https://stackoverflow.com/a/41754707/19223886
  var holder = el.parentElement.parentElement;
  const { top, bottom, height } = el.getBoundingClientRect();
  const holderRect = holder.getBoundingClientRect();

  return top <= holderRect.top
    ? holderRect.top - top <= height
    : bottom - holderRect.bottom <= height
}


function TextStructure({ text, pageNum, textBoxHL, setTextBoxHL }) {

  const refHL = useRef();

  function highlightTextBox(e) {
    setTextBoxHL(parseInt(e.currentTarget.getAttribute('data-textbox-index')));
  }
  function resetHighlightTextBox(e) {
    setTextBoxHL(-1);
  }

  useEffect(() => {
    if (refHL.current) {
      if (!isElementVisible(refHL.current))
        refHL.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [ textBoxHL ]);

  return (
    <div>
    { text.map((p, idx) => renderTextStructure(p.content, idx, textBoxHL, highlightTextBox, resetHighlightTextBox, refHL)) }
    </div>
  )
}


function TablesStructure({ tables, pageNum, tableBoxHL, setTableBoxHL }) {

  const refHL = useRef();

  function highlightTableBox(e) {
    setTableBoxHL(parseInt(e.currentTarget.getAttribute('data-tablebox-index')));
  }
  function resetHighlightTableBox(e) {
    setTableBoxHL(-1);
  }

  useEffect(() => {
    if (refHL.current) {
      if (!isElementVisible(refHL.current))
        refHL.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [ tableBoxHL ]);

  let rendered = [];
  for (var i = 0; i < tables.length; i++) {
    rendered.push(renderTableStructure(tables[i].content, i, tableBoxHL, highlightTableBox, resetHighlightTableBox, refHL));
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


export default function DocumentStructure({ pageNum, mode, setMode, tables, setTables, setTableBoxes, tableBoxHL, setTableBoxHL, text, setText, setTextBoxes, textBoxHL, setTextBoxHL }) {

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
      <ModeTab modes={{ 'text': 'Text', 'table': 'Tables' }} mode={ mode } setMode={ setMode }/>
      <div className="absolute bottom-0 top-10 left-2 right-0 border border-slate-100 overflow-auto p-2 text-xs">
        { mode == 'table'?(<TablesStructure tables={ tables } pageNum={ pageNum } tableBoxHL={ tableBoxHL } setTableBoxHL={ setTableBoxHL }/>):(null) }
        { mode == 'text'?(<TextStructure text={ text } pageNum={ pageNum } textBoxHL={ textBoxHL } setTextBoxHL={ setTextBoxHL }/>):(null) }
     </div>
    </div>
  )
}
