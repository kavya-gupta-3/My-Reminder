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
      // Get the last user message
      const lastUserMessage = messages.filter(m => m.type === 'user').pop()?.content.toLowerCase() || '';
      
      // For edit mode, handle differently
      if (isEditing) {
        return {
          response: "I see you want to edit this reminder. What would you like to change?",
          updatedData: reminderData,
          isComplete: false,
          missingFields: []
        };
      }

      // Initialize conversation state if not exists
      if (!reminderData.conversationState) {
        reminderData.conversationState = 'start';
        reminderData.reminderType = '';
        reminderData.personName = '';
        reminderData.date = '';
        reminderData.relationship = '';
        reminderData.note = '';
        reminderData.title = '';
      }

      // Check for correction keywords that should reset the flow
      const correctionKeywords = ['no', 'wait', 'stop', 'cancel', 'wrong', 'different', 'change', 'actually', 'i meant', 'i want'];
      const isCorrection = correctionKeywords.some(keyword => lastUserMessage.includes(keyword));
      
      // If user is correcting and we're in a specific flow, reset to type selection
      if (isCorrection && reminderData.conversationState !== 'start' && reminderData.conversationState !== 'waiting_for_type') {
        reminderData.conversationState = 'waiting_for_type';
        reminderData.reminderType = '';
        reminderData.personName = '';
        reminderData.date = '';
        reminderData.relationship = '';
        reminderData.note = '';
        reminderData.title = '';
        return {
          response: "No problem! Let me start over. What kind of event do you want to set a reminder for?",
          updatedData: reminderData,
          isComplete: false,
          missingFields: []
        };
      }

      const state = reminderData.conversationState;
      let response = '';
      let isComplete = false;
      let nextState = state;

      // Try to parse date from user message
      const parsedDate = this.parseNaturalDate(lastUserMessage);
      if (parsedDate && !reminderData.date) {
        reminderData.date = parsedDate;
      }

      // Main conversation flow logic
      switch (state) {
        case 'start':
          response = "What kind of event do you want to set a reminder for?";
          nextState = 'waiting_for_type';
          break;

        case 'waiting_for_type':
          // Detect reminder type from user input with better pattern matching
          let detectedType = '';
          const message = lastUserMessage.toLowerCase().trim();
          
          // Check for explicit corrections first
          if (message.includes('i want meeting') || message.includes('want meeting') || message.includes('meeting please')) {
            detectedType = 'meeting';
          } else if (message.includes('i want birthday') || message.includes('want birthday') || message.includes('birthday please')) {
            detectedType = 'birthday';
          } else if (message.includes('i want anniversary') || message.includes('want anniversary') || message.includes('anniversary please')) {
            detectedType = 'anniversary';
          } else if (message.includes('i want exam') || message.includes('want exam') || message.includes('exam please')) {
            detectedType = 'exam';
          } else if (message.includes('i want task') || message.includes('want task') || message.includes('task please')) {
            detectedType = 'task';
          } else if (message.includes('i want bill') || message.includes('want bill') || message.includes('bill please')) {
            detectedType = 'bill';
          }
          // Regular detection if no explicit correction
          else if (message.includes('birthday') || message.includes('birth') || message.includes('bday')) {
            detectedType = 'birthday';
          } 
          // Anniversary detection with common misspellings
          else if (message.includes('anniversary') || message.includes('aniversary') || 
                   message.includes('aniversari') || message.includes('anniversari') ||
                   message.includes('aniversery') || message.includes('anniversery') ||
                   message.includes('aniversarie') || message.includes('anniversarie')) {
            detectedType = 'anniversary';
          } 
          // Meeting detection
          else if (message.includes('meeting') || message.includes('appointment') || message.includes('call')) {
            detectedType = 'meeting';
          } 
          // Exam detection
          else if (message.includes('exam') || message.includes('test') || message.includes('quiz')) {
            detectedType = 'exam';
          } 
          // Task detection
          else if (message.includes('task') || message.includes('todo') || message.includes('reminder') || 
                   message.includes('water') || message.includes('check') || message.includes('follow')) {
            detectedType = 'task';
          } 
          // Bill detection
          else if (message.includes('bill') || message.includes('payment') || message.includes('due')) {
            detectedType = 'bill';
          } else {
            // If user didn't specify a clear type, ask for clarification
            response = "I can help you set reminders for birthdays, anniversaries, meetings, exams, tasks, and more. What kind of event do you want to set a reminder for?";
            nextState = 'waiting_for_type';
            break;
          }

          reminderData.reminderType = detectedType;
          
          // Move to type-specific flow
          switch (detectedType) {
            case 'birthday':
              response = "Whose birthday is it?";
              nextState = 'birthday_name';
              break;
            case 'anniversary':
              response = "Whose anniversary is it?";
              nextState = 'anniversary_name';
              break;
            case 'meeting':
              response = "What's the meeting about?";
              nextState = 'meeting_title';
              break;
            case 'exam':
              response = "Which subject or exam is it?";
              nextState = 'exam_subject';
              break;
            case 'task':
              response = "What do you want to be reminded about?";
              nextState = 'task_title';
              break;
            case 'bill':
              response = "What bill or payment is it?";
              nextState = 'bill_title';
              break;
            default:
              response = "I can help you set reminders for birthdays, anniversaries, meetings, exams, tasks, and more. What kind of event do you want to set a reminder for?";
              nextState = 'waiting_for_type';
              break;
          }
          break;

        // Birthday flow
        case 'birthday_name':
          if (lastUserMessage.trim()) {
            // Check if user is trying to correct the reminder type
            const message = lastUserMessage.toLowerCase().trim();
            if (message.includes('meeting') || message.includes('anniversary') || message.includes('exam') || message.includes('task') || message.includes('bill')) {
              // User is trying to change the reminder type
              reminderData.conversationState = 'waiting_for_type';
              reminderData.reminderType = '';
              reminderData.personName = '';
              reminderData.date = '';
              reminderData.relationship = '';
              reminderData.note = '';
              reminderData.title = '';
              return {
                response: "I understand you want a different type of reminder. What kind of event do you want to set a reminder for?",
                updatedData: reminderData,
                isComplete: false,
                missingFields: []
              };
            }
            reminderData.personName = lastUserMessage.trim();
            response = "What's their birth date?";
            nextState = 'birthday_date';
          } else {
            response = "Whose birthday is it?";
            nextState = 'birthday_name';
          }
          break;

        case 'birthday_date':
          if (reminderData.date || lastUserMessage.trim()) {
            // Check if user is trying to correct something
            const message = lastUserMessage.toLowerCase().trim();
            if (message.includes('no') || message.includes('wait') || message.includes('stop') || message.includes('wrong')) {
              // User wants to go back or correct
              reminderData.conversationState = 'waiting_for_type';
              reminderData.reminderType = '';
              reminderData.personName = '';
              reminderData.date = '';
              reminderData.relationship = '';
              reminderData.note = '';
              reminderData.title = '';
              return {
                response: "No problem! Let me start over. What kind of event do you want to set a reminder for?",
                updatedData: reminderData,
                isComplete: false,
                missingFields: []
              };
            }
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "What is their relationship to you?";
            nextState = 'birthday_relationship';
          } else {
            response = "What's their birth date?";
            nextState = 'birthday_date';
          }
          break;

        case 'birthday_relationship':
          if (lastUserMessage.trim()) {
            reminderData.relationship = lastUserMessage.trim();
            response = "Would you like to add a note or message?";
            nextState = 'birthday_note';
          } else {
            response = "What is their relationship to you?";
            nextState = 'birthday_relationship';
          }
          break;

        case 'birthday_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = `✅ Done! I've created the birthday reminder for ${reminderData.personName}.`;
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Anniversary flow
        case 'anniversary_name':
          if (lastUserMessage.trim()) {
            reminderData.personName = lastUserMessage.trim();
            response = "What's the date of the anniversary?";
            nextState = 'anniversary_date';
          } else {
            response = "Whose anniversary is it?";
            nextState = 'anniversary_name';
          }
          break;

        case 'anniversary_date':
          if (reminderData.date || lastUserMessage.trim()) {
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "Would you like to add a note or message?";
            nextState = 'anniversary_note';
          } else {
            response = "What's the date of the anniversary?";
            nextState = 'anniversary_date';
          }
          break;

        case 'anniversary_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = "✅ Got it! Anniversary reminder added.";
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Meeting flow
        case 'meeting_title':
          if (lastUserMessage.trim()) {
            reminderData.title = lastUserMessage.trim();
            response = "What day and time is it scheduled for?";
            nextState = 'meeting_date';
          } else {
            response = "What's the meeting about?";
            nextState = 'meeting_title';
          }
          break;

        case 'meeting_date':
          if (reminderData.date || lastUserMessage.trim()) {
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "Any notes or location details you want to add?";
            nextState = 'meeting_note';
          } else {
            response = "What day and time is it scheduled for?";
            nextState = 'meeting_date';
          }
          break;

        case 'meeting_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = "✅ Your meeting has been added to the dashboard.";
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Exam flow
        case 'exam_subject':
          if (lastUserMessage.trim()) {
            reminderData.title = lastUserMessage.trim();
            response = "When is the exam date?";
            nextState = 'exam_date';
          } else {
            response = "Which subject or exam is it?";
            nextState = 'exam_subject';
          }
          break;

        case 'exam_date':
          if (reminderData.date || lastUserMessage.trim()) {
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "Do you want to add any study notes or topics?";
            nextState = 'exam_note';
          } else {
            response = "When is the exam date?";
            nextState = 'exam_date';
          }
          break;

        case 'exam_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = "✅ Exam reminder set. Good luck!";
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Task flow
        case 'task_title':
          if (lastUserMessage.trim()) {
            reminderData.title = lastUserMessage.trim();
            response = "When or how often should I remind you?";
            nextState = 'task_date';
          } else {
            response = "What do you want to be reminded about?";
            nextState = 'task_title';
          }
          break;

        case 'task_date':
          if (reminderData.date || lastUserMessage.trim()) {
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "Any note or message to include?";
            nextState = 'task_note';
          } else {
            response = "When or how often should I remind you?";
            nextState = 'task_date';
          }
          break;

        case 'task_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = "✅ Reminder created successfully!";
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Bill flow
        case 'bill_title':
          if (lastUserMessage.trim()) {
            reminderData.title = lastUserMessage.trim();
            response = "When is the payment due?";
            nextState = 'bill_date';
          } else {
            response = "What bill or payment is it?";
            nextState = 'bill_title';
          }
          break;

        case 'bill_date':
          if (reminderData.date || lastUserMessage.trim()) {
            if (!reminderData.date) {
              reminderData.date = lastUserMessage.trim();
            }
            response = "What's the amount due?";
            nextState = 'bill_amount';
          } else {
            response = "When is the payment due?";
            nextState = 'bill_date';
          }
          break;

        case 'bill_amount':
          if (lastUserMessage.trim()) {
            reminderData.amount = lastUserMessage.trim();
            response = "Any additional notes about this bill?";
            nextState = 'bill_note';
          } else {
            response = "What's the amount due?";
            nextState = 'bill_amount';
          }
          break;

        case 'bill_note':
          if (lastUserMessage.trim() && !lastUserMessage.includes('no') && !lastUserMessage.includes('skip')) {
            reminderData.note = lastUserMessage.trim();
          }
          response = "✅ Bill reminder added successfully!";
          isComplete = true;
          nextState = 'ask_another';
          break;

        // Ask for another reminder
        case 'ask_another':
          if (lastUserMessage.includes('yes') || lastUserMessage.includes('sure') || lastUserMessage.includes('okay') || lastUserMessage.includes('another')) {
            // Reset for new reminder
            reminderData.conversationState = 'start';
            reminderData.reminderType = '';
            reminderData.personName = '';
            reminderData.date = '';
            reminderData.relationship = '';
            reminderData.note = '';
            reminderData.title = '';
            response = "What kind of event do you want to set a reminder for?";
            nextState = 'waiting_for_type';
          } else {
            response = "Great! Your reminders are all set. You can view and manage them on your dashboard. Have a wonderful day! 🎉";
            isComplete = true;
            nextState = 'complete';
          }
          break;

        default:
          response = "What kind of event do you want to set a reminder for?";
          nextState = 'waiting_for_type';
      }

      // Update conversation state
      reminderData.conversationState = nextState;

      return {
        response: response,
        updatedData: reminderData,
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
      
      // Build context from user's existing reminders if available
      let userContextInfo = '';
      if (userContext && userContext.reminders) {
        const existingReminders = userContext.reminders
          .filter(r => r.id !== reminderData.id) // Exclude current reminder
          .map(r => `${r.personName || r.title} (${r.relationship || 'reminder'}, ${r.reminderType || 'reminder'})`)
          .join(', ');
        
        if (existingReminders) {
          userContextInfo = `\n\nUser's other reminders: ${existingReminders}`;
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