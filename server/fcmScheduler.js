const express = require('express');
const admin = require('firebase-admin');
const cron = require('node-cron');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://birthdayreminder-a5def-default-rtdb.firebaseio.com'
});

const db = admin.database();
const app = express();
const PORT = process.env.PORT || 5002;

// Helper: Send FCM with better notification content
async function sendFCM(token, title, body, data = {}) {
  try {
    await admin.messaging().send({
      token,
      notification: { 
        title, 
        body,
        tag: 'birthday-reminder'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          icon: '/birthday-cake.png',
          color: '#000000',
          priority: 'high',
          channel_id: 'birthday-reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
            category: 'birthday-reminder'
          }
        }
      },
      webpush: {
        notification: {
          icon: '/birthday-cake.png',
          badge: '/birthday-cake.png',
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
          link: getNotificationLink(reminder)
        }
      },
      token: token
    });
    console.log('Notification sent:', title, body);
  } catch (err) {
    console.error('FCM send error:', err);
  }
}

// Helper: Get all users and reminders
async function getAllUsersWithReminders() {
  const usersSnap = await db.ref('users').once('value');
  const users = usersSnap.val() || {};
  const result = [];
  for (const uid in users) {
    const user = users[uid];
    if (!user.fcmToken) continue;
    const remindersSnap = await db.ref(`reminders/${uid}`).once('value');
    const reminders = remindersSnap.val() || {};
    for (const rid in reminders) {
      result.push({
        uid,
        fcmToken: user.fcmToken,
        reminder: { ...reminders[rid], id: rid }
      });
    }
  }
  return result;
}

// Helper: Calculate notification times with better scheduling
function getNotificationTimes(dateOfBirth) {
  // dateOfBirth: MM/DD/YYYY
  const [month, day, year] = dateOfBirth.split('/');
  const now = new Date();
  let birthday = new Date(now.getFullYear(), month - 1, day);
  if (birthday < now) birthday = new Date(now.getFullYear() + 1, month - 1, day);

  // Better notification times
  return [
    { label: '1 week', time: new Date(birthday.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { label: '1 day', time: new Date(birthday.getTime() - 24 * 60 * 60 * 1000) },
    { label: '6 hours', time: new Date(birthday.getTime() - 6 * 60 * 60 * 1000) },
    { label: '1 hour', time: new Date(birthday.getTime() - 1 * 60 * 60 * 1000) },
    { label: 'midnight', time: new Date(birthday.setHours(0,0,0,0)) }
  ];
}

// Helper: Generate personalized notification messages
function generateNotificationMessage(reminder, timeLabel) {
  const { personName, relationship } = reminder;
  
  const messages = {
    '1 week': [
      `🎂 ${personName}'s birthday is coming up in a week!`,
      `⏰ Don't forget! ${personName}'s birthday is in 7 days`,
      `📅 ${personName}'s special day is just around the corner!`
    ],
    '1 day': [
      `🎉 Tomorrow is ${personName}'s birthday!`,
      `📱 ${personName}'s birthday is tomorrow - time to prepare!`,
      `✨ Get ready to celebrate ${personName} tomorrow!`
    ],
    '6 hours': [
      `⏰ ${personName}'s birthday is in 6 hours!`,
      `🎂 ${personName}'s special day is almost here!`,
      `📱 Don't miss ${personName}'s birthday celebration!`
    ],
    '1 hour': [
      `🎉 ${personName}'s birthday is in 1 hour!`,
      `⏰ Almost time to celebrate ${personName}!`,
      `🎂 ${personName}'s special moment is approaching!`
    ],
    'midnight': [
      `🎂 Happy Birthday, ${personName}! 🎉`,
      `🎉 It's ${personName}'s birthday today!`,
      `✨ Today is ${personName}'s special day!`
    ]
  };

  const messageArray = messages[timeLabel] || messages['midnight'];
  return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// Main cron job: runs every 5 minutes for better timing
cron.schedule('*/5 * * * *', async () => {
  console.log('Running birthday notification cron...');
  const usersWithReminders = await getAllUsersWithReminders();
  const now = new Date();

  for (const { uid, fcmToken, reminder } of usersWithReminders) {
    const times = getNotificationTimes(reminder.dateOfBirth);
    for (const { label, time } of times) {
      // If notification time is within the last 5 minutes
      if (Math.abs(now - time) < 5 * 60 * 1000) {
        const message = generateNotificationMessage(reminder, label);
        const title = label === 'midnight' 
          ? `🎂 Happy Birthday, ${reminder.personName}!`
          : `🎂 ${reminder.personName}'s Birthday Reminder`;

        await sendFCM(
          fcmToken,
          title,
          message,
          {
            reminderId: reminder.id,
            personName: reminder.personName,
            type: 'birthday-reminder'
          }
        );
      }
    }
  }
});

// Endpoint for instant notifications (when reminder is created)
app.post('/api/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    await sendFCM(token, title, body, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Instant notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`FCM scheduler running on port ${PORT}`));