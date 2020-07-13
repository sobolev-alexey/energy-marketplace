import React, { useEffect, useState } from "react";
import { fetchMam } from "../utils/mam";
import { Loading, MessageContent } from ".";

const MessageList = ({ mam }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const messages = await fetchMam(mam);
        setMessages(messages);
      } catch (err) {
        console.error('Error while loading device data', err);
      }
    }
    
    fetchMessages();
  }, [mam?.root]);

  if (!mam?.root) return null;
  
  return (
    <React.Fragment>
      {
          !messages.length ? (
            <Loading />
        ) : (
          <React.Fragment>
            {
              messages.map((message, index) => (
                <MessageContent key={index} message={message} />
              ))
            }
          </React.Fragment>  
        )  
      }                  
    </React.Fragment>
  )
}

export default MessageList;
