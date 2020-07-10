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
    title: "Transaction ID",
    dataIndex: "transactionId",
    key: "transactionId",
    sorter: (a, b) => a.transactionId.localeCompare(b.transactionId),
  },
  {
    title: "Timestamp",
    dataIndex: "timestamp",
    key: "timestamp",
    sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
  },
  {
    title: "Amount kWh",
    dataIndex: "energyAmount",
    key: "energyAmount",
    sorter: (a, b) => a.energyAmount - b.energyAmount,
  },
  {
    title: "Value Mi",
    dataIndex: "energyPrice",
    key: "energyPrice",
    sorter: (a, b) => a.energyPrice - b.energyPrice,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Initial offer", value: "Initial offer" },
      { text: "Initial request", value: "Initial request" },
      { text: "Contract created", value: "Contract created" },
      { text: "Energy provision finished", value: "Energy provision finished" },
      { text: "Payment requested", value: "Payment requested" },
      { text: "Payment processed", value: "Payment processed" },
      { text: "Payment confirmed", value: "Payment confirmed" },
      { text: "Invalid", value: "Invalid" },
      { text: "Claim issued", value: "Claim issued" },
      { text: "Cancelled", value: "Cancelled" },
    ],
    onFilter: (value, record) => record.status.includes(value),
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
