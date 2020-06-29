import React, { useContext } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { 
  Device,
  ForgotPassword,
  Login,
  NewDevice,
  Overview,
  Register,
  Wallet
} from "./pages";
import { AppContext } from "./context/globalState";

const protectedRoutes = [
  {
    path: "/overview",
    main: props => <Overview {...props} />,
  },
  {
    path: "/new",
    main: props => <NewDevice {...props} />,
  },
  {
    path: "/wallet",
    main: props => <Wallet {...props} />,
  },
  {
    path: "/device/:deviceId",
    main: props => <Device {...props} />,
  },
];

const App = () => {
  const { isLoggedIn } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Switch>
        {
          protectedRoutes.map(route => (
            isLoggedIn 
              ? <Route key={route.path} path={route.path} component={route.main} />
              : <Route exact key={route.path} path={route.path} component={Login} />
          ))
        }
        <Route exact path={"/"} component={Login} />
        <Route exact path={"/register"} component={Register} />
        <Route exact path={"/forgot"} component={ForgotPassword} />
        <Route component={Login} />
      </Switch>
    </BrowserRouter>
  );
};

export default App;