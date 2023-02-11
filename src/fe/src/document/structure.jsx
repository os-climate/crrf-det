import { useState, useRef, useEffect } from 'react';
import { getColor } from '../shared/colors';
import { ModeTab, renderTableStructure, renderTextStructure } from '../shared/widgets';
import { config } from '../shared/config';
import { auth } from '../shared/auth';


function isElementVisible(el) {
  // taken from https://stackoverflow.com/a/41754707/19223886
  var holder = el.parentElement.parentElement;
  const { top, bottom, height } = el.getBoundingClientRect();
  const holderRect = holder.getBoundingClientRect();

  return top <= holderRect.top
    ? holderRect.top - top <= height
    : bottom - holderRect.bottom <= height
}


function TextStructure({ pagecontent }) {

  const refHL = useRef();

  function highlightTextBox(e) {
    pagecontent.set_texthl(parseInt(e.currentTarget.getAttribute('data-textbox-index')));
  }
  function resetHighlightTextBox(e) {
    pagecontent.set_texthl(-1);
  }

  useEffect(() => {
    if (refHL.current) {
      if (!isElementVisible(refHL.current))
        refHL.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [ pagecontent.texthl ]);

  return (
    <div>
    { pagecontent.text.map((p, idx) => renderTextStructure(p.content, idx, pagecontent.texthl, highlightTextBox, resetHighlightTextBox, refHL)) }
    </div>
  )
}


function TablesStructure({ pagecontent }) {

  const refHL = useRef();

  function highlightTableBox(e) {
    pagecontent.set_tablehl(parseInt(e.currentTarget.getAttribute('data-tablebox-index')));
  }
  function resetHighlightTableBox(e) {
    pagecontent.set_tablehl(-1);
  }

  useEffect(() => {
    if (refHL.current) {
      if (!isElementVisible(refHL.current))
        refHL.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [ pagecontent.tablehl ]);

  let rendered = [];
  for (var i = 0; i < pagecontent.table.length; i++) {
    rendered.push(renderTableStructure(pagecontent.table[i].content, i, pagecontent.tablehl, highlightTableBox, resetHighlightTableBox, refHL));
  }

  if (rendered.length === 0) {
    rendered.push(<div key="none" className="italic text-slate-500 text-base text-center mt-2">No tables on page {pagecontent.page}</div>)
  }

  return (
    <div>
    { rendered }
    </div>
  )
}


export default function DocumentStructure({ path, file, pagecontent, filterstatus }) {

  const pageChange = async () => {
    var page = pagecontent.page;
    if (filterstatus.result)
      page = filterstatus.result[page - 1].page;
    auth.get({base: '/docs', folder: path, rest: '/' + file + '/page/' + page}, {}, ( data ) => {
      var c = data;
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
      pagecontent.set_text(text_);
      pagecontent.set_textbox(textBoxes_);
      pagecontent.set_table(tables_);
      pagecontent.set_tablebox(tableBoxes_);
    });

  };

  useEffect(() => {
    pageChange();
  }, [ pagecontent.page, filterstatus.result ]);

  return (
    <div className="ml-2">
      <ModeTab modes={{ 'text': 'Text', 'table': 'Tables' }} mode={ pagecontent.mode } setMode={ pagecontent.set_mode }/>
      <div className="absolute bottom-0 top-10 left-2 right-0 border border-slate-100 overflow-auto p-2 text-xs">
        { pagecontent.mode == 'table'?(<TablesStructure pagecontent={ pagecontent }/>):(null) }
        { pagecontent.mode == 'text'?(<TextStructure pagecontent={ pagecontent }/>):(null) }
     </div>
    </div>
  )
}
