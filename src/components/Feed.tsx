// src/components/Feed.tsx
import React, { useMemo, useState } from "react";
import {
  ChevronLeft, Heart, Bookmark, Plus,
  Home, Compass, BookMarked, UserRound,
  MessageCircle, Calendar, Languages, Tag
} from "lucide-react";
import { useTranslator } from "../hooks/useTranslator";


/* ---------- Types & Props ---------- */
type FeedProps = {
  school: string;
  onBack: () => void;                 // 回到首页（App 里 setView("home")）
  onOpenPersonal: () => void;         // 打开 CalendarHub
  onOpenProfile: () => void;          // 打开 Account
  avatar: string | null;
  signedUp?: boolean;
  onOpenPostModal?: () => void;       // 打开发帖面板
  onOpenAI?: () => void;              // 打开 AI 小手机
  onOpenTodo?: () => void;            // 打开 Todo
  onOpenLobby?: () => void;           // 打开 Lobby
};

type Post = {
  id: number;
  author: string;
  avatar?: string;
  tag: "focus" | "breath" | "connect" | "sleep" | "health" | "recruiting";
  title?: string;
  text?: string;
  image?: string;
  color: string;
  ts: string;
};

/* ---------- Mock Data ---------- */
const POSTS: Post[] = [
  { id: 101, author: "Aina", tag: "recruiting", title: "Cari rakan kumpulan untuk projek FCI",
    text: "Hi semua! Saya perlukan 2 orang lagi utk tugasan FCI minggu depan. Kita buat usability testing dekat library ya. DM kalau berminat.",
    color: "from-white/10 to-white/5", ts: "12m" },
  { id: 102, author: "乐", tag: "breath", title: "4-7-8 呼吸法",
    text: "焦虑时，试试吸气4秒、屏息7秒、呼气8秒。做4轮就能感觉到心率慢下来。",
    color: "from-white/10 to-white/5", ts: "24m" },
  { id: 103, author: "Echuyl", tag: "focus", title: "Mini Pomodoro",
    text: "Tried 15-3-15-3 cycles today. Shockingly effective for reading dense papers.",
    color: "from-white/10 to-white/5", ts: "1h" },
  { id: 104, author: "Chloe Yap", tag: "recruiting", title: "Looking for teammates - Dataviz",
    text: "Need 1–2 people for an interactive data viz demo (D3/React ok). Chill pace, nice coffee 🧋",
    color: "from-white/10 to-white/5", ts: "1h" },
  { id: 105, author: "Farah", tag: "sleep",
    text: "Tip cepat tidur: dim the screen 1 hour earlier + warm shower. Rasa otak lebih tenang.",
    color: "from-white/10 to-white/5", ts: "2h",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=60" },
  { id: 106, author: "Leo", tag: "connect", title: "Peer check-in",
    text: "Anyone up for a 10-min end-of-day check-in? No judgement, just share wins & bumps.",
    color: "from-white/10 to-white/5", ts: "3h" },
  { id: 107, author: "Kimberly", tag: "health",
    text: "Minum air dulu baru kopi, seriously helps with headaches. Cuba je dulu ✨",
    color: "from-white/10 to-white/5", ts: "4h",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=60" },
  { id: 108, author: "Louise", tag: "recruiting", title: "尋找建議｜Hackathon",
    text: "我们做一个小型校园 PWA,急需senior建議！！！PM我如果有興趣！！！！",
    color: "from-white/10 to-white/5", ts: "5h" },
];

const TAGS = [
  { key: "all", label: "All" },
  { key: "recruiting", label: "Recruiting" },
  { key: "focus", label: "Focus" },
  { key: "breath", label: "Breath" },
  { key: "connect", label: "Connect" },
  { key: "sleep", label: "Sleep" },
  { key: "health", label: "Health" },
] as const;

const TAG_STYLES: Record<Post["tag"], { chip: string; ring: string }> = {
  recruiting: { chip: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30", ring: "ring-emerald-300/25" },
  focus:      { chip: "bg-amber-400/15 text-amber-200 border-amber-300/30",     ring: "ring-amber-300/25" },
  breath:     { chip: "bg-sky-400/15 text-sky-200 border-sky-300/30",           ring: "ring-sky-300/25" },
  connect:    { chip: "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-300/30", ring: "ring-fuchsia-300/25" },
  sleep:      { chip: "bg-indigo-400/15 text-indigo-200 border-indigo-300/30",  ring: "ring-indigo-300/25" },
  health:     { chip: "bg-teal-400/15 text-teal-200 border-teal-300/30",        ring: "ring-teal-300/25" },
};


/* ---------- Background: bubbles ---------- */
function BubblesBg() {
  const dots = useMemo(
    () => Array.from({ length: 16 }).map((_, i) => ({
      left: `${(i * 11) % 95}%`,
      size: 4 + (i % 5),
      delay: (i * 0.7) % 8,
    })), []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-[-10vh] rounded-full bg-white/20 backdrop-blur-sm"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animation: `bubbleUp ${12 + i}s linear ${b.delay}s infinite`,
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Post Card ---------- */
function PostCard({
  p, liked, saved, onLike, onSave, onOpenLobby,
}: {
  p: Post; liked?: boolean; saved?: boolean;
  onLike: () => void; onSave: () => void; onOpenLobby?: () => void;
}) {
  const { translate, loading } = useTranslator();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [meta, setMeta] = useState<{ from?: string; to?: string }>();
  const [expanded, setExpanded] = useState(false);

  const tagUi = TAG_STYLES[p.tag];

  async function onTranslateClick() {
    if (!p.text) return;
    if (translated) { setShowTranslated(v => !v); return; }
    try {
      const res = await translate(p.text);
      setTranslated(res.text);
      setMeta({ from: res.langFrom, to: res.langTo });
      setShowTranslated(true);
    } catch { alert("Translate Coming Soon"); }
  }

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden border border-white/10
        bg-gradient-to-br ${p.color} backdrop-blur-xl transition
        hover:border-white/25 hover:shadow-[0_10px_32px_rgba(20,40,80,0.25)]
        ring-1 ${tagUi.ring}
      `}
    >
      {/* 顶部 */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {p.avatar ? (
            <img
              src={p.avatar}
              alt={p.author}
              className="w-7 h-7 rounded-full border border-white/20 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 grid place-items-center text-[10px]">
              {p.author.slice(0,1)}
            </div>
          )}
          <div className="text-[13px] leading-tight">
            <div className="text-white/90 font-medium">{p.author}</div>
            <div className="text-[11px] text-white/50 tabular-nums">{p.ts}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {p.text && (
            <button
              onClick={onTranslateClick}
              className="px-2.5 py-1.5 rounded-full text-xs border border-white/15 bg-white/10 backdrop-blur hover:bg-white/20 transition inline-flex items-center gap-1"
              title="Translate"
            >
              <Languages className="w-3.5 h-3.5" />
              {loading ? "Translating…" : translated && showTranslated ? "Original" : "Translate"}
            </button>
          )}
          <button
            onClick={() => {
              onLike();
              // 触发爆裂动效
              const el = document.getElementById(`like-${p.id}`);
              el?.classList.remove("like-burst");
              void el?.offsetWidth;
              el?.classList.add("like-burst");
            }}
            id={`like-${p.id}`}
            className="rounded-full bg-black/35 border border-white/20 p-1.5 backdrop-blur active:scale-95 transition relative"
            title="Like"
            aria-pressed={liked ? true : false}
          >
            <Heart className={`w-4.5 h-4.5 ${liked ? "fill-white text-white" : "text-white/70"}`} />
            <span className="pointer-events-none like-burst-dot" />
          </button>
        </div>
      </div>

      {/* 图片 */}
      {p.image && (
        <div className="mx-3 rounded-xl overflow-hidden border border-white/10">
          <img
            src={p.image}
            alt={p.title || "post image"}
            className="w-full aspect-[3/2] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* 内容 */}
      <div className="px-3 py-3">
        {/* 标签胶囊 + 标题行 */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border ${tagUi.chip} inline-flex items-center gap-1`}>
            <Tag className="w-3 h-3" /> {p.tag}
          </span>

          {/* Recruiting 给更明显 CTA */}
          {p.tag === "recruiting" && (
            <button
              className="rounded-lg px-3 py-1 border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20 transition"
              onClick={onOpenLobby}
              title="Meet in Lobby"
            >
              Meet in Lobby
            </button>
          )}
        </div>

        {p.title && <div className="mt-2 font-semibold text-white/95">{p.title}</div>}

        {p.text && (
          <>
            <p
              className={`
                mt-1 whitespace-pre-wrap leading-relaxed text-white/90
                ${expanded ? "" : "line-clamp-3"}
              `}
            >
              {showTranslated && translated ? translated : p.text}
            </p>
            {/* 翻译来源提示 */}
            {showTranslated && translated && (
              <div className="mt-1 text-[11px] text-white/45">
                Auto-translated{meta?.from ? ` from ${meta.from}` : ""} → {meta?.to?.toUpperCase()}
              </div>
            )}
            {/* 展开/收起 */}
            {p.text.length > 120 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-1 text-[12px] text-white/70 hover:text-white underline underline-offset-2"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}

        {/* 操作栏 */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/65">
          <button
            onClick={onSave}
            className="rounded-lg px-2 py-1 border border-white/15 bg-white/5 backdrop-blur active:scale-95 transition inline-flex items-center gap-1"
            title="Save"
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-white text-white" : ""}`} />
            <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
          </button>
          <span className="text-white/45" />
        </div>
      </div>
    </div>
  );
}


/* ---------- Main ---------- */
export default function Feed({
  school, onBack, onOpenPersonal, onOpenProfile, onOpenTodo,
  avatar, signedUp = true, onOpenPostModal, onOpenAI, onOpenLobby,
}: FeedProps) {
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [active, setActive] = useState<string>("all");

   const [searchTerm, setSearchTerm] = useState("");

  // 先按 tag（保留你的逻辑）
const data = useMemo(
  () => POSTS.filter((p) => (active === "all" ? true : p.tag === (active as any))),
  [active]
);

// ✅ 再按搜索词过滤（作者 / 标题 / 正文 / 标签）
const filtered = useMemo(() => {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return data;
  return data.filter((p) => {
    const haystack =
      `${p.author} ${p.title ?? ""} ${p.text ?? ""} ${p.tag}`.toLowerCase();
    return haystack.includes(q);
  });
}, [data, searchTerm]);

  const toggleLike = (id: number) => setLiked((m) => ({ ...m, [id]: !m[id] }));
  const toggleSave = (id: number) => setSaved((m) => ({ ...m, [id]: !m[id] }));

  return (
    <div className="relative min-h-screen text-white bg-gradient-to-b from-[#050b17] via-[#081226] to-[#02060c]">
      {/* 背景气泡 */}
      <BubblesBg />

      {/* 顶栏 */}
      <div className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between backdrop-blur-md bg-black/25 border-b border-white/10">
        <button
          onClick={onBack}
          className="rounded-full px-3 py-1.5 border border-white/20 bg-white/5 active:scale-95 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="tracking-[0.18em] font-semibold">VLINKS</div>
        <button
          onClick={() => onOpenAI?.()}
          className="rounded-full p-2 border border-white/20 bg-white/5 active:scale-95 transition"
          aria-label="AI"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

      {/* 欢迎语 */}
      {/* Apple-style Large Welcome */}
<div className="pt-6 pb-4 text-center">
  <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white/90">
    Welcome to <span className="bg-gradient-to-r from-blue-200 to-cyan-300 bg-clip-text text-transparent">MMU Feed</span>
  </h1>
  <p className="mt-2 text-sm text-white/60">
    Stay calm • focus • connect
  </p>
</div>


      {/* 标签 */}
      {/* 搜索栏 */}
<div className="px-4 mt-3 sm:mt-5">
  <div className="relative max-w-md mx-auto">
    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
      <svg
        className="h-4 w-4 text-white/50"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
      </svg>
    </span>
    <input
      type="text"
      placeholder="Search posts coming soon! "
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full h-10 pl-9 pr-4 rounded-full bg-white/10 border border-white/20 backdrop-blur text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition"
    />
  </div>
</div>



      {/* 卡片网格 */}
      <div className="px-3 pb-28 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {filtered.length === 0 ? (
  <div className="col-span-full text-center text-white/60 py-10">
    No posts found
  </div>
) : (
  filtered.map((p) => (
    <PostCard
      key={p.id}
      p={p}
      liked={liked[p.id]}
      saved={saved[p.id]}
      onLike={() => toggleLike(p.id)}
      onSave={() => toggleSave(p.id)}
      onOpenLobby={onOpenLobby}
    />
  ))
)}

      </div>

      {/* 右下角 Calendar（只有已注册时显示） */}
      {signedUp && (
        <button
          onClick={onOpenPersonal}
          className="fixed right-4 bottom-40 grid place-items-center w-12 h-12 rounded-xl border border-white/20 bg-white/10 backdrop-blur shadow-lg active:scale-95 transition"
          title="Calendar"
        >
          <Calendar className="w-5 h-5" />
        </button>
      )}

      {/* 底部导航 */}
<nav className="fixed bottom-0 left-0 right-0 z-40">
  <div className="mx-auto max-w-md px-3">
    <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-lg">
      <div className="h-16 grid grid-cols-5 place-items-center text-white/80">
        {/* Home */}
        <button onClick={onBack} className="flex flex-col items-center gap-1 hover:text-white transition" aria-label="Home">
          <Home className="w-5 h-5" />
          <span className="text-[11px] leading-none">Home</span>
        </button>

        {/* Lobby */}
        <button onClick={onOpenLobby} className="flex flex-col items-center gap-1 hover:text-white transition" aria-label="Lobby">
          <Compass className="w-5 h-5" />
          <span className="text-[11px] leading-none">Lobby</span>
        </button>

        {/* 中间 + */}
        <div className="relative -mt-6">
          <button
            onClick={onOpenPostModal}
            className="grid place-items-center w-14 h-14 rounded-full border border-white/20 bg-white text-black shadow-lg active:scale-95 transition"
            aria-label="Create"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="text-center mt-1 text-[11px] text-white/80 leading-none">Post</div>
        </div>

        {/* To-Do */}
        <button onClick={onOpenTodo} className="flex flex-col items-center gap-1 hover:text-white transition" aria-label="To-Do">
          <BookMarked className="w-5 h-5" />
          <span className="text-[11px] leading-none">To-Do</span>
        </button>

        {/* Me */}
        <button onClick={onOpenProfile} className="flex flex-col items-center gap-1 hover:text-white transition" aria-label="My Account">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-white/20" />
          ) : (
            <UserRound className="w-6 h-6" />
          )}
          <span className="text-[11px] leading-none">Me</span>
        </button>
      </div>
    </div>
  </div>
</nav>


      {/* 动画 keyframes（气泡） */}
      <style>{`
.like-burst { animation: likePop .28s ease-out; }
.like-burst-dot::after{
  content:""; position:absolute; inset:0; margin:auto; width:2px; height:2px; border-radius:9999px;
  background: white; box-shadow:
    0 -10px 0 0 white, 0 10px 0 0 white, -10px 0 0 0 white, 10px 0 0 0 white,
    7px 7px 0 0 white, -7px 7px 0 0 white, 7px -7px 0 0 white, -7px -7px 0 0 white;
  opacity:0;
}
.like-burst.like-burst-dot::after{ opacity:1; animation: spark .32s ease-out; }

@keyframes likePop { 0%{ transform:scale(.9)} 60%{ transform:scale(1.12)} 100%{ transform:scale(1)} }
@keyframes spark { from{ transform: scale(.6); opacity:.9 } to{ transform: scale(1.6); opacity:0 } }
        @keyframes bubbleUp {
          0%   { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
          15%  { opacity: .6; }
          100% { transform: translateY(-110vh) translateX(20px) scale(1.05); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
