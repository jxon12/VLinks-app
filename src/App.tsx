// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import Account from "./components/Account";
import CalendarHub from "./components/CalendarHub";
import ToDoList from "./components/ToDoList";
import ChatPhone from "./components/ChatPhone";
import LoadingVanGogh from "./components/LoadingVanGogh";
import Security from "./components/Security";
import LegalModal from "./components/LegalModal";
import InstallA2HSModal from "./components/InstallA2HSModal";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import ComposeSheet, { ComposeResult } from "./components/ComposeSheet";
import QuizHub from "./components/QuizHub";
import LobbyWindow from "./components/LobbyWindow";
import Feed from "./components/Feed";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  ChevronDown,
  Music2,
  PauseCircle,
  CheckCircle,
  Bell,
  Calendar,
  HeartHandshake,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";

/* ---------------------- 数据 ---------------------- */
const SCHOOLS = ["MMU", "APU", "SUNWAY", "Taylor's"];
const AFFIRMS = [
  "I breathe in calm, I breathe out stress.",
  "Peace flows through me like water.",
  "I am grounded, present, and safe.",
  "My focus is gentle and clear.",
  "I deserve rest, clarity, and connection.",
  "I am exactly where I need to be.",
  "Each breath softens my mind.",
  "I choose to be kind to myself today.",
];

/* ---------------------- 动效层：气泡 ---------------------- */
function Bubbles() {
  const dots = [
    { left: "12%", size: 8, delay: 0 },
    { left: "25%", size: 12, delay: 2.5 },
    { left: "38%", size: 6, delay: 5.2 },
    { left: "51%", size: 10, delay: 1.1 },
    { left: "63%", size: 7, delay: 3.6 },
    { left: "76%", size: 9, delay: 6.0 },
    { left: "89%", size: 5, delay: 4.2 },
  ];
  const trails = [
    { left: "18%", base: 4, count: 4, delay: 0.8 },
    { left: "44%", base: 5, count: 3, delay: 2.2 },
    { left: "70%", base: 4, count: 5, delay: 1.6 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {dots.map((b, i) => (
        <span
          key={`d-${i}`}
          className="absolute bottom-[-10vh] rounded-full bg-white/30 backdrop-blur-sm"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animation: `bubbleUp ${12 + i}s linear ${b.delay}s infinite`,
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))",
          }}
        />
      ))}
      {trails.map((t, i) =>
        Array.from({ length: t.count }).map((_, k) => (
          <span
            key={`t-${i}-${k}`}
            className="absolute bottom-[-10vh] rounded-full bg-white/25 backdrop-blur-sm"
            style={{
              left: t.left,
              width: t.base + k,
              height: t.base + k,
              animation: `bubbleUp ${14 + i + k}s linear ${t.delay + k * 0.6}s infinite`,
              filter: "drop-shadow(0 0 4px rgba(255,255,255,0.2))",
            }}
          />
        ))
      )}
    </div>
  );
}

