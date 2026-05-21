
import fs from 'fs';
import path from 'path';

const hooks = ['useCallback', 'useMemo', 'useRef', 'useId'];
const rootDir = 'c:/TouringDiary/src/components';

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const missingHooks = [];

    hooks.forEach(hook => {
        // Match hook( but NOT React.hook(
        const usageRegex = new RegExp(`(?<!React\\.)\\b${hook}\\(`, 'g');
        const importFromReactRegex = /import\s+(?:React,\s*)?{[^}]*}\s+from\s+['"]react['"]/g;
        
        if (usageRegex.test(content)) {
            const matches = content.match(importFromReactRegex);
            const isImported = matches && matches.some(m => new RegExp(`\\b${hook}\\b`).test(m));
            if (!isImported) {
                missingHooks.push(hook);
            }
        }
    });

    return missingHooks;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.tsx')) {
            const missing = checkFile(fullPath);
            if (missing.length > 0) {
                console.log(`${fullPath}: ${missing.join(', ')}`);
            }
        }
    });
}

walkDir(rootDir);
