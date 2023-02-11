import { useState, useRef, forwardRef, useImperativeHandle, useEffect, memo } from 'react';
import { useMeasure } from "react-use";
import useVirtual from 'react-cool-virtual';
import toast from 'react-hot-toast';
import { getColor } from '../shared/colors';
import { config } from '../shared/config';
import { auth } from '../shared/auth';


const MemoImage = memo(({ isScrolling, width, height, url, displayPageNum, pagecontent, ...rest }) => {
  var heightNP = height - 10;

  function highlightTextBox(e) {
    if (pagecontent.mode === 'table')
      pagecontent.set_mode('text');
    var idx = parseInt(e.currentTarget.getAttribute('data-textbox-index'));
    pagecontent.set_texthl(idx);
  }
  function resetHighlightTextBox(e) {
    pagecontent.set_texthl(-1);
  }
  function copyTextBox(e) {
    var idx = parseInt(e.currentTarget.getAttribute('data-textbox-index'));
    navigator.clipboard.writeText(text[idx].content);
    toast.success('Text copied to clipboard', {
      position: 'bottom-right'
    });
  }
  function highlightTableBox(e) {
    if (pagecontent.mode === 'text')
      pagecontent.set_mode('table');
    var idx = parseInt(e.currentTarget.getAttribute('data-tablebox-index'));
    pagecontent.set_tablehl(idx);
  }
  function resetHighlightTableBox(e) {
    pagecontent.set_tablehl(-1);
  }
  function copyTableBox(e) {
    var idx = parseInt(e.currentTarget.getAttribute('data-tablebox-index'));
    var text = '';
    var table_ = tables[idx].content;
    var colLen = {};
    for (var i = 0; i < table_.length; i++) {
      for (var j = 0; j < table_[i].length; j++) {
        if (!colLen[j] ||
          colLen[j] < table_[i][j].length)
          colLen[j] = table_[i][j].length;
      }
    }
    for (var i = 0; i < table_.length; i++) {
      for (var j = 0; j < table_[i].length; j++) {
        text += '"' + table_[i][j] + '"';
        if (j != table_[i].length - 1)
          text += ',';
      }
      text += '\n';
    }
    navigator.clipboard.writeText(text);
    toast.success('Table copied to clipboard', {
      position: 'bottom-right'
    });
  }

  return (
    <div {...rest} style={{ width: `${width}`, height: `${heightNP}px` }} className="mb-[10px] shadow-md relative">
      <img src={url} style={{ width: `${width}`, height: `${heightNP}px` }}/>
      { !isScrolling && displayPageNum == pagecontent.page && (pagecontent.tablebox.length > 0 || pagecontent.textbox.length > 0) ? (
        <svg width={width - 2} height={heightNP} className="absolute left-0 top-0">
        { pagecontent.tablebox.map((box, idx) => (
          <rect key={ url + '_ta' + idx } className="cursor-copy" x={ box[1] * width } y={ box[0] * heightNP } width={ (box[3] - box[1]) * width } height={ (box[2] - box[0]) * heightNP } style={{ opacity: idx === pagecontent.tablehl?1.0:0.25, fill: getColor(idx, 0.25), strokeWidth: 1, stroke: getColor(idx, 0.65)}} onMouseEnter={ highlightTableBox } onMouseLeave={ resetHighlightTableBox } onClick={ copyTableBox } data-tablebox-index={ idx }/>
        ))}
        { pagecontent.textbox.map((box, idx) => (
          <rect key={ url + '_te' + idx } className="cursor-copy" x={ box[1] * width } y={ box[0] * heightNP } width={ (box[3] - box[1]) * width } height={ (box[2] - box[0]) * heightNP } style={{ opacity: idx === pagecontent.texthl?1.0:0.25, fill: getColor(idx, 0.25), strokeWidth: 1, stroke: getColor(idx, 0.65)}} onMouseEnter={ highlightTextBox } onMouseLeave={ resetHighlightTextBox } onClick={ copyTextBox } data-textbox-index={ idx }/>
        ))}
        </svg>
      ):(null)}
    </div>
  )
});


const PageImages = forwardRef(({ doc, path, file, width, height, pagecontent, filterstatus }, ref) => {

  var page = doc.pages[0];
  var pageHeight = parseInt(page.h / page.w * width) + 10;

  const onScroll = ({
    overscanStartIndex, // (number) The index of the first overscan item
    overscanStopIndex, // (number) The index of the last overscan item
    visibleStartIndex, // (number) The index of the first visible item
    visibleStopIndex, // (number) The index of the last visible item
    scrollOffset, // (number) The scroll offset from top/left, depending on the `horizontal` option
    scrollForward, // (boolean) The scroll direction of up/down or left/right, depending on the `horizontal` option
    userScroll, // (boolean) Tells you the scrolling is through the user or not
  }) => {
    var viewportTopDiff = (pageHeight - height) / 2;
    var targetPageNum = Math.max(1, Math.round((scrollOffset - viewportTopDiff) / pageHeight) + 1);
    pagecontent.set_page(targetPageNum);
  };

  var count = doc.pages.length;
  if (filterstatus.result)
    count = filterstatus.result.length;

  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: count,
    itemSize: pageHeight,
    overscanCount: 1,
    useIsScrolling: true,
    resetScroll: true,
    onScroll: onScroll
  });

  useImperativeHandle(ref, () => ({
    scrollToItem(params) {
      scrollToItem(params);
    },
  }))

  function buildPageImageUrl(index) {
    let apiPath = '/docs/';
    if (path &&
      path !== '|')
      apiPath += path;
    apiPath += '/' + file;
    apiPath += '/preview.' + index + '.jpg?s=' + doc.signature;
    return config.endpoint_base + apiPath;
  }

  var imageStyles = {};
  if (filterstatus.working)
    imageStyles.opacity = 0.2;

  return (
    <div ref={outerRef} className="absolute left-0 top-0 right-0 bottom-0 overflow-auto">
      <div ref={innerRef} style={ imageStyles }>
        { items.map(({index, size, start, isScrolling}) => (
          <MemoImage key={ index } isScrolling={ isScrolling } width={ width } height={ size } url={ buildPageImageUrl((filterstatus.result && filterstatus.result.length > index)?filterstatus.result[index].page:(index + 1)) } displayPageNum={ index + 1 } pagecontent={ pagecontent }/>
        ))}
      </div>
    </div>
  )

})


