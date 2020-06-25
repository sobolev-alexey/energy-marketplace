import React from "react";
import { Link } from "react-router-dom";

import { PlusCircleFilled } from "@ant-design/icons";

const Header = () => (
  <div className="header-wrapper2">
    <h5>Devices</h5>
    <Link to="/new" className="cta2">
      <PlusCircleFilled style={{ fontSize: "34px" }} /> Add a new device
    </Link>
  </div>
);

export default Header;
