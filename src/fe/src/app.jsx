import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SideNav from './side_nav';
import PageHost from './page_host';
import './app.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div className="relative">
        <SideNav/>
        <PageHost/>
      </div>
      <Toaster />
    </Router>
  )
}

export default App
