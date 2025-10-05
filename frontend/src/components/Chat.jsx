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

  useEffect(() => {
    // Fetch users
    fetchUsers();

    // Initialize Socket.IO connection
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
    });

    // Register user with socket
    socketRef.current.emit('register', { userId: user.id });

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('messageConfirmed', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user.id, apiUrl]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
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

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    fetchMessages(selectedUser.id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser) return;

    // Emit message via Socket.IO
    socketRef.current.emit('sendMessage', {
      senderId: user.id,
      receiverId: selectedUser.id,
      content: newMessage,
    });

    setNewMessage('');
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
              <div className="user-avatar">{u.username[0].toUpperCase()}</div>
              <div className="user-details">
                <div className="user-name">{u.username}</div>
                <div className="user-email">{u.email}</div>
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

            <MessageList messages={messages} currentUserId={user.id} />

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
