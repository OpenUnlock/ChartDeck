"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { testConnection, type ByokSettings, type Provider } from "@/lib/ai";

const providerNames: Record<Provider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  ollama: "Custom / Self-hosted Ollama"
};

export function AiSettingsModal({ settings, onChange, onClose }: { settings: ByokSettings; onChange: (settings: ByokSettings) => void; onClose: () => void }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ text: string; error: boolean } | null>(null);
  const firstField = useRef<HTMLSelectElement>(null);
  const provider = settings.activeProvider;
  const current = settings[provider];

  useEffect(() => {
    firstField.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function setProvider(nextProvider: Provider) {
    setResult(null);
    onChange({ ...settings, activeProvider: nextProvider });
  }

  function updateCurrent(values: Record<string, string>) {
    setResult(null);
    onChange({ ...settings, [provider]: { ...current, ...values } } as ByokSettings);
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const response = await testConnection(settings);
      setResult({ text: `Connected · HTTP ${response.status} · ${response.latencyMs} ms`, error: false });
    } catch (error) {
      setResult({ text: error instanceof Error ? error.message : "Connection test failed.", error: true });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
        <header className="modal-heading">
          <div><h2 id="ai-settings-title">BYOK AI Settings</h2><p>Choose a provider and configure its direct browser connection.</p></div>
          <button className="modal-close" type="button" aria-label="Close AI settings" onClick={onClose}><X size={16} /></button>
        </header>
        <div className="settings-form">
          <div className="settings-field">
            <label htmlFor="ai-provider">Active provider</label>
            <select id="ai-provider" ref={firstField} value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
              {Object.entries(providerNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </select>
          </div>

          {provider === "gemini" ? <>
            <div className="settings-field"><label htmlFor="gemini-key">Google AI Studio API key</label><input id="gemini-key" type="password" autoComplete="off" spellCheck={false} value={settings.gemini.apiKey} onChange={(event) => updateCurrent({ apiKey: event.target.value })} placeholder="Paste your Gemini key" /></div>
            <div className="settings-field"><label htmlFor="gemini-model">Model</label><select id="gemini-model" value={settings.gemini.model} onChange={(event) => updateCurrent({ model: event.target.value })}><option value="gemini-2.5-flash">gemini-2.5-flash</option><option value="gemini-2.5-pro">gemini-2.5-pro</option></select></div>
          </> : null}

          {provider === "openai" ? <>
            <div className="settings-field"><label htmlFor="openai-key">OpenAI API key</label><input id="openai-key" type="password" autoComplete="off" spellCheck={false} value={settings.openai.apiKey} onChange={(event) => updateCurrent({ apiKey: event.target.value })} placeholder="Paste your OpenAI key" /></div>
            <div className="settings-field"><label htmlFor="openai-model">Model</label><select id="openai-model" value={settings.openai.model} onChange={(event) => updateCurrent({ model: event.target.value })}><option value="gpt-4o-mini">gpt-4o-mini</option><option value="gpt-4o">gpt-4o</option></select></div>
          </> : null}

          {provider === "anthropic" ? <>
            <div className="settings-field"><label htmlFor="anthropic-key">Anthropic API key</label><input id="anthropic-key" type="password" autoComplete="off" spellCheck={false} value={settings.anthropic.apiKey} onChange={(event) => updateCurrent({ apiKey: event.target.value })} placeholder="Paste your Anthropic key" /></div>
            <div className="settings-field"><label htmlFor="anthropic-model">Model</label><select id="anthropic-model" value={settings.anthropic.model} onChange={(event) => updateCurrent({ model: event.target.value })}><option value="claude-haiku-4-5">claude-haiku-4-5</option><option value="claude-sonnet-4-5">claude-sonnet-4-5</option></select></div>
          </> : null}

          {provider === "ollama" ? <>
            <div className="settings-field"><label htmlFor="ollama-url">Base URL</label><input id="ollama-url" type="url" autoComplete="url" value={settings.ollama.baseUrl} onChange={(event) => updateCurrent({ baseUrl: event.target.value })} placeholder="https://ollama.yourdomain.com" /><p className="settings-hint">Use the public HTTPS address from your reverse proxy or Cloudflare Tunnel.</p></div>
            <div className="settings-field"><label htmlFor="ollama-port">Custom port <span className="settings-hint">(optional)</span></label><input id="ollama-port" inputMode="numeric" value={settings.ollama.port} onChange={(event) => updateCurrent({ port: event.target.value })} placeholder="11434 — blank for proxied 443" /></div>
            <div className="settings-field"><label htmlFor="ollama-model">Model name</label><input id="ollama-model" value={settings.ollama.model} onChange={(event) => updateCurrent({ model: event.target.value })} placeholder="qwen2.5-coder" /></div>
            <div className="settings-field"><label htmlFor="ollama-passkey">Custom passkey / Bearer token</label><input id="ollama-passkey" type="password" autoComplete="off" spellCheck={false} value={settings.ollama.passkey} onChange={(event) => updateCurrent({ passkey: event.target.value })} placeholder="Optional reverse-proxy passkey" /><p className="settings-hint">Sent as both <code>Authorization: Bearer …</code> and <code>X-API-Key</code>.</p></div>
          </> : null}
        </div>

        <div className="settings-callout">Settings are saved in this browser&apos;s localStorage. Requests go directly from your browser to {providerNames[provider]}; they do not pass through a ChartDeck backend. Browser storage is not encrypted, and page scripts can access these keys. Use provider-restricted keys and a trusted browser profile.</div>
        <div className="settings-callout">Chart prompts include column names and types only, not dataset rows. A provider may still process the prompt you submit. Direct browser requests can also be blocked by provider CORS rules.</div>
        {result ? <p className={`connection-result${result.error ? " error" : ""}`} role="status">{result.error ? null : <Check size={13} />} {result.text}</p> : null}
        <footer className="modal-footer"><span className="settings-hint">Active: {providerNames[provider]}</span><button className="button button-accent" type="button" disabled={testing} onClick={handleTest}>{testing ? <LoaderCircle className="spin" size={14} /> : null}{testing ? "Testing…" : "Test Connection"}</button></footer>
      </section>
    </div>
  );
}
