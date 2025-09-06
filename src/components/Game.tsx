import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronDown,
  Coins,
  Star,
  Leaf,
  Store,
  ShoppingBag,
  MessageCircle,
  Camera,
  Heart,
  Plus,
} from "lucide-react";

/* =========================
   Types
========================= */
type BuddyId = "skylar" | "louise" | "luther" | "joshua";

type Buddy = {
  id: BuddyId;
  name: string;
  emoji: string;          // 使用 emoji 代替圖片
  tags: string[];
};

type Stat = { hunger: number; affinity: number; energy: number };

type ShopItem = {
  id: string;
  title: string;
  icon: string;
  price: number;
  type: "food" | "tool" | "daily";
};

type Owned = Record<string, number>;

/* =========================
   Data - 使用 emoji 代替圖片
========================= */
const BUDDIES: Buddy[] = [
  { id: "skylar", name: "Skylar", emoji: "🐙", tags: ["Gentle", "Creative", "Buddy"] },
  { id: "louise", name: "Louise", emoji: "🪼", tags: ["Wisdom", "Soft", "Buddy"] },
  { id: "luther", name: "Luther", emoji: "🐋", tags: ["Observant", "Supportive", "Buddy"] },
  { id: "joshua", name: "Joshua", emoji: "🐢", tags: ["Cool", "Funny", "Buddy"] },
];

const SHOP: ShopItem[] = [
  { id: "strawberry-milk", title: "Strawberry Milk", icon: "🥤", price: 8, type: "food" },
  { id: "energy-cookie", title: "Energy Cookie", icon: "🍪", price: 12, type: "food" },
  { id: "scented-candle", title: "Scented Candle", icon: "🕯️", price: 30, type: "daily" },
  { id: "cushion", title: "Cushion", icon: "🛋️", price: 25, type: "daily" },
  { id: "desk-lamp", title: "Desk Lamp", icon: "💡", price: 60, type: "daily" },
  { id: "cat-grass", title: "Cat Grass", icon: "🌿", price: 6, type: "daily" },
];

/* =========================
   Small UI Helpers
========================= */
function Card({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 border border-white/15">
      {children}
    </span>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] text-white/70">{label}</div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#E1B3FF] to-[#96B4FF]"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/* =========================
   Portal Dropdown（不被遮）
========================= */
function usePortalRoot(id: string) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement("div");
      node.id = id;
      document.body.appendChild(node);
    }
    setEl(node);
  }, [id]);
  return el;
}

