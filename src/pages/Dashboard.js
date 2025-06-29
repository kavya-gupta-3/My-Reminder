import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database, ref, onValue, off, update } from '../firebase';
import LoginForm from '../components/LoginForm';
import NameForm from '../components/NameForm';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBirthdayCake, FaGift, FaCalendarCheck, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';

function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

        // Auto-rollover: if a birthday is more than 24h in the past, update its date to next year
        const now = new Date();
        const currentYear = now.getFullYear();
        for (const reminder of remindersArray) {
          const [month, day] = reminder.dateOfBirth.split('/');
          let birthday = new Date(currentYear, parseInt(month) - 1, parseInt(day));
          // If birthday was yesterday or earlier, and not today, roll over
          if (birthday < now && now - birthday > 24 * 60 * 60 * 1000) {
            const newBirthday = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
            const reminderRef = ref(database, `reminders/${uid}/${reminder.id}`);
            await update(reminderRef, { dateOfBirth: `${('0'+(newBirthday.getMonth()+1)).slice(-2)}/${('0'+newBirthday.getDate()).slice(-2)}/${newBirthday.getFullYear()}` });
            // Update in local array as well
            reminder.dateOfBirth = `${('0'+(newBirthday.getMonth()+1)).slice(-2)}/${('0'+newBirthday.getDate()).slice(-2)}/${newBirthday.getFullYear()}`;
          }
        }

        // Sort reminders: today's birthdays first, then upcoming
        remindersArray.sort((a, b) => {
          const now = new Date();
          const currentYear = now.getFullYear();
          const [monthA, dayA] = a.dateOfBirth.split('/');
          const [monthB, dayB] = b.dateOfBirth.split('/');
          let birthdayA = new Date(currentYear, parseInt(monthA) - 1, parseInt(dayA));
          let birthdayB = new Date(currentYear, parseInt(monthB) - 1, parseInt(dayB));
          // Today check
          const isTodayA = birthdayA.getDate() === now.getDate() && birthdayA.getMonth() === now.getMonth();
          const isTodayB = birthdayB.getDate() === now.getDate() && birthdayB.getMonth() === now.getMonth();
          if (isTodayA && !isTodayB) return -1;
          if (!isTodayA && isTodayB) return 1;
          // Otherwise, sort by soonest
          if (birthdayA < now) birthdayA = new Date(currentYear + 1, parseInt(monthA) - 1, parseInt(dayA));
          if (birthdayB < now) birthdayB = new Date(currentYear + 1, parseInt(monthB) - 1, parseInt(dayB));
          return birthdayA - birthdayB;
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
    if (!window.confirm('Are you sure you want to log out?')) return;
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      alert('Logout failed.');
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
    <div className="dashboard-container" style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '0 16px 100px 16px'
    }}>
      {/* Header */}
      <header style={{
        padding: '32px 20px',
        textAlign: 'center',
        borderBottom: '2px solid #000',
        marginBottom: '32px',
        backgroundColor: '#fff',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        position: 'relative',
        margin: '0 -16px 32px -16px'
      }}>
        {/* User menu button top right */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#000',
              color: '#fff',
              border: '2px solid #000',
              borderRadius: '50%',
              padding: '12px',
              width: '48px',
              height: '48px',
              fontWeight: 600,
              fontSize: '18px',
              cursor: 'pointer',
              zIndex: 100,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.color = '#000';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#000';
              e.target.style.color = '#fff';
            }}
          >
            <FaUser />
          </button>
          
          {/* User menu dropdown */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '20px',
              background: '#fff',
              border: '2px solid #000',
              borderRadius: '16px',
              padding: '12px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              zIndex: 101,
              minWidth: '140px'
            }}>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
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
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fff0f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.02em',
          color: '#000',
          paddingRight: '80px',
          paddingLeft: '20px'
        }}>
          Birthday Remind
        </h1>
        <p style={{
          margin: '12px 0 0 0',
          color: '#666',
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
          Upcoming Birthdays
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
              // Calculate days until birthday
              const now = new Date();
              const currentYear = now.getFullYear();
              const [month, day] = reminder.dateOfBirth.split('/');
              let birthday = new Date(currentYear, parseInt(month) - 1, parseInt(day));
              
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

              return (
                <div
                  key={reminder.id}
                  style={{
                    backgroundColor: '#fff',
                    color: '#333',
                    borderRadius: '20px',
                    padding: '18px 24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '80px'
                  }}
                  onClick={() => navigate(`/reminder/${reminder.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
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
                        color: '#000'
                      }}>
                        {new Date(reminder.dateOfBirth).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p style={{
                        color: '#666',
                        fontSize: '15px',
                        margin: '0'
                      }}>
                        Turns {getUpcomingAge(reminder.dateOfBirth)}
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
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎂</div>
            <h3 style={{ margin: '0 0 12px 0', color: '#000', fontSize: '24px' }}>No birthdays yet</h3>
            <p style={{ margin: '0', fontSize: '18px' }}>
              Add your first birthday reminder to get started!
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
        aria-label="Add new birthday reminder"
      >
        <FaPlus />
      </button>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}

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
  );
}

export default Dashboard;
