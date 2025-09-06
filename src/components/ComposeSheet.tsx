// src/components/ComposeSheet.tsx
import React, { useRef, useEffect } from "react";
import { Image as ImageIcon, Camera, Type } from "lucide-react";
import { createPortal } from "react-dom";

export type ComposeResult =
  | { kind: "image"; files: File[] }
  | { kind: "camera" }
  | { kind: "text" }
  | { kind: "cancel" };

type Props = {
  open: boolean;
  onClose: () => void;
  onResult: (r: ComposeResult) => void;
};

export default function ComposeSheet({ open, onClose, onResult }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[1000]" aria-modal="true" role="dialog">
      {/* 遮罩 */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close compose"
      />

      {/* 底部面板 */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-md px-4 pb-6">
          <div className="rounded-3xl overflow-hidden border border-white/15 bg-[#1a1f2a]/90 backdrop-blur-xl shadow-2xl">
            {/* 顶部小把手 */}
            <div className="py-3 grid place-items-center">
              <span className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            <ul className="px-2 pb-2 text-[15px]">
              <li>
                <button
                  className="w-full flex items-center gap-12 px-4 py-4 rounded-2xl hover:bg-white/10 active:scale-[0.99] transition text-white"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5" />
                  Choose from gallery
                </button>
              </li>

              <li>
                <button
                  className="w-full flex items-center gap-12 px-4 py-4 rounded-2xl hover:bg-white/10 active:scale-[0.99] transition text-white"
                  onClick={() => {
                    onResult({ kind: "camera" });
                    onClose();
                  }}
                >
                  <Camera className="w-5 h-5" />
                  Camera
                </button>
              </li>

              <li>
                <button
                  className="w-full flex items-center gap-12 px-4 py-4 rounded-2xl hover:bg-white/10 active:scale-[0.99] transition text-white"
                  onClick={() => {
                    onResult({ kind: "text" });
                    onClose();
                  }}
                >
                  <Type className="w-5 h-5" />
                  Notes
                </button>
              </li>
            </ul>

            {/* 分隔 */}
            <div className="h-px bg-white/10 mx-4" />

            <button
              className="w-full px-4 py-4 text-center text-white/80 hover:bg-white/10"
              onClick={() => {
                onResult({ kind: "cancel" });
                onClose();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* 隐藏文件选择器（相册） */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onResult({ kind: "image", files });
          onClose();
          e.currentTarget.value = ""; // 允许重复选择同一张
        }}
      />
    </div>
  );

  return createPortal(node, document.body);
}
