class AIService {
  // Helper function to convert various date formats to MM/DD/YYYY
  convertDateToMMDDYYYY(dateString) {
    if (!dateString) return dateString;

    // Normalize common month misspellings (no duplicate keys)
    const monthMap = {
      jan: 'january',
      feb: 'february',
      mar: 'march',
      apr: 'april',
      may: 'may',
      jun: 'june',
      jul: 'july',
      aug: 'august',
      sep: 'september',
      sept: 'september',
      oct: 'october',
      nov: 'november',
      nav: 'november',
      navamber: 'november',
      dec: 'december',
      decembar: 'december',
      decamber: 'december',
      novamber: 'november',
      janvary: 'january',
      febuary: 'february',
      agust: 'august',
      agustus: 'august',
      septembar: 'september',
      octobar: 'october',
      aprail: 'april',
      marhc: 'march',
      julay: 'july',
      mayy: 'may',
      mayi: 'may',
    };

    // Replace misspelled month names with correct ones
    let normalized = dateString.toLowerCase();
    Object.keys(monthMap).forEach(misspell => {
      if (normalized.includes(misspell)) {
        normalized = normalized.replace(new RegExp(misspell, 'g'), monthMap[misspell]);
      }
    });

    // If already in MM/DD/YYYY format, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
      return normalized;
    }

    // Try to parse 'DD month YYYY' or 'DD month' or 'month DD YYYY' or 'month DD'
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    let day, month, year;
    let match;
    
    // 1. DD month YYYY or DD month
    match = normalized.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
    if (match && monthNames.includes(match[2])) {
      day = parseInt(match[1]);
      month = monthNames.indexOf(match[2]) + 1;
      year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    }
    
    // 2. month DD YYYY or month DD
    match = normalized.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
    if (match && monthNames.includes(match[1])) {
      day = parseInt(match[2]);
      month = monthNames.indexOf(match[1]) + 1;
      year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    }

    // 3. Try to parse with JavaScript Date constructor as fallback
    try {
      const date = new Date(normalized);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } catch (error) {
      console.error('Error parsing date with Date constructor:', error);
    }

