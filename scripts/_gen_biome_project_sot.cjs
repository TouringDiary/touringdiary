/**
 * Generates full-project Biome SoT docs from a Biome JSON report.
 * Docs only — does not modify application source.
 *
 * Usage:
 *   node scripts/_gen_biome_project_sot.js [path-to-biome-json]
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INPUT =
  process.argv[2] ||
  path.join(process.env.TEMP || "/tmp", "biome-full-project.json");

function loadBiomeJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("Invalid Biome JSON");
  return JSON.parse(raw.slice(a, b + 1));
}

function norm(p) {
  let s = String(p || "").replace(/\\/g, "/");
  const i = s.toLowerCase().indexOf("/touringdiary/");
  if (i >= 0) s = s.slice(i + "/touringdiary/".length);
  if (s.startsWith("./")) s = s.slice(2);
  return s;
}

/** Safety-of-fix classification (baseline project SoT). */
const CLASS = {
  format: {
    L: "A",
    why: "Formattazione Biome puramente meccanica; zero semantica.",
    strategy: "`npx biome check --write` (solo format) o format per file.",
  },
  "assist/source/organizeImports": {
    L: "A",
    why: "Riordino import meccanico senza cambio binding.",
    strategy: "Assist organizeImports / biome check --write con assist.",
  },
  "lint/style/useImportType": {
    L: "A",
    why: "Conversione import type-only; comportamento runtime invariato.",
    strategy: "Safe autofix Biome useImportType.",
  },
  "lint/style/useConst": {
    L: "A",
    why: "let→const su binding non riassegnati; meccanico.",
    strategy: "Safe autofix useConst.",
  },
  "lint/correctness/useParseIntRadix": {
    L: "A",
    why: "Aggiunta radix 10 esplicita; semantica invariata per decimali.",
    strategy: "Aggiungere secondo argomento 10.",
  },
  "lint/style/useNodejsImportProtocol": {
    L: "A",
    why: "Prefisso node: su built-in; risoluzione invariata.",
    strategy: "Safe autofix useNodejsImportProtocol.",
  },
  "lint/complexity/useLiteralKeys": {
    L: "A",
    why: "Bracket→dot su chiavi letterali valide; meccanico.",
    strategy: "Safe autofix useLiteralKeys.",
  },
  "lint/style/useTemplate": {
    L: "A",
    why: "Concatenazione→template string equivalente.",
    strategy: "Safe autofix useTemplate.",
  },
  "lint/style/useExponentiationOperator": {
    L: "A",
    why: "Math.pow→**; equivalente.",
    strategy: "Safe autofix useExponentiationOperator.",
  },
  "lint/complexity/noUselessEscapeInRegex": {
    L: "A",
    why: "Rimozione escape inutili in regex.",
    strategy: "Safe autofix noUselessEscapeInRegex.",
  },
  "lint/complexity/noUselessUndefinedInitialization": {
    L: "A",
    why: "Rimozione =undefined ridondante.",
    strategy: "Safe autofix noUselessUndefinedInitialization.",
  },
  "lint/complexity/noUselessSwitchCase": {
    L: "A",
    why: "Case ridondanti/fallthrough inutili rimovibili meccanicamente.",
    strategy: "Safe autofix / rimozione case inutili.",
  },
  "lint/complexity/noUselessFragments": {
    L: "A",
    why: "Fragment inutili rimovibili senza cambio DOM.",
    strategy: "Safe autofix noUselessFragments.",
  },
  "lint/complexity/noUselessTernary": {
    L: "A",
    why: "Ternari riducibili a espressione equivalente.",
    strategy: "Safe autofix noUselessTernary.",
  },
  "lint/complexity/noUselessLoneBlockStatements": {
    L: "A",
    why: "Blocchi {} inutili rimovibili.",
    strategy: "Safe autofix noUselessLoneBlockStatements.",
  },
  "lint/suspicious/noUselessEscapeInString": {
    L: "A",
    why: "Escape stringa inutile.",
    strategy: "Rimuovere escape ridondante.",
  },
  "lint/suspicious/noEmptyInterface": {
    L: "A",
    why: "Interface vuota convertibile in type; nessun merging dichiarato nel singolo hit.",
    strategy: "Sostituire con type alias o rimuovere se dead.",
  },

  "lint/correctness/noUnusedImports": {
    L: "A/B",
    why: "Quasi sempre sicuro; verificare side-effect import e re-export intenzionali.",
    strategy: "Autofix + spot-check import con side effect.",
  },
  "lint/a11y/useButtonType": {
    L: "A/B",
    why: "type=button sicuro se c'e onClick/handler; senza handler puo mascherare bug submit. Verifica breve per bottone.",
    strategy: "Classificare form ancestry + onClick; applicare type solo dove azione esplicita.",
  },
  "lint/suspicious/noGlobalIsNan": {
    L: "A/B",
    why: "Number.isNaN dopo Number(); breve check sul tipo del valore.",
    strategy: "Sostituire isNaN(x) con Number.isNaN(Number(x)) dove appropriato.",
  },
  "lint/suspicious/noDoubleEquals": {
    L: "A/B",
    why: "==→=== con check coercizione intenzionale.",
    strategy: "=== salvo null-check intenzionali (== null).",
  },
  "lint/suspicious/noPrototypeBuiltins": {
    L: "A/B",
    why: "Object.hasOwn / Object.prototype.hasOwnProperty.call; breve verifica.",
    strategy: "Safe rewrite prototype builtins.",
  },
  "lint/correctness/noSwitchDeclarations": {
    L: "A/B",
    why: "Scope block attorno a case; meccanico ma va verificato TDZ/shadowing.",
    strategy: "Avvolgere case body in {}.",
  },
  "lint/style/noDescendingSpecificity": {
    L: "A/B",
    why: "CSS specificity; verificare cascade intenzionale.",
    strategy: "Riordinare selettori o alzare specificita in modo consapevole.",
  },

  "lint/correctness/noUnusedVariables": {
    L: "B",
    why: "Serve capire se binding e WIP, catch, o API contract; non auto-delete.",
    strategy: "Review per binding; rimuovere / usare / prefix _.",
  },
  "lint/correctness/noUnusedFunctionParameters": {
    L: "B",
    why: "Parametri possono essere parte di firma/callback; underscore o rimozione richiede review.",
    strategy: "Review firma; _prefix o rimozione se locale.",
  },
  "lint/complexity/useOptionalChain": {
    L: "B",
    why: "&&→?. puo cambiare short-circuit/falsy; serve lettura.",
    strategy: "Riscrivere solo dove equivalenza falsy e verificata.",
  },
  "lint/a11y/useKeyWithClickEvents": {
    L: "B",
    why: "A11y: aggiungere keyboard handler cambia UX; review funzionale.",
    strategy: "Aggiungere onKeyDown/role o usare controllo nativo.",
  },
  "lint/a11y/noStaticElementInteractions": {
    L: "B",
    why: "Role/button vs elemento semantico; scelta UI.",
    strategy: "button/nativo o role+keyboard coerenti.",
  },
  "lint/a11y/noLabelWithoutControl": {
    L: "B",
    why: "htmlFor/id o wrapping; review markup form.",
    strategy: "Associare label al controllo.",
  },
  "lint/a11y/noAutofocus": {
    L: "B",
    why: "autofocus puo essere intenzionale UX; review prodotto.",
    strategy: "Rimuovere o giustificare (poi eventuale Livello D case-by-case).",
  },
  "lint/a11y/useAriaPropsSupportedByRole": {
    L: "B",
    why: "Correzione ARIA richiede capire ruolo effettivo.",
    strategy: "Allineare role e aria-* o cambiare elemento.",
  },
  "lint/a11y/useSemanticElements": {
    L: "B",
    why: "role→elemento semantico puo alterare stile/CSS.",
    strategy: "Sostituire con elemento nativo e adattare CSS.",
  },
  "lint/a11y/noSvgWithoutTitle": {
    L: "B",
    why: "title/aria-label dipende da decorative vs informative.",
    strategy: "title/aria-hidden per decorative.",
  },
  "lint/a11y/noNoninteractiveElementToInteractiveRole": {
    L: "B",
    why: "Restruct markup; review a11y/UX.",
    strategy: "Elemento interattivo nativo o pattern corretto.",
  },
  "lint/a11y/useAltText": {
    L: "B",
    why: "alt content e prodotto/contenuto.",
    strategy: "alt significativo o alt vuoto se decorative.",
  },
  "lint/a11y/useFocusableInteractive": {
    L: "B",
    why: "tabIndex/focusability; review interazione.",
    strategy: "Rendere focusabile o usare controllo nativo.",
  },
  "lint/a11y/useValidAnchor": {
    L: "B",
    why: "href/button swap; review navigazione.",
    strategy: "a con href o button.",
  },
  "lint/suspicious/useIterableCallbackReturn": {
    L: "B",
    why: "forEach return vs for..of/map; rischio cambio flusso.",
    strategy: "for...of / map esplicito dopo lettura.",
  },
  "lint/suspicious/noShadowRestrictedNames": {
    L: "B",
    why: "Rename name/value/ecc. richiede aggiornare usi.",
    strategy: "Rename locale + usi.",
  },
  "lint/suspicious/noAssignInExpressions": {
    L: "B",
    why: "Assegnazione in if/while; va separata con cura.",
    strategy: "Estrarre assegnazione prima del test.",
  },
  "lint/suspicious/noTemplateCurlyInString": {
    L: "B",
    why: "Puo essere stringa letterale intenzionale o bug template.",
    strategy: "Verificare intent; template o escape.",
  },
  "lint/suspicious/noImplicitAnyLet": {
    L: "B",
    why: "Serve annotazione tipo corretta dal contesto.",
    strategy: "Annotare tipo o inizializzare.",
  },
  "lint/suspicious/noArrayIndexKey": {
    L: "B",
    why: "Key stabile richiede identita di dominio; non meccanico. Alcuni casi possono diventare D dopo review.",
    strategy: "Key da id dominio; solo dopo review lista stabile/statica → D.",
  },

  "lint/suspicious/noExplicitAny": {
    L: "C",
    why: "Sostituire any richiede tipi dominio; impatto type safety.",
    strategy: "Tipizzare per dominio; batch piccoli con typecheck.",
  },
  "lint/correctness/useExhaustiveDependencies": {
    L: "C",
    why: "Deps React: rischio loop/stale closure; review architetturale/hook.",
    strategy: "Review hook-by-hook; non autofix cieco.",
  },
  "lint/style/noNonNullAssertion": {
    L: "C",
    why: "! nasconde null; serve narrowing reale.",
    strategy: "Narrowing / guard / optional; vietato ! cieco.",
  },
  "lint/correctness/useHookAtTopLevel": {
    L: "C",
    why: "Hook condizionali: richiede refactor struttura componente.",
    strategy: "Estrarre sotto-componenti / unconditional hooks.",
  },
  "lint/security/noDangerouslySetInnerHtml": {
    L: "C",
    why: "XSS/sanitizzazione; review sicurezza contenuti.",
    strategy: "Sanitize o eliminare HTML crudo; review security.",
  },
  "lint/suspicious/noTsIgnore": {
    L: "C",
    why: "@ts-ignore→fix tipizzato; puo rivelare errori reali.",
    strategy: "Rimuovere ignore e tipizzare correttamente.",
  },
  parse: {
    L: "C",
    why: "Errori di parse: codice non valido o strumento; priorita alta, non cosmetic.",
    strategy: "Riparare sintassi / isolare file; sblocca lint sul file.",
  },
};

