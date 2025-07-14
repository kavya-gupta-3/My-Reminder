import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, database, ref, push, set, get } from '../firebase';
import aiService from '../services/aiService';
import { FaArrowLeft, FaPaperPlane, FaRobot } from 'react-icons/fa';

function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reminderId = searchParams.get('edit');

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reminderData, setReminderData] = useState({
    personName: '',
    partnerName: '', // for anniversary
    date: '',
    relationship: '', // for both
    reminderType: 'birthday',
    note: ''
  });
  const [userContext, setUserContext] = useState(null);
  const messagesEndRef = useRef(null);

  // Chat history persistence - separate for edit mode
  const getChatHistoryKey = useCallback(() => {
    const uid = auth.currentUser?.uid;
    const isEditMode = !!reminderId;
    return uid ? `chat_history_${uid}${isEditMode ? '_edit' : ''}` : null;
  }, [reminderId]);

  const saveChatHistory = useCallback((chatMessages) => {
    const key = getChatHistoryKey();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(chatMessages));
      } catch (error) {
        console.error('Error saving chat history:', error);
        // If localStorage is full, try to clear old data
        try {
          const keys = Object.keys(localStorage);
          const chatKeys = keys.filter(k => k.startsWith('chat_history_'));
          if (chatKeys.length > 10) {
            // Remove oldest chat history
            const oldestKey = chatKeys[0];
            localStorage.removeItem(oldestKey);
            localStorage.setItem(key, JSON.stringify(chatMessages));
          }
        } catch (e) {
          console.error('Could not save chat history:', e);
        }
      }
    }
  }, [getChatHistoryKey]);

  const loadChatHistory = useCallback(() => {
    const key = getChatHistoryKey();
    if (key) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
    return null;
  }, [getChatHistoryKey]);

  const clearChatHistory = useCallback(() => {
    const key = getChatHistoryKey();
    if (key) {
      localStorage.removeItem(key);
    }
  }, [getChatHistoryKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          navigate('/dashboard');
          return;
        }

        const context = await aiService.getUserContext(uid);
        setUserContext(context);

        let initialMessage = {
          id: 1,
          type: 'ai',
          content: "Hi there! 🎉 I'm your My Reminder AI assistant. I can help you create birthday and anniversary reminders. Who would you like to set a reminder for? You can add as many as you'd like!"
        };

        // Load chat history if not in edit mode
        if (!reminderId) {
          const savedMessages = loadChatHistory();
          if (savedMessages && savedMessages.length > 0) {
            setMessages(savedMessages);
            setIsLoading(false);
            return;
          }
        }

        if (reminderId) {
          const reminderRef = ref(database, `reminders/${uid}/${reminderId}`);
          const snapshot = await get(reminderRef);
          if (snapshot.exists()) {
            const existingData = snapshot.val();
            // Convert old format to new format
            const convertedData = {
              personName: existingData.personName || '',
              date: existingData.dateOfBirth || existingData.date || '',
              relationship: existingData.relationship || '',
              reminderType: existingData.reminderType || 'birthday',
              note: existingData.note || ''
            };
            setReminderData({ id: reminderId, ...convertedData });
            initialMessage.content = `I see you want to edit the reminder for ${convertedData.personName}. What would you like to change?`;
          } else {
            navigate('/chat'); // Fallback if reminder not found
          }
        }
        
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setMessages([{ id: 1, type: 'ai', content: 'Oops! Something went wrong. Please try refreshing the page.' }]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [reminderId, navigate, loadChatHistory]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages, saveChatHistory]);

  const saveReminderToFirebase = async (data) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');

      // Prepare data based on reminder type
      let reminderType = data.reminderType || 'birthday';
      if (reminderType !== 'birthday' && reminderType !== 'anniversary') {
        reminderType = 'coming_soon';
      }
      let firebaseData = {
        reminderType: reminderType,
        note: data.note || '',
        updatedAt: new Date().toISOString()
      };
      if (reminderType === 'birthday') {
        firebaseData.dateOfBirth = data.dateOfBirth || data.date;
        firebaseData.personName = data.personName;
        firebaseData.relationship = data.relationship || '';
      } else if (reminderType === 'anniversary') {
        firebaseData.date = data.date;
        firebaseData.personName = data.personName;
        firebaseData.partnerName = data.partnerName || '';
      }

      if (reminderId) {
        // Update existing reminder
        const reminderRef = ref(database, `reminders/${uid}/${reminderId}`);
        await set(reminderRef, firebaseData);
        return reminderId;
      } else {
        // Create new reminder
        firebaseData.createdAt = new Date().toISOString();
        const remindersRef = ref(database, `reminders/${uid}`);
        const newReminderRef = push(remindersRef);
        await set(newReminderRef, firebaseData);
        return newReminderRef.key;
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await aiService.processChat(
        newMessages,
        reminderData,
        !!reminderId,
        userContext
      );

      setReminderData(aiResponse.updatedData);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.response
      };
      setMessages(prev => [...prev, aiMessage]);

      if (aiResponse.isComplete) {
        // Ensure all required fields are present before saving
        const reminderType = aiResponse.updatedData.reminderType || 'birthday';
        let hasRequiredFields = true;
        let missingField = '';
        if (reminderType === 'birthday') {
          if (!aiResponse.updatedData.personName) {
            hasRequiredFields = false;
            missingField = 'person name';
          }
          if (!aiResponse.updatedData.dateOfBirth) {
            hasRequiredFields = false;
            missingField = 'date of birth';
          }
        } else if (reminderType === 'anniversary') {
          if (!aiResponse.updatedData.personName) {
            hasRequiredFields = false;
            missingField = 'person name';
          }
          if (!aiResponse.updatedData.date) {
            hasRequiredFields = false;
            missingField = 'date';
          }
        }
        if (!hasRequiredFields) {
          const errorMessage = {
            id: Date.now() + 2,
            type: 'ai',
            content: `❌ I need the ${missingField} to save this ${reminderType}. Could you please provide that?`
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        // Prevent duplicate saves in a single session
        if (messages.some(m => m.type === 'ai' && m.content.includes('Perfect! I'))) {
          return;
        }
        // Save to Firebase
        try {
          await saveReminderToFirebase(aiResponse.updatedData);
          const successMessage = {
            id: Date.now() + 2,
            type: 'ai',
            content: `✅ Perfect! I've ${reminderId ? 'updated' : 'saved'} the ${aiResponse.updatedData.reminderType || 'reminder'}! 🎉\n\nWant to add another reminder? Just tell me about it!`
          };
          setMessages(prev => [...prev, successMessage]);
          // Clear reminder data for new reminder
          if (!reminderId) {
            setReminderData({
              personName: '',
              partnerName: '',
              date: '',
              relationship: '',
              reminderType: 'birthday',
              note: ''
            });
          }
        } catch (error) {
          console.error('Error saving reminder:', error);
          const errorMessage = {
            id: Date.now() + 2,
            type: 'ai',
            content: '❌ Sorry, there was an error saving the reminder. Please try again.'
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '❌ Sorry, there was an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      clearChatHistory();
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: "Hi there! 🎉 I'm your My Reminder AI assistant. I can help you create birthday and anniversary reminders. Who would you like to set a reminder for? You can add as many as you'd like!"
      }]);
    }
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        borderBottom: '2px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#fff',
            border: '2px solid #fff',
            color: '#000',
            padding: '12px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#000';
            e.target.style.color = '#fff';
            e.target.style.borderColor = '#fff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#fff';
            e.target.style.color = '#000';
            e.target.style.borderColor = '#fff';
          }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          margin: '0',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center'
        }}>
          <FaRobot style={{ marginRight: '12px' }} /> My Reminder AI
        </h1>
        <button
          onClick={handleClearChat}
          style={{
            background: 'transparent',
            border: '2px solid #fff',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#fff';
            e.target.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#fff';
          }}
        >
          Clear
        </button>
      </header>

      {/* Chat Messages */}
      <div className="chat-messages" style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minHeight: 0
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-container ${message.type}`}
          >
            <div className="message-bubble"
              style={{
                maxWidth: '75%',
                padding: '16px 20px',
                borderRadius: '20px',
                backgroundColor: message.type === 'user' ? '#000' : '#fff',
                color: message.type === 'user' ? '#fff' : '#333',
                fontSize: '16px',
                lineHeight: '1.5',
                wordWrap: 'break-word',
                border: message.type === 'user' ? '2px solid #000' : '2px solid #000',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: '20px',
              backgroundColor: '#fff',
              color: '#333',
              fontSize: '16px',
              border: '2px solid #000',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaRobot style={{ animation: 'typing 1.4s infinite' }} />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{
        padding: '20px',
        borderTop: '2px solid #000',
        backgroundColor: '#fff',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '24px',
                border: '2px solid #000',
                backgroundColor: '#f8f9fa',
                color: '#333',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#666';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#000';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '16px',
              borderRadius: '50%',
              border: '2px solid #000',
              backgroundColor: inputValue.trim() && !isLoading ? '#000' : '#f8f9fa',
              color: inputValue.trim() && !isLoading ? '#fff' : '#666',
              fontSize: '18px',
              fontWeight: '600',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? '...' : <FaPaperPlane />}
          </button>
        </form>
      </div>

      <style jsx>{`
        .message-container {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 16px;
        }
        .message-container.user {
          justify-content: flex-end;
        }

        @keyframes typing {
          0%, 20%, 60%, 100% { opacity: 1; }
          40%, 80% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ChatPage;