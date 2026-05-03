// ============================================================
//  ARIA — script.js
//  Powered by Hugging Face Inference API (100% FREE)
//  Model: mistralai/Mistral-7B-Instruct-v0.2
// ============================================================

// ---- App State ----
let apiKey   = '';
let isDemo   = false;
let listening = false;
let ttsOn    = false;
let recognition = null;
let history  = [];
let msgCount = 0;
let demoIndex = 0;

// ============================================================
//  NLP Intent Matching — offline fallback
// ============================================================
const intents = [
  { patterns: ['hello','hi','hey','howdy','greetings'],
    response: "Hello! I'm ARIA, your AI assistant. How can I help you today?" },
  { patterns: ['bye','goodbye','see you','farewell'],
    response: "Goodbye! Come back anytime — I'll be here!" },
  { patterns: ['who are you','your name','what are you','about yourself'],
    response: "I'm ARIA — Advanced Reasoning & Intelligence Assistant, powered by Hugging Face AI. I can help with coding, writing, analysis, brainstorming, and much more!" },
  { patterns: ['joke','funny','laugh','humor'],
    response: "Why do programmers always mix up Christmas and Halloween? Because Oct 31 = Dec 25! 🎄" },
  { patterns: ['thank','thanks','appreciate','cheers'],
    response: "You're very welcome! Anything else I can help with?" },
  { patterns: ['help','what can you do','capabilities','features'],
    response: "I can: answer questions, write & edit text, help with code, brainstorm ideas, explain complex topics, draft emails, and much more. What would you like to explore?" },
  { patterns: ['weather','forecast','temperature','rain'],
    response: "I don't have live weather data, but I can explain meteorology or help you find a weather app!" },
  { patterns: ['who made you','who built you','who created'],
    response: "I'm ARIA, a portfolio chatbot powered by Hugging Face AI. Built with HTML, CSS, and JavaScript — 100% free!" },
];

function matchIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of intents) {
    if (intent.patterns.some(p => lower.includes(p))) return intent.response;
  }
  return null;
}

const demoReplies = [
  "I'm in demo mode. For full AI, click ⚙ → paste your Hugging Face token from huggingface.co/settings/tokens",
  "Connect your free Hugging Face token via ⚙ settings to unlock full AI conversation!",
  "Your free HF token from huggingface.co/settings/tokens unlocks full AI — completely free.",
  "Full AI is one free token away! Settings → get token at huggingface.co → paste it in."
];

// ============================================================
//  API KEY MANAGEMENT
// ============================================================
function saveKey() {
  const k = document.getElementById('kInput').value.trim();
  if (!k || !k.startsWith('hf_')) {
    toast('Please enter a valid Hugging Face token (starts with hf_)');
    return;
  }
  apiKey = k;
  isDemo = false;
  document.getElementById('modal').style.display = 'none';
  setStatus('Connected — Hugging Face AI active · Free', 'online');
  setDot(true);
  toast('✓ Connected! Hugging Face AI is ready');
}

function demoMode() {
  isDemo = true;
  document.getElementById('modal').style.display = 'none';
  setStatus('Demo mode — click ⚙ to add free HF token', 'idle');
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
//  HELPERS
// ============================================================
function ftime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmt(t) {
  let h = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  h = h.replace(/\n/g, '<br>');
  return h;
}

// ============================================================
//  MESSAGE RENDERING
// ============================================================
function addMsg(text, role) {
  msgCount++;
  document.getElementById('welcome')?.remove();

  const area   = document.getElementById('msgs');
  const typing = document.getElementById('typing');
  const isBot  = (role === 'bot');
  const id     = `b${msgCount}`;

  const g = document.createElement('div');
  g.className = `msg-g${isBot ? '' : ' user'}`;

  const avHTML = isBot
    ? `<div class="av bot"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/><circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/></svg></div>`
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
  if (v) { t.classList.add('show'); document.getElementById('msgs').scrollTop = 9999; }
  else t.classList.remove('show');
}

function cp(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => toast('Copied!'));
}

