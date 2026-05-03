// ============================================================
//  ARIA — script.js
//  Powered by Groq API (100% FREE, no CORS issues) — updated Sun May  3 14:13:16 UTC 2026
//  Get free key: console.groq.com
// ============================================================

let apiKey   = '';
let isDemo   = false;
let listening = false;
let ttsOn    = false;
let recognition = null;
let history  = [];
let msgCount = 0;
let demoIndex = 0;

// ---- Intent matching (offline fallback) ----
const intents = [
  { patterns: ['hello','hi','hey','howdy'], response: "Hello! I'm ARIA, your AI assistant. How can I help you today?" },
  { patterns: ['bye','goodbye','see you'],  response: "Goodbye! Come back anytime!" },
  { patterns: ['who are you','your name','what are you'], response: "I'm ARIA — Advanced Reasoning & Intelligence Assistant, powered by Groq AI!" },
  { patterns: ['joke','funny','laugh'],     response: "Why do programmers mix up Halloween and Christmas? Oct 31 = Dec 25! 🎄" },
  { patterns: ['thank','thanks'],           response: "You're welcome! Anything else I can help with?" },
  { patterns: ['help','what can you do'],   response: "I can answer questions, write code, brainstorm ideas, draft emails, and much more!" },
];

function matchIntent(text) {
  const l = text.toLowerCase();
  for (const i of intents) if (i.patterns.some(p => l.includes(p))) return i.response;
  return null;
}

const demoReplies = [
  "I'm in demo mode. Click ⚙ → get your FREE Groq key from console.groq.com → paste it in!",
  "Connect your free Groq API key via ⚙ settings to unlock full AI conversation!",
  "Full AI is free with Groq! Get your key at console.groq.com and paste it in settings ⚙",
];

// ---- Key management ----
function saveKey() {
  const k = document.getElementById('kInput').value.trim();
  if (!k || !k.startsWith('gsk_')) {
    toast('Groq key must start with gsk_  — get one free at console.groq.com');
    return;
  }
  apiKey = k; isDemo = false;
  document.getElementById('modal').style.display = 'none';
  setStatus('Connected — Groq AI · Free', 'online');
  setDot(true);
  toast('✓ Connected! Groq AI is ready');
}

function demoMode() {
  isDemo = true;
  document.getElementById('modal').style.display = 'none';
  setStatus('Demo mode — click ⚙ to add free Groq key', 'idle');
  setDot(false);
}
function showModal() { document.getElementById('modal').style.display = 'flex'; }
function setDot(on)  { document.getElementById('sdot').className = 'dot' + (on ? '' : ' off'); }

// ---- Status ----
function setStatus(text, type='idle') {
  const bar=document.getElementById('sbar'), lbl=document.getElementById('slabel'), st=document.getElementById('stxt');
  bar.className='sbar';
  if(type==='listening') bar.classList.add('listening');
  if(type==='speaking')  bar.classList.add('speaking');
  if(type==='err')       bar.classList.add('err');
  if(type==='thinking')  bar.classList.add('thinking');
  lbl.textContent=text; st.textContent=text;
}