const RULE_META = {
  format: {
    title: "format",
    desc: "Il file non rispetta la formattazione definita da biome.json / formatter Biome.",
  },
  "assist/source/organizeImports": {
    title: "organizeImports",
    desc: "Gli import non sono ordinati secondo la policy assist di Biome.",
  },
  "lint/style/useImportType": {
    title: "useImportType",
    desc: "Import usati solo come tipi devono usare la sintassi import type.",
  },
  "lint/style/useConst": {
    title: "useConst",
    desc: "Variabili let mai riassegnate devono essere const.",
  },
  "lint/correctness/useParseIntRadix": {
    title: "useParseIntRadix",
    desc: "parseInt deve specificare il radix.",
  },
  "lint/style/useNodejsImportProtocol": {
    title: "useNodejsImportProtocol",
    desc: "I moduli built-in Node devono usare il protocollo node:.",
  },
  "lint/complexity/useLiteralKeys": {
    title: "useLiteralKeys",
    desc: "Preferire property access letterale a bracket notation quando possibile.",
  },
  "lint/style/useTemplate": {
    title: "useTemplate",
    desc: "Preferire template literal alla concatenazione di stringhe.",
  },
  "lint/style/useExponentiationOperator": {
    title: "useExponentiationOperator",
    desc: "Preferire operatore ** a Math.pow.",
  },
  "lint/complexity/noUselessEscapeInRegex": {
    title: "noUselessEscapeInRegex",
    desc: "Escape inutili in literal regex.",
  },
  "lint/complexity/noUselessUndefinedInitialization": {
    title: "noUselessUndefinedInitialization",
    desc: "Inizializzazione esplicita a undefined ridondante.",
  },
  "lint/complexity/noUselessSwitchCase": {
    title: "noUselessSwitchCase",
    desc: "Case di switch inutili / ridondanti.",
  },
  "lint/complexity/noUselessFragments": {
    title: "noUselessFragments",
    desc: "Fragment React inutili.",
  },
  "lint/complexity/noUselessTernary": {
    title: "noUselessTernary",
    desc: "Operatore ternario riducibile.",
  },
  "lint/complexity/noUselessLoneBlockStatements": {
    title: "noUselessLoneBlockStatements",
    desc: "Blocchi statement inutili.",
  },
  "lint/suspicious/noUselessEscapeInString": {
    title: "noUselessEscapeInString",
    desc: "Escape inutili in stringhe.",
  },
  "lint/suspicious/noEmptyInterface": {
    title: "noEmptyInterface",
    desc: "Interface TypeScript vuota.",
  },
  "lint/correctness/noUnusedImports": {
    title: "noUnusedImports",
    desc: "Import non utilizzati nel file.",
  },
  "lint/a11y/useButtonType": {
    title: "useButtonType",
    desc: "Elementi button devono avere attributo type esplicito.",
  },
  "lint/suspicious/noGlobalIsNan": {
    title: "noGlobalIsNan",
    desc: "Evitare isNaN globale; preferire Number.isNaN.",
  },
  "lint/suspicious/noDoubleEquals": {
    title: "noDoubleEquals",
    desc: "Evitare == / != a favore di === / !==.",
  },
  "lint/suspicious/noPrototypeBuiltins": {
    title: "noPrototypeBuiltins",
    desc: "Non chiamare builtins direttamente su Object.prototype tramite istanze.",
  },
  "lint/correctness/noSwitchDeclarations": {
    title: "noSwitchDeclarations",
    desc: "Declarazioni lessicali in case senza blocco scope.",
  },
  "lint/style/noDescendingSpecificity": {
    title: "noDescendingSpecificity",
    desc: "Selettori CSS con specificita discendente rispetto a regole precedenti.",
  },
  "lint/correctness/noUnusedVariables": {
    title: "noUnusedVariables",
    desc: "Variabili dichiarate e non usate.",
  },
  "lint/correctness/noUnusedFunctionParameters": {
    title: "noUnusedFunctionParameters",
    desc: "Parametri di funzione non usati.",
  },
  "lint/complexity/useOptionalChain": {
    title: "useOptionalChain",
    desc: "Preferire optional chaining a catene &&.",
  },
  "lint/a11y/useKeyWithClickEvents": {
    title: "useKeyWithClickEvents",
    desc: "Elementi con onClick devono gestire anche tastiera.",
  },
  "lint/a11y/noStaticElementInteractions": {
    title: "noStaticElementInteractions",
    desc: "Elementi non interattivi non dovrebbero avere handler di interazione senza ruolo adeguato.",
  },
  "lint/a11y/noLabelWithoutControl": {
    title: "noLabelWithoutControl",
    desc: "label deve essere associata a un controllo.",
  },
  "lint/a11y/noAutofocus": {
    title: "noAutofocus",
    desc: "Evitare autofocus (accessibilita).",
  },
  "lint/a11y/useAriaPropsSupportedByRole": {
    title: "useAriaPropsSupportedByRole",
    desc: "Proprieta ARIA devono essere supportate dal ruolo.",
  },
  "lint/a11y/useSemanticElements": {
    title: "useSemanticElements",
    desc: "Preferire elementi semantici a role ARIA equivalenti.",
  },
  "lint/a11y/noSvgWithoutTitle": {
    title: "noSvgWithoutTitle",
    desc: "SVG non decorative richiedono title accessibile.",
  },
  "lint/a11y/noNoninteractiveElementToInteractiveRole": {
    title: "noNoninteractiveElementToInteractiveRole",
    desc: "Elementi non interattivi non devono ricevere ruoli interattivi.",
  },
  "lint/a11y/useAltText": {
    title: "useAltText",
    desc: "Immagini richiedono testo alternativo appropriato.",
  },
  "lint/a11y/useFocusableInteractive": {
    title: "useFocusableInteractive",
    desc: "Elementi interattivi devono essere focusabili.",
  },
  "lint/a11y/useValidAnchor": {
    title: "useValidAnchor",
    desc: "Anchor deve avere href valido o essere sostituito da button.",
  },
  "lint/suspicious/useIterableCallbackReturn": {
    title: "useIterableCallbackReturn",
    desc: "Return value nei callback di forEach/map usato in modo sospetto.",
  },
  "lint/suspicious/noShadowRestrictedNames": {
    title: "noShadowRestrictedNames",
    desc: "Shadowing di nomi riservati/globali (es. name).",
  },
  "lint/suspicious/noAssignInExpressions": {
    title: "noAssignInExpressions",
    desc: "Assegnazione usata dentro espressioni.",
  },
  "lint/suspicious/noTemplateCurlyInString": {
    title: "noTemplateCurlyInString",
    desc: "Sequenza ${} dentro stringa non-template.",
  },
  "lint/suspicious/noImplicitAnyLet": {
    title: "noImplicitAnyLet",
    desc: "Variabile let senza tipo ne inizializzatore (implicit any).",
  },
  "lint/suspicious/noArrayIndexKey": {
    title: "noArrayIndexKey",
    desc: "Uso dell'indice di array come key React.",
  },
  "lint/suspicious/noExplicitAny": {
    title: "noExplicitAny",
    desc: "Uso esplicito del tipo any.",
  },
  "lint/correctness/useExhaustiveDependencies": {
    title: "useExhaustiveDependencies",
    desc: "Dipendenze di hook React incomplete o eccessive.",
  },
  "lint/style/noNonNullAssertion": {
    title: "noNonNullAssertion",
    desc: "Operatore non-null assertion (!).",
  },
  "lint/correctness/useHookAtTopLevel": {
    title: "useHookAtTopLevel",
    desc: "Hook React non chiamati al top level del componente.",
  },
  "lint/security/noDangerouslySetInnerHtml": {
    title: "noDangerouslySetInnerHtml",
    desc: "Uso di dangerouslySetInnerHTML (rischio XSS).",
  },
  "lint/suspicious/noTsIgnore": {
    title: "noTsIgnore",
    desc: "Direttive @ts-ignore / equivalenti.",
  },
  parse: {
    title: "parse",
    desc: "Il parser Biome non riesce ad analizzare il file (sintassi / contenuto).",
  },
};

