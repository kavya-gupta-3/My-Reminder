import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInAnonymously
} from '../firebase';
import { FaGoogle, FaUserSecret } from 'react-icons/fa';

function LoginForm() {
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const loginAnonymously = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: '20px',
        padding: '40px 20px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        border: '2px solid #000',
        margin: '20px 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎂</div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          fontWeight: '700',
          margin: '0 0 10px 0',
          letterSpacing: '-0.02em',
          color: '#000'
        }}>
          Birthday Remind
        </h1>
        <p style={{
          color: '#666',
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          margin: '0 0 40px 0',
          lineHeight: '1.5'
        }}>
          Never miss a special day. Login to start managing your birthday reminders.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button
            onClick={loginWithGoogle}
            style={{
              padding: '16px 20px',
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              borderRadius: '12px',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              minHeight: '48px'
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
            <FaGoogle style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>Continue with Google</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#000'
            }}></div>
            <span style={{
              padding: '0 16px',
              color: '#666',
              fontSize: '0.9rem'
            }}>or</span>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#000'
            }}></div>
          </div>

          <button
            onClick={loginAnonymously}
            style={{
              padding: '16px 20px',
              backgroundColor: 'transparent',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '12px',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              minHeight: '48px'
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
            <FaUserSecret style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>Continue without account</span>
          </button>
        </div>

        <p style={{
          color: '#666',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.85rem)',
          margin: '30px 0 0 0',
          lineHeight: '1.4'
        }}>
          Your data will be stored locally and securely. You can always create an account later to sync across devices.
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
