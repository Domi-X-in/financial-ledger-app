// client/src/components/UI/MessageForm.js
import React, { useState } from "react";
import { sendMessage } from "../../utils/api";

const MessageForm = () => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setSending(true);
      setError("");

      await sendMessage({ content: message });

      setMessage("");
      setSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-form">
      <h3 className="mb-2">Contact Admin</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Your Message
          </label>
          <textarea
            id="message"
            className="form-input"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            placeholder="Type your message here..."
          ></textarea>
        </div>

        {error && (
          <p className="mb-2" style={{ color: "var(--error-color)" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="mb-2" style={{ color: "var(--success-color)" }}>
            Message sent successfully!
          </p>
        )}

        <button type="submit" className="btn" disabled={sending}>
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default MessageForm;
