// src/components/ChatPhone.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TarotScreen from "./TarotScreen";
import Game from "./Game";
import {
  X, Image as Img, Send, ChevronLeft, Sun, Cloud, Moon,
  Settings, Plus, Trash2, Timer, Phone
} from "lucide-react";

type Props = { open: boolean; onClose: () => void };
type Mood = "sunny" | "cloudy" | "night";
type Buddy = { id: "skylar" | "louise" | "luther" | "Joshua"; name: string; species: string; persona: string; avatar: string };
type Message = { id: number; role: "bot" | "me"; text: string };

/* -------------------- Theme -------------------- */
const THEME = {
  main_text_color: "rgba(15,29,96,1)",
  italics_text_color: "rgba(90,132,212,1)",
  underline_text_color: "rgba(85,125,184,1)",
  quote_text_color: "rgba(97,119,233,1)",
  blur_tint_color: "rgba(239,239,239,0.62)",
  chat_tint_color: "rgba(255,255,255,0.60)",
  user_mes_blur_tint_color: "rgba(182,198,231,0.36)",
  bot_mes_blur_tint_color: "rgba(160,202,199,0.20)",
  shadow_color: "rgba(255,255,255,0.96)",
};

const BUDDIES: Buddy[] = [
  { id: "skylar",  name: "Skylar",  species: "dumbo octopus", persona: "outgoing · creative",      avatar: "🐙" },
  { id: "louise",  name: "Louise",  species: "jellyfish",     persona: "wisdom · gentle",          avatar: "🪼" },
  { id: "luther",  name: "Luther",  species: "whale",         persona: "observant · supportive",  avatar: "🐋" },
  { id: "Joshua",  name: "Joshua",  species: "turtle",        persona: "cool · funny",            avatar: "🐢" },
];

/* ------------ Wallpaper by mood ------------ */
function wallpaper(mood: Mood): React.CSSProperties {
  if (mood === "sunny") {
    return {
      background:
        "linear-gradient(180deg, rgba(230,240,255,0.75), rgba(255,255,255,0))," +
        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.85), rgba(255,255,255,0) 42%)," +
        "linear-gradient(180deg, #eef6ff 0%, #d9e9ff 60%, #eef6ff 100%)",
    };
  }
  if (mood === "cloudy") {
    return {
      background:
        "linear-gradient(180deg, rgba(200,214,234,0.6), rgba(255,255,255,0))," +
        "linear-gradient(180deg, #e9eef6 0%, #dbe3ee 60%, #e9eef6 100%)",
    };
  }
  return {
    background:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.10), rgba(0,0,0,0) 40%)," +
      "linear-gradient(180deg, #0b1220 0%, #0a1322 60%, #08111d 100%)",
    color: "#eaf2ff",
  };
}

/* ============ mood detection + buddy voices + name personalization ============ */
function DETECT_MOOD(text: string): "tired" | "sad" | "angry" | "neutral" {
  if (!text) return "neutral";
  const t = text.toLowerCase();
  const tiredRe = /(tired|exhausted|overwhelmed|burn(ed)?\s*out|stress(ed)?|anxious|busy|pressure|drained)/i;
  const sadRe   = /(sad|down|bad|cry|upset|hurt|lonely|blue|depress(ed)?|heartbroken)/i;
  const angryRe = /(angry|mad|pissed|frustrat(ed)?|annoy(ed)?|irritat(ed)?|rage)/i;
  if (tiredRe.test(t)) return "tired";
  if (sadRe.test(t))   return "sad";
  if (angryRe.test(t)) return "angry";
  return "neutral";
}

const VOICE: Record<string, {
  tired: string; sad: string; angry: string; neutral: string;
}> = {
  skylar: {
    tired:   "I can feel the weight you’re carrying. I want to slow down with you, one small step at a time.",
    sad:     "Your heart feels heavy. I want to hold you in a gentle pause and make room for your breath.",
    angry:   "I sense the fire in you. I want to help you set clear boundaries and channel that energy safely.",
    neutral: "I’m here, listening closely. Would brainstorming help, or should I simply stay by your side?",
  },
  louise: {
    tired:   "I hear your pace getting slower. I’ll match your rhythm and let each breath wash tension away.",
    sad:     "Your feelings are tender and deserve kindness. I’ll hold space until you’re ready to move forward.",
    angry:   "Your edges are bristling. I’ll help name the pain and guide you back to what you can control.",
    neutral: "Thank you for sharing. Should I offer a few gentle ideas, or a quiet pause first?",
  },
  luther: {
    tired:   "The waves feel strong. I’ll anchor beside you and focus on the three most important things.",
    sad:     "Even in deep water, I see light. Let’s rise slowly together so your chest feels lighter.",
    angry:   "The wind is rough. I’ll steady the ship—boundaries, pace, energy—one by one we’ll manage it.",
    neutral: "I’m mapping your path as we talk. Which point are you ready to move on first?",
  },
  Joshua: {
    tired:   "Low-battery mode detected! I’ll switch off the noise and help you secure one small win. 🙂",
    sad:     "Cloudy skies happen. Deep breath—then I’ll guide you to a tiny joy route 🫶",
    angry:   "Anger level rising, got it! Let’s dock those feelings safely, then K.O. the problem piece by piece. 😎",
    neutral: "I’m tuned in. Do you want sparks of inspiration, a quick two-step plan, or a joke to lighten up?",
  },
};