function PortalDropdown<T extends string>({
  value,
  onChange,
  options,
  render,
  anchorRef,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  render?: (v: T) => React.ReactNode;
  anchorRef: React.RefObject<HTMLButtonElement>;
}) {
  const root = usePortalRoot("game-dropdown-root");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 180,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      const btn = anchorRef.current;
      if (btn && !btn.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, anchorRef]);

  const toggle = () => {
    const btn = anchorRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={anchorRef}
        className="px-3 h-9 rounded-xl bg-white/10 border border-white/15 inline-flex items-center gap-1 text-sm hover:bg-white/15 active:scale-95 transition"
        onClick={toggle}
      >
        {render ? render(value) : value}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && root &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: Math.max(160, pos.width),
              zIndex: 1000,
            }}
            className="rounded-xl bg-[#0B1220]/95 border border-white/15 shadow-2xl overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                  opt === value ? "text-white" : "text-white/85"
                }`}
              >
                {render ? render(opt) : opt}
              </button>
            ))}
          </div>,
          root
        )}
    </>
  );
}

/* =========================
   Compact Modal（手机优先）
========================= */
function Sheet({
  title,
  open,
  onClose,
  children,
}: React.PropsWithChildren<{ title: string; open: boolean; onClose: () => void }>) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[900]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-0 right-0 bottom-0 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto">
        <div className="mx-3 sm:mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0B1220]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="font-medium">{title}</div>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-md bg-white/10 border border-white/15 text-sm"
            >
              Close
            </button>
          </div>
          <div className="p-3">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================
   Main
========================= */
export default function Game({ onBack }: { onBack: () => void }) {
  // currency
  const [coins, setCoins] = useState(120);
  const [stars, setStars] = useState(50);
  const [leaves, setLeaves] = useState(80);

  // buddy
  const [buddyId, setBuddyId] = useState<BuddyId>("skylar");
  const buddy = useMemo(() => BUDDIES.find((b) => b.id === buddyId)!, [buddyId]);

  // stats
  const [stats, setStats] = useState<Record<BuddyId, Stat>>({
    skylar: { hunger: 62, affinity: 48, energy: 82 },
    louise: { hunger: 40, affinity: 66, energy: 74 },
    luther: { hunger: 51, affinity: 58, energy: 60 },
    joshua: { hunger: 70, affinity: 35, energy: 90 },
  });

  // bag & social
  const [bag, setBag] = useState<Owned>({
    "strawberry-milk": 2,
    "energy-cookie": 1,
    "scented-candle": 1,
  });
  const [social, setSocial] = useState<string[]>([
    "09:20 | Skylar liked your note \"Mini Pomodoro works!\"",
    "12:05 | Skylar chatted with Louise about today's class.",
    "18:42 | Skylar joined a study group.",
  ]);

  // sheets
  const [interactOpen, setInteractOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  // dropdown anchor
  const ddRef = useRef<HTMLButtonElement>(null);

  // shop ops
  function buy(item: ShopItem) {
    if (coins < item.price) {
      alert("Not enough coins.");
      return;
    }
    setCoins((c) => c - item.price);
    setBag((o) => ({ ...o, [item.id]: (o[item.id] || 0) + 1 }));
    setStars((s) => s + 1);
  }
  function useItem(id: string) {
    if (!bag[id]) return;
    const item = SHOP.find((s) => s.id === id);
    if (!item) return;

    setBag((o) => ({ ...o, [id]: Math.max(0, (o[id] || 0) - 1) }));
    setStats((prev) => {
      const curr = { ...prev[buddyId] };
      if (item.type === "food") {
        curr.hunger = Math.min(100, curr.hunger + 12);
        curr.affinity = Math.min(100, curr.affinity + 6);
      } else {
        curr.energy = Math.min(100, curr.energy + 8);
      }
      return { ...prev, [buddyId]: curr };
    });
    setSocial((logs) => [`Now • ${buddy.name} used ${item.title} ${item.icon}`, ...logs]);
  }
  function completeTask() {
    setCoins((c) => c + 10);
    setLeaves((l) => l + 2);
    setSocial((logs) => [`Now • ${buddy.name} completed a task +10🪙`, ...logs]);
  }

  /* -------- UI Blocks -------- */
  function Hero() {
    return (
      <Card className="p-4">
        {/* top currencies */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 text-[12px]">
            <span className="px-2 py-1 bg-black/30 rounded-full inline-flex items-center gap-1">
              <Coins className="w-4 h-4" /> {coins}
            </span>
            <span className="px-2 py-1 bg-black/30 rounded-full inline-flex items-center gap-1">
              <Star className="w-4 h-4" /> {stars}
            </span>
            <span className="px-2 py-1 bg-black/30 rounded-full inline-flex items-center gap-1">
              <Leaf className="w-4 h-4" /> {leaves}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-70">VLinks</div>
            <div className="font-extrabold tracking-[0.18em]">BUDDY LIFE</div>
          </div>
        </div>

        {/* buddy row */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/15 grid place-items-center text-3xl border border-white/20 overflow-hidden">
            <span>{buddy.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold leading-none truncate">
              {buddy.name}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {buddy.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          </div>

          {/* Dropdown (Portal) */}
          <PortalDropdown
            value={buddyId}
            onChange={(v) => setBuddyId(v as BuddyId)}
            options={BUDDIES.map((b) => b.id)}
            anchorRef={ddRef}
            render={(id) => {
              const b = BUDDIES.find((x) => x.id === id)!;
              return (
                <span className="inline-flex items-center gap-2">
                  <span className="text-base">{b.emoji}</span>
                  <span className="text-sm">{b.name}</span>
                </span>
              );
            }}
          />
        </div>

        {/* actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={completeTask}
            className="px-3 h-9 rounded-xl bg-white text-black text-sm inline-flex items-center gap-2 shadow active:scale-95"
          >
            <Plus className="w-4 h-4" /> Task +10
          </button>

          <button
            onClick={() => setInteractOpen(true)}
            className="px-3 h-9 rounded-xl bg-white/10 border border-white/20 text-sm inline-flex items-center gap-2 hover:bg-white/15 active:scale-95"
          >
            <Heart className="w-4 h-4" /> Interact
          </button>

          <button
            onClick={onBack}
            className="px-3 h-9 rounded-xl bg-white/10 border border-white/20 text-sm inline-flex items-center gap-2 hover:bg-white/15 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </Card>
    );
  }

  function StatsPanel() {
    const s = stats[buddyId];
    return (
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Mind & Stats</div>
        <div className="grid gap-3">
          <StatBar label="Satiety" value={s.hunger} />
          <StatBar label="Affinity" value={s.affinity} />
          <StatBar label="Energy" value={s.energy} />
        </div>
      </Card>
    );
  }

  function SocialPanel() {
    return (
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Social</div>
        <div className="space-y-2 text-[13px]">
          {social.map((line, i) => (
            <div key={i} className="px-3 py-2 rounded-lg border border-white/10 bg-white/5">
              {line}
            </div>
          ))}
          {social.length === 0 && (
            <div className="text-white/60">No social updates yet.</div>
          )}
        </div>
      </Card>
    );
  }

  function ShopPanel() {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold inline-flex items-center gap-2">
            <Store className="w-4 h-4" /> Shop
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SHOP.map((it) => (
            <div key={it.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl">{it.icon}</div>
              <div className="mt-2 text-sm font-medium">{it.title}</div>
              <div className="mt-1 text-[12px] text-white/70 capitalize">
                {it.type}
              </div>

              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {it.price}
                </span>
                <button
                  onClick={() => buy(it)}
                  className="px-2 py-1 rounded-lg bg-white text-black text-xs active:scale-95"
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function BagPanel() {
    const ownedEntries = Object.entries(bag).filter(([, n]) => n > 0);
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Bag
          </div>
        </div>

        {ownedEntries.length === 0 ? (
          <div className="text-white/60 text-sm">Your bag is empty.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ownedEntries.map(([id, n]) => {
              const item = SHOP.find((s) => s.id === id)!;
              return (
                <div key={id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="mt-2 text-sm font-medium">{item.title}</div>
                  <div className="mt-1 text-[12px] text-white/70">
                    Owned: {n}
                  </div>
                  <button
                    onClick={() => useItem(id)}
                    className="mt-2 w-full px-2 py-1 rounded-lg bg-white/90 text-black text-xs active:scale-95"
                  >
                    Use
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  }

  function FooterBar() {
    return (
      <div className="fixed bottom-2 left-0 right-0 z-[80]">
        <div className="mx-auto max-w-md">
          <div className="mx-3 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-lg">
            <div className="h-14 grid grid-cols-3 place-items-center text-white/80">
              <button
                className="hover:text-white transition inline-flex items-center gap-2 text-sm"
                onClick={() => setInteractOpen(true)}
              >
                <span className="text-lg">🍪</span> Feed
              </button>
              <button
                className="hover:text-white transition inline-flex items-center gap-2 text-sm"
                onClick={() => setInteractOpen(true)}
              >
                <MessageCircle className="w-5 h-5" /> Interact
              </button>
              <button
                className="hover:text-white transition inline-flex items-center gap-2 text-sm"
                onClick={() => setPhotoOpen(true)}
              >
                <Camera className="w-5 h-5" /> Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------- Layout: 单列可滚动（手机样式） -------- */
  return (
    <div className="relative min-h-screen text-white bg-gradient-to-b from-[#050b17] via-[#081226] to-[#02060c] pb-24">
      <div className="mx-auto max-w-xl px-3 pt-3">
        <div className="grid gap-3">
          <Hero />
          <StatsPanel />
          <SocialPanel />
          <ShopPanel />
          <BagPanel />
        </div>
      </div>

      <FooterBar />

      {/* Interact Sheet（更小） */}
      <Sheet title={`Interact with ${buddy.name}`} open={interactOpen} onClose={() => setInteractOpen(false)}>
        <div className="text-[13px] text-white/80 mb-2">
          Tiny interactions raise affinity and consume a little energy.
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            className="h-10 rounded-xl bg-white/10 border border-white/15 text-sm"
            onClick={() => {
              setStats((p) => ({
                ...p,
                [buddyId]: {
                  ...p[buddyId],
                  affinity: Math.min(100, p[buddyId].affinity + 3),
                  energy: Math.max(0, p[buddyId].energy - 2),
                },
              }));
              setSocial((logs) => [`Now • You chatted with ${buddy.name} 🗨️`, ...logs]);
            }}
          >
            Chat 💬
          </button>
          <button
            className="h-10 rounded-xl bg-white/10 border border-white/15 text-sm"
            onClick={() => {
              setStats((p) => ({
                ...p,
                [buddyId]: {
                  ...p[buddyId],
                  affinity: Math.min(100, p[buddyId].affinity + 4),
                  energy: Math.max(0, p[buddyId].energy - 1),
                },
              }));
              setSocial((logs) => [`Now • You petted ${buddy.name} 🫶`, ...logs]);
            }}
          >
            Pet 🫶
          </button>
          <button
            className="h-10 rounded-xl bg-white/10 border border-white/15 text-sm"
            onClick={() => {
              setStats((p) => ({
                ...p,
                [buddyId]: {
                  ...p[buddyId],
                  affinity: Math.min(100, p[buddyId].affinity + 2),
                  energy: Math.max(0, p[buddyId].energy - 3),
                },
              }));
              setSocial((logs) => [`Now • You walked with ${buddy.name} 🚶`, ...logs]);
            }}
          >
            Walk 🚶
          </button>
        </div>
      </Sheet>

      {/* Photo Sheet（小尺寸 + 预览格） */}
      <Sheet title="Photo" open={photoOpen} onClose={() => setPhotoOpen(false)}>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square rounded-xl border border-white/10 bg-white/5 grid place-items-center text-2xl">
              <Heart className="w-5 h-5" />
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <button className="px-3 h-9 rounded-xl bg-white text-black text-sm inline-flex items-center gap-2 active:scale-95">
            Save
          </button>
        </div>
      </Sheet>
    </div>
  );
}