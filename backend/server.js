const WebSocket = require('ws');
const mongoose = require('mongoose');
const http = require('http');
const dotenv =
require('dotenv').config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));


// Message Schema
const messageSchema = new mongoose.Schema({
  id: String,
  name: String,
  sender: String,
  senderId: String,
  timestamp: Date,
  room: String,
  type: { type: String, default: 'user' } // user, system, ai
});

const Message = mongoose.model('Message', messageSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  gender: String,
  country: String,
  socketId: String,
  isOnline: { type: Boolean, default: true },
  currentRoom: { type: String, default: 'general' },
  partner: String,
  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();
const rooms = new Map();
const waitingUsers = [];

// Initialize default rooms
rooms.set('general', new Set());
rooms.set('gaming', new Set());
rooms.set('music', new Set());
rooms.set('sports', new Set());

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'register':
          await handleRegister(ws, message.user);
          break;
        case 'findStranger':
          handleFindStranger(ws);
          break;
        case 'message':
          await handleMessage(ws, message.message);
          break;
        case 'disconnect':
          handleDisconnect(ws);
          break;
        case 'joinRoom':
          handleJoinRoom(ws, message.room);
          break;
        case 'createRoom':
          handleCreateRoom(ws, message.room);
          break;
        case 'aiTrigger':
          handleAITrigger(ws, message.message);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

async function handleRegister(ws, userData) {
  const user = new User({
    ...userData,
    socketId: ws._socket.remoteAddress,
    isOnline: true
  });
  
  await user.save();
  clients.set(ws, user);
  
  // Send current user count and room list
  broadcastUserCount();
  sendRoomList(ws);
  
  console.log(`User registered: ${userData.name}`);
}

async function handleFindStranger(ws) {
  const user = clients.get(ws);
  if (!user) return;

  // Notify user that search started
  ws.send(JSON.stringify({
    type: 'searching'
  }));

  // If there are waiting users, connect them
  if (waitingUsers.length > 0 && waitingUsers[0] !== ws) {
    const partnerWs = waitingUsers.shift();
    const partnerUser = clients.get(partnerWs);
    
    // Set partners
    user.partner = partnerUser.name;
    partnerUser.partner = user.name;
    
    await user.save();
    await partnerUser.save();

    // Notify both users
    ws.send(JSON.stringify({
      type: 'partnerFound',
      partner: partnerUser
    }));

    partnerWs.send(JSON.stringify({
      type: 'partnerFound',
      partner: user
    }));
  } else {
    // Add to waiting list if not already there
    if (!waitingUsers.includes(ws)) {
      waitingUsers.push(ws);
    }
  }
}

async function handleMessage(ws, messageData) {
  const user = clients.get(ws);
  if (!user) return;

  // Save message to MongoDB
  const message = new Message({
    ...messageData,
    timestamp: new Date(messageData.timestamp)
  });
  
  await message.save();

  // If user has a partner, send to partner
  if (user.partner) {
    const partnerWs = findClientByUsername(user.partner);
    if (partnerWs) {
      partnerWs.send(JSON.stringify({
        type: 'chatMessage',
        message: messageData
      }));
    }
  } else {
    // If no partner, send AI response
    handleAITrigger(ws, messageData.name);
  }

  // Also send to room if in a room
  const room = rooms.get(user.currentRoom);
  if (room) {
    room.forEach(client => {
      if (client !== ws && clients.has(client)) {
        client.send(JSON.stringify({
          type: 'chatMessage',
          message: messageData
        }));
      }
    });
  }

  // Confirm message saved
  ws.send(JSON.stringify({
    type: 'messageSaved'
  }));
}

function handleDisconnect(ws) {
  const user = clients.get(ws);
  if (user) {
    user.isOnline = false;
    user.lastSeen = new Date();
    user.save();

    // Notify partner if exists
    if (user.partner) {
      const partnerWs = findClientByUsername(user.partner);
      if (partnerWs) {
        partnerWs.send(JSON.stringify({
          type: 'partnerDisconnected'
        }));
        
        const partnerUser = clients.get(partnerWs);
        if (partnerUser) {
          partnerUser.partner = null;
          partnerUser.save();
        }
      }
    }

    // Remove from waiting list
    const waitingIndex = waitingUsers.indexOf(ws);
    if (waitingIndex > -1) {
      waitingUsers.splice(waitingIndex, 1);
    }

    // Remove from rooms
    rooms.forEach((users, roomName) => {
      if (users.has(ws)) {
        users.delete(ws);
      }
    });

    clients.delete(ws);
  }

  broadcastUserCount();
}

function handleJoinRoom(ws, roomName) {
  const user = clients.get(ws);
  if (!user) return;

  // Leave current room
  const currentRoom = rooms.get(user.currentRoom);
  if (currentRoom) {
    currentRoom.delete(ws);
  }

  // Join new room
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  
  rooms.get(roomName).add(ws);
  user.currentRoom = roomName;
  user.save();

  // Send room list update
  sendRoomList(ws);
}

function handleCreateRoom(ws, roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
    
    // Notify all clients about new room
    clients.forEach((user, client) => {
      sendRoomList(client);
    });
  }
}

async function handleAITrigger(ws, userMessage) {
  // Simple AI response logic
  let response = "I'm an AI assistant. How can I help you today?";
  
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = "Hello there! 👋 I'm your AI chat companion. How are you doing today?";
  } else if (lowerMessage.includes('how are you')) {
    response = "I'm doing great, thanks for asking! I'm here to chat with you while you wait for human connections. What would you like to talk about?";
  } else if (lowerMessage.includes('thank')) {
    response = "You're welcome! 😊 Is there anything else you'd like to chat about?";
  } else if (lowerMessage.includes('name')) {
    response = "I'm Halo AI, your friendly chat assistant! I'm here to keep you company and help with conversations.";
  } else if (lowerMessage.includes('weather')) {
    response = "I don't have access to real-time weather data, but I hope it's beautiful wherever you are! 🌞";
  } else if (lowerMessage.includes('joke')) {
    response = "Why don't scientists trust atoms? Because they make up everything! 😄";
  } else if (lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
    response = "That's an interesting question! While I'm a simple AI, I'm here to chat and keep you company. You can also try finding a human partner to discuss this with!";
  }

  // Save AI message to database
  const aiMessage = new Message({
    id: Date.now(),
    name: response,
    sender: "AI Assistant",
    senderId: "ai",
    timestamp: new Date(),
    room: clients.get(ws)?.currentRoom || 'general',
    type: 'ai'
  });
  
  await aiMessage.save();

  ws.send(JSON.stringify({
    type: 'aiResponse',
    response: response
  }));
}

function broadcastUserCount() {
  const count = clients.size;
  clients.forEach((user, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'userCount',
        count: count
      }));
    }
  });
}

function sendRoomList(ws) {
  const roomList = Array.from(rooms.keys());
  ws.send(JSON.stringify({
    type: 'roomList',
    rooms: roomList
  }));
}

function findClientByUsername(username) {
  for (let [client, user] of clients.entries()) {
    if (user.name === username) {
      return client;
    }
  }
  return null;
}

// Get chat history
async function getChatHistory(room = 'general', limit = 50) {
  return await Message.find({ room: room })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
}

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
  console.log('MongoDB connected for message storage');
});