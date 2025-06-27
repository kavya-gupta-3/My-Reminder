import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import ReminderDetails from './pages/ReminderDetails';
import { useFCMToken } from './fcmSetup';

function App() {
  useFCMToken();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/reminder/:id" element={<ReminderDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
