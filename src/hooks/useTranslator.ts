import { useMemo, useRef, useState } from "react";

type TranslateResult = { text: string; langFrom?: string; langTo: string };

const DEFAULT_BASE =
  import.meta.env.VITE_TRANSLATE_ENDPOINT || "https://libretranslate.com";
const API_KEY = import.meta.env.VITE_TRANSLATE_KEY || "";

async function callTranslate(base: string, text: string, to: string) {
  const res = await fetch(`${base}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: to,
      format: "text",
      api_key: API_KEY || undefined,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // libretranslate 返回 { translatedText: "...", detectedLanguage: {language, confidence} }
  return {
    text: data?.translatedText ?? "",
    langFrom: data?.detectedLanguage?.language,
  } as TranslateResult;
}

export function useTranslator() {
  const base = DEFAULT_BASE.replace(/\/$/, "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 简单缓存：key = `${text}::${to}`
  const cacheRef = useRef<Map<string, TranslateResult>>(new Map());

  const translate = useMemo(
    () => async (text: string, to?: string) => {
      setError(null);
      const target =
        (to || navigator.language || "en").split("-")[0].toLowerCase();
      const key = `${text}::${target}`;
      if (cacheRef.current.has(key)) return cacheRef.current.get(key)!;

      setLoading(true);
      try {
        const out = await callTranslate(base, text, target);
        const res: TranslateResult = { ...out, langTo: target };
        cacheRef.current.set(key, res);
        return res;
      } catch (e: any) {
        setError(e?.message || "OopsTranslate Failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [base]
  );

  return { translate, loading, error };
}
