import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, database, ref, push, set, get, update } from '../firebase';
import aiService from '../services/aiService';
import { FaArrowLeft, FaPaperPlane, FaRobot, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reminderId = searchParams.get('edit');

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reminderData, setReminderData] = useState({
    personName: '',
    dateOfBirth: '',
    relationship: '',
    note: ''
  });
  const [userContext, setUserContext] = useState(null);
  const messagesEndRef = useRef(null);

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
          content: "Hi there! 🎉 I'm here to help you create birthday reminders. Who would you like to set a reminder for? You can add as many as you'd like!"
        };

        if (reminderId) {
          const reminderRef = ref(database, `reminders/${uid}/${reminderId}`);
          const snapshot = await get(reminderRef);
          if (snapshot.exists()) {
            const existingData = snapshot.val();
            setReminderData({ id: reminderId, ...existingData });
            initialMessage.content = `I see you want to edit the reminder for ${existingData.personName}. What would you like to change?`;
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
  }, [reminderId, navigate]);

  const saveReminderToFirebase = async (data) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');

      // Remove id field if present
      const { id, ...dataWithoutId } = data;

      if (reminderId) {
        // Update existing reminder
        const reminderRef = ref(database, `reminders/${uid}/${reminderId}`);
        await update(reminderRef, dataWithoutId);
        return reminderId;
      } else {
        // Create new reminder
        const remindersRef = ref(database, `reminders/${uid}`);
        const newReminderRef = push(remindersRef);
        await set(newReminderRef, {
          ...dataWithoutId,
          createdAt: new Date().toISOString(),
          userId: uid
        });
        
        // Send instant notification for new reminder creation
        try {
          // Get user's FCM token from database
          const userRef = ref(database, `users/${uid}`);
          const userSnap = await get(userRef);
          if (userSnap.exists() && userSnap.val().fcmToken) {
            const fcmToken = userSnap.val().fcmToken;
            
            // Call backend endpoint to send notification
            await fetch('https://birthday-reminder-i1uf.onrender.com/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: fcmToken,
                title: `🎉 Reminder Set for ${dataWithoutId.personName}`,
                body: `Birthday reminder for ${dataWithoutId.personName} has been created successfully! You'll be notified on their special day.`,
                data: {
                  reminderId: newReminderRef.key,
                  personName: dataWithoutId.personName,
                  type: 'reminder_created'
                }
              })
            });
            
            console.log('Reminder creation notification sent');
          }
        } catch (err) {
          console.error('Instant notification error:', err);
        }
        
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
        // Ensure age is not part of the saved data
        const { age, ...restOfData } = aiResponse.updatedData;
        await saveReminderToFirebase(restOfData);
        const confirmationMessage = {
          id: Date.now() + 2,
          type: 'ai',
          content: <><FaCheckCircle style={{ marginRight: '8px' }} /> Perfect! I've {reminderId ? 'updated' : 'saved'} the reminder for {aiResponse.updatedData.personName}! 🎉<br/><br/>Want to add another birthday reminder? Just tell me who it's for, or ask me anything else!</>
        };
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Reset reminder data for new reminder creation
        setReminderData({
          personName: '',
          dateOfBirth: '',
          relationship: '',
          note: ''
        });
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: <><FaExclamationCircle style={{ marginRight: '8px' }} /> Sorry, there was an error processing your request. Please try again.</>
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
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
          <FaRobot style={{ marginRight: '12px' }} /> AI Assistant
        </h1>
        <div style={{ width: '48px', flexShrink: 0 }}></div> {/* Spacer to balance the button */}
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
              <span style={{ animation: 'typing 1.4s infinite' }}>
                <FaRobot style={{ marginRight: '12px' }} /> AI is thinking...
              </span>
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