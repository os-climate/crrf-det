import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

import DocumentPage from './document/page';
import ProjectPage from './project/page';

import { config } from './shared/config';
import { auth } from './shared/user';


export default function PageHost() {
  /*

  'listview' logic is used under project/new and document/list_view.
  Putting it under PageHost makes it possible to share one piece of state
  in the two components.

   */
  const [ sel, set_sel ] = useState({
    anchor:   -1,
    indices:  [],
    items:    [],
  });
  const [ items, set_items ] = useState([]);
  const [ loaded, set_loaded ] = useState(false);
  const [ working, set_working ] = useState(false);
  const items_ref = useRef([]);

  useEffect(() => {
    items_ref.current = items;
  }, [ items ]);

  function sort_compare(a, b) {
    if (a.type != b.type) {
      if (a.type == 'folder')
        return -1;
      if (b.type == 'folder')
        return 1;
      return 0;
    }
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

  function refresh(path) {
    set_working(true);
    if (window.listview_refresh_timer) {
      clearTimeout(window.listview_refresh_timer);
      window.listview_refresh_timer = null;
    }
    var old_item_count = items.length;
    auth.get({base: '/files', folder: path}, {}, ( data ) => {
      set_working(false);
      if (!data)
        return;
      if (data.status == 'ok') {
        data.data.items.sort(sort_compare);
        set_loaded(true);
        if (JSON.stringify(data.data.items) == JSON.stringify(items))
          return;
        window.image_signature = data.data.signature;
        set_items(data.data.items);
        // clear selection if item count becomes smaller
        if (data.data.items.length < old_item_count)
          set_sel({ anchor: -1, indices: [], items: [] });
        // check 'status', auto refresh if found
        for (const f of data.data.items) {
          if (f.info &&
            f.info.status) {
            window.listview_refresh_timer = setTimeout(() => {
              refresh(path);
            }, 10000);
            break;
          }
        }
      } else {
        console.warn('unhandled data', data);
      }
    });
  }

  function try_select(items_sel) {
    /*
    Due to a "static closure" issue of Javascript/react, a
    `useRef` must be used for current value access.
    Ref: https://stackoverflow.com/a/66435915/108574
     */
    var items = items_ref.current;
    var new_sel = {
      anchor:   -1,
      indices:  [],
      items:    [],
    };
    for (var i = 0; i < items_sel.length; i++) {
      for (var j = 0; j < items.length; j++) {
        if (items_sel[i].type == items[j].type &&
          items_sel[i].name == items[j].name) {
          if (new_sel.anchor == -1)
            new_sel.anchor = j;
          new_sel.indices.push(j);
          new_sel.items.push(items[j]);
        }
      }
    }
    set_sel(new_sel);
    if (new_sel.items.length == items_sel.length) {
      // selection applied
      window.last_try_select_items_digest = undefined;
      window.last_try_select_items_trial = undefined;
      return;
    }
    // otherwise, try again later
    if (working) {
      setTimeout(() => try_select(items_sel), 500);
      return;
    }
    if (!window.last_try_select_items_digest ||
      !window.last_try_select_items_trial) {
      window.last_try_select_items_digest = JSON.stringify(items);
      window.last_try_select_items_trial = 1;
      setTimeout(() => try_select(items_sel), 500);
      return;
    }
    if (window.last_try_select_items_digest != JSON.stringify(items)) {
      window.last_try_select_items_digest = undefined;
      window.last_try_select_items_trial = undefined;
      setTimeout(() => try_select(items_sel), 500);
      return;
    }
    if (window.last_try_select_items_digest == JSON.stringify(items)) {
      window.last_try_select_items_trial++;
      if (window.last_try_select_items_trial < 10) {
        setTimeout(() => try_select(items_sel), 500);
        return;
      }
    }
  }

  const listview = { items, set_items, sel, set_sel, loaded, set_loaded, refresh, try_select };

  return (
    <div className="fixed h-screen left-16 top-0 right-0">
      <Routes>
        <Route path='/documents' element={<DocumentPage listview={ listview } />}></Route>
        <Route path='/documents/:path' element={<DocumentPage listview={ listview } />}></Route>
        <Route path='/documents/:path/:file' element={<DocumentPage listview={ listview } />}></Route>
        <Route path='/projects' element={<ProjectPage listview={ listview } />}></Route>
        <Route path='/projects/:name' element={<ProjectPage listview={ listview } />}></Route>
      </Routes>
    </div>
  )
}