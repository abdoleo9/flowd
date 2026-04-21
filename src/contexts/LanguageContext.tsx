"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Language, type Translations, translations, LANGUAGES } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowd_lang") as Language | null;
      if (stored && translations[stored]) setLangState(stored);
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    try {
      localStorage.setItem("flowd_lang", l);
    } catch {
      // localStorage unavailable
    }
    const dir = LANGUAGES.find((x) => x.code === l)?.dir ?? "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", l);
  }

  useEffect(() => {
    const dir = LANGUAGES.find((x) => x.code === lang)?.dir ?? "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const dir = LANGUAGES.find((x) => x.code === lang)?.dir ?? "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