/** Group small homogeneous rules into one detail doc to keep docs scalable. */
const DOC_GROUPS = [
  {
    id: "format",
    file: "AI_QUALITY/biome/A_format.md",
    rules: ["format"],
  },
  {
    id: "organize-imports",
    file: "AI_QUALITY/biome/A_organizeImports.md",
    rules: ["assist/source/organizeImports"],
  },
  {
    id: "use-import-type",
    file: "AI_QUALITY/biome/A_useImportType.md",
    rules: ["lint/style/useImportType"],
  },
  {
    id: "a-mechanical-style-small",
    file: "AI_QUALITY/biome/A_mechanical_style_small.md",
    rules: [
      "lint/style/useConst",
      "lint/correctness/useParseIntRadix",
      "lint/style/useNodejsImportProtocol",
      "lint/complexity/useLiteralKeys",
      "lint/style/useTemplate",
      "lint/style/useExponentiationOperator",
      "lint/complexity/noUselessEscapeInRegex",
      "lint/complexity/noUselessUndefinedInitialization",
      "lint/complexity/noUselessSwitchCase",
      "lint/complexity/noUselessFragments",
      "lint/complexity/noUselessTernary",
      "lint/complexity/noUselessLoneBlockStatements",
      "lint/suspicious/noUselessEscapeInString",
      "lint/suspicious/noEmptyInterface",
    ],
  },
  {
    id: "no-unused-imports",
    file: "AI_QUALITY/biome/AB_noUnusedImports.md",
    rules: ["lint/correctness/noUnusedImports"],
  },
  {
    id: "use-button-type",
    file: "AI_QUALITY/biome/AB_useButtonType.md",
    rules: ["lint/a11y/useButtonType"],
  },
  {
    id: "ab-suspicious-small",
    file: "AI_QUALITY/biome/AB_suspicious_and_switch_small.md",
    rules: [
      "lint/suspicious/noGlobalIsNan",
      "lint/suspicious/noDoubleEquals",
      "lint/suspicious/noPrototypeBuiltins",
      "lint/correctness/noSwitchDeclarations",
      "lint/style/noDescendingSpecificity",
    ],
  },
  {
    id: "no-unused-variables",
    file: "AI_QUALITY/biome/B_noUnusedVariables.md",
    rules: ["lint/correctness/noUnusedVariables"],
  },
  {
    id: "no-unused-function-parameters",
    file: "AI_QUALITY/biome/B_noUnusedFunctionParameters.md",
    rules: ["lint/correctness/noUnusedFunctionParameters"],
  },
  {
    id: "use-optional-chain",
    file: "AI_QUALITY/biome/B_useOptionalChain.md",
    rules: ["lint/complexity/useOptionalChain"],
  },
  {
    id: "a11y-click-static",
    file: "AI_QUALITY/biome/B_a11y_click_and_static_interactions.md",
    rules: [
      "lint/a11y/useKeyWithClickEvents",
      "lint/a11y/noStaticElementInteractions",
    ],
  },
  {
    id: "a11y-forms-labels",
    file: "AI_QUALITY/biome/B_a11y_labels_and_forms.md",
    rules: ["lint/a11y/noLabelWithoutControl", "lint/a11y/noAutofocus"],
  },
  {
    id: "a11y-aria-semantic",
    file: "AI_QUALITY/biome/B_a11y_aria_semantic_media.md",
    rules: [
      "lint/a11y/useAriaPropsSupportedByRole",
      "lint/a11y/useSemanticElements",
      "lint/a11y/noSvgWithoutTitle",
      "lint/a11y/noNoninteractiveElementToInteractiveRole",
      "lint/a11y/useAltText",
      "lint/a11y/useFocusableInteractive",
      "lint/a11y/useValidAnchor",
    ],
  },
  {
    id: "b-suspicious",
    file: "AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md",
    rules: [
      "lint/suspicious/useIterableCallbackReturn",
      "lint/suspicious/noShadowRestrictedNames",
      "lint/suspicious/noAssignInExpressions",
      "lint/suspicious/noTemplateCurlyInString",
      "lint/suspicious/noImplicitAnyLet",
    ],
  },
  {
    id: "no-array-index-key",
    file: "AI_QUALITY/biome/B_noArrayIndexKey.md",
    rules: ["lint/suspicious/noArrayIndexKey"],
  },
  {
    id: "no-explicit-any",
    file: "AI_QUALITY/biome/C_noExplicitAny.md",
    rules: ["lint/suspicious/noExplicitAny"],
  },
  {
    id: "use-exhaustive-dependencies",
    file: "AI_QUALITY/biome/C_useExhaustiveDependencies.md",
    rules: ["lint/correctness/useExhaustiveDependencies"],
  },
  {
    id: "no-non-null-assertion",
    file: "AI_QUALITY/biome/C_noNonNullAssertion.md",
    rules: ["lint/style/noNonNullAssertion"],
  },
  {
    id: "c-hooks-security-parse",
    file: "AI_QUALITY/biome/C_hooks_security_parse_tsignore.md",
    rules: [
      "lint/correctness/useHookAtTopLevel",
      "lint/security/noDangerouslySetInnerHtml",
      "lint/suspicious/noTsIgnore",
      "parse",
    ],
  },
  {
    id: "level-d-policy",
    file: "AI_QUALITY/biome/D_policy_and_false_positives.md",
    rules: [], // policy doc; D count starts at 0 at baseline
  },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function lineOf(diag) {
  const span = diag.location?.span;
  if (span && typeof span.start?.line === "number") return span.start.line + 1;
  // biome sometimes uses different shape
  const loc = diag.location;
  if (typeof loc?.lineStart === "number") return loc.lineStart;
  if (typeof loc?.start?.line === "number") return loc.start.line;
  return null;
}

function buildInventory(diagnostics) {
  const byRule = new Map();
  const allFiles = new Set();
  let errors = 0;
  let warnings = 0;
  let infos = 0;

  for (const x of diagnostics) {
    const cat = x.category || "unknown";
    const f = norm(x.location?.path?.file || x.location?.path || "");
    const sev = String(x.severity || "unknown").toLowerCase();
    if (sev === "error") errors++;
    else if (sev === "warning") warnings++;
    else if (sev === "info" || sev === "information") infos++;
    allFiles.add(f);

    if (!byRule.has(cat)) {
      byRule.set(cat, {
        count: 0,
        files: new Map(),
        sev: { error: 0, warning: 0, info: 0, other: 0 },
        occurrences: [],
      });
    }
    const e = byRule.get(cat);
    e.count++;
    e.files.set(f, (e.files.get(f) || 0) + 1);
    if (sev === "error") e.sev.error++;
    else if (sev === "warning") e.sev.warning++;
    else if (sev === "info" || sev === "information") e.sev.info++;
    else e.sev.other++;
    e.occurrences.push({
      file: f,
      line: lineOf(x),
      severity: sev,
      message: (x.description || x.message || "").slice(0, 200),
    });
  }

  return { byRule, allFiles, errors, warnings, infos, total: diagnostics.length };
}

function classifyOrThrow(cat) {
  if (!CLASS[cat]) {
    throw new Error(`Missing CLASS for category: ${cat}`);
  }
  return CLASS[cat];
}

function renderFileTable(filesMap) {
  const rows = [...filesMap.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const lines = [
    "| File | Occorrenze |",
    "|---|---:|",
    ...rows.map(([f, c]) => `| \`${mdEscape(f)}\` | ${c} |`),
  ];
  return { markdown: lines.join("\n"), rows, fileCount: rows.length };
}

function renderOccurrenceAnalysis(rule, entry, level) {
  const rows = [...entry.files.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const lines = [];
  lines.push(
    "Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.",
  );
  lines.push("");
  if (entry.count <= 80) {
    lines.push("| # | File | Riga | Severity | Decisione baseline |");
    lines.push("|---:|---|---:|---|---|");
    entry.occurrences
      .slice()
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file) || (a.line || 0) - (b.line || 0),
      )
      .forEach((o, idx) => {
        lines.push(
          `| ${idx + 1} | \`${mdEscape(o.file)}\` | ${o.line ?? "—"} | ${o.severity} | da correggere (Livello ${level}) |`,
        );
      });
  } else {
    lines.push(
      `Occorrenze totali: **${entry.count}** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:`,
    );
    lines.push("");
    lines.push("| File | Occorrenze | Decisione baseline per-file |");
    lines.push("|---|---:|---|");
    for (const [f, c] of rows) {
      lines.push(
        `| \`${mdEscape(f)}\` | ${c} | da correggere (${c}× Livello ${level}) |`,
      );
    }
    lines.push("");
    lines.push(
      "Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.",
    );
  }
  return lines.join("\n");
}

function writeDetailDoc(group, inv, today) {
  const abs = path.join(ROOT, group.file);
  ensureDir(path.dirname(abs));

  if (group.id === "level-d-policy") {
    const body = `# Livello D — Policy, falsi positivi e decisioni di prodotto

> Documento di policy della baseline Biome full-project (2026-08-03).  
> Dashboard: [\`AI_BIOME_AUDIT.md\`](../../AI_BIOME_AUDIT.md)

## Scopo

Il **Livello D** raccoglie diagnostiche che **non vanno corrette** (o non ora), perche:

- falsi positivi rispetto al dominio;
- warning discutibili / rumore;
- decisioni di prodotto consapevoli;
- pattern che oggi e corretto mantenere.

## Stato baseline (full project)

| Campo | Valore |
|----|----|
| **Diagnostiche classificate D alla baseline** | **0** |
| **Categorie intere in D** | nessuna |
| **Ultimo aggiornamento** | ${today} |

Alla data della baseline ufficiale **nessuna categoria intera** e stata messa in D a priori.  
I candidati tipici (da promuovere a D **solo dopo review puntuale**) includono:

| Candidato | Categoria Biome | Motivo potenziale D |
|----|----|----|
| Key su slot dominio statici | \`lint/suspicious/noArrayIndexKey\` | Lista fissa non riordinabile; key=indice puo essere accettabile se documentata |
| autofocus in modal critici | \`lint/a11y/noAutofocus\` | UX intenzionale accessibilita/prodotti |
| HTML trustato admin-only | \`lint/security/noDangerouslySetInnerHtml\` | Se sanitizzato e threat model accettato (altrimenti resta C) |

## Registro decisioni D (append-only)

| Data | File | Categoria | Occorrenze | Motivo | Decisione |
|----|----|----|---:|----|----|
| — | — | — | 0 | Baseline: nessun caso D registrato | — |

## Regola operativa

1. Default: correggere secondo il livello della categoria (A–C).
2. Solo dopo review esplicita un hit puo passare a D.
3. Ogni promozione a D aggiorna questa tabella **e** ricalcola i totali in \`AI_BIOME_AUDIT.md\` (identita A+A/B+B+C+D = totale progetto).
`;
    fs.writeFileSync(abs, body, "utf8");
    return { path: group.file, count: 0, files: 0, level: "D" };
  }

  let total = 0;
  const fileUnion = new Set();
  const levels = new Set();
  const sections = [];

  for (const rule of group.rules) {
    const entry = inv.byRule.get(rule);
    if (!entry) {
      sections.push(`## \`${rule}\`\n\nNessuna occorrenza nella baseline corrente.\n`);
      continue;
    }
    const cls = classifyOrThrow(rule);
    const meta = RULE_META[rule] || { title: rule, desc: rule };
    levels.add(cls.L);
    total += entry.count;
    for (const f of entry.files.keys()) fileUnion.add(f);
    const ft = renderFileTable(entry.files);

    sections.push(`## \`${rule}\`

### Descrizione della regola

${meta.desc}

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | \`${rule}\` |
| **Occorrenze totali** | **${entry.count}** |
| **Error** | ${entry.sev.error} |
| **Warning** | ${entry.sev.warning} |
| **Info** | ${entry.sev.info} |
| **File coinvolti** | **${ft.fileCount}** |
| **Livello di rischio** | **${cls.L}** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

${cls.why}

### Strategia di correzione

${cls.strategy}

### Elenco completo file + occorrenze per file

${ft.markdown}

### Analisi delle occorrenze

${renderOccurrenceAnalysis(rule, entry, cls.L)}
`);
  }

  const levelLabel = [...levels].join(" / ") || "—";
  const title =
    group.rules.length === 1
      ? RULE_META[group.rules[0]]?.title || group.rules[0]
      : group.id;

  const body = `# ${title}

> Dettaglio baseline Biome full-project. Dashboard: [\`AI_BIOME_AUDIT.md\`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | \`${group.file}\` |
| **Categorie** | ${group.rules.map((r) => `\`${r}\``).join(", ")} |
| **Occorrenze (somma gruppo)** | **${total}** |
| **File unici nel gruppo** | **${fileUnion.size}** |
| **Livello** | **${levelLabel}** |
| **Ultimo aggiornamento** | ${today} |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

