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
      const currentDate = new Date().toLocaleDateString();

      let userContextInfo = '';
      if (userContext) {
        if (userContext.user && userContext.user.name) {
          userContextInfo += `\n- User's name: ${userContext.user.name}`;
        }
        if (userContext.reminders && userContext.reminders.length > 0) {
          userContextInfo += `\n- User has ${userContext.reminders.length} existing reminders.`;
          const reminderList = userContext.reminders.map(r => `${r.personName} (${r.relationship}, ${r.reminderType || 'reminder'})`).join(', ');
          userContextInfo += `\n- Existing reminders: ${reminderList}`;
        }
      }

      const systemPrompt = `You are a professional AI assistant for "My Reminder" app. Help users create reminders efficiently and professionally.

**Your Approach:**
1. **Ask ONE clear question at a time** - don't overwhelm users
2. **Be professional but friendly** - use simple, clear language
3. **Understand context** - if user mentions "birthday", "meeting", "bill", etc., set the reminder type automatically
4. **Smart defaults** - if user says "my mom's birthday", set relationship to "mother" and type to "birthday"
5. **Natural date parsing** - accept any date format (Oct 15, 15th October, next Friday, etc.)
6. **Complete information** - get person name, date, relationship, reminder type, and optional note

**Reminder Types Supported:**
- birthday (🎂)
- anniversary (💕) 
- meeting (📅)
- bill (💰)
- custom (📝)

**Current State:**
- Mode: ${isEditing ? 'Editing' : 'Creating new reminder'}
- Data so far: ${JSON.stringify(reminderData)}
- User context: ${userContextInfo}

**Response Format (JSON only):**
{
  "response": "Your conversational reply",
  "updatedData": {
    "personName": "Name",
    "date": "MM/DD/YYYY", 
    "relationship": "relationship",
    "reminderType": "type",
    "note": "optional note"
  },
  "isComplete": false
}

**Rules:**
- Ask ONE question at a time
- Use simple, clear language
- Don't explain date formats - just ask for the date
- Set isComplete: true when user confirms they're done
- Be professional and efficient`;
      
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
          response: "I'm having trouble connecting right now. Could you try again in a moment?",
          updatedData: reminderData,
          isComplete: false
        };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON content
      try {
        const parsed = JSON.parse(content);
        
        // Parse natural date if provided
        if (parsed.updatedData && parsed.updatedData.date && typeof parsed.updatedData.date === 'string') {
          const parsedDate = this.parseNaturalDate(parsed.updatedData.date);
          if (parsedDate) {
            parsed.updatedData.date = parsedDate;
          }
        }
        
        return parsed;
      } catch (e) {
        console.error("Failed to parse AI's JSON response:", content);
        // Fallback for non-JSON response
        return {
          response: content || "I'm having a little trouble thinking right now. Could you try that again?",
          updatedData: reminderData,
          isComplete: false
        };
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      return {
        response: "❌ Oops! Something went wrong on my end. Please try again in a moment.",
        updatedData: reminderData,
        isComplete: false
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
      // Add a random seed to help with regeneration
      const randomSeed = Math.floor(Math.random() * 1000000);
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
      
      let sizePrompt = '';
      if (size === 'small') {
        sizePrompt = 'Keep it very short (1-2 sentences, 15-25 words).';
      } else if (size === 'large') {
        sizePrompt = 'Make it longer and more heartfelt (4-6 sentences, up to 80 words).';
      } else {
        sizePrompt = 'Keep it short and sweet (2-3 sentences, 30-40 words).';
      }

      const reminderType = reminderData.reminderType || 'reminder';
      
      // Determine tone and approach based on relationship and reminder type
      const relationship = reminderData.relationship?.toLowerCase() || '';
      
      // Categorize relationships
      const elderRelationships = ['mom', 'mother', 'dad', 'father', 'papa', 'mama', 'uncle', 'aunt', 'aunty', 'auntie', 'grandfather', 'grandmother', 'grandpa', 'grandma', 'nana', 'nani', 'dada', 'dadi', 'boss', 'sir', 'madam', 'teacher', 'professor'];
      const kidRelationships = ['son', 'daughter', 'nephew', 'niece', 'cousin', 'kid', 'child', 'student'];
      const romanticRelationships = ['wife', 'husband', 'girlfriend', 'boyfriend', 'partner', 'spouse', 'fiancé', 'fiancée'];
      
      const isElder = elderRelationships.some(elder => relationship.includes(elder));
      const isKid = kidRelationships.some(kid => relationship.includes(kid));
      const isRomantic = romanticRelationships.some(romantic => relationship.includes(romantic));
      
      let toneGuidelines = '';
      let nameUsage = '';
      
      if (isElder) {
        toneGuidelines = `
- Be respectful and warm but still fun and loving
- Use heartfelt language with some gentle humor
- Show appreciation and gratitude
- Keep it dignified but not too formal
- Make it feel genuine and caring`;
        nameUsage = `- ALWAYS start with an appropriate greeting followed by the relationship title (Mom, Dad, Uncle, Aunt, etc.) instead of their actual name`;
      } else if (isKid) {
        toneGuidelines = `
- Be playful, fun, and energetic
- Use simple, excited language
- Include fun elements and enthusiasm
- Make it feel like a celebration
- Be encouraging and sweet`;
        nameUsage = `- ALWAYS start with an appropriate greeting followed by their actual name`;
      } else if (isRomantic) {
        toneGuidelines = `
- Be loving and sweet but not overly sappy
- Keep it personal and intimate
- Use warm, affectionate language
- Make it feel special and personal
- Balance romance with genuine care`;
        nameUsage = `- ALWAYS start with an appropriate greeting followed by their actual name in a loving way`;
      } else {
        // Peers and general relationships
        toneGuidelines = `
- Be casual, friendly, and a bit funny
- Use conversational, buddy-like language
- Include light humor and warmth
- Keep it relaxed and genuine
- Make it feel like you're talking to a friend`;
        nameUsage = `- ALWAYS start with an appropriate greeting followed by their actual name`;
      }

      // Reminder type specific guidelines
      let typeSpecificGuidelines = '';
      if (reminderType === 'birthday') {
        typeSpecificGuidelines = `
- Use birthday-specific emojis: 🎉, 🎂, 🎁, ✨, 🥳
- Focus on celebration and well-wishes
- Make it feel special and personal`;
      } else if (reminderType === 'anniversary') {
        typeSpecificGuidelines = `
- Use romantic/celebration emojis: 💝, 💕, 🎉, ✨, 🥂
- Focus on love, commitment, and celebration
- Make it feel romantic and meaningful`;
      } else if (reminderType === 'meeting') {
        typeSpecificGuidelines = `
- Use professional but friendly emojis: 📅, ⏰, 💼, 🤝
- Focus on preparation and success
- Keep it professional but warm`;
      } else if (reminderType === 'bill') {
        typeSpecificGuidelines = `
- Use helpful emojis: 💰, 📋, ✅, ⏰
- Focus on being helpful and supportive
- Keep it practical but caring`;
      } else {
        typeSpecificGuidelines = `
- Use general reminder emojis: 📅, ⏰, ✅, ✨
- Focus on being helpful and supportive
- Keep it friendly and practical`;
      }

      const systemPrompt = `You are creating a personalized ${reminderType} message that sounds like it's from a real human, not an AI.

CRITICAL STYLE REQUIREMENTS:
- Use colloquial everyday words (like "awesome", "super", "really", "totally", "amazing", "fantastic")
- Do NOT make it sound corporate, formal, or like an AI wrote it
- Keep it human and conversational - like texting a friend or family member
- Write in grade 6 style (simple, clear, easy to read)
- Don't use passive voice - use active voice only
- Make it sound casual, natural, and FUN
- NO fancy or formal words
- NO corporate speak or AI-like phrases
- Don't be too serious - add warmth and personality

RELATIONSHIP-BASED TONE:
${toneGuidelines}

REMINDER TYPE GUIDELINES:
${typeSpecificGuidelines}

MANDATORY OPENING FORMAT:
${nameUsage}

MESSAGE REQUIREMENTS:
- Output ONLY the message, no preamble or explanations
- ${sizePrompt}
- Use appropriate emojis based on reminder type
- Make each message unique and personal
- Sound like a real person wrote it
- Include genuine warmth and personality
- Don't take notes too seriously - use them as inspiration but keep it natural
- Random seed for variety: ${randomSeed}

EXAMPLES OF GOOD STYLE:
- "Happy Birthday Mom! Hope your day is super awesome!" 
- "Meeting reminder Sarah! You're gonna crush it!"
- "Bill due today buddy! Don't forget!"
- "Anniversary time! Love you so much!" 

AVOID THESE FORMAL STYLES:
- "I hope your day will be wonderful"
- "You are truly remarkable" 
- "I look forward to celebrating"
- "This will be magnificent"`;

      const userPrompt = `Create a ${reminderType} message for ${reminderData.personName}${reminderData.relationship ? ` (${reminderData.relationship})` : ''}${reminderData.note ? `. Note: ${reminderData.note}` : ''}${userContextInfo}`;
      
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
        return `🎉 Happy ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} ${reminderData.personName}! Wishing you a wonderful day!`;
      }
      
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from API');
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating direct reminder message:', error);
      throw new Error('Error generating reminder message. Please try again.');
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