import React from "react";
import WebFontLoader from "webfontloader";
import ReactGA from "react-ga";
import Router from "./Router";
import GlobalState from "./context/globalState";
import "antd/dist/antd.css";
import "./styles/index.scss";

WebFontLoader.load({
  google: {
    families: ["Roboto:300,400,500,600,700,800,900"],
  },
});

ReactGA.initialize("UA-169796079-1");
ReactGA.set({ anonymizeIp: true });

const App = () => {
  return (
    <GlobalState>
      <Router />
    </GlobalState>
  );
};

export default App;
