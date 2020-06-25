import React from "react";

import { Menu, Dropdown, message } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";

const DropdownButton = () => {
  const handleMenuClick = (e) => {
    message.info("Click on menu item.");
    console.log("click", e);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="1"> 1st menu item </Menu.Item>
      <Menu.Item key="2"> 2nd menu item </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Dropdown overlay={menu}>
        <a onClick={(e) => e.preventDefault()}>
          <EllipsisOutlined style={{ fontSize: "30px", color: "#aab8c2" }} />
        </a>
      </Dropdown>
    </div>
  );
};

export default DropdownButton;
