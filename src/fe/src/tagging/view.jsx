import { useState, useEffect } from 'react';
import useVirtual from 'react-cool-virtual';
import { auth } from '../shared/user';
import { config } from '../shared/config';
import { getColor } from '../shared/colors';


const itemsLoaded = [];


export default function TaggingView({ project }) {

  const [ tasks, setTasks ] = useState([]);

  const loadTasks = async ({ loadIndex }) => {
    itemsLoaded[loadIndex] = true;
    try {
      auth.get({base: '/projects/get_tagging_task/' + project}, {}, (data) => {
        setTasks([...tasks, ...data.data]);
      });
    } catch (err) {
      itemsLoaded[loadIndex] = false;
      loadData({ loadIndex });
    }
  };

  const { outerRef, innerRef, items } = useVirtual({
    itemCount: 500,
    itemSize: 400,
    loadMoreCount: 5,
    isItemLoaded: (loadIndex) => itemsLoaded[loadIndex],
    loadMore: (e) => loadTasks(e),
  });

  function bringImageIntoView(e) {
    var elem = document.getElementById('carousel-container-' + e.target.getAttribute('data-image-idx'));
    if (elem)
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function setLabel(e) {
    var index = parseInt(e.target.getAttribute('data-index'));
    var label = e.target.getAttribute('data-label');
    var tasks_ = [ ...tasks ];
    tasks_[index].selectedLabel = label;
    setTasks(tasks_);
    auth.post({base: '/projects/set_label/' + project + '/' + tasks[index].index}, {
      body: JSON.stringify({label: label})
    }, (data) => {
    });
  }

  return (<div className="absolute px-2 pt-2 left-0 right-0 bottom-0 overflow-auto" style={{ top: '51px' }} ref={ outerRef }>
    <div ref={ innerRef }>
      <div className="mb-8 italic text-slate-500">
        <p className="mb-2">Welcome to annotation!</p>
        <p>Below are a series of images cropped from reports. Please answer whether an image answers to the Key Performance Indicators (KPIs) by pressing the buttons below.</p>
      </div>
      { items.map(({ index, measureRef }) => (
        <div className="mb-10 border border-slate-200 rounded-lg shadow-slate-200 shadow-sm" ref={ measureRef } key={ 'items.' + index }>
          { tasks[index]?(
            <div className="relative">
              { tasks[index].crop_sizes.length > 1 ? (<div className={`absolute top-0 right-0 opacity-70 z-10 ${ tasks[index].selectedLabel?'item-is-labeled':''}`}>
                { tasks[index].crop_sizes.map((dims, idx) => (
                    <button className="btn btn-sm mt-1 mr-1 text-black hover:text-black hover:bg-white rounded-none bg-teal-300" key={ 'cbtn' + index + '.' + idx } onClick={ bringImageIntoView } data-image-idx={ index + '.' + idx }>{ idx + 1 }</button>
                  )) }
              </div>):(null) }
              <div className={`w-full carousel rounded-box ${ tasks[index].selectedLabel?'item-is-labeled':''}`}>
                { tasks[index].crop_sizes.map((dims, idx) => (
                  <div className="carousel-item w-full py-3" key={ 'items.' + index + 'c.' + idx } id={ 'carousel-container-' + index + '.' + idx }>
                    <img src={config.endpoint_base + '/projects/get_tagging_image/' + project + '/' + (tasks[index].crop_sizes.length == 1?tasks[index].index:(tasks[index].index + '_' + (idx + 1)))} className="w-full"/>
                  </div>)) }
              </div>
              <div>
                { tasks[index].labels.map((labels, lsIdx) => (
                  <div key={ 'items.' + index + '.ls' + lsIdx }>
                  { labels.map((label, lIdx) => (
                      <button className={`mx-2 mb-2 btn btn-outline btn-ghost ${ (tasks[index].selectedLabel && tasks[index].selectedLabel != label)?'item-is-labeled':''}`} style={ tasks[index].selectedLabel == label ? { backgroundColor: getColor(index + lsIdx + lIdx, 1), color: 'white' }:{} } key={ 'items.' + index + '.ls' + lsIdx + '.l' + lIdx } onClick={ setLabel } data-label={ label } data-index={ index }>{ label }</button>
                    ))}
                    <button className={`mx-2 mb-2 btn btn-outline btn-ghost ${ (tasks[index].selectedLabel && tasks[index].selectedLabel != 'None_of_Above')?'item-is-labeled':''} ${ (tasks[index].selectedLabel && tasks[index].selectedLabel == 'None_of_Above')?'bg-black text-white':''}`} onClick={ setLabel } data-label="None_of_Above" data-index={ index }>None of Above</button>
                  </div>)) }
              </div>
            </div>
          ):(null)}
        </div>
      ))}
    </div>
  </div>)
}
