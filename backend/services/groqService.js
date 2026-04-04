const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const parseJSON = (text) => {
  if (!text) throw new Error('Empty AI response');

  let cleaned = text.trim();

  cleaned = cleaned.replace(/```json\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');
  cleaned = cleaned.replace(/^json\n?/gm, '');
  cleaned = cleaned.replace(/^[\s\n]*/, '');
  cleaned = cleaned.replace(/[\s\n]*$/, '');

  let jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);

  if (!jsonMatch) {
    const lines = cleaned.split('\n').slice(0, 5).join('\n');
    throw new Error(`Invalid JSON response. Got: ${lines}...`);
  }

  let parsed = jsonMatch[0];
  
  try {
    return JSON.parse(parsed);
  } catch (err) {
    const arrayMatch = parsed.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e) {}
    }
    const objectMatch = parsed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (e) {}
    }
    console.error('JSON Parse Failed:', parsed);
    throw new Error('Invalid JSON response: ' + err.message);
  }
};

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = 'llama-3.3-70b-versatile';
  }

  async chat(messages, systemPrompt = null) {
    try {
      const chatMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: this.model,
          messages: chatMessages,
          temperature: 0.3,
          max_tokens: 2048
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      throw new Error(
        error.response?.data?.error?.message || 'Failed to get response from AI'
      );
    }
  }

  async generateQuestions(topic, category, difficulty, count = 5) {
    const systemPrompt = `You are an expert technical interviewer. Generate ${count} interview questions.

Topic: ${topic}
Category: ${category}
Difficulty: ${difficulty}

Return ONLY JSON array in this format:

[
 {
   "title": "Question title",
   "description": "Question description",
   "category": "${category}",
   "difficulty": "${difficulty}",
   "keywords": ["keyword1","keyword2"],
   "answer": "Simple answer",
   "explanation": "Explanation"
 }
]`;

    const userMessage = {
      role: 'user',
      content: `Generate ${count} ${difficulty} ${category} interview questions about ${topic}.`
    };

    const result = await this.chat([userMessage], systemPrompt);
    return parseJSON(result);
  }

  async generateMockInterviewQuestions(role, focusAreas, count = 5) {
    const focusStr = focusAreas.join(', ');

    const systemPrompt = `You are an expert interviewer.

Generate ${count} realistic interview questions for role ${role}.
Focus areas: ${focusStr}

IMPORTANT: Return ONLY a valid JSON array. No text before or after.

Format:
[{"title":"Question","description":"Context","category":"Technical","difficulty":"Medium","keywords":["skill1"],"answer":"Key points","explanation":"What interviewer wants"}]`;

    const userMessage = {
      role: 'user',
      content: `Generate ${count} interview questions for ${role} focusing on ${focusStr}. Return ONLY a JSON array.`
    };

    try {
      const result = await this.chat([userMessage], systemPrompt);
      const questions = parseJSON(result);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      return questions;
    } catch (err) {
      console.error('Error generating mock interview questions:', err);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  async evaluateAnswer(question, userAnswer) {
    const systemPrompt = `You are an interviewer evaluating an answer.

Question: ${question.title}
Description: ${question.description}

Return JSON:

{
 "score":0-100,
 "strengths":["strength1"],
 "weaknesses":["weakness1"],
 "feedback":"feedback text",
 "sampleBetterAnswer":"better answer"
}`;

    const userMessage = {
      role: 'user',
      content: `User Answer: ${userAnswer}`
    };

    const result = await this.chat([userMessage], systemPrompt);
    return parseJSON(result);
  }

  async explainQuestion(question) {
    const systemPrompt = `Explain this interview question clearly for a candidate.`;

    const userMessage = {
      role: 'user',
      content: `
Question: ${question.title}
Description: ${question.description}

Explain:
1 What interviewer wants
2 Key points to answer
3 Example answer
4 Tips
`
    };

    return await this.chat([userMessage], systemPrompt);
  }

  async chatbot(userMessage, history = []) {
    const systemPrompt = `You are an AI interview coach helping candidates prepare for interviews.`;

    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    messages.push({
      role: 'user',
      content: userMessage
    });

    return await this.chat(messages, systemPrompt);
  }

  async getBehavioralQuestions() {
    const systemPrompt = `Generate 20 behavioral interview questions.

Return ONLY JSON:

[
 {
   "question":"Tell me about yourself",
   "answer":"Sample STAR answer",
   "keyPoints":["point1"],
   "whatLookFor":"what interviewer wants",
   "tips":"tips"
 }
]`;

    const userMessage = {
      role: 'user',
      content: 'Generate behavioral interview questions.'
    };

    const result = await this.chat([userMessage], systemPrompt);
    return parseJSON(result);
  }

  async compareAnswers(userAnswer, correctAnswer, question) {
    const systemPrompt = `Compare two answers.

Return JSON:

{
 "score":0-100,
 "strengths":["strength"],
 "missing":["missing"],
 "improvements":["improvement"],
 "betterAnswer":"better version"
}`;

    const userMessage = {
      role: 'user',
      content: `
Question: ${question}

User Answer:
${userAnswer}

Correct Answer:
${correctAnswer}
`
    };

    const result = await this.chat([userMessage], systemPrompt);
    return parseJSON(result);
  }

  async getAnswer(question, description) {
    const systemPrompt = `You are an expert interview coach. Provide a comprehensive and detailed answer for the following interview question. Include:
1. A clear, structured answer
2. Key points to cover
3. Example if applicable
4. Tips for answering well

Format the response clearly with headings and bullet points where appropriate.`;

    const userMessage = {
      role: 'user',
      content: `
Interview Question: ${question}

${description ? `Additional Context: ${description}` : ''}

Please provide a thorough answer.`
    };

    return await this.chat([userMessage], systemPrompt);
  }

  async detectError(imageBase64) {
    const systemPrompt = `You are an expert code debugger. Analyze the uploaded image containing code and:
1. Identify all errors in the code (syntax errors, logical errors, runtime errors)
2. Provide the corrected version of the code
3. Explain what was wrong and how to fix it

Return ONLY valid JSON in this format:
{
  "errors": ["error description 1", "error description 2"],
  "correctedCode": "the corrected code with proper formatting",
  "explanation": "clear explanation of what was wrong and how it was fixed"
}`;

    const userMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze this code image and identify errors, then provide the corrected code.'
        },
        {
          type: 'image_url',
          image_url: {
            url: imageBase64
          }
        }
      ]
    };

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            userMessage
          ],
          temperature: 0.3,
          max_tokens: 2048
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      return parseJSON(result);
    } catch (error) {
      console.error('Vision API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to analyze code image'
      );
    }
  }

  async extractSkillsFromResume(resumeText) {
    const systemPrompt = `You are an expert HR professional. Analyze the provided resume text and extract all skills.

IMPORTANT: You MUST respond with ONLY a valid JSON array of strings. Nothing else.

Example valid response:
["JavaScript", "React", "Node.js", "Python", "Communication", "Leadership"]

Return between 10-25 most relevant skills found in the resume.`;

    const userMessage = {
      role: 'user',
      content: `Extract all skills from this resume. Return ONLY a JSON array of skill strings:\n\n${resumeText.substring(0, 8000)}`
    };

    try {
      const result = await this.chat([userMessage], systemPrompt);
      
      let skills = [];
      
      try {
        skills = parseJSON(result);
      } catch (err) {
        console.error('Failed to parse skills JSON, trying fallback:', err.message);
        
        const arrayMatch = result.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          try {
            skills = JSON.parse(arrayMatch[0]);
          } catch (e) {
            const items = result.match(/"([^"]+)"/g);
            if (items && items.length > 0) {
              skills = items.map(item => item.replace(/"/g, '')).filter(s => s.length > 1);
            }
          }
        }
      }
      
      if (!Array.isArray(skills)) {
        skills = [];
      }
      
      if (skills.length === 0) {
        skills = this.extractSkillsFromTextFallback(resumeText);
      }
      
      return skills.slice(0, 25);
    } catch (error) {
      console.error('Error extracting skills from resume:', error);
      const fallbackSkills = this.extractSkillsFromTextFallback(resumeText);
      return fallbackSkills.slice(0, 25);
    }
  }

  extractSkillsFromTextFallback(text) {
    const commonTechSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails',
      'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Elasticsearch',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Jenkins',
      'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
      'REST', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
      'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'NLP',
      'Linux', 'Windows Server', 'Networking', 'Security'
    ];

    const commonSoftSkills = [
      'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Adaptability', 'Creativity', 'Collaboration', 'Presentation',
      'Project Management', 'Analytical Skills', 'Attention to Detail'
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();

    for (const skill of commonTechSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    for (const skill of commonSoftSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return [...new Set(foundSkills)];
  }

  async generateResumeBasedQuestions(skills, focusAreas, count = 5) {
    const skillsStr = skills.join(', ');
    const focusStr = focusAreas.join(', ');

    const systemPrompt = `You are an expert interviewer.

Based on the candidate's resume skills: ${skillsStr}

Generate ${count} interview questions that test these skills.

IMPORTANT: Return ONLY a valid JSON array. No text before or after the array.

Format:
[{"title":"Question","description":"Context","category":"Technical","difficulty":"Medium","keywords":["skill1"],"answer":"Key points","explanation":"What interviewer wants"}]`;

    const userMessage = {
      role: 'user',
      content: `Generate ${count} interview questions based on these skills: ${skillsStr}. Focus areas: ${focusStr}. Return ONLY a JSON array.`
    };

    try {
      const result = await this.chat([userMessage], systemPrompt);
      const questions = parseJSON(result);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      return questions;
    } catch (err) {
      console.error('Error generating resume questions:', err);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  async generateJobDescriptionQuestions(jobTitle, jobDescription, focusAreas, count = 5) {
    const focusStr = focusAreas.join(', ');

    const systemPrompt = `You are an expert interviewer.

For the role: ${jobTitle}

Job Description:
${jobDescription}

Generate ${count} interview questions based on the job requirements.

IMPORTANT: Return ONLY a valid JSON array. No text before or after.

Format:
[{"title":"Question","description":"Context","category":"Technical","difficulty":"Medium","keywords":["skill1"],"answer":"Key points","explanation":"What interviewer wants"}]`;

    const userMessage = {
      role: 'user',
      content: `Generate ${count} interview questions for ${jobTitle} based on this job description. Focus areas: ${focusStr}.\n\n${jobDescription}\n\nReturn ONLY a JSON array.`
    };

    try {
      const result = await this.chat([userMessage], systemPrompt);
      const questions = parseJSON(result);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      return questions;
    } catch (err) {
      console.error('Error generating job description questions:', err);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }
}

module.exports = new GroqService();