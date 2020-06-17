import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import WebFontLoader from 'webfontloader';
import ReactGA from 'react-ga';
import { 
  Device,
  ForgotPassword,
  Login,
  NewDevice,
  Overview,
  Register,
  Wallet
} from './pages'
import GlobalState from './context/globalState'
import 'antd/dist/antd.css';
import './styles/index.scss';

WebFontLoader.load({
  google: {
      families: [
        'Roboto:300,400,500,600,700,800,900'
      ],
  },
});

ReactGA.initialize('UA-169796079-1');
ReactGA.set({ anonymizeIp: true });

const App = () => {
  return (
    <GlobalState>
      <BrowserRouter>
        <Switch>
          <Route path={'/'} component={Overview} exact />
          <Route path={'/login'} component={Login} />
          <Route path={'/register'} component={Register} />
          <Route path={'/forgot'} component={ForgotPassword} />
          <Route path={'/new'} component={NewDevice} />
          <Route path={'/wallet'} component={Wallet} />
          <Route path={'/device/:deviceId'} component={Device} />
          <Route component={Overview} />
        </Switch>
      </BrowserRouter>
    </GlobalState>
  );
}

export default App;