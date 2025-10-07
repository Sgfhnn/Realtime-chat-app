import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import MessageList from './MessageList';
import './Chat.css';

function Chat({ user, token, apiUrl, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const usersRef = useRef([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched users:', response.data);
      setUsers(response.data);
      usersRef.current = response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const response = await axios.get(`${apiUrl}/chat/messages?userId=${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    // Fetch users
    fetchUsers();

    // Initialize Socket.IO connection
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Register user with socket
    console.log('Registering user:', user.id);
    socketRef.current.emit('register', { userId: user.id });

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      console.log('Received new message:', message);
      
      // Always add message to the messages list first
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      // Auto-open chat if no chat is currently open and this is an incoming message
      setSelectedUser((currentSelected) => {
        if (!currentSelected && message.receiverId === user.id) {
          const sender = usersRef.current.find(u => u.id === message.senderId);
          if (sender) {
            console.log('Auto-opening chat with:', sender.username);
            // Fetch all messages for this conversation to get full history
            setTimeout(() => fetchMessages(sender.id), 100);
            return sender;
          }
        }
        return currentSelected;
      });
    });

    socketRef.current.on('messageConfirmed', (message) => {
      console.log('Message confirmed:', message);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Listen for user status changes
    socketRef.current.on('userStatusChanged', ({ userId, isOnline, lastSeen }) => {
      console.log('User status changed:', { userId, isOnline, lastSeen });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, isOnline, lastSeen: lastSeen || user.lastSeen }
            : user
        )
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, apiUrl]);

  const handleUserSelect = (selectedUser) => {
    console.log('Selecting user:', selectedUser.username);
    setSelectedUser(selectedUser);
    setMessages([]);
    fetchMessages(selectedUser.id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    console.log('Sending message:', {
      senderId: user.id,
      receiverId: selectedUser.id,
      content: newMessage,
    });

    // Emit message via Socket.IO
    socketRef.current.emit('sendMessage', {
      senderId: user.id,
      receiverId: selectedUser.id,
      content: newMessage,
    });

    setNewMessage('');
  };

  const getStatusText = (user) => {
    if (user.isOnline) {
      return 'Online';
    }
    
    if (user.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
    
    return 'Offline';
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>💬 Chats</h3>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
        <div className="user-info">
          <div className="user-avatar">{user.username[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{user.username}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
        <div className="users-list">
          <h4>Available Users</h4>
          {users.map((u) => (
            <div
              key={u.id}
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => handleUserSelect(u)}
            >
              <div className="user-avatar-container">
                <div className="user-avatar">{u.username[0].toUpperCase()}</div>
                <div className={`status-indicator ${u.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              <div className="user-details">
                <div className="user-name">{u.username}</div>
                <div className="user-status">{getStatusText(u)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar large">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.username}</h3>
                  <p>{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <MessageList 
              messages={messages.filter(msg => 
                (msg.senderId === user.id && msg.receiverId === selectedUser.id) ||
                (msg.senderId === selectedUser.id && msg.receiverId === user.id)
              )} 
              currentUserId={user.id} 
            />

            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-btn">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>👋 Welcome!</h2>
            <p>Select a user from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
