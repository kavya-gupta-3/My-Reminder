import * as chrono from 'chrono-node';

class AIService {
  // Parse natural date input to MM/DD/YYYY format
  parseNaturalDate(dateInput) {
    if (!dateInput || typeof dateInput !== 'string') {
      return null;
    }

    try {
      // Try to parse with chrono
      const parsed = chrono.parse(dateInput);
      if (parsed && parsed.length > 0) {
        const date = parsed[0].start.date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    return null;
  }

  async generateReminderMessage(reminderData, userContext = null, size = 'medium') {
    try {
      // Build context from user's existing reminders
      let userContextInfo = '';
      if (userContext && userContext.reminders) {
        const existingReminders = userContext.reminders
          .filter(r => r.id !== reminderData.id) // Exclude current reminder
          .map(r => `${r.personName} (${r.relationship}, ${r.reminderType || 'reminder'})`)
          .join(', ');
        
        if (existingReminders) {
          userContextInfo = `\n\nUser's other reminders: ${existingReminders}`;
        }
      }

      // Message size logic
      let sizePrompt = '';
      let maxTokens = 100;
      if (size === 'small') {
        sizePrompt = 'Keep it very short (1-2 sentences, 15-25 words).';
        maxTokens = 60;
      } else if (size === 'large') {
        sizePrompt = 'Make it a bit longer and more heartfelt (4-6 sentences, up to 80 words).';
        maxTokens = 200;
      } else {
        sizePrompt = 'Keep it short and sweet (2-3 sentences, 30-40 words).';
        maxTokens = 100;
      }

      const currentDate = new Date().toLocaleDateString();
      const reminderType = reminderData.reminderType || 'reminder';
      
      let typeSpecificPrompt = '';
      if (reminderType === 'birthday') {
        typeSpecificPrompt = `Generate a personalized birthday message for ${reminderData.personName}.`;
      } else if (reminderType === 'anniversary') {
        typeSpecificPrompt = `Generate a personalized anniversary message for ${reminderData.personName}.`;
      } else if (reminderType === 'meeting') {
        typeSpecificPrompt = `Generate a friendly reminder message for ${reminderData.personName}'s meeting.`;
      } else if (reminderType === 'bill') {
        typeSpecificPrompt = `Generate a helpful reminder message for ${reminderData.personName}'s bill payment.`;
      } else {
        typeSpecificPrompt = `Generate a personalized ${reminderType} message for ${reminderData.personName}.`;
      }

      const prompt = `You are a friendly AI assistant that creates personalized ${reminderType} messages. Today's date is ${currentDate}.\n\nIMPORTANT RULES:\n- Always be warm, caring, and appropriate for the reminder type\n- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, 📅, 💝, etc.)\n- ${sizePrompt}\n- Make them feel personal and genuine\n- Don't be overly formal or generic\n- Don't use inappropriate humor or references\n- Focus on positive wishes and helpful reminders\n\n${typeSpecificPrompt}\n      \nContext:\n- Person: ${reminderData.personName}\n- Reminder Type: ${reminderType}\n- Date: ${reminderData.date}\n- Relationship: ${reminderData.relationship}\n- Notes: ${reminderData.note || 'No specific notes'}${userContextInfo}\n\nCreate a heartfelt message that feels like it's coming from a caring friend or family member.`;

      // Use backend proxy
      const response = await fetch('https://birthday-reminder-i1uf.onrender.com/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a friendly AI assistant that creates personalized ${reminderType} messages. You are warm, caring, and creative. You follow the rules strictly and create appropriate, celebratory messages.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating reminder message:', error);
      // Fallback to a simple message if AI fails
      const reminderType = reminderData.reminderType || 'reminder';
      return `🎉 Happy ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} ${reminderData.personName}! Wishing you a wonderful day filled with joy and success!`;
    }
  }

  async processChat(messages, reminderData, isEditing, userContext) {
    try {
      let userContextInfo = '';
      if (userContext) {
        if (userContext.user && userContext.user.name) {
          userContextInfo += `\n- User's name: ${userContext.user.name}`;
        }
        if (userContext.reminders && userContext.reminders.length > 0) {
          userContextInfo += `\n- User has ${userContext.reminders.length} existing reminders.`;
          const reminderList = userContext.reminders.map(r => `${r.personName || r.title} (${r.relationship || r.type}, ${r.reminderType || 'reminder'})`).join(', ');
          userContextInfo += `\n- Existing reminders: ${reminderList}`;
        }
      }

      const systemPrompt = `You are a sophisticated AI assistant in a reminder app called "My Reminder". Your goal is to help users create or edit reminders through a natural conversation. Today's date is ${new Date().toLocaleDateString()}.

IMPORTANT: Different reminder types require different information:

1. **Birthday/Anniversary**: Requires person name, date, relationship
2. **Meeting**: Requires meeting title/topic, date, location (optional), attendees (optional)
3. **Bill**: Requires bill name/company, due date, amount (optional)
4. **Task/Event**: Requires event title, date, description (optional)
5. **Custom**: Can be anything - ask what's needed

Ask only the information relevant to the reminder type. Don't ask for person name for meetings, bills, or tasks unless it's a personal meeting.

${userContextInfo}

Respond in JSON format:
{
  "response": "Your conversational response",
  "updatedData": {
    "personName": "Name (only for personal events)",
    "title": "Title for meetings/tasks/bills",
    "date": "MM/DD/YYYY",
    "relationship": "Relationship (only for personal events)",
    "reminderType": "birthday|anniversary|meeting|bill|task|custom",
    "location": "Location (for meetings)",
    "attendees": "Attendees (for meetings)",
    "amount": "Amount (for bills)",
    "note": "Additional notes"
  },
  "isComplete": true/false,
  "missingFields": ["field1", "field2"]
}

Be conversational, friendly, and professional. Ask one question at a time.`;

      // Use backend proxy
      const response = await fetch('https://birthday-reminder-i1uf.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.type === 'ai' ? 'assistant' : 'user', content: msg.content }))
          ],
          max_tokens: 400,
          temperature: 0.5,
          response_format: { "type": "json_object" },
        })
      });

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        // Return a fallback response instead of throwing
        return {
          response: "I'm having trouble connecting right now. Please try again in a moment.",
          updatedData: reminderData,
          isComplete: false,
          missingFields: []
        };
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(aiResponse);
        return {
          response: parsed.response,
          updatedData: { ...reminderData, ...parsed.updatedData },
          isComplete: parsed.isComplete || false,
          missingFields: parsed.missingFields || []
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return {
          response: aiResponse,
          updatedData: reminderData,
          isComplete: false,
          missingFields: []
        };
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      return {
        response: "I'm having trouble processing your request. Please try again.",
        updatedData: reminderData,
        isComplete: false,
        missingFields: []
      };
    }
  }

  // New method to get user context from Firebase
  async getUserContext(userId) {
    try {
      const { database, ref, get } = await import('../firebase');
      
      // Get user profile
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : null;

      // Get user's reminders
      const remindersRef = ref(database, `reminders/${userId}`);
      const remindersSnapshot = await get(remindersRef);
      let reminders = [];
      
      if (remindersSnapshot.exists()) {
        const remindersData = remindersSnapshot.val();
        reminders = Object.keys(remindersData).map(key => ({
          id: key,
          ...remindersData[key]
        }));
      }

      return {
        user: userData,
        reminders: reminders
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return { user: null, reminders: [] };
    }
  }

  // Direct, robust reminder message generation (no chat, no JSON, no follow-up)
  async generateDirectReminderMessage(reminderData, userContext = null, size = 'medium') {
    try {
      const currentDate = new Date().toLocaleDateString();
      
      let userContextInfo = '';
      if (userContext) {
        if (userContext.user && userContext.user.name) {
          userContextInfo += `\n- User's name: ${userContext.user.name}`;
        }
        if (userContext.reminders && userContext.reminders.length > 0) {
          userContextInfo += `\n- User has ${userContext.reminders.length} existing reminders.`;
        }
      }

      const systemPrompt = `You are an AI assistant that generates personalized messages for different types of reminders. Today's date is ${currentDate}.

Generate a message based on the reminder type:

**Birthday**: Warm, celebratory message mentioning the person's name and age (if available)
**Anniversary**: Romantic, milestone-focused message
**Meeting**: Professional reminder about the meeting topic, time, and location
**Bill**: Reminder about payment due, amount, and consequences of late payment
**Task/Event**: Motivational message about the upcoming task or event
**Custom**: Appropriate tone based on the event type

${userContextInfo}

Message should be ${size === 'small' ? 'brief (1-2 sentences)' : size === 'medium' ? 'moderate length (2-3 sentences)' : 'detailed (3-4 sentences)'}.

Reminder data: ${JSON.stringify(reminderData)}`;

      const userPrompt = `Generate a ${size} message for this ${reminderData.reminderType || 'reminder'}.`;

      const response = await fetch('https://birthday-reminder-i1uf.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 200,
          temperature: 1.2
        })
      });
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        // Return a fallback message instead of throwing
        const reminderType = reminderData.reminderType || 'reminder';
        const title = reminderData.title || reminderData.personName || 'this event';
        return `🎉 Happy ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)}! Wishing you a wonderful day for ${title}!`;
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating direct reminder message:', error);
      const reminderType = reminderData.reminderType || 'reminder';
      const title = reminderData.title || reminderData.personName || 'this event';
      return `🎉 Happy ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)}! Wishing you a wonderful day for ${title}!`;
    }
  }

  // Legacy method for backward compatibility
  async generateBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }

  async generateDirectBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateDirectReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }
}

const aiService = new AIService();
export default aiService; 