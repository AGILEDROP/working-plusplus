import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';

import PrivateRoute from './components/PrivateRoute';

import NavBar from './components/NavBar';
import Chart from './components/Chart';
import KarmaFeed from './components/KarmaFeed';
import UserProfile from './components/UserProfile';
import Login from './components/Login';

const App = props => {

  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>

      <PrivateRoute path="/" component={NavBar} search={searchTerm} onChange={value => setSearchTerm(value)} onSearchClick={value => setSearchTerm(value)} />
      
      <Switch>
        <Route exact path="/login" component={Login} />
        <PrivateRoute exact path="/" component={Chart} search={searchTerm} onSearchClick={value => setSearchTerm(value)} />
        <PrivateRoute exact path="/feed" component={KarmaFeed} search={searchTerm} onSearchClick={value => setSearchTerm(value)} />
        <PrivateRoute path="/user/:user" component={UserProfile} search={searchTerm} />
      </Switch>

    </Router>
  );
}

export default App;