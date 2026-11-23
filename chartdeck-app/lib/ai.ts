import type { IMutField } from "@kanaries/graphic-walker";

export type Provider = "gemini" | "openai" | "anthropic" | "ollama";

export type ByokSettings = {
  activeProvider: Provider;
  gemini: { apiKey: string; model: "gemini-2.5-flash" | "gemini-2.5-pro" };
  openai: { apiKey: string; model: "gpt-4o-mini" | "gpt-4o" };
  anthropic: { apiKey: string; model: "claude-haiku-4-5" | "claude-sonnet-4-5" };
  ollama: { baseUrl: string; port: string; model: string; passkey: string };
};

export const DEFAULT_SETTINGS: ByokSettings = {
  activeProvider: "gemini",
  gemini: { apiKey: "", model: "gemini-2.5-flash" },
  openai: { apiKey: "", model: "gpt-4o-mini" },
  anthropic: { apiKey: "", model: "claude-haiku-4-5" },
  ollama: { baseUrl: "http://localhost", port: "11434", model: "qwen2.5-coder", passkey: "" }
};

export type ConnectionResult = { status: number; latencyMs: number };

const API_ROOTS = {
  gemini: "https://generativelanguage.googleapis.com",
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com"
};

function ollamaUrl(settings: ByokSettings["ollama"], endpoint: string) {
  const input = settings.baseUrl.trim();
  if (!input) throw new Error("Enter an Ollama Base URL first.");
  const url = new URL(input.includes("://") ? input : `https://${input}`);
  if (settings.port.trim()) url.port = settings.port.trim();
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${endpoint}`.replace(/^\/$/, `/${endpoint}`);
  url.search = "";
  return url.toString();
}

function ollamaHeaders(passkey: string): Record<string, string> {
  if (!passkey.trim()) return {};
  return { Authorization: `Bearer ${passkey.trim()}`, "X-API-Key": passkey.trim() };
}

async function readResponse(response: Response) {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const errorBody = body as { error?: { message?: string }; message?: string } | null;
    throw new Error(errorBody?.error?.message ?? errorBody?.message ?? `Provider returned HTTP ${response.status}.`);
  }
  return body as Record<string, unknown> | null;
}

export async function testConnection(settings: ByokSettings): Promise<ConnectionResult> {
  const provider = settings.activeProvider;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  const started = performance.now();
  try {
    let response: Response;
    if (provider === "gemini") {
      const key = settings.gemini.apiKey.trim();
      if (!key) throw new Error("Add a Gemini API key first.");
      response = await fetch(`${API_ROOTS.gemini}/v1beta/models`, {
        headers: { "x-goog-api-key": key }, signal: controller.signal
      });
    } else if (provider === "openai") {
      const key = settings.openai.apiKey.trim();
      if (!key) throw new Error("Add an OpenAI API key first.");
      response = await fetch(`${API_ROOTS.openai}/v1/models`, {
        headers: { Authorization: `Bearer ${key}` }, signal: controller.signal
      });
    } else if (provider === "anthropic") {
      const key = settings.anthropic.apiKey.trim();
      if (!key) throw new Error("Add an Anthropic API key first.");
      response = await fetch(`${API_ROOTS.anthropic}/v1/models`, {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        }, signal: controller.signal
      });
    } else {
      response = await fetch(ollamaUrl(settings.ollama, "api/tags"), {
        headers: ollamaHeaders(settings.ollama.passkey), signal: controller.signal
      });
    }
    const latencyMs = Math.round(performance.now() - started);
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const errorBody = body as { error?: { message?: string }; message?: string } | null;
      const detail = errorBody?.error?.message ?? errorBody?.message;
      throw new Error(`HTTP ${response.status} · ${latencyMs} ms${detail ? ` · ${detail}` : ""}`);
    }
    return { status: response.status, latencyMs };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Connection timed out. Check the URL, network access, and CORS settings.");
    }
    if (error instanceof TypeError) {
      throw new Error("The browser could not reach this provider. Check its URL and CORS allowlist for https://chartdek.vercel.com.");
    }
    throw error instanceof Error ? error : new Error("Connection test failed.");
  } finally {
    window.clearTimeout(timeout);
  }
}

function chartPrompt(prompt: string, fields: IMutField[]) {
  const fieldInfo = fields.map(({ fid, name, analyticType, semanticType }) => ({ fid, name, analyticType, semanticType }));
  return [
    "Create one valid Graphic Walker TerseSpec JSON object for the requested chart.",
    "Return JSON only, with no markdown or extra keys. Use only the provided field names for x, y, color, and other channels.",
    "Valid marks: bar, line, point, area, circle, rect, boxplot, arc, tick.",
    "Use aggregate(field) shorthand such as sum(Sales), mean(Profit), or count(). If a useful axis is unavailable, choose the closest supported fields.",
    `Field metadata: ${JSON.stringify(fieldInfo)}`,
    `Chart request: ${prompt.trim()}`
  ].join("\n\n");
}

function parseChartObject(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The provider did not return a TerseSpec object.");
  }
  return parsed as Record<string, unknown>;
}

export async function generateTerseSpec(settings: ByokSettings, prompt: string, fields: IMutField[]) {
  if (!prompt.trim()) throw new Error("Describe the chart you want to build.");
  const instructions = chartPrompt(prompt, fields);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);
  try {
    let response: Response;
    if (settings.activeProvider === "gemini") {
      const { apiKey, model } = settings.gemini;
      if (!apiKey.trim()) throw new Error("Add a Gemini API key in BYOK AI Settings.");
      response = await fetch(`${API_ROOTS.gemini}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey.trim() },
        body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
        signal: controller.signal
      });
      const body = await readResponse(response);
      const candidates = body?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
      const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
      if (!text) throw new Error("Gemini returned an empty response.");
      return parseChartObject(text);
    }
    if (settings.activeProvider === "openai") {
      const { apiKey, model } = settings.openai;
      if (!apiKey.trim()) throw new Error("Add an OpenAI API key in BYOK AI Settings.");
      response = await fetch(`${API_ROOTS.openai}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: "You create valid Graphic Walker TerseSpec chart JSON. Return JSON only." }, { role: "user", content: instructions }], response_format: { type: "json_object" }, temperature: 0.2 }),
        signal: controller.signal
      });
      const body = await readResponse(response);
      const choices = body?.choices as Array<{ message?: { content?: string } }> | undefined;
      const text = choices?.[0]?.message?.content;
      if (!text) throw new Error("OpenAI returned an empty response.");
      return parseChartObject(text);
    }
    if (settings.activeProvider === "anthropic") {
      const { apiKey, model } = settings.anthropic;
      if (!apiKey.trim()) throw new Error("Add an Anthropic API key in BYOK AI Settings.");
      response = await fetch(`${API_ROOTS.anthropic}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model, max_tokens: 700, system: "You create valid Graphic Walker TerseSpec chart JSON. Return JSON only.", messages: [{ role: "user", content: instructions }] }),
        signal: controller.signal
      });
      const body = await readResponse(response);
      const content = body?.content as Array<{ text?: string }> | undefined;
      const text = content?.map((item) => item.text ?? "").join("");
      if (!text) throw new Error("Claude returned an empty response.");
      return parseChartObject(text);
    }
    const { model, passkey } = settings.ollama;
    if (!model.trim()) throw new Error("Enter an Ollama model name in BYOK AI Settings.");
    response = await fetch(ollamaUrl(settings.ollama, "api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...ollamaHeaders(passkey) },
      body: JSON.stringify({ model: model.trim(), messages: [{ role: "system", content: "You create valid Graphic Walker TerseSpec chart JSON. Return JSON only." }, { role: "user", content: instructions }], format: "json", stream: false }),
      signal: controller.signal
    });
    const body = await readResponse(response);
    const message = body?.message as { content?: string } | undefined;
    if (!message?.content) throw new Error("Ollama returned an empty response.");
    return parseChartObject(message.content);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The request timed out. Check provider availability and network access.");
    if (error instanceof TypeError) throw new Error("The browser could not reach this provider. Check CORS and network access.");
    throw error instanceof Error ? error : new Error("Chart generation failed.");
  } finally {
    window.clearTimeout(timeout);
  }
}