${sections.join("\n")}
`;

  fs.writeFileSync(abs, body, "utf8");
  return {
    path: group.file,
    count: total,
    files: fileUnion.size,
    level: levelLabel,
    rules: group.rules,
  };
}

function buildRoadmap(levelStats) {
  return [
    {
      batch: "Batch P0 — Format & imports mechanici",
      level: "A",
      cats: ["format", "assist/source/organizeImports"],
      diags: levelStats.ruleCounts.format + levelStats.ruleCounts["assist/source/organizeImports"],
      files: "vedi doc A_format + A_organizeImports",
      rischio: "Zero",
      auto: "Si",
      semi: "No",
      manuale: "No",
    },
    {
      batch: "Batch P1 — Style A residui",
      level: "A",
      cats: [
        "lint/style/useImportType",
        "lint/style/useConst",
        "lint/correctness/useParseIntRadix",
        "lint/style/useNodejsImportProtocol",
        "lint/complexity/useLiteralKeys",
        "lint/style/useTemplate",
        "lint/style/useExponentiationOperator",
        "lint/complexity/*useless*",
        "lint/suspicious/noUselessEscapeInString",
        "lint/suspicious/noEmptyInterface",
      ],
      diags:
        levelStats.levels.A -
        levelStats.ruleCounts.format -
        levelStats.ruleCounts["assist/source/organizeImports"],
      files: "multipli (vedi doc A_*)",
      rischio: "Zero / trascurabile",
      auto: "Si",
      semi: "Spot-check",
      manuale: "No",
    },
    {
      batch: "Batch P2 — Unused imports",
      level: "A/B",
      cats: ["lint/correctness/noUnusedImports"],
      diags: levelStats.ruleCounts["lint/correctness/noUnusedImports"],
      files: levelStats.ruleFiles["lint/correctness/noUnusedImports"],
      rischio: "Basso (side-effect import)",
      auto: "Prevalente",
      semi: "Si",
      manuale: "Raro",
    },
    {
      batch: "Batch P3 — useButtonType classificato",
      level: "A/B",
      cats: ["lint/a11y/useButtonType"],
      diags: levelStats.ruleCounts["lint/a11y/useButtonType"],
      files: levelStats.ruleFiles["lint/a11y/useButtonType"],
      rischio: "Basso se classificato; medio se cieco",
      auto: "No",
      semi: "Si",
      manuale: "Casi senza onClick",
    },
    {
      batch: "Batch P4 — A/B suspicious piccoli",
      level: "A/B",
      cats: [
        "noGlobalIsNan",
        "noDoubleEquals",
        "noPrototypeBuiltins",
        "noSwitchDeclarations",
        "noDescendingSpecificity",
      ],
      diags:
        levelStats.levels["A/B"] -
        levelStats.ruleCounts["lint/correctness/noUnusedImports"] -
        levelStats.ruleCounts["lint/a11y/useButtonType"],
      files: "vedi AB_suspicious_and_switch_small.md",
      rischio: "Basso",
      auto: "Parziale",
      semi: "Si",
      manuale: "Pochi",
    },
    {
      batch: "Batch P5 — Unused vars/params + optional chain",
      level: "B",
      cats: [
        "noUnusedVariables",
        "noUnusedFunctionParameters",
        "useOptionalChain",
      ],
      diags:
        levelStats.ruleCounts["lint/correctness/noUnusedVariables"] +
        levelStats.ruleCounts["lint/correctness/noUnusedFunctionParameters"] +
        levelStats.ruleCounts["lint/complexity/useOptionalChain"],
      files: "vedi B_*",
      rischio: "Medio",
      auto: "No",
      semi: "No",
      manuale: "Si",
    },
    {
      batch: "Batch P6 — A11y strutturale",
      level: "B",
      cats: ["useKeyWithClickEvents", "noStaticElementInteractions", "labels", "ARIA/media"],
      diags:
        levelStats.ruleCounts["lint/a11y/useKeyWithClickEvents"] +
        levelStats.ruleCounts["lint/a11y/noStaticElementInteractions"] +
        levelStats.ruleCounts["lint/a11y/noLabelWithoutControl"] +
        levelStats.ruleCounts["lint/a11y/noAutofocus"] +
        levelStats.ruleCounts["lint/a11y/useAriaPropsSupportedByRole"] +
        levelStats.ruleCounts["lint/a11y/useSemanticElements"] +
        levelStats.ruleCounts["lint/a11y/noSvgWithoutTitle"] +
        levelStats.ruleCounts["lint/a11y/noNoninteractiveElementToInteractiveRole"] +
        levelStats.ruleCounts["lint/a11y/useAltText"] +
        levelStats.ruleCounts["lint/a11y/useFocusableInteractive"] +
        levelStats.ruleCounts["lint/a11y/useValidAnchor"],
      files: "vedi B_a11y_*",
      rischio: "Medio (UX)",
      auto: "No",
      semi: "No",
      manuale: "Si",
    },
    {
      batch: "Batch P7 — Suspicious B + array index keys",
      level: "B",
      cats: ["useIterableCallbackReturn", "shadow", "assign", "noArrayIndexKey", "..."],
      diags:
        levelStats.levels.B -
        (levelStats.ruleCounts["lint/correctness/noUnusedVariables"] +
          levelStats.ruleCounts["lint/correctness/noUnusedFunctionParameters"] +
          levelStats.ruleCounts["lint/complexity/useOptionalChain"] +
          levelStats.ruleCounts["lint/a11y/useKeyWithClickEvents"] +
          levelStats.ruleCounts["lint/a11y/noStaticElementInteractions"] +
          levelStats.ruleCounts["lint/a11y/noLabelWithoutControl"] +
          levelStats.ruleCounts["lint/a11y/noAutofocus"] +
          levelStats.ruleCounts["lint/a11y/useAriaPropsSupportedByRole"] +
          levelStats.ruleCounts["lint/a11y/useSemanticElements"] +
          levelStats.ruleCounts["lint/a11y/noSvgWithoutTitle"] +
          levelStats.ruleCounts["lint/a11y/noNoninteractiveElementToInteractiveRole"] +
          levelStats.ruleCounts["lint/a11y/useAltText"] +
          levelStats.ruleCounts["lint/a11y/useFocusableInteractive"] +
          levelStats.ruleCounts["lint/a11y/useValidAnchor"]),
      files: "vedi B_suspicious_* + B_noArrayIndexKey",
      rischio: "Medio",
      auto: "No",
      semi: "No",
      manuale: "Si",
    },
    {
      batch: "Batch P8 — Type safety & React deps",
      level: "C",
      cats: ["noExplicitAny", "useExhaustiveDependencies", "noNonNullAssertion"],
      diags:
        levelStats.ruleCounts["lint/suspicious/noExplicitAny"] +
        levelStats.ruleCounts["lint/correctness/useExhaustiveDependencies"] +
        levelStats.ruleCounts["lint/style/noNonNullAssertion"],
      files: "vedi C_*",
      rischio: "Alto",
      auto: "No",
      semi: "No",
      manuale: "Si + typecheck",
    },
    {
      batch: "Batch P9 — Hooks / security / parse / ts-ignore",
      level: "C",
      cats: ["useHookAtTopLevel", "noDangerouslySetInnerHtml", "noTsIgnore", "parse"],
      diags:
        levelStats.ruleCounts["lint/correctness/useHookAtTopLevel"] +
        levelStats.ruleCounts["lint/security/noDangerouslySetInnerHtml"] +
        levelStats.ruleCounts["lint/suspicious/noTsIgnore"] +
        levelStats.ruleCounts.parse,
      files: levelStats.ruleFiles["lint/correctness/useHookAtTopLevel"],
      rischio: "Alto",
      auto: "No",
      semi: "No",
      manuale: "Si",
    },
  ];
}

function main() {
  const today = "2026-08-03";
  const data = loadBiomeJson(INPUT);
  const diagnostics = data.diagnostics || [];
  const summary = data.summary || {};
  const inv = buildInventory(diagnostics);

  // Validate classification coverage
  for (const cat of inv.byRule.keys()) {
    classifyOrThrow(cat);
  }

  const levels = { A: 0, "A/B": 0, B: 0, C: 0, D: 0 };
  const levelCats = { A: new Set(), "A/B": new Set(), B: new Set(), C: new Set(), D: new Set() };
  const levelFiles = { A: new Set(), "A/B": new Set(), B: new Set(), C: new Set(), D: new Set() };
  const ruleCounts = {};
  const ruleFiles = {};

  for (const [cat, entry] of inv.byRule.entries()) {
    const { L } = classifyOrThrow(cat);
    levels[L] += entry.count;
    levelCats[L].add(cat);
    ruleCounts[cat] = entry.count;
    ruleFiles[cat] = entry.files.size;
    for (const f of entry.files.keys()) levelFiles[L].add(f);
  }

  const sumLevels = Object.values(levels).reduce((a, b) => a + b, 0);
  if (sumLevels !== inv.total) {
    throw new Error(`Level sum mismatch: ${sumLevels} !== ${inv.total}`);
  }

  // summary errors may differ from severity walk — prefer summary if present
  const errors = summary.errors ?? inv.errors;
  const warnings = summary.warnings ?? inv.warnings;
  const infos = summary.infos ?? inv.infos;
  if (errors + warnings + infos !== inv.total) {
    // keep both numbers visible; do not invent
    console.warn(
      "WARN severity sum",
      errors + warnings + infos,
      "vs total",
      inv.total,
      "walk",
      inv.errors,
      inv.warnings,
      inv.infos,
    );
  }

  ensureDir(path.join(ROOT, "AI_QUALITY", "biome"));

  const detailIndex = [];
  for (const g of DOC_GROUPS) {
    detailIndex.push(writeDetailDoc(g, inv, today));
  }

  // README index
  const readme = `# AI_QUALITY — Qualita progetto (Biome)