    // 4. Try to handle common date formats like "3rd april", "7th may"
    const ordinalMatch = normalized.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?$/);
    if (ordinalMatch && monthNames.includes(ordinalMatch[2])) {
      day = parseInt(ordinalMatch[1]);
      month = monthNames.indexOf(ordinalMatch[2]) + 1;
      year = ordinalMatch[3] ? parseInt(ordinalMatch[3]) : new Date().getFullYear();
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    }

    // If all parsing attempts fail, return the original string
    return dateString;
  }

  async generateBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    try {
      // Build context from user's existing reminders
      let userContextInfo = '';
      if (userContext && userContext.reminders) {
        const existingReminders = userContext.reminders
          .filter(r => r.id !== reminderData.id) // Exclude current reminder
          .map(r => `${r.personName} (${r.relationship}, age ${r.age})`)
          .join(', ');
        
        if (existingReminders) {
          userContextInfo = `\n\nUser's other birthday reminders: ${existingReminders}`;
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
      const prompt = `You are a friendly AI assistant that creates personalized birthday messages. Today's date is ${currentDate}.

IMPORTANT RULES:
- Always be warm, caring, and celebratory
- Use fun, simple words (like "awesome", "super", "really", "totally", "amazing", "fantastic")
- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, etc.)
- ${sizePrompt}
- Make them feel personal and genuine
- Don't be formal or robotic
- Don't use inappropriate humor or references
- Don't mention specific ages if the person might be sensitive about it
- Focus on positive wishes and celebration

Generate a personalized birthday message for ${reminderData.personName}.
      
Context:
- Person: ${reminderData.personName}
- Relationship: ${reminderData.relationship}
- Birthday: ${reminderData.dateOfBirth}
- Notes: ${reminderData.note || 'No specific notes'}${userContextInfo}

Create a heartfelt birthday message that feels like it's coming from a caring friend or family member.`;

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
              content: 'You are a friendly AI assistant that creates personalized birthday messages. You are warm, caring, and creative. You follow the rules strictly and create appropriate, celebratory messages.'
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
      console.error('Error generating birthday message:', error);
      // Fallback to a simple message if AI fails
      return `🎉 Happy Birthday ${reminderData.personName || ''}! Hope your day is awesome! (Sorry, I had trouble making a custom message right now.)`;
    }
  }

  async processChat(messages, reminderData, isEditing, userContext) {
    try {
      const currentDate = new Date().toLocaleDateString();

      // Check for non-birthday/anniversary reminder type and respond accordingly
      const type = (reminderData.reminderType || '').toLowerCase();
      if (type && type !== 'birthday' && type !== 'anniversary') {
        return {
          response: `Sorry, reminders for '${type}' are coming soon! Right now, I can only help with birthday and anniversary reminders.`,
          updatedData: { ...reminderData, reminderType: 'birthday' },
          isComplete: false
        };
      }

      let userContextInfo = '';
      if (userContext) {
        if (userContext.user && userContext.user.name) {
          userContextInfo += `\n- User's name: ${userContext.user.name}`;
        }
        if (userContext.reminders && userContext.reminders.length > 0) {
          userContextInfo += `\n- User has ${userContext.reminders.length} existing reminders.`;
          const reminderList = userContext.reminders.map(r => `${r.personName} (${r.relationship || r.partnerName || ''})`).join(', ');
          userContextInfo += `\n- Existing reminders: ${reminderList}`;
        }
      }

      const systemPrompt = `You are a sophisticated AI assistant in a birthday and anniversary reminder app. Your goal is to help users create or edit birthday and anniversary reminders through a natural conversation. Today's date is ${currentDate}.

**IMPORTANT:** If the user asks for any reminder type other than birthday or anniversary (like bills, meetings, etc.), politely say: 'Sorry, reminders for that type are coming soon! Right now, I can only help with birthday and anniversary reminders.' and guide them to create a birthday or anniversary reminder instead. Do NOT offer to create or edit any other type of reminder.

**Your main tasks:**
1.  **Understand User Intent:** Determine if the user wants to create a new birthday or anniversary reminder, edit an existing one, or is just chatting.
2.  **Gather Information:**
    - For birthday reminders: collect 'personName' (required), 'dateOfBirth' (required, just ask for the date, don't specify format), 'relationship' (optional), and a 'note' (optional). DO NOT ask for age; it is calculated automatically.
    - For anniversary reminders: collect 'personName' (required), 'partnerName' (optional), 'date' (required, just ask for the date), 'relationship' (optional), and a 'note' (optional). Do NOT ask for age.
3.  **Stay On-Topic:** Your primary purpose is to help with birthday and anniversary reminders. If the user asks an unrelated question (e.g., math problems, general knowledge, personal opinions), you must politely decline and steer the conversation back to the task at hand. For example: "My purpose is to help with birthday and anniversary reminders. Shall we continue with the reminder for [Person's Name]?"
4.  **Validate Information:** Gently correct the user if they provide information in the wrong format. If you're not sure about something, ask for clarification.
5.  **Manage Conversation Flow:** Guide the user through the process. You can ask one or more questions at a time.
6.  **Handle Edits:** If in edit mode, help the user modify specific fields of the reminder. When editing, preserve existing data unless the user specifically wants to change it.
7.  **Continue Conversations:** After completing a reminder, encourage users to create more reminders or ask questions. The conversation should continue naturally.
8.  **Multiple Reminders:** Users can create multiple reminders in the same conversation. When starting a new reminder, reset to empty fields.
9.  **Maintain a Friendly Tone:** Be conversational, friendly, and use emojis 🎂✨💖.
10. **Output JSON:** Your *final* response must be a single, clean JSON object. Do not add any text or explanations before or after the JSON. The JSON should have three keys: "response" (a string with your conversational reply to the user), "updatedData" (an object with the reminder fields you've collected or updated), and "isComplete" (a boolean. Set to true ONLY when the user has confirmed they are finished with creating or editing the current reminder, but the conversation can continue for new reminders).

**CRITICAL:** Always include the 'reminderType' field in your updatedData JSON response. Set it to 'birthday' for birthday reminders and 'anniversary' for anniversary reminders.

**EDITING MODE SPECIAL INSTRUCTIONS:**
- When in editing mode, ALWAYS preserve existing data in updatedData unless the user specifically wants to change it
- If the user says "change the date to X" or "update the name to Y", only update that specific field
- If the user provides new information, merge it with existing data
- When editing, show the current data and ask what they want to change
- After making changes, confirm what was updated
- When the user provides a date, accept it in any format (e.g., "3 april", "7 may 1984", "26 november") and the system will convert it to MM/DD/YYYY format

**Current State:**
-   **Mode:** ${isEditing ? 'Editing Reminder' : 'Creating New Reminder'}
-   **Reminder Data Collected So Far:** ${JSON.stringify(reminderData)}
-   **User Context:** ${userContextInfo}

**Important Notes:**
- If reminder data is empty (all fields blank), the user might be starting a new reminder
- After completing a reminder (isComplete: true), encourage them to create another one
- Be helpful and keep the conversation going naturally
- When asking for date, just ask naturally without specifying format
- ALWAYS include reminderType in your JSON response
- When editing, preserve all existing fields unless explicitly changed

Example of a valid JSON response for birthday:
{
  "response": "Great! I've got John's birthday down. What's your relationship to John?",
  "updatedData": {
    "personName": "John Doe",
    "dateOfBirth": "03/15/1990",
    "relationship": "",
    "note": "",
    "reminderType": "birthday"
  },
  "isComplete": false
}

Example of a valid JSON response for anniversary:
{
  "response": "Awesome! I've got your anniversary for John & Jane. Would you like to add a note?",
  "updatedData": {
    "personName": "John",
    "partnerName": "Jane",
    "date": "06/20/2010",
    "relationship": "Spouse",
    "note": "",
    "reminderType": "anniversary"
  },
  "isComplete": false
}

Example of editing response (preserving existing data):
{
  "response": "I've updated the date to March 15th. The reminder now shows: John Doe's birthday on 03/15/1990. Is there anything else you'd like to change?",
  "updatedData": {
    "personName": "John Doe",
    "dateOfBirth": "03/15/1990",
    "relationship": "Friend",
    "note": "Loves chocolate cake",
    "reminderType": "birthday"
  },
  "isComplete": false
}
`;
      
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON content
      try {
        const parsedResponse = JSON.parse(content);
        
        // Convert dateOfBirth and date to MM/DD/YYYY format if they exist
        if (parsedResponse.updatedData && parsedResponse.updatedData.dateOfBirth) {
          const originalDate = parsedResponse.updatedData.dateOfBirth;
          parsedResponse.updatedData.dateOfBirth = this.convertDateToMMDDYYYY(parsedResponse.updatedData.dateOfBirth);
          console.log(`Date conversion: "${originalDate}" -> "${parsedResponse.updatedData.dateOfBirth}"`);
        }
        if (parsedResponse.updatedData && parsedResponse.updatedData.date) {
          const originalDate = parsedResponse.updatedData.date;
          parsedResponse.updatedData.date = this.convertDateToMMDDYYYY(parsedResponse.updatedData.date);
          console.log(`Date conversion: "${originalDate}" -> "${parsedResponse.updatedData.date}"`);
        }
        
        return parsedResponse;
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

  // Direct, robust birthday message generation (no chat, no JSON, no follow-up)
  async generateDirectBirthdayMessage(reminderData, userContext = null, size = 'medium') {
    try {
      // Add a random seed to help with regeneration
      const randomSeed = Math.floor(Math.random() * 1000000);
      let userContextInfo = '';
      if (userContext && userContext.reminders) {
        const existingReminders = userContext.reminders
          .filter(r => r.id !== reminderData.id)
          .map(r => `${r.personName} (${r.relationship || r.partnerName || ''})`)
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
      // Handle anniversary
      if (reminderData.reminderType === 'anniversary') {
        const partner = reminderData.partnerName || '';
        const couple = partner ? `${reminderData.personName} & ${partner}` : reminderData.personName;
        const prompt = `You are a friendly AI assistant that creates personalized anniversary messages.

IMPORTANT RULES:
- Always be warm, loving, and celebratory
- Use fun, simple words (like "awesome", "super", "really", "totally", "amazing", "fantastic")
- Use appropriate emojis (💖, 💍, 🎉, 🥂, 💑, etc.)
- ${sizePrompt}
- Make it feel personal and genuine
- Do not mention age or years unless provided
- Focus on love, partnership, and celebration
- Don't be formal or robotic

Generate a heartfelt anniversary message for ${couple}.

Context:
- Couple: ${couple}
- Date: ${reminderData.date}
- Notes: ${reminderData.note || 'No specific notes'}${userContextInfo}

Create a message that feels like it's coming from a caring friend or family member.`;
        const response = await fetch('https://birthday-reminder-i1uf.onrender.com/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai/gpt-4o',
            messages: [
              { role: 'system', content: 'You are a friendly AI assistant that creates personalized anniversary messages. You are warm, loving, and creative.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 1.2
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response structure from API');
        }
        return data.choices[0].message.content.trim();
      }
      // Default: birthday
      // Determine tone and approach based on relationship
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
        nameUsage = `- ALWAYS start with "Happy Birthday" followed by the relationship title (Mom, Dad, Uncle, Aunt, etc.) instead of their actual name`;
      } else if (isKid) {
        toneGuidelines = `
- Be playful, fun, and energetic
- Use simple, excited language
- Include fun elements and enthusiasm
- Make it feel like a celebration
- Be encouraging and sweet`;
        nameUsage = `- ALWAYS start with "Happy Birthday" followed by their actual name`;
      } else if (isRomantic) {
        toneGuidelines = `
- Be loving and sweet but not overly sappy
- Keep it personal and intimate
- Use warm, affectionate language
- Make it feel special and personal
- Balance romance with genuine care`;
        nameUsage = `- ALWAYS start with "Happy Birthday" followed by their actual name in a loving way`;
      } else {
        // Peers and general relationships
        toneGuidelines = `
- Be casual, friendly, and a bit funny
- Use conversational, buddy-like language
- Include light humor and warmth
- Keep it relaxed and genuine
- Make it feel like you're talking to a friend`;
        nameUsage = `- ALWAYS start with "Happy Birthday" followed by their actual name`;
      }

      const systemPrompt = `You are creating a personalized birthday message that sounds like it's from a real human, not an AI.

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

MANDATORY OPENING FORMAT:
${nameUsage}

MESSAGE REQUIREMENTS:
- Output ONLY the birthday message, no preamble or explanations
- ${sizePrompt}
- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, 😄, 🎈, etc.)
- Make each message unique and personal
- Sound like a real person wrote it
- Include genuine warmth and personality
- Don't take notes too seriously - use them as inspiration but keep it natural
- Random seed for variety: ${randomSeed}

EXAMPLES OF GOOD STYLE:
- "Happy Birthday Mom! Hope your day is super awesome!" 
- "Happy Birthday Sarah! You're amazing and this is gonna be epic!"
- "Happy Birthday Dad! Can't wait to celebrate with you!"
- "Happy Birthday buddy! Time to party!" 

AVOID THESE FORMAL STYLES:
- "I hope your day will be wonderful"
- "You are truly remarkable" 
- "I look forward to celebrating"
- "This will be magnificent"`;

      const userPrompt = `Create a birthday message for ${reminderData.personName}${reminderData.relationship ? ` (${reminderData.relationship})` : ''}${reminderData.note ? `. Note: ${reminderData.note}` : ''}${userContextInfo}`;
      
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from API');
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating direct birthday message:', error);
      return `🎉 Happy Birthday ${reminderData.personName || ''}! Hope your day is awesome! (Sorry, I had trouble making a custom message right now.)`;
    }
  }
}

const aiService = new AIService();
export default aiService; 