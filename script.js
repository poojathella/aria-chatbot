// ============================================================
//  ARIA — script.js
//  Powered by Google Gemini API (100% FREE)
//  Free tier: 1 million tokens/day, 15 requests/minute
// ============================================================

// ---- App State ----
let apiKey  = '';
let isDemo  = false;
let listening = false;
let ttsOn   = false;
let recognition = null;
let history = [];   // Gemini multi-turn conversation history
let msgCount = 0;
let demoIndex = 0;

// ============================================================
//  NLP Intent Matching — offline fallback responses
// ============================================================
const intents = [
  { patterns: ['hello','hi','hey','howdy','greetings'],
    response: "Hello! I'm ARIA, your AI assistant. How can I help you today?" },
  { patterns: ['bye','goodbye','see you','farewell'],
    response: "Goodbye! Come back anytime — I'll be here!" },
  { patterns: ['who are you','your name','what are you','about yourself'],
    response: "I'm ARIA — Advanced Reasoning & Intelligence Assistant, powered by Google Gemini AI. I can help with coding, writing, analysis, brainstorming, and much more!" },
  { patterns: ['joke','funny','laugh','humor'],
    response: "Why do programmers always mix up Christmas and Halloween? Because Oct 31 = Dec 25! 🎄" },
  { patterns: ['thank','thanks','appreciate','cheers'],
    response: "You're very welcome! Anything else I can help with?" },
  { patterns: ['help','what can you do','capabilities','features'],
    response: "I can: answer questions, write & edit text, help with code, brainstorm ideas, explain complex topics, draft emails, and much more. What would you like to explore?" },
  { patterns: ['weather','forecast','temperature','rain'],
    response: "I don't have live weather data, but I can explain meteorology or help you find a weather app!" },
  { patterns: ['who made you','who built you','who created'],
    response: "I'm ARIA, a portfolio chatbot powered by Google Gemini AI. Built with HTML, CSS, and JavaScript — 100% free!" },
  { patterns: ['meaning of life','42','philosophy'],
    response: "42 — according to The Hitchhiker's Guide to the Galaxy! But philosophically, meaning is what you create through connection, contribution, and curiosity." },
];

function matchIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of intents) {
    if (intent.patterns.some(p => lower.includes(p))) return intent.response;
  }
  return null;
}

// Demo mode fallback messages
const demoReplies = [
  "I'm in demo mode. For full AI responses (free!), click ⚙ → paste your Gemini key from aistudio.google.com/apikey",
  "Connect your free Google Gemini API key via the ⚙ settings icon to unlock full AI conversation!",
  "Demo mode only. Your free key from aistudio.google.com/apikey gives you 1 million tokens/day — completely free.",
  "Full AI capabilities are one free API key away! Settings → get key at aistudio.google.com → paste it in."
];

// ============================================================
//  API KEY MANAGEMENT
// ============================================================
function saveKey() {
  const k = document.getElementById('kInput').value.trim();
  if (!k || !k.startsWith('AIza')) {
    toast('Please enter a valid Gemini key (starts with AIza)');
    return;
  }
  apiKey = k;
  isDemo = false;
  document.getElementById('modal').style.display = 'none';
  setStatus('Connected — Gemini AI active · Free tier', 'online');
  setDot(true);
  toast('✓ Connected! Gemini AI is ready — 100% free');
}

function demoMode() {
  isDemo = true;
  document.getElementById('modal').style.display = 'none';
  setStatus('Demo mode — click ⚙ to add free API key', 'idle');
  setDot(false);
}

function showModal() {
  document.getElementById('modal').style.display = 'flex';
}

function setDot(on) {
  document.getElementById('sdot').className = 'dot' + (on ? '' : ' off');
}

// ============================================================
//  STATUS BAR
// ============================================================
function setStatus(text, type = 'idle') {
  const bar = document.getElementById('sbar');
  const lbl = document.getElementById('slabel');
  const st  = document.getElementById('stxt');
  bar.className = 'sbar';
  if (type === 'listening') bar.classList.add('listening');
  if (type === 'speaking')  bar.classList.add('speaking');
  if (type === 'err')       bar.classList.add('err');
  if (type === 'thinking')  bar.classList.add('thinking');
  lbl.textContent = text;
  st.textContent  = text;
}

