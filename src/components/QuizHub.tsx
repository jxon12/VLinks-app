// src/components/QuizHub.tsx
import React from "react";
import { X } from "lucide-react";

export default function QuizHub({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#0c1526] border border-white/15 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/95 font-semibold">Mental Health Quiz</div>
          <button
            onClick={onClose}
            className="rounded-full p-2 border border-white/20 bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="grid gap-3">
          {[
            { title: "Mood Check", desc: "How are you feeling today?" },
            { title: "Stress Self-Assessment", desc: "Spot early signs of overload." },
            { title: "Focus Style", desc: "Find your best study rhythm." },
          ].map((q) => (
            <button
              key={q.title}
              onClick={() => alert("Quiz coming soon 🔧")}
              className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3"
            >
              <div className="text-white/95">{q.title}</div>
              <div className="text-white/60 text-xs">{q.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
