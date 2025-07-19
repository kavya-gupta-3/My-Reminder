# 🎂 MyReminder - Never Miss a Special Day

<div align="center">

![MyReminder Logo](public/Logo192.png)

**A modern, AI-powered birthday reminder app that ensures you never forget another special day!**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://myreminder.xyz/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge)](https://myreminder.xyz/)
[![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-orange?style=for-the-badge)](#)

</div>

## ✨ Features

### 🤖 **AI-Powered Personalization**
- **Smart Birthday Messages**: Generate personalized, heartfelt birthday messages using advanced AI
- **Relationship-Based Tone**: Messages adapt based on your relationship (family, friends, colleagues, romantic partners)
- **Multiple Message Sizes**: Choose from small, medium, or large message formats
- **Natural Language**: Messages sound human-written, not AI-generated

### 🔔 **Smart Notifications**
- **Push Notifications**: Get reminded on web, mobile, and desktop
- **Perfect Timing**: Notifications sent at the ideal time to ensure you never miss a birthday
- **Cross-Platform**: Works on iOS, Android, and desktop browsers
- **Offline Support**: PWA capabilities for reliable notifications

### 💬 **Conversational Interface**
- **AI Chat Assistant**: Add reminders through natural conversation
- **Continuous Chat**: Add multiple reminders in one session
- **Edit Mode**: Update existing reminders via chat
- **Smart Data Validation**: AI ensures proper date formats and complete information

### 📱 **Installable Web App**
- **Install on Any Device**: Add to home screen on mobile and desktop
- **Offline Functionality**: Works without internet connection
- **App-Like Experience**: Full-screen mode with native app feel
- **Auto-Update**: Always get the latest features

### 🎨 **Modern UI/UX**
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Dark Header Theme**: Sleek black headers with white text
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Responsive Design**: Perfect on any screen size

### ⚡ **Quick Actions**
- **Manual Editing**: Click pencil icons to edit names, dates, and notes inline
- **One-Click Sharing**: Share birthday messages via WhatsApp, email, or SMS
- **Copy Messages**: Instantly copy AI-generated messages to clipboard
- **Real-Time Countdown**: Live countdown to each birthday

## 🚀 Live Demo

Experience MyReminder now: **[https://myreminder.xyz/](https://myreminder.xyz/)**

### Install as PWA:
1. **Mobile (iOS/Android)**: Visit the link and tap "Add to Home Screen"
2. **Desktop**: Click the install prompt or use browser's install option
3. **Chrome**: Look for the install icon in the address bar

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - Modern UI library with hooks
- **React Router** - Client-side routing
- **React Icons** - Beautiful icon components
- **CSS-in-JS** - Styled components approach

### **Backend & Database**
- **Node.js & Express** - RESTful API server
- **Firebase Realtime Database** - Real-time data synchronization
- **Firebase Authentication** - Secure user management
- **Firebase Cloud Messaging** - Push notifications

### **AI & External Services**
- **OpenRouter API** - Advanced AI text generation
- **OpenAI GPT-4** - Natural language processing
- **Custom AI Prompts** - Relationship-aware message generation

### **Deployment & DevOps**
- **Vercel** - Frontend hosting with auto-deployment
- **Render** - Backend API hosting
- **GitHub Actions** - Continuous integration
- **Installable Web App** - Service worker implementation

### **Development Tools**
- **Create React App** - Development environment
- **ESLint & Prettier** - Code quality and formatting
- **Git** - Version control
- **VS Code** - Development IDE

## 📥 Installation & Setup

### **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- OpenRouter API key

### **1. Clone Repository**
   ```bash
git clone https://github.com/kavya-gupta-3/MyReminder.git
cd MyReminder
   ```

### **2. Install Dependencies**
   ```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
   npm install
cd ..
```

### **3. Environment Configuration**

Create `.env` file in the `server` directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_CLIENT_CERT_URL=your_firebase_client_cert_url
PORT=5001
```

### **4. Firebase Setup**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google & Anonymous)
3. Enable Realtime Database
4. Enable Cloud Messaging
5. Update `src/firebase.js` with your Firebase config

### **5. Run Development Servers**

**Frontend:**
   ```bash
   npm start
# Runs on http://localhost:3000
```

**Backend:**
```bash
cd server
npm start
# Runs on http://localhost:5001
```

## 🎯 Usage Guide

### **Getting Started**
1. **Visit the App**: Open in any modern browser
2. **Login**: Use Google account or continue anonymously
3. **Add Your Name**: Set your display name for personalization
4. **Create Reminders**: Click the '+' button or use AI chat

### **Adding Birthday Reminders**
1. **AI Chat Method**:
   - Click the floating '+' button
   - Tell the AI who's birthday you want to add
   - Provide name, date, relationship, and optional notes
   - AI confirms and saves the reminder

2. **Manual Edit Method**:
   - Go to any reminder details page
   - Click pencil icons to edit fields directly
   - Save changes instantly

### **Managing Notifications**
1. **Enable Notifications**: Allow when prompted
2. **Install PWA**: Add to home screen for reliable notifications
3. **Notification Schedule**: 
   - 1 week before
   - 1 day before  
   - 6 hours before
   - 1 hour before
   - Midnight on birthday

### **Sharing Messages**
1. **Generate Message**: AI creates personalized birthday message
2. **Customize Size**: Choose small, medium, or large
3. **Regenerate**: Get different variations (15 per day limit)
4. **Share**: Copy, WhatsApp, email, or SMS

## 🔧 Configuration

### **Customizing AI Messages**
Edit `src/services/aiService.js` to modify:
- Relationship categories
- Tone guidelines
- Message templates
- Generation limits

### **Notification Settings**
Modify `server/fcmScheduler.js` to adjust:
- Notification timing
- Message templates
- Scheduling frequency

### **UI Customization**
Update styles in:
- `src/index.css` - Global styles
- Component files - Component-specific styles
- `public/manifest.json` - PWA theme colors

## 🚀 Deployment

### **Frontend (Vercel)**
1. Connect GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. Environment variables handled in Vercel dashboard

### **Backend (Render)**
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Auto-deploy on push to main branch

### **Custom Domain**
1. Configure custom domain in Vercel
2. Update Firebase authorized domains
3. Update manifest.json start_url

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**
- Follow existing code style
- Add comments for complex logic
- Test on multiple devices
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live App**: [https://myreminder.xyz/](https://myreminder.xyz/)
- **GitHub Repository**: [https://github.com/kavya-gupta-3/MyReminder](https://github.com/kavya-gupta-3/MyReminder)
- **Backend API**: [https://myreminder.xyz/api](https://myreminder.xyz/api)

## 📞 Support

Having issues? Get help:

- **GitHub Issues**: [Create an issue](https://github.com/kavya-gupta-3/MyReminder/issues)
- **Documentation**: Check this README
- **Community**: Join our discussions

## 🙏 Acknowledgments

- **OpenRouter** for AI API services
- **Firebase** for backend infrastructure  
- **Vercel** for hosting platform
- **React** community for amazing tools
- **Contributors** who make this project better

---

<div align="center">

**Made with ❤️ for keeping relationships strong**

[⭐ Star this repo](https://github.com/kavya-gupta-3/MyReminder) | [🐛 Report Bug](https://github.com/kavya-gupta-3/MyReminder/issues) | [✨ Request Feature](https://github.com/kavya-gupta-3/MyReminder/issues)

</div>
