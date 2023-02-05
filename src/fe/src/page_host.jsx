import { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

import DocumentPage from './document/page';
import ProjectPage from './project/page';

import { config } from './shared/config';
import { auth } from './shared/auth';


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

  function refresh(path) {
    var old_item_count = items.length;
    let apiPath = '/files';
    if (path)
      apiPath += '/' + path;
    auth.fetch(config.endpoint_base + apiPath, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + auth.getToken()
      }
    }, ( data ) => {
      if (!data)
        return;
      if (data.status == 'ok') {
        set_items(data.data);
        set_loaded(true);
        // clear selection if item count becomes smaller
        if (data.data.length < old_item_count)
          set_sel({ anchor: -1, indices: [], items: [] });
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