Struttura documentale dedicata alla bonifica Biome dell'**intero progetto**.

- Dashboard / SoT principale: [\`../AI_BIOME_AUDIT.md\`](../AI_BIOME_AUDIT.md)
- Dettagli per categoria/gruppo: [\`biome/\`](./biome/)

## Principio

L'obiettivo **non** e zero warning. L'obiettivo e:

1. impedire nuovo debito tecnico;
2. ridurre progressivamente il debito legacy;
3. correggere solo cio che e davvero sicuro;
4. evitare workaround, hack e suppressioni;
5. mantenere stabilita e assenza di regressioni.

## Indice documenti Biome

| Documento | Livello | Occorrenze | Note |
|----|----|---:|----|
${detailIndex
  .map((d) => {
    const name = path.basename(d.path);
    return `| [\`${name}\`](./biome/${name}) | ${d.level} | ${d.count} | |`;
  })
  .join("\n")}

## Baseline

| Campo | Valore |
|----|----|
| **Data baseline full-project** | ${today} |
| **Diagnostiche totali** | **${inv.total}** |
| **File unici con diagnostiche** | **${inv.allFiles.size}** |
| **Categorie Biome** | **${inv.byRule.size}** |
`;
  fs.writeFileSync(path.join(ROOT, "AI_QUALITY", "README.md"), readme, "utf8");

  // Category accounting table rows
  const catRows = [...inv.byRule.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .map(([cat, entry]) => {
      const { L, why } = classifyOrThrow(cat);
      const detail = DOC_GROUPS.find(
        (g) => g.rules.includes(cat) || (cat === "parse" && g.id === "c-hooks-security-parse"),
      );
      const link = detail ? detail.file : "AI_QUALITY/biome/";
      return {
        cat,
        count: entry.count,
        files: entry.files.size,
        L,
        why,
        link,
        sev: entry.sev,
      };
    });

  const roadmap = buildRoadmap({ levels, ruleCounts, ruleFiles });

  // Read existing audit to preserve history
  const auditPath = path.join(ROOT, "AI_BIOME_AUDIT.md");
  const previous = fs.existsSync(auditPath)
    ? fs.readFileSync(auditPath, "utf8")
    : "";

  const historyMarker = "\n---\n\n## Storico — Audit set 35 file (pre-baseline full-project)\n\n";
  let preservedHistory = previous;
  // Avoid nesting if re-run: if already has full-project header, extract old history section if present
  if (previous.includes("## Storico — Audit set 35 file")) {
    preservedHistory = previous.slice(previous.indexOf("## Storico — Audit set 35 file"));
  } else if (previous.trim()) {
    preservedHistory =
      "## Storico — Audit set 35 file (pre-baseline full-project)\n\n" +
      "> Lo storico seguente resta valido come audit **parziale** (35 file). " +
      "La baseline ufficiale del progetto e la sezione Dashboard full-project sopra.\n\n" +
      previous;
  }

  const initial = inv.total;
  const eliminated = 0; // this activity: docs only, no fixes
  const residual = initial - eliminated;
  const pct = initial === 0 ? 0 : ((eliminated / initial) * 100).toFixed(2);

  const dashboard = `# AI Biome Audit

