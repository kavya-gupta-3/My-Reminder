import React, { useState, useEffect } from 'react';
import { auth, database, ref, set, get } from '../firebase';
import { FaHandSparkles, FaUserEdit } from 'react-icons/fa';

function NameForm() {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.name) {
            setName(userData.name);
            setSaved(true);
          }
        }
      } catch (err) {
        console.error('Error fetching user name:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserName();
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await set(ref(database, `users/${uid}`), {
        name: name.trim()
      });
      setSaved(true);
    } catch (err) {
      console.error('Error saving name:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '2px solid #000',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '2px solid #000',
        textAlign: 'center'
      }}>
        <p style={{ 
          margin: '0', 
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#000'
        }}>
          Welcome, {name}!
        </p>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '0.9rem',
          color: '#666'
        }}>
          Ready to manage your birthday reminders
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      color: '#333',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      border: '2px solid #000'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <span style={{ fontSize: '1.5rem', marginRight: '12px' }}><FaHandSparkles /></span>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          margin: '0',
          color: '#000'
        }}>
          Welcome! What's your name?
        </h3>
      </div>

      <form onSubmit={saveName}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid #000',
              backgroundColor: '#f8f9fa',
              color: '#333',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#666';
              e.target.style.backgroundColor = '#fff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#000';
              e.target.style.backgroundColor = '#f8f9fa';
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '16px 24px',
            backgroundColor: name.trim() ? '#000' : '#f8f9fa',
            color: name.trim() ? '#fff' : '#666',
            border: '2px solid #000',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (name.trim()) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (name.trim()) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <FaUserEdit style={{ marginRight: '8px' }} /> Save & Continue
        </button>
      </form>
    </div>
  );
}

export default NameForm;