// ============================================================
//  HELPER UTILITIES
// ============================================================
function ftime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Basic markdown → HTML formatter
function fmt(t) {
  let h = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Code blocks
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Line breaks
  h = h.replace(/\n/g, '<br>');
  return h;
}

// ============================================================
//  MESSAGE RENDERING
// ============================================================
function addMsg(text, role) {
  msgCount++;
  // Remove welcome screen on first message
  document.getElementById('welcome')?.remove();

  const area   = document.getElementById('msgs');
  const typing = document.getElementById('typing');
  const isBot  = (role === 'bot');
  const id     = `b${msgCount}`;

  const g = document.createElement('div');
  g.className = `msg-g${isBot ? '' : ' user'}`;

  const avHTML = isBot
    ? `<div class="av bot">
         <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
           <circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/>
           <circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/>
         </svg>
       </div>`
    : `<div class="av usr">YOU</div>`;

  g.innerHTML = `
    ${avHTML}
    <div class="mwrap">
      <div class="bubble ${isBot ? 'bot' : 'usr'}" id="${id}">${fmt(text)}</div>
      <div class="meta">
        <span class="ts">${ftime()}</span>
        <button class="cpbtn" onclick="cp('${id}')">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/>
            <path d="M2.5 8H1.5a1 1 0 0 1-1-1V1.5a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1V2.5" stroke="currentColor" stroke-width="1.1"/>
          </svg>
          Copy
        </button>
      </div>
    </div>`;

  area.insertBefore(g, typing);
  area.scrollTop = area.scrollHeight;
}

function showTyping(v) {
  const t = document.getElementById('typing');
  if (v) {
    t.classList.add('show');
    document.getElementById('msgs').scrollTop = 9999;
  } else {
    t.classList.remove('show');
  }
}

// Copy message to clipboard
function cp(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => toast('Copied!'));
}

// Toast notification
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2100);
}

// ============================================================
//  CLEAR CHAT
// ============================================================
function clearChat() {
  history = [];
  document.getElementById('msgs').innerHTML = `
    <div class="welcome" id="welcome">
      <div class="wicon">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="7" fill="none" stroke="#3d8ef0" stroke-width="1.4"/>
          <path d="M17 5L17 10M17 24L17 29M5 17L10 17M24 17L29 17" stroke="#3d8ef0" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="17" cy="17" r="3" fill="#3d8ef0"/>
        </svg>
      </div>
      <div class="wtitle">Hello, I'm ARIA</div>
      <div class="wsub">Powered by Google Gemini — completely free. Ask me anything.</div>
      <div class="wchips">
        <div class="wchip" onclick="go('Explain machine learning in simple terms')">Machine learning basics</div>
        <div class="wchip" onclick="go('Help me brainstorm a unique startup idea')">Startup brainstorm</div>
        <div class="wchip" onclick="go('What makes great product design?')">Product design principles</div>
        <div class="wchip" onclick="go('Write a haiku about the night sky')">Write me a haiku</div>
      </div>
    </div>
    <div class="typing" id="typing">
      <div class="av bot">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/>
          <circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/>
        </svg>
      </div>
      <div class="tdots"><div class="d"></div><div class="d"></div><div class="d"></div></div>
    </div>`;
}

