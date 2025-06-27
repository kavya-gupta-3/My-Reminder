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

// Helper: Send FCM
async function sendFCM(token, title, body) {
  try {
    await admin.messaging().send({
      token,
      notification: { title, body }
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
        reminder: reminders[rid]
      });
    }
  }
  return result;
}

// Helper: Calculate notification times
function getNotificationTimes(dateOfBirth) {
  // dateOfBirth: MM/DD/YYYY
  const [month, day, year] = dateOfBirth.split('/');
  const now = new Date();
  let birthday = new Date(now.getFullYear(), month - 1, day);
  if (birthday < now) birthday = new Date(now.getFullYear() + 1, month - 1, day);

  // Notification times (in ms)
  return [
    { label: '24h', time: new Date(birthday.getTime() - 24 * 60 * 60 * 1000) },
    { label: '12h', time: new Date(birthday.getTime() - 12 * 60 * 60 * 1000) },
    { label: '3h',  time: new Date(birthday.getTime() - 3  * 60 * 60 * 1000) },
    { label: '1h',  time: new Date(birthday.getTime() - 1  * 60 * 60 * 1000) },
    { label: 'midnight', time: new Date(birthday.setHours(0,0,0,0)) }
  ];
}

// Main cron job: runs every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Running birthday notification cron...');
  const usersWithReminders = await getAllUsersWithReminders();
  const now = new Date();

  for (const { uid, fcmToken, reminder } of usersWithReminders) {
    const times = getNotificationTimes(reminder.dateOfBirth);
    for (const { label, time } of times) {
      // If notification time is within the last 10 minutes
      if (Math.abs(now - time) < 10 * 60 * 1000) {
        await sendFCM(
          fcmToken,
          `🎂 ${reminder.personName}'s Birthday!`,
          label === 'midnight'
            ? `It's ${reminder.personName}'s birthday today! 🎉`
            : `${reminder.personName}'s birthday is in ${label.replace('h', ' hour(s)').replace('midnight', 'less than 1 hour')}!`
        );
      }
    }
  }
});

app.listen(PORT, () => console.log(`FCM scheduler running on port ${PORT}`));