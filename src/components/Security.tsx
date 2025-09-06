import React, { useState } from "react";
import { ArrowLeft, Lock, Smartphone, ShieldCheck, Trash2 } from "lucide-react";

export default function Security({ onBack }: { onBack: () => void }) {
  const [twoFA, setTwoFA] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1325] via-[#0a162b] to-[#050a14] text-white">
      {/* 顶部栏 */}
      <div className="h-14 px-4 flex items-center justify-between sticky top-0 backdrop-blur-md bg-white/5 border-b border-white/10 z-10">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="tracking-[0.18em] font-semibold">SECURITY</div>
        {/* 右侧占位 - 移除X图标，使用透明占位 */}
        <div className="w-9 h-9 opacity-0"></div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* 修改密码 */}
        <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4">
          <div className="flex items-center gap-2 text-white/90 mb-3">
            <Lock className="w-4 h-4" /> Change Password
          </div>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Current password"
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/15 outline-none"
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/15 outline-none"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/15 outline-none"
            />
            <button className="mt-2 w-full h-11 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition">
              Update Password
            </button>
          </div>
        </section>

        {/* 2FA */}
        <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <ShieldCheck className="w-4 h-4" /> Two-factor Authentication
            </div>
            <button
              onClick={() => setTwoFA(v => !v)}
              className={`h-7 w-12 rounded-full border border-white/15 transition relative ${
                twoFA ? "bg-emerald-400/80" : "bg-white/10"
              }`}
              aria-pressed={twoFA}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition ${
                  twoFA ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-white/60 mt-2">
            {twoFA ? "2FA enabled • We'll ask for a code on new devices." : "Protect your account with a second step."}
          </p>
        </section>

        {/* 已登录设备 */}
        <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4">
          <div className="flex items-center gap-2 text-white/90 mb-3">
            <Smartphone className="w-4 h-4" /> Devices
          </div>
          <div className="space-y-2 text-sm">
            {[
              { name: "Chrome • Mac", ts: "Active now" },
              { name: "Safari • iPhone", ts: "2 days ago" },
            ].map(d => (
              <div key={d.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div>
                  <div className="text-white/90">{d.name}</div>
                  <div className="text-white/60 text-xs">{d.ts}</div>
                </div>
                <button className="text-white/70 hover:text-white text-xs">Sign out</button>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full h-10 rounded-xl border border-white/20 hover:bg-white/10 transition text-white/90">
            Sign out from all devices
          </button>
        </section>

        {/* 危险区域 */}
        <section className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4">
          <div className="flex items-center gap-2 text-red-300/90 mb-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </div>
          <button className="w-full h-11 rounded-xl border border-red-400/40 text-red-200 hover:bg-red-500/10 transition">
            Delete my account
          </button>
        </section>
      </div>
    </div>
  );
}