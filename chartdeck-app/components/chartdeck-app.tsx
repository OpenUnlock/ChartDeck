"use client";

import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { GraphicWalkerWorkspace } from "@/components/graphic-walker-workspace";
import { DEFAULT_SETTINGS, type ByokSettings } from "@/lib/ai";
import { BYOK_STORAGE_KEY, SESSION_STORAGE_KEY, type SessionProfile } from "@/lib/session";

function readSettings(): ByokSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(BYOK_STORAGE_KEY) ?? "null") as Partial<ByokSettings> | null;
    if (!parsed) return DEFAULT_SETTINGS;
    const providers = ["gemini", "openai", "anthropic", "ollama"] as const;
    const activeProvider = providers.includes(parsed.activeProvider as (typeof providers)[number])
      ? parsed.activeProvider as ByokSettings["activeProvider"]
      : DEFAULT_SETTINGS.activeProvider;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      activeProvider,
      gemini: { ...DEFAULT_SETTINGS.gemini, ...parsed.gemini },
      openai: { ...DEFAULT_SETTINGS.openai, ...parsed.openai },
      anthropic: { ...DEFAULT_SETTINGS.anthropic, ...parsed.anthropic },
      ollama: { ...DEFAULT_SETTINGS.ollama, ...parsed.ollama }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ChartDeckApp() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [settings, setSettings] = useState<ByokSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedProfile) {
        const candidate = JSON.parse(storedProfile) as Partial<SessionProfile>;
        if (typeof candidate.name === "string" && typeof candidate.email === "string" && (candidate.method === "guest" || candidate.method === "google")) {
          setProfile({ name: candidate.name, email: candidate.email, picture: typeof candidate.picture === "string" ? candidate.picture : undefined, method: candidate.method });
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setSettings(readSettings());
    setSettingsReady(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (settingsReady) localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, settingsReady]);

  function startSession(nextProfile: SessionProfile) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }

  function signOut() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setProfile(null);
  }

  if (!ready) {
    return <main className="auth-page"><div className="auth-main"><p className="settings-hint">Loading your local workspace…</p></div></main>;
  }

  if (!profile) {
    return <AuthPanel onContinueAsGuest={() => startSession({ name: "Guest analyst", email: "Local session", method: "guest" })} onGoogleProfile={startSession} />;
  }

  return <GraphicWalkerWorkspace profile={profile} settings={settings} setSettings={setSettings} onSignOut={signOut} />;
}
