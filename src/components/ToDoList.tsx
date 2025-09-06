// src/components/ToDoList.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  CalendarDays,
  X,
  BarChart3,
  Home,
  PieChart,
  Trash2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

/** ============ Types ============ */
type Priority = "high" | "medium" | "low";
type EnergyLevel = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  estimatedTime?: number; // minutes
  energyRequired: EnergyLevel;
  tags: string[];
  createdAt: number;
  completedAt?: number;
}

interface Course {
  id: string;
  title: string;
  room?: string;
  day: number; // 1~7 (Mon~Sun)
  start: string; // "08:00"
  end: string; // "10:00"
  color: string;
}

/** utils */
const rid = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({ length: 12 }).map(
  (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`
);

/** ============ Component ============ */
export default function ToDoList() {
  /** tabs: tasks / growth / calendar */
  const [tab, setTab] = useState<"tasks" | "growth" | "calendar">("tasks");

  /** ------- Tasks -------- */
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("vlinks:tasks");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => localStorage.setItem("vlinks:tasks", JSON.stringify(tasks)), [tasks]);

  const [input, setInput] = useState("");
  const [quickPriority, setQuickPriority] = useState<Priority>("medium");
  const [quickEnergy, setQuickEnergy] = useState<EnergyLevel>("medium");

  const parseInput = (text: string): Partial<Task> => {
    const result: Partial<Task> = { tags: [] };
    // tags
    const tagMatches = text.match(/#(\w+)/g);
    if (tagMatches) {
      result.tags = tagMatches.map((t) => t.slice(1));
      text = text.replace(/#(\w+)/g, "").trim();
    }
    // duration
    const timeMatch = text.match(/(\d+)\s*(min|minutes|hour|hours|h)/i);
    if (timeMatch) {
      const v = parseInt(timeMatch[1], 10);
      result.estimatedTime = /hour|h/i.test(timeMatch[2]) ? v * 60 : v;
      text = text.replace(timeMatch[0], "").trim();
    }
    result.title = text;
    return result;
  };

  const addTask = () => {
    const t = input.trim();
    if (!t) return;
    const p = parseInput(t);
    const newTask: Task = {
      id: rid(),
      title: p.title || t,
      done: false,
      priority: quickPriority,
      energyRequired: quickEnergy,
      tags: p.tags || [],
      estimatedTime: p.estimatedTime,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setInput("");
  };

  const toggleTask = (id: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
          : t
      )
    );
  };

  /** ------- Pomodoro -------- */
  const [pomoOpen, setPomoOpen] = useState(false);
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [rounds, setRounds] = useState(4);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [leftSec, setLeftSec] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setLeftSec((s) => {
        if (s > 1) return s - 1;
        // switch
        if (phase === "work") {
          if (rounds > 1) {
            setPhase("break");
            return breakMin * 60;
          } else {
            setRunning(false);
            return 0;
          }
        } else {
          setPhase("work");
          setRounds((r) => r - 1);
          return workMin * 60;
        }
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, breakMin, workMin, rounds]);

  const resetPomo = () => {
    setRunning(false);
    setPhase("work");
    setLeftSec(workMin * 60);
  };
  useEffect(() => {
    if (phase === "work") setLeftSec(workMin * 60);
  }, [workMin]);
  useEffect(() => {
    if (phase === "break") setLeftSec(breakMin * 60);
  }, [breakMin]);

  const mmss = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  /** ------- Growth (analytics) ------- */
  const todayStr = new Date().toDateString();
  const completedToday = tasks.filter(
    (t) => t.completedAt && new Date(t.completedAt).toDateString() === todayStr
  );
  const learnedMinutes = completedToday.reduce(
    (sum, t) => sum + (t.estimatedTime || 0),
    0
  );

  // hourly distribution
  const hourly = Array.from({ length: 24 }, () => 0);
  completedToday.forEach((t) => {
    const h = new Date(t.completedAt!).getHours();
    hourly[h] += t.estimatedTime || 30; // default 30min
  });
  const maxMin = Math.max(60, ...hourly);

  // top tags
  const tagCount: Record<string, number> = {};
  completedToday.forEach((t) =>
    (t.tags || []).forEach((tag) => (tagCount[tag] = (tagCount[tag] || 0) + 1))
  );
  const tagEntries = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /** ------- Calendar (editable weekly) ------- */
  const [courses, setCourses] = useState<Course[]>(() => {
    const s = localStorage.getItem("vlinks:courses");
    return s
      ? JSON.parse(s)
      : [
          {
            id: rid(),
            title: "C MT1114 Lecture",
            room: "Lecture Theatre 3",
            day: 4,
            start: "08:00",
            end: "10:00",
            color: "#5eead4",
          },
          {
            id: rid(),
            title: "C CT1114 Lab",
            room: "Com Lab",
            day: 1,
            start: "16:00",
            end: "18:00",
            color: "#93c5fd",
          },
        ];
  });
  useEffect(
    () => localStorage.setItem("vlinks:courses", JSON.stringify(courses)),
    [courses]
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Course>({
    id: "",
    title: "",
    room: "",
    day: 1,
    start: "08:00",
    end: "10:00",
    color: "#93c5fd",
  });

  const openNewCourse = (day: number, start: string) => {
    setEditing(null);
    setForm({
      id: "",
      title: "New Class",
      room: "",
      day,
      start,
      end: addHour(start, 1),
      color: "#93c5fd",
    });
    setEditOpen(true);
  };
  const openEditCourse = (c: Course) => {
    setEditing(c);
    setForm(c);
    setEditOpen(true);
  };
  const saveCourse = () => {
    if (!form.title.trim()) return;
    if (editing) {
      setCourses((cs) => cs.map((c) => (c.id === editing.id ? { ...form, id: editing.id } : c)));
    } else {
      setCourses((cs) => [...cs, { ...form, id: rid() }]);
    }
    setEditOpen(false);
  };
  const deleteCourse = (id: string) => setCourses((cs) => cs.filter((c) => c.id !== id));

  function addHour(t: string, hours: number) {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h + hours, m, 0, 0);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  /** ------- UI ------- */
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(147,197,253,0.15),transparent_70%),linear-gradient(180deg,#061224_0%,#0a1a2f_60%,#02060c_100%)] text-white pt-16 pb-24 relative overflow-hidden">
      {/* soft blobs / sheen */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-16 left-1/3 w-80 h-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_0%,rgba(180,210,255,0.10),transparent_70%)]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 px-5 py-3 backdrop-blur bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="font-semibold tracking-[0.14em] flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-cyan-300" />
          TASKS
        </div>
        <button
          onClick={() => setPomoOpen(true)}
          className="text-cyan-100 px-3 h-9 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center gap-2"
          title="Pomodoro"
        >
          Pomodoro
        </button>
      </header>

      {/* main */}
      <div className="relative z-10 max-w-2xl mx-auto w-full">
        {tab === "tasks" && (
          <>
            {/* input + quick chips (按钮悬浮在输入框右侧) */}
            <div className="px-5 mt-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]">
               <div className="flex gap-2 items-center">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && addTask()}
    placeholder="Add a task… e.g. Finish lab report #FCI 45min"
    className="flex-1 h-11 px-4 rounded-lg
               bg-white/10 backdrop-blur-md
               text-white placeholder-white/60 caret-white
               border border-white/15
               shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]
               focus:outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/30
               text-sm"
  />
  <button
    onClick={addTask}
    className="h-11 w-11 flex items-center justify-center
               rounded-lg bg-cyan-500/80 text-black
               border border-white/20 shadow-md
               hover:bg-cyan-400 transition"
    aria-label="Add task"
  >
    <PlusCircle className="w-5 h-5" />
  </button>
</div>


                <div className="flex flex-wrap gap-2 mt-3">
                  {/* priority chips */}
                  {(["high", "medium", "low"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setQuickPriority(p)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        quickPriority === p
                          ? "bg-cyan-500 text-black border-transparent"
                          : "bg-white/5 border-white/10 text-blue-100"
                      }`}
                    >
                      Priority: {p}
                    </button>
                  ))}
                  {/* energy chips */}
                  {(["high", "medium", "low"] as EnergyLevel[]).map((e) => (
                    <button
                      key={e}
                      onClick={() => setQuickEnergy(e)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        quickEnergy === e
                          ? "bg-cyan-500 text-black border-transparent"
                          : "bg-white/5 border-white/10 text-blue-100"
                      }`}
                    >
                      Energy: {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* task list */}
            <section className="px-5 mt-5 space-y-2">
              {tasks.filter((t) => !t.done).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 group hover:bg-white/8 transition-colors shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-blue-200 hover:text-cyan-300"
                      aria-label="Complete"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm text-blue-50/95 truncate">{task.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.estimatedTime && (
                          <span className="text-xs text-cyan-200/90 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime}min
                          </span>
                        )}
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] bg-cyan-400/20 px-2 py-0.5 rounded-full text-cyan-200 border border-cyan-300/20"
                          >
                            #{tag}
                          </span>
                        ))}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-blue-100/90">
                          P:{task.priority} • E:{task.energyRequired}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setTasks((ts) => ts.filter((t) => t.id !== task.id))}
                    className="opacity-0 group-hover:opacity-100 transition text-blue-200/80 hover:text-cyan-300"
                    aria-label="Delete task"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* completed today */}
              {completedToday.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs text-blue-200/80 mb-2">Completed today</div>
                  <div className="space-y-1">
                    {completedToday.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 text-blue-200/80 text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.filter((t) => !t.done).length === 0 && (
                <div className="text-center py-10">
                  <div className="text-3xl">🐚</div>
                  <div className="text-blue-100/90">All clear — add something above.</div>
                  <div className="text-blue-300/60 text-xs mt-1">
                    Try “Read chapter 3 #math 30min”
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "growth" && (
          <section className="px-5 mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-blue-50 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-cyan-300" /> Personal Growth
                </div>
              </div>

              {/* summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-white/6 border border-white/10 p-3">
                  <div className="text-xs text-blue-200/80">Tasks Completed</div>
                  <div className="text-2xl font-semibold text-white mt-1">
                    {completedToday.length}
                  </div>
                </div>
                <div className="rounded-xl bg-white/6 border border-white/10 p-3">
                  <div className="text-xs text-blue-200/80">Estimated Study (min)</div>
                  <div className="text-2xl font-semibold text-white mt-1">
                    {learnedMinutes}
                  </div>
                </div>
              </div>

              {/* hourly bars */}
              <div className="mb-6">
                <div className="text-xs text-blue-200/80 mb-2">Today • time distribution</div>
                <div className="flex items-end gap-1 h-28">
                  {hourly.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/6 rounded-t border border-white/8"
                      style={{
                        height: `${(v / maxMin) * 100}%`,
                        boxShadow: "0 0 8px rgba(147,197,253,.15) inset",
                      }}
                      title={`${i}:00 • ${v}min`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-blue-300/70 mt-1">
                  <span>0</span>
                  <span>6</span>
                  <span>12</span>
                  <span>18</span>
                  <span>24h</span>
                </div>
              </div>

              {/* tags */}
              <div>
                <div className="text-xs text-blue-200/80 mb-2">Top Tags</div>
                {tagEntries.length === 0 && (
                  <div className="text-blue-200/80 text-sm">
                    Complete tasks with #tags to see stats.
                  </div>
                )}
                <div className="space-y-2">
                  {tagEntries.map(([tag, count]) => (
                    <div key={tag} className="flex items-center gap-2">
                      <div className="text-xs w-20 text-blue-100">#{tag}</div>
                      <div className="flex-1 h-2 rounded bg-white/6 border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400/70"
                          style={{
                            width: `${(count / tagEntries[0][1]) * 100}%`,
                            boxShadow: "0 0 12px rgba(34,211,238,.35)",
                          }}
                        />
                      </div>
                      <div className="text-xs text-blue-200">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "calendar" && (
          <section className="px-5 mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 overflow-x-auto shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-blue-50 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-cyan-300" /> Weekly Schedule
                </div>
                <div className="text-xs text-blue-200/80">
                  Tap an empty cell to add • Tap a class to edit
                </div>
              </div>

              {/* grid */}
              <div className="min-w-[820px]">
                <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}>
                  {/* header row */}
                  <div />
                  {days.map((d) => (
                    <div key={d} className="px-2 py-1 text-center text-blue-100/90">
                      {d}
                    </div>
                  ))}
                  {/* rows */}
                  {timeSlots.map((ts) => (
                    <React.Fragment key={ts}>
                      <div className="h-16 border border-white/10 text-xs text-blue-300/80 px-2 flex items-start pt-1">
                        {ts}
                      </div>
                      {days.map((_, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="h-16 border border-white/10 relative hover:bg-white/6 transition"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("[data-course]")) return;
                            openNewCourse(dayIdx + 1, ts);
                          }}
                        >
                          {/* courses overlapping this slot */}
                          {courses
                            .filter((c) => c.day === dayIdx + 1 && withinSlot(ts, c.start, c.end))
                            .map((c) => (
                              <div
                                key={c.id}
                                data-course
                                onClick={() => openEditCourse(c)}
                                className="absolute left-1 right-1 rounded-lg text-[11px] px-2 py-1 cursor-pointer"
                                style={{
                                  top: offsetTop(ts, c.start),
                                  height: heightFrom(c.start, c.end),
                                  backgroundColor: c.color + "33",
                                  border: `1px solid ${c.color}`,
                                  boxShadow: `0 10px 24px ${c.color}55, inset 0 1px 0 rgba(255,255,255,.15)`,
                                  backdropFilter: "blur(6px)",
                                }}
                              >
                                <div className="font-medium text-white/95 truncate">{c.title}</div>
                                {c.room && (
                                  <div className="text-white/85">
                                    {c.start}–{c.end} · {c.room}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* bottom nav with pearl (decorative) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="relative mx-auto w-[360px] max-w-[92vw]">
          <div className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl p-2 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <button
              onClick={() => setTab("tasks")}
              className={`flex-1 py-2 rounded-xl ${
                tab === "tasks" ? "bg-cyan-400/25 text-white" : "text-blue-100"
              }`}
              aria-label="Tasks"
            >
              <Home className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={() => setTab("growth")}
              className={`flex-1 py-2 rounded-xl ${
                tab === "growth" ? "bg-cyan-400/25 text-white" : "text-blue-100"
              }`}
              aria-label="Growth"
            >
              <BarChart3 className="w-5 h-5 mx-auto" />
            </button>

            {/* Pearl */}
            <div
              className="w-14 h-14 -mt-8 rounded-full mx-1 border border-white/40"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, rgba(255,255,255,.95), rgba(210,225,255,.55) 45%, rgba(160,190,255,.22) 70%, rgba(255,255,255,0) 100%)",
                boxShadow:
                  "0 14px 30px rgba(0,0,0,.35), inset -20px -20px 40px rgba(0,0,0,.18), inset 20px 20px 40px rgba(255,255,255,.25)",
                animation: "pearl-bob 6s ease-in-out infinite",
              }}
            />

            <button
              onClick={() => setTab("calendar")}
              className={`flex-1 py-2 rounded-xl ${
                tab === "calendar" ? "bg-cyan-400/25 text-white" : "text-blue-100"
              }`}
              aria-label="Calendar"
            >
              <CalendarDays className="w-5 h-5 mx-auto" />
            </button>

            <button
              disabled
              className="flex-1 py-2 rounded-xl text-blue-400/40 cursor-not-allowed"
              aria-label="Disabled"
            >
              <div className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>
      </nav>

      {/* Pomodoro modal */}
      {pomoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/12 bg-[rgba(10,18,32,0.9)] p-5 relative shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setPomoOpen(false)}
              className="absolute right-3 top-3 text-blue-200 hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-3 text-blue-200/85">
              {phase === "work" ? "Focus" : "Break"} • {rounds} round(s) left
            </div>
            <div className="text-5xl font-semibold text-white text-center tracking-wider">
              {mmss(leftSec)}
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setRunning((r) => !r)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text黑 font-medium hover:bg-cyan-400 flex items-center gap-2"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={resetPomo}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-blue-100 hover:bg-white/15 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-white/6 border border-white/10 p-2">
                <div className="text-blue-300/80 text-xs mb-1">Work</div>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={workMin}
                  onChange={(e) => setWorkMin(Math.max(5, Number(e.target.value) || 25))}
                  className="w-full bg-transparent border border-white/12 rounded-lg px-2 py-1 text-white"
                />
              </div>
              <div className="rounded-xl bg-white/6 border border-white/10 p-2">
                <div className="text-blue-300/80 text-xs mb-1">Break</div>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Math.max(3, Number(e.target.value) || 5))}
                  className="w-full bg-transparent border border-white/12 rounded-lg px-2 py-1 text-white"
                />
              </div>
              <div className="rounded-xl bg-white/6 border border-white/10 p-2">
                <div className="text-blue-300/80 text-xs mb-1">Rounds</div>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={rounds}
                  onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 4))}
                  className="w-full bg-transparent border border-white/12 rounded-lg px-2 py-1 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course editor */}
      {/* Course editor */}
{editOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl border border-white/12 bg-[rgba(10,18,32,0.95)] p-5 relative shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <button
        onClick={() => setEditOpen(false)}
        className="absolute right-3 top-3 text-blue-200 hover:text-white"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* 修改标题颜色 */}
      <div className="text-lg font-semibold text-white mb-4">
        {editing ? "Edit Course" : "Add Course"}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* 修改所有标签和输入框的样式 */}
        <div className="col-span-2">
          <label className="text-sm text-cyan-200 font-medium mb-1 block">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-cyan-400/30 text-white placeholder-cyan-100/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder="Course title"
          />
        </div>
        
        <div>
          <label className="text-sm text-cyan-200 font-medium mb-1 block">Day</label>
          <select
            value={form.day}
            onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            {days.map((d, i) => (
              <option key={d} value={i + 1} className="bg-[#0a1a2f] text-white">
                {d}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm text-cyan-200 font-medium mb-1 block">Room</label>
          <input
            value={form.room || ""}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-cyan-400/30 text-white placeholder-cyan-100/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder="Room number"
          />
        </div>
        
        <div>
          <label className="text-sm text-cyan-200 font-medium mb-1 block">Start</label>
          <input
            type="time"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
        </div>
        
        <div>
          <label className="text-sm text-cyan-200 font-medium mb-1 block">End</label>
          <input
            type="time"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
        </div>
        
        <div className="col-span-2">
          <label className="text-sm text-cyan-200 font-medium mb-1 block">Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-12 h-12 rounded border-2 border-cyan-400/50 bg-white/10 cursor-pointer"
            />
            <div className="text-cyan-100 text-sm">
              {form.color}
            </div>
          </div>
        </div>
      </div>
      
      {/* 按钮样式也稍微调整 */}
      <div className="flex justify-between mt-6">
        {editing ? (
          <button
            onClick={() => {
              deleteCourse(editing.id);
              setEditOpen(false);
            }}
            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/30 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setEditOpen(false)}
            className="px-4 py-2 rounded-xl bg-white/10 text-cyan-100 hover:bg-white/15 border border-cyan-400/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveCourse}
            className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-medium hover:bg-cyan-400 border border-cyan-400 transition-colors"
          >
            {editing ? "Save Changes" : "Add Course"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* local styles */}
      <style>{`
        @keyframes pearl-bob {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        /* 强制 autofill 也用亮色文本 + 半透明深底 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff !important;
  -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.3) inset !important;
  transition: background-color 9999s ease-in-out 0s !important;
}

      `}</style>
    </div>
  );
}

/** ===== helpers for calendar block layout ===== */
function withinSlot(slot: string, start: string, end: string) {
  const s = toMinutes(start),
    e = toMinutes(end),
    row = toMinutes(slot),
    next = row + 60;
  return !(e <= row || s >= next);
}
function offsetTop(slot: string, start: string) {
  const row = toMinutes(slot);
  const s = toMinutes(start);
  const ratio = Math.max(0, Math.min(1, (s - row) / 60));
  return `${ratio * 64}px`; // row height 64px
}
function heightFrom(start: string, end: string) {
  const h = Math.max(30, (toMinutes(end) - toMinutes(start)) * (64 / 60));
  return `${h}px`;
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
