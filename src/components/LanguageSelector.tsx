// src/components/LanguageSelector.tsx
import { Languages } from "lucide-react";
import { LANGUAGES } from "../i18n/useTranslation";

interface Props {
  value: string;
  onChange: (lang: string) => void;
  isTranslating?: boolean;
}

export const LanguageSelector = ({ value, onChange, isTranslating }: Props) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
      isTranslating
        ? "border-primary/50 bg-primary/10 animate-pulse"
        : "border-border/60 bg-card/50 hover:border-primary/40"
    }`}
  >
    {isTranslating ? (
      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
    ) : (
      <Languages className="w-3.5 h-3.5 text-primary flex-shrink-0" />
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isTranslating}
      className="bg-transparent text-xs font-medium outline-none cursor-pointer disabled:opacity-50 text-foreground"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.code.toUpperCase()} — {l.native}
        </option>
      ))}
    </select>
  </div>
);