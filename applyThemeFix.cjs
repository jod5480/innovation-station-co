const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Basic replacements for hardcoded dark mode colors to Tailwind CSS variables
const replacements = [
  { regex: /bg-\[\#1A1A1A\]/g, replacement: 'bg-card' },
  { regex: /bg-black/g, replacement: 'bg-background' },
  { regex: /text-white/g, replacement: 'text-foreground' },
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/12/g, replacement: 'border-border' },
  { regex: /border-white\/20/g, replacement: 'border-border' },
  { regex: /text-neutral-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[\#94A3B8\]/g, replacement: 'text-muted-foreground' },
  { regex: /bg-white\/10/g, replacement: 'bg-muted' },
  { regex: /bg-white\/5/g, replacement: 'bg-muted/50' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-muted' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-muted/50' },
  { regex: /bg-neutral-900/g, replacement: 'bg-secondary' },
  { regex: /bg-neutral-800/g, replacement: 'bg-secondary' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src/kinotribe'));
console.log('Done!');
