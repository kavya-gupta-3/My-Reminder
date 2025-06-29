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
      height: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: '24px',
        padding: '24px 32px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '2px solid #000'
      }}>
        <div style={{ 
          fontSize: '56px', 
          marginBottom: '20px',
          lineHeight: 1
        }}>🎂</div>
        
        <h1 style={{
          fontSize: '26px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
          color: '#000'
        }}>
          Birthday Remind
        </h1>
        
        <p style={{
          color: '#666',
          fontSize: '15px',
          margin: '0 0 28px 0',
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
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              whiteSpace: 'nowrap',
              minHeight: '56px'
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
            <FaGoogle style={{ fontSize: '18px' }} />
            <span>Continue with Google</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#000'
            }}></div>
            <span style={{
              padding: '0 20px',
              color: '#666',
              fontSize: '14px',
              fontWeight: '500'
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
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              whiteSpace: 'nowrap',
              minHeight: '56px'
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
            <FaUserSecret style={{ fontSize: '18px' }} />
            <span>Continue without account</span>
          </button>
        </div>

        <p style={{
          color: '#666',
          fontSize: '14px',
          margin: '32px 0 0 0',
          lineHeight: '1.5'
        }}>
          Your data will be stored locally and securely. You can always create an account later to sync across devices.
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
