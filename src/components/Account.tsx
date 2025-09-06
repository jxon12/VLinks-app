import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { ArrowLeft, Camera, ChevronRight, ChevronDown, Bookmark, Heart, Save } from "lucide-react";
import { createPortal } from "react-dom";

type Props = {
  school: string;
  setSchool: (v: string) => void;
  onBack: () => void;
  onSignOut: () => void;
  onOpenCalendar: () => void;
  avatar: string | null;
  setAvatar: (v: string | null) => void;
  onOpenHealth: () => void;
  onOpenSecurity: () => void; // ✅ 新增：从名字行右侧进入 Security
};

const SCHOOLS = ["MMU", "APU", "SUNWAY", "Taylor's"] as const;

const TAG_GROUPS = [
  { key: "faculty", label: "Faculty", options: ["FCI","FOE","FOM","FCA","FOL","FET","FAIE","ODL","FIST","FCM","FAC","FOB"] },
  { key: "club",    label: "Club",    options: ["IT society","Hackerspace","IEEE","UPG","AIESEC"] },
  { key: "hobby",   label: "Hobby",   options: ["Coding","Photography","Music","Gaming"] },
] as const;

type TagKey = (typeof TAG_GROUPS)[number]["key"];
type TagState = Partial<Record<TagKey, string>>;

