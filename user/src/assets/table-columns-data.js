import React from "react";
import { EllipsisOutlined, PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";

export const overviewTableColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (value, row) => (
      <div className="table-item-wrapper">
        <span className="primary-row">
          { value.charAt(0).toUpperCase() + value.slice(1) }
        </span>
        <span className="secondary-row">
          { row.description }
        </span>
      </div>
      
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
    filters: [
      { text: "Producer", value: "producer" },
      { text: "Consumer", value: "consumer" },
    ],
    onFilter: (value, record) => record.type.includes(value),
    sorter: (a, b) => a.type.localeCompare(b.type),
    render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
  },
  {
    title: "Balance",
    dataIndex: "balance",
    key: "balance",
    sorter: (a, b) => Number(a) - Number(b),
  },
  {
    title: "Status",
    dataIndex: "running",
    key: "running",
    filters: [
      { text: "Running", value: "running" },
      { text: "Paused", value: "paused" },
    ],
    onFilter: (value, record) => record.running.includes(value),
    render: (running) =>
      running ? (
        <span className="text-running">
          <PlayCircleOutlined className={"icon-running"} /> Running
        </span>
      ) : (
        <span className="text-paused">
          <PauseCircleOutlined className={"icon-paused"} /> Paused
        </span>
      ),
  },
  {
    key: "x",
    width: 80,
    render: () => (
      <div>
        <EllipsisOutlined style={{ fontSize: "30px", color: "#aab8c2" }} />
      </div>
    ),
  },
];

export const DeviceTableColumns = [
  {
    title: "Contract ID",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Timestamp",
    dataIndex: "username",
    key: "type",
  },
  {
    title: "Amount kWh",
    dataIndex: "phone",
    key: "balance",
    sorter: (a, b) => a.phone - b.phone,
  },
  {
    title: "Value Mi",
    dataIndex: "phone",
    key: "balance",
    sorter: (a, b) => a.phone - b.phone,
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
        <span className="text-running">Confirmed</span>
      ) : (
        <span className="text-paused">Cancelled</span>
      ),
  },
  {
    key: "x",
    width: 80,
    render: () => (
      <div>
        <EllipsisOutlined style={{ fontSize: "30px", color: "#aab8c2" }} />
      </div>
    ),
  },
];
