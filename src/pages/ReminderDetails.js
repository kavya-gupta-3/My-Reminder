import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, database, ref, get, remove, update } from '../firebase';
import aiService from '../services/aiService';
import { FaArrowLeft, FaBirthdayCake, FaEdit, FaRegClock, FaRegCommentDots, FaRobot, FaTrash, FaSyncAlt, FaShareAlt, FaCopy, FaWhatsapp, FaEnvelope, FaSms } from 'react-icons/fa';
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
  const [regenCount] = useState(0);
  const [regenLimitReached, setRegenLimitReached] = useState(false);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const [loadError, setLoadError] = useState('');

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
        navigate('/');
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

  const calculateAge = (dateOfBirth) => {
    const [month, day, year] = dateOfBirth.split('/');
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
      padding: '0 20px 40px 20px'
    }}>
      {/* Header */}
      <header className="header" style={{
        padding: '30px 0',
        textAlign: 'center',
        borderBottom: '2px solid #000',
        marginBottom: '40px',
        backgroundColor: '#fff',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => navigate('/')}
          className="header-button"
          style={{
            background: '#000',
            border: '2px solid #000',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#fff';
            e.target.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#000';
            e.target.style.color = '#fff';
          }}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} /> Back
        </button>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.02em',
          color: '#000'
        }}>
          <FaBirthdayCake style={{ marginRight: '16px' }} /> {reminder.personName}'s Birthday
        </h1>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Birthday Info Card */}
        <div style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
          border: '2px solid #000'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <span style={{
              fontSize: '3rem',
              marginRight: '20px'
            }}>
              <FaBirthdayCake />
            </span>
            <div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 8px 0',
                color: '#000'
              }}>
                {reminder.personName}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#666',
                margin: '0'
              }}>
                {reminder.relationship} • Age {calculateAge(reminder.dateOfBirth)}
              </p>
            </div>
          </div>

          <div
            className="responsive-grid" 
            style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #000'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}><FaBirthdayCake /></div>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#000' }}>Birthday</div>
              <div style={{ color: '#666' }}>
                {new Date(reminder.dateOfBirth).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {reminder.note && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #000'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}><FaRegCommentDots /></div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#000' }}>Note</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  {reminder.note}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Countdown Timer */}
        <div style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
          border: '2px solid #000'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 30px 0',
            color: '#000'
          }}>
            {isToday ? "🎉 It's Today!" : <><FaRegClock style={{ marginRight: '10px' }} />Countdown to Birthday</>}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.days}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Days</div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.hours}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Hours</div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.minutes}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Minutes</div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #000'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#000'
              }}>
                {countdown.seconds}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Seconds</div>
            </div>
          </div>
        </div>

        {/* AI Generated Message */}
        <div style={{
          backgroundColor: '#fff',
          color: '#333',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
          border: '2px solid #000'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px'
          }}>
            <span style={{ fontSize: '2rem', marginRight: '15px' }}><FaRobot /></span>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0',
              color: '#000'
            }}>
              AI Birthday Message
            </h3>
            <select value={messageSize} onChange={e => setMessageSize(e.target.value)} style={{ marginLeft: 'auto', fontSize: '1rem', borderRadius: '8px', border: '1px solid #000', padding: '4px 10px' }} disabled={aiLoading}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <button onClick={handleRegenerate} disabled={aiLoading || regenLimitReached} style={{ marginLeft: '10px', background: regenLimitReached ? '#ccc' : '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: aiLoading || regenLimitReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <FaSyncAlt /> Regenerate
            </button>
          </div>
          {regenLimitReached && (
            <div style={{ color: '#ff6b6b', fontSize: '0.95rem', marginBottom: '10px', textAlign: 'right' }}>
              Daily regeneration limit reached (15/15)
            </div>
          )}
          {aiLoading ? (
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #000'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}><FaRobot /></div>
              <p style={{ margin: '0', color: '#666' }}>Generating personalized message...</p>
            </div>
          ) : (
            <div>
              {aiMessage && aiMessage.startsWith('Error') ? (
                <div style={{
                  color: '#ff6b6b',
                  background: '#fff0f0',
                  border: '1px solid #ff6b6b',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  fontWeight: 600
                }}>{aiMessage}</div>
              ) : (
                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  color: '#333',
                  margin: '0',
                  fontStyle: 'italic',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #000'
                }}>
                  {aiMessage}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', margin: '16px 0 0 0', flexWrap: 'wrap' }}>
                <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}><FaCopy /> Copy</button>
              </div>
              {userContext && userContext.user && (
                <p style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  margin: '10px 0 0 0',
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
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleEdit}
            style={{
              padding: '16px 32px',
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <FaEdit style={{ marginRight: '8px' }} /> Edit Reminder
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: '#ff6b6b',
              border: '2px solid #ff6b6b',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
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
            <FaTrash style={{ marginRight: '8px', color: '#ff6b6b', background: '#fff', borderRadius: '50%', border: '1px solid #ff6b6b', padding: '2px' }} /> Delete
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: '16px 32px',
              backgroundColor: '#007aff',
              color: '#fff',
              border: '2px solid #007aff',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
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
              borderRadius: '16px',
              padding: '32px',
              minWidth: '260px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              border: '2px solid #000',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#000' }}>Share Message</h4>
              <button onClick={handleWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}><FaWhatsapp /> WhatsApp</button>
              <button onClick={handleEmail} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0072c6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}><FaEnvelope /> Email</button>
              {isMobile && <button onClick={handleSMS} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}><FaSms /> SMS</button>}
              <button onClick={closeShareFallback} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007aff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .header, header {
            padding: 18px 0 !important;
          }
          h1, h2 {
            font-size: 1.3rem !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .header, header {
            padding: 10px 0 !important;
          }
          h1, h2 {
            font-size: 1.1rem !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .action-buttons {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .action-buttons button {
            min-width: 100px !important;
            padding: 12px 8px !important;
            font-size: 0.95rem !important;
          }
        }
        @media (max-width: 400px) {
          .header, header {
            padding: 4px 0 !important;
          }
          h1, h2 {
            font-size: 0.95rem !important;
          }
          .responsive-grid {
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReminderDetails;
