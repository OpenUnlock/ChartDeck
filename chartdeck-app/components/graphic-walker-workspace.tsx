"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ILocalVizAppProps, VizSpecStore } from "@kanaries/graphic-walker";
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, ChevronDown, ChevronUp, CircleHelp, LoaderCircle, LogOut, Moon, Settings2, Sun, WandSparkles } from "lucide-react";
import Papa from "papaparse";
import { AiSettingsModal } from "@/components/ai-settings-modal";
import { generateTerseSpec, type ByokSettings } from "@/lib/ai";
import { inferFields, SAMPLE_ROWS, type DataRow } from "@/lib/sample-data";
import type { SessionProfile } from "@/lib/session";

const GraphicWalker = dynamic<ILocalVizAppProps>(() => import("@kanaries/graphic-walker").then((module) => module.GraphicWalker as unknown as ComponentType<ILocalVizAppProps>), {
  ssr: false,
  loading: () => <div className="workspace-loading">Loading the local analytics engine…</div>
});

type WorkspaceFile = {
  format: "chartdeck.workspace";
  version: 1;
  savedAt: string;
  dataset: { name: string; data: DataRow[]; fields: ReturnType<typeof inferFields> };
  charts: string[];
};

type Theme = "light" | "dark";

export function GraphicWalkerWorkspace({ profile, settings, setSettings, onSignOut }: {
  profile: SessionProfile;
  settings: ByokSettings;
  setSettings: (settings: ByokSettings) => void;
  onSignOut: () => void;
}) {
  const [data, setData] = useState<DataRow[]>(SAMPLE_ROWS);
  const [fields, setFields] = useState(() => inferFields(SAMPLE_ROWS));
  const [datasetName, setDatasetName] = useState("Retail sales sample");
  const [theme, setTheme] = useState<Theme>("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [datasetMessage, setDatasetMessage] = useState("");
  const [pendingCharts, setPendingCharts] = useState<string[] | null>(null);
  const [datasetRevision, setDatasetRevision] = useState(0);
  const storeRef = useRef<VizSpecStore | null>(null);
  const dataInput = useRef<HTMLInputElement>(null);
  const workspaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!datasetRevision) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const store = storeRef.current;
      const currentFields = store?.meta ?? [];
      const fieldsReady = currentFields.length === fields.length && currentFields.every((field, index) => field.name === fields[index]?.name);
      if (store && fieldsReady) {
        if (pendingCharts?.length) store.importRaw(pendingCharts);
        else store.resetVisualization("Chart 1");
        setPendingCharts(null);
        window.clearInterval(timer);
      } else if (++tries > 50) {
        window.clearInterval(timer);
        setDatasetMessage("The dataset loaded, but its chart state could not be refreshed. Try reloading the workspace.");
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [datasetRevision, fields, pendingCharts]);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  function activateDataset(nextData: DataRow[], nextFields: ReturnType<typeof inferFields>, name: string, charts: string[] | null) {
    setData(nextData);
    setFields(nextFields);
    setDatasetName(name);
    setPendingCharts(charts);
    setDatasetRevision((revision) => revision + 1);
    setDatasetMessage(`${nextData.length.toLocaleString()} rows · ${nextFields.length} columns loaded locally`);
    setAiMessage(null);
  }

  async function handleDataFile(file: File) {
    setDatasetMessage("");
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("Choose a file smaller than 25 MB for this browser workspace.");
      const text = await file.text();
      let rows: DataRow[];
      if (file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") {
        const parsed = Papa.parse<DataRow>(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        if (parsed.errors.length && parsed.data.length === 0) throw new Error(parsed.errors[0].message);
        rows = parsed.data.filter((row) => Object.keys(row).length > 0);
      } else {
        const parsed = JSON.parse(text) as unknown;
        const candidate = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && "data" in parsed ? (parsed as { data: unknown }).data : null;
        if (!Array.isArray(candidate)) throw new Error("JSON data must be an array of row objects, or an object with a data array.");
        rows = candidate as DataRow[];
      }
      if (rows.length === 0 || !rows[0] || typeof rows[0] !== "object") throw new Error("The file does not contain any usable rows.");
      activateDataset(rows, inferFields(rows), file.name, null);
    } catch (error) {
      setDatasetMessage(error instanceof Error ? error.message : "Could not read this data file.");
    }
  }

  async function handleWorkspaceFile(file: File) {
    setDatasetMessage("");
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error("Choose a workspace smaller than 50 MB.");
      const parsed = JSON.parse(await file.text()) as Partial<WorkspaceFile>;
      if (parsed.format !== "chartdeck.workspace" || parsed.version !== 1 || !parsed.dataset || !Array.isArray(parsed.dataset.data)) {
        throw new Error("This is not a supported ChartDeck workspace file.");
      }
      const rows = parsed.dataset.data as DataRow[];
      const importedFields = Array.isArray(parsed.dataset.fields) && parsed.dataset.fields.length
        ? parsed.dataset.fields as ReturnType<typeof inferFields>
        : inferFields(rows);
      const charts = Array.isArray(parsed.charts) ? parsed.charts.filter((chart): chart is string => typeof chart === "string") : [];
      activateDataset(rows, importedFields, parsed.dataset.name || file.name, charts);
    } catch (error) {
      setDatasetMessage(error instanceof Error ? error.message : "Could not open this workspace file.");
    }
  }

  function exportWorkspace() {
    const workspace: WorkspaceFile = {
      format: "chartdeck.workspace",
      version: 1,
      savedAt: new Date().toISOString(),
      dataset: { name: datasetName, data, fields: storeRef.current?.meta ?? fields },
      charts: storeRef.current?.exportAllCharts() ?? []
    };
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${datasetName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "chartdeck-workspace"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDatasetMessage("Workspace exported to a local JSON file.");
  }

  function updateFieldMetadata(fid: string, diff: Partial<(typeof fields)[number]>) {
    setFields((current) => current.map((field) => field.fid === fid ? { ...field, ...diff } : field));
  }

  async function createChart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAiBusy(true);
    setAiMessage(null);
    try {
      const activeFields = storeRef.current?.meta ?? fields;
      const terseSpec = await generateTerseSpec(settings, prompt, activeFields);
      const { normalize } = await import("@kanaries/graphic-walker");
      const chart = normalize(terseSpec, activeFields);
      if (!storeRef.current) throw new Error("The chart editor is still loading. Try again in a moment.");
      storeRef.current.appendFromCode(chart);
      setAiMessage({ text: "Chart added to this workspace. Refine it in the editor or ask for another view.", error: false });
      setPrompt("");
    } catch (error) {
      setAiMessage({ text: error instanceof Error ? error.message : "Chart generation failed.", error: true });
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <main className="workspace-shell" data-theme={theme}>
      <header className="workspace-header">
        <div className="workspace-brand">
          <a href="/" className="brand-lockup" aria-label="ChartDeck home"><span className="brand-symbol"><BarChart3 size={15} /></span><span className="brand-name">chartdeck</span></a>
          <span className="workspace-divider" />
          <span className="workspace-status"><i /> Local workspace · {data.length.toLocaleString()} rows</span>
        </div>
        <div className="workspace-actions">
          <input ref={dataInput} className="sr-only" type="file" accept=".csv,.json,text/csv,application/json" aria-label="Choose a CSV or JSON dataset" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleDataFile(file); event.currentTarget.value = ""; }} />
          <input ref={workspaceInput} className="sr-only" type="file" accept=".json,application/json" aria-label="Choose a ChartDeck workspace JSON file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleWorkspaceFile(file); event.currentTarget.value = ""; }} />
          <button className="workspace-button" type="button" onClick={() => dataInput.current?.click()} title="Import a CSV or JSON dataset"><ArrowUpFromLine size={14} /><span className="workspace-button-label">Open data</span></button>
          <button className="workspace-button" type="button" onClick={() => workspaceInput.current?.click()} title="Import a ChartDeck JSON workspace"><ArrowUpFromLine size={14} /><span className="workspace-button-label">Import workspace</span></button>
          <button className="workspace-button" type="button" onClick={exportWorkspace} title="Export workspace as JSON"><ArrowDownToLine size={14} /><span className="workspace-button-label">Export .json</span></button>
          <button className="workspace-button" type="button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} title="Toggle editor appearance">{theme === "light" ? <Moon size={14} /> : <Sun size={14} />}<span className="workspace-button-label">{theme === "light" ? "Dark" : "Light"}</span></button>
          <button className="workspace-button" type="button" onClick={() => setSettingsOpen(true)} title="Configure an AI provider"><Settings2 size={14} /><span className="workspace-button-label">BYOK AI</span></button>
          <div className="account-chip">
            <span className="account-avatar">{profile.picture ? <img src={profile.picture} alt="" referrerPolicy="no-referrer" /> : profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="account-name" title={profile.email}>{profile.name}</span>
            <button className="workspace-button" type="button" onClick={onSignOut} title="Sign out"><LogOut size={14} /><span className="workspace-button-label">Sign out</span></button>
          </div>
        </div>
      </header>

      <section className="workspace-content" aria-label="ChartDeck analytics workspace">
        <div className="graphic-canvas">
          <GraphicWalker data={data} fields={fields} storeRef={storeRef} appearance={theme} defaultTab="visualization" onMetaChange={updateFieldMetadata} />
        </div>
        <aside className="ai-dock" aria-label="Ask AI chart builder">
          <div className="ai-dock-head">
            <div className="ai-dock-title"><WandSparkles size={15} /> Ask AI <span>(BYOK)</span></div>
            <button className="dock-toggle" type="button" onClick={() => setAiExpanded((value) => !value)} aria-expanded={aiExpanded}>
              {aiExpanded ? "Close" : "Describe a chart"} {aiExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>
          {aiExpanded ? <div className="ai-dock-body">
            <form className="ai-prompt" onSubmit={createChart}>
              <label className="sr-only" htmlFor="chart-prompt">Describe the chart you want</label>
              <textarea id="chart-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={`Try: Compare average sales by region, colored by category`} />
              <button className="workspace-button primary" type="submit" disabled={aiBusy || !prompt.trim()} aria-label="Generate chart with the active AI provider">{aiBusy ? <LoaderCircle className="spin" size={15} /> : <WandSparkles size={15} />}</button>
            </form>
            <p className="ai-privacy"><CircleHelp size={12} /> Only field names and types are sent with the prompt; no dataset rows are included.</p>
            {aiMessage ? <p className={`ai-result${aiMessage.error ? " error" : ""}`} role="status">{aiMessage.text}</p> : null}
          </div> : null}
        </aside>
      </section>

      {datasetMessage ? <div className="dataset-toast" role="status">{datasetMessage}<button type="button" onClick={() => setDatasetMessage("")} aria-label="Dismiss message">×</button></div> : null}
      {settingsOpen ? <AiSettingsModal settings={settings} onChange={setSettings} onClose={closeSettings} /> : null}
    </main>
  );
}
