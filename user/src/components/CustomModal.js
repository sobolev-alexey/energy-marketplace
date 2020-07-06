import React, { useState } from "react";

import { Modal, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const CustomModal = ({ error, errorMessage }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <Button type="primary" onClick={() => setShowModal(true)}>
        Modal
      </Button>
      <Modal
        title={
          <span className="warning-text">
            <ExclamationCircleOutlined className="warning-icon" /> Error Message
          </span>
        }
        visible={showModal}
        onCancel={() => setShowModal(false)}
        cancelText="OK"
        okButtonProps={{ disabled: true, className: "modal-footer-hidden-button" }}
      >
        <div className="modal-content">
          <p>Something terrible happened and here we explain why it happened and how yoy can fix it</p>
        </div>
      </Modal>
    </div>
  );
};

export default CustomModal;
