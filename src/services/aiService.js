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
        }
      }

      // Determine the current conversation state and reminder type
      const lastUserMessage = messages.filter(m => m.type === 'user').pop()?.content.toLowerCase() || '';
      const currentReminderType = reminderData.reminderType || 'birthday';
      
      // Check if user is specifying a reminder type
      let detectedType = currentReminderType;
      if (lastUserMessage.includes('birthday') || lastUserMessage.includes('birth')) {
        detectedType = 'birthday';
      } else if (lastUserMessage.includes('anniversary') || lastUserMessage.includes('anniversary')) {
        detectedType = 'anniversary';
      } else if (lastUserMessage.includes('meeting') || lastUserMessage.includes('appointment')) {
        detectedType = 'meeting';
      } else if (lastUserMessage.includes('bill') || lastUserMessage.includes('payment') || lastUserMessage.includes('due')) {
        detectedType = 'bill';
      } else if (lastUserMessage.includes('task') || lastUserMessage.includes('todo')) {
        detectedType = 'task';
      }

      // Update reminder type if detected
      if (detectedType !== currentReminderType) {
        reminderData.reminderType = detectedType;
      }

      // Try to parse date from user message
      const parsedDate = this.parseNaturalDate(lastUserMessage);
      if (parsedDate && !reminderData.date) {
        reminderData.date = parsedDate;
      }

      // Type-specific prompts and logic
      let systemPrompt = '';
      let isComplete = false;
      let response = '';

      switch (detectedType) {
        case 'birthday':
          systemPrompt = `You are a birthday reminder assistant. Ask for:
1. Person's name
2. Birthday date (MM/DD/YYYY)
3. Relationship (optional)

Be friendly and celebratory. Ask one question at a time.`;
          
          if (!reminderData.personName) {
            response = "🎂 Great! I'll help you set up a birthday reminder. What's the person's name?";
          } else if (!reminderData.date) {
            response = `Perfect! When is ${reminderData.personName}'s birthday? (You can say "March 15" or "March 15, 1990")`;
          } else if (reminderData.date && !reminderData.relationship) {
            response = `Awesome! What's your relationship with ${reminderData.personName}? (e.g., friend, family, colleague)`;
            isComplete = true; // Relationship is optional
          } else {
            response = `🎉 Perfect! I've saved ${reminderData.personName}'s birthday on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
          break;

        case 'anniversary':
          systemPrompt = `You are an anniversary reminder assistant. Ask for:
1. Person's name or couple names
2. Anniversary date (MM/DD/YYYY)
3. Type of anniversary (optional)

Be romantic and supportive. Ask one question at a time.`;
          
          if (!reminderData.personName) {
            response = "💕 I'll help you set up an anniversary reminder. Who is this anniversary for? (e.g., 'John and Sarah' or 'Our wedding')";
          } else if (!reminderData.date) {
            response = `When is ${reminderData.personName}'s anniversary? (You can say "June 10" or "June 10, 2020")`;
          } else if (reminderData.date) {
            response = `💖 Perfect! I've saved ${reminderData.personName}'s anniversary on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
          break;

        case 'meeting':
          systemPrompt = `You are a meeting reminder assistant. Ask for:
1. Meeting topic/title
2. Meeting date and time
3. Location (optional)

Be professional and concise. Ask one question at a time.`;
          
          if (!reminderData.title && !reminderData.personName) {
            response = "📅 I'll help you set up a meeting reminder. What's the meeting about?";
          } else if (!reminderData.date) {
            const meetingTitle = reminderData.title || reminderData.personName;
            response = `When is the "${meetingTitle}" meeting? (You can say "Tomorrow at 2 PM" or "March 20 at 10 AM")`;
          } else if (reminderData.date) {
            const meetingTitle = reminderData.title || reminderData.personName;
            response = `✅ Perfect! I've saved the "${meetingTitle}" meeting on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
          break;

        case 'bill':
          systemPrompt = `You are a bill reminder assistant. Ask for:
1. Bill name or company
2. Due date
3. Amount (optional)

Be helpful and practical. Ask one question at a time.`;
          
          if (!reminderData.title && !reminderData.personName) {
            response = "💰 I'll help you set up a bill reminder. What bill is this for? (e.g., 'Electricity bill' or 'Netflix')";
          } else if (!reminderData.date) {
            const billName = reminderData.title || reminderData.personName;
            response = `When is the ${billName} due? (You can say "March 25" or "Next Friday")`;
          } else if (reminderData.date) {
            const billName = reminderData.title || reminderData.personName;
            response = `💳 Perfect! I've saved the ${billName} due on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
          break;

        case 'task':
          systemPrompt = `You are a task reminder assistant. Ask for:
1. Task title
2. Due date
3. Description (optional)

Be motivational and encouraging. Ask one question at a time.`;
          
          if (!reminderData.title && !reminderData.personName) {
            response = "📝 I'll help you set up a task reminder. What task do you need to remember?";
          } else if (!reminderData.date) {
            const taskTitle = reminderData.title || reminderData.personName;
            response = `When do you need to complete "${taskTitle}"? (You can say "Tomorrow" or "March 30")`;
          } else if (reminderData.date) {
            const taskTitle = reminderData.title || reminderData.personName;
            response = `🎯 Perfect! I've saved the task "${taskTitle}" due on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
          break;

        default:
          systemPrompt = `You are a general reminder assistant. Ask for:
1. Event title
2. Date
3. Description (optional)

Be helpful and friendly. Ask one question at a time.`;
          
          if (!reminderData.title && !reminderData.personName) {
            response = "📌 I'll help you set up a reminder. What event or thing do you want to remember?";
          } else if (!reminderData.date) {
            const eventTitle = reminderData.title || reminderData.personName;
            response = `When is "${eventTitle}"? (You can say "March 15" or "Next Monday")`;
          } else if (reminderData.date) {
            const eventTitle = reminderData.title || reminderData.personName;
            response = `✅ Perfect! I've saved "${eventTitle}" on ${reminderData.date}. Want to add another reminder?`;
            isComplete = true;
          }
      }

      // For edit mode, provide different response
      if (isEditing) {
        response = `I see you want to edit this ${detectedType} reminder. What would you like to change?`;
        isComplete = false;
      }

      return {
        response: response,
        updatedData: { ...reminderData, reminderType: detectedType },
        isComplete: isComplete,
        missingFields: []
      };

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