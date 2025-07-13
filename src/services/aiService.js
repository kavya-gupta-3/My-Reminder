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

  // Extract person name from user input
  extractPersonName(input) {
    const namePatterns = [
      /(?:for|about|to)\s+([A-Za-z\s]+?)(?:\s+(?:birthday|anniversary|meeting|task|bill|exam|reminder))/i,
      /([A-Za-z\s]+?)(?:\s+(?:birthday|anniversary|meeting|task|bill|exam|reminder))/i,
      /(?:my|the)\s+([A-Za-z\s]+?)(?:\s+(?:birthday|anniversary|meeting|task|bill|exam|reminder))/i
    ];

    for (const pattern of namePatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  // Detect reminder type from user input
  detectReminderType(input) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('birthday') || lowerInput.includes('birth') || lowerInput.includes('bday')) {
      return 'birthday';
    } else if (lowerInput.includes('anniversary') || lowerInput.includes('wedding')) {
      return 'anniversary';
    } else if (lowerInput.includes('meeting') || lowerInput.includes('appointment') || lowerInput.includes('call')) {
      return 'meeting';
    } else if (lowerInput.includes('bill') || lowerInput.includes('payment') || lowerInput.includes('due')) {
      return 'bill';
    } else if (lowerInput.includes('task') || lowerInput.includes('todo') || lowerInput.includes('work')) {
      return 'task';
    } else if (lowerInput.includes('exam') || lowerInput.includes('test') || lowerInput.includes('assignment')) {
      return 'exam';
    }
    
    return null;
  }

  // Main AI conversation processor
  async processChat(messages, reminderData, isEditing, userContext) {
    try {
      const lastUserMessage = messages.filter(m => m.type === 'user').pop()?.content || '';
      const conversationHistory = messages.filter(m => m.type === 'user').map(m => m.content).join(' | ');
      
      // Get user's existing reminders for context
      let existingReminders = [];
      if (userContext && userContext.reminders) {
        existingReminders = userContext.reminders;
      }

      // If this is the first message or we're starting fresh
      if (messages.length <= 1 || (messages.length === 2 && messages[0].type === 'ai')) {
        return {
          response: "Hey! What kind of event would you like to set a reminder for?",
          updatedData: reminderData,
          isComplete: false,
          missingFields: []
        };
      }

      // Handle edit mode
      if (isEditing) {
        return this.handleEditMode(lastUserMessage, reminderData, existingReminders);
      }

      // Handle delete requests
      if (this.isDeleteRequest(lastUserMessage, existingReminders)) {
        return this.handleDeleteRequest(lastUserMessage, existingReminders);
      }

      // Handle view requests
      if (this.isViewRequest(lastUserMessage)) {
        return this.handleViewRequest(lastUserMessage, existingReminders);
      }

      // Handle reminder creation/editing
      return this.handleReminderCreation(lastUserMessage, reminderData, conversationHistory, existingReminders);

    } catch (error) {
      console.error('Error processing chat:', error);
      return {
        response: "I'm having trouble understanding. Can you tell me a bit more?",
        updatedData: reminderData,
        isComplete: false,
        missingFields: []
      };
    }
  }

  // Handle edit mode
  handleEditMode(userMessage, reminderData, existingReminders) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('name') || lowerMessage.includes('who')) {
      return {
        response: "What's the new name?",
        updatedData: { ...reminderData, editingField: 'personName' },
        isComplete: false,
        missingFields: []
      };
    } else if (lowerMessage.includes('date') || lowerMessage.includes('when')) {
      return {
        response: "What's the new date?",
        updatedData: { ...reminderData, editingField: 'date' },
        isComplete: false,
        missingFields: []
      };
    } else if (lowerMessage.includes('note') || lowerMessage.includes('message')) {
      return {
        response: "What note would you like to add?",
        updatedData: { ...reminderData, editingField: 'note' },
        isComplete: false,
        missingFields: []
      };
    } else {
      // Try to extract the new value
      const newValue = this.extractNewValue(userMessage, reminderData.editingField);
      if (newValue) {
        return {
          response: `Updated! ${reminderData.editingField} is now "${newValue}". Want to change anything else?`,
          updatedData: { 
            ...reminderData, 
            [reminderData.editingField]: newValue,
            editingField: null 
          },
          isComplete: true,
          missingFields: []
        };
      }
    }

    return {
      response: "What would you like to change? The name, date, or add a note?",
      updatedData: reminderData,
      isComplete: false,
      missingFields: []
    };
  }

  // Extract new value for editing
  extractNewValue(userMessage, field) {
    if (field === 'date') {
      return this.parseNaturalDate(userMessage);
    } else if (field === 'personName') {
      return this.extractPersonName(userMessage) || userMessage.trim();
    } else if (field === 'note') {
      return userMessage.trim();
    }
    return null;
  }

  // Check if user wants to delete a reminder
  isDeleteRequest(userMessage, existingReminders) {
    const lowerMessage = userMessage.toLowerCase();
    return lowerMessage.includes('delete') || lowerMessage.includes('remove') || lowerMessage.includes('cancel');
  }

  // Handle delete requests
  handleDeleteRequest(userMessage, existingReminders) {
    // Find the reminder to delete
    const reminderToDelete = this.findReminderByName(userMessage, existingReminders);
    
    if (reminderToDelete) {
      return {
        response: `Done! I've removed the reminder for ${reminderToDelete.personName || reminderToDelete.title}. Want to do anything else?`,
        updatedData: { action: 'delete', reminderId: reminderToDelete.id },
        isComplete: true,
        missingFields: []
      };
    } else {
      return {
        response: "I couldn't find that reminder. Can you tell me which one you want to delete?",
        updatedData: {},
        isComplete: false,
        missingFields: []
      };
    }
  }

  // Check if user wants to view reminders
  isViewRequest(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    return lowerMessage.includes('show') || lowerMessage.includes('what') || lowerMessage.includes('list') || 
           lowerMessage.includes('today') || lowerMessage.includes('upcoming');
  }

  // Handle view requests
  handleViewRequest(userMessage, existingReminders) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('today')) {
      const todayReminders = this.getTodayReminders(existingReminders);
      if (todayReminders.length > 0) {
        const reminderList = todayReminders.map(r => `• ${r.personName || r.title} (${r.reminderType})`).join('\n');
        return {
          response: `Here are your reminders for today:\n${reminderList}`,
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      } else {
        return {
          response: "You have no reminders for today! Want to add one?",
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      }
    } else if (lowerMessage.includes('birthday')) {
      const birthdayReminders = existingReminders.filter(r => r.reminderType === 'birthday');
      if (birthdayReminders.length > 0) {
        const reminderList = birthdayReminders.map(r => `• ${r.personName} - ${r.date}`).join('\n');
        return {
          response: `Here are your birthday reminders:\n${reminderList}`,
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      } else {
        return {
          response: "You don't have any birthday reminders yet. Want to add one?",
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      }
    } else {
      // Show all reminders
      if (existingReminders.length > 0) {
        const reminderList = existingReminders.map(r => `• ${r.personName || r.title} (${r.reminderType}) - ${r.date}`).join('\n');
        return {
          response: `Here are all your reminders:\n${reminderList}`,
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      } else {
        return {
          response: "You don't have any reminders yet. Want to add your first one?",
          updatedData: {},
          isComplete: false,
          missingFields: []
        };
      }
    }
  }

  // Handle reminder creation
  handleReminderCreation(userMessage, reminderData, conversationHistory, existingReminders) {
    // Detect reminder type if not already set
    let detectedType = reminderData.reminderType || this.detectReminderType(userMessage);
    
    // Extract person name if not already set
    let personName = reminderData.personName || this.extractPersonName(userMessage);
    
    // Extract date if not already set
    let date = reminderData.date || this.parseNaturalDate(userMessage);
    
    // Update reminder data
    const updatedData = {
      ...reminderData,
      reminderType: detectedType || reminderData.reminderType || 'birthday',
      personName: personName || reminderData.personName,
      date: date || reminderData.date
    };

    // Determine what information we still need
    const missingFields = this.getMissingFields(updatedData);
    
    if (missingFields.length === 0) {
      // We have all the information, save the reminder
      return {
        response: this.getCompletionMessage(updatedData),
        updatedData: updatedData,
        isComplete: true,
        missingFields: []
      };
    } else {
      // Ask for missing information
      return {
        response: this.getNextQuestion(updatedData, missingFields[0]),
        updatedData: updatedData,
        isComplete: false,
        missingFields: missingFields
      };
    }
  }

  // Get missing fields for a reminder
  getMissingFields(reminderData) {
    const missing = [];
    
    if (!reminderData.reminderType) {
      missing.push('type');
    }
    
    if (!reminderData.personName && !reminderData.title) {
      missing.push('name');
    }
    
    if (!reminderData.date) {
      missing.push('date');
    }
    
    return missing;
  }

  // Get the next question to ask
  getNextQuestion(reminderData, missingField) {
    const type = reminderData.reminderType;
    
    switch (missingField) {
      case 'type':
        return "Hmm, I didn't catch that. Do you want to set a birthday, anniversary, task, or something else?";
      
      case 'name':
        if (type === 'birthday') {
          return "Whose birthday is it?";
        } else if (type === 'anniversary') {
          return "Whose anniversary is it?";
        } else if (type === 'meeting') {
          return "What is the meeting for?";
        } else if (type === 'bill') {
          return "What bill is this for?";
        } else if (type === 'task') {
          return "What task do you need to remember?";
        } else {
          return "What is the reminder for?";
        }
      
      case 'date':
        const name = reminderData.personName || reminderData.title || 'this';
        if (type === 'birthday') {
          return `What's ${name}'s birth date?`;
        } else if (type === 'anniversary') {
          return `What's the date of ${name}'s anniversary?`;
        } else if (type === 'meeting') {
          return `When is the "${name}" meeting?`;
        } else if (type === 'bill') {
          return `When is the ${name} due?`;
        } else if (type === 'task') {
          return `When do you need to complete "${name}"?`;
        } else {
          return `When is "${name}"?`;
        }
      
      default:
        return "Can you tell me a bit more?";
    }
  }

  // Get completion message
  getCompletionMessage(reminderData) {
    const type = reminderData.reminderType;
    const name = reminderData.personName || reminderData.title;
    
    switch (type) {
      case 'birthday':
        return `Done! I've saved the birthday for ${name}. 🎉\n\nWant to create another reminder?`;
      case 'anniversary':
        return `Anniversary reminder added for ${name}. 💖\n\nWant to add another one?`;
      case 'meeting':
        return `Got it! Your meeting "${name}" has been saved. ✅\n\nNeed to add another one?`;
      case 'bill':
        return `Perfect! I've saved the ${name} reminder. 💳\n\nWant to add another reminder?`;
      case 'task':
        return `Task "${name}" has been saved! 🎯\n\nNeed to add another one?`;
      default:
        return `Got it! Your reminder for "${name}" has been saved. ✅\n\nWant to add another one?`;
    }
  }

  // Find reminder by name in existing reminders
  findReminderByName(userMessage, existingReminders) {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const reminder of existingReminders) {
      const reminderName = (reminder.personName || reminder.title || '').toLowerCase();
      if (lowerMessage.includes(reminderName) && reminderName.length > 0) {
        return reminder;
      }
    }
    
    return null;
  }

  // Get today's reminders
  getTodayReminders(reminders) {
    const today = new Date();
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    return reminders.filter(reminder => {
      if (!reminder.date) return false;
      const reminderDate = reminder.date.split('/');
      return reminderDate[0] === todayString.split('/')[0] && reminderDate[1] === todayString.split('/')[1];
    });
  }

  // Generate reminder message (for display purposes)
  async generateReminderMessage(reminderData, userContext = null, size = 'medium') {
    try {
      const currentDate = new Date().toLocaleDateString();
      const reminderType = reminderData.reminderType || 'reminder';
      
      let userContextInfo = '';
      if (userContext && userContext.reminders) {
        const existingReminders = userContext.reminders
          .filter(r => r.id !== reminderData.id)
          .map(r => `${r.personName} (${r.relationship}, ${r.reminderType || 'reminder'})`)
          .join(', ');
        
        if (existingReminders) {
          userContextInfo = `\n\nUser's other reminders: ${existingReminders}`;
        }
      }

      const prompt = `You are a friendly AI assistant that creates personalized ${reminderType} messages. Today's date is ${currentDate}.

IMPORTANT RULES:
- Always be warm, caring, and appropriate for the reminder type
- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, 📅, 💝, etc.)
- Keep it short and sweet (2-3 sentences, 30-40 words)
- Make them feel personal and genuine
- Don't be overly formal or generic
- Focus on positive wishes and helpful reminders

Context:
- Person: ${reminderData.personName}
- Reminder Type: ${reminderType}
- Date: ${reminderData.date}
- Relationship: ${reminderData.relationship}
- Notes: ${reminderData.note || 'No specific notes'}${userContextInfo}

Create a heartfelt message that feels like it's coming from a caring friend or family member.`;

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
              content: `You are a friendly AI assistant that creates personalized ${reminderType} messages. You are warm, caring, and creative.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
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
      const reminderType = reminderData.reminderType || 'reminder';
      return `🎉 Happy ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} ${reminderData.personName}! Wishing you a wonderful day filled with joy and success!`;
    }
  }

  // Get user context from Firebase
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

  // Direct reminder message generation
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

  // Legacy methods for backward compatibility
  async generateBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }

  async generateDirectBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateDirectReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }
}

const aiService = new AIService();
export default aiService; 