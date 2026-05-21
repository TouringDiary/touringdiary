
import fs from 'fs';
import path from 'path';

const rootDir = 'c:/TouringDiary/src/components';

const replacements = [
    { from: /\bz-\[100\]\b/g, to: '', import: 'Z_MODAL_NESTED', style: 'zIndex: Z_MODAL_NESTED' },
    { from: /\bz-\[999\]\b/g, to: '', import: 'Z_MODAL_NESTED', style: 'zIndex: Z_MODAL_NESTED' },
    { from: /\bz-\[9999\]\b/g, to: '', import: 'Z_OVERLAY', style: 'zIndex: Z_OVERLAY' },
    { from: /\bz-\[5000\]\b/g, to: '', import: 'Z_OVERLAY', style: 'zIndex: Z_OVERLAY' },
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let neededImports = new Set();

    replacements.forEach(r => {
        if (r.from.test(content)) {
            // Remove the class
            content = content.replace(r.from, '');
            
            // This is complex because we need to add a style attribute.
            // We'll look for the tag start.
            // A common pattern is <div className="..." ...>
            // We'll try to find the opening tag that contained this class.
            // This is a heuristic.
            
            modified = true;
            neededImports.add(r.import);
        }
    });

    // Actually, manual replacement for a few files is safer than a complex heuristic script.
    // But let's try a simpler approach: just find the files and I'll fix them manually or with targeted replace.

    if (modified) {
        // Clean up double spaces in className
        content = content.replace(/className=" +/g, 'className="');
        content = content.replace(/ +"/g, '"');
        content = content.replace(/  +/g, ' ');

        // Add imports if missing
        const importMatch = content.match(/import\s+{[^}]*}\s+from\s+["']@\/constants\/zIndex["']/);
        if (importMatch) {
            let importStr = importMatch[0];
            neededImports.forEach(imp => {
                if (!importStr.includes(imp)) {
                    importStr = importStr.replace(/}\s+from/, `, ${imp} } from`);
                }
            });
            content = content.replace(importMatch[0], importStr);
        } else {
            const imports = Array.from(neededImports).join(', ');
            content = `import { ${imports} } from "@/constants/zIndex";\n` + content;
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.tsx')) {
            processFile(fullPath);
        }
    });
}

walkDir(rootDir);
console.log("Done.");
