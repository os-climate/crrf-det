import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SideNav from './side_nav';
import PageHost from './page_host';
import Login from './login';
import Register from './register';
import { auth } from './shared/user';
import './app.css'


function ProtectedApp() {
  return (<div>
    { auth.getToken() ? (
      <div className="relative">
        <SideNav/>
        <PageHost/>
      </div>
    ):(
      <div>
        <Login/>
      </div>
    )}
  </div>)
}


function App() {
  const [ refresh, setRefresh ] = useState(0);

  function authStatusChanged() {
    setRefresh(Math.random(0));
  }

  useEffect(() => {
    auth.setStatusChangeCallback(authStatusChanged);
  }, []);

  return (
    <Router>
      <Routes>
        {/* public facing routes */}
        <Route path='/register/:invite_code' element={<Register />}/>
        <Route path='/register' element={<Register />}/>
        <Route path='/login' element={<Login/>}/>
        {/* protected routes */}
        <Route path='*' element={<ProtectedApp />}/>
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
