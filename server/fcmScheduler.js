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
function getNotificationTimes(dateString, reminderType = 'birthday') {
  // dateString: MM/DD/YYYY
  const [month, day, year] = dateString.split('/');
  const now = new Date();
  let eventDate = new Date(now.getFullYear(), month - 1, day);
  if (eventDate < now) eventDate = new Date(now.getFullYear() + 1, month - 1, day);

  // Better notification times
  return [
    { label: '1 week', time: new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { label: '1 day', time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) },
    { label: '6 hours', time: new Date(eventDate.getTime() - 6 * 60 * 60 * 1000) },
    { label: '1 hour', time: new Date(eventDate.getTime() - 1 * 60 * 60 * 1000) },
    { label: 'midnight', time: new Date(eventDate.setHours(0,0,0,0)) }
  ];
}

// Helper: Generate personalized notification messages
function generateNotificationMessage(reminder, timeLabel) {
  const { personName, relationship, reminderType, partnerName } = reminder;
  const isAnniversary = reminderType === 'anniversary';
  const couple = partnerName ? `${personName} & ${partnerName}` : personName;
  const eventType = isAnniversary ? 'anniversary' : 'birthday';
  const emoji = isAnniversary ? '💖' : '🎂';
  
  const messages = {
    '1 week': [
      `${emoji} ${couple}'s ${eventType} is coming up in a week!`,
      `⏰ Don't forget! ${couple}'s ${eventType} is in 7 days`,
      `📅 ${couple}'s special day is just around the corner!`
    ],
    '1 day': [
      `🎉 Tomorrow is ${couple}'s ${eventType}!`,
      `📱 ${couple}'s ${eventType} is tomorrow - time to prepare!`,
      `✨ Get ready to celebrate ${couple} tomorrow!`
    ],
    '6 hours': [
      `⏰ ${couple}'s ${eventType} is in 6 hours!`,
      `${emoji} ${couple}'s special day is almost here!`,
      `📱 Don't miss ${couple}'s ${eventType} celebration!`
    ],
    '1 hour': [
      `🎉 ${couple}'s ${eventType} is in 1 hour!`,
      `⏰ Almost time to celebrate ${couple}!`,
      `${emoji} ${couple}'s special moment is approaching!`
    ],
    'midnight': [
      `${emoji} Happy ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}, ${couple}! 🎉`,
      `🎉 It's ${couple}'s ${eventType} today!`,
      `✨ Today is ${couple}'s special day!`
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
    // Use appropriate date field based on reminder type
    const dateField = reminder.reminderType === 'anniversary' ? reminder.date : reminder.dateOfBirth;
    if (!dateField) continue; // Skip reminders without valid date
    
    const times = getNotificationTimes(dateField, reminder.reminderType);
    for (const { label, time } of times) {
      // If notification time is within the last 5 minutes
      if (Math.abs(now - time) < 5 * 60 * 1000) {
        const message = generateNotificationMessage(reminder, label);
        const eventType = reminder.reminderType === 'anniversary' ? 'Anniversary' : 'Birthday';
        const emoji = reminder.reminderType === 'anniversary' ? '💖' : '🎂';
        const title = label === 'midnight' 
          ? `${emoji} Happy ${eventType}, ${reminder.personName}!`
          : `${emoji} ${reminder.personName}'s ${eventType} Reminder`;

        await sendFCM(
          fcmToken,
          title,
          message,
          {
            reminderId: reminder.id,
            personName: reminder.personName,
            type: `${reminder.reminderType}-reminder`
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