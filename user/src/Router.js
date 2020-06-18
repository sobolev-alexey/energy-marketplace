import React, { useContext } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { 
  Device,
  ForgotPassword,
  Login,
  NewDevice,
  Overview,
  Register,
  Wallet
} from './pages';
import { AppContext } from './context/globalState';
import { ProtectedRoute } from './components';

const protectedRoutes = [
	{
		name: 'overview',
		exact: true,
		path: '/overview',
		main: props => <Overview {...props} />,
		public: false,
  },
  {
		name: 'new',
		exact: true,
		path: '/new',
		main: props => <NewDevice {...props} />,
		public: false,
  },
  {
		name: 'wallet',
		exact: true,
		path: '/wallet',
		main: props => <Wallet {...props} />,
		public: false,
  },
  {
		name: 'device',
		exact: true,
		path: '/device/:deviceId',
		main: props => <Device {...props} />,
		public: false,
	},
];

const App = () => {
  const { isLoggedIn } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Switch>
        {
          protectedRoutes.map(route => (
            <ProtectedRoute
              key={route.path}
              isLoggedIn={isLoggedIn}
              path={route.path}
              component={route.main}
              exact={route.exact}
              public={route.public}
            />
          ))
        }
        <Route exact path={'/'} component={Login} />
        <Route exact path={'/register'} component={Register} />
        <Route exact path={'/forgot'} component={ForgotPassword} />
        <Route component={Login} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;