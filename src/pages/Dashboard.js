import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database, ref, onValue, off } from '../firebase';
import LoginForm from '../components/LoginForm';
import NameForm from '../components/NameForm';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { useNavigate } from 'react-router-dom';
import { FaBirthdayCake, FaGift, FaCalendarCheck, FaSignOutAlt, FaComments } from 'react-icons/fa';
import { signOut } from 'firebase/auth';

function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking on the user button or dropdown menu
      const userMenuButton = event.target.closest('button');
      const dropdown = event.target.closest('[data-dropdown="user-menu"]');
      
      if (!userMenuButton && !dropdown) {
        setShowUserMenu(false);
      }
    };

    const handleTouchOutside = (event) => {
      // Don't close if touching the user button or dropdown menu
      const userMenuButton = event.target.closest('button');
      const dropdown = event.target.closest('[data-dropdown="user-menu"]');
      
      if (!userMenuButton && !dropdown) {
        setShowUserMenu(false);
      }
    };

    // Add event listeners for both click and touch
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setRemindersLoading(false);
      return;
    }

    const uid = user.uid;
    const remindersRef = ref(database, `reminders/${uid}`);
    
    setRemindersLoading(true);
    
    const unsubscribe = onValue(remindersRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let remindersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Modify sorting logic to prioritize running birthdays
        remindersArray.sort((a, b) => {
          const now = new Date();
          const currentYear = now.getFullYear();

          // Parse dates correctly - dateOfBirth is in MM/DD/YYYY format
          const [monthA, dayA] = a.dateOfBirth.split('/');
          const [monthB, dayB] = b.dateOfBirth.split('/');
          
          // Calculate this year's birthday occurrence
          let birthdayA = new Date(currentYear, parseInt(monthA) - 1, parseInt(dayA));
          let birthdayB = new Date(currentYear, parseInt(monthB) - 1, parseInt(dayB));
          
          // Check if the birthday is running (within 24 hours after the birthday)
          const isRunningA = now >= birthdayA && now < new Date(birthdayA.getTime() + 24 * 60 * 60 * 1000);
          const isRunningB = now >= birthdayB && now < new Date(birthdayB.getTime() + 24 * 60 * 60 * 1000);

          // Prioritize running birthdays
          if (isRunningA && !isRunningB) return -1;
          if (!isRunningA && isRunningB) return 1;

          // If both are running or neither, sort by closest date
          if (birthdayA < now) birthdayA = new Date(currentYear + 1, parseInt(monthA) - 1, parseInt(dayA));
          if (birthdayB < now) birthdayB = new Date(currentYear + 1, parseInt(monthB) - 1, parseInt(dayB));
          
          const daysUntilA = Math.ceil((birthdayA.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
          const daysUntilB = Math.ceil((birthdayB.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
          
          return daysUntilA - daysUntilB;
        });

        setReminders(remindersArray);
      } else {
        setReminders([]);
      }
      setRemindersLoading(false);
    }, (error) => {
      console.error('Error fetching reminders:', error);
      setRemindersLoading(false);
    });

    return () => off(remindersRef, 'value', unsubscribe);
  }, [user]);

  // Add logout handler
  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('Firebase signOut completed');
      
      // Force reload to ensure clean state
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      // Force reload even if signOut fails
      window.location.href = '/';
    }
  };

  if (loading) return (
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
  
  if (!user) return <LoginForm />;

  return (
    <>
      <PWAInstallPrompt />
    <div className="dashboard-container" style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '0 16px 100px 16px'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderBottom: '2px solid #000',
        marginBottom: '32px',
        backgroundColor: '#000',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        position: 'relative',
        margin: '0 -16px 32px -16px'
      }}>
        {/* User menu button top right */}
        <div style={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: '#fff',
              color: '#000',
              border: '2px solid #fff',
              borderRadius: '50%',
              padding: '12px',
              width: '48px',
              height: '48px',
              fontWeight: 600,
              fontSize: '18px',
              cursor: 'pointer',
              zIndex: 10000,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#333';
              e.target.style.color = '#fff';
              e.target.style.borderColor = '#fff';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.color = '#000';
              e.target.style.borderColor = '#fff';
            }}
            onTouchStart={e => {
              e.target.style.backgroundColor = '#333';
              e.target.style.color = '#fff';
            }}
            onTouchEnd={e => {
              setTimeout(() => {
                if (!showUserMenu) {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.color = '#000';
                }
              }, 150);
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 448 512"
              width="18" 
              height="18"
              fill="currentColor"
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
            </svg>
          </button>
          
          {/* User menu dropdown */}
          {showUserMenu && (
            <>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  touchAction: 'manipulation'
                }}
                onClick={() => setShowUserMenu(false)}
                onTouchEnd={() => setShowUserMenu(false)}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: '60px',
                  right: '0px',
                  background: '#fff',
                  border: '2px solid #000',
                  borderRadius: '16px',
                  padding: '8px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  zIndex: 9999,
                  minWidth: '120px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                data-dropdown="user-menu"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    setTimeout(() => handleLogout(), 100);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowUserMenu(false);
                    setTimeout(() => handleLogout(), 100);
                  }}
                  style={{
                    color: '#ff6b6b',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.2s',
                    outline: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'manipulation',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fff0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <FaSignOutAlt style={{ pointerEvents: 'none' }} /> Logout
                </div>
              </div>
            </>
          )}
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.02em',
          color: '#fff',
          paddingRight: '20px',
          paddingLeft: '20px'
        }}>
                      MyReminder
        </h1>
        <p style={{
          margin: '12px 0 0 0',
          color: '#ccc',
          fontSize: '18px',
          fontWeight: '400',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}>
          Never miss a special day
        </p>
      </header>

      {/* User Name Form */}
      <div style={{ marginBottom: '32px' }}>
        <NameForm />
      </div>

      {/* Reminders Section */}
      <section>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '24px',
          color: '#000'
        }}>
          Upcoming Reminders
        </h2>
        
        {remindersLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
            backgroundColor: '#fff',
            borderRadius: '24px',
            border: '2px solid #000',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⏳</div>
            <p style={{ fontSize: '18px', margin: 0 }}>Loading your reminders...</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {reminders.map((reminder) => {
              // Calculate days until birthday - use only month/day, not birth year
              const now = new Date();
              const currentYear = now.getFullYear();
              const [month, day] = reminder.dateOfBirth.split('/');
              
              // Calculate this year's birthday occurrence 
              let birthday = new Date(currentYear, parseInt(month) - 1, parseInt(day));
              
              // If birthday has passed this year, calculate for next year
              if (birthday < now) {
                birthday = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
              }
              
              const diff = birthday.setHours(0,0,0,0) - now.setHours(0,0,0,0);
              const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
              
              let icon = <FaBirthdayCake />;
              if (daysUntil === 0) icon = <FaGift />;
              else if (daysUntil <= 7) icon = <FaGift style={{ color: '#ffa726' }}/>;
              else if (daysUntil <= 30) icon = <FaCalendarCheck style={{ color: '#4caf50' }}/>;

              // Helper to calculate the age they will turn on their next birthday
              const getUpcomingAge = (dateOfBirth) => {
                const [month, day, year] = dateOfBirth.split('/');
                const birthDate = new Date(year, month - 1, day);
                const now = new Date();
                let age = now.getFullYear() - birthDate.getFullYear();
                const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                if (now >= thisYearBirthday) {
                  age += 1;
                }
                return age;
              };

                // Add visual effects for running birthday reminders
                const runningStyle = {
                  border: '2px solid #FFD700', // Gold border
                  boxShadow: '0 0 10px #FFD700', // Gold glow
                  animation: 'pulse 2s infinite', // Pulsing effect
                };

                // Apply styles conditionally
                const reminderStyle = now >= birthday && now < new Date(birthday.getTime() + 24 * 60 * 60 * 1000) ? runningStyle : {};

              return (
                <div
                  key={reminder.id}
                  style={{
                    backgroundColor: '#fff',
                    color: '#333',
                    borderRadius: '16px',
                    padding: '14px 20px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '64px',
                      width: '100%',
                      ...reminderStyle
                  }}
                  onClick={() => navigate(`/reminder/${reminder.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#000',
                      border: '2px solid #000',
                      flexShrink: 0
                    }}>
                      {icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: '600',
                        margin: '0',
                        color: '#000',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {reminder.personName}
                      </h3>
                      <p style={{
                        color: '#666',
                        fontSize: '15px',
                        margin: '4px 0 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {reminder.relationship}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                     <p style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        margin: '0 0 4px 0',
                        color: daysUntil === 0 ? '#ff6b6b' : '#000'
                      }}>
                        {daysUntil === 0 ? '🎉 Today!' : 
                         daysUntil === 1 ? 'Tomorrow' :
                         `${daysUntil} days`}
                      </p>
                      <p style={{
                        color: '#666',
                        fontSize: '13px',
                        margin: '0'
                      }}>
                        {/* Show only month/day for next occurrence, not birth year */}
                        {new Date(currentYear, parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })} • Turns {getUpcomingAge(reminder.dateOfBirth)}
                      </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!remindersLoading && reminders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
            backgroundColor: '#fff',
            borderRadius: '24px',
            border: '2px solid #000',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📅</div>
            <h3 style={{ margin: '0 0 12px 0', color: '#000', fontSize: '24px' }}>No reminders yet</h3>
            <p style={{ margin: '0', fontSize: '18px' }}>
              Add your first reminder to get started!
            </p>
          </div>
        )}
      </section>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate('/chat')}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#000',
          color: '#fff',
          border: '2px solid #000',
          fontSize: '32px',
          fontWeight: '300',
          cursor: 'pointer',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
        }}
        aria-label="Add new reminder"
      >
        <FaComments />
      </button>

      <style jsx>{`
        .dashboard-container {
          padding: 0 16px 100px 16px;
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0 12px 100px 12px;
          }
          header {
            padding: 24px 16px !important;
            margin-bottom: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 0 8px 100px 8px;
          }
          header {
            padding: 20px 12px !important;
          }
        }
      `}</style>
    </div>
    </>
  );
}

export default Dashboard;
