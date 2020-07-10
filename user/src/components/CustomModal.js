import React, { useState } from "react";

import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const CustomModal = ({ error, callback = null, show = false }) => {
  const [showModal, setShowModal] = useState(show);

  return (
    <Modal
      title={
        <span className="warning-text">
          <ExclamationCircleOutlined className="warning-icon" /> Error
        </span>
      }
      visible={showModal}
      onCancel={() => setShowModal(false) || callback }
      cancelText="OK"
      okButtonProps={{ disabled: true, className: "modal-footer-hidden-button" }}
    >
      <div className="modal-content">
        <p>{ error }</p>
      </div>
    </Modal>
  );
};

export default CustomModal;
