// src/i18n/useTranslation.ts
import { useState, useCallback } from "react";
import { BASE_URL } from "../api";

export const LANGUAGES = [
  { code: "english",  native: "English"  },
  { code: "tamil",    native: "தமிழ்"    },
  { code: "hindi",    native: "हिंदी"    },
  { code: "kannada",  native: "ಕನ್ನಡ"    },
  { code: "telugu",   native: "తెలుగు"   },
  { code: "marathi",  native: "मराठी"    },
  { code: "gujarati", native: "ગુજરાતી"  },
];

// Cache — avoids calling Groq twice for same text
const cache = new Map<string, string>();

// Translate one piece of text via your backend Groq endpoint
export const translateText = async (
  text: string,
  lang: string
): Promise<string> => {
  if (!text?.trim() || lang === "english") return text;
  const key = `${lang}::${text}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const token = localStorage.getItem("agrichain_token");
    const res = await fetch(`${BASE_URL}/api/language/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, target_language: lang }),
    });
    const data = await res.json();
    const translated = data.translated || text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
};

// Translate multiple strings at once in parallel
export const translateBatch = async (
  items: Record<string, string>,
  lang: string
): Promise<Record<string, string>> => {
  if (lang === "english") return items;
  const entries = Object.entries(items);
  const results = await Promise.all(
    entries.map(([k, v]) =>
      translateText(v, lang).then(t => [k, t] as [string, string])
    )
  );
  return Object.fromEntries(results);
};

// React hook — use this in Farmer, Merchant, Monitor
export const useTranslation = () => {
  const [lang, setLang] = useState<string>(
    () => localStorage.getItem("agrichain_lang") || "english"
  );
  const [isTranslating, setIsTranslating] = useState(false);

  const changeLang = useCallback((newLang: string) => {
    setLang(newLang);
    // Save so language persists across pages and login
    localStorage.setItem("agrichain_lang", newLang);
  }, []);

  return { lang, changeLang, isTranslating, setIsTranslating };
};