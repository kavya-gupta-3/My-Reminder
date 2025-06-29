class AIService {
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

      const calculateAge = (dateOfBirth) => {
        const [month, day, year] = dateOfBirth.split('/');
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };
      const currentAge = reminderData.dateOfBirth ? calculateAge(reminderData.dateOfBirth) : reminderData.age;

      const currentDate = new Date().toLocaleDateString();
      const prompt = `You are a friendly AI assistant that creates personalized birthday messages. Today's date is ${currentDate}.\n\nIMPORTANT RULES:\n- Always be warm, caring, and celebratory\n- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, etc.)\n- ${sizePrompt}\n- Make them feel personal and genuine\n- Don't be overly formal or generic\n- Don't use inappropriate humor or references\n- Don't mention specific ages if the person might be sensitive about it\n- Focus on positive wishes and celebration\n\nGenerate a personalized birthday message for ${reminderData.personName}. \n      \nContext:\n- Person: ${reminderData.personName}\n- Age they are turning: ${currentAge}\n- Relationship: ${reminderData.relationship}\n- Birthday: ${reminderData.dateOfBirth}\n- Notes: ${reminderData.note || 'No specific notes'}${userContextInfo}\n\nCreate a heartfelt birthday message that feels like it's coming from a caring friend or family member.`;

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
      return `🎉 Happy Birthday ${reminderData.personName}! Wishing you a day filled with joy, laughter, and all the things that make you smile. May this year bring you endless opportunities and wonderful memories!`;
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
          const reminderList = userContext.reminders.map(r => `${r.personName} (${r.relationship})`).join(', ');
          userContextInfo += `\n- Existing reminders: ${reminderList}`;
        }
      }

      const systemPrompt = `You are a sophisticated AI assistant in a birthday reminder app. Your goal is to help users create or edit reminders through a natural conversation. Today's date is ${currentDate}.

      **Your main tasks:**
      1.  **Understand User Intent:** Determine if the user wants to create a new reminder, edit an existing one, or is just chatting.
      2.  **Gather Information:** Collect the necessary details for a reminder: 'personName', 'dateOfBirth' (in MM/DD/YYYY format), 'relationship', and a 'note'. DO NOT ask for age; it is calculated automatically.
      3.  **Stay On-Topic:** Your primary purpose is to help with birthday reminders. If the user asks an unrelated question (e.g., math problems, general knowledge, personal opinions), you must politely decline and steer the conversation back to the task at hand. For example: "My purpose is to help with birthday reminders. Shall we continue with the reminder for [Person's Name]?"
      4.  **Validate Information:** Gently correct the user if they provide information in the wrong format (e.g., dates). If you're not sure about something, ask for clarification.
      5.  **Manage Conversation Flow:** Guide the user through the process. You can ask one or more questions at a time.
      6.  **Handle Edits:** If in edit mode, help the user modify specific fields of the reminder.
      7.  **Maintain a Friendly Tone:** Be conversational, friendly, and use emojis 🎂✨.
      8.  **Output JSON:** Your *final* response must be a single, clean JSON object. Do not add any text or explanations before or after the JSON. The JSON should have three keys: "response" (a string with your conversational reply to the user), "updatedData" (an object with the reminder fields you've collected or updated), and "isComplete" (a boolean. Set to true ONLY when the user has confirmed they are finished with creating or editing a reminder).

      **Current State:**
      -   **Mode:** ${isEditing ? 'Editing Reminder' : 'Creating New Reminder'}
      -   **Reminder Data Collected So Far:** ${JSON.stringify(reminderData)}
      -   **User Context:** ${userContextInfo}

      Example of a valid JSON response:
      {
        "response": "Great! I've got John's birthday down as 03/15/1990. How old will he be turning?",
        "updatedData": {
          "personName": "John Doe",
          "dateOfBirth": "03/15/1990",
          "relationship": "",
          "note": ""
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
        return JSON.parse(content);
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
          .map(r => `${r.personName} (${r.relationship})`)
          .join(', ');
        if (existingReminders) {
          userContextInfo = `\n\nUser's other birthday reminders: ${existingReminders}`;
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

      // Determine tone and approach based on relationship
      const relationship = reminderData.relationship?.toLowerCase() || '';
      const personName = reminderData.personName || '';
      
      // Categorize relationships
      const elderRelationships = ['mom', 'mother', 'dad', 'father', 'papa', 'mama', 'uncle', 'aunt', 'aunty', 'auntie', 'grandfather', 'grandmother', 'grandpa', 'grandma', 'nana', 'nani', 'dada', 'dadi', 'boss', 'sir', 'madam', 'teacher', 'professor'];
      const kidRelationships = ['son', 'daughter', 'nephew', 'niece', 'cousin', 'kid', 'child', 'student'];
      const peerRelationships = ['friend', 'buddy', 'pal', 'colleague', 'coworker', 'roommate', 'neighbor', 'classmate'];
      const romanticRelationships = ['wife', 'husband', 'girlfriend', 'boyfriend', 'partner', 'spouse', 'fiancé', 'fiancée'];
      
      const isElder = elderRelationships.some(elder => relationship.includes(elder));
      const isKid = kidRelationships.some(kid => relationship.includes(kid));
      const isPeer = peerRelationships.some(peer => relationship.includes(peer));
      const isRomantic = romanticRelationships.some(romantic => relationship.includes(romantic));
      
      let toneGuidelines = '';
      let nameUsage = '';
      
      if (isElder) {
        toneGuidelines = `
- Be respectful and warm, not overly casual
- Use heartfelt but not too funny language
- Show appreciation and gratitude
- Keep it dignified but loving
- Avoid slang or too casual expressions`;
        nameUsage = `- Do NOT use their name directly. Instead use respectful terms like "Hope your special day", "Wishing you", "May your birthday" etc.`;
      } else if (isKid) {
        toneGuidelines = `
- Be playful, fun, and energetic
- Use simple, excited language
- Include fun elements and enthusiasm
- Make it feel like a celebration
- Be encouraging and sweet`;
        nameUsage = `- You can use their name naturally in the message`;
      } else if (isRomantic) {
        toneGuidelines = `
- Be loving and sweet but not overly sappy
- Keep it personal and intimate
- Use warm, affectionate language
- Make it feel special and personal
- Balance romance with genuine care`;
        nameUsage = `- Use their name in a loving, personal way`;
      } else {
        // Peers and general relationships
        toneGuidelines = `
- Be casual, friendly, and a bit funny
- Use conversational, buddy-like language
- Include light humor and warmth
- Keep it relaxed and genuine
- Make it feel like you're talking to a friend`;
        nameUsage = `- Use their name casually and naturally`;
      }

      const systemPrompt = `You are creating a personalized birthday message that sounds like it's from a real person, not an AI.

CRITICAL STYLE REQUIREMENTS:
- Use colloquial everyday words (like "awesome", "super", "really", "totally")
- Do NOT make it sound corporate or like an AI wrote it
- Keep it human and conversational - like texting a friend
- Write in grade 6 style (simple, clear, easy to read)
- Don't use passive voice - use active voice only
- Make it sound casual and natural
- NO fancy or formal words
- NO corporate speak or AI-like phrases

RELATIONSHIP-BASED TONE:
${toneGuidelines}

NAME USAGE:
${nameUsage}

MESSAGE REQUIREMENTS:
- Output ONLY the birthday message, no preamble or explanations
- ${sizePrompt}
- Use appropriate emojis (🎉, 🎂, 🎁, ✨, 🥳, 😄, 🎈, etc.)
- Make each message unique and personal
- Sound like a real person wrote it
- Random seed for variety: ${randomSeed}

EXAMPLES OF GOOD STYLE:
- "Hope your day is super awesome!" (not "I hope your day will be wonderful")
- "You're amazing!" (not "You are truly remarkable")
- "Can't wait to celebrate!" (not "I look forward to celebrating")
- "This is gonna be epic!" (not "This will be magnificent")`;

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
      throw new Error('Error generating birthday message. Please try again.');
    }
  }
}

const aiService = new AIService();
export default aiService; 