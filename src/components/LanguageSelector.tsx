// src/components/LanguageSelector.tsx
import { Languages } from "lucide-react";
import { LANGUAGES } from "../i18n/useTranslation";

interface Props {
  value: string;
  onChange: (lang: string) => void;
  isTranslating?: boolean;
}

export const LanguageSelector = ({ value, onChange, isTranslating }: Props) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
    isTranslating
      ? "border-primary/50 bg-primary/5"
      : "border-border bg-card/50 hover:border-primary/30"
  }`}>
    {isTranslating
      ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      : <Languages className="w-4 h-4 text-primary" />
    }
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={isTranslating}
      className="bg-transparent text-sm outline-none cursor-pointer disabled:opacity-50"
    >
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code}>{l.native}</option>
      ))}
    </select>
    {isTranslating && (
      <span className="text-[10px] text-primary font-mono">Translating…</span>
    )}
  </div>
);