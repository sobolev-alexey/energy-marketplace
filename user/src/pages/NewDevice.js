import React from "react";
import { Link } from "react-router-dom";

import { Form, Select, Input, Button, Upload, Col, Row, Space } from "antd";

import { UploadOutlined } from "@ant-design/icons";

import { Layout } from "../components";

import NewDeviceHeader from "../components/NewDeviceHeader";

const { Option } = Select;

const normFile = (e) => {
  console.log("Upload event:", e);

  if (Array.isArray(e)) {
    return e;
  }

  return e && e.fileList;
};

const NewDevicePage = () => {
  const onFinish = (values) => {
    console.log("Received values of form: ", values);
  };

  return (
    <Layout>
      <NewDeviceHeader />

      <Form size="large" layout="vertical" name="new-device-form" onFinish={onFinish} hideRequiredMark>
        <div className="fnew-device-page-wrapper">
          <Row justify="space-between">
            <Col flex="auto">
              <Form.Item
                name={["user", "name"]}
                label="Name"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please enter the name of your device!",
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name={["user", "url"]}
                label="URL"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please enter the URL of your device!",
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="type"
                label="Type"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please select the type of your device!",
                  },
                ]}
              >
                <Select placeholder="Producer">
                  <Option value="producer"> Producer </Option>
                  <Option value="consumer"> Consumer </Option>
                </Select>
              </Form.Item>

              <Form.Item label="Energy price (NOK per kWh)">
                <Form.Item name="energy-price" noStyle>
                  <Input type="number" />
                </Form.Item>
              </Form.Item>

              <Form.Item label="Min wallet balance (Mi)">
                <Form.Item name="wallet-balance-Mi" noStyle>
                  <Input type="number" />
                </Form.Item>
              </Form.Item>
            </Col>

            <Col offset={1} flex="auto">
              <Form.Item
                name="device-image"
                label="Device image"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                extra="No file selected"
              >
                <Upload name="logo" action="/upload.do" listType="picture">
                  <Button>Select file</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name={["user", "location"]}
                label="Location"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please select the location of your device!",
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="network"
                label="Network"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please select the Network",
                  },
                ]}
              >
                <Select placeholder="IOTA Devnet">
                  <Option value="iota-devnet"> IOTA Devnet </Option>
                  <Option value="iota-devnet-2"> IOTA Devnet 2 </Option>
                </Select>
              </Form.Item>

              <Form.Item label="Minimum offer amount (kWh)">
                <Form.Item name="min-offer-amount-KWh" noStyle>
                  <Input type="number" />
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>
        </div>
        <div className="fnew-device-page-footer">
          <Space size="middle">
            <Link to="/" className="cta-paused">
              Cancel
            </Link>
            <button className="cta-running" htmlType="submit">
              Add a device
            </button>
          </Space>
        </div>
      </Form>
    </Layout>
  );
};

export default NewDevicePage;