Source of Truth ufficiale della bonifica Biome dell'**intero progetto** TouringDiary.

> Principio: l'obiettivo **non** e arrivare a zero warning.  
> Obiettivi: bloccare nuovo debito, ridurre il debito legacy con correzioni davvero sicure, evitare hack/suppressioni, zero regressioni.

I dettagli per categoria vivono in [\`AI_QUALITY/\`](./AI_QUALITY/README.md). Questo file e la **dashboard**.

---

## Dashboard bonifica (full project)

| Campo | Valore |
|----|----|
| **Diagnostiche iniziali del progetto (baseline)** | **${initial}** |
| **Diagnostiche eliminate (dal baseline)** | **${eliminated}** |
| **Diagnostiche residue** | **${residual}** |
| **Percentuale di riduzione complessiva** | **${pct}%** |
| **Ultimo aggiornamento** | ${today} |
| **Stato corrente della bonifica** | Baseline ufficiale fotografata — **nessuna correzione codice** in questa attivita; roadmap pronta |
| **Scope** | Intero perimetro Biome del repository (\`biome.json\` / \`npx biome check .\`) |
| **File Biome analizzati (unchanged+changed)** | ${summary.unchanged ?? "—"} unchanged / ${summary.changed ?? 0} changed |
| **File con almeno 1 diagnostica** | **${inv.allFiles.size}** |
| **Categorie Biome distinte** | **${inv.byRule.size}** |

### Contabilita per severity

| Severity | Conteggio |
|----|---:|
| **error** | **${errors}** |
| **warning** | **${warnings}** |
| **info** | **${infos}** |
| **Totale** | **${initial}** |

Verifica aritmetica severity: ${errors} + ${warnings} + ${infos} = **${errors + warnings + infos}** (atteso ${initial}).

### Contabilita per livello di sicurezza correzione

| Livello | Diagnostiche | Categorie | File (unici nel livello) | Natura |
|----|---:|---:|---:|----|
| **A** | **${levels.A}** | ${levelCats.A.size} | ${levelFiles.A.size} | Meccanico, zero rischio |
| **A/B** | **${levels["A/B"]}** | ${levelCats["A/B"].size} | ${levelFiles["A/B"].size} | Quasi automatico, verifica breve |
| **B** | **${levels.B}** | ${levelCats.B.size} | ${levelFiles.B.size} | Review funzionale / lettura codice |
| **C** | **${levels.C}** | ${levelCats.C.size} | ${levelFiles.C.size} | Review architetturale / type safety / React / security |
| **D** | **${levels.D}** | ${levelCats.D.size} | ${levelFiles.D.size} | Non correggere (policy / FP / prodotto) |
| **Totale** | **${sumLevels}** | ${inv.byRule.size} | — | Deve coincidere con baseline |

Identita obbligata: A + A/B + B + C + D = **${sumLevels}** = diagnostiche progetto **${initial}**.

---

## Indice documenti di dettaglio

| Livello | Documento | Occorrenze |
|----|----|---:|
${detailIndex.map((d) => `| ${d.level} | [\`${d.path}\`](./${d.path}) | ${d.count} |`).join("\n")}