function MenuPortal({
  anchorRect,
  open,
  children,
  widthMatch = true,
  offsetY = 8,
}: {
  anchorRect: DOMRect | null;
  open: boolean;
  children: React.ReactNode;
  widthMatch?: boolean;
  offsetY?: number;
}) {
  if (!open || !anchorRect) return null;
  return createPortal(
    <div
      className="z-[9999] rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl p-1 text-sm text-white"
      style={{
        position: "fixed",
        top: anchorRect.bottom + offsetY,
        left: anchorRect.left,
        width: widthMatch ? anchorRect.width : undefined,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

export default function Account({
  school, setSchool, onBack, onSignOut, onOpenCalendar,
  avatar, setAvatar,
  onOpenSecurity,           // 保留
  onOpenHealth,             // ✅ 新增：别忘了解构它
}: Props) {

  const [name, setName] = useState(() => localStorage.getItem("vlinks:name") || "Louise");

  const [schoolOpen, setSchoolOpen] = useState(false);
  const [openTagKey, setOpenTagKey] = useState<TagKey | null>(null);

  const [tags, setTags] = useState<TagState>(() => {
    try { return JSON.parse(localStorage.getItem("vlinks:tags") || "{}"); }
    catch { return {}; }
  });

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!pageRef.current) return;
      if (pageRef.current.contains(e.target as Node)) return;
      setOpenTagKey(null);
      setSchoolOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, []);

  const schoolBtnRef = useRef<HTMLButtonElement>(null);
  const [schoolRect, setSchoolRect] = useState<DOMRect | null>(null);

  const toggleSchool = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTagKey(null);
    setSchoolOpen((v) => {
      const next = !v;
      if (next && schoolBtnRef.current) {
        setSchoolRect(schoolBtnRef.current.getBoundingClientRect());
      }
      return next;
    });
  };

  const tagBtnRefs: Record<TagKey, React.RefObject<HTMLButtonElement>> = {
    faculty: useRef<HTMLButtonElement>(null),
    club: useRef<HTMLButtonElement>(null),
    hobby: useRef<HTMLButtonElement>(null),
  };
  const [tagRect, setTagRect] = useState<DOMRect | null>(null);

  const openTag = (key: TagKey) => {
    setSchoolOpen(false);
    setOpenTagKey((cur) => {
      const next = cur === key ? null : key;
      if (next && tagBtnRefs[key].current) {
        setTagRect(tagBtnRefs[key].current!.getBoundingClientRect());
      }
      return next;
    });
  };

  useLayoutEffect(() => {
    if (!schoolOpen && !openTagKey) return;
    const update = () => {
      if (schoolOpen && schoolBtnRef.current) {
        setSchoolRect(schoolBtnRef.current.getBoundingClientRect());
      }
      if (openTagKey && tagBtnRefs[openTagKey].current) {
        setTagRect(tagBtnRefs[openTagKey].current!.getBoundingClientRect());
      }
    };
    window.addEventListener("resize", update, true);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update, true);
      window.removeEventListener("scroll", update, true);
    };
  }, [schoolOpen, openTagKey]);

  const fileRef = useRef<HTMLInputElement>(null);
  const pickFile = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result || ""));
    r.readAsDataURL(f);
    e.currentTarget.value = "";
  };

  const selectTag = (key: TagKey, val: string) => {
    setTags(prev => ({ ...prev, [key]: val }));
    setOpenTagKey(null);
  };

  const onSave = () => {
    localStorage.setItem("vlinks:avatar", avatar || "");
    localStorage.setItem("vlinks:name", name);
    localStorage.setItem("vlinks:school", school);
    localStorage.setItem("vlinks:tags", JSON.stringify(tags));
    alert("Saved ✅");
  };

  const handleSignOut = () => {
    localStorage.removeItem("vlinks:avatar");
    localStorage.removeItem("vlinks:name");
    localStorage.removeItem("vlinks:school");
    localStorage.removeItem("vlinks:tags");
    if (confirm("Sign out of vlinks?")) onSignOut();
  };

  const anyMenuOpen = schoolOpen || openTagKey !== null;

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen bg-gradient-to-b from-[#0b1325] via-[#0a162b] to-[#050a14] text-white px-4 pb-24"
    >
      {/* 顶部：返回 */}
      <div className="h-14 flex items-center justify-between">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="tracking-[0.18em] text-white/90 font-semibold">VLinks</div>
        <div className="w-4 h-4" aria-hidden />
      </div>

      {/* 卡片：头像 & 名字（名字行右侧 > 进入 Security） */}
      <section
        className={`relative rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 shadow-lg overflow-visible ${anyMenuOpen ? "pb-12" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-white/10 grid place-items-center">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-xs text-white/60">No Avatar</div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); pickFile(); }}
              className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-white text-black shadow"
              aria-label="Change avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base font-semibold bg-transparent border-none outline-none"
              />
              <button
                onClick={onOpenSecurity}
                className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition"
                aria-label="Open Security"
                title="Security settings"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 三个标签（用 Portal） */}
            <div className="mt-2 flex gap-2 flex-wrap relative z-10">
              {TAG_GROUPS.map(g => (
                <div key={g.key} className="relative">
                  <button
                    ref={tagBtnRefs[g.key]}
                    onClick={() => openTag(g.key)}
                    className={`px-3 py-1 rounded-full text-xs border transition flex items-center gap-1
                      ${tags[g.key]
                        ? "bg-white text-black border-white"
                        : "bg-white/10 text-white/70 border-white/20"}`}
                    aria-haspopup="listbox"
                    aria-expanded={openTagKey === g.key}
                  >
                    {g.label}: {tags[g.key] || "Select"}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <MenuPortal anchorRect={openTagKey === g.key ? tagRect : null} open={openTagKey === g.key}>
                    {g.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => selectTag(g.key, opt)}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
                        role="option"
                      >
                        {opt}
                      </button>
                    ))}
                  </MenuPortal>
                </div>
              ))}
            </div>

            {/* 学校下拉（Portal） */}
            <div className="mt-3">
              <button
                ref={schoolBtnRef}
                onClick={toggleSchool}
                className="w-full h-10 px-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur flex items-center justify-between text-sm text-white/85"
              >
                {school === "School" ? "Select School" : school}
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>

              <MenuPortal anchorRect={schoolRect} open={schoolOpen}>
                {SCHOOLS.map((s) => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2 rounded-lg text-white/90 hover:bg-white/15"
                    onClick={() => { setSchool(s); setSchoolOpen(false); }}
                  >
                    {s}
                  </button>
                ))}
              </MenuPortal>
            </div>
          </div>
        </div>
      </section>

      {/* 统计 */}
      <section className="mt-4 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-3 shadow-lg" onClick={(e)=>e.stopPropagation()}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold">0</div>
            <div className="flex items-center justify-center gap-1 text-xs text-white/70">
              <Bookmark className="w-3 h-3" /> Bookmark
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold">0</div>
            <div className="flex items-center justify-center gap-1 text-xs text-white/70">
              <Heart className="w-3 h-3" /> Likes
            </div>
          </div>
          <button onClick={onOpenHealth} className="group">
  <div className="mx-auto w-6 h-6 rounded-full border border-white/40 bg-white/10 group-hover:bg-white/20" />
  <div className="mt-1 text-xs text-white/70">MY HEALTH</div>
</button>

        </div>
      </section>

      {/* 我的帖子 */}
      <section className="mt-4 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 shadow-lg" onClick={(e)=>e.stopPropagation()}>
        <div className="text-sm text-white/80 mb-2">My Post</div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-white/10 border border-white/15" />
          ))}
        </div>
      </section>

      {/* （注意：这里不再放“Security”按钮，避免重复） */}

      {/* Save */}
      <div className="mt-6" onClick={(e)=>e.stopPropagation()}>
        <button
          onClick={onSave}
          className="w-full h-12 rounded-full bg-white text-black font-medium hover:bg-white/90 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Sign out */}
      <div className="mt-3" onClick={(e)=>e.stopPropagation()}>
        <button
          onClick={handleSignOut}
          className="w-full h-11 rounded-full border border-white/20 text-white/90 hover:bg-white/10 active:scale-95 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
