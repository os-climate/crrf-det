import { useState, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { useMeasure } from "react-use";
import useVirtual from 'react-cool-virtual';


var pages = [
  { url: '/2021-tesla-impact-report.preview.1.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.2.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.3.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.4.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.5.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.6.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.7.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.8.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.9.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.10.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.11.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.12.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.13.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.14.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.15.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.16.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.17.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.18.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.19.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.20.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.21.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.22.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.23.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.24.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.25.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.26.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.27.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.28.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.29.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.30.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.31.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.32.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.33.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.34.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.35.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.36.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.37.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.38.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.39.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.40.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.41.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.42.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.43.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.44.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.45.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.46.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.47.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.48.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.49.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.50.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.51.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.52.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.53.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.54.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.55.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.56.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.57.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.58.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.59.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.60.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.61.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.62.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.63.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.64.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.65.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.66.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.67.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.68.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.69.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.70.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.71.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.72.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.73.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.74.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.75.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.76.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.77.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.78.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.79.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.80.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.81.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.82.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.83.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.84.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.85.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.86.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.87.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.88.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.89.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.90.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.91.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.92.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.93.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.94.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.95.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.96.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.97.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.98.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.99.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.100.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.101.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.102.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.103.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.104.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.105.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.106.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.107.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.108.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.109.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.110.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.111.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.112.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.113.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.114.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.115.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.116.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.117.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.118.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.119.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.120.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.121.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.122.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.123.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.124.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.125.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.126.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.127.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.128.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.129.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.130.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.131.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.132.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.133.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.134.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.135.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.136.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.137.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.138.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.139.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.140.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.141.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.142.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.143.jpg', width: 1583, height: 890 },
  { url: '/2021-tesla-impact-report.preview.144.jpg', width: 1583, height: 890 },
];


const COLORS_TRANSPARENT = [
  'rgba(31, 119, 180, 0.25)',
  'rgba(255, 127, 14, 0.25)',
  'rgba(44, 160, 44, 0.25)',
  'rgba(214, 39, 40, 0.25)',
  'rgba(148, 103, 189, 0.25)',
  'rgba(140, 86, 75, 0.25)',
  'rgba(227, 119, 194, 0.25)',
  'rgba(127, 127, 127, 0.25)',
  'rgba(188, 189, 34, 0.25)',
  'rgba(23, 190, 207, 0.25)',
];
const COLORS = [
  'rgba(31, 119, 180, 0.95)',
  'rgba(255, 127, 14, 0.95)',
  'rgba(44, 160, 44, 0.95)',
  'rgba(214, 39, 40, 0.95)',
  'rgba(148, 103, 189, 0.95)',
  'rgba(140, 86, 75, 0.95)',
  'rgba(227, 119, 194, 0.95)',
  'rgba(127, 127, 127, 0.95)',
  'rgba(188, 189, 34, 0.95)',
  'rgba(23, 190, 207, 0.95)',
];


const MemoImage = memo(({ width, height, url, displayPageNum, pageNum, tableBoxes, tableBoxHL, ...rest }) => {
  var heightNP = height - 10;

  return (
    <div {...rest} style={{ width: `${width}`, height: `${heightNP}px` }} className="mb-[10px] shadow-md relative">
      <img src={url} style={{ width: `${width}`, height: `${heightNP}px` }}/>
      { displayPageNum == pageNum && tableBoxes.length > 0 ? (
        <svg width={width} height={heightNP} className="absolute left-0 top-0">
        { tableBoxes.map((tableBox, idx) => (
          <rect key={ url + '_' + idx } x={ tableBox[1] * width } y={ tableBox[0] * heightNP } width={ (tableBox[3] - tableBox[1]) * width } height={ (tableBox[2] - tableBox[0]) * heightNP } style={{ opacity: idx === tableBoxHL?1.0:0.25, fill: COLORS_TRANSPARENT[idx % COLORS.length], strokeWidth: 1, stroke: COLORS[idx % COLORS.length]}} />
        ))}
        </svg>
      ):(null)}
    </div>
  )
});


const PageImages = forwardRef(({ width, pageNum, setPageNum, tableBoxes, tableBoxHL }, ref) => {

  var page = pages[0];
  var pageHeight = parseInt(page.height / page.width * width) + 10;

  const onScroll = ({
    overscanStartIndex, // (number) The index of the first overscan item
    overscanStopIndex, // (number) The index of the last overscan item
    visibleStartIndex, // (number) The index of the first visible item
    visibleStopIndex, // (number) The index of the last visible item
    scrollOffset, // (number) The scroll offset from top/left, depending on the `horizontal` option
    scrollForward, // (boolean) The scroll direction of up/down or left/right, depending on the `horizontal` option
    userScroll, // (boolean) Tells you the scrolling is through the user or not
  }) => {
    var index = visibleStartIndex;
    var visCount = visibleStopIndex - visibleStartIndex;
    if (visCount >= 2)
      index = visibleStartIndex + parseInt(visCount / 2);
    setPageNum(index + 1);
  };

  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: pages.length,
    itemSize: pageHeight,
    overscanCount: 1,
    onScroll: onScroll
  });

  useImperativeHandle(ref, () => ({
    scrollToItem(params) {
      scrollToItem(params);
    },
  }))

  return (
    <div ref={outerRef} className="absolute border border-slate-100 left-0 top-9 right-0 bottom-0 overflow-auto">
      <div ref={innerRef}>
        { items.map(({index, size, start}) => (
          <MemoImage key={ index } width={ width } height={ size } url={ pages[index].url } displayPageNum={ index + 1 } pageNum={ pageNum } tableBoxes={ tableBoxes } tableBoxHL={ tableBoxHL }/>
        ))}
      </div>
    </div>
  )

})


