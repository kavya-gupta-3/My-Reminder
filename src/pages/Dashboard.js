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
      padding: '0 20px 100px 20px'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 0',
        textAlign: 'center',
        borderBottom: '2px solid #000',
        marginBottom: '30px',
        backgroundColor: '#fff',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* User menu button top right */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: '#000',
              color: '#fff',
              border: '2px solid #000',
              borderRadius: '50%',
              padding: '8px',
              width: '40px',
              height: '40px',
              fontWeight: 600,
              fontSize: '1rem',
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
              top: 50,
              right: 10,
              background: '#fff',
              border: '2px solid #000',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              zIndex: 101,
              minWidth: '120px'
            }}>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.02em',
          color: '#000',
          paddingRight: '60px'
        }}>
          Birthday Remind
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          color: '#666',
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          fontWeight: '400'
        }}>
          Never miss a special day
        </p>
      </header>

      {/* User Name Form */}
      <div style={{ marginBottom: '30px' }}>
        <NameForm />
      </div>

      {/* Reminders Section */}
      <section>
        <h2 style={{
          fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
          fontWeight: '600',
          marginBottom: '25px',
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
            borderRadius: '20px',
            border: '2px solid #000',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
            <p>Loading your reminders...</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
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
                    borderRadius: '16px',
                    padding: '16px 20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => navigate(`/reminder/${reminder.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#000',
                      border: '2px solid #000',
                      flexShrink: 0
                    }}>
                      {icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.1rem',
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
                        fontSize: '0.9rem',
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
                        fontSize: '0.9rem',
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
                        fontSize: '0.9rem',
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
            borderRadius: '20px',
            border: '2px solid #000',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎂</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>No birthdays yet</h3>
            <p style={{ margin: '0', fontSize: '1rem' }}>
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
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#000',
          color: '#fff',
          border: '2px solid #000',
          fontSize: '28px',
          fontWeight: '300',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2)';
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
          padding: 0 20px 100px 20px;
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0 15px 100px 15px;
          }
          header {
            padding: 15px 0 !important;
            margin-bottom: 20px !important;
          }
        }
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 0 10px 100px 10px;
          }
          header {
            padding: 10px 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
