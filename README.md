# 🎂 Birthday Remind

A modern, AI-powered birthday reminder web app built with React and Firebase. Never miss a special day with this beautiful, responsive application.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Chat Interface**: Create birthday reminders through an intuitive chat experience
- **Real-time Dashboard**: View all your birthday reminders in a beautiful card layout
- **Countdown Timers**: See exactly how many days until each birthday
- **Smart Notifications**: Visual indicators for upcoming birthdays (today, this week, this month)
- **Edit & Delete**: Manage your reminders with ease

### 🎨 Design
- **Modern Black & White Theme**: Clean, professional design
- **Responsive Layout**: Works perfectly on mobile, tablet, and desktop
- **Smooth Animations**: Hover effects and transitions for a polished experience
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 🔐 Authentication
- **Google Login**: Secure authentication with Google
- **Anonymous Login**: Quick access without creating an account
- **User Profiles**: Save your name and preferences

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd birthday-reminder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google and Anonymous)
   - Enable Realtime Database
   - Copy your Firebase config

4. **Configure Firebase**
   - Open `src/firebase.js`
   - Replace the Firebase config with your own:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 How to Use

### 1. Login
- Choose between Google login or anonymous access
- Enter your name to personalize the experience

### 2. Dashboard
- View all your birthday reminders
- See countdown timers and upcoming birthdays
- Click the "+" button to add a new reminder

### 3. Create Reminders
- Chat with the AI assistant
- Provide the person's name, birthday, age, relationship, and notes
- The AI will save the reminder to your dashboard

### 4. Manage Reminders
- Click on any reminder card to view details
- See the countdown timer and AI-generated birthday message
- Edit or delete reminders as needed

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router
- **Backend**: Firebase (Authentication, Realtime Database)
- **Styling**: Inline styles with modern CSS
- **State Management**: React Hooks
- **Deployment**: Ready for Vercel, Netlify, or Firebase Hosting

## 📁 Project Structure

```
src/
├── components/
│   ├── LoginForm.js      # Authentication component
│   └── NameForm.js       # User name input
├── pages/
│   ├── Dashboard.js      # Main dashboard with reminders
│   ├── ChatPage.js       # AI chat interface
│   └── ReminderDetails.js # Individual reminder view
├── firebase.js           # Firebase configuration
├── App.js               # Main app component
└── index.js             # App entry point
```

## 🎯 Key Features Explained

### AI Chat Interface
The chat page simulates an AI conversation to collect birthday information:
- Person's name
- Date of birth
- Age
- Relationship
- Custom notes

### Real-time Updates
Using Firebase Realtime Database, all changes are instantly reflected across the app.

### Responsive Design
The app uses CSS Grid and Flexbox for a responsive layout that works on all devices.

### Countdown Logic
Smart countdown calculation that:
- Shows days until next birthday
- Handles year transitions
- Displays "Today!" for birthdays happening now

## 🔧 Customization

### Adding Real AI Integration
To integrate with OpenRouter/GPT-3.5:

1. Install the OpenRouter SDK:
   ```bash
   npm install openrouter
   ```

2. Update the ChatPage to use real AI responses
3. Add your API key to environment variables

### Styling Changes
All styles are inline for easy customization. The app uses a consistent color scheme:
- Background: `#000` (black)
- Cards: `#fff` (white)
- Accents: Various grays and the primary black/white theme

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add Firebase environment variables
3. Deploy automatically on push

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the Firebase console for authentication and database setup
2. Ensure all dependencies are installed
3. Verify your Firebase configuration
4. Check the browser console for errors

---

**Happy Birthday Reminding! 🎉**
