const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "birthdayreminder-a5def",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://birthdayreminder-a5def-default-rtdb.firebaseio.com"
  });
}

app.post('/api/generate', async (req, res) => {
  console.log('Received /api/generate request');
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// Send notification endpoint
app.post('/api/send-notification', async (req, res) => {
  try {
    const { token, title, body, data = {} } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const getNotificationLink = (data) => {
      if (data && data.reminderId) {
        return `https://myreminder.xyz/reminder/${data.reminderId}`;
      }
      return 'https://myreminder.xyz/';
    };

    const message = {
      notification: {
        title: title || 'Birthday Reminder',
        body: body || 'You have a birthday reminder!',
        icon: '/logo.png',
        badge: '/logo.png'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          icon: '/logo.png',
          color: '#FF6B6B',
          priority: 'high',
          sound: 'default',
          channel_id: 'birthday-reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'birthday-reminder'
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Reminder'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        },
        fcm_options: {
          link: getNotificationLink(data)
        }
      },
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send notification to multiple users
app.post('/api/send-notification-to-users', async (req, res) => {
  try {
    const { userIds, title, body, data = {} } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // Get FCM tokens for users
    const tokens = [];
    for (const userId of userIds) {
      try {
        const userRef = admin.database().ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        if (userData && userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      } catch (error) {
        console.error(`Error getting token for user ${userId}:`, error);
      }
    }

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No valid FCM tokens found' });
    }

    const getNotificationLink = (data) => {
      if (data && data.reminderId) {
        return `https://myreminder.xyz/reminder/${data.reminderId}`;
      }
      return 'https://myreminder.xyz/';
    };

    const multicastMessage = {
      notification: {
        title: title || 'Birthday Reminder',
        body: body || 'You have a birthday reminder!',
        icon: '/logo.png',
        badge: '/logo.png'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          icon: '/logo.png',
          color: '#FF6B6B',
          priority: 'high',
          sound: 'default',
          channel_id: 'birthday-reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'birthday-reminder'
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Reminder'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        },
        fcm_options: {
          link: getNotificationLink(data)
        }
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(multicastMessage);
    console.log('Multicast notification sent:', response);
    res.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
