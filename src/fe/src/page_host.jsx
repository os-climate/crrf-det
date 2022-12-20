import { Routes, Route } from 'react-router-dom';

import DocumentPage from './document/page';
import ProjectPage from './project/page';

export default function PageHost() {
  return (
    <div className="fixed h-screen left-16 top-0 right-0">
      <Routes>
        <Route path='/documents' element={<DocumentPage/>}></Route>
        <Route path='/documents/:path' element={<DocumentPage/>}></Route>
        <Route path='/documents/:path/:file' element={<DocumentPage/>}></Route>
        <Route path='/projects' element={<ProjectPage/>}></Route>
        <Route path='/projects/:name' element={<ProjectPage/>}></Route>
      </Routes>
    </div>
  )
}