function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
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
      <div class="wicon"><svg width="34" height="34" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="7" fill="none" stroke="#3d8ef0" stroke-width="1.4"/><path d="M17 5L17 10M17 24L17 29M5 17L10 17M24 17L29 17" stroke="#3d8ef0" stroke-width="1.4" stroke-linecap="round"/><circle cx="17" cy="17" r="3" fill="#3d8ef0"/></svg></div>
      <div class="wtitle">Hello, I'm ARIA</div>
      <div class="wsub">Powered by Hugging Face AI — completely free. Ask me anything.</div>
      <div class="wchips">
        <div class="wchip" onclick="go('Explain machine learning in simple terms')">Machine learning basics</div>
        <div class="wchip" onclick="go('Help me brainstorm a unique startup idea')">Startup brainstorm</div>
        <div class="wchip" onclick="go('What makes great product design?')">Product design principles</div>
        <div class="wchip" onclick="go('Write a haiku about the night sky')">Write me a haiku</div>
      </div>
    </div>
    <div class="typing" id="typing">
      <div class="av bot"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/><circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/></svg></div>
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
      reply = await callHuggingFace(text);
    } else {
      const intent = matchIntent(text);
      await delay(600 + Math.random() * 500);
      reply = intent || demoReplies[demoIndex++ % demoReplies.length];
    }
    showTyping(false);
    addMsg(reply, 'bot');
    if (ttsOn) speakText(reply);
    setStatus(
      apiKey ? 'Connected — Hugging Face AI active · Free' : 'Demo mode — click ⚙ to add free HF token',
      'online'
    );
  } catch (e) {
    showTyping(false);
    addMsg('⚠ Error: ' + (e.message || 'Something went wrong. Try again.'), 'bot');
    setStatus('Error — ' + (e.message || 'check your token'), 'err');
  }

  document.getElementById('sbtn').disabled = false;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  HUGGING FACE INFERENCE API (FREE)
//  Model: mistralai/Mistral-7B-Instruct-v0.2
// ============================================================
async function callHuggingFace(userText) {
  // Build last 6 messages as context
  const recent = history.slice(-6);
  let context = '';
  for (const msg of recent) {
    if (msg.role === 'user')      context += `[INST] ${msg.content} [/INST]\n`;
    if (msg.role === 'assistant') context += `${msg.content}\n`;
  }

  // Mistral instruct prompt format
  const prompt = `<s>[INST] You are ARIA (Advanced Reasoning & Intelligence Assistant), a premium helpful AI. Be concise and clear. Use markdown when helpful. [/INST] Understood, I am ARIA!</s>
${context}[INST] ${userText} [/INST]`;

  const res = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false   // ← only return the new reply, not the prompt
        }
      })
    }
  );

  // Model cold-start — HF free tier loads model on first request
  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    const wait = data.estimated_time ? Math.ceil(data.estimated_time) : 20;
    throw new Error(`Model is warming up (~${wait}s) — please wait and try again`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid token — check your HF token in ⚙ settings');
    if (res.status === 429) throw new Error('Rate limit hit — wait a moment and try again');
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();

  // Parse response
  let reply = '';
  if (Array.isArray(data) && data[0]?.generated_text) {
    reply = data[0].generated_text.trim();
  } else if (typeof data.generated_text === 'string') {
    reply = data.generated_text.trim();
  }

  if (!reply) throw new Error('Empty response — please try again');

  // Clean up any stray prompt artifacts
  reply = reply.replace(/^\[INST\][\s\S]*?\[\/INST\]/g, '').trim();
  reply = reply.replace(/^<s>|<\/s>$/g, '').trim();

  // Save to history (keep last 10 turns)
  history.push({ role: 'user',      content: userText });
  history.push({ role: 'assistant', content: reply });
  if (history.length > 20) history = history.slice(-20);

  return reply;
}

// Quick-send from chips
function go(text) {
  document.getElementById('inp').value = text;
  send();
}

// ============================================================
//  VOICE INPUT
// ============================================================
function toggleVoice() {
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    toast('Voice input not supported in this browser'); return;
  }
  if (listening) { stopListen(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
  recognition.onstart  = () => { listening = true; document.getElementById('vbtn').classList.add('on'); setStatus('🎤 Listening — speak now', 'listening'); };
  recognition.onresult = (e) => { const t = Array.from(e.results).map(r => r[0].transcript).join(''); document.getElementById('inp').value = t; resize(document.getElementById('inp')); };
  recognition.onerror  = (e) => { toast('Voice error: ' + e.error); stopListen(); };
  recognition.onend    = () => { stopListen(); if (document.getElementById('inp').value.trim()) send(); };
  recognition.start();
}

function stopListen() {
  listening = false;
  if (recognition) recognition.stop();
  document.getElementById('vbtn').classList.remove('on');
  setStatus(apiKey ? 'Connected — Hugging Face AI active · Free' : 'Demo mode', 'idle');
}

// ============================================================
//  TEXT-TO-SPEECH
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
  u.rate = 1.0; u.pitch = 1.0;
  u.onstart = () => setStatus('🔊 Speaking...', 'speaking');
  u.onend   = () => setStatus(apiKey ? 'Connected — Hugging Face AI active · Free' : 'Demo mode', 'idle');
  speechSynthesis.speak(u);
}

// ============================================================
//  TEXTAREA AUTO-RESIZE
// ============================================================
function resize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
document.getElementById('inp').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
document.getElementById('inp').addEventListener('input', function () { resize(this); });
window.addEventListener('online',  () => { if (apiKey) setStatus('Connected — Hugging Face AI active · Free', 'online'); });
window.addEventListener('offline', () => setStatus('You are offline', 'err'));