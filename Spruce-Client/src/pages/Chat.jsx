import React, { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { userAPI, messageAPI } from '../services/api';
import './Chat.css';

const Chat = ({ user, onLogout }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:8080/ws');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      // Register with server
      websocket.send(JSON.stringify({
        type: 'register',
        userId: user.id,
      }));
    };
    
    websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      
      if (data.type === 'handshake') {
        // Handle handshake
        console.log('Handshake received');
      } else if (data.type === 'message') {
        // Decrypt and display message
        const privateKeys = JSON.parse(localStorage.getItem('privateKeys'));
        
        try {
          const decrypted = await decryptMessage(
            { handshake: data.handshake, message: data },
            { dilithium: data.senderPublicKeys?.dilithium },
            privateKeys
          );
          
          setMessages(prev => [...prev, {
            ...data,
            plaintext: decrypted.plaintext,
            decrypted: true,
          }]);
        } catch (err) {
          console.error('Decryption failed:', err);
        }
      }
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, [user.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const privateKeys = JSON.parse(localStorage.getItem('privateKeys'));
    
    try {
      // Get recipient's public keys
      const recipientData = await userAPI.getById(selectedContact.id);
      const recipientPublicKeys = {
        x25519: recipientData.data.x25519PublicKey,
        kyber: recipientData.data.kyberPublicKey,
        dilithium: recipientData.data.dilithiumPublicKey,
      };
      
      // Encrypt message
      const encrypted = await encryptMessage(
        newMessage,
        recipientPublicKeys,
        privateKeys
      );
      
      // Send via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          senderId: user.id,
          receiverId: selectedContact.id,
          ciphertext: encrypted.message.ciphertext,
          metadata: encrypted.message.aad,
          handshake: encrypted.handshake,
        }));
        
        // Add to local messages
        setMessages(prev => [...prev, {
          plaintext: newMessage,
          senderId: user.id,
          receiverId: selectedContact.id,
          encrypted: true,
        }]);
        
        setNewMessage('');
      }
    } catch (err) {
      console.error('Encryption failed:', err);
    }
  };

  const loadMessages = async () => {
    if (!selectedContact) return;
    
    try {
      const response = await messageAPI.getConversation(selectedContact.id);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>🌲 Spruce</h2>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
        
        <div className="contacts">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className={`contact ${selectedContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-avatar">{contact.username[0]}</div>
              <div className="contact-info">
                <div className="contact-name">{contact.username}</div>
                <div className="contact-status">{contact.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedContact ? (
          <>
            <div className="chat-header">
              <h3>{selectedContact.username}</h3>
            </div>
            
            <div className="messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {msg.plaintext || msg.ciphertext}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat">
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