function PageNavigation({ pageNum, setPageNum, pageCount, pageImages }) {

  function pageClick(e) {
    var page = parseInt(e.currentTarget.innerHTML);
    pageImages.current.scrollToItem({ index: page - 1, align: page == 1?'auto':'center' });
  }
  function pageLeft(e) {
    if (pageNum >= 2) {
      pageImages.current.scrollToItem({ index: pageNum - 2, align: 'start' });
      setPageNum(pageNum - 1);
    }
  }
  function pageRight(e) {
    if (pageNum <= pageCount - 1) {
      pageImages.current.scrollToItem({ index: pageNum, align: 'start' });
      setPageNum(pageNum + 1);
    }
  }

  let dropContent = [];
  for (var i = 0; i < pages.length; i++)
    dropContent.push(<li className="block" key={i}><a className="text-center block border border-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500" onClick={ pageClick }>{i + 1}</a></li>);

  return (
    <div>
      <button className="btn px-2 min-h-fit h-8 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent" onClick={ pageLeft } disabled={ pageNum < 2 }>
        <i className="icon-left-dir"/>
      </button>
      <div className="dropdown">
        <label tabIndex="0" className="btn normal-case min-h-fit h-8 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200">Page { pageNum } of { pageCount }</label>
        <ul tabIndex="0" className="dropdown-content block menu menu-compact shadow-md border border-slate-200 bg-base-100 rounded max-h-96 overflow-auto">
          <li className="block px-3 py-1 whitespace-nowrap text-xs uppercase font-bold text-slate-400">Go to Page</li>
          { dropContent }
        </ul>
      </div>
      <button className="btn px-2 min-h-fit h-8 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 disabled:bg-transparent disabled:hover:bg-transparent" onClick={ pageRight } disabled={ pageNum > pageCount - 1 }>
        <i className="icon-right-dir"/>
      </button>
    </div>
  )
}


export default function DocumentView({ path, file, pageNum, setPageNum, tableBoxes, tableBoxHL }) {

  const [ scrollToItem, setScrollToItem ] = useState(null);
  const [ ref, { x, y, width, height, top, right, bottom, left } ] = useMeasure();
  const pageImagesRef = useRef();

  return (
    <div>
      <div ref={ ref } className="absolute left-0 top-0 right-0 h-9 bg-slate-100 rounded-t-md items-center inline-flex">
        <PageNavigation pageNum={ pageNum } setPageNum={ setPageNum } pageCount={ pages.length } pageImages={ pageImagesRef }/>
      </div>
      { width > 0 ? (
        <PageImages width={ width } pageNum={ pageNum } setPageNum={ setPageNum } tableBoxes={ tableBoxes } ref={ pageImagesRef } tableBoxHL={ tableBoxHL }/>
      ):(null) }
    </div>
  )
}
