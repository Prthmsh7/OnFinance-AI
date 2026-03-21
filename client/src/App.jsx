import { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import './index.css';

/* ─── Mermaid init ──────────────────────────────────── */
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1', primaryTextColor: '#e5e7eb',
    primaryBorderColor: '#2A2D34', lineColor: '#6B7280',
    secondaryColor: '#17181C', tertiaryColor: '#1F2937',
    background: '#0F0F10', mainBkg: '#17181C',
    nodeBorder: '#4B5563', edgeLabelBackground: '#17181C',
    titleColor: '#E5E7EB', clusterBkg: '#1F2937',
  },
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  securityLevel: 'loose',
});

let mermaidIdCounter = 0;

/* ─── Icons ─────────────────────────────────────────── */
const Ico = ({ path, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {[].concat(path).map((d, i) => <path key={i} d={d} />)}
  </svg>
);
const IcPlus    = () => <Ico path="M12 5v14M5 12h14" />;
const IcSend    = () => <Ico path={['M22 2L11 13', 'M22 2L15 22l-4-9-9-4 20-7z']} />;
const IcCode    = () => <Ico path={['M16 18l6-6-6-6', 'M8 6l-6 6 6 6']} />;
const IcCopy    = () => <Ico path={['M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2', 'M16 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2']} />;
const IcDown    = () => <Ico path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
const IcRefresh = () => <Ico path={['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15']} />;
const IcEdit    = () => <Ico path={['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z']} />;

/* ─── Constants ─────────────────────────────────────── */
const DIAGRAM_TYPES = [
  // { id: 'sequenceDiagram',  label: 'Sequence'  },
  { id: 'classDiagram',     label: 'Class'     },
  { id: 'flowchart',        label: 'Flowchart' },
  // { id: 'stateDiagram-v2',  label: 'State'     },
  // { id: 'componentDiagram', label: 'Component' },
];
const DEFAULT_TYPES = ['classDiagram', 'flowchart'];

const EXAMPLES = [
  { label: 'E-commerce checkout', prompt: 'An e-commerce system where users browse products, add to cart, checkout with Stripe, receive order confirmation, and the order is dispatched via a warehouse.' },
  { label: 'Microservices auth',  prompt: 'A microservices authentication system with API Gateway, Auth Service (JWT), User Service (PostgreSQL), Token Refresh, and Rate Limiter. Services communicate via REST.' },
  { label: 'SEBI compliance pipeline', prompt: 'A compliance monitoring system that ingests SEBI circulars via PDF/URL, parses them into clauses using an LLM, performs gap analysis against existing compliance setup, and generates reports for compliance officers.' },
];
/* ─── Prompts ───────────────────────────────────────── */

const UNIFIED_PROCESS_PROMPT = `You are a systems analyst and Mermaid.js expert. Analyze the following request.
Return a valid JSON object containing:
1. "standardized_prompt": A concise, formal "canonical" version of the description.
2. "model": The structured system model (entities, interactions, classes, etc.).
3. "diagrams": A dictionary where keys are diagram types (sequenceDiagram, flowchart, etc.) and values are full Mermaid.js code.

RULES for Model:
- Use consistent entity IDs (CamelCase).
- Extract classes, interactions, and data flows.

RULES for Diagrams:
- Use Mermaid v10+ syntax.
// - sequenceDiagram: use participant/actor.
- flowchart: use flowchart TD.
- classDiagram: use ~T~ for generics. No angle brackets. Visibility: + public, - private. No colon before return type (+method() String).
// - componentDiagram: use flowchart TD + subgraph.

Return ONLY valid JSON - no markdown, no prose.`;

const UNIFIED_UPDATE_PROMPT = `You are a systems analyst and Mermaid.js expert. Update an existing system.
Return a valid JSON object containing:
1. "standardized_prompt": A canonical description of the UPDATED system.
2. "model": The full updated system model.
3. "diagrams": All updated Mermaid diagrams.

Current Model:
{{CURRENT_MODEL}}

Follow same rules for JSON, Model, and Diagrams as the primary analysis.
Return ONLY valid JSON.`;

/* ─── Cache ─── */
const CACHE_KEY = 'uml_gen_cache';
const cache = (() => {
  try { return new Map(Object.entries(JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'))); }
  catch { return new Map(); }
})();
function persistCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache))); } catch { /* ignore */ }
}

