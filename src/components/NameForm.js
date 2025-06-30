import React, { useState, useEffect } from 'react';
import { auth, database, ref, get, set } from '../firebase';

function NameForm() {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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
            setIsEditing(false);
          } else {
            setIsEditing(true);
          }
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserName();
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = ref(database, `users/${uid}`);
      await set(userRef, { name: name.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  if (loading) return null;

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '2px solid #000'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          color: '#000'
        }}>
          What's your name?
        </h3>
        <form onSubmit={saveName} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '16px',
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
            disabled={!name.trim()}
            style={{
              padding: '16px 24px',
              backgroundColor: name.trim() ? '#000' : '#f8f9fa',
              color: name.trim() ? '#fff' : '#666',
              border: '2px solid #000',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (name.trim()) {
                e.target.style.backgroundColor = '#fff';
                e.target.style.color = '#000';
              }
            }}
            onMouseLeave={(e) => {
              if (name.trim()) {
                e.target.style.backgroundColor = '#000';
                e.target.style.color = '#fff';
              }
            }}
          >
            Save
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      color: '#333',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      border: '2px solid #000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          color: '#000'
        }}>
          Welcome back, {name}!
        </h3>
        <p style={{
          color: '#666',
          fontSize: '16px',
          margin: '0'
        }}>
          Ready to manage your birthday reminders
        </p>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        style={{
          padding: '12px 16px',
          backgroundColor: 'transparent',
          color: '#000',
          border: '2px solid #000',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#000';
          e.target.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#000';
        }}
      >
        Edit
      </button>
    </div>
  );
}

export default NameForm;
