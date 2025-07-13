import * as chrono from 'chrono-node';

function stringSimilarity(a, b) {
  // Simple similarity: lower, remove spaces, count matching chars
  a = a.toLowerCase().replace(/\s+/g, '');
  b = b.toLowerCase().replace(/\s+/g, '');
  let matches = 0;
  for (let char of a) if (b.includes(char)) matches++;
  return matches / Math.max(a.length, b.length, 1);
}

function fuzzyFindReminder(reminders, query, type = null) {
  if (!reminders || reminders.length === 0) return null;
  let best = null;
  let bestScore = 0.5; // Only match if > 0.5
  for (let r of reminders) {
    if (type && r.reminderType !== type) continue;
    const name = r.personName || r.title || '';
    const score = stringSimilarity(name, query);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}

function fuzzyFindRemindersByType(reminders, type) {
  if (!reminders) return [];
  return reminders.filter(r => r.reminderType === type);
}

function detectEventType(text) {
  text = text.toLowerCase();
  if (/birth|bday|b\'day|birtday|birtay|bday|🎂|birthday/.test(text)) return 'birthday';
  if (/anniv|anni|💍|wedding|marriage/.test(text)) return 'anniversary';
  if (/meet|appointment|call|zoom|conference|📅/.test(text)) return 'meeting';
  if (/exam|test|paper|quiz|final|midterm/.test(text)) return 'exam';
  if (/bill|payment|due|invoice|rent|💰/.test(text)) return 'bill';
  if (/task|todo|to-do|chore|work|job|📝/.test(text)) return 'task';
  return null;
}

function extractName(text) {
  // Try to extract a name (very basic, just first capitalized word)
  const match = text.match(/([A-Z][a-z]+( [A-Z][a-z]+)?)/);
  return match ? match[0] : '';
}

function extractAmount(text) {
  const match = text.match(/\$?(\d+[.,]?\d*)/);
  return match ? match[1] : '';
}

class AIService {
  parseNaturalDate(dateInput) {
    if (!dateInput || typeof dateInput !== 'string') return null;
    try {
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

  async getUserContext(userId) {
    try {
      const { database, ref, get } = await import('../firebase');
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : null;
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
      return { user: userData, reminders };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return { user: null, reminders: [] };
    }
  }

  // Main conversational AI logic
  async processChat(messages, reminderData, isEditing, userContext) {
    try {
      const reminders = userContext?.reminders || [];
      const lastUserMessage = messages.filter(m => m.type === 'user').pop()?.content || '';
      const lowerMsg = lastUserMessage.toLowerCase();
      let state = reminderData._state || null;
      let type = reminderData.reminderType || null;
      let response = '';
      let updatedData = { ...reminderData };
      let isComplete = false;
      let loop = false;

      // --- Detect edit/delete/show commands ---
      if (/delete|remove|erase|cancel/.test(lowerMsg)) {
        // Try to find which reminder to delete
        let found = null;
        let foundType = detectEventType(lowerMsg);
        if (foundType) {
          found = fuzzyFindReminder(reminders, lastUserMessage, foundType);
        } else {
          found = fuzzyFindReminder(reminders, lastUserMessage);
        }
        if (found) {
          // Simulate deletion (actual deletion should be handled in UI)
          response = `Done. I’ve removed the ${found.reminderType} for ${found.personName || found.title || 'this event'}. 🗑️`;
        } else {
          response = `I couldn't find that reminder. Can you tell me the name or type?`;
        }
        loop = true;
        return { response, updatedData, isComplete: false, missingFields: [] };
      }
      if (/change|edit|update|modify/.test(lowerMsg)) {
        // Try to find which reminder to edit
        let found = null;
        let foundType = detectEventType(lowerMsg);
        if (foundType) {
          found = fuzzyFindReminder(reminders, lastUserMessage, foundType);
        } else {
          found = fuzzyFindReminder(reminders, lastUserMessage);
        }
        if (found) {
          // Simulate edit (actual edit should be handled in UI)
          response = `What would you like to change for ${found.personName || found.title || 'this event'}?`;
          updatedData = { ...found, _state: 'edit' };
        } else {
          response = `I couldn't find that reminder to edit. Can you tell me the name or type?`;
        }
        return { response, updatedData, isComplete: false, missingFields: [] };
      }
      if (/show|list|what|which|display|see/.test(lowerMsg)) {
        // Show reminders by type or today
        if (/today|now/.test(lowerMsg)) {
          const today = new Date();
          const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
          const todayReminders = reminders.filter(r => (r.date || '').startsWith(todayStr));
          if (todayReminders.length > 0) {
            response = `Here are your reminders for today:\n` + todayReminders.map(r => `- ${r.reminderType}: ${r.personName || r.title} (${r.date})`).join('\n');
          } else {
            response = `You have no reminders for today.`;
          }
        } else {
          let foundType = detectEventType(lowerMsg);
          if (foundType) {
            const foundRems = fuzzyFindRemindersByType(reminders, foundType);
            if (foundRems.length > 0) {
              response = `Here are your ${foundType} reminders:\n` + foundRems.map(r => `- ${r.personName || r.title} (${r.date})`).join('\n');
            } else {
              response = `You have no ${foundType} reminders.`;
            }
          } else {
            response = `Here are all your reminders:\n` + reminders.map(r => `- ${r.reminderType}: ${r.personName || r.title} (${r.date})`).join('\n');
          }
        }
        loop = true;
        return { response, updatedData, isComplete: false, missingFields: [] };
      }

      // --- Conversation Start ---
      if (!state && messages.length <= 2) {
        response = `Hey! What kind of event would you like to set a reminder for?`;
        updatedData = { reminderType: '', personName: '', date: '', relationship: '', note: '', _state: 'await_type' };
        return { response, updatedData, isComplete: false, missingFields: [] };
      }

      // --- Detect event type if not set ---
      if (!type || !['birthday','anniversary','meeting','exam','bill','task','custom'].includes(type)) {
        let detected = detectEventType(lastUserMessage);
        if (detected) {
          type = detected;
          updatedData.reminderType = type;
        } else {
          // fallback: treat as custom
          type = 'custom';
          updatedData.reminderType = type;
        }
      }

      // --- Step-by-step conversational flow ---
      // BIRTHDAY
      if (type === 'birthday') {
        if (!updatedData.personName) {
          updatedData._state = 'await_birthday_name';
          response = `Whose birthday is it?`;
          return { response, updatedData, isComplete: false, missingFields: ['personName'] };
        }
        if (!updatedData.date) {
          const parsed = this.parseNaturalDate(lastUserMessage);
          if (parsed) updatedData.date = parsed;
          if (!updatedData.date) {
            updatedData._state = 'await_birthday_date';
            response = `What’s their birth date?`;
            return { response, updatedData, isComplete: false, missingFields: ['date'] };
          }
        }
        if (!updatedData.relationship) {
          updatedData._state = 'await_birthday_relationship';
          response = `What is their relationship to you?`;
          return { response, updatedData, isComplete: false, missingFields: ['relationship'] };
        }
        if (!updatedData.note) {
          updatedData._state = 'await_birthday_note';
          response = `Would you like to add a note or message? (optional)`;
          return { response, updatedData, isComplete: false, missingFields: [] };
        }
        response = `Done! I’ve saved the birthday for ${updatedData.personName}. 🎉`;
        isComplete = true;
        loop = true;
      }
      // ANNIVERSARY
      else if (type === 'anniversary') {
        if (!updatedData.personName) {
          updatedData._state = 'await_anniv_name';
          response = `Whose anniversary is it?`;
          return { response, updatedData, isComplete: false, missingFields: ['personName'] };
        }
        if (!updatedData.date) {
          const parsed = this.parseNaturalDate(lastUserMessage);
          if (parsed) updatedData.date = parsed;
          if (!updatedData.date) {
            updatedData._state = 'await_anniv_date';
            response = `What’s the date?`;
            return { response, updatedData, isComplete: false, missingFields: ['date'] };
          }
        }
        if (!updatedData.note) {
          updatedData._state = 'await_anniv_note';
          response = `Any note or message to include? (optional)`;
          return { response, updatedData, isComplete: false, missingFields: [] };
        }
        response = `Anniversary reminder added. 💖 Want to add another one?`;
        isComplete = true;
        loop = true;
      }
      // MEETING/EXAM/TASK/BILL/OTHER
      else if (['meeting','exam','task','bill','custom'].includes(type)) {
        if (!updatedData.title && !updatedData.personName) {
          updatedData._state = 'await_title';
          response = `What is the reminder for?`;
          return { response, updatedData, isComplete: false, missingFields: ['title'] };
        }
        if (!updatedData.date) {
          const parsed = this.parseNaturalDate(lastUserMessage);
          if (parsed) updatedData.date = parsed;
          if (!updatedData.date) {
            updatedData._state = 'await_date';
            response = `What date and time should I remind you?`;
            return { response, updatedData, isComplete: false, missingFields: ['date'] };
          }
        }
        if (!updatedData.note) {
          updatedData._state = 'await_note';
          response = `Any message or detail to include? (optional)`;
          return { response, updatedData, isComplete: false, missingFields: [] };
        }
        response = `Got it! Your reminder has been saved. ✅`;
        isComplete = true;
        loop = true;
      }

      // --- Looping: ask if user wants to do anything else ---
      if (isComplete || loop) {
        response += `\n\nWould you like to do anything else?`;
        updatedData = { reminderType: '', personName: '', date: '', relationship: '', note: '', _state: null };
        isComplete = false; // Let UI handle actual save, then restart
      }

      // --- Fallback for unclear input ---
      if (!response) {
        response = `Can you tell me a bit more? Like who it’s for or when?`;
      }

      return { response, updatedData, isComplete, missingFields: [] };
    } catch (error) {
      console.error('Error in AI conversation:', error);
      return {
        response: "I'm having trouble processing your request. Please try again.",
        updatedData: reminderData,
        isComplete: false,
        missingFields: []
      };
    }
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

  // Legacy method for backward compatibility
  async generateBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }

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

  async generateDirectBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    return this.generateDirectReminderMessage({ ...reminderData, reminderType: 'birthday' }, userContext, size);
  }
}

const aiService = new AIService();
export default aiService; 