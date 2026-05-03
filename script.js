// ============================================================
//  ARIA — script.js (FIXED VERSION)
//  Hugging Face Browser-Safe Integration
// ============================================================

// ---- App State ----
let apiKey = '';
let isDemo = false;
let listening = false;
let ttsOn = false;
let recognition = null;
let history = [];
let msgCount = 0;
let demoIndex = 0;

// ============================================================
//  SIMPLE NLP (fallback)
// ============================================================
const intents = [
  { patterns: ['hello','hi'], response: "Hello! 😊" },
  { patterns: ['bye'], response: "Goodbye! 👋" },
  { patterns: ['your name'], response: "I'm ARIA 🤖" },
  { patterns: ['help'], response: "I can chat, answer questions, and help you!" }
];

function matchIntent(text) {
  const lower = text.toLowerCase();
  for (const i of intents) {
    if (i.patterns.some(p => lower.includes(p))) return i.response;
  }
  return null;
}

// ============================================================
//  API KEY
// ============================================================
function saveKey() {
  const k = document.getElementById('kInput').value.trim();
  if (!k.startsWith('hf_')) {
    alert("Invalid Hugging Face key");
    return;
  }
  apiKey = k;
  isDemo = false;
  alert("✅ Connected!");
}

// ============================================================
//  MESSAGE UI
// ============================================================
function addMsg(text, role) {
  const area = document.getElementById("msgs");

  const div = document.createElement("div");
  div.className = "msg " + role;
  div.innerText = text;

  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function showTyping(v) {
  document.getElementById("typing").style.display = v ? "block" : "none";
}

// ============================================================
//  SEND MESSAGE
// ============================================================
async function send() {
  const inp = document.getElementById("inp");
  const text = inp.value.trim();

  if (!text) return;

  inp.value = "";
  addMsg(text, "user");
  showTyping(true);

  try {
    let reply;

    if (apiKey) {
      reply = await callHuggingFace(text);
    } else {
      reply = matchIntent(text) || "Demo mode response 🤖";
    }

    showTyping(false);
    addMsg(reply, "bot");

  } catch (e) {
    showTyping(false);
    addMsg("❌ Error: " + e.message, "bot");
  }
}

// ============================================================
//  ✅ FIXED HUGGING FACE CALL (NO CORS ERROR)
// ============================================================
async function callHuggingFace(userText) {

  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: userText
      })
    }
  );

  if (!response.ok) {
    throw new Error("API Error: " + response.status);
  }

  const data = await response.json();

  let reply = "No response";

  if (Array.isArray(data)) {
    reply = data[0]?.generated_text || reply;
  } else {
    reply = data.generated_text || reply;
  }

  return reply;
}

// ============================================================
//  VOICE INPUT
// ============================================================
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SR) {
    alert("Voice not supported");
    return;
  }

  recognition = new SR();
  recognition.lang = "en-US";

  recognition.start();

  recognition.onresult = (e) => {
    document.getElementById("inp").value =
      e.results[0][0].transcript;
  };
}

// ============================================================
//  SPEAK OUTPUT
// ============================================================
function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
}

// ============================================================
//  ENTER KEY SUPPORT
// ============================================================
document.getElementById("inp").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    send();
  }
});