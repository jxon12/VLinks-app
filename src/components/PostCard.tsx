import React, { useState } from "react";
import { Heart, Bookmark } from "lucide-react";

type Post = {
  id: string;
  image: string;       // 用占位图或你的 CDN
  title?: string;
};

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10
                 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]
                 hover:scale-[1.01] transition"
    >
      {/* 图像主体 */}
      <img
        src={post.image}
        alt={post.title || "post"}
        className="w-full h-48 object-cover"
        draggable={false}
      />

      {/* 顶部右侧操作 */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => setSaved(v => !v)}
          className="h-9 w-9 grid place-items-center rounded-full bg-black/40 backdrop-blur
                     border border-white/20 hover:bg-black/50 transition"
        >
          <Bookmark className={`w-5 h-5 ${saved ? "fill-white text-white" : "text-white/80"}`} />
        </button>
      </div>

      {/* 底部栏 */}
      <div className="p-3 flex items-center justify-between">
        <div className="text-sm text-white/85 truncate">{post.title || "Untitled"}</div>
        <button
          onClick={() => setLiked(v => !v)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-rose-400 text-rose-400" : "text-white/80"}`} />
        </button>
      </div>
    </div>
  );
}
