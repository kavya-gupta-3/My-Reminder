# 🤖 AI Training & User Context Guide

## Overview

The Birthday Remind app now includes advanced AI features with proper user context and training rules. This guide explains how the AI works and how to customize its behavior.

## 🔐 User Account Security

### Firebase Structure
```
/users/{userId}/
  - name: "User's name"
  - createdAt: "timestamp"

/reminders/{userId}/
  - {reminderId}/
    - personName: "Person's name"
    - dateOfBirth: "MM/DD/YYYY"
    - age: "25"
    - relationship: "friend"
    - note: "Special notes"
    - createdAt: "timestamp"
    - userId: "user's uid" (for security)
```

### Security Rules
- Users can only access their own data
- Reminders are automatically associated with the user who created them
- All data is validated before saving

## 🧠 AI Training & Behavior

### What the AI Does ✅

1. **Birthday Message Generation**
   - Creates personalized messages based on person details
   - Uses user's existing reminders for context
   - Follows warm, celebratory tone
   - Incorporates relationship and age appropriately

2. **Chat Assistance**
   - Guides users through reminder creation
   - Provides helpful responses based on current step
   - Uses user profile information for personalization
   - Maintains conversation context

3. **Context Awareness**
   - Knows user's name and existing reminders
   - Understands user's reminder patterns
   - Provides consistent, personalized responses

### What the AI Doesn't Do ❌

1. **Privacy Protection**
   - Never asks for personal information beyond birthday reminders
   - Doesn't store or share user data outside the app
   - Doesn't make inappropriate jokes or comments

2. **Content Restrictions**
   - No inappropriate humor or references
   - No overly formal or generic responses
   - No age-sensitive comments unless appropriate

3. **Behavioral Limits**
   - Stays focused on birthday reminder tasks
   - Doesn't engage in off-topic conversations
   - Maintains professional, friendly tone

## 🎯 AI Training Rules

### System Prompts

The AI uses carefully crafted system prompts that include:

```javascript
IMPORTANT RULES:
- Always be warm, caring, and celebratory
- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, etc.)
- Keep messages 2-3 sentences long
- Make them feel personal and genuine
- Don't be overly formal or generic
- Don't use inappropriate humor or references
- Don't mention specific ages if the person might be sensitive about it
- Focus on positive wishes and celebration
```

### User Context Integration

The AI receives comprehensive user context:

1. **User Profile**
   - User's name
   - Account creation date
   - Existing reminder count

2. **Reminder History**
   - List of existing birthday reminders
   - Relationship patterns
   - Age ranges of people in reminders

3. **Current Session**
   - Step-by-step progress
   - Previously collected information
   - Current input context

## 🔧 Customizing AI Behavior

### Modifying Training Rules

To customize AI behavior, edit the system prompts in `src/services/aiService.js`:

```javascript
// For birthday messages
const prompt = `You are a friendly AI assistant that creates personalized birthday messages. 

IMPORTANT RULES:
- [Your custom rules here]
- [Additional guidelines]
`;

// For chat responses
const systemPrompt = `You are a friendly AI assistant helping users create birthday reminders.

IMPORTANT RULES:
- [Your custom rules here]
- [Additional guidelines]
`;
```

### Adding New Context

To include additional user context:

```javascript
// In getUserContext method
async getUserContext(userId) {
  // Add your custom context here
  const customData = await getCustomUserData(userId);
  
  return {
    user: userData,
    reminders: reminders,
    custom: customData  // New context
  };
}
```

### Temperature and Token Settings

Adjust AI creativity and response length:

```javascript
// More creative responses
temperature: 0.9

// More focused responses
temperature: 0.3

// Longer responses
max_tokens: 300

// Shorter responses
max_tokens: 100
```

## 🚀 Best Practices

### 1. User Privacy
- Always validate user permissions
- Never expose other users' data
- Use secure authentication

### 2. AI Responses
- Test responses with various inputs
- Monitor for inappropriate content
- Provide fallback responses

### 3. Performance
- Cache user context when possible
- Handle API failures gracefully
- Use loading states for better UX

### 4. Security
- Validate all user inputs
- Sanitize data before AI processing
- Implement rate limiting

## 🔍 Monitoring & Debugging

### Console Logs
The app logs important events:
- User context fetching
- AI API calls
- Error handling

### Firebase Analytics
Track usage patterns:
- Reminder creation frequency
- AI interaction patterns
- User engagement metrics

## 📝 Example AI Interactions

### Birthday Message Generation
```
Input: {personName: "Sarah", age: "30", relationship: "sister", note: "loves chocolate"}
Context: User has 5 other reminders including family members
Output: "🎂 Happy Birthday Sarah! As your sister, I know how much you love chocolate, so I hope your day is filled with all your favorite treats and sweet moments. Here's to celebrating 30 amazing years and many more to come! ✨"
```

### Chat Assistance
```
User: "My friend John is turning 25"
Context: User has 3 existing reminders, this is step 1
AI: "Great! I'd love to help you create a birthday reminder for John. What's his full name?"
```

## 🛠️ Troubleshooting

### Common Issues

1. **AI Not Responding**
   - Check API key validity
   - Verify network connection
   - Check console for errors

2. **Inappropriate Responses**
   - Review system prompts
   - Adjust temperature settings
   - Add more specific rules

3. **User Context Missing**
   - Verify Firebase permissions
   - Check user authentication
   - Validate data structure

### Support
For issues with AI behavior or user context, check:
1. Firebase console for data structure
2. Browser console for errors
3. Network tab for API calls
4. AI service logs for debugging

---

**Remember**: The AI is designed to be helpful, safe, and respectful while maintaining user privacy and data security. 