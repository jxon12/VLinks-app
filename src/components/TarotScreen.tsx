// src/components/TarotScreen.tsx
import React from "react";
import { ChevronLeft, ShieldAlert, RotateCcw } from "lucide-react";

type Props = {
  onBack: () => void;
  onOpenSafety: () => void;
};

export default function TarotScreen({ onBack, onOpenSafety }: Props) {
  const MAX = 5;
  const [category, setCategory] = React.useState<string | null>(null);
  const [desc, setDesc] = React.useState("");
  const [selected, setSelected] = React.useState<number[]>([]);

  const cards = React.useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i + 1,
        emoji:
          [
            "🌻","🐣","🧘","🌉","🚗","🌲","🌊","🪁","🎨","📦","🕊️","🔧",
            "🧩","🪟","🪴","🌦️","✨","🎈","🧭","🛡️","🪄","🎵","📚","☯️",
          ][i % 24],
      })),
    []
  );

  const toggleCard = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX
        ? [...prev, id]
        : prev
    );
  };

  const resetSelection = () => {
    setSelected([]);
    setCategory(null);
    setDesc("");
  };

  const handlePick = () => {
    if (!category || selected.length !== MAX) return;
    alert(`Question noted.\nCategory: ${category}\nCards: ${selected.join(", ")}`);
    onBack();
  };

  return (
    // 和其它頁面保持一致的外層骨架：winter-page（會吃到你 ChatPhone 裡的全局樣式）
    <div className="relative w-full h-full winter-page">
      {/* 頂部欄，樣式沿用 vchat/chat 的 topbar */}
      <div className="relative h-11 flex items-center justify-center winter-topbar">
        <div className="text-[13px] font-medium tracking-wide">Divination</div>
        <button onClick={onBack} className="winter-icon-btn left-2" aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 內容：可滾動區域 */}
      <div
        className="h-[calc(100%-44px)] overflow-y-auto px-5 pb-[calc(16px+env(safe-area-inset-bottom))]
                   pt-4"
      >
        <p className="text-[13px] opacity-80 mb-4">
          In life we meet bumps. Pick Cards helps you name your current concern and reflect with gentle prompts.
        </p>

        {/* 類別選擇 */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-2">Choose a category</div>
          <div className="grid grid-cols-2 gap-2.5">
            {["Intimate relationship", "Career / study", "Interpersonal", "Self-growth"].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`h-10 rounded-2xl px-3 text-sm transition-all
                    border ${active ? "border-black/15" : "border-black/10"}
                    bg-white/70 hover:bg-white/90`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 描述輸入 */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-2">Describe your concern</div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="Type here…"
            className="w-full rounded-2xl p-3 text-sm bg-white border border-black/10 outline-none"
          />
          <div className="text-right text-xs opacity-70 mt-1">{desc.length}/200</div>
        </div>

        {/* 卡片選擇 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Pick {MAX} cards</div>
            <div className="text-sm opacity-70">
              {selected.length}/{MAX} selected
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {cards.map((c) => {
              const isSelected = selected.includes(c.id);
              const isDisabled = !isSelected && selected.length >= MAX;
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCard(c.id)}
                  disabled={isDisabled}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-2xl
                    bg-white border ${isSelected ? "border-black/20" : "border-black/10"}
                    ${isSelected ? "scale-[1.03]" : "hover:scale-[1.01]"}
                    transition-all ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span>{c.emoji}</span>
                  {isSelected && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                                 bg-gradient-to-br from-sky-400 to-indigo-400 text-[11px] font-bold text-white"
                    >
                      {selected.indexOf(c.id) + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部操作區 */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white/80 to-white/0 pt-3 pb-2">
          <div className="flex gap-2">
            <button
              onClick={onOpenSafety}
              className="h-10 px-3 rounded-xl text-sm bg-white border border-black/10 inline-flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Safety Net
            </button>
            <button
              onClick={resetSelection}
              className="h-10 px-3 rounded-xl text-sm bg-white border border-black/10 inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={handlePick}
              disabled={!category || selected.length !== MAX}
              className="flex-1 h-10 px-3 rounded-xl text-sm text-white
                         bg-[#4253ff] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pick Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
