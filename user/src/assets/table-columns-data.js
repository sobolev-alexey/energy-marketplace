import React from "react";

import DropdownButton from "../components/DropdownButton";

export const overviewTableColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Type",
    dataIndex: "username",
    key: "type",
  },
  {
    title: "Balance",
    dataIndex: "phone",
    key: "balance",
  },
  {
    title: "Status",
    dataIndex: "website",
    key: "status",
  },
  {
    title: "",
    dataIndex: "",
    key: "x",
    render: () => <DropdownButton />,
  },
];
