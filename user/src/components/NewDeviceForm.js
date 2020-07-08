import React from "react";
import { Link, withRouter } from "react-router-dom";
import { Form, Select, Input, InputNumber, Upload, Col, Row, Space, Switch } from "antd";
import firebase from "../firebase.config";
import callApi from "../utils/callApi";

const { Option } = Select;

const normFile = (e) => {
  console.log("Upload event:", e);

  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
};

const uuid_regex = "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";

const NewDeviceForm = ({ history }) => {

  const onFinish = async (values) => {
    console.log("Received values of form: ", values);
    try {
      let user = await localStorage.getItem("user");
      user = JSON.parse(user);
      if (user?.userId && user?.apiKey) {
        const {
          deviceName, 
          type, 
          location, 
          deviceURL, 
          deviceDescription, 
          minWalletAmount, 
          minOfferAmount, 
          maxEnergyPrice,
          uuid,
          running,
          dashboard
        } = values;
        const payload = {
          userId: user.userId,
          apiKey: user.apiKey,
          deviceName, 
          type, 
          location, 
          deviceURL,
          deviceDescription,
          minWalletAmount, 
          minOfferAmount, 
          maxEnergyPrice, 
          uuid,
          running,
          dashboard
        }
        const { response, error } = await callApi('device', payload);

        if (!error) {
          console.log(response?.status);
        } else {  
          console.error("Error loading user data", error);
        }
        history.push("/overview");
      }
    } catch (err) {
      console.error('Error while loading user data', err);
    }

  };

  return (
    <Form 
      size="large" 
      layout="vertical" 
      name="new-device-form" 
      onFinish={onFinish} 
      hideRequiredMark
      initialValues={{
        minWalletAmount: 0.01,
        uuid: "ac4a33f0-ee20-41e4-9fcd-9f91ecf77d0f"
      }}
    >
      <div className="new-device-page-wrapper">
        <Row justify="space-between">
          <Col>
            <Form.Item
              name="type"
              label="Type"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please select the type of your device",
                },
              ]}
            >
              <Select>
                <Option value="producer">Producer</Option> 
                <Option value="consumer">Consumer</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="deviceName"
              label="Name"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the name of your device",
                },
                { 
                  validator: (_, value) => 
                    (!value || value.length < 50) 
                    ? Promise.resolve() 
                    : Promise.reject(`Please shorten the provided value to less than 50 characters`) 
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="uuid"
              label="Device UUID"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the UUID of your device",
                },
                { 
                  validator: (_, value) => 
                    (new RegExp(uuid_regex).test(value)) 
                    ? Promise.resolve() 
                    : Promise.reject(`UUID format is wrong`) 
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item label="Energy price (NOK per kWh)">
              <Form.Item 
                name="maxEnergyPrice"
                noStyle
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please provide the max. energy price for this device",
                  },
                  {
                    type: "number",
                    message: "This is not a valid value",
                  },
                  { 
                    validator: (_, value) => 
                      (!value || value > 0) 
                      ? Promise.resolve() 
                      : Promise.reject(`This is not a valid value`) 
                  },
                ]}
              >
                <InputNumber className="rounded-input" type="number" step={0.001} />
              </Form.Item>
            </Form.Item>
            <Form.Item label="Minimum offer/request energy value (kWh)">
              <Form.Item 
                name="minOfferAmount" 
                noStyle
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please provide the min. offer/request energy value for this device",
                  },
                  {
                    type: "number",
                    message: "This is not a valid value",
                  },
                  { 
                    validator: (_, value) => 
                      (!value || value > 0) 
                      ? Promise.resolve() 
                      : Promise.reject(`This is not a valid value`) 
                  },
                ]}
              >
                <InputNumber className="rounded-input" type="number" />
              </Form.Item>
            </Form.Item>
            <Form.Item label="Min wallet balance (Mi)">
              <Form.Item 
                name="minWalletAmount" 
                noStyle
                hasFeedback
                rules={[
                  {
                    type: "number",
                    message: "This is not a valid value",
                  },
                  { 
                    validator: (_, value) => 
                      (!value || value > 0) 
                      ? Promise.resolve() 
                      : Promise.reject(`This is not a valid value`) 
                  },
                ]}
              >
                <InputNumber className="rounded-input" type="number" step={0.01} />
              </Form.Item>
            </Form.Item>
          </Col>
          <Col>
            <Form.Item
              name="deviceURL"
              label="URL"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the URL of your device",
                },
                {
                  type: 'url',
                  message: 'This is not a valid URL',
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the location of your device",
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="deviceDescription"
              label="Description (optional)"
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item name="running" label="Running" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked />
            </Form.Item>
            <Form.Item name="dashboard" label="Enable transaction dashboard" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked={false} />
            </Form.Item>
            <Form.Item
              className="no-file-selected"
              name="device-image"
              label="Device image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              extra={<span> No file selected </span>}
            >
              <Upload 
                name="deviceImage" 
                listType="picture"
                action={`https://${firebase?.storageBucket}/devices`}
              >
                <button className="ant-btn-lg1"> Select file </button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div className="new-device-page-footer">
        <Space size="middle">
          <Link to="/" className="cta-paused">
            Cancel
          </Link>
          <button className="cta-running" type="submit">
            Add a device
          </button>
        </Space>
      </div>
    </Form>
  );
};

export default withRouter(NewDeviceForm);
