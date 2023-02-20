import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SideNav from './side_nav';
import PageHost from './page_host';
import Login from './login';
import { auth } from './shared/user';
import './app.css'


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
      <Toaster />
    </Router>
  )
}

export default App
