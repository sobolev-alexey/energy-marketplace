import React from "react";

import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";

import DropdownButton from "../components/DropdownButton";

export const overviewTableColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Type",
    dataIndex: "username",
    key: "type",
    filters: [
      { text: "Producer", value: "producer" },
      { text: "Consumer", value: "consumer" },
    ],
    onFilter: (value, record) => record.username.includes(value),
    sorter: (a, b) => a.username.localeCompare(b.username),
  },
  {
    title: "Balance",
    dataIndex: "id",
    key: "balance",
    sorter: (a, b) => a.id - b.id,
  },
  {
    title: "Status",
    dataIndex: "website",
    key: "status",
    filters: [
      { text: "Running", value: "running" },
      { text: "Paused", value: "paused" },
    ],
    onFilter: (value, record) => record.website.includes(value),
    render: (value) =>
      value === "running" ? (
        <span className="text-running">
          <PlayCircleOutlined className={"icon-running"} /> Running{" "}
        </span>
      ) : (
        <span className="text-paused">
          <PauseCircleOutlined className={"icon-paused"} /> Paused{" "}
        </span>
      ),
  },
  {
    key: "x",
    render: () => <DropdownButton />,
  },
];
