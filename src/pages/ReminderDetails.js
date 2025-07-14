import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, database, ref, get, remove, update } from '../firebase';
import aiService from '../services/aiService';
import { FaArrowLeft, FaBirthdayCake, FaEdit, FaRegClock, FaRegCommentDots, FaRobot, FaTrash, FaSyncAlt, FaShareAlt, FaCopy, FaWhatsapp, FaEnvelope, FaSms, FaPencilAlt } from 'react-icons/fa';
import './ReminderDetails.css';

function ReminderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(true);
  const [userContext] = useState(null);
  const [messageSize, setMessageSize] = useState('medium');
  const [regenLimitReached, setRegenLimitReached] = useState(false);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  // Edit states
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    personName: '',
    dateOfBirth: '',
    note: ''
  });

  // Helper to get today's date string
  const getToday = () => new Date().toISOString().slice(0, 10);

  // Load reminder, AI message, and regen count
  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoadError('You must be logged in to view this reminder.');
          setLoading(false);
          return;
        }
        const reminderRef = ref(database, `reminders/${uid}/${id}`);
        const snapshot = await get(reminderRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setReminder({ id, ...data });
          // Load saved AI message if exists
          if (data.aiMessage && data.aiMessageSize) {
            setAiMessage(data.aiMessage);
            setMessageSize(data.aiMessageSize);
            setAiLoading(false);
          } else {
            // Generate and save if not exists
            generateAndShowAIMessage(data, messageSize);
          }
          // Load regen count
          const userRef = ref(database, `users/${uid}`);
          const userSnap = await get(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.val();
            if (userData.regenDate === getToday()) {
              setRegenLimitReached((userData.regenCount || 0) >= 15);
            } else {
              setRegenLimitReached(false);
              await update(userRef, { regenCount: 0, regenDate: getToday() });
            }
          }
        } else {
          setLoadError('Reminder not found.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching reminder:', error);
        setLoadError('Error loading reminder. Please try again later.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    };
    fetchReminder();
    // eslint-disable-next-line
  }, [id, navigate]);

  useEffect(() => {
    if (!reminder) return;

    const calculateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const [month, day] = reminder.dateOfBirth.split('/');
      
      // Calculate this year's birthday occurrence using only month/day
      let birthday = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      
      // If birthday has passed this year, calculate for next year
      if (birthday < now) {
        birthday = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
      }

      const diff = birthday - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reminder]);

  // Check and update regen limit before generating a message
  const checkAndUpdateRegenLimit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    const userRef = ref(database, `users/${uid}`);
    const userSnap = await get(userRef);
    let newCount = 1;
    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (userData.regenDate === getToday()) {
        newCount = (userData.regenCount || 0) + 1;
        if (newCount > 15) {
          setRegenLimitReached(true);
          return false;
        }
      }
    }
    await update(userRef, { regenCount: newCount, regenDate: getToday() });
    setRegenLimitReached(newCount >= 15);
    return true;
  };

  // Generate and display AI message using direct birthday message generation
  const generateAndShowAIMessage = async (reminderData, size) => {
    // Enforce regen limit
    const allowed = await checkAndUpdateRegenLimit();
    if (!allowed) {
      setAiMessage('You have reached your daily limit for birthday message generations. Please try again tomorrow.');
      setAiLoading(false);
      return;
    }
    try {
      setAiLoading(true);
      const uid = auth.currentUser?.uid;
      // Get user context
      const context = await aiService.getUserContext(uid);
      // Use the new direct birthday message generation function
      const message = await aiService.generateDirectBirthdayMessage(reminderData, context, size);
      setAiMessage(message);
      setReminder(prev => ({
        ...prev,
        aiMessage: message,
        aiMessageSize: size
      }));
    } catch (error) {
      setAiMessage('Error generating message. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Regenerate AI message when messageSize changes
  useEffect(() => {
    if (!reminder) return;
    // Only regenerate if the current aiMessageSize does not match the selected size
    if (reminder.aiMessageSize !== messageSize) {
      generateAndShowAIMessage(reminder, messageSize);
    } else if (reminder.aiMessage) {
      setAiMessage(reminder.aiMessage);
      setAiLoading(false);
    }
    // eslint-disable-next-line
  }, [messageSize, reminder]);

  // Regenerate handler
  const handleRegenerate = async () => {
    if (regenLimitReached) return;
    setAiLoading(true);
    await generateAndShowAIMessage(reminder, messageSize);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        const uid = auth.currentUser?.uid;
        const reminderRef = ref(database, `reminders/${uid}/${id}`);
        await remove(reminderRef);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Error deleting reminder. Please try again.');
      }
    }
  };

  const handleEdit = () => {
    // Navigate to chat page with edit mode
    navigate(`/chat?edit=${id}`);
  };

  // Manual edit handlers
  const startEditing = (field) => {
    setEditingField(field);
    setEditValues({
      personName: reminder.personName,
      dateOfBirth: reminder.dateOfBirth,
      note: reminder.note || ''
    });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({
      personName: '',
      dateOfBirth: '',
      note: ''
    });
  };

  const saveEdit = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const reminderRef = ref(database, `reminders/${uid}/${id}`);
      
      // Validate date format
      if (editingField === 'dateOfBirth') {
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!dateRegex.test(editValues.dateOfBirth)) {
          alert('Please enter date in MM/DD/YYYY format');
          return;
        }
      }
      
      await update(reminderRef, {
        [editingField]: editValues[editingField]
      });
      
      setReminder(prev => ({
        ...prev,
        [editingField]: editValues[editingField]
      }));
      
      setEditingField(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
      alert('Error updating reminder. Please try again.');
    }
  };

  // Send message helpers
  const handleCopy = () => {
    navigator.clipboard.writeText(aiMessage);
    alert('Message copied!');
  };
  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(aiMessage)}`);
    setShowShareFallback(false);
  };
  const handleEmail = () => {
    window.open(`mailto:?subject=Birthday%20Message&body=${encodeURIComponent(aiMessage)}`);
    setShowShareFallback(false);
  };
  const handleSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(aiMessage)}`);
    setShowShareFallback(false);
  };
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Share handler using Web Share API
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Birthday Message for ${reminder.personName}`,
        text: aiMessage,
        url: window.location.href
      }).catch(() => {}); // Suppress share cancel error
    } else {
      setShowShareFallback(true);
    }
  };

  // Fallback close
  const closeShareFallback = () => setShowShareFallback(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          background: '#fff0f0',
          color: '#ff6b6b',
          border: '2px solid #ff6b6b',
          borderRadius: '16px',
          padding: '32px',
          minWidth: '260px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          textAlign: 'center',
          fontWeight: 600
        }}>{loadError}</div>
      </div>
    );
  }

  if (!reminder) {
    return null;
  }

  const isToday = countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '0 16px 60px 16px'
    }}>
      {/* Header */}
      <header className="header" style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderBottom: '2px solid #000',
        marginBottom: '32px',
        backgroundColor: '#000',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        margin: '0 -16px 32px -16px',
        position: 'relative'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="header-button"
          style={{
            background: '#fff',
            border: '2px solid #fff',
            color: '#000',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px'
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
          fontSize: '28px',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.02em',
          color: '#fff',
          paddingLeft: '68px',
          paddingRight: '68px',
          textAlign: 'center'
        }}>
          <FaBirthdayCake style={{ marginRight: '16px' }} /> {reminder.personName}'s Reminder
        </h1>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Birthday Info Card */}
        <div className="birthday-info-card" style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '2px solid #000',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{
              fontSize: '44px',
              marginRight: '20px'
            }}>
              <FaBirthdayCake />
            </span>
            <div>
              <h2 style={{
                fontSize: '26px',
                fontWeight: '700',
                margin: '0 0 6px 0',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {editingField === 'personName' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={editValues.personName}
                      onChange={(e) => setEditValues({...editValues, personName: e.target.value})}
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        width: '200px'
                      }}
                      autoFocus
                    />
                    <button onClick={saveEdit} style={{ padding: '4px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    <button onClick={cancelEditing} style={{ padding: '4px 8px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <>
                {reminder.personName}
                    <FaPencilAlt 
                      onClick={() => startEditing('personName')}
                      style={{ 
                        fontSize: '16px', 
                        cursor: 'pointer', 
                        color: '#666',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#000'}
                      onMouseLeave={(e) => e.target.style.color = '#666'}
                    />
                  </>
                )}
              </h2>
              <p style={{
                fontSize: '17px',
                color: '#666',
                margin: '0'
              }}>
                {reminder.relationship}
              </p>
            </div>
          </div>

          <div
            className="responsive-grid" 
            style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #000'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}><FaBirthdayCake /></div>
              <div style={{ fontWeight: '600', marginBottom: '6px', color: '#000', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Date
                <FaPencilAlt 
                  onClick={() => startEditing('dateOfBirth')}
                  style={{ 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    color: '#666',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#000'}
                  onMouseLeave={(e) => e.target.style.color = '#666'}
                />
              </div>
              <div style={{ color: '#666', fontSize: '15px' }}>
                {editingField === 'dateOfBirth' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <input
                      type="text"
                      value={editValues.dateOfBirth}
                      onChange={(e) => setEditValues({...editValues, dateOfBirth: e.target.value})}
                      placeholder="MM/DD/YYYY"
                      style={{
                        fontSize: '15px',
                        padding: '4px 8px',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        width: '120px',
                        textAlign: 'center'
                      }}
                      autoFocus
                    />
                    <button onClick={saveEdit} style={{ padding: '2px 6px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}> </button>
                    <button onClick={cancelEditing} style={{ padding: '2px 6px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}> </button>
                  </div>
                ) : (
                  // Always display MM/DD/YYYY
                  reminder.dateOfBirth
                )}
              </div>
            </div>

            {reminder.note ? (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '16px',
                border: '1px solid #000'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}><FaRegCommentDots /></div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#000', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Note
                  <FaPencilAlt 
                    onClick={() => startEditing('note')}
                    style={{ 
                      fontSize: '14px', 
                      cursor: 'pointer', 
                      color: '#666',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#000'}
                    onMouseLeave={(e) => e.target.style.color = '#666'}
                  />
                </div>
                <div style={{ color: '#666', fontSize: '15px' }}>
                  {editingField === 'note' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <textarea
                        value={editValues.note}
                        onChange={(e) => setEditValues({...editValues, note: e.target.value})}
                        placeholder="Add a note..."
                        style={{
                          fontSize: '15px',
                          padding: '8px',
                          border: '2px solid #000',
                          borderRadius: '8px',
                          width: '100%',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={saveEdit} style={{ padding: '4px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓ Save</button>
                        <button onClick={cancelEditing} style={{ padding: '4px 12px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕ Cancel</button>
                      </div>
                    </div>
                  ) : (
                    reminder.note || 'No note added'
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '16px',
                border: '1px solid #000',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}><FaRegCommentDots /></div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#000', fontSize: '17px' }}>Note</div>
                {editingField === 'note' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <textarea
                      value={editValues.note}
                      onChange={(e) => setEditValues({...editValues, note: e.target.value})}
                      placeholder="Add a note..."
                      style={{
                        fontSize: '15px',
                        padding: '8px',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        width: '100%',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveEdit} style={{ padding: '4px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓ Save</button>
                      <button onClick={cancelEditing} style={{ padding: '4px 12px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕ Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing('note')}
                    style={{
                      padding: '8px 16px',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    + Add Note
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="countdown-card" style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '2px solid #000',
          width: '100%'
        }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: '#000'
          }}>
            {isToday ? "🎉 It's Today!" : <><FaRegClock style={{ marginRight: '10px' }} />Countdown to Event</>}
          </h3>
          <div className="countdown-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.days}
              </div>
              <div style={{ color: '#666', fontSize: '15px' }}>Days</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.hours}
              </div>
              <div style={{ color: '#666', fontSize: '15px' }}>Hours</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.minutes}
              </div>
              <div style={{ color: '#666', fontSize: '15px' }}>Minutes</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.seconds}
              </div>
              <div style={{ color: '#666', fontSize: '15px' }}>Seconds</div>
            </div>
          </div>
        </div>

        {/* AI Generated Message */}
        <div className="ai-message-card" style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '2px solid #000',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '28px' }}><FaRobot /></span>
            <h3 style={{
                fontSize: '22px',
              fontWeight: '600',
              margin: '0',
              color: '#000'
            }}>
              AI Message
            </h3>
            </div>
            <div className="ai-controls" style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <select 
                value={messageSize} 
                onChange={e => setMessageSize(e.target.value)} 
                style={{ 
                  fontSize: '15px', 
                  borderRadius: '12px', 
                  border: '1px solid #000', 
                  padding: '8px 12px',
                  backgroundColor: '#fff',
                  minWidth: '80px'
                }} 
                disabled={aiLoading}
              >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
              <button 
                onClick={handleRegenerate} 
                disabled={aiLoading || regenLimitReached} 
                style={{ 
                  background: regenLimitReached ? '#ccc' : '#000', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '8px 16px', 
                  cursor: aiLoading || regenLimitReached ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontWeight: 600,
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  minHeight: '40px'
                }}
              >
              <FaSyncAlt /> Regenerate
            </button>
            </div>
          </div>
          {regenLimitReached && (
            <div style={{ color: '#ff6b6b', fontSize: '15px', marginBottom: '10px', textAlign: 'right' }}>
              Daily regeneration limit reached (15/15)
            </div>
          )}
          {aiLoading ? (
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #000'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}><FaRobot /></div>
              <p style={{ margin: '0', color: '#666', fontSize: '17px' }}>Generating personalized message...</p>
            </div>
          ) : (
            <div>
              {aiMessage && aiMessage.startsWith('Error') ? (
                <div style={{
                  color: '#ff6b6b',
                  background: '#fff0f0',
                  border: '1px solid #ff6b6b',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '17px'
                }}>{aiMessage}</div>
              ) : (
              <p style={{
                fontSize: '17px',
                lineHeight: '1.6',
                color: '#333',
                margin: '0 0 20px 0',
                fontStyle: 'italic',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '16px',
                border: '1px solid #000'
              }}>
                {aiMessage}
              </p>
              )}
              <div style={{ display: 'flex', gap: '12px', margin: '20px 0 0 0', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleCopy} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: '#000', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '12px 20px', 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  fontSize: '15px'
                }}><FaCopy /> Copy</button>
              </div>
              {userContext && userContext.user && (
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  margin: '12px 0 0 0',
                  textAlign: 'center'
                }}>
                  Personalized for {userContext.user.name} • Based on {userContext.reminders?.length || 0} existing reminders
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div 
          className="action-buttons"
          style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '0 20px',
          marginTop: '24px'
        }}>
          <button
            onClick={handleEdit}
            style={{
              padding: '16px 24px',
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <FaEdit /> Edit Reminder
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '16px 24px',
              backgroundColor: 'transparent',
              color: '#ff6b6b',
              border: '2px solid #ff6b6b',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ff6b6b';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#ff6b6b';
            }}
          >
            <FaTrash /> Delete
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: '16px 24px',
              backgroundColor: '#007aff',
              color: '#fff',
              border: '2px solid #007aff',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FaShareAlt /> Share
          </button>
        </div>
        {/* Share Fallback Modal */}
        {showShareFallback && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} onClick={closeShareFallback}>
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '32px',
              minWidth: '280px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              border: '2px solid #000',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '20px', color: '#000' }}>Share Message</h4>
              <button onClick={handleWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}><FaWhatsapp /> WhatsApp</button>
              <button onClick={handleEmail} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0072c6', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}><FaEnvelope /> Email</button>
              {isMobile && <button onClick={handleSMS} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}><FaSms /> SMS</button>}
              <button onClick={closeShareFallback} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#007aff', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .header, header {
            padding: 24px 16px !important;
          }
          h1, h2 {
            font-size: 24px !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .header, header {
            padding: 20px 12px !important;
          }
          h1, h2 {
            font-size: 20px !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .action-buttons {
            flex-direction: column !important;
            gap: 12px !important;
            margin-top: 40px !important;
          }
          .action-buttons button {
            min-width: 120px !important;
            padding: 14px 16px !important;
            font-size: 16px !important;
          }
          .ai-message-card {
            margin-bottom: 40px !important;
          }
          .ai-message-card p {
            margin-bottom: 24px !important;
          }
          .ai-message-card > div:first-child {
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 16px !important;
            flex-wrap: wrap !important;
          }
          .ai-message-card > div:first-child > div:first-child {
            justify-content: flex-start !important;
          }
          .ai-message-card .ai-controls {
            justify-content: flex-end !important;
            flex-wrap: nowrap !important;
          }
        }
        @media (max-width: 400px) {
          .header, header {
            padding: 16px 8px !important;
          }
          h1, h2 {
            font-size: 18px !important;
          }
          .responsive-grid {
            gap: 12px !important;
          }
          .action-buttons {
            margin-top: 48px !important;
          }
          .ai-message-card {
            margin-bottom: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReminderDetails;
