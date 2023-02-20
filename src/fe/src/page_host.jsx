import { useState } from 'react';
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
    if (window.listview_refresh_timer) {
      clearTimeout(window.listview_refresh_timer);
      window.listview_refresh_timer = null;
    }
    var old_item_count = items.length;
    auth.get({base: '/files', folder: path}, {}, ( data ) => {
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

  const listview = { items, set_items, sel, set_sel, loaded, set_loaded, refresh };

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