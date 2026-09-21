const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Add Google Font Import
if (!css.includes('@import url')) {
    css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');\n\n` + css;
}

// 2. Replace :root light
const rootLightRegex = /:root\s*\{[\s\S]*?\}/;
const rootLightNew = `:root {
  color-scheme: light;
  --bg: #f8fafc;
  --bg-deep: #f1f5f9;
  --paper: #ffffff;
  --ink: #0f172a;
  --ink-soft: #475569;
  --muted: #94a3b8;
  --line: #e2e8f0;
  --sage: #10b981;
  --sage-soft: #d1fae5;
  --clay: #f97316;
  --clay-soft: #ffedd5;
  --sky: #3b82f6;
  --sky-soft: #dbeafe;
  --gold: #eab308;
  --danger: #ef4444;
  --shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.05);
  --radius: 18px;
  --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`;
css = css.replace(rootLightRegex, rootLightNew);

// 3. Replace :root dark
const rootDarkRegex = /:root\[data-theme='dark'\]\s*\{[\s\S]*?\}/;
const rootDarkNew = `:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #020617;
  --bg-deep: #0f172a;
  --paper: #111827;
  --ink: #f8fafc;
  --ink-soft: #cbd5e1;
  --muted: #64748b;
  --line: #1e293b;
  --sage: #10b981;
  --sage-soft: #064e3b;
  --clay: #f97316;
  --clay-soft: #7c2d12;
  --sky: #3b82f6;
  --sky-soft: #1e3a8a;
  --gold: #eab308;
  --danger: #ef4444;
  --shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.8);
}`;
css = css.replace(rootDarkRegex, rootDarkNew);

// 4. Clean up body & backgrounds
const bodyRegex = /body\s*\{[\s\S]*?body::before\s*\{[\s\S]*?\}/;
const bodyNew = `body {
  margin: 0;
  color: var(--ink);
  background: var(--bg);
  font-family: var(--font-ui);
  letter-spacing: -0.01em;
  word-spacing: 0.02em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body::before {
  display: none;
}`;
css = css.replace(bodyRegex, bodyNew);

// 5. Update transitions for smoother feel
css = css.replace(/transition:\s*(.*?);\s*/g, (match, group) => {
    if (match.includes('transform') || match.includes('background') || match.includes('color') || match.includes('border-color')) {
        return 'transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); ';
    }
    return match;
});

// 6. Refine Layout & typography styling
css = css.replace(/.nav button\s*\{[\s\S]*?\}/, 
`.nav button {
  padding: 10px 20px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}`);

css = css.replace(/.nav button\.active\s*\{[\s\S]*?\}/, 
`.nav button.active {
  background: var(--ink);
  color: var(--bg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}`);

css = css.replace(/.brand h1\s*\{[\s\S]*?\}/,
`.brand h1 {
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--ink);
}`);

css = css.replace(/.panel\s*\{\s*padding: 22px;\s*\}/, `.panel { padding: 32px; border-radius: var(--radius); }`);

css = css.replace(/.habit\s*\{[\s\S]*?background: var\(--paper\);\s*\}/,
`.habit {
  display: grid;
  grid-template-columns: 22px 56px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 20px 16px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}`);

css = css.replace(/.task\s*\{[\s\S]*?background: var\(--paper\);\s*\}/,
`.task {
  display: grid;
  grid-template-columns: 16px 40px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px 14px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}`);

css = css.replace(/.habit-check\s*\{[\s\S]*?font-size: 20px;\s*\}/,
`.habit-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  font-size: 20px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}`);

css = css.replace(/.habit-meta h3\s*\{[\s\S]*?font-weight: 750;\s*\}/,
`.habit-meta h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}`);

css = css.replace(/.stat b\s*\{[\s\S]*?font-weight: 560;\s*\}/,
`.stat b {
  display: block;
  margin-bottom: 4px;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
}`);

css = css.replace(/.section-head h2,\s*\n.dialog h2,\s*\n.empty h3\s*\{[\s\S]*?\}/,
`.section-head h2,
.dialog h2,
.empty h3 {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}`);

// Add modern button styling
css = css.replace(/.primary,[\s\S]*?\.danger\s*\{[\s\S]*?\}/,
`.primary,
.ghost,
.danger {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}`);

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully.');
