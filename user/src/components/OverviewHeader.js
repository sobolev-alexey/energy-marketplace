import React from "react";
import { Link } from "react-router-dom";

import { PlusCircleFilled } from "@ant-design/icons";

const OverviewHeader = () => (
  <div className="header-wrapper2">
    <h5> Devices </h5>
    <Link to="/new" className="cta2">
      <PlusCircleFilled style={{ fontSize: "36px" }} /> Add a new device <span> </span>
    </Link>
  </div>
);

export default OverviewHeader;
