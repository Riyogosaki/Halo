import React, { useState, useEffect, useRef } from "react";

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState({ name: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [activeRoom, setActiveRoom] = useState("general");
  const [rooms, setRooms] = useState(["general", "gaming", "music", "sports"]);
  const [newRoomName, setNewRoomName] = useState("");
  const [chatStatus, setChatStatus] = useState("connected"); 
  const [userProfile, setUserProfile] = useState({
    name: `User${Math.floor(Math.random() * 1000)}`,
    gender: "unknown",
    country: "unknown"
  });
  const chatRef = useRef(null);
  const wsRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage({ name: transcript });
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    wsRef.current = new WebSocket("ws://localhost:8080");
    
    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      registerUser();
      loadMessageHistory();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      
      switch (data.type) {
        case "userCount":
          setOnlineUsers(data.count);
          break;
        case "roomList":
          setRooms(data.rooms);
          break;
        case "chatMessage":
          const newMessage = {
            ...data.message,
            timestamp: new Date(data.message.timestamp),
            isOwn: data.message.senderId === userProfile.name,
            persistentId: data.persistentId,
            date: new Date(data.message.timestamp).toDateString()
          };
          setMessages(prev => [...prev, newMessage]);
          break;
        case "messageHistory":
          const historyMessages = data.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isOwn: msg.senderId === userProfile.name,
            date: new Date(msg.timestamp).toDateString()
          }));
          setMessages(historyMessages);
          break;
        case "userJoined":
          setMessages(prev => [...prev, {
            id: Date.now(),
            name: `${data.user.name} joined the chat`,
            sender: "System",
            timestamp: new Date(),
            isSystem: true,
            persistentId: `system-${Date.now()}`
          }]);
          break;
        case "userLeft":
          setMessages(prev => [...prev, {
            id: Date.now(),
            name: `${data.user.name} left the chat`,
            sender: "System",
            timestamp: new Date(),
            isSystem: true,
            persistentId: `system-${Date.now()}`
          }]);
          break;
        default:
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    const savedMessages = localStorage.getItem(`chatMessages-${activeRoom}`);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages).map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(parsedMessages);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chatMessages-${activeRoom}`, JSON.stringify(messages));
    }
  }, [messages, activeRoom]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const registerUser = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "register",
        user: userProfile
      }));
    }
  };

  const loadMessageHistory = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "getMessageHistory",
        room: activeRoom
      }));
    }
  };

    const handleSome = ()=>{
      alert("🍌🍌🍌🍌🍌🍌🍌🍌🍌 Lemda ");
    }
  const joinRoom = (roomName) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "joinRoom",
        room: roomName
      }));
      setActiveRoom(roomName);
      
      const savedMessages = localStorage.getItem(`chatMessages-${roomName}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
      
      loadMessageHistory();
    }
  };

  const createRoom = () => {
    if (!newRoomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "createRoom",
        room: newRoomName
      }));
      setNewRoomName("");
    }
  };

  const sendMessage = () => {
    if (!message.name.trim()) {
      alert("Please enter a message before sending.");
      return;
    }

    const messageData = {
      id: Date.now(),
      name: message.name,
      sender: userProfile.name,
      senderId: userProfile.name,
      timestamp: new Date(),
      room: activeRoom,
      isOwn: true,
      date: new Date().toDateString(),
      persistentId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        message: messageData
      }));
    }

    setMessages(prev => [...prev, messageData]);
    setMessage({ name: "" });
  };

  const clearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear all messages in this room?")) {
      localStorage.removeItem(`chatMessages-${activeRoom}`);
      setMessages([]);
    }
  };

  const exportChatHistory = () => {
    const chatData = {
      room: activeRoom,
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `chat-history-${activeRoom}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupMessagesByDate = (messages) => {
    const grouped = {};
    messages.forEach(msg => {
      const date = msg.date || new Date(msg.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(filteredMessages);

  const videoCategories = {
    trending: [
      { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "Phir Mohabbat - Ed Sheeran" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Blinding Lights - The Weeknd" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Dance Monkey - Tones and I" },
      { type: "youtube", url: "https://www.youtube.com/embed/WglSfZJOPds", title: "Bohemian Rhapsody - Queen" },
      { type: "youtube", url: "https://www.youtube.com/embed/b_oWPrL9H7o", title: "Billie Jean - Michael Jackson" },
      { type: "youtube", url: "https://www.youtube.com/embed/EiiOYwqk3A0", title: "Hotel California - Eagles" },
      { type: "youtube", url: "https://www.youtube.com/embed/WglSfZJOPds", title: "FIFA World Cup 2022 Highlights" },
      { type: "youtube", url: "https://www.youtube.com/embed/b_oWPrL9H7o", title: "Usain Bolt's Record Breaking Run" },
       { type: "youtube", url: "https://www.youtube.com/embed/xwaBWEjU_qM", title: "Friends: Best Moments" },
      { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },

    ],

    music: [
      { type: "youtube", url: "https://www.youtube.com/embed/WglSfZJOPds", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/b_oWPrL9H7o", title: "Song"},
      { type: "youtube", url: "https://www.youtube.com/embed/EiiOYwqk3A0", title: "Song bhgmc" },
      { type: "youtube", url: "https://www.youtube.com/embed/WglSfZJOPds", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/b_oWPrL9H7o", title: "Songchu" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
    ],
   
    entertainment: [
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/jzYxbnHHhY4", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/73s0R8dvv0c", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/J--yj22UT34", title: " LALLALA " },
      { type: "youtube", url: "https://www.youtube.com/embed/sY4Yds5Qpbc", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/dplHbfjJ5ew", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/dplHbfjJ5ew", title: "Movie" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Movie" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },



    ],
    Anime: [
      { type: "youtube", url: "https://www.youtube.com/embed/xwaBWEjU_qM", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },
       { type: "youtube", url: "https://www.youtube.com/embed/AtXBtbvNq2c", title: "Minecraft: The End Update" },
       { type: "youtube", url: "https://www.youtube.com/embed/9EtV6Bb7Vfg", title: "The Office: Funniest Scenes" },
      { type: "youtube", url: "https://www.youtube.com/embed/IQvhUzVX030", title: "Stranger Things: Season 4 Trailer" },
      { type: "youtube", url: "https://www.youtube.com/embed/_vFRK1LGWoE", title: "Top 10 NBA Dunks of 2021" },
       { type: "youtube", url: "https://www.youtube.com/embed/ilNt2bikxDI?list=RDUlacMvx_VYk&index=7", title: "Songlamda" },
       { type: "youtube", url: "https://www.youtube.com/embed/oxhdCm1ZGX8?list=RDoxhdCm1ZGX8&start_radio=1" , title: "Song" },
         { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/dABcwWoW8K4", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/iYRqAc10Ii8", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/xeOttl1d2bo?list=RDxeOttl1d2bo&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/i_NmPv5WQ0U?list=RDi_NmPv5WQ0U&start_radio=1" , title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/1aAzgHaTnSY?list=RD1aAzgHaTnSY&start_radio=1", title: "Song" },
      { type: "youtube", url: "https://www.youtube.com/embed/ayLRDypkFfI?list=RDayLRDypkFfI&start_radio=1", title: "Song AC AC AC "},
       { type: "youtube", url: "https://www.youtube.com/embed/AzDYqp1HeO8", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/ZcsBp1zjgeY?start=10357", title: "Anime" },
      { type: "youtube", url: "https://www.youtube.com/embed/vyFR4MrTn_Q", title: "Anime" },




    ],
  };

  const allVideos = Object.values(videoCategories).flat();
  const videosToShow = activeCategory === "all" ? allVideos : videoCategories[activeCategory];

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="video-chat-container">
      <header className="app-header">
        <h1>
          <span className="letter-h">H</span>
          <span className="letter-a">a</span>
          <span className="letter-l">l</span>
          <span className="letter-o">o</span>
        </h1>
        <p>Watch videos and chat with multiple users in real-time</p>
        <div className="connection-status">
          <div className={`status-indicator ${wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected'}`}>
            {wsRef.current?.readyState === WebSocket.OPEN ? ' 💀🍌Live' : '👁️☂️Offline'}
          </div>
          <div className="user-count">👥 {onlineUsers} users online</div>
        </div>
      </header>

      <div className="main-content">
        <section className="video-section">
          <div className="section-header">
            <h2>Videos to Watch</h2>
            <div className="category-filter">
              <button 
                className={activeCategory === "all" ? "active" : ""} 
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              <button 
                className={activeCategory === "trending" ? "active" : ""} 
                onClick={() => setActiveCategory("trending")}
              >
                Trending
              </button>
              <button 
                className={activeCategory === "music" ? "active" : ""} 
                onClick={() => setActiveCategory("music")}
              >
                Music
              </button>
              
              <button 
                className={activeCategory === "entertainment" ? "active" : ""} 
                onClick={() => setActiveCategory("entertainment")}
              >
                Entertainment
              </button>
              <button 
                className={activeCategory === "Anime" ? "active" : ""} 
                onClick={() => setActiveCategory("Anime")}
              >
                Anime
              </button>
            </div>
          </div>

          <div className="video-grid">
            {videosToShow.map((source, index) => (
              <div key={index} className="video-card">
                <div className="video-wrapper">
                  {source.type === "video" ? (
                    <video width="100%" height="200" controls>
                      <source src={source.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe 
                      width="100%" 
                      height="200" 
                      src={source.url} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      title={source.title}
                    ></iframe>
                  )}
                </div>
                <div className="video-info">
                  <h4>{source.title}</h4>
                  <div className="video-actions">
                    <button className="btn-like" onClick={handleSome}>❤️ Like</button>
                    <button className="btn-share" onClick={handleSome}>Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="chat-section">
          <div className="section-header">
            <h2>
              Group Chat - #{activeRoom}
            </h2>
            <div className="chat-info">
              <span className="online-count">👥 {onlineUsers} online</span>
              <span className="current-time">{formatTime(new Date())}</span>
            </div>
          </div>

          <div className="group-controls">
            <div className="room-info">
              <span>Active Room: <strong>#{activeRoom}</strong></span>
              <span>Users Online: <strong>{onlineUsers}</strong></span>
            </div>
           
          </div>

          <div className="room-selection">
            <div className="room-buttons">
              {rooms.map(room => (
                <button
                  key={room}
                  className={`room-btn ${activeRoom === room ? 'active' : ''}`}
                  onClick={() => joinRoom(room)}
                >
                  #{room}
                </button>
              ))}
            </div>
            <div className="create-room">
              <input
                type="text"
                placeholder="New room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              />
              <button onClick={createRoom}>Create</button>
            </div>
          </div>

          <div className="chat-search">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="chat-messages" ref={chatRef}>
            {Object.keys(groupedMessages).length > 0 ? (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="date-separator">
                    {formatDate(new Date(date))}
                  </div>
                  {dateMessages.map((item) => (
                    <div key={item.persistentId || item.id} className={`message ${item.isOwn ? 'own-message' : ''} ${item.isSystem ? 'system-message' : ''}`}>
                      <div className="message-avatar">
                        <img 
                          src={item.isSystem ? 
                            "https://i.pravatar.cc/40?u=system" : 
                            `https://i.pravatar.cc/40?u=${item.senderId || item.sender}`
                          } 
                          alt="Avatar" 
                        />
                        {item.isSystem && <span className="system-badge">⚙️</span>}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <div className="message-sender">
                            {item.isOwn ? "You" : item.sender}
                            {item.isSystem && " • System"}
                          </div>
                          <div className="message-time">
                            {formatTime(item.timestamp)}
                          </div>
                        </div>
                        <div className="message-text">{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-messages">
                <p>
                  {searchQuery ? 
                    "No messages found matching your search." : 
                    "Start the conversation! Be the first to message in this room! 👋"
                  }
                </p>
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <div className="voice-controls">
              <button 
                className={`voice-button ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? "🙉" : "🎤"}
              </button>
            </div>
            <input
              type="text"
              placeholder="Type a message or use voice..."
              value={message.name}
              onChange={(e) => setMessage({ ...message, name: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              className="send-button" 
              onClick={sendMessage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
          {isListening && (
            <div className="listening-indicator">
              🎤 Listening... Speak now
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
          background: linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%);
          color: #5a3e5c;
          min-height: 100vh;
        }

        .video-chat-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .app-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 30px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
        }

        .connection-status {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 15px;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .status-indicator.connected {
          background: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
        }

        .status-indicator.disconnected {
          background: rgba(244, 67, 54, 0.2);
          color: #c62828;
        }

        .user-count {
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .app-header h1 {
          font-size: 4.5rem;
          margin-bottom: 10px;
          font-weight: 800;
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .letter-h {
          background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
        }

        .letter-a {
          background: linear-gradient(45deg, #d291bc, #f9c5d1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite 0.5s;
        }

        .letter-l {
          background: linear-gradient(45deg, #c86b85, #e6a4b4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite 1s;
        }

        .letter-o {
          background: linear-gradient(45deg, #ff9a8b, #ffaaa5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite 1.5s;
        }

        .app-header p {
          color: #7c5d72;
          font-size: 1.2rem;
          margin-top: 10px;
          font-weight: 500;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 25px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.5);
        }

        .section-header h2 {
          font-size: 1.5rem;
          background: linear-gradient(45deg, #ff6b6b, #d291bc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        .chat-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .current-time {
          font-size: 0.8rem;
          color: #7c5d72;
        }

        /* Group Chat Controls - ADDED */
        .group-controls {
          margin-bottom: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .room-info {
          display: flex;
          gap: 15px;
          color: #7c5d72;
          font-size: 0.9rem;
        }

        .chat-actions {
          display: flex;
          gap: 10px;
        }

        .export-btn, .clear-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.8);
          color: #7c5d72;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }

        .export-btn:hover {
          background: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
        }

        .clear-btn:hover {
          background: rgba(244, 67, 54, 0.2);
          color: #c62828;
        }

        .category-filter {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .category-filter button {
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.7);
          color: #7c5d72;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .category-filter button:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }

        .category-filter button.active {
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
          box-shadow: 0 4px 15px rgba(210, 145, 188, 0.4);
        }

        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          max-height: 70vh;
          overflow-y: auto;
          padding: 10px;
        }

        .video-card {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .video-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.8);
        }

        .video-wrapper {
          position: relative;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
        }

        .video-wrapper iframe,
        .video-wrapper video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .video-info {
          padding: 15px;
        }

        .video-info h4 {
          margin-bottom: 10px;
          font-size: 1rem;
          color: #5a3e5c;
          font-weight: 600;
          line-height: 1.4;
        }

        .video-actions {
          display: flex;
          gap: 10px;
        }

        .btn-like, .btn-share {
          padding: 6px 12px;
          border: none;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          color: #7c5d72;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.8rem;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-like:hover, .btn-share:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-like:hover {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
          color: white;
        }

        .btn-share:hover {
          background: linear-gradient(135deg, #d291bc, #f9c5d1);
          color: white;
        }

        .chat-section {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 80vh;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .online-count {
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(210, 145, 188, 0.3);
        }

        /* Room Selection Styles */
        .room-selection {
          margin-bottom: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .room-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .room-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.7);
          color: #7c5d72;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .room-btn:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .room-btn.active {
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
        }

        .create-room {
          display: flex;
          gap: 8px;
        }

        .create-room input {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
        }

        .create-room button {
          padding: 8px 12px;
          border: none;
          border-radius: 15px;
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Search Bar Styles */
        .chat-search {
          position: relative;
          margin-bottom: 15px;
        }

        .chat-search input {
          width: 100%;
          padding: 10px 35px 10px 15px;
          border: none;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .clear-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7c5d72;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .date-separator {
          text-align: center;
          margin: 15px 0;
          color: #7c5d72;
          font-size: 0.8rem;
          font-weight: 500;
          position: relative;
        }

        .date-separator::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(122, 93, 114, 0.3);
          z-index: 1;
        }

        .date-separator span {
          background: rgba(255, 255, 255, 0.7);
          padding: 0 10px;
          position: relative;
          z-index: 2;
        }

        .message {
          display: flex;
          margin-bottom: 15px;
          animation: fadeIn 0.3s ease;
        }

        .own-message {
          flex-direction: row-reverse;
        }

        .own-message .message-content {
          align-items: flex-end;
        }

        .own-message .message-text {
          background: linear-gradient(135deg, #d291bc, #f9c5d1);
          color: white;
        }

        .system-message {
          justify-content: center;
        }

        .system-message .message-content {
          align-items: center;
          text-align: center;
        }

        .system-message .message-text {
          background: rgba(255, 255, 255, 0.8);
          color: #7c5d72;
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .message-avatar {
          margin-right: 10px;
          position: relative;
        }

        .own-message .message-avatar {
          margin-right: 0;
          margin-left: 10px;
        }

        .message-avatar img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .system-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: #7c5d72;
          color: white;
          font-size: 0.6rem;
          padding: 2px 4px;
          border-radius: 8px;
          font-weight: bold;
        }

        .message-content {
          flex: 1;
        }

        .own-message .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .own-message .message-header {
          flex-direction: row-reverse;
        }

        .message-sender {
          font-weight: bold;
          color: #d291bc;
          font-size: 0.9rem;
        }

        .own-message .message-sender {
          color: #ff6b6b;
        }

        .message-time {
          font-size: 0.7rem;
          color: #9f8ca5;
        }

        .message-text {
          background: linear-gradient(135deg, rgba(255, 182, 193, 0.3), rgba(255, 215, 225, 0.3));
          padding: 10px 15px;
          border-radius: 18px;
          margin-bottom: 5px;
          word-break: break-word;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: #5a3e5c;
          max-width: 80%;
        }

        .own-message .message-text {
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
        }

        .no-messages {
          text-align: center;
          padding: 30px;
          color: #9f8ca5;
        }

        /* Voice Controls */
        .voice-controls {
          display: flex;
          align-items: center;
        }

        .voice-button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: ${isListening ? 
            'linear-gradient(135deg, #ff6b6b, #ff4444)' : 
            'linear-gradient(135deg, #4CAF50, #45a049)'
          };
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          margin-right: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .voice-button:hover {
          transform: scale(1.1);
        }

        .voice-button.listening {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .listening-indicator {
          text-align: center;
          padding: 10px;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          border-radius: 20px;
          margin-top: 10px;
          font-weight: bold;
          animation: fadeInOut 2s infinite;
        }

        @keyframes fadeInOut {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }

        .chat-input-container {
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .chat-input-container input {
          flex: 1;
          padding: 15px 20px;
          border: none;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.8);
          color: #5a3e5c;
          outline: none;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .chat-input-container input:focus {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 0 0 2px rgba(210, 145, 188, 0.5);
        }

        .chat-input-container input:disabled {
          background: rgba(255, 255, 255, 0.5);
          color: #9f8ca5;
          cursor: not-allowed;
        }

        .chat-input-container input::placeholder {
          color: #9f8ca5;
        }

        .send-button {
          width: 50px;
          height: 50px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b6b, #d291bc);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(210, 145, 188, 0.4);
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05) rotate(5deg);
          box-shadow: 0 6px 20px rgba(210, 145, 188, 0.6);
        }

        .send-button:disabled {
          background: rgba(255, 255, 255, 0.5);
          color: #9f8ca5;
          cursor: not-allowed;
          transform: none;
        }

        .send-button svg {
          width: 24px;
          height: 24px;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }
          
          .chat-section {
            height: 500px;
          }
        }

        @media (max-width: 768px) {
          .video-grid {
            grid-template-columns: 1fr;
          }
          
          .category-filter {
            justify-content: center;
          }
          
          .app-header h1 {
            font-size: 3rem;
          }

          .room-buttons {
            justify-content: center;
          }

          .group-controls {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;