Indice completo: [\`AI_QUALITY/README.md\`](./AI_QUALITY/README.md)

---

## Contabilita per categoria Biome

| Categoria | Occ. | Err | Warn | Info | File | Livello | Dettaglio |
|----|---:|---:|---:|---:|---:|----|----|
${catRows
  .map(
    (r) =>
      `| \`${r.cat}\` | ${r.count} | ${r.sev.error} | ${r.sev.warning} | ${r.sev.info} | ${r.files} | ${r.L} | [\`doc\`](./${r.link}) |`,
  )
  .join("\n")}

### Motivazioni sintesi per livello

#### Livello A — ${levels.A} diagnostiche / ${levelCats.A.size} categorie

Correzione completamente meccanica, applicabile automaticamente.

${[...levelCats.A]
  .sort()
  .map((c) => `- \`${c}\` (${ruleCounts[c]}): ${CLASS[c].why}`)
  .join("\n")}

#### Livello A/B — ${levels["A/B"]} diagnostiche / ${levelCats["A/B"].size} categorie

Quasi automatico; brevissima verifica preventiva.

${[...levelCats["A/B"]]
  .sort()
  .map((c) => `- \`${c}\` (${ruleCounts[c]}): ${CLASS[c].why}`)
  .join("\n")}

#### Livello B — ${levels.B} diagnostiche / ${levelCats.B.size} categorie

