import React, { useState, useEffect, useRef } from "react";

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState({ name: "" });
  const chatRef = useRef(null); // Create a reference for chat messages

  // Fetch chat messages
  const fetchData = async () => {
    try {
      const response = await fetch("/toNumber");
      const result = await response.json();
      setMessages(result.data || []);

      // Scroll to the latest message after loading
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!message.name.trim()) {
      alert("Please enter a message before sending.");
      return;
    }

    try {
      const res = await fetch("/toNumber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: message.name }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ name: "" });
        fetchData(); // Refresh messages
      } else {
        alert("Message sending failed: " + data.message);
      }
    } catch (error) {
      alert("Could not send message. Check console for details.");
    }
  };

  // Video sources (Supports both direct MP4 and embeddable links)
  const videoSources = [
    { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg" },
    { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030" },
    { type: "dailymotion", url: "https://www.dailymotion.com/embed/video/x7vo3q4" },
    {type: "youtube" , url : "https://www.youtube.com/embed/_vFRK1LGWoE"},
    {type: "youtube" , url : "https://www.youtube.com/embed/WglSfZJOPds?list=TLPQMjYwMjIwMjXBAHuHhv64kA"},
    {type: "youtube" , url : "https://www.youtube.com/embed/b_oWPrL9H7o"},
    {type: "youtube" , url : "https://www.youtube.com/embed/EiiOYwqk3A0?list=TLPQMjYwMjIwMjXBAHuHhv64kA"},
    {type: "youtube" , url : "https://www.youtube.com/embed/b_oWPrL9H7o"},
    {type: "youtube" , url : "https://www.youtube.com/embed/b_oWPrL9H7o"},
    {type: "youtube" , url : "https://youtu.be/72eQoVgbEG8?list=TLPQMjYwMjIwMjXBAHuHhv64kA"},
    {type: "youtube" , url : "https://www.youtube.com/embed/b_oWPrL9H7o"},
    {type: "youtube" , url : "https://www.youtube.com/embed/72eQoVgbEG8?list=TLPQMjYwMjIwMjXBAHuHhv64kA"},
    {type: "youtube" , url : "https://www.youtube.com/embed/b_oWPrL9H7o"},
    {type: "youtube" , url : "https://www.youtube.com/embed/AtXBtbvNq2c"},
    {type: "youtube" , url : "https://www.youtube.com/embed/xwaBWEjU_qM?list=PLAV8AqZgfhJts3Nd6uRN7-oh0VfIkWExc"},



  ];

  return (
    <div className="container">
      {/* Video Section (Left Side) */}
      <div className="video-container">
        {videoSources.map((source, index) => (
          <div key={index} className="video-wrapper">
            {source.type === "video" ? (
              <video width="640" height="360" controls>
                <source src={source.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe 
                width="640" 
                height="360" 
                src={source.url} 
                frameBorder="0" 
                allowFullScreen
              ></iframe>
            )}
          </div>
        ))}
      </div>

      {/* Chat Section (Right Side, Only One Chatbox) */}
      <div className="chat-container">
        <h3>Live Chat</h3>
        <div className="chat-messages" ref={chatRef}>
          {messages.length > 0 ? (
            messages.map((item, index) => (
              <div key={index} className="message">
                <p>{item.name}</p>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>
        <div className="chat-footer">
          <input
            type="text"
            placeholder="Live Chat With Stranger..."
            value={message.name}
            onChange={(e) => setMessage({ ...message, name: e.target.value })}
          />
          <button type="submit" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