/* ---------------------- 波浪分隔 SVG ---------------------- */
function WaveDivider() {
  return (
    <div className="w-full overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1440 120"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-[80px] sm:h-[120px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0,64 C240,96 480,0 720,32 C960,64 1200,128 1440,96 L1440,160 L0,160 Z"
          fill="rgba(255,255,255,0.06)"
        />
      </svg>
    </div>
  );
}

/* ---------------------- 点击涟漪（全局） ---------------------- */
function ClickRipples() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>(
    []
  );
  useEffect(() => {
    let id = 0;
    const onClick = (e: MouseEvent) => {
      setRipples((rs) => [...rs, { id: id++, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((rs) => rs.slice(1)), 650);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[40]">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute block rounded-full bg-white/10"
          style={{
            left: r.x - 2,
            top: r.y - 2,
            width: 4,
            height: 4,
            animation: "ripple 650ms ease-out forwards",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 0 20px rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </div>
  );
}

/* ---------------------- 主页面 ---------------------- */
export default function App() {
  // 视图（含 lobby）
  const [view, setView] = useState<
    "home" | "feed" | "personal" | "account" | "security" | "todo" | "lobby"
  >("home");
  const [prevView, setPrevView] = useState<"home" | "feed" | "account">("home");
  const [accountBackTo, setAccountBackTo] = useState<"home" | "feed">("home");

  const [quizOpen, setQuizOpen] = useState(false);

  const [legalOpen, setLegalOpen] = useState(false);
const [legalTab, setLegalTab] = useState<"privacy" | "terms">("privacy");



  // PWA 安装引导
  const { deferredPrompt, promptInstall } = useInstallPrompt();
  const [showA2HS, setShowA2HS] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

  const [booting, setBooting] = useState(true);

  // 头像
  const [avatar, setAvatar] = useState<string | null>(null);

  // 顶部 / 下拉
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [school, setSchool] = useState("School");

  // AI 小手机
  const [aiOpen, setAiOpen] = useState(false);

  // 音乐
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 滚动锚点（首页用）
  const featuresRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);

  // Affirm
  const [showAffirm, setShowAffirm] = useState(false);
  const [currentAffirm, setCurrentAffirm] = useState<string>("");

  // 注册
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  // Sticky 关键词（随滚动）
  const [kw, setKw] = useState<"Breathe" | "Focus" | "Connect">("Breathe");

  // 文案
  const makeHeroTitle = (s: string) =>
    s === "School" ? "A Calmer Campus Life" : `A Calmer ${s} Life`;

  const nextAffirm = () => {
    const idx = Math.floor(Math.random() * AFFIRMS.length);
    setCurrentAffirm(AFFIRMS[idx]);
    setShowAffirm(true);
  };

  const toggleAudio = async () => {
    const a = audioRef.current;
    if (!a) return;

    try {
      if (isPlaying) {
        a.pause();
        setIsPlaying(false);
      } else {
        a.volume = 0.35;
        await a.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log("Audio toggle error:", err);
    }
  };

  const handleCreateAccount = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in name, email and password 🙂");
      return;
    }
    setSignedUp(true);
    setJustSignedUp(true);
    setTimeout(() => welcomeRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!justSignedUp) return;
    // 只在第一次注册后弹一次
    const already = localStorage.getItem("vlinks:a2hsShown");
    if (!already) {
      setShowA2HS(true);
    }
    const t = setTimeout(() => setJustSignedUp(false), 0);
    return () => clearTimeout(t);
  }, [justSignedUp]);

  // 头像：本地持久化
  useEffect(() => {
    const saved = localStorage.getItem("vlinks:avatar");
    if (saved !== null) setAvatar(saved || null);
  }, []);
  useEffect(() => {
    if (avatar === null) localStorage.removeItem("vlinks:avatar");
    else localStorage.setItem("vlinks:avatar", avatar);
  }, [avatar]);

  const handleCloseA2HS = () => {
    setShowA2HS(false);
    localStorage.setItem("vlinks:a2hsShown", "1");
  };

  const handleInstallNow = async () => {
    await promptInstall();
    handleCloseA2HS();
  };

  // 音频事件日志
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onPause = () => {
      console.log("paused", { ended: a.ended, t: a.currentTime, error: a.error });
    };
    const onPlay = () => console.log("playing…");
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    return () => {
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
    };
  }, []);

  // 打开 Personal：记录入口来源页
  const openPersonal = () => {
    setPrevView(view === "personal" ? prevView : (view as "home" | "feed" | "account"));
    setView("personal");
  };

  // Compose 面板
  const [composeOpen, setComposeOpen] = useState(false);

  // Lobby：进入禁止滚动 + Esc 退出
  useEffect(() => {
    const el = document.body;
    if (view === "lobby") {
      const prev = el.style.overflow;
      el.style.overflow = "hidden";
      return () => {
        el.style.overflow = prev;
      };
    }
  }, [view]);

  useEffect(() => {
    if (view !== "lobby") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setView(prevView || "feed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, prevView]);

  // 顶部菜单“Account/Sign up”
  const goToAccount = () => {
    if (signedUp) {
      setAccountBackTo("home");
      setView("account");
      try {
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch {}
    } else {
      signupRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  // 首页滚动关键词（仅在 home 时监听）
  useEffect(() => {
    if (view !== "home") return;
    const hero = document.getElementById("hero");
    const mid = document.getElementById("features");
    const deep = document.getElementById("signup");
    if (!hero || !mid || !deep) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          if (e.target.id === "hero") setKw("Breathe");
          if (e.target.id === "features") setKw("Focus");
          if (e.target.id === "signup") setKw("Connect");
        });
      },
      { threshold: 0.5 }
    );
    [hero, mid, deep].forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [view]);

  /* ---------------------- 外层 Return：视图切换 ---------------------- */
  return (
    <>
      <div className="w-full min-h-screen overflow-x-hidden">
        {/* 全局音乐与涟漪常驻 */}
        <audio
          ref={audioRef}
          loop
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          onError={(e) => console.error("Audio error:", e.currentTarget.error)}
          onEnded={() => {
            const a = audioRef.current;
            if (a) {
              a.currentTime = 0;
              a.play().catch(() => {});
            }
          }}
        >
          <source
            src="https://raw.githubusercontent.com/jxon12/ulinks/main/sea-veiw-361392.mp3"
            type="audio/mpeg"
          />
        </audio>

        {booting && <LoadingVanGogh tip="Diving into VLinks" subTip="breathe • flow • renew" />}


        {/* ========= 视图切换 ========= */}
        {view === "personal" ? (
          <div className="relative">
            <button
              onClick={() => setView(prevView)}
              className="absolute top-4 left-4 z-50 rounded-full p-2 bg-white/10 border border-white/20 backdrop-blur hover:bg-white/20"
              aria-label="Back"
            >
              <X className="w-5 h-5" />
            </button>
            <CalendarHub />
          </div>
        ) : view === "account" ? (
          <Account
            school={school}
            setSchool={setSchool}
            onBack={() => setView(accountBackTo)}
            onSignOut={() => {
              setSignedUp(false);
              setView("home");
            }}
            onOpenCalendar={openPersonal}
            avatar={avatar}
            setAvatar={setAvatar}
            onOpenHealth={() => setQuizOpen(true)}
            onOpenSecurity={() => setView("security")} // ✅ 从名字旁边的 > 进入 Security 页面
          />
        ) : view === "security" ? (
          <Security onBack={() => setView("account")} />
        ) : view === "feed" ? (
          <Feed
            school={school}
            onBack={() => setView("home")}
            onOpenPersonal={() => {
              setPrevView("feed");
              setView("personal");
            }}
            onOpenProfile={() => {
              setAccountBackTo("feed");
              setView("account");
            }}
            avatar={avatar}
            signedUp={signedUp}
            onOpenPostModal={() => setComposeOpen(true)}
            onOpenTodo={() => setView("todo")}
            onOpenAI={() => setAiOpen(true)}
            onOpenLobby={() => {
              setPrevView("feed");
              setView("lobby");
            }}
          />
        ) : view === "lobby" ? (
          <div className="fixed inset-0 z-[60] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#061224] via-[#0a1a2f] to-[#02060c]">
              <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>
            <div className="absolute inset-0">
              <LobbyWindow onBack={() => setView(prevView || "feed")} />
            </div>
          </div>
        ) : view === "todo" ? (
          <div className="relative">
            <button
              onClick={() => setView("feed")}
              className="absolute top-4 left-4 z-50 rounded-full p-2 bg-white/10 border border-white/20 backdrop-blur hover:bg-white/20"
              aria-label="Back"
            >
              <X className="w-5 h-5" />
            </button>
            <ToDoList />
          </div>
        ) : (
          /* ===== Home ===== */
          <div className="min-h-screen w-full text-white relative overflow-x-hidden bg-gradient-to-b from-[#071024] via-[#0a1a2f] to-[#02060c]">
            {/* 背景层 */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 left-1/3 w-[32rem] h-[32rem] rounded-full blur-3xl bg-[radial-gradient(circle,rgba(0,150,200,0.18),transparent_70%)]" />
              <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl bg-[radial-gradient(circle,rgba(120,60,200,0.16),transparent_70%)]" />
              <Bubbles />
            </div>

            {/* 顶部导航 */}
            <nav className="sticky top-0 z-30 backdrop-blur-md bg-white/5 border-b border-white/10">
              <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-center relative">
                <button
                  aria-label="menu"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  className="absolute left-5 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div className="select-none tracking-[0.18em] text-lg font-semibold">
                  Vlinks
                </div>

                <div className="absolute right-5 flex items-center gap-2">
                  <span className="hidden sm:inline text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur">
                    {kw}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setSchoolOpen((v) => !v)}
                      className="flex items-center gap-2 h-9 px-4 rounded-full border border-white/15 bg-white/5 backdrop-blur text-sm hover:bg-white/10 transition"
                    >
                      {school}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          schoolOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {schoolOpen && (
                      <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/15 bg-black/30 backdrop-blur-xl p-2 text-sm space-y-1 z-30 shadow-2xl">
                        {SCHOOLS.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setSchool(s);
                              setSchoolOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isMenuOpen && (
                <div className="max-w-5xl mx-auto px-5 pb-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 text-sm">
                    <a
                      className="block px-3 py-2 rounded-lg hover:bg-white/10"
                      href="#hero"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </a>
                    <button
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
                      onClick={goToAccount}
                    >
                      {signedUp ? "My Account" : "Sign Up"}
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
                      onClick={nextAffirm}
                    >
                      Affirm
                    </button>
                  </div>
                </div>
              )}
            </nav>

            {/* 第一屏：浅海 Hero */}
            <main id="hero" className="relative z-10">
              <div className="max-w-md mx-auto px-6 pt-14 pb-24 text-center min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start">
                <div className="relative mx-auto w-64 h-64 mb-8">
                  <div
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{
                      background:
                        "conic-gradient(from 220deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 30%, rgba(255,255,255,0.12))",
                      mask: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 70%)",
                      WebkitMask:
                        "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 70%)",
                      animation: "rotateSlow 60s linear infinite",
                    }}
                  />
                  <div className="absolute -inset-8 rounded-full blur-3xl bg-[radial-gradient(circle_at_50%_45%,rgba(120,180,255,0.25),rgba(0,0,40,0))]" />
                  <div
                    className="absolute inset-0 rounded-full border border-white/20 backdrop-blur shadow-[inset_-20px_-20px_40px_rgba(0,0,30,0.25),inset_20px_20px_50px_rgba(255,255,255,0.25),0_25px_80px_rgba(0,0,0,0.5)]"
                    style={{
                      background: `
                        radial-gradient(120px 120px at 35% 30%, rgba(255,255,255,0.92), rgba(235,240,255,0.5) 60%, rgba(200,210,230,0.12) 100%),
                        radial-gradient(160px 160px at 70% 70%, rgba(180,200,255,0.2), rgba(160,180,255,0.05) 60%, transparent 100%),
                        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.28), rgba(200,205,220,0.12) 45%, rgba(150,160,185,0.08) 70%, rgba(0,0,20,0.0) 100%)
                      `,
                    }}
                  />
                  <div className="absolute left-12 top-10 h-6 w-6 rounded-full bg-white/80 blur-[8px] opacity-90" />
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none bg-[conic-gradient(from_200deg,rgba(180,210,255,0.22),rgba(160,210,255,0.0)_25%,rgba(200,170,255,0.15)_55%,rgba(180,210,255,0.0)_85%,rgba(180,210,255,0.22))]"
                    style={{ mixBlendMode: "screen" }}
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="tracking-[0.25em] text-[11px] uppercase text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                      CALM · FOCUS · CONNECT
                    </div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-5 w-44 rounded-full bg-black/40 blur-[14px] opacity-65" />
                </div>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="px-3 py-1.5 rounded-full text-xs border border-white/15 bg-white/10 backdrop-blur">
                    gentle • ocean
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-xs border border-white/15 bg-white/10 backdrop-blur">
                    mind • breathing
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-[0.04em] text-white/95">
                  {makeHeroTitle(school)}
                </h1>
                <p className="mt-3 text-white/75 leading-relaxed">
                  Gentle tools for students to calm, focus, and feel connected — all in one place.
                </p>

                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    onClick={nextAffirm}
                    className="rounded-full px-6 py-3 bg-white text-black font-medium border border-white/20 hover:border-white/40 hover:bg-white/90 transition"
                  >
                    Affirm
                  </button>
                  <button
                    onClick={toggleAudio}
                    className="rounded-full px-5 py-3 border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition flex items-center gap-2"
                  >
                    {isPlaying ? <PauseCircle className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                </div>

                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="w-10 h-10 grid place-items-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition"
                  >
                    ▾
                  </button>
                  <div className="text-white/50 text-sm">Scroll to explore</div>
                </div>
              </div>
            </main>

            {/* （后面的 Features、Sign Up、Affirm、Footer 保持原样） */}
            {!signedUp && (
              <section id="features" ref={featuresRef} className="relative z-10">
                <WaveDivider />
                <div className="max-w-5xl mx-auto px-6 pb-16">
                  <h3 className="text-center text-white/90 text-xl mb-6 tracking-wide">
                    What you'll get
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur hover:bg-white/15 transition">
                      <div className="mb-2 text-white/90 flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Mindful Reminders
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Gentle nudges for breath & micro-breaks through your day.
                      </p>
                    </div>
                    <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur hover:bg-white/15 transition">
                      <div className="mb-2 text-white/90 flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Focus Sessions
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Pomodoro with ambient soundscapes from the deep sea.
                      </p>
                    </div>
                    <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur hover:bg-white/15 transition">
                      <div className="mb-2 text-white/90 flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5" /> Support Circles
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Light peer check-ins to stay kind, consistent, connected.
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center justify-center gap-3">
                    <button
                      onClick={() => signupRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="rounded-full px-6 py-3 bg-white text-black font-medium border border-white/20 hover:border-white/40 hover:bg-white/90 transition"
                    >
                      Try it now
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section id="signup" ref={signupRef} className="relative z-10">
              {!signedUp ? (
                <div className="max-w-md mx-auto px-6 py-16 min-h-[calc(100vh-4rem)] flex items-center">
                  <div className="relative w-full rounded-3xl p-[1px] bg-[conic-gradient(at_top_left,rgba(147,197,253,0.45),rgba(186,230,253,0.45),rgba(196,181,253,0.45),rgba(147,197,253,0.45))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div className="rounded-3xl bg-[rgba(18,26,41,0.7)] backdrop-blur-2xl border border-white/10 px-6 py-7">
                      <h2 className="text-[28px] font-semibold tracking-tight">Create your account</h2>
                      <p className="text-white/70 mt-2 mb-6 text-[15px] leading-snug">
                        Join Vlinks to stay calm, focused, and connected.
                      </p>

                      <form
                        className="space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCreateAccount();
                        }}
                      >
                        <div>
                          <label className="block text-sm mb-1.5 text-white/80">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Louise"
                            autoComplete="name"
                            spellCheck={false}
                            className="w-full h-12 px-4 rounded-2xl bg-white/5 text-white placeholder-white/40 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/15"
                          />
                        </div>

                        <div>
                          <label className="block text-sm mb-1.5 text-white/80">Personal Email</label>
                          <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vlinks4you@gmail.com"
                            inputMode="email"
                            autoComplete="email"
                            spellCheck={false}
                            className="w-full h-12 px-4 rounded-2xl bg-white/5 text-white placeholder-white/40 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/15"
                          />
                        </div>

                        <div>
                          <label className="block text-sm mb-1.5 text-white/80">Password</label>
                          <input
                            type="password"
                            name="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="w-full h-12 px-4 rounded-2xl bg-white/5 text-white placeholder-white/40 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/15"
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-sm mb-1.5 text-white/80">School</label>
                          <button
                            type="button"
                            onClick={() => setSchoolOpen((v) => !v)}
                            className="flex items-center justify-between w-full h-12 px-4 rounded-2xl bg-white/5 text-white border border-white/15 focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/15"
                          >
                            {school === "School" ? "Select your school" : school}
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                schoolOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {schoolOpen && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-[rgba(10,15,25,0.9)] backdrop-blur-xl p-2 text-sm space-y-1 shadow-2xl">
                              {SCHOOLS.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setSchool(s);
                                    setSchoolOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="mt-2 w-full h-12 rounded-2xl bg-white text-black font-medium border border-white/25 hover:border-white/50 hover:bg-white/90 transition active:scale-[0.98]"
                        >
                          Create Account
                        </button>
                        <p className="text-center text-xs text-white/60">
  By signing up, you agree to our{" "}
  <button
    type="button"
    onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
    className="underline hover:text-white"
  >
    Terms
  </button>{" "}
  &{" "}
  <button
    type="button"
    onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
    className="underline hover:text-white"
  >
    Privacy
  </button>
  .
</p>

                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                /* Welcome 屏 */
                <div
                  ref={welcomeRef}
                  className="max-w-2xl mx-auto px-6 py-20 text-center min-h-[calc(100vh-4rem)] flex items-center justify-center"
                >
                  <div>
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur mb-6">
                      <CheckCircle className="w-5 h-5 text-emerald-300" />
                      <span className="text-white/90">Account created successfully</span>
                    </div>
                    <h2 className="text-3xl font-semibold mb-3">
                      Welcome, {fullName.split(" ")[0] || "friend"}!
                    </h2>
                    <p className="text-white/70 mb-10">
                      Here are a few things you can explore next.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 text-left">
                      <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur">
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                          <Bell className="w-5 h-5" /> Mindful Reminders
                        </div>
                        <p className="text-white/60 text-sm">
                          Short breaks, gentle nudges to breathe and reset.
                        </p>
                      </div>
                      <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur">
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                          <Calendar className="w-5 h-5" /> Focus Sessions
                        </div>
                        <p className="text-white/60 text-sm">
                          Pomodoro with soft ambience to keep you on track.
                        </p>
                      </div>
                      <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur">
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                          <HeartHandshake className="w-5 h-5" /> Support Circles
                        </div>
                        <p className="text-white/60 text-sm">
                          Find peers to check in with—light and friendly.
                        </p>
                      </div>
                      <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur">
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                          <BookOpen className="w-5 h-5" /> Gentle Reads
                        </div>
                        <p className="text-white/60 text-sm">
                          Tiny notes on focus, sleep, and self-kindness.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setView("feed")}
                      className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 bg-white text-black border border-white/25 hover:border-white/50 hover:bg-white/90 transition"
                    >
                      <Sparkles className="w-5 h-5" /> Start your journey
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Affirm 全屏 */}
            {showAffirm && (
              <div
                className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center p-6"
                style={{
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(12,53,101,0.6), transparent 60%), linear-gradient(180deg,#030914 0%, #061222 60%, #030914 100%)",
                }}
              >
                <div className="relative w-64 h-64 mb-10" aria-hidden="true">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 60%, rgba(255,255,255,0) 100%)",
                      boxShadow: "inset 0 0 60px rgba(255,255,255,0.25)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      animation: "breathe 6s ease-in-out infinite",
                    }}
                  />
                  <div className="absolute -inset-6 rounded-full blur-3xl bg-[rgba(147,197,253,0.18)]" />
                  <div className="absolute left-12 top-10 h-8 w-8 rounded-full bg-white/70 blur-lg opacity-70" />
                </div>

                <p className="text-2xl sm:text-3xl text-white/90 max-w-lg leading-relaxed mb-6">
                  {currentAffirm || "Take a deep breath…"}
                </p>

                <div className="mt-2 flex gap-4">
                  <button
                    onClick={nextAffirm}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-white/10 border border-white/20 hover:bg-white/20 transition text-white"
                  >
                    <RefreshCw className="w-4 h-4" /> Next
                  </button>
                  <button
                    onClick={() => setShowAffirm(false)}
                    className="rounded-full px-6 py-3 bg-white text-black hover:bg-white/90 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Footer（含 Personal 入口） */}
            <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-md">
              <div className="max-w-5xl mx-auto px-6 py-10 text-center text-sm text-white/70 space-y-4">
                <div className="tracking-[0.18em] text-base font-semibold text-white/90">
                  Vlinks
                </div>
                <div className="flex justify-center gap-6 text-white/60 text-sm">
                  <a href="#hero" className="hover:text-white transition">
                    About
                  </a>
                  <button onClick={goToAccount} className="hover:text-white transition">
                    {signedUp ? "My Account" : "Sign Up"}
                  </button>
                  <button onClick={nextAffirm} className="hover:text-white transition">
                    Affirm
                  </button>
                  {signedUp && (
                    <button
                      type="button"
                      onClick={openPersonal}
                      className="hover:text-white transition inline-flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" /> Personal
                    </button>
                  )}
                  <button
  onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
  className="hover:text-white transition"
>
  Privacy & Terms
</button>

                </div>
                <div className="w-24 h-px bg-white/10 mx-auto" />
                <p className="text-xs text-white/50">
                  Calm • Focus • Connect — With Vlinks for a calmer campus life.
                </p>
              </div>
            </footer>

            {/* 局部样式：动画 & autofill 修复 */}
            <style>{`
              html { scroll-behavior: smooth; }
              @keyframes bubbleUp {
                0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
                15% { opacity: .6; }
                100% { transform: translateY(-110vh) translateX(20px) scale(1.05); opacity: 0; }
              }
              @keyframes breathe {
                0% { transform: scale(0.92); opacity: .7; }
                50% { transform: scale(1.06); opacity: 1; }
                100% { transform: scale(0.92); opacity: .7; }
              }
              @keyframes rotateSlow { to { transform: rotate(360deg); } }
              @keyframes ripple {
                0% { transform: translate(-50%, -50%) scale(1); opacity: .35; }
                100% { transform: translate(-50%, -50%) scale(35); opacity: 0; }
              }
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus {
                -webkit-text-fill-color: #fff !important;
                -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.05) inset !important;
                transition: background-color 9999s ease-in-out 0s !important;
              }
              input::placeholder { color: rgba(255,255,255,.38); }
            `}</style>
          </div>
        )}
      </div>

      {/* ====== 挂在 body 的全局浮层，不受视图切换影响 ====== */}
      {createPortal(
        <ChatPhone open={aiOpen} onClose={() => setAiOpen(false)} />,
        document.body
      )}

      {createPortal(
  <QuizHub open={quizOpen} onClose={() => setQuizOpen(false)} />,
  document.body
)}

      {createPortal(
  <LegalModal
    open={legalOpen}
    onClose={() => setLegalOpen(false)}
    tab={legalTab}
    setTab={setLegalTab}
  />,
  document.body
)}


      {createPortal(
        <InstallA2HSModal
          open={showA2HS}
          onClose={handleCloseA2HS}
          onInstall={handleInstallNow}
          canOneTapInstall={!!deferredPrompt}
          isIOS={isIOS}
        />,
        document.body
      )}

      {createPortal(
        <ComposeSheet
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onResult={(r: ComposeResult) => {
            console.log("Compose result:", r);
            setComposeOpen(false);
            if (view !== "feed") setView("feed");
          }}
        />,
        document.body
      )}
    </>
  );
}
