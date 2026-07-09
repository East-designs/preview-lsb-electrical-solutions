1|// GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`.
2|"use strict";
3|(() => {
4|  var __defProp = Object.defineProperty;
5|  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
6|  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
7|
8|  // src/react.ts
9|  function getReact() {
10|    const R = window.React;
11|    if (!R) throw new Error("dc-runtime: window.React is not available yet");
12|    return R;
13|  }
14|  function getReactDOM() {
15|    const RD = window.ReactDOM;
16|    if (!RD) throw new Error("dc-runtime: window.ReactDOM is not available yet");
17|    return RD;
18|  }
19|  var h = ((...args) => getReact().createElement(
20|    ...args
21|  ));
22|
23|  // src/parse.ts
24|  function parseDcDocument(doc) {
25|    const dc = doc.querySelector("x-dc");
26|    if (!dc) return null;
27|    const scriptEl = doc.querySelector("script[data-dc-script]");
28|    const { props, preview } = parseDataProps(
29|      scriptEl?.getAttribute("data-props") ?? null
30|    );
31|    return {
32|      template: dc.innerHTML,
33|      js: scriptEl ? scriptEl.textContent || "" : "",
34|      props,
35|      preview
36|    };
37|  }
38|  function parseDcText(src) {
39|    const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);
40|    if (!openMatch) return null;
41|    const close = src.lastIndexOf("</x-dc>");
42|    if (close === -1 || close < openMatch.index) return null;
43|    const template = src.slice(openMatch.index + openMatch[0].length, close);
44|    const doc = new DOMParser().parseFromString(src, "text/html");
45|    const scriptEl = doc.querySelector("script[data-dc-script]");
46|    const { props, preview } = parseDataProps(
47|      scriptEl?.getAttribute("data-props") ?? null
48|    );
49|    return {
50|      template,
51|      js: scriptEl ? scriptEl.textContent || "" : "",
52|      props,
53|      preview
54|    };
55|  }
56|  function parseDataProps(raw) {
57|    if (!raw) return { props: null, preview: null };
58|    let parsed;
59|    try {
60|      parsed = JSON.parse(raw);
61|    } catch {
62|      return { props: null, preview: null };
63|    }
64|    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
65|      return { props: null, preview: null };
66|    }
67|    const obj = parsed;
68|    const preview = obj.$preview && typeof obj.$preview === "object" ? obj.$preview : null;
69|    const rest = {};
70|    for (const k of Object.keys(obj)) {
71|      if (k[0] !== "$") rest[k] = obj[k];
72|    }
73|    return { props: Object.keys(rest).length ? rest : null, preview };
74|  }
75|  function dcNameFromPath(pathname) {
76|    let p = pathname || "";
77|    try {
78|      p = decodeURIComponent(p);
79|    } catch {
80|    }
81|    const base = p.split("/").pop() || "Root";
82|    return base.replace(/\.dc\.html$/, "").replace(/\.html?$/, "") || "Root";
83|  }
84|
85|  // src/boot.ts
86|  var BASE_CSS = `
87|    .sc-placeholder{background:color-mix(in srgb,currentColor 8%,transparent);
88|      border:1px solid color-mix(in srgb,currentColor 50%,transparent);
89|      border-radius:2px;box-sizing:border-box;overflow:hidden}
90|    @keyframes sc-shine{0%{background-position:100% 50%}100%{background-position:0% 50%}}
91|    html.sc-dc-streaming .sc-placeholder,
92|    html.sc-dc-streaming .sc-interp.sc-missing{position:relative;
93|      background:color-mix(in srgb,currentColor 5%,transparent);
94|      border-color:transparent}
95|    html.sc-dc-streaming .sc-placeholder::before,
96|    html.sc-dc-streaming .sc-interp.sc-missing::before{content:'';
97|      position:absolute;inset:0;pointer-events:none;
98|      background:linear-gradient(90deg,rgba(217,119,87,0) 25%,rgba(247,225,211,.95) 37%,rgba(217,119,87,0) 63%);
99|      background-size:400% 100%;animation:sc-shine 1.4s ease infinite}
100|    html.sc-dc-streaming .sc-placeholder:nth-child(n+9 of .sc-placeholder)::before,
101|    html.sc-dc-streaming .sc-interp.sc-missing:nth-child(n+9 of .sc-interp.sc-missing)::before{animation:none;
102|      background:color-mix(in srgb,currentColor 8%,transparent)}
103|    .sc-placeholder-error{padding:4px 8px;font:11px/1.4 ui-monospace,monospace;
104|      color:color-mix(in srgb,currentColor 70%,transparent);word-break:break-word}
105|    .sc-interp.sc-missing{display:inline-block;width:2em;height:1em;overflow:hidden;
106|      vertical-align:text-bottom;background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);
107|      border-radius:2px;box-sizing:border-box;color:transparent;
108|      user-select:none}
109|    .sc-interp.sc-unresolved{font-family:ui-monospace,monospace;font-size:.85em;
110|      color:color-mix(in srgb,currentColor 50%,transparent);
111|      background:color-mix(in srgb,currentColor 10%,transparent);border-radius:3px;
112|      padding:0 3px}
113|    .sc-host.sc-has-error{position:relative}
114|    .sc-logic-error{position:absolute;top:8px;left:8px;z-index:2147483647;max-width:60ch;
115|      padding:6px 10px;background:#b00020;color:#fff;font:12px/1.4 ui-monospace,monospace;
116|      border-radius:4px;white-space:pre-wrap;pointer-events:none}
117|    /* Mirrors PRINT_BASELINE_CSS in apps/web deck-stage-export.ts \u2014 keep both
118|       in sync until dc-runtime regains a build step. */
119|    @media print {
120|      @page { margin: 0.5cm; }
121|      figure, table { break-inside: avoid; }
122|      #dc-root, #dc-root > .sc-host { height: auto; }
123|      *, *::before, *::after {
124|        print-color-adjust: exact; -webkit-print-color-adjust: exact;
125|        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
126|        animation-delay: -99s !important; animation-duration: .001s !important;
127|        animation-iteration-count: 1 !important; animation-fill-mode: both !important;
128|        animation-play-state: running !important; transition-duration: 0s !important;
129|      }
130|    }
131|  `;
132|  var FULL_PAGE_CSS = "html,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}";
133|  function rootNameForDocument(doc, loc) {
134|    let bootPath = loc.pathname || "";
135|    if (!/\.dc\.html?$/i.test(safeDecode(bootPath))) {
136|      try {
137|        bootPath = new URL(doc.baseURI || "/").pathname;
138|      } catch {
139|      }
140|    }
141|    return dcNameFromPath(bootPath);
142|  }
143|  function safeDecode(s) {
144|    try {
145|      return decodeURIComponent(s);
146|    } catch {
147|      return s;
148|    }
149|  }
150|  function boot(runtime, doc = document) {
151|    const parsed = parseDcDocument(doc);
152|    if (!parsed) return null;
153|    const React = getReact();
154|    const rootName = rootNameForDocument(doc, location);
155|    runtime.markFetched(rootName);
156|    runtime.setRootName(rootName);
157|    runtime.adoptParsed(rootName, parsed);
158|    fetch(location.href).then((res) => res.ok ? res.text() : "").then((t) => {
159|      const raw = t ? parseDcText(t) : null;
160|      if (raw?.template) runtime.updateHtml(rootName, raw.template);
161|    }).catch(() => {
162|    });
163|    const dc = doc.querySelector("x-dc");
164|    const hostEl = doc.createElement("div");
165|    hostEl.id = "dc-root";
166|    dc.replaceWith(hostEl);
167|    if (!parsed.preview) {
168|      const s = doc.createElement("style");
169|      s.textContent = FULL_PAGE_CSS;
170|      doc.head.appendChild(s);
171|    }
172|    const Root = runtime.getDC(rootName);
173|    const entry = runtime.registry.get(rootName);
174|    function StandaloneRoot() {
175|      const [, setTick] = React.useState(0);
176|      React.useEffect(() => {
177|        const sub = () => setTick((n) => n + 1);
178|        entry.subs.add(sub);
179|        return () => {
180|          entry.subs.delete(sub);
181|        };
182|      }, []);
183|      const defaults = React.useMemo(() => {
184|        const d = {};
185|        for (const k in entry.propsMeta || {}) {
186|          const v = entry.propsMeta?.[k]?.default;
187|          if (v !== void 0) d[k] = v;
188|        }
189|        return d;
190|      }, [entry.propsMeta]);
191|      return h(Root, { ...defaults, ...entry.propOverrides || {} });
192|    }
193|    const ReactDOM = getReactDOM();
194|    if (ReactDOM.createRoot)
195|      ReactDOM.createRoot(hostEl).render(h(StandaloneRoot));
196|    else ReactDOM.render(h(StandaloneRoot), hostEl);
197|    return rootName;
198|  }
199|
200|  // src/expr.ts
201|  var IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
202|  var NUMBER_RE = /^-?\d+(\.\d+)?$/;
203|  function resolve(vals, src) {
204|    const expr = String(src).trim();
205|    if (!expr) return void 0;
206|    if (expr[0] === "(" && expr[expr.length - 1] === ")" && parensWrapWhole(expr)) {
207|      return resolve(vals, expr.slice(1, -1));
208|    }
209|    const eq = findTopLevelEquality(expr);
210|    if (eq) {
211|      const lv = resolve(vals, expr.slice(0, eq.index));
212|      const rv = resolve(vals, expr.slice(eq.index + eq.op.length));
213|      switch (eq.op) {
214|        case "===":
215|          return lv === rv;
216|        case "!==":
217|          return lv !== rv;
218|        case "==":
219|          return lv == rv;
220|        default:
221|          return lv != rv;
222|      }
223|    }
224|    if (expr[0] === "!") return !resolve(vals, expr.slice(1));
225|    if (expr === "true") return true;
226|    if (expr === "false") return false;
227|    if (expr === "null") return null;
228|    if (expr === "undefined") return void 0;
229|    if (NUMBER_RE.test(expr)) return Number(expr);
230|    if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) {
231|      return expr.slice(1, -1);
232|    }
233|    return resolvePath(vals, expr);
234|  }
235|  function parensWrapWhole(expr) {
236|    let depth = 0;
237|    for (let i = 0; i < expr.length - 1; i++) {
238|      if (expr[i] === "(") depth++;
239|      else if (expr[i] === ")") {
240|        depth--;
241|        if (depth === 0) return false;
242|      }
243|    }
244|    return true;
245|  }
246|  function findTopLevelEquality(expr) {
247|    let depth = 0;
248|    for (let i = 0; i < expr.length; i++) {
249|      const c = expr[i];
250|      if (c === "[" || c === "(") depth++;
251|      else if (c === "]" || c === ")") depth--;
252|      else if (depth === 0 && (c === "=" || c === "!") && expr[i + 1] === "=") {
253|        if (i > 0 && (expr[i - 1] === "=" || expr[i - 1] === "!")) continue;
254|        if (!expr.slice(0, i).trim()) continue;
255|        const op = expr[i + 2] === "=" ? c + "==" : c + "=";
256|        return { index: i, op };
257|      }
258|    }
259|    return null;
260|  }
261|  function resolvePath(vals, expr) {
262|    const head = expr.match(IDENT_RE);
263|    if (!head) return void 0;
264|    let cur = vals == null ? void 0 : vals[head[0]];
265|    let i = head[0].length;
266|    while (i < expr.length) {
267|      if (expr[i] === ".") {
268|        const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/);
269|        if (!m) return void 0;
270|        cur = cur == null ? void 0 : cur[m[0]];
271|        i += 1 + m[0].length;
272|      } else if (expr[i] === "[") {
273|        let depth = 1;
274|        let j = i + 1;
275|        while (j < expr.length && depth > 0) {
276|          if (expr[j] === "[") depth++;
277|          else if (expr[j] === "]") {
278|            depth--;
279|            if (depth === 0) break;
280|          }
281|          j++;
282|        }
283|        if (depth !== 0) return void 0;
284|        const key = resolve(vals, expr.slice(i + 1, j));
285|        cur = cur == null ? void 0 : cur[key];
286|        i = j + 1;
287|      } else {
288|        return void 0;
289|      }
290|    }
291|    return cur;
292|  }
293|
294|  // src/encode.ts
295|  var CAMEL_ATTR = "sc-camel-";
296|  var INLINE_TEXT_TAGS = new Set(
297|    "a abbr b bdi bdo br cite code del dfn em i ins kbd mark q s samp small span strike strong sub sup u var wbr".split(
298|      " "
299|    )
300|  );
301|  var RAW_WRAP = {
302|    select: "sc-raw-select",
303|    table: "sc-raw-table",
304|    tbody: "sc-raw-tbody",
305|    thead: "sc-raw-thead",
306|    tfoot: "sc-raw-tfoot",
307|    tr: "sc-raw-tr",
308|    td: "sc-raw-td",
309|    th: "sc-raw-th",
310|    caption: "sc-raw-caption"
311|  };
312|  var RAW_UNWRAP = Object.fromEntries(
313|    Object.entries(RAW_WRAP).map(([k, v]) => [v, k])
314|  );
315|  var EVENT_MAP = {
316|    onclick: "onClick",
317|    onchange: "onChange",
318|    oninput: "onInput",
319|    onsubmit: "onSubmit",
320|    onkeydown: "onKeyDown",
321|    onkeyup: "onKeyUp",
322|    onkeypress: "onKeyPress",
323|    onmousedown: "onMouseDown",
324|    onmouseup: "onMouseUp",
325|    onmouseenter: "onMouseEnter",
326|    onmouseleave: "onMouseLeave",
327|    onfocus: "onFocus",
328|    onblur: "onBlur",
329|    ondoubleclick: "onDoubleClick",
330|    oncontextmenu: "onContextMenu"
331|  };
332|  var ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
333|  var IMPORT_SELF_CLOSE_RE = new RegExp(
334|    "<(x-import|dc-import)(" + ATTRS + ")/>",
335|    "gi"
336|  );
337|  var CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
338|  function encodeCase(html) {
339|    html = html.replace(
340|      IMPORT_SELF_CLOSE_RE,
341|      (_, t, a) => "<" + t + a + "></" + t + ">"
342|    );
343|    html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1");
344|    html = html.replace(/<\/helmet\s*>/gi, "</sc-helmet>");
345|    html = html.replace(
346|      CAMEL_ATTR_RE,
347|      (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + eq
348|    );
349|    for (const [real, alias] of Object.entries(RAW_WRAP)) {
350|      html = html.replace(
351|        new RegExp("(</?)" + real + "(?=[\\s>])", "gi"),
352|        "$1" + alias
353|      );
354|    }
355|    return html;
356|  }
357|  function kebabToCamel(s) {
358|    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
359|  }
360|  function cssToObj(css) {
361|    const o = {};
362|    for (const decl of css.split(";")) {
363|      const i = decl.indexOf(":");
364|      if (i < 0) continue;
365|      const prop = decl.slice(0, i).trim();
366|      o[prop.startsWith("--") ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
367|    }
368|    return o;
369|  }
370|  function compileAttr(raw) {
371|    const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
372|    if (whole) {
373|      const path = whole[1];
374|      return (vals) => resolve(vals, path);
375|    }
376|    if (raw.includes("{{")) {
377|      const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
378|      return (vals) => parts.map((s, i) => i & 1 ? resolve(vals, s) ?? "" : s).join("");
379|    }
380|    return () => raw;
381|  }
382|
383|  // src/compile.ts
384|  function collectProps(node, kind, host) {
385|    const propGetters = [];
386|    const pseudoClasses = [];
387|    let hintSize = null;
388|    for (const { name, value } of [...node.attributes]) {
389|      if (name === "sc-name" || name === "data-dc-tpl") continue;
390|      let key = name;
391|      if (key.startsWith(CAMEL_ATTR))
392|        key = kebabToCamel(key.slice(CAMEL_ATTR.length));
393|      if (key === "hint-size") {
394|        hintSize = value;
395|        continue;
396|      }
397|      if (key.startsWith("style-")) {
398|        pseudoClasses.push(host.pseudoClass(key.slice(6), value));
399|        continue;
400|      }
401|      if (kind !== "dom") {
402|        if (key.includes("-") && !(kind === "x-import" && (key.startsWith("aria-") || key.startsWith("data-"))))
403|          key = kebabToCamel(key);
404|      } else {
405|        if (key === "class") key = "className";
406|        else if (key === "for") key = "htmlFor";
407|        else if (key.startsWith("on"))
408|          key = EVENT_MAP[key] || "on" + key[2].toUpperCase() + key.slice(3);
409|      }
410|      propGetters.push([key, compileAttr(value)]);
411|    }
412|    return { propGetters, pseudoClasses, hintSize };
413|  }
414|  var HOST_STYLE_PROPS = /* @__PURE__ */ new Set([
415|    "position",
416|    "left",
417|    "right",
418|    "top",
419|    "bottom",
420|    "inset",
421|    "width",
422|    "height",
423|    "z-index",
424|    "transform"
425|  ]);
426|  function hostPositionStyle(style) {
427|    const all = typeof style === "string" ? cssToObj(style) : style != null && typeof style === "object" ? style : null;
428|    if (!all) return void 0;
429|    const out = {};
430|    for (const [k, v] of Object.entries(all)) {
431|      const kebab = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
432|      if (HOST_STYLE_PROPS.has(kebab)) out[k] = v;
433|    }
434|    return Object.keys(out).length ? out : void 0;
435|  }
436|  function compileTemplate(html, host) {
437|    const tpl = document.createElement("template");
438|    //! nosemgrep: direct-inner-html-assignment
439|    tpl.innerHTML = encodeCase(html);
440|    let tplN = 0;
441|    (function stamp(node) {
442|      if (node.nodeType === Node.ELEMENT_NODE) {
443|        node.setAttribute("data-dc-tpl", String(tplN++));
444|      }
445|      for (const c of node.childNodes) stamp(c);
446|    })(tpl.content);
447|    const builders = walkChildren(tpl.content, host);
448|    const render = ((vals, ctx) => builders.map((b, i) => b(vals || {}, ctx, i)));
449|    render.__annotated = tpl.innerHTML;
450|    return render;
451|  }
452|  function walkChildren(node, host) {
453|    return [...node.childNodes].map((c) => walk(c, host)).filter((b) => b != null);
454|  }
455|  function walk(node, host) {
456|    if (node.nodeType === Node.TEXT_NODE) return walkText(node);
457|    if (node.nodeType !== Node.ELEMENT_NODE) return null;
458|    const el = node;
459|    const tag = el.tagName.toLowerCase();
460|    if (tag === "sc-for") return walkFor(el, host);
461|    if (tag === "sc-if") return walkIf(el, host);
462|    if (tag === "x-import") return walkXImport(el, host);
463|    if (tag === "sc-helmet") return host.helmet(el);
464|    if (tag === "dc-import") return walkComponent(el, host);
465|    return walkElement(el, host);
466|  }
467|  var warnedHoles = /* @__PURE__ */ new Set();
468|  function warnUnresolved(ctx, what) {
469|    const key = (ctx?.__name || "?") + "\0" + what;
470|    if (warnedHoles.has(key)) return;
471|    warnedHoles.add(key);
472|    console.warn("[dc-runtime] " + (ctx?.__name || "template") + ": " + what);
473|  }
474|  function walkText(node) {
475|    const txt = node.nodeValue ?? "";
476|    if (!txt.includes("{{")) {
477|      if (!txt.trim() && !txt.includes(" ")) return null;
478|      return () => txt;
479|    }
480|    const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
481|    return (vals, ctx, key) => h(
482|      getReact().Fragment,
483|      { key },
484|      ...parts.map((p, i) => {
485|        if (!(i & 1)) return p;
486|        const v = resolve(vals, p);
487|        if (v === void 0) {
488|          if (!ctx?.__streamingNow) {
489|            if (document.body?.hasAttribute("data-dc-editor-on")) {
490|              return h(
491|                "span",
492|                { key: i, className: "sc-interp sc-unresolved" },
493|                "{{ " + p.trim() + " }}"
494|              );
495|            }
496|            warnUnresolved(
497|              ctx,
498|              "{{ " + p.trim() + " }} never resolved \u2014 rendered as empty"
499|            );
500|            return null;
501|