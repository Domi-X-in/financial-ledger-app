import React, { useState, useEffect } from "react";
import { getMessages, markMessageAsRead, deleteMessage } from "../../utils/api";

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages();
        setMessages(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again.");
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markMessageAsRead(id);

      // Update local state
      setMessages(
        messages.map((message) =>
          message._id === id ? { ...message, isRead: true } : message
        )
      );
    } catch (err) {
      console.error(`Error marking message ${id} as read:`, err);
      setError("Failed to mark message as read. Please try again.");
    }
  };

  const handleDeleteMessage = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(id);

        // Update local state
        setMessages(messages.filter((message) => message._id !== id));
      } catch (err) {
        console.error(`Error deleting message ${id}:`, err);
        setError("Failed to delete message. Please try again.");
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="message-management">
      <h1 className="mb-3">Messages</h1>

      {error && (
        <p className="mb-3" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}

      {messages.length === 0 ? (
        <div className="card">
          <p>No messages found.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message._id}
              className="card mb-3"
              style={{
                borderLeft: message.isRead
                  ? "4px solid var(--medium-gray)"
                  : "4px solid var(--primary-color)",
              }}
            >
              <div className="flex-between mb-2">
                <div>
                  <strong>From:</strong>{" "}
                  {message.sender?.name || message.sender || "Unknown User"}
                  {message.sender?.email && ` (${message.sender.email})`}
                </div>
                <div>{new Date(message.createdAt).toLocaleString()}</div>
              </div>

              <div className="message-content mb-3">{message.content}</div>

              <div className="message-actions">
                {!message.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(message._id)}
                    className="btn"
                    style={{ marginRight: "10px" }}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="btn btn-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageManagement;
