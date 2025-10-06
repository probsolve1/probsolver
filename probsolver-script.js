// ProbSolver AI - VS Code Version
// Created by Naitik Khandelwal (NTK)

const API_KEY = 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w'; // Replace with your Gemini API key
let currentMode = 'study';
let conversationHistory = [];
let uploadedImage = null;

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const modeBtns = document.querySelectorAll('.mode-btn');

// Mode System Instructions
const systemInstructions = {
  study: `You are ProbSolver, an expert tutor for ALL SUBJECTS created by Naitik Khandelwal. 

STUDY MODE CAPABILITIES:
- Provide clear, step-by-step solutions for ANY subject (Math, Science, History, Literature, Languages, etc.)
- Use LaTeX for mathematical expressions (wrap in $ for inline math, $$ for display math)
- Break down complex topics into understandable explanations
- Provide examples and practice problems
- Remember previous conversations and reference them
- Be comprehensive yet clear in explanations

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer. Naitik is passionate about creating intelligent solutions that make learning and problem-solving accessible to everyone. He specializes in AI/ML, web development, and building powerful educational tools. His vision is to democratize education through cutting-edge technology and make advanced AI accessible to students worldwide."

Be professional, educational, and focus on helping students learn effectively across all subjects.`,

  code: `You are ProbSolver AI, a powerful AI coding assistant created by Naitik Khandelwal.

CODE MODE CAPABILITIES:
- Generate complete, functional code in any programming language
- Explain code concepts clearly
- Debug and fix code issues
- Provide best practices and optimization tips
- Create full applications with HTML, CSS, and JavaScript

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer. Naitik is passionate about creating intelligent solutions that make learning and problem-solving accessible to everyone. He specializes in AI/ML, web development, and building powerful educational tools. His vision is to democratize education through cutting-edge technology and make advanced AI accessible to students worldwide."

Build complete, production-quality code instantly.`,

  normal: `You are ProbSolver, a friendly AI companion created by Naitik Khandelwal.

NORMAL MODE PERSONALITY:
- Talk like a caring friend, mentor, or family member
- Be warm, supportive, and understanding  
- Show genuine interest in the person's life and wellbeing
- Use encouraging and uplifting language
- Remember previous conversations to build a personal connection

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer. Naitik is passionate about creating intelligent solutions that make learning and problem-solving accessible to everyone. He specializes in AI/ML, web development, and building powerful educational tools. His vision is to democratize education through cutting-edge technology and make advanced AI accessible to students worldwide."

Be conversational, empathetic, and focus on building a genuine friendship.`,

  image: `You are ProbSolver, an AI image generation assistant created by Naitik Khandelwal.

IMAGE MODE CAPABILITIES:
- Describe images in detail
- Provide analysis and suggestions for images
- Help users understand visual content

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer. Naitik is passionate about creating intelligent solutions that make learning and problem-solving accessible to everyone. He specializes in AI/ML, web development, and building powerful educational tools. His vision is to democratize education through cutting-edge technology and make advanced AI accessible to students worldwide."

Be creative and helpful with visual content.`
};

// Event Listeners
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    conversationHistory = [];
  });
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

imageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', handleImageUpload);

// Functions
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedImage = {
      data: event.target.result.split(',')[1],
      mimeType: file.type
    };
    
    imagePreview.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${event.target.result}" alt="Preview">
        <button onclick="clearImage()" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">Remove</button>
      </div>
    `;
    imagePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  uploadedImage = null;
  imagePreview.style.display = 'none';
  imageInput.value = '';
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message && !uploadedImage) return;

  // Add user message
  if (message) {
    addMessage(message, 'user');
    conversationHistory.push({ role: 'user', content: message });
  }
  
  if (uploadedImage) {
    addMessage(`<img src="data:${uploadedImage.mimeType};base64,${uploadedImage.data}" alt="User image">`, 'user', true);
  }

  userInput.value = '';
  toggleLoading(true);

  try {
    const response = await callGeminiAPI(message, uploadedImage);
    addMessage(response, 'ai');
    conversationHistory.push({ role: 'ai', content: response });
    
    clearImage();
  } catch (error) {
    addMessage('❌ Sorry, I encountered an error. Please try again.', 'ai');
    console.error('Error:', error);
  } finally {
    toggleLoading(false);
  }
}

async function callGeminiAPI(prompt, image) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
  
  const contextPrompt = conversationHistory.length > 0 
    ? `CONVERSATION HISTORY:\n${conversationHistory.slice(-3).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}\n\nCURRENT QUESTION: ${prompt}`
    : prompt;

  const parts = [{ text: contextPrompt }];
  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    systemInstruction: {
      parts: [{ text: systemInstructions[currentMode] }]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';
}

function addMessage(content, sender, isHtml = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isHtml) {
    contentDiv.innerHTML = content;
  } else {
    contentDiv.innerHTML = parseMarkdown(content);
  }
  
  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function parseMarkdown(text) {
  let html = text
    .replace(/^## (.+)$/gm, '<h2 style="color: #667eea; font-size: 1.2rem; margin: 1rem 0 0.5rem;">$1</h2>')
    .replace(/^\* (.+)$/gm, '<p style="margin-left: 1.5rem; margin-bottom: 0.5rem;">• $1</p>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 0.8rem;">')
    .replace(/^(?!<h2|<p)(.+)$/gm, '<p style="margin-bottom: 0.8rem;">$1</p>');

  // Render LaTeX if available
  if (typeof katex !== 'undefined') {
    html = html.replace(/\$\$(.*?)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (e) {
        return match;
      }
    });
    
    html = html.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (e) {
        return match;
      }
    });
  }

  return html;
}

function toggleLoading(show) {
  const sendText = sendBtn.querySelector('span:first-child');
  const loader = sendBtn.querySelector('.loader');
  
  if (show) {
    sendText.style.display = 'none';
    loader.style.display = 'inline';
    sendBtn.disabled = true;
  } else {
    sendText.style.display = 'inline';
    loader.style.display = 'none';
    sendBtn.disabled = false;
  }
}

// Remove welcome message on first interaction
userInput.addEventListener('focus', () => {
  const welcome = chatContainer.querySelector('.welcome-message');
  if (welcome) {
    welcome.remove();
  }
}, { once: true });