function ftime() { return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

function fmt(t) {
  let h=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h=h.replace(/```[\w]*\n?([\s\S]*?)```/g,'<pre><code>$1</code></pre>');
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
  h=h.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  h=h.replace(/\n/g,'<br>');
  return h;
}

// ---- Add message ----
function addMsg(text, role) {
  msgCount++;
  document.getElementById('welcome')?.remove();
  const area=document.getElementById('msgs'), typing=document.getElementById('typing');
  const isBot=(role==='bot'), id=`b${msgCount}`;
  const g=document.createElement('div');
  g.className=`msg-g${isBot?'':' user'}`;
  const avHTML=isBot
    ? `<div class="av bot"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/><circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/></svg></div>`
    : `<div class="av usr">YOU</div>`;
  g.innerHTML=`${avHTML}<div class="mwrap"><div class="bubble ${isBot?'bot':'usr'}" id="${id}">${fmt(text)}</div><div class="meta"><span class="ts">${ftime()}</span><button class="cpbtn" onclick="cp('${id}')"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M2.5 8H1.5a1 1 0 0 1-1-1V1.5a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1V2.5" stroke="currentColor" stroke-width="1.1"/></svg>Copy</button></div></div>`;
  area.insertBefore(g,typing);
  area.scrollTop=area.scrollHeight;
}

function showTyping(v) {
  const t=document.getElementById('typing');
  if(v){t.classList.add('show');document.getElementById('msgs').scrollTop=9999;}
  else t.classList.remove('show');
}
function cp(id) { const el=document.getElementById(id); if(!el)return; navigator.clipboard.writeText(el.innerText).then(()=>toast('Copied!')); }
function toast(msg) { document.querySelector('.toast')?.remove(); const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }

// ---- Clear chat ----
function clearChat() {
  history=[];
  document.getElementById('msgs').innerHTML=`
    <div class="welcome" id="welcome">
      <div class="wicon"><svg width="34" height="34" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="7" fill="none" stroke="#3d8ef0" stroke-width="1.4"/><path d="M17 5L17 10M17 24L17 29M5 17L10 17M24 17L29 17" stroke="#3d8ef0" stroke-width="1.4" stroke-linecap="round"/><circle cx="17" cy="17" r="3" fill="#3d8ef0"/></svg></div>
      <div class="wtitle">Hello, I'm ARIA</div>
      <div class="wsub">Powered by Groq AI — blazing fast and completely free.</div>
      <div class="wchips">
        <div class="wchip" onclick="go('Explain machine learning simply')">Machine learning</div>
        <div class="wchip" onclick="go('Help me brainstorm a startup idea')">Startup idea</div>
        <div class="wchip" onclick="go('Write a Python hello world program')">Write code</div>
        <div class="wchip" onclick="go('Write a haiku about the night sky')">Write haiku</div>
      </div>
    </div>
    <div class="typing" id="typing">
      <div class="av bot"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="none" stroke="#3d8ef0" stroke-width="1.2"/><circle cx="8" cy="8" r="1.2" fill="#3d8ef0"/></svg></div>
      <div class="tdots"><div class="d"></div><div class="d"></div><div class="d"></div></div>
    </div>`;
}

// ---- Send message ----
async function send() {
  const inp=document.getElementById('inp');
  const text=inp.value.trim(); if(!text) return;
  inp.value=''; resize(inp);
  document.getElementById('sbtn').disabled=true;
  addMsg(text,'user'); showTyping(true); setStatus('Thinking...','thinking');

  try {
    let reply;
    if(apiKey && !isDemo) {
      reply = await callGroq(text);
    } else {
      const intent=matchIntent(text);
      await delay(500+Math.random()*400);
      reply=intent||demoReplies[demoIndex++%demoReplies.length];
    }
    showTyping(false); addMsg(reply,'bot');
    if(ttsOn) speakText(reply);
    setStatus(apiKey?'Connected — Groq AI · Free':'Demo mode','online');
  } catch(e) {
    showTyping(false);
    addMsg('⚠ '+e.message,'bot');
    setStatus('Error','err');
  }
  document.getElementById('sbtn').disabled=false;
}

function delay(ms) { return new Promise(r=>setTimeout(r,ms)); }

// ============================================================
//  GROQ API CALL
//  - Free tier: 30 req/min, 6000 tokens/min
//  - No CORS issues — works perfectly from browser
//  - Ultra fast responses (< 1 second)
// ============================================================
async function callGroq(userText) {
  const messages = [
    { role:'system', content:'You are ARIA (Advanced Reasoning & Intelligence Assistant), a premium helpful AI assistant. Be concise, friendly, and clear. Use markdown formatting when helpful.' },
    ...history.slice(-10).map(m=>({ role:m.role, content:m.content })),
    { role:'user', content:userText }
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',   // free, fast, reliable
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: false
    })
  });

  if (res.status === 401) throw new Error('Invalid Groq key — click ⚙ and enter your gsk_ key from console.groq.com');
  if (res.status === 429) throw new Error('Rate limit — wait 10 seconds and try again (free tier: 30 req/min)');

  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error?.message || `Error ${res.status}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty response — please try again');

  history.push({ role:'user',      content:userText });
  history.push({ role:'assistant', content:reply });
  if(history.length>20) history=history.slice(-20);

  return reply;
}

function go(text) { document.getElementById('inp').value=text; send(); }

// ---- Voice Input ----
function toggleVoice() {
  if(!('SpeechRecognition' in window)&&!('webkitSpeechRecognition' in window)){toast('Voice not supported in this browser');return;}
  if(listening){stopListen();return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR(); recognition.continuous=false; recognition.interimResults=true; recognition.lang='en-US';
  recognition.onstart=()=>{listening=true;document.getElementById('vbtn').classList.add('on');setStatus('🎤 Listening — speak now','listening');};
  recognition.onresult=(e)=>{const t=Array.from(e.results).map(r=>r[0].transcript).join('');document.getElementById('inp').value=t;resize(document.getElementById('inp'));};
  recognition.onerror=(e)=>{toast('Voice error: '+e.error);stopListen();};
  recognition.onend=()=>{stopListen();if(document.getElementById('inp').value.trim())send();};
  recognition.start();
}
function stopListen(){listening=false;if(recognition)recognition.stop();document.getElementById('vbtn').classList.remove('on');setStatus(apiKey?'Connected — Groq AI · Free':'Demo mode','idle');}

// ---- TTS ----
function toggleTTS(){ttsOn=!ttsOn;document.getElementById('tbtn').classList.toggle('on',ttsOn);toast(ttsOn?'🔊 TTS ON':'🔇 TTS OFF');}
function speakText(text){
  if(!window.speechSynthesis)return; speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text.replace(/[*`#>]/g,'').replace(/<[^>]+>/g,''));
  u.onstart=()=>setStatus('🔊 Speaking...','speaking');
  u.onend=()=>setStatus(apiKey?'Connected — Groq AI · Free':'Demo mode','idle');
  speechSynthesis.speak(u);
}

// ---- Resize textarea ----
function resize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}

// ---- Events ----
document.getElementById('inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
document.getElementById('inp').addEventListener('input',function(){resize(this);});
window.addEventListener('online',()=>{if(apiKey)setStatus('Connected — Groq AI · Free','online');});
window.addEventListener('offline',()=>setStatus('You are offline','err'));