// ============================================================
//  SEND MESSAGE
// ============================================================
async function send() {
  const inp  = document.getElementById('inp');
  const text = inp.value.trim();
  if (!text) return;

  inp.value = '';
  resize(inp);
  document.getElementById('sbtn').disabled = true;

  addMsg(text, 'user');
  showTyping(true);
  setStatus('Thinking...', 'thinking');

  try {
    let reply;

    if (apiKey && !isDemo) {
      // Full AI mode — call Gemini
      reply = await callGemini(text);
    } else {
      // Offline mode — intent match or demo reply
      const intent = matchIntent(text);
      await delay(600 + Math.random() * 500);
      reply = intent || demoReplies[demoIndex++ % demoReplies.length];
    }

    showTyping(false);
    addMsg(reply, 'bot');

    // Speak if TTS is enabled
    if (ttsOn) speakText(reply);

    setStatus(
      apiKey ? 'Connected — Gemini AI active · Free tier' : 'Demo mode — click ⚙ to add free API key',
      'online'
    );
  } catch (e) {
    showTyping(false);
    addMsg('⚠ Error: ' + (e.message || 'Something went wrong.'), 'bot');
    setStatus('Error — ' + (e.message || 'check your API key'), 'err');
  }

  document.getElementById('sbtn').disabled = false;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  GOOGLE GEMINI API CALL (FREE)
//  Model: gemini-2.0-flash
//  Free tier: 15 req/min, 1M tokens/day
// ============================================================
async function callGemini(userText) {
  // Add user message to history
  history.push({ role: 'user', parts: [{ text: userText }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `You are ARIA (Advanced Reasoning & Intelligence Assistant), a premium AI assistant 
with a professional, helpful personality. Be thoughtful and concise. 
Use light markdown formatting when helpful (bold for emphasis, code blocks for code). 
Keep responses clear and well-structured.`
          }]
        },
        contents: history,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.75
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `API error ${res.status}`;
    if (res.status === 429) throw new Error('Rate limit hit — wait a moment (free tier: 15 req/min)');
    if (res.status === 400) throw new Error('Invalid API key — check your key in settings');
    throw new Error(msg);
  }

  const data  = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('Empty response from Gemini');

  // Add model reply to history (keep last 20 turns = 40 entries)
  history.push({ role: 'model', parts: [{ text: reply }] });
  if (history.length > 40) history = history.slice(-40);

  return reply;
}

// Quick-send from suggestion chips / welcome cards
function go(text) {
  document.getElementById('inp').value = text;
  send();
}

// ============================================================
//  VOICE INPUT — Web Speech API
// ============================================================
function toggleVoice() {
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    toast('Voice input not supported in this browser');
    return;
  }
  if (listening) { stopListen(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous     = false;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  recognition.onstart = () => {
    listening = true;
    document.getElementById('vbtn').classList.add('on');
    setStatus('🎤 Listening — speak now', 'listening');
  };
  recognition.onresult = (e) => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('inp').value = t;
    resize(document.getElementById('inp'));
  };
  recognition.onerror = (e) => { toast('Voice error: ' + e.error); stopListen(); };
  recognition.onend   = () => {
    stopListen();
    if (document.getElementById('inp').value.trim()) send();
  };
  recognition.start();
}

function stopListen() {
  listening = false;
  if (recognition) recognition.stop();
  document.getElementById('vbtn').classList.remove('on');
  setStatus(apiKey ? 'Connected — Gemini AI active · Free tier' : 'Demo mode', 'idle');
}

// ============================================================
//  TEXT-TO-SPEECH — Web Speech Synthesis API
// ============================================================
function toggleTTS() {
  ttsOn = !ttsOn;
  document.getElementById('tbtn').classList.toggle('on', ttsOn);
  toast(ttsOn ? '🔊 Text-to-speech ON' : '🔇 Text-to-speech OFF');
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const clean = text.replace(/[*`#>]/g, '').replace(/<[^>]+>/g, '');
  const u = new SpeechSynthesisUtterance(clean);
  u.rate  = 1.0;
  u.pitch = 1.0;
  u.onstart = () => setStatus('🔊 Speaking...', 'speaking');
  u.onend   = () => setStatus(apiKey ? 'Connected — Gemini AI active · Free tier' : 'Demo mode', 'idle');
  speechSynthesis.speak(u);
}

// ============================================================
//  AUTO-RESIZE TEXTAREA
// ============================================================
function resize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
document.getElementById('inp').addEventListener('keydown', e => {
  // Enter to send, Shift+Enter for new line
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

document.getElementById('inp').addEventListener('input', function () {
  resize(this);
});

// Online / offline detection
window.addEventListener('online',  () => {
  if (apiKey) setStatus('Connected — Gemini AI active · Free tier', 'online');
});
window.addEventListener('offline', () => setStatus('You are offline', 'err'));