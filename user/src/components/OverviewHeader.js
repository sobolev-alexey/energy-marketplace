import React from "react";
import { Link } from "react-router-dom";

import { PlusCircleFilled } from "@ant-design/icons";

const OverviewHeader = ({ marketplace = false }) => (
  <div className="header-wrapper2">
    {
      marketplace ? (
          <h5>Marketplace</h5>
      ) : (
        <React.Fragment>
          <h5>Devices</h5>
          <Link to="/new" className="cta2">
            <PlusCircleFilled style={{ fontSize: "36px" }} /> Add a new device
            <span />
          </Link>
        </React.Fragment>
      )
    }
  </div>
);

export default OverviewHeader;