function PageNavigation({ doc, pagecontent, filterstatus, pageCount, pageImages }) {

  function pageClick(e) {
    var page = parseInt(e.currentTarget.getAttribute('data-page-index'));
    pageImages.current.scrollToItem({ index: page - 1, align: page == 1?'auto':'center' });
  }
  function pageLeft(e) {
    if (pagecontent.page >= 2) {
      pageImages.current.scrollToItem({ index: pagecontent.page - 2, align: 'start' });
      pagecontent.set_page(pagecontent.page - 1);
    }
  }
  function pageRight(e) {
    if (pagecontent.page <= pageCount - 1) {
      pageImages.current.scrollToItem({ index: pagecontent.page, align: 'start' });
      pagecontent.set_page(pagecontent.page + 1);
    }
  }
  function clearFilter(e) {
    filterstatus.set_result(null);
    pagecontent.set_page(1);
  }

  let dropContent = [];
  if (filterstatus.result) {
    filterstatus.result.map((page, i) => {
      dropContent.push(<li className="block" key={page.page}><a className="text-center block border border-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500" onClick={ pageClick } data-page-index={ i + 1 }>{page.page}</a></li>);
    });
  }
  else if (doc.pages) {
    for (var i = 0; i < doc.pages.length; i++)
      dropContent.push(<li className="block" key={i}><a className="text-center block border border-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500" onClick={ pageClick } data-page-index={ i + 1 }>{i + 1}</a></li>);
  }

  return (
    <div>
      <button className="btn px-2 min-h-fit h-9 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent" onClick={ pageLeft } disabled={ pagecontent.page < 2 }>
        <i className="icon-left-dir"/>
      </button>
      <div className="dropdown">
        <label tabIndex="0" className="btn normal-case min-h-fit h-9 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200">Page { pagecontent.page + (filterstatus.result ? (' (' + filterstatus.result[pagecontent.page - 1].page + ')'):'') } of { filterstatus.result ? filterstatus.result.length + ' matched' : pageCount }</label>
        <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded max-h-96 overflow-auto">
          <li className="block px-3 py-1 whitespace-nowrap text-xs uppercase font-bold text-slate-400">Go to Page</li>
          { dropContent }
        </ul>
      </div>
      <button className="btn px-2 min-h-fit h-9 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent" onClick={ pageRight } disabled={ pagecontent.page > pageCount - 1 }>
        <i className="icon-right-dir"/>
      </button>
      { filterstatus.result ? (
        <button className="btn btn-warning normal-case px-2 min-h-fit h-9 ml-3" onClick={ clearFilter }>Filter matched { filterstatus.result.length } of { pageCount } pages <i className="icon-cancel-circled ml-2"></i></button>
      ):(null)}
    </div>
  )
}


export default function DocumentView({ path, file, pagecontent, filterstatus }) {

  const [ doc, setDoc ] = useState({});

  useEffect(() => {
    auth.get({base: '/docs', folder: path, rest: '/' + file}, {}, ( data ) => {
      if (data.status == 'ok') {
        setDoc(data.data);
        pagecontent.set_page(1);
      } else {
        console.warn('unhandled data', data);
      }
    });
  }, [path, file]);

  const [ scrollToItem, setScrollToItem ] = useState(null);
  const [ ref, { x, y, width, height, top, right, bottom, left } ] = useMeasure();
  const pageImagesRef = useRef();

  return (
    <div>
      <div className="absolute left-0 top-0 right-0 h-10 bg-slate-100 rounded-t-md items-center inline-flex">
        <PageNavigation doc={ doc } pagecontent={ pagecontent } filterstatus={ filterstatus } pageCount={ doc.pages ? doc.pages.length : 0 } pageImages={ pageImagesRef }/>
      </div>
      <div ref={ ref } className="absolute border border-slate-100 left-0 top-10 right-0 bottom-0">
      { (width > 0 && doc.pages) ? (
        <PageImages doc={ doc } path={ path } file={ file } width={ width } height={ height } pagecontent={ pagecontent } filterstatus={ filterstatus } ref={ pageImagesRef }/>
      ):(null) }
      </div>
    </div>
  )
}
