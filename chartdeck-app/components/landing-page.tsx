import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, Database, Github, Layers3, LockKeyhole, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    number: "01",
    icon: Layers3,
    title: "Drag, drop, and go deeper",
    text: "Tableau-grade exploration, nested worksheets, and browser Web Workers. Your rows stay on your device, with no server round-trips.",
  },
  {
    number: "02",
    icon: MapPinned,
    title: "Explain the outliers",
    text: "Statistical pattern and root-cause clues plus GeoJSON and TopoJSON maps, included with the open-source engine.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Bring your own AI",
    text: "Generate charts with Gemini, OpenAI, Claude, or a self-hosted Ollama model. Use your own provider account; no ChartDeck subscription.",
  },
  {
    number: "04",
    icon: Database,
    title: "Keep your workspace",
    text: "Export the data, field metadata, and charts to one portable JSON file. Restore it whenever you need it, without a cloud database.",
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-container">
        <header className="landing-nav">
          <Link href="/" className="brand-lockup" aria-label="ChartDeck home">
            <span className="brand-symbol"><BarChart3 size={17} strokeWidth={2.5} /></span>
            <span className="brand-name">chartdeck</span>
          </Link>
          <nav className="nav-right" aria-label="Main navigation">
            <a className="nav-link" href="#features">Features</a>
            <a className="nav-link" href="#setup">Setup guide</a>
            <a className="nav-link" href="https://github.com/OpenUnlock/ChartDeck" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12} /></a>
            <Link className="button button-accent" href="/app">Launch ChartDeck <ArrowRight size={15} /></Link>
          </nav>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Open-source BI, without the lock-in</div>
            <h1 id="hero-title">Your data.<br /><span>Your rules.</span></h1>
            <p>Build thoughtful data stories in a private, browser-first workspace. Bring a file, bring an AI key, and keep the whole analysis yours.</p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/app">Launch ChartDeck App <ArrowRight size={15} /></Link>
              <a className="button button-outline" href="https://github.com/OpenUnlock/ChartDeck" target="_blank" rel="noreferrer"><Github size={15} /> Explore the fork</a>
            </div>
            <div className="trust-row">
              <span><ShieldCheck size={13} /> Apache-2.0</span>
              <span><LockKeyhole size={13} /> Local-first data</span>
              <span><Sparkles size={13} /> BYOK AI</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Illustration of the ChartDeck analytics workspace">
            <div className="art-window">
              <div className="art-top"><div className="art-logo"><span className="brand-symbol"><BarChart3 size={12} /></span> ChartDeck <span style={{ color: "#92998e", fontWeight: 400 }}>· Sales overview</span></div><div className="art-dots"><i /><i /><i /></div></div>
              <div className="art-body">
                <div className="art-side"><span className="active" /><span /><span /><span /><span /></div>
                <div className="art-main"><div className="art-title" /><div className="art-subtitle" /><div className="art-stats"><div className="art-stat"><i /><b /></div><div className="art-stat"><i /><b /></div><div className="art-stat"><i /><b /></div></div><div className="art-chart" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</div></div>
              </div>
            </div>
            <div className="art-caption"><LockKeyhole size={13} /> Computed in your browser</div>
          </div>
        </section>

        <section className="section" id="features" aria-labelledby="features-heading">
          <div className="section-heading">
            <div><div className="eyebrow">The useful parts, unlocked</div><h2 id="features-heading">A full analytics desk.<br />No SaaS toll booth.</h2></div>
            <p>ChartDeck wraps the proven Graphic Walker engine with the pieces a private, independent workflow needs.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ number, icon: Icon, title, text }) => (
              <article className="feature-card" key={number}>
                <span className="feature-index">{number} / 04</span>
                <span className="feature-icon"><Icon size={19} /></span>
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="transparency-heading">
          <div className="transparency">
            <div><div className="eyebrow">Fork, not a rewrite</div><h3 id="transparency-heading">Built in the open.<br />Clear about its roots.</h3></div>
            <p>ChartDeck by OpenUnlock is an Apache-2.0-licensed wrapper and fork of <a href="https://github.com/kanaries/graphic-walker" target="_blank" rel="noreferrer">kanaries/graphic-walker</a>. It brings together the upstream visualization engine, local JSON workspaces, and multi-provider BYOK chart generation—without adding a ChartDeck SaaS paywall. Upstream copyright and Apache-2.0 notices are preserved; wrapper additions are listed in <a href="https://github.com/OpenUnlock/ChartDeck/blob/main/ATTRIBUTION.md" target="_blank" rel="noreferrer">ATTRIBUTION.md</a>.</p>
          </div>
        </section>

        <section className="section" id="setup" aria-labelledby="setup-heading">
          <div className="section-heading"><div><div className="eyebrow">Start with a file, finish with a chart</div><h2 id="setup-heading">Set up your own AI<br />in a few steps.</h2></div><p>ChartDeck sends prompts directly from your browser to the provider you select. Your dataset rows are not included in AI requests.</p></div>
          <div className="setup-grid">
            <article className="setup-card">
              <div className="feature-icon"><Sparkles size={18} /></div><h3>Use a Gemini key</h3>
              <ol>
                <li>Create an API key in <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</li>
                <li>Launch the app, open <strong>BYOK AI Settings</strong>, select Gemini, and paste the key. Choose <code>gemini-2.5-flash</code> for a fast start or <code>gemini-2.5-pro</code> for more capable analysis.</li>
                <li>Optionally configure Google sign-in by creating a Web OAuth client in Google Cloud Console, adding <code>https://chartdek.vercel.com</code> as an authorized JavaScript origin, and setting <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in Vercel.</li>
              </ol>
              <p className="security-note">Browser BYOK is intentionally direct: the key is stored in this browser and is visible to page JavaScript. Use a restricted key and only in a browser profile you trust.</p>
            </article>
            <article className="setup-card">
              <div className="feature-icon"><Database size={18} /></div><h3>Connect your own Ollama</h3>
              <ol>
                <li>Run Ollama on a machine reachable from your browser. Pull a model such as <code>qwen2.5-coder</code> or <code>llama3.2</code>.</li>
                <li>Put a TLS reverse proxy or Cloudflare Tunnel in front of it. Do not expose an unauthenticated Ollama port to the public internet.</li>
                <li>In BYOK settings, enter the public Base URL, the custom Port (leave blank when proxied on 443), the exact Model name, and a strong Passkey.</li>
              </ol>
              <code className="code-block">OLLAMA_HOST=0.0.0.0:11434<br />OLLAMA_ORIGINS=https://chartdek.vercel.com</code>
              <p>Configure the proxy to answer CORS preflight requests and allow <code>Authorization</code>, <code>Content-Type</code>, and <code>X-API-Key</code>. ChartDeck sends your passkey as a Bearer token and X-API-Key. With Cloudflare Access, allow browser preflight requests before enforcing the protected model route; with Nginx, add an origin allowlist for the ChartDeck domain.</p>
              <p className="security-note">The Ollama Base URL is contacted directly by your browser. Use HTTPS, restrict allowed origins, and keep the endpoint behind authentication.</p>
            </article>
          </div>
        </section>

        <section className="section" aria-labelledby="cta-heading">
          <div className="final-cta"><div><h2 id="cta-heading">Your next question is in the data.</h2><p>Open a sample dataset, or bring your own CSV and JSON file.</p></div><Link className="button button-accent" href="/app">Launch ChartDeck App <ArrowRight size={15} /></Link></div>
        </section>
        <footer className="footer"><span>© ChartDeck by OpenUnlock · Apache-2.0</span><div className="footer-links"><a href="https://github.com/OpenUnlock/ChartDeck" target="_blank" rel="noreferrer">Source <ArrowUpRight size={11} /></a><a href="https://github.com/kanaries/graphic-walker" target="_blank" rel="noreferrer">Upstream <ArrowUpRight size={11} /></a><a href="#setup"><ArrowDown size={11} /> Setup</a></div></footer>
      </div>
    </main>
  );
}
