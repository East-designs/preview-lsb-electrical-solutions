1|// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
2|/* BEGIN USAGE */
3|/**
4| * <image-slot> — user-fillable image placeholder.
5| *
6| * Drop this into a deck, mockup, or page wherever a design needs an image.
7| * You control the slot's shape; it sizes to its container by default. When the search_stock_photos tool
8| * is available, prefill the slot by default — write the photo's URL into
9| * src (with credit/credit-href); the user can still fill or replace it
10| * by dragging an image file onto it (or clicking to browse). The dropped
11| * image persists across reloads via a .image-slots.state.json sidecar —
12| * same read-via-fetch / write-via-window.omelette pattern as
13| * design_canvas.jsx, so the filled slot shows on share links, downloaded
14| * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
15| *
16| * The host bridge only allows sidecar writes at the project root, so the
17| * HTML that uses this component is assumed to live at the project root too
18| * (same constraint as design_canvas.jsx).
19| *
20| * Attributes:
21| *   id           Persistence key. REQUIRED for the drop to survive reload —
22| *                every slot on the page needs a distinct id.
23| *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
24| *                'circle' applies 50% border-radius; on a non-square slot
25| *                that's an ellipse — set equal width and height for a true
26| *                circle.
27| *   radius       Corner radius in px for 'rounded'.       (default 12)
28| *   mask         Any CSS clip-path value. Overrides `shape` — use this for
29| *                hexagons, blobs, arbitrary polygons.
30| *   fit          Initial framing baseline: cover | contain.   (default 'cover')
31| *                cover starts the image filling the frame (overflow cropped);
32| *                contain starts it fully visible (letterboxed). Either way the
33| *                user can always pan/scale from there — double-click, or the
34| *                Edit control, enters reframe mode (drag to move, scroll or
35| *                corner-handles to scale; Escape / click-out commits). The
36| *                crop persists alongside the image in the sidecar.
37| *   placeholder  Empty-state caption.                      (default 'Drop an image')
38| *   src          Optional initial/fallback image URL. Prefill it with a real
39| *                photo via search_stock_photos when that tool is available
40| *                (set credit/credit-href from the result). A user drop
41| *                overrides it; clearing the drop reveals src again.
42| *   credit       Attribution text shown as a small overlay at the
43| *                bottom-left of the filled slot. REQUIRED whenever src
44| *                points at any Unsplash host (images.unsplash.com,
45| *                plus.unsplash.com, …): an Unsplash src with no credit
46| *                renders an error tile INSTEAD of the photo (Unsplash
47| *                terms forbid showing their photos unattributed). Use the
48| *                exact form 'Photo by {photographer name} on Unsplash' —
49| *                the overlay then links the name to credit-href and
50| *                'Unsplash' to the Unsplash homepage, and links back to
51| *                unsplash.com automatically get the required utm referral
52| *                params appended at render time. The credit belongs to
53| *                the src image, so it only shows while src is what's
54| *                displayed — a user-dropped image hides it.
55| *   credit-href  Link for the photographer's name in the credit overlay
56| *                (their Unsplash profile URL from the stock-photo search
57| *                results). http(s) URLs only — anything else renders the
58| *                name as plain text.
59| *
60| * Sizing: the slot fills its container by default (width/height 100%).
61| * Put it in a sized wrapper — absolutely positioned, a grid cell, a fixed
62| * frame — and it takes exactly that box. When the parent's height is
63| * indefinite (ordinary flow), it falls back to full width at a 3:2 aspect
64| * ratio instead of collapsing. In a shrink-to-fit parent (a float,
65| * width:max-content, an unsized absolute wrapper), percentages have
66| * nothing to resolve against — size the slot or its wrapper explicitly
67| * there. For a fixed-size slot, set
68| * width/height on the element itself (inline style), which overrides the
69| * default. When
70| * layering content above a slot (full-bleed layouts), make the overlay
71| * click-through — pointer-events: none on scrims/text plates, re-enabled
72| * on interactive children — so the slot's hover controls stay reachable.
73| * Keep the slot's bottom-left corner visually clear as well: the credit
74| * overlay renders there, and a dark fade or text plate covering it hides
75| * the attribution Unsplash's terms require — end the fade above that
76| * corner, or keep it nearly transparent where the credit sits.
77| *
78| * Usage:
79| *   <div style="position:relative;width:100%;height:100%">      <!-- full-bleed: -->
80| *     <image-slot id="bg" shape="rect"></image-slot>            <!-- fills the wrapper -->
81| *   </div>
82| *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
83| *               placeholder="Drop a hero image"></image-slot>
84| *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
85| *   <image-slot id="kite"   style="width:300px;height:300px"
86| *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
87| */
88|/* END USAGE */
89|
90|(() => {
91|  const STATE_FILE = '.image-slots.state.json';
92|
93|  // Unsplash terms require visible attribution wherever their photos
94|  // display, and every link back to unsplash.com must carry utm referral
95|  // params. Two render-time rules enforce that here:
96|  //  - an Unsplash-src slot with NO credit attribute renders an error
97|  //    tile INSTEAD of the photo (an uncredited Unsplash photo on screen
98|  //    is itself the terms violation, so it never renders bare);
99|  //  - rendered credit links pointing at unsplash.com get the referral
100|  //    params appended when absent (credit-href values live in page
101|  //    content that can't be edited after the fact).
102|  // Keep the utm_source value in sync with UTM_SOURCE in
103|  // platform/web-agent/unsplash.ts — this file is a project-local
104|  // artifact and cannot import it (equality is pinned by tests).
105|  const UNSPLASH_HOMEPAGE_HREF =
106|    'https://unsplash.com/?utm_source=claude_design&utm_medium=referral';
107|  // Host rule mirrors the hotlink validator that admits Unsplash srcs into
108|  // pages in the first place (cdn$ in unsplash.ts: apex or any subdomain)
109|  // — Unsplash+ results serve from plus.unsplash.com, not just images.*,
110|  // and an admitted-but-uncredited photo must error whatever unsplash
111|  // host it rides on.
112|  // Trailing-dot FQDNs (images.unsplash.com.) are the same host to the
113|  // browser but would miss the regex — strip one dot so the check fails
114|  // CLOSED (unrecognized-but-real Unsplash srcs must error, not render).
115|  const isUnsplashHost = (u) => {
116|    try {
117|      return /(^|\.)unsplash\.com$/.test(
118|        new URL(u, document.baseURI).hostname.replace(/\.$/, '')
119|      );
120|    } catch {
121|      return false;
122|    }
123|  };
124|  // Render-time referral normalization for links back to Unsplash:
125|  // appends utm_source/utm_medium when absent, preserves every existing
126|  // query param, never overwrites an existing utm_source, and passes
127|  // non-Unsplash URLs through untouched. Input is an ABSOLUTE validated
128|  // http(s) URL (the credit render funnel resolves + validates first).
129|  const withReferral = (href) => {
130|    try {
131|      const u = new URL(href);
132|      if (!/(^|\.)unsplash\.com$/.test(u.hostname.replace(/\.$/, ''))) {
133|        return href;
134|      }
135|      if (!u.searchParams.has('utm_source')) {
136|        u.searchParams.set('utm_source', 'claude_design');
137|      }
138|      if (!u.searchParams.has('utm_medium')) {
139|        u.searchParams.set('utm_medium', 'referral');
140|      }
141|      return u.toString();
142|    } catch (e) {
143|      return href;
144|    }
145|  };
146|  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
147|  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
148|  const MAX_DIM = 1200;
149|  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
150|  // on SVG blobs is inconsistent). GIF is excluded because the canvas
151|  // re-encode keeps only the first frame, so an animated GIF would silently
152|  // go still — better to reject than surprise.
153|  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
154|
155|  // ── Shared sidecar store ────────────────────────────────────────────────
156|  // One fetch + immediate write-on-change for every <image-slot> on the
157|  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
158|  // are served together; writes go through window.omelette.writeFile, which
159|  // the host allowlists to *.state.json basenames only.
160|  const subs = new Set();
161|  let slots = {};
162|  // ids explicitly cleared before the sidecar fetch resolved — otherwise
163|  // the merge below can't tell "never set" from "just deleted" and would
164|  // resurrect the sidecar's stale value.
165|  const tombstones = new Set();
166|  let loaded = false;
167|  let loadP = null;
168|
169|  function load() {
170|    if (loadP) return loadP;
171|    loadP = fetch(STATE_FILE)
172|      .then((r) => (r.ok ? r.json() : null))
173|      .then((j) => {
174|        // Merge: sidecar loses to any in-memory change that raced ahead of
175|        // the fetch (drop or clear) so neither is clobbered by hydration.
176|        if (j && typeof j === 'object') {
177|          const merged = Object.assign({}, j, slots);
178|          // A framing-only write that raced ahead of hydration must not
179|          // drop a user image that's only on disk — inherit u from the
180|          // sidecar for any in-memory entry that lacks one.
181|          for (const k in slots) {
182|            if (merged[k] && !merged[k].u && j[k]) {
183|              merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
184|            }
185|          }
186|          for (const id of tombstones) delete merged[id];
187|          slots = merged;
188|        }
189|        tombstones.clear();
190|      })
191|      .catch(() => {})
192|      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
193|    return loadP;
194|  }
195|
196|  // Serialize writes so two near-simultaneous drops on different slots
197|  // can't reorder at the backend and leave the sidecar with only the
198|  // first. A save requested mid-flight just marks dirty and re-fires on
199|  // completion with the then-current slots.
200|  let saving = false;
201|  let saveDirty = false;
202|  // Unload-time flush: save()'s serialization defers a mid-RTT re-fire to a
203|  // .then that never runs in an unloading document, silently dropping a
204|  // pagehide commit. Post the current slots immediately instead — content
205|  // is a superset snapshot of any in-flight save's, the write is a
206|  // whole-file last-writer-wins replace, and postMessage FIFO delivers it
207|  // to the host after the in-flight one, so a backend-side reorder at
208|  // worst reproduces the dropped-commit outcome this flush improves on.
209|  // Guarded on the initial sidecar read: pre-hydration slots can miss
210|  // other slots' persisted entries, and flushing it would clobber them —
211|  // that narrow case stays best-effort (the in-memory merge in load()
212|  // cannot happen in an unloading document anyway).
213|  function flushNow() {
214|    if (!loaded) return;
215|    const w = window.omelette && window.omelette.writeFile;
216|    if (!w) return;
217|    try { Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}); } catch (e) {}
218|  }
219|  function save() {
220|    if (saving) { saveDirty = true; return; }
221|    const w = window.omelette && window.omelette.writeFile;
222|    if (!w) return;
223|    saving = true;
224|    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
225|      .catch(() => {})
226|      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
227|  }
228|
229|  const S_MAX = 5;
230|  const clampS = (s) => Math.max(1, Math.min(S_MAX, s));
231|
232|  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
233|  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
234|  function getSlot(id) {
235|    const v = slots[id];
236|    if (!v) return null;
237|    return typeof v === 'string' ? { u: v, s: 1, x: 0, y: 0 } : v;
238|  }
239|
240|  function setSlot(id, val) {
241|    if (!id) return;
242|    if (val) { slots[id] = val; tombstones.delete(id); }
243|    else { delete slots[id]; if (!loaded) tombstones.add(id); }
244|    subs.forEach((fn) => fn());
245|    // A drop is rare + high-value — write immediately so nav-away can't lose
246|    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
247|    // merged yet; the merge in load() keeps this change once the read lands.
248|    if (loaded) save(); else load().then(save);
249|  }
250|
251|  // ── Image downscale ─────────────────────────────────────────────────────
252|  // Encode through a canvas so the sidecar carries resized bytes, not the
253|  // raw upload. Longest side is capped at 2× the slot's rendered width
254|  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
255|  // for photos, so there's no need for per-image format picking.
256|  async function toDataUrl(file, targetW) {
257|    const bitmap = await createImageBitmap(file);
258|    try {
259|      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
260|      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
261|      const w = Math.max(1, Math.round(bitmap.width * scale));
262|      const h = Math.max(1, Math.round(bitmap.height * scale));
263|      const canvas = document.createElement('canvas');
264|      canvas.width = w; canvas.height = h;
265|      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
266|      return canvas.toDataURL('image/webp', 0.85);
267|    } finally {
268|      bitmap.close && bitmap.close();
269|    }
270|  }
271|
272|  // ── Custom element ──────────────────────────────────────────────────────
273|  const stylesheet =
274|    // Fill the container by default: slots are usually placed inside a
275|    // sized wrapper (a hero frame, a grid cell, an inset:0 layer) and are
276|    // expected to take that box — a fixed intrinsic size would render as
277|    // a small tile in the corner of a full-bleed wrapper instead.
278|    // aspect-ratio is the companion fallback that keeps a bare slot
279|    // visible when the parent's height is indefinite: height:100%
280|    // resolves to auto there, and the ratio then derives height from
281|    // width instead of letting the slot collapse to zero height.
282|    // Explicit width/height on the element override all of this.
283|    ':host{display:block;position:relative;' +
284|    '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);' +
285|    '  width:100%;height:100%;aspect-ratio:3/2}' +
286|    '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
287|    // .frame img (clipped) and .spill (unclipped ghost + handles) share the
288|    // same left/top/width/height in frame-%, computed by _applyView(), so the
289|    // inside-mask crop and the outside-mask spill stay pixel-aligned.
290|    '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' +
291|    '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
292|    // Reframe mode (double-click): the full image spills past the mask. The
293|    // spill layer is sized to the IMAGE bounds so its corners are where the
294|    // resize handles belong. The ghost <img> inside is translucent; the real
295|    // clipped <img> underneath shows the opaque in-mask crop.
296|    // popover=manual promotes the spill to the top layer on reframe, so it is
297|    // not clipped by any overflow:hidden / clip-path / scroll-container
298|    // ancestor (a plain z-index can't escape overflow clipping). UA popover
299|    // defaults (inset:0;margin:auto) are reset; _applyView sets viewport px.
300|    '.spill{position:fixed;margin:0;inset:auto;border:0;padding:0;background:transparent;' +
301|    '  overflow:visible;transform:translate(-50%,-50%);z-index:1;cursor:grab;touch-action:none}' +
302|    ':host([data-panning]) .spill{cursor:grabbing}' +
303|    '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' +
304|    '  pointer-events:none;-webkit-user-drag:none;user-select:none;' +
305|    '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' +
306|    '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' +
307|    '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' +
308|    '  transform:translate(-50%,-50%)}' +
309|    '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' +
310|    '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' +
311|    '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' +
312|    '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' +
313|    ':host([data-reframe]){z-index:10}' +
314|    ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' +
315|    '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
316|    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
317|    '  cursor:pointer;user-select:none}' +
318|    '.empty svg{opacity:.45}' +
319|    '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' +
320|    '.empty .sub{font-size:11px}' +
321|    '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' +
322|    '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' +
323|    ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' +
324|    '  background:rgba(201,100,66,.10)}' +
325|    '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' +
326|    '  transition:border-color .12s}' +
327|    ':host([data-over]) .ring{border-color:#c96442}' +
328|    ':host([data-filled]) .ring{display:none}' +
329|    // Controls overlay INSIDE the frame, pinned to the top-right corner, so
330|    // a full-bleed slot in an overflow:hidden container still shows them
331|    // (the old below-mask placement got clipped). Credit sits bottom-left,
332|    // so top-right avoids collision. The blurred pill background keeps them
333|    // legible over the image.
334|    // The UA [popover] base rule styles the element in EVERY state (only
335|    // display:none is gated on :not(:popover-open), and the display:flex
336|    // below overrides that) — so the UA resets live HERE, like .spill's,
337|    // or the ordinary hover-state strip renders as a bordered Canvas box
338|    // centered by margin:auto. inset:auto precedes top/right (shorthand).
339|    '.ctl{position:absolute;inset:auto;top:8px;right:8px;margin:0;border:0;padding:0;' +
340|    '  background:transparent;overflow:visible;' +
341|    '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' +
342|    '  white-space:nowrap}' +
343|    // While reframing, the spill owns the top layer and would swallow every
344|    // click on the in-frame controls. Promoting .ctl into the top layer
345|    // ABOVE the spill (shown after it — later popovers stack higher) keeps
346|    // Edit-as-toggle and Replace clickable mid-reframe. _applyView pins it
347|    // to the frame's top-right in viewport px (translateX(-100%)
348|    // right-aligns against the computed left edge); inset:auto clears the
349|    // base rule's top/right so the inline left/top position it alone.
350|    '.ctl:popover-open{position:fixed;inset:auto;transform:translateX(-100%)}' +
351|    ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' +
352|    '  {opacity:1;pointer-events:auto}' +
353|    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' +
354|    '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' +
355|    '  backdrop-filter:blur(6px)}' +
356|    '.ctl button:hover{background:rgba(0,0,0,.8)}' +
357|    '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' +
358|    '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' +
359|    '.credit{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);display:none;' +
360|    '  padding:3px 7px;border-radius:5px;background:rgba(0,0,0,.55);color:#fff;' +
361|    '  font:10px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;' +
362|    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}' +
363|    // The credit is a SPAN holding one or two <a>s (Unsplash's prescribed
364|    // form links the photographer AND Unsplash) — anchors style inline so
365|    // the overlay reads as one line of text.
366|    '.credit a{color:inherit;text-decoration:none}' +
367|    '.credit a:hover,.credit a:focus-visible{text-decoration:underline}' +
368|    ':host([data-filled][data-credit]) .credit{display:block}' +
369|    // Exports must ship JUST the image — no hover controls, no credit chip
370|    // (the host marks <html data-om-exporting> for the capture window; the
371|    // page-level hide script can't reach shadow DOM, this rule can).
372|    ':host-context([data-om-exporting]) .ctl,' +
373|    ':host-context([data-om-exporting]) .credit{display:none !important}' +
374|    // Attribution error tile: REPLACES the photo when an Unsplash src has
375|    // no credit attribute — rendering the photo uncredited is the terms
376|    // violation, so the photo must not appear at all.
377|    // Calm and neutral on purpose (review feedback): the tile informs the
378|    // user; the fix instructions are machine-facing (usage docblock, tool
379|    // description, and the turn-end scan's bounce copy name the attributes
380|    // for the agent).
381|    '.attr-error{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' +
382|    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
383|    '  background:#f2f1ef;color:#6e6c66;user-select:none;' +
384|    '  font:13px/1.45 system-ui,-apple-system,sans-serif}' +
385|    '.attr-error svg{opacity:.55}' +
386|    '.attr-error .cap{max-width:92%;font-weight:500;letter-spacing:.01em}' +
387|    ':host([data-attribution-error]) .attr-error{display:flex}' +
388|    ':host([data-attribution-error]) .ring{display:none}';
389|
390|  const icon =
391|    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
392|    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
393|    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
394|    '<path d="m21 15-5-5L5 21"/></svg>';
395|
396|  const warnIcon =
397|    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
398|    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
399|    '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' +
400|    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
401|
402|  class ImageSlot extends HTMLElement {
403|    static get observedAttributes() {
404|      return ['shape', 'radius', 'mask', 'fit', 'placeholder', 'src', 'id', 'credit', 'credit-href'];
405|    }
406|
407|    /** Duplicate-slide hook (called by deck-stage, see its
408|     *  _remintDuplicateIds): copy this id's stored image, if any, under a
409|     *  freshly minted key and return that key — so a duplicated slide's
410|     *  slot keeps its dropped photo instead of reverting to the
411|     *  placeholder. 'isFree' is the caller's uniqueness check (document
412|     *  ids); candidates must ALSO be unused in the sidecar, which can
413|     *  hold keys from other pages sharing the project root. (An EMPTY
414|     *  slot on another page leaves no sidecar entry, so its id is not
415|     *  detectable here — a minted key can collide with it and that slot
416|     *  would show this photo. Same blast radius as two pages reusing an
417|     *  id by hand, which the shared sidecar already permits.) Returns null
418|     *  when no id could be minted (caller strips the id, today's
419|     *  behavior). */
420|    static cloneSlot(fromId, isFree) {
421|      if (typeof fromId !== 'string' || !fromId) return null;
422|      // Pre-hydration the store can't veto candidates or source the copy
423|      // — degrade to the strip (today's behavior) rather than mint
424|      // against keys we can't see yet. Any rendered (= droppable) slot
425|      // means load() has already settled.
426|      if (!loaded) return null;
427|      const stem = fromId.replace(/-\d+$/, '') || fromId;
428|      for (let n = 2; n < 100; n++) {
429|        const toId = stem + '-' + n;
430|        if (toId === fromId) continue;
431|        if (slots[toId] !== undefined) {
432|          // Reuse a key holding this exact value (bytes AND crop) if no
433|          // live element here owns it — a duplicate op the host refused
434|          // after minting leaves such a key behind, and reusing keeps
435|          // refused retries from accumulating one orphaned copy per
436|          // attempt. Full equality (not just bytes) so a byte-identical
437|          // key another PAGE owns with its own crop is stepped past, not
438|          // adopted or rewritten. (Entries without .u never match.)
439|          const prev = getSlot(toId);
440|          const cur = getSlot(fromId);
441|          if (!(prev && cur && prev.u && prev.u === cur.u &&
442|                prev.s === cur.s && prev.x === cur.x && prev.y === cur.y &&
443|                (typeof isFree !== 'function' || isFree(toId)))) continue;
444|          return toId;
445|        }
446|        if (typeof isFree === 'function' && !isFree(toId)) continue;
447|        const v = getSlot(fromId);
448|        if (v) setSlot(toId, Object.assign({}, v));
449|        return toId;
450|      }
451|      return null;
452|    }
453|
454|    constructor() {
455|      super();
456|      // clonable: rail thumbnails deep-clone slides and carry this shadow
457|      // along; reuse an already-cloned root so upgrade-after-clone works.
458|      // (Deliberately NOT serializable — a getHTML consumer would embed
459|      // multi-MB sidecar data-URLs into serialized page HTML.)
460|      const root = this.shadowRoot ||
461|        this.attachShadow({ mode: 'open', clonable: true });
462|      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
463|      // on the frame (circle, pill, rounded) can't clip them.
464|      root.innerHTML =
465|        '<style>' + stylesheet + '</style>' +
466|        '<div class="frame" part="frame">' +
467|        '  <img part="image" alt="" draggable="false" style="display:none">' +
468|        '  <div class="empty" part="empty">' + icon +
469|        '    <div class="cap"></div>' +
470|        '    <div class="sub">or <u>browse files</u></div></div>' +
471|        '  <div class="attr-error" part="attribution-error">' + warnIcon +
472|        '    <div class="cap">This photo needs attribution</div></div>' +
473|        '  <div class="ring" part="ring"></div>' +
474|        '</div>' +
475|        // Outside .frame, like .spill/.ctl — the frame's overflow:hidden +
476|        // border-radius/clip-path would cut the credit off on circle/pill/mask.
477|        // A SPAN, not an <a>: the prescribed Unsplash credit holds two links
478|        // (photographer + Unsplash), built per-render in _render().
479|        '<span class="credit" part="credit"></span>' +
480|        '<div class="spill" popover="manual" data-dc-edit-transparent>' +
481|        '  <img class="ghost" alt="" draggable="false">' +
482|        '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' +
483|        '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' +
484|        '</div>' +
485|        // data-dc-edit-transparent: the DC editor's edit-mode picker lets
486|        // clicks through for chrome marked with it (EDIT_TRANSPARENT_SEL)
487|        // — without it, Replace/Edit clicks in Edit mode are swallowed by
488|        // element selection and the controls look dead.
489|        '<div class="ctl" popover="manual" data-dc-edit-transparent><button data-act="replace" title="Replace image">Replace</button>' +
490|        '  <button data-act="edit" title="Reframe image">Edit</button></div>' +
491|        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
492|      this._frame = root.querySelector('.frame');
493|      this._ring = root.querySelector('.ring');
494|      this._img = root.querySelector('.frame img');
495|      this._empty = root.querySelector('.empty');
496|      this._cap = root.querySelector('.cap');
497|      this._sub = root.querySelector('.sub');
498|      this._spill = root.querySelector('.spill');
499|      this._ctl = root.querySelector('.ctl');
500|      this._credit = root.querySelector('.credit');
501|