const GENERIC_VOICE = {
  tired:   "I feel the strain on your shoulders. Let’s slow our rhythm and focus only on the next step.",
  sad:     "Your heart aches. I’m right here, holding the space until you’re ready.",
  angry:   "I sense your defenses rising. Let’s steady things first, then face the challenge part by part.",
  neutral: "I’m really listening. I can offer a few ideas, or sit quietly with you.",
};

function personalize(text: string, nameRaw: string | undefined) {
  const name = (nameRaw && nameRaw.trim()) || "friend";
  return text
    .replace(/\byou(?:'|’)?re\b/gi, `${name} are`)
    .replace(/\byou are\b/gi, `${name} are`)
    .replace(/\byour\b/gi, `${name}’s`)
    .replace(/\byou\b/gi, name);
}

/* ======================= ChatPhone ======================= */
export default function ChatPhone({ open, onClose }: Props) {
  // ---- Portal root ----
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let el = document.getElementById("vlinks-portal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "vlinks-portal-root";
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, []);

  // ---- State ----
  const [screen, setScreen] =
    useState<"lock" | "home" | "vchat" | "chat" | "settings" | "game" | "tarot">("lock");
  const [mood, setMood] = useState<Mood>("sunny");
  const [now, setNow] = useState(new Date());
  const [vchatTab, setvchatTab] = useState<"chats" | "contacts" | "discover" | "me">("chats");
  const [currentBuddy, setCurrentBuddy] = useState<Buddy | null>(null);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const [myName, setMyName] = useState("User");
  const [myAvatar, setMyAvatar] = useState("🙂");
  const [plusOpen, setPlusOpen] = useState(false);
  const [newMemory, setNewMemory] = useState("");

  const [editMode, setEditMode] = useState(false);          // 桌面抖动模式
  const [activityOpen, setActivityOpen] = useState(true);   // 动态岛活动卡
  const [activityType, setActivityType] = useState<"timer"|"call">("timer");

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    skylar:   [{ id: 1, role: "bot", text: "Hi~~ I'm Skylar. What's brewing in that brilliant mind of yours?" }],
    louise:   [{ id: 1, role: "bot", text: "Hi!! I’m Louise. What's the vibe today?" }],
    luther:   [{ id: 1, role: "bot", text: "I’m Luther. I’m here with you. Take your time." }],
    Joshua:   [{ id: 1, role: "bot", text: "Yo, Joshua here. Want a joke or a chat? 😎" }],
  });
  const [memories, setMemories] = useState<Record<string, { id: number; text: string; ts: number }[]>>({
    skylar: [], louise: [], luther: [], Joshua: [],
  });

  // 時鐘 & 自動滾動
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => bodyRef.current?.scrollTo({ top: 9e9 }), 0);
  }, [open, screen, currentBuddy, messages, plusOpen]);

  const MoodIcon = useMemo(() => (mood === "sunny" ? Sun : mood === "cloudy" ? Cloud : Moon), [mood]);

  /* ------------ innerVoiceText ------------ */
  const innerVoiceText = (): string => {
    if (!currentBuddy) return "";
    const thread = messages[currentBuddy.id] || [];
    const lastUser = [...thread].reverse().find((m) => m.role === "me")?.text || "";
    const moodDetected = DETECT_MOOD(lastUser);
    const pack = VOICE[currentBuddy.id] || GENERIC_VOICE;
    const raw = pack[moodDetected] || GENERIC_VOICE.neutral;
    return personalize(raw, myName);
  };

  const addMemory = () => {
    if (!currentBuddy) return;
    const t = newMemory.trim(); if (!t) return;
    setMemories((prev) => ({
      ...prev,
      [currentBuddy.id]: [...(prev[currentBuddy.id] || []), { id: Date.now(), text: t, ts: Date.now() }]
    }));
    setNewMemory("");
  };
  const deleteMemory = (id: number) => {
    if (!currentBuddy) return;
    setMemories((p) => ({ ...p, [currentBuddy.id]: (p[currentBuddy.id] || []).filter((m) => m.id !== id) }));
  };

  /* ------------ replies ------------ */
  const REPLIES: Record<string, {
    tired: string; sad: string; angry: string; neutral: string;
  }> = {
    skylar: {
      tired:   "That sounds heavy. I’ll slow us down—one gentle breath together. You’re not alone.",
      sad:     "I’m right here. Your feelings matter, and I’ll hold the space with you.",
      angry:   "I hear that heat. Let’s set boundaries and move your energy where it serves you.",
      neutral: "I hear you. What would feel kind for you—ideas, listening, or a tiny break?",
    },
    louise: {
      tired:   "Let’s soften the pace and let breath do the work. I’m with you.",
      sad:     "Your tenderness is safe with me. We can pause, then move when you’re ready.",
      angry:   "Let’s name what hurts and reclaim what you can control.",
      neutral: "Thanks for sharing. Would a couple of gentle options help?",
    },
    luther: {
      tired:   "We’ll anchor here. Let’s pick one small next step together.",
      sad:     "We’ll rise slowly. Light is nearby.",
      angry:   "I’ll steady the ship with you—one piece at a time.",
      neutral: "Got it. Which point do you want to move first?",
    },
    Joshua: {
      tired:   "Okay, energy-saver mode on. One small win, then we celebrate 🙂",
      sad:     "I’m adding you to my safe list today—deep breath first 🫶",
      angry:   "We’ll dock the feelings, then K.O. the boss fight 😎",
      neutral: "Say the word: sparks, plan, or joke?",
    },
  };
  const GENERIC_REPLY = {
    tired:   "That sounds heavy. Let’s slow down together—one gentle breath.",
    sad:     "Your feelings matter. I’m here with you.",
    angry:   "I hear your frustration. We’ll steady this and break it down.",
    neutral: "I hear you. What feels like a kind next step?",
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !currentBuddy) return;
    const id = Date.now();
    setMessages((p) => ({ ...p, [currentBuddy.id]: [...(p[currentBuddy.id] || []), { id, role: "me", text }] }));
    setDraft("");
    setTimeout(() => {
      const moodDetected = DETECT_MOOD(text);
      const pack = REPLIES[currentBuddy.id] || GENERIC_REPLY;
      const raw = pack[moodDetected] || GENERIC_REPLY.neutral;
      const replyText = personalize(raw, myName);
      const reply: Message = { id: id + 1, role: "bot", text: replyText };
      setMessages((p) => ({ ...p, [currentBuddy.id]: [...(p[currentBuddy.id] || []), reply] }));
    }, 500);
  };

  /* -------------------- Parallax on screen -------------------- */
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--parallax-x", (x * 8).toFixed(2) + "px");
        el.style.setProperty("--parallax-y", (y * 8).toFixed(2) + "px");
        el.style.setProperty("--parallax-rot", (x * -1.2).toFixed(2) + "deg");
        el.style.setProperty("--gloss-shift", (y * -10).toFixed(2) + "px");
      });
    };
    const onLeave = () => {
      el.style.setProperty("--parallax-x", "0px");
      el.style.setProperty("--parallax-y", "0px");
      el.style.setProperty("--parallax-rot", "0deg");
      el.style.setProperty("--gloss-shift", "0px");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* -------------------- Screens -------------------- */
  const LockScreen = (
    <div className="relative w-full h-full" style={wallpaper(mood)}>
      {/* 动态岛 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[120px] h-[32px] rounded-[22px] winter-island z-20" />
      {/* 时间/日期 */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="text-center">
          <div className="text-sm opacity-70 mb-1">
            {now.toLocaleDateString(undefined, { month: "long", day: "numeric", weekday: "long" })}
          </div>
          <div className="text-[64px] leading-none font-semibold tracking-tight" style={{ color: THEME.main_text_color }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
          </div>
        </div>
      </div>
      {/* 解锁按钮：跑马灯渐变文字 */}
      <div className="absolute bottom-6 w-full flex flex-col items-center gap-3">
        <button onClick={() => setScreen("home")} className="ios-unlock">Slide / tap to unlock</button>
        <button
          onClick={() => setMood(mood === "sunny" ? "cloudy" : mood === "cloudy" ? "night" : "sunny")}
          className="winter-pill flex items-center gap-2"
        >
          <MoodIcon className="w-4 h-4" /> Mood weather
        </button>
      </div>
    </div>
  );

  // 涟漪反馈（桌面图标）
  const onRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    const rect = t.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * 100 + "%";
    const ry = ((e.clientY - rect.top) / rect.height) * 100 + "%";
    t.style.setProperty("--rx", rx);
    t.style.setProperty("--ry", ry);
    t.classList.add("rippling");
    setTimeout(()=>t.classList.remove("rippling"), 320);
  };

  const HomeScreen = (
    <div
      className={`relative w-full h-full ${editMode ? "ios-edit" : ""}`}
      style={wallpaper(mood)}
    >
      {/* 动态岛 + 活动卡 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[14px] z-30 pointer-events-none"
        onClick={() => setActivityOpen((v) => !v)}
        title="Toggle Live Activity"
      >
        <div className="w-[140px] h-[34px] rounded-[22px] winter-island cursor-pointer pointer-events-auto" />
        {activityOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[40px] w-[260px] rounded-2xl ios-activity-card pointer-events-auto">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 grid place-items-center">
                {activityType === "timer" ? (
                  <Timer className="w-4 h-4 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-white/80 leading-none mb-0.5">
                  {activityType === "timer" ? "Focus Timer" : "Incoming"}
                </div>
                <div className="text-[14px] text-white font-medium time-text">
                  {activityType === "timer" ? "00:24:12" : "Mom  •  00:12"}
                </div>
              </div>
              <button
                className="ios-activity-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivityType((t) => (t === "timer" ? "call" : "timer"));
                }}
              >
                Switch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 应用网格：增加頂部內邊距避免被遮擋 */}
      <div
        className="px-10 grid grid-cols-4 gap-5 text-center select-none"
        style={{ paddingTop: activityOpen ? 140 : 80 }}
      >
        {[
          { key: "vchat", label: "Vchat", action: () => setScreen("vchat"), emoji: "💬" },
          { key: "div", label: "Divination", action: () => setScreen("tarot"), emoji: "🔮" },
          { key: "game", label: "Game", action: () => setScreen("game"), emoji: "🎮" },
          { key: "mood", label: "Weather", action: () => setMood(mood === "sunny" ? "cloudy" : mood === "cloudy" ? "night" : "sunny"), emoji: "🌤" },
          { key: "settings", label: "Settings", action: () => setScreen("settings"), emoji: "⚙" },
        ].map((app) => (
          <button
            key={app.key}
            onClick={app.action}
            onContextMenu={(e) => {
              e.preventDefault();
              setEditMode((v) => !v);
            }}
            className="flex flex-col items-center gap-1"
            title={app.label}
          >
            <div className="ios-app" onMouseDown={(e) => onRipple(e as any)}>
              <span className="text-xl">{app.emoji}</span>
            </div>
            <div className="ios-label">{app.label}</div>
          </button>
        ))}
      </div>

      {/* Dock 圖標 */}
      <div className="dock-wrap">
        <div className="winter-dock w-full h-[68px] rounded-[24px]" />
        <div className="absolute inset-0 flex items-center justify-around px-6">
          {[
            { title:"Phone", emoji:"📞" },
            { title:"Safari", emoji:"🧭" },
            { title:"Music",  emoji:"🎵" },
            { title:"Messages", emoji:"✉" },
          ].map((i)=>(
            <div key={i.title} className="flex flex-col items-center gap-1">
              <div className="ios-app" onMouseDown={(e)=>onRipple(e as any)}><span>{i.emoji}</span></div>
              <div className="ios-label">{i.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const vchatHeader = (
    <div
      className={`relative h-11 flex items-center justify-center ${
        mood === "night" ? "ocean-topbar" : "winter-topbar"
      }`}
    >
      <div className="text-[13px] font-medium tracking-wide">vchat</div>
      <button onClick={() => setScreen("home")} className="winter-icon-btn left-2" aria-label="Back"><ChevronLeft className="w-4 h-4" /></button>
      <button onClick={onClose} className="winter-icon-btn right-2" aria-label="Close"><X className="w-4 h-4" /></button>
    </div>
  );

  const vchatTabs = (
    <div
      className={`h-11 flex items-center justify-around text-[13px] ${
        mood === "night" ? "ocean-subbar" : "winter-subbar"
      }`}
    >
      {(["chats", "contacts", "discover", "me"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setvchatTab(t)}
          className={`px-3 py-1.5 rounded-full ${
            vchatTab === t
              ? (mood==='night' ? 'ocean-chip' : 'winter-chip-on')
              : (mood==='night' ? 'ocean-chip' : 'winter-chip')
          }`}
        >
          {t === "chats" ? "Chats" : t === "contacts" ? "Contacts" : t === "discover" ? "Discover" : "Me"}
        </button>
      ))}
    </div>
  );

  const ContactsTab = (
    <div className="p-3 grid gap-2">
      {BUDDIES.map((b) => (
        <button
          key={b.id}
          onClick={() => { setCurrentBuddy(b); setScreen("chat"); }}
          className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left ${
            mood === 'night' ? 'ocean-card' : 'winter-card'
          }`}
        >
          <div className={`w-10 h-10 grid place-items-center rounded-full text-xl ${
            mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
          }`}>{b.avatar}</div>
          <div className="flex-1 text-left">
            <div className="text-[14px] font-medium">
              {b.name} <span className="text-[11px] opacity-60">· {b.species}</span>
            </div>
            <div className="text-[12px] opacity-60">{b.persona}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const ChatsTab = (
    <div className="p-3 space-y-2">
      {BUDDIES.map((b) => {
        const thread = messages[b.id] || [];
        const last = thread[thread.length - 1];
        return (
          <button
            key={b.id}
            onClick={() => { setCurrentBuddy(b); setScreen("chat"); }}
            className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left ${
              mood === 'night' ? 'ocean-card' : 'winter-card'
            }`}
          >
            <div className={`w-10 h-10 grid place-items-center rounded-full text-xl ${
              mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
            }`}>{b.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium">{b.name}</div>
              <div className="text-[12px] opacity-60 truncate">
                {last?.text || "Start a conversation…"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const DiscoverTab = (
    <div className="p-3">
      <div className={`rounded-2xl p-4 text-sm ${mood === 'night' ? 'ocean-card' : 'winter-card'}`}>
        <div className="font-medium mb-1">Ocean Moments (placeholder)</div>
        <div className="opacity-70">Later we can plug in a social / moments feed here.</div>
      </div>
    </div>
  );

  const MeTab = (
    <div className="p-3 space-y-3">
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${
        mood === 'night' ? 'ocean-card' : 'winter-card'
      }`}>
        <div className={`w-12 h-12 grid place-items-center rounded-full text-2xl ${
          mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
        }`}>{myAvatar}</div>
        <div className="flex-1">
          <div className="text-[12px] opacity-60">Nickname</div>
          <input
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            className={`w-full px-2 py-1 text-[14px] ${
              mood === 'night' ? 'ocean-inputfield' : 'winter-input'
            }`}
          />
        </div>
        <button
          onClick={() => setMyAvatar(prompt("Enter an emoji for your avatar:", myAvatar || "🙂") || myAvatar)}
          className={`px-3 py-2 rounded-xl ${mood === 'night' ? 'ocean-chip' : 'winter-chip'}`}
        >
          Change
        </button>
      </div>

      <div className={`rounded-2xl p-4 text-sm flex items-center gap-2 ${
        mood === 'night' ? 'ocean-card' : 'winter-card'
      }`}>
        <Settings className="w-4 h-4" />
        vchat profile is independent from your My Account.
      </div>
    </div>
  );

  const vchatScreen = (
    <div className={`relative w-full h-full winter-page ${mood === 'night' ? 'ocean' : ''}`}>
      {vchatHeader}{vchatTabs}
      <div ref={bodyRef} className="h-[calc(100%-88px)] overflow-y-auto">
        {vchatTab === "chats" && ChatsTab}
        {vchatTab === "contacts" && ContactsTab}
        {vchatTab === "discover" && DiscoverTab}
        {vchatTab === "me" && MeTab}
      </div>
    </div>
  );

  const ChatScreen = currentBuddy && (
    <div className={`relative w-full h-full winter-page ${mood === 'night' ? 'ocean' : ''}`}>
      <div className={`relative h-11 flex items-center justify-center ${
        mood === 'night' ? 'ocean-topbar' : 'winter-topbar'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 grid place-items-center rounded-full text-base ${
            mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
          }`}>{currentBuddy.avatar}</div>
        <div className="text-[13px] font-medium tracking-wide">{currentBuddy.name}</div>
        </div>
        <button onClick={() => setScreen("vchat")} className="winter-icon-btn left-2" aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="winter-icon-btn right-2" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={bodyRef}
        className={`h-[calc(100%-60px-44px)] overflow-y-auto px-3 py-3 space-y-8 ${
          mood === 'night' ? 'winter-chat-bg ocean' : 'winter-chat-bg'
        }`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        {(messages[currentBuddy.id] || []).map((m) => (
          <div key={m.id} className={`flex ${m.role === "me" ? "justify-end" : "justify-start"}`}>
            {m.role === "bot" && (
              <div className={`mr-2 w-7 h-7 grid place-items-center rounded-full text-base ${
                mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
              }`}>{currentBuddy.avatar}</div>
            )}
            <div className={`${
              m.role === "me"
                ? (mood === 'night' ? 'msg-me ocean' : 'msg-me')
                : (mood === 'night' ? 'msg-bot ocean' : 'msg-bot')
            }`}>
              {m.text}
            </div>
            {m.role === "me" && (
              <div className={`ml-2 w-7 h-7 grid place-items-center rounded-full text-base ${
                mood === 'night' ? 'ocean-avatar' : 'winter-avatar'
              }`}>{myAvatar}</div>
            )}
          </div>
        ))}
      </div>

      <div
        className={`h-[60px] px-2 flex items-center gap-2 ${
          mood === 'night' ? 'ocean-inputbar' : 'winter-inputbar'
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <button onClick={() => setPlusOpen(true)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5" title="More">
          <Plus className="w-5 h-5" />
        </button>
        <button className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5" title="Album (placeholder)">
          <Img className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Say something…"
            className={`w-full h-10 px-3 winter-textfield text-[14px] ${mood === 'night' ? 'ocean-input' : ''}`}
            style={mood==='night'
              ? { background: 'rgba(255,255,255,.08)', color:'#eaf2ff', border:'1px solid rgba(255,255,255,.12)' }
              : {}}
          />
        </div>
        <button onClick={send} className="w-9 h-9 grid place-items-center rounded-full winter-send" aria-label="Send">
          <Send className="w-4 h-4" />
        </button>
      </div>

      {plusOpen && currentBuddy && (
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-black/25" onClick={() => setPlusOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 p-3">
            <div className={`mx-auto max-w-sm rounded-2xl overflow-hidden ${
              mood === 'night' ? 'ocean-sheet' : 'winter-sheet'
            }`}>
              <div className={`px-4 py-3 border-b text-sm font-medium ${
                mood === 'night' ? 'ocean-divider' : 'border-black/10'
              }`}>
                {currentBuddy.name} · Tools
              </div>

              <div className="p-3 grid gap-3 text-sm">
                <div className={`rounded-xl p-3 ${mood === 'night' ? 'ocean-block' : 'winter-block'}`}>
                  <div className="text-xs uppercase tracking-wider opacity-60 mb-1">Inner Voice</div>
                  <div className="text-[13px] leading-relaxed italic opacity-95">{innerVoiceText()}</div>
                </div>

                <div className={`rounded-xl p-3 ${mood === 'night' ? 'ocean-block' : 'winter-block'}`}>
                  <div className="text-xs uppercase tracking-wider opacity-60 mb-1">Memories</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(memories[currentBuddy.id] || []).length === 0 && (
                      <div className="text-[12px] opacity-60">No memories yet.</div>
                    )}
                    {(memories[currentBuddy.id] || []).map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-start gap-2 rounded-lg p-2 ${
                          mood === 'night' ? 'ocean-card' : 'winter-card'
                        }`}
                      >
                        <div className="text-[12px] opacity-50 min-w-[70px]">
                          {new Date(m.ts).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex-1 text-[13px]">{m.text}</div>
                        <button className="p-1 rounded hover:bg-black/5" onClick={() => deleteMemory(m.id)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={newMemory}
                      onChange={(e) => setNewMemory(e.target.value)}
                      placeholder="Add a memory in buddy’s voice…"
                      className={`flex-1 h-9 px-3 text-[13px] ${mood === 'night' ? 'ocean-inputfield' : 'winter-textfield'}`}
                    />
                    <button onClick={addMemory} className="px-3 h-9 rounded-lg winter-button">Save</button>
                  </div>
                </div>
              </div>

              <div className={`px-4 py-3 flex justify-end ${
                mood === 'night' ? 'ocean-divider' : 'border-t border-black/10'
              }`}>
                <button
                  onClick={() => setPlusOpen(false)}
                  className={`px-3 py-1.5 text-[13px] rounded-lg ${
                    mood === 'night' ? 'ocean-chip' : 'winter-chip'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Settings Screen（新增 Back）
  const SettingsScreen = (
    <div className={`relative w-full h-full winter-page ${mood === 'night' ? 'ocean' : ''}`}>
      <div className={`relative h-11 flex items-center justify-center ${
        mood === 'night' ? 'ocean-topbar' : 'winter-topbar'
      }`}>
        <div className="text-[13px] font-medium tracking-wide">Settings</div>
        <button onClick={() => setScreen("home")} className="winter-icon-btn left-2" aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="winter-icon-btn right-2" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-[calc(100%-44px)] overflow-y-auto">
        {MeTab}
      </div>
    </div>
  );

  // ---- Mount guard ----
  if (!open || !portalEl) return null;

  // ---- Render ----
  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none" role="dialog" aria-modal="true">
          <style>{`
            :root {
              --wb-text: ${THEME.main_text_color};
              --wb-italic: ${THEME.italics_text_color};
              --wb-underline: ${THEME.underline_text_color};
              --wb-quote: ${THEME.quote_text_color};
              --wb-blur: ${THEME.blur_tint_color};
              --wb-chat: ${THEME.chat_tint_color};
              --wb-user: ${THEME.user_mes_blur_tint_color};
              --wb-bot: ${THEME.bot_mes_blur_tint_color};
              --wb-shadow: ${THEME.shadow_color};
            }

            .winter-shell { position: relative; background: linear-gradient(180deg,#0f1420 0%,#0e1422 60%,#0f1420 100%); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 28px 70px rgba(40,60,90,.45), inset 0 0 0 1px rgba(255,255,255,.04); }
            .winter-shell::before{ content:""; position:absolute; inset:-2px; border-radius: 44px; background: radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,.18), rgba(255,255,255,0) 60%); pointer-events:none; mix-blend-mode: screen; }

            .winter-screen-vignette::after{ content:""; position:absolute; inset:0; border-radius:30px; box-shadow: inset 0 12px 24px rgba(0,0,0,.18), inset 0 -12px 24px rgba(0,0,0,.12); pointer-events:none; }
            .gloss { position:absolute; inset:0; border-radius:30px; pointer-events:none; background: linear-gradient( to bottom, rgba(255,255,255,.5), transparent 28% ); transform: translateY(var(--gloss-shift,0)); mix-blend-mode: screen; }

            .winter-island { background: rgba(0,0,0,.88); filter: saturate(110%); box-shadow: 0 10px 28px rgba(0,0,0,.45), 0 0 0 0.5px rgba(255,255,255,.06) inset; }
            .ios-activity-card{ background: rgba(20,24,34,.62); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(18px) saturate(140%); box-shadow: 0 18px 48px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.35); padding: 6px; }
            .ios-activity-btn{ display:inline-flex; align-items:center; justify-content:center; height:28px; padding: 0 10px; border-radius: 10px; background: rgba(255,255,255,.16); color: #fff; border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(8px); }

            .winter-dock { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.45); backdrop-filter: blur(18px) saturate(140%); box-shadow: 0 14px 36px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.55); }
            .dock-wrap{ position:absolute; left:50%; transform:translateX(-50%); bottom:58px; width:78%; height:68px; }

            .ios-app { position: relative; width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,.78); border: 1px solid rgba(0,0,0,.06); box-shadow: 0 10px 24px rgba(150,175,205,.25), inset 0 1px 0 rgba(255,255,255,.65); backdrop-filter: blur(14px) saturate(140%); display:grid; place-items:center; overflow: hidden; transition: transform .15s ease; }
            .ios-app:hover { transform: translateY(-1px) scale(1.02); }
            .ios-app:active { transform: scale(0.96); }
            .ios-app::after{ content:""; position:absolute; inset:0; border-radius: inherit; background: radial-gradient(120px 120px at var(--rx,50%) var(--ry,50%), rgba(255,255,255,.35), transparent 60%); opacity: 0; transition: opacity .35s ease; pointer-events: none; }
            .ios-app.rippling::after{ opacity: 1; }
            .ios-label{ font-size: 11px; color: rgba(255,255,255,.95); text-shadow: 0 1px 2px rgba(0,0,0,.45); }

            @keyframes iosWiggle { 0% { transform: rotate(-1deg) scale(1.00); } 50% { transform: rotate(1.3deg) scale(1.02); } 100% { transform: rotate(-1deg) scale(1.00); } }
            .ios-edit .ios-app { animation: iosWiggle 800ms ease-in-out infinite; }

            .winter-page { background: var(--wb-chat); color: var(--wb-text); backdrop-filter: blur(6px); }
            .winter-topbar, .winter-subbar { background: rgba(255,255,255,.82); backdrop-filter: blur(6px); border-bottom: 1px solid rgba(0,0,0,.06); }
            .winter-icon-btn { position:absolute; top:50%; transform: translateY(-50%); width:32px;height:32px; display:grid; place-items:center; border-radius:9999px; }
            .winter-card { background: white; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 8px 22px rgba(170,190,220,.25), 0 0 6px rgba(186,212,227,.25); }
            .winter-avatar { background: #eef2ff; border: 1px solid rgba(0,0,0,.08); }

            .winter-chip { background: rgba(0,0,0,.05); border: 1px solid rgba(0,0,0,.08); border-radius: 9999px; padding: 4px 10px; }
            .winter-chip-on { background: rgba(0,0,0,.08); border: 1px solid rgba(0,0,0,.10); border-radius: 9999px; padding: 4px 10px; font-weight:600; }

            .winter-inputbar { border-top: 1px solid rgba(0,0,0,.06); background: rgba(255,255,255,.82); backdrop-filter: blur(6px); }
            .winter-textfield { background: #f3f5fb; border: 1px solid rgba(0,0,0,.06); border-radius: 12px; outline: none; }
            .winter-textfield::placeholder { color: rgba(20, 28, 44, .55); }
            .winter-send { background:#4253ff; color:white; }
            .winter-sheet { background: white; border: 1px solid rgba(0,0,0,.1); box-shadow: 0 16px 40px rgba(150,175,205,.35); }
            .winter-block { background: var(--wb-blur); border: 1px solid rgba(0,0,0,.08); }
            .winter-button { background:#4253ff; color:white; border: 1px solid rgba(0,0,0,.06); }

            .msg-bot { max-width:75%; border-radius: 18px; padding: 10px 14px; font-size:14px; background: var(--wb-bot); border:1px solid rgba(0,0,0,.06); box-shadow: 0 10px 20px rgba(152,175,199,.25), 0 0 6px rgba(186,212,227,.25); }
            .msg-me  { max-width:75%; border-radius: 18px; padding: 10px 14px; font-size:14px; color:#0a0f18; background: var(--wb-user); border:1px solid rgba(0,0,0,.05); box-shadow: 0 10px 20px rgba(152,175,199,.25); }

            .winter-page.ocean, .winter-chat-bg.ocean {
              background: radial-gradient(60% 50% at 50% 0%, rgba(8,25,48,.35), rgba(2,8,16,0) 60%),
                          linear-gradient(180deg, #061222 0%, #03101c 60%, #02070d 100%);
              color: #eaf2ff;
            }
            .ocean-topbar, .ocean-subbar, .ocean-inputbar { background: rgba(10,22,38,.55); border-color: rgba(255,255,255,.1); backdrop-filter: blur(10px) saturate(120%); }
            .ocean-card { background: rgba(255,255,255,.06); border: 1px solid rgba(200,230,255,.18); }
            .ocean-avatar { background: rgba(180,210,255,.12); border: 1px solid rgba(200,230,255,.22); }
            .ocean-chip { background: rgba(255,255,255,.08); border: 1px solid rgba(200,230,255,.22); }
            .ocean-sheet { background: rgba(12,18,30,.85); border: 1px solid rgba(200,230,255,.18); backdrop-filter: blur(14px) saturate(120%); }
            .ocean-divider { border-bottom: 1px solid rgba(200,230,255,.18); }
            .ocean-block { background: rgba(255,255,255,.08); border: 1px solid rgba(200,230,255,.18); }
            .ocean-input { background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); color:#eaf2ff; }

            .msg-bot.ocean { color: #cfe6ff; background: rgba(120,170,255,.10); border: 1px solid rgba(160,200,255,.16);
              box-shadow: 0 10px 24px rgba(10,40,80,.35), 0 0 16px rgba(120,180,255,.18) inset; }
            .msg-me.ocean { color: #07121f; background: rgba(180,220,255,.70); border: 1px solid rgba(200,230,255,.25);
              box-shadow: 0 10px 24px rgba(20,50,90,.35), 0 0 10px rgba(200,230,255,.22); }

            .ios-unlock{ padding: 6px 14px; border-radius: 9999px; font-size: 13px; background: linear-gradient(90deg, #fff, #a6c8ff, #fff);
              background-size: 200% 100%; animation: unlockShine 2.4s linear infinite; border: 1px solid rgba(0,0,0,.12);
              box-shadow: 0 6px 18px rgba(150,175,205,.25); }
            @keyframes unlockShine { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }

            .winter-pill { padding: 6px 14px; border-radius: 9999px; font-size: 13px; background: rgba(255,255,255,.82);
              border: 1px solid rgba(0,0,0,.08); box-shadow: 0 6px 18px rgba(150,175,205,.25); }

            .winter-chat-bg { position: relative; background: linear-gradient(180deg, #eef6ff 0%, #e3edff 45%, #f0f7ff 100%); }
            .winter-chat-bg::before, .winter-chat-bg::after { content:""; position:absolute; inset:0; pointer-events:none; }
            .winter-chat-bg::before {
              background:
                radial-gradient(160px 140px at 18% 10%, rgba(255,255,255,0.65), rgba(255,255,255,0) 60%),
                radial-gradient(220px 180px at 82% 18%, rgba(180,205,255,0.35), rgba(180,205,255,0) 70%),
                radial-gradient(260px 220px at 22% 70%, rgba(160,210,200,0.18), rgba(160,210,200,0) 70%);
              filter: blur(2px);
              z-index: 0;
              animation: winterBreathe 10s ease-in-out infinite;
            }
            .winter-chat-bg::after {
              background:
                linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 18%, rgba(255,255,255,0) 82%, rgba(255,255,255,0.22)),
                radial-gradient(600px 60% at 50% 0%, rgba(255,255,255,0.22), rgba(255,255,255,0));
              mix-blend-mode: screen;
              z-index: 0;
            }
            .winter-chat-bg > * { position: relative; z-index: 1; }
            @keyframes winterBreathe { 0%,100%{opacity:.55; transform:translateY(0)} 50%{opacity:.85; transform:translateY(-4px)} }

            @media (hover: hover) {
              .overflow-y-auto::-webkit-scrollbar { width: 10px; }
              .overflow-y-auto::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,.18);
                border-radius: 8px;
                border: 2px solid rgba(255,255,255,.6);
              }
              .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
            }
          `}</style>

          {/* 背景遮罩，点击关闭 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

          {/* Phone 外壳 + 屏幕 */}
          <div
            className="absolute pointer-events-auto right-4 bottom-4 sm:right-6 sm:bottom-6"
            style={{ width: "min(95vw, 420px)", maxWidth: 420, aspectRatio: "9/19.5", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full rounded-[42px] winter-shell">
              {/* 机身内壁（近黑） */}
              <div className="absolute inset-[8px] rounded-[36px] bg-black/95" />
              {/* 屏幕层（带视差） */}
              <div
                ref={screenRef}
                className={`absolute inset-[14px] rounded-[30px] overflow-hidden winter-screen-vignette ${mood==='night' ? 'text-white' : 'text-[#0a0f18]'}`}
                style={{
                  background: mood==='night' ? '#02070d' : '#f7f9ff',
                  transform: "translate(var(--parallax-x,0), var(--parallax-y,0)) rotate(var(--parallax-rot,0))",
                  transition: "transform 180ms ease",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* 顶部高光 */}
                <div className="gloss" />

                {/* 夜间可選動畫背景 */}
                {mood==='night' && (
                  <>
                    <video
                      className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
                      src="https://cdn.coverr.co/videos/coverr-surface-of-the-ocean-1638/1080p.mp4"
                      autoPlay muted loop playsInline
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background:'radial-gradient(800px 400px at 50% -10%, rgba(120,180,255,.20), rgba(0,0,0,0) 70%)' }}
                    />
                  </>
                )}

                {/* 选择屏幕 */}
                {screen === "lock"     && LockScreen}
                {screen === "home"     && HomeScreen}
                {screen === "vchat"    && vchatScreen}
                {screen === "chat"     && ChatScreen}
                {screen === "settings" && SettingsScreen}
                {screen === "game"     && (
                  <div style={{height: "100%", overflow: "auto"}}>
                    <Game onBack={() => setScreen("home")} />
                  </div>
                )}
                {screen === "tarot" && (
                  <TarotScreen
                    onBack={() => setScreen("home")}
                    onOpenSafety={() => {
                      alert("Open Safety Net");
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ✅ Portal root for Game dropdown/menu (確保在同一對話框內、可點擊) */}
          <div id="game-portal-root" className="pointer-events-auto"></div>
        </div>,
        portalEl
      )}
    </>
  );
}
