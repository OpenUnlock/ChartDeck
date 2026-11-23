"use client";

import { useState } from "react";
import Script from "next/script";
import { BarChart3, Check, CircleUserRound, Github, ShieldCheck } from "lucide-react";
import type { SessionProfile } from "@/lib/session";

type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GoogleTokenClient = { requestAccessToken: (options: { prompt: string }) => void };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

export function AuthPanel({ onContinueAsGuest, onGoogleProfile }: { onContinueAsGuest: () => void; onGoogleProfile: (profile: SessionProfile) => void }) {
  const [gisReady, setGisReady] = useState(false);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  function startGoogleSignIn() {
    if (!window.google || !clientId) return;
    setError("");
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setError(response.error_description ?? "Google sign-in could not be completed.");
          return;
        }
        try {
          const result = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          if (!result.ok) throw new Error("Google profile could not be loaded. Try again or continue as a guest.");
          const user = await result.json() as { name?: string; email?: string; picture?: string };
          if (!user.email) throw new Error("Google did not return an email address for this account.");
          onGoogleProfile({ name: user.name ?? user.email.split("@")[0], email: user.email, picture: user.picture, method: "google" });
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Google sign-in failed.");
        }
      }
    });
    tokenClient.requestAccessToken({ prompt: "select_account" });
  }

  return (
    <main className="auth-page">
      {clientId ? <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGisReady(true)} /> : null}
      <section className="auth-aside" aria-label="About ChartDeck">
        <a href="/" className="brand-lockup" aria-label="ChartDeck home"><span className="brand-symbol"><BarChart3 size={17} /></span><span className="brand-name">chartdeck</span></a>
        <div className="auth-aside-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Private by design</div>
          <h1>Your analysis<br />stays yours.</h1>
          <p>Explore files in your browser, create charts with an AI provider you choose, and take your work with you as a JSON workspace.</p>
          <div className="auth-points"><span><Check size={14} /> No ChartDeck account required</span><span><Check size={14} /> Local-first files and charts</span><span><Check size={14} /> Apache-2.0 open source</span></div>
        </div>
        <div className="auth-aside-foot">CHARTDEK.VERCEL.COM · APACHE-2.0</div>
      </section>
      <section className="auth-main" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="eyebrow">Welcome to your workspace</div>
          <h2 id="auth-title">Continue to ChartDeck</h2>
          <p>Use a local guest profile to start right away, or connect a Google profile for a personalized workspace.</p>
          <div className="auth-actions">
            <button className="button google-button auth-full" type="button" onClick={startGoogleSignIn} disabled={!clientId || !gisReady}>
              <CircleUserRound size={17} /> {gisReady ? "Continue with Google" : clientId ? "Loading Google sign-in…" : "Google sign-in not configured"}
            </button>
            {!clientId ? <p className="settings-hint">Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in the Vercel project to enable Google sign-in. Guest mode works without it.</p> : null}
            <div className="auth-divider">or</div>
            <button className="button button-accent auth-full" type="button" onClick={onContinueAsGuest}><CircleUserRound size={16} /> Continue as Guest (Local Session)</button>
          </div>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <p className="auth-footnote"><ShieldCheck size={14} /> This screen stores a profile locally for convenience; it is not server-verified authentication and must not be used to protect sensitive data.</p>
          <p className="settings-hint" style={{ marginTop: 15 }}><Github size={12} /> Open source under Apache-2.0 · <a href="https://github.com/OpenUnlock/ChartDeck" target="_blank" rel="noreferrer">View repository</a></p>
        </div>
      </section>
    </main>
  );
}