function normalizePrompt(text) {
  return text.toLowerCase().trim()
    .replace(/\s+/g, ' ').replace(/["'`]/g, '')
    .replace(/[.,;!?]+$/g, '').replace(/\band\b/g, '&');
}

/* ─── Mermaid sanitizers ────────────────────────────── */

function sanitizeClassDiagram(raw) {
  // Fix generics: List<X> → List~X~  (handle nested and multi-param generics)
  let code = raw
    .replace(/^(\s*[+\-#~]\w[\w.]*)\s*<([^>\n]+)>/gm, (_, p, i) => `${p}~${i}~`)
    .replace(/(\w+)<([A-Za-z_][\w, ]*)>/g, (_, c, i) => `${c}~${i}~`)
    .replace(/<([^~>\n]{1,40})>/g, '~$1~');
  // Fix colon return types: +method() : void → +method() void
  code = code.replace(/^(\s*[+\-#~][^\n]+)\)\s*:\s*([\w~]+)\s*$/gm, '$1 $2');
  // Remove standalone <<stereotype>> lines
  code = code.replace(/^\s*<<[^>]+>>\s*$/gm, '');
  // Remove abstract/interface modifiers before class keyword
  code = code.replace(/^(\s*)(abstract|interface)\s+(class\s)/gm, '$1$3');
  // Remove {abstract} {static} markers
  code = code.replace(/\{abstract\}/g, '').replace(/\{static\}/g, '');
  // Remove note/link/click/callback lines that some LLMs inject
  code = code.replace(/^\s*(note\s+for|link\s+|click\s+|callback\s+).*$/gm, '');
  // Remove namespace blocks (keep content)
  code = code.replace(/^\s*namespace\s+\w+\s*\{?\s*$/gm, '');
  // Fix nested class blocks
  const out = []; let depth = 0;
  for (const line of code.split('\n')) {
    const t = line.trim();
    if (!t) { out.push(line); continue; }
    const isHeader = /^(classDiagram|flowchart|sequenceDiagram|stateDiagram)/.test(t);
    const isClassOpen = /^class\s+\w[\w~]*\s*\{/.test(t);
    if (isClassOpen && depth > 0) { out.push('}'); depth = 0; }
    if (!isHeader) for (const ch of t) { if (ch === '{') depth++; else if (ch === '}') depth = Math.max(0, depth - 1); }
    out.push(line);
  }
  while (depth-- > 0) out.push('}');
  return out.join('\n');
}

function sanitizeSequenceDiagram(code) {
  return code.replace(
    /^(\s*(?:participant|actor)\s+)([\w ]+?)(\s*(?:as\s+.*)?$)/gm,
    (_, kw, name, rest) => { const n = name.trim(); return n.includes(' ') ? `${kw}"${n}"${rest}` : `${kw}${n}${rest}`; }
  );
}

function convertComponentToFlowchart(code) {
  const out = []; let hasHeader = false;
  for (const raw of code.split('\n')) {
    const t = raw.trim();
    if (/^flowchart/.test(t)) { out.push(raw); hasHeader = true; continue; }
    if (/^componentDiagram/.test(t)) { if (!hasHeader) { out.push('flowchart TD'); hasHeader = true; } continue; }
    if (!hasHeader) { out.push('flowchart TD'); hasHeader = true; }
    if (/^<<[^>]+>>$/.test(t)) continue;
    const pkg = t.match(/^(?:package|system|boundary)\s+["']?([\w\s-]+)["']?\s*\{?$/);
    if (pkg) { out.push(`subgraph ${pkg[1].trim().replace(/\s+/g, '_')}`); continue; }
    if (t === '}') { out.push('end'); continue; }
    const comp = t.match(/^(?:component|node)\s+["']?([\w\s-]+)["']?(?:\s+as\s+(\w+))?/);
    if (comp) { const l = comp[1].trim(); out.push(`${comp[2] || l.replace(/\s+/g, '_')}[${l}]`); continue; }
    const brk = t.match(/^\[([\w\s-]+)\](?:\s+as\s+(\w+))?/);
    if (brk) { const l = brk[1].trim(); out.push(`${brk[2] || l.replace(/\s+/g, '_')}[${l}]`); continue; }
    const iface = t.match(/^(?:interface|database)\s+["']?([\w\s-]+)["']?(?:\s+as\s+(\w+))?/);
    if (iface) { const l = iface[1].trim(); out.push(`${iface[2] || l.replace(/\s+/g, '_')}([${l}])`); continue; }
    out.push(raw.replace(/<<[^>]+>>/g, '').replace(/\(\)/g, ''));
  }
  return out.join('\n');
}

function sanitizeMermaid(code, type) {
  let out = code;
  if (type === 'classDiagram' || type === 'classDiagram-v2') out = sanitizeClassDiagram(out);
  else if (type === 'sequenceDiagram') out = sanitizeSequenceDiagram(out);
  else if (type === 'componentDiagram') out = convertComponentToFlowchart(out);
  else if (type === 'flowchart') out = out.replace(/(\[|\()([^\])]*)<([^>]*)>([^\])]*)/g, (_, o, p, i, q) => `${o}${p}&lt;${i}&gt;${q}`);
  // Strip Windows CR characters
  out = out.replace(/\r/g, '');
  // Collapse whitespace-only lines
  out = out.replace(/^\s+$/gm, '');
  // Remove trailing semicolons ONLY on relation/arrow lines (not state labels which use semicolons legitimately)
  out = out.replace(/^(\s*(?:[\w"]+\s*[-=.]+>|-->|--|==)[^\n]*);\s*$/gm, '$1');
  return out;
}



function validateJsonInput(text) {
  if (!text.trim().startsWith('{')) return { state: 'idle' };
  try {
    const data = JSON.parse(text);
    if (!data.prompt) return { state: 'invalid', error: 'Missing "prompt" field' };
    return { state: 'valid', data };
  } catch (e) { return { state: 'invalid', error: e.message }; }
}

/* ─── MermaidDiagram component ──────────────────────── */
function MermaidDiagram({ code }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!code || !ref.current) return;
    const id = `m-${++mermaidIdCounter}`;
    ref.current.innerHTML = '';
    setError(null);
    mermaid.render(id, code)
      .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
      .catch(err => setError(String(err)));
  }, [code]);
  if (error) return (
    <div style={{ padding: 16 }}>
      <div style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: 8 }}>⚠ Syntax error in generated diagram</div>
      <pre style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#6B7280', whiteSpace: 'pre-wrap' }}>{error}</pre>
    </div>
  );
  return <div ref={ref} style={{ width: '100%' }} />;
}

/* ─── FeedbackRow component ─────────────────────────── */
function FeedbackRow({ prompt, diagramCode }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const submit = () => {
    if (!rating) return;
    console.log('[Feedback]', { rating, comment: comment || rating, prompt, diagramCode, ts: new Date().toISOString() });
    setSent(true);
  };
  if (sent) return <div className="feedback-row"><span className="fb-label">✓ Feedback sent — thank you!</span></div>;
  return (
    <div className="feedback-row">
      <span className="fb-label">Rate this diagram:</span>
      <button className={`fb-btn positive ${rating === 'positive' ? 'selected' : ''}`} onClick={() => setRating('positive')}>👍 Good</button>
      <button className={`fb-btn negative ${rating === 'negative' ? 'selected' : ''}`} onClick={() => setRating('negative')}>👎 Improve</button>
      {rating && <>
        <input className="fb-comment" placeholder="What to improve? (optional)"
          value={comment} onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button className="fb-submit" onClick={submit}>Send</button>
      </>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_key') || '';

  // Chat state
  const [messages, setMessages]         = useState([]);
  const [sessions, setSessions]         = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [inputText, setInputText]       = useState('');
  const [isJsonMode, setIsJsonMode]     = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_TYPES);
  const [isLoading, setIsLoading]       = useState(false);
  const [loadingStage, setLoadingStage] = useState(''); // 'extracting' | 'generating'

  // Diagram panel state
  const [activeDiagramMsg, setActiveDiagramMsg]   = useState(null);
  const [activeDiagramType, setActiveDiagramType] = useState(null);
  const [panelTab, setPanelTab]                   = useState('preview');
  const [zoom, setZoom]                           = useState(1);

  // Update mode: when set, next send applies a delta update instead of fresh generation
  const [updateTarget, setUpdateTarget] = useState(null); // { origPrompt, origModel }

  // Layout
  const [splitPct, setSplitPct]     = useState(50);
  const [showSessions, setShowSessions] = useState(false);
  const [toast, setToast]           = useState(null);

  const textareaRef = useRef(null);
  const bottomRef   = useRef(null);
  const appRef      = useRef(null);
  const isDragging  = useRef(false);
  const isProcessing = useRef(false);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  const requestId = useRef(0);

  /* ── Derived ── */
  const jsonState    = isJsonMode ? validateJsonInput(inputText) : { state: 'idle' };
  const canSend      = inputText.trim() && !isLoading;
  const currentMsg   = messages.find(m => m.id === activeDiagramMsg);
  const availTypes   = currentMsg ? Object.keys(currentMsg.diagrams || {}) : [];
  const shownType    = activeDiagramType || availTypes[0] || null;
  const shownCode    = currentMsg?.diagrams?.[shownType] || null;

  /* ── Toast ── */
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Auto-scroll + textarea resize ── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
  }, [inputText]);

  /* ── Drag-to-resize ── */
  const startDrag = (e) => {
    e.preventDefault();
    isDragging.current = true;
    const onMove = (ev) => {
      if (!isDragging.current || !appRef.current) return;
      const pct = ((ev.clientX - appRef.current.getBoundingClientRect().left) / appRef.current.offsetWidth) * 100;
      setSplitPct(Math.min(Math.max(pct, 25), 75));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ── Gemini API call ── */
  const callGeminiAPI = async (systemPrompt, userContent, signal) => {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: { temperature: 0, topK: 1, topP: 0.1, maxOutputTokens: 8192 },
    });
    const tryModel = async (model) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error?.message || res.statusText;
        const isQuota = res.status === 429 || msg.toLowerCase().includes('quota');
        throw Object.assign(new Error(isQuota ? 'Quota exceeded — wait ~1 min or enable billing at console.cloud.google.com.' : msg), { isQuota });
      }
      return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    };
    try { return await tryModel('gemini-2.5-flash-lite'); }
    catch (err) {
      if (err.name === 'AbortError') throw err;
      if (err.isQuota) return await tryModel('gemini-2.5-flash');
      throw err;
    }
  };

  const unifiedAIProcess = async (userInput, types, origModel = null, signal = null, cacheKey = null) => {
    const sys = origModel 
      ? UNIFIED_UPDATE_PROMPT.replace('{{CURRENT_MODEL}}', JSON.stringify(origModel, null, 2))
      : UNIFIED_PROCESS_PROMPT;
    
    const userContent = origModel 
      ? `UPDATE REQUEST: ${userInput}\nApply to existing model.`
      : userInput;

    console.log('[Gemini API Call]', { type: origModel ? 'update' : 'extract', length: userInput.length });
    const raw = await callGeminiAPI(sys, userContent, signal);
    const jsonStart = raw.indexOf('{');
    if (jsonStart === -1) throw new Error('AI returned no JSON content');
    const data = JSON.parse(raw.slice(jsonStart, raw.lastIndexOf('}') + 1));
    
    if (!data.model || !data.diagrams) throw new Error('Incomplete AI response — missing model or diagrams');
    const std = data.standardized_prompt || userInput;

    // Sanitize diagrams
    for (const t of Object.keys(data.diagrams)) {
      data.diagrams[t] = sanitizeMermaid(data.diagrams[t], t);
    }

    // Cache results
    const stdKey = cacheKey || ('std:' + normalizePrompt(userInput));
    cache.set(stdKey, std);
    const normStd = normalizePrompt(std);
    cache.set('model:' + normStd, JSON.stringify(data.model));
    cache.set(normStd + '|' + [...types].sort().join(',') + ':diagrams', JSON.stringify(data.diagrams));
    persistCache();

    return data;
  };

  const processInteraction = async ({ prompt, types, isUpdate = false, origModel = null, origPrompt = null }) => {
    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const rid = ++requestId.current;
    const taskType = isUpdate ? 'UPDATE' : 'GENERATE';
    console.log(`[REQ_${rid}] Starting ${taskType} for: "${prompt.slice(0, 40)}..."`);

    isProcessing.current = true;
    setIsLoading(true);

    try {
      setLoadingStage('analysing');
      const fullContext = isUpdate ? `${origPrompt} ${prompt}` : prompt;
      const normInput = normalizePrompt(fullContext);
      const stdKey = 'std:' + normInput;

      let stdPrompt = cache.has(stdKey) ? cache.get(stdKey) : null;
      let model = null, diagrams = null;

      if (stdPrompt) {
        const normStd = normalizePrompt(stdPrompt);
        const modelKey = 'model:' + normStd;
        const diagKey = normStd + '|' + [...types].sort().join(',') + ':diagrams';
        if (cache.has(modelKey)) model = JSON.parse(cache.get(modelKey));
        if (cache.has(diagKey)) diagrams = JSON.parse(cache.get(diagKey));
      }

      if (model && diagrams) {
        console.log(`[REQ_${rid}] CACHE HIT. 0 API calls.`);
      } else {
        console.log(`[REQ_${rid}] CACHE MISS. Sending 1 Gemini API call...`);
        const result = await unifiedAIProcess(prompt, types, origModel, signal, stdKey);
        model = result.model;
        diagrams = result.diagrams;
        stdPrompt = result.standardized_prompt;
      }

      if (signal.aborted) return;

      const aiMsg = {
        id: (Date.now() + rid).toString(), role: 'ai',
        text: isUpdate ? `Updated diagram(s).` : `Generated ${Object.keys(diagrams).length} diagram(s).`,
        diagrams, prompt: fullContext, model,
      };

      setMessages(prev => [...prev, aiMsg]);
      setActiveDiagramMsg(aiMsg.id);
      setActiveDiagramType(Object.keys(diagrams)[0] || null);

      if (!isUpdate) {
        setSessions(prev => [{ id: aiMsg.id, name: prompt.slice(0, 40) + (prompt.length > 40 ? '…' : ''), types }, ...prev]);
        setActiveSession(aiMsg.id);
      }
      console.log(`[REQ_${rid}] SUCCESS.`);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log(`[REQ_${rid}] ABORTED.`);
      } else {
        console.error(`[REQ_${rid}] FAILED:`, err);
        showToast(err.message, 'err');
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setLoadingStage('');
        isProcessing.current = false;
      }
    }
  };

  /* ── Send message (unified controller) ── */
  const sendMessage = async () => {
    if (!canSend) return;
    if (!apiKey) { showToast('Set VITE_GEMINI_API_KEY in your .env file', 'err'); return; }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      let prompt = inputText.trim();
      let types  = selectedTypes.length ? selectedTypes : DEFAULT_TYPES;
      
      if (isJsonMode) {
        if (jsonState.state !== 'valid') { showToast('Fix JSON before sending', 'err'); return; }
        prompt = jsonState.data.prompt;
        if (jsonState.data.diagram_types?.length) types = jsonState.data.diagram_types;
      }

      if (updateTarget) {
        const { origPrompt, origModel } = updateTarget;
        setUpdateTarget(null);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `🔄 Update: ${prompt}` }]);
        setInputText('');
        return processInteraction({ prompt, types, isUpdate: true, origModel, origPrompt });
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
      setInputText('');
      processInteraction({ prompt, types });
    }, 400);
  };



  /* ── Export helpers ── */
  const copySource = () => { if (shownCode) { navigator.clipboard.writeText(shownCode); showToast('Copied to clipboard'); } };

  const downloadSvg = () => {
    const svg = document.querySelector('.diagram-canvas svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${shownType}.svg` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVG downloaded');
  };

  const downloadPng = () => {
    const svg = document.querySelector('.diagram-canvas svg');
    if (!svg) return;
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = svg.viewBox.baseVal.width || 800; c.height = svg.viewBox.baseVal.height || 600;
      c.getContext('2d').drawImage(img, 0, 0);
      const a = Object.assign(document.createElement('a'), { href: c.toDataURL('image/png'), download: `${shownType}.png` });
      a.click();
    };
    showToast('PNG downloaded');
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div className="app" ref={appRef}>

      {/* ════ CHAT PANEL ════ */}
      <section className="chat-panel" style={{ width: `${splitPct}%` }}>

        {/* Header */}
        <div className="chat-header">
          <div className="brand">
            <div className="brand-icon">◈</div>
            <div>
              <div className="chat-header-title">UML Generator</div>
              <div className="chat-header-sub">Describe your system → get diagrams</div>
            </div>
          </div>
          <div className="header-actions">
            {/* Sessions dropdown */}
            <div style={{ position: 'relative' }}>
              <button className="ia-btn" onClick={() => setShowSessions(v => !v)} title="Sessions">
                🕑 {sessions.length > 0 ? sessions.length : ''} Sessions
              </button>
              {showSessions && (
                <div className="sessions-dropdown" onClick={e => e.stopPropagation()}>
                  <div className="sessions-dropdown-header">
                    <span>Sessions</span>
                    <button className="ia-btn" style={{ fontSize: '0.72rem' }}
                      onClick={() => { setSessions([]); setMessages([]); setActiveSession(null); setActiveDiagramMsg(null); setShowSessions(false); }}>
                      Clear all
                    </button>
                  </div>
                  {sessions.length === 0
                    ? <div className="sessions-empty">No sessions yet</div>
                    : sessions.map(s => (
                      <div key={s.id} className={`session-row ${activeSession === s.id ? 'active' : ''}`}
                        onClick={() => { setActiveSession(s.id); setActiveDiagramMsg(s.id); setActiveDiagramType(null); setShowSessions(false); }}>
                        <div className="session-dot" />
                        <span className="session-name">{s.name}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            <div className="mode-toggle">
              <button className={`mode-btn ${!isJsonMode ? 'active' : ''}`} onClick={() => setIsJsonMode(false)}>Natural</button>
              <button className={`mode-btn ${isJsonMode ? 'active' : ''}`} onClick={() => setIsJsonMode(true)}>JSON</button>
            </div>
            <button className="ia-btn" title="New session"
              onClick={() => { setMessages([]); setActiveSession(null); setActiveDiagramMsg(null); setInputText(''); setUpdateTarget(null); }}>
              <IcPlus /> New
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">◈</div>
              <div className="empty-title">Describe your system</div>
              <div className="empty-sub">
                Natural language or JSON. All diagram views share the same <strong>system model</strong> — consistent entities across every diagram type.
              </div>
              <div className="example-prompts">
                {EXAMPLES.map(ex => (
                  <button key={ex.label} className="example-pill"
                    onClick={() => { setInputText(ex.prompt); setIsJsonMode(false); }}>
                    <strong>{ex.label}</strong><br />
                    <span>{ex.prompt.slice(0, 70)}…</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`msg-row ${msg.role}`}>
                <div className={`msg-avatar ${msg.role}`}>{msg.role === 'ai' ? '◈' : 'U'}</div>
                <div className="msg-body">
                  <div className="msg-text">{msg.text}</div>

                  {/* Diagram type chips */}
                  {msg.role === 'ai' && msg.diagrams && Object.keys(msg.diagrams).length > 0 && (
                    <div className="diagram-chips">
                      {Object.keys(msg.diagrams).map(type => (
                        <button key={type} className="diagram-chip"
                          style={activeDiagramMsg === msg.id && shownType === type
                            ? { background: 'rgba(99,102,241,0.25)', borderColor: 'rgba(99,102,241,0.5)' } : {}}
                          onClick={() => { setActiveDiagramMsg(msg.id); setActiveDiagramType(type); setPanelTab('preview'); }}>
                          {type.replace('Diagram', '').replace('-v2', '').replace('flowchart', 'Flowchart')}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Update button */}
                  {msg.role === 'ai' && msg.diagrams && Object.keys(msg.diagrams).length > 0 && (
                    <button className="ia-btn" style={{ alignSelf: 'flex-start' }}
                      onClick={() => { setUpdateTarget({ origPrompt: msg.prompt || '', origModel: msg.model }); setInputText(''); setIsJsonMode(false); }}>
                      <IcRefresh /> Update diagram
                    </button>
                  )}

                  {/* Feedback */}
                  {msg.role === 'ai' && msg.diagrams && (
                    <FeedbackRow prompt={msg.prompt} diagramCode={Object.values(msg.diagrams).join('\n\n')} />
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="typing-row">
              <div className="msg-avatar ai">◈</div>
              <div>
                <div className="typing-dots"><div className="t-dot" /><div className="t-dot" /><div className="t-dot" /></div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  {loadingStage === 'extracting' ? '🔍 Analysing system model…' : loadingStage === 'generating' ? '⚙️ Generating diagrams…' : 'Working…'}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-section">
          {/* Update mode banner */}
          {updateTarget && (
            <div className="update-banner">
              <IcEdit /> Describe your changes — will update the existing diagram
              <button className="ia-btn" style={{ marginLeft: 'auto', fontSize: '0.72rem' }} onClick={() => setUpdateTarget(null)}>✕ Cancel</button>
            </div>
          )}

          {isJsonMode && (
            <div className="json-toggle-row">
              <span className={`json-badge ${jsonState.state}`}>
                {jsonState.state === 'valid' ? '✓ Valid JSON' : jsonState.state === 'invalid' ? '✗ Invalid JSON' : 'JSON Mode'}
              </span>
              {jsonState.state === 'invalid' && <span className="json-hint">{jsonState.error}</span>}
              {jsonState.state === 'idle' && <span className="json-hint">{'{"prompt":"...","diagram_types":[...]}'}</span>}
            </div>
          )}

          <div className="input-box">
            {!isJsonMode && (
              <div className="diagram-type-row">
                {DIAGRAM_TYPES.map(dt => (
                  <button key={dt.id} className={`dtype-chip ${selectedTypes.includes(dt.id) ? 'on' : ''}`}
                    onClick={() => setSelectedTypes(prev => prev.includes(dt.id) ? prev.filter(t => t !== dt.id) : [...prev, dt.id])}>
                    {selectedTypes.includes(dt.id) ? '✓ ' : ''}{dt.label}
                  </button>
                ))}
              </div>
            )}
            <textarea ref={textareaRef}
              className={`input-textarea ${isJsonMode ? 'json-mode' : ''}`}
              rows={1}
              placeholder={updateTarget
                ? 'Describe what to change…'
                : isJsonMode
                  ? '{"prompt":"Describe your system...","diagram_types":["sequenceDiagram","classDiagram"]}'
                  : 'Describe the system you want to model…'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isJsonMode) { e.preventDefault(); sendMessage(); } }}
              id="main-input"
            />
            <div className="input-actions">
              <button className="ia-btn" onClick={() => setIsJsonMode(v => !v)}>
                <IcCode /> {isJsonMode ? 'Natural' : 'JSON'}
              </button>
              <button className="send-btn" onClick={sendMessage} disabled={!canSend} id="send-btn">
                {updateTarget ? <><IcEdit /> Apply update</> : <><IcSend /> Generate</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════ DRAG HANDLE ════ */}
      <div className="drag-handle" onMouseDown={startDrag} title="Drag to resize" />

      {/* ════ DIAGRAM PANEL ════ */}
      <section className="diagram-panel" style={{ width: `${100 - splitPct}%` }}>

        {/* Header */}
        <div className="diagram-header">
          <div>
            <div className="diagram-title">Live Preview</div>
            <div className="diagram-meta">{shownCode ? `${shownType} · Mermaid.js` : 'No diagram selected'}</div>
          </div>
          <div className="header-actions">
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} title="Zoom out">−</button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} title="Zoom in">+</button>
              <button className="zoom-btn" onClick={() => setZoom(1)} title="Reset">⟳</button>
            </div>
            <div className="panel-tabs">
              <button className={`panel-tab ${panelTab === 'preview' ? 'active' : ''}`} onClick={() => setPanelTab('preview')}>Preview</button>
              <button className={`panel-tab ${panelTab === 'source' ? 'active' : ''}`} onClick={() => setPanelTab('source')}>Source</button>
            </div>
          </div>
        </div>

        {/* Diagram type tab bar */}
        {availTypes.length > 0 && (
          <div className="diagram-type-nav">
            {availTypes.map(t => (
              <button key={t} className={`dtnav-btn ${shownType === t ? 'active' : ''}`} onClick={() => setActiveDiagramType(t)}>
                {t.replace('Diagram', '').replace('-v2', '').replace('flowchart', 'Flowchart')}
              </button>
            ))}
          </div>
        )}

        {/* Canvas */}
        {shownCode ? (
          panelTab === 'preview' ? (
            <div className="diagram-canvas" style={{ overflow: 'auto' }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'inline-block', minWidth: '100%' }}>
                <MermaidDiagram key={`${activeDiagramMsg}-${shownType}`} code={shownCode} />
              </div>
            </div>
          ) : (
            <div className="source-view">
              <pre className="source-code">{shownCode}</pre>
            </div>
          )
        ) : (
          <div className="diagram-empty">
            <div className="diagram-empty-icon">◈</div>
            <div className="diagram-empty-text">No diagram yet</div>
            <div className="diagram-empty-sub">Describe your system in the chat.<br />All views share the same entity model.</div>
          </div>
        )}

        {/* Footer */}
        {shownCode && (
          <div className="diagram-footer">
            <button className="footer-btn" onClick={copySource}><IcCopy /> Copy source</button>
            <button className="footer-btn" onClick={downloadSvg}><IcDown /> SVG</button>
            <button className="footer-btn" onClick={downloadPng}><IcDown /> PNG</button>
          </div>
        )}
      </section>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