Richiede lettura del codice e review funzionale.

${[...levelCats.B]
  .sort()
  .map((c) => `- \`${c}\` (${ruleCounts[c]}): ${CLASS[c].why}`)
  .join("\n")}

#### Livello C — ${levels.C} diagnostiche / ${levelCats.C.size} categorie

Review architetturale; puo toccare type safety, runtime, dominio o flussi React.

${[...levelCats.C]
  .sort()
  .map((c) => `- \`${c}\` (${ruleCounts[c]}): ${CLASS[c].why}`)
  .join("\n")}

#### Livello D — ${levels.D} diagnostiche

Vedi [\`AI_QUALITY/biome/D_policy_and_false_positives.md\`](./AI_QUALITY/biome/D_policy_and_false_positives.md).  
Alla baseline: **0** hit in D (nessuna categoria intera dichiarata non-correggibile a priori).

---

## Roadmap bonifica (full project)

Ordine consigliato: esaurire A → A/B → B → C; promuovere a D solo con registro esplicito.

| Batch | Livello | Categorie (sintesi) | Warning/diagn. eliminabili | File | Rischio | Auto | Semi | Manuale |
|----|----|----|---:|----|----|----|----|----|
${roadmap
  .map(
    (b) =>
      `| ${b.batch} | ${b.level} | ${b.cats.join(", ")} | ${b.diags} | ${b.files} | ${b.rischio} | ${b.auto} | ${b.semi} | ${b.manuale} |`,
  )
  .join("\n")}

Somma diagnostiche nei batch P0–P9 (solo A/A/B/B/C operativi): deve coprire **${initial - levels.D}** (tutto tranne D).

### Regole operative roadmap

1. Ogni batch aggiorna questa dashboard (eliminate / residue / %).
2. Ogni batch aggiorna il documento di dettaglio delle categorie toccate.
3. Vietato introdurre suppressioni come scorciatoia.
4. Vietato “arrivare a zero” forzando fix rischiosi.
5. Dopo ogni attivita codice: rigenerare snapshot Biome e riconciliare i conti.

---

## Metodo di generazione baseline

\`\`\`text
npx biome check --reporter=json --max-diagnostics=100000 .
\`\`\`

- Data snapshot: ${today}
- Totale diagnostiche JSON: ${inv.total}
- Summary Biome: errors=${summary.errors}, warnings=${summary.warnings}, infos=${summary.infos}
- Classificazione: per **sicurezza della correzione**, non per nome regola in isolamento
- In dubbio: livello piu cauto

---

${preservedHistory.startsWith("## Storico") ? preservedHistory : historyMarker + preservedHistory}
`;

  fs.writeFileSync(auditPath, dashboard, "utf8");

  // machine-readable snapshot for future diffs (docs support)
  const snap = {
    date: today,
    total: inv.total,
    errors,
    warnings,
    infos,
    uniqueFiles: inv.allFiles.size,
    levels,
    levelCats: Object.fromEntries(
      Object.entries(levelCats).map(([k, v]) => [k, [...v].sort()]),
    ),
    levelFiles: Object.fromEntries(
      Object.entries(levelFiles).map(([k, v]) => [k, v.size]),
    ),
    rules: Object.fromEntries(
      [...inv.byRule.entries()].map(([cat, e]) => [
        cat,
        {
          count: e.count,
          files: e.files.size,
          level: CLASS[cat].L,
          perFile: [...e.files.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([f, c]) => ({ file: f, count: c })),
        },
      ]),
    ),
  };
  fs.writeFileSync(
    path.join(ROOT, "AI_QUALITY", "biome", "_baseline_snapshot.json"),
    JSON.stringify(snap, null, 2),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        total: inv.total,
        errors,
        warnings,
        infos,
        levels,
        sumLevels,
        uniqueFiles: inv.allFiles.size,
        categories: inv.byRule.size,
        docs: detailIndex.length,
      },
      null,
      2,
    ),
  );
}

main();
