const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            arrayOfFiles.push(path.join(dirPath, '/', file));
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Pattern: import { Z_MODAL Z_OVERLAYimport { CloseButton } from ...
    // or: import { Z_MODALinterface Props {
    // We want to match: 'import { ' followed by any number of Z_ constants separated by spaces,
    // then immediately followed by 'import' or 'interface' or 'export' or 'const' or '//' or '/*'.
    
    // Let's use a regex that matches:
    // import\s+\{\s*(?:Z_[A-Z_]+\s*)+(import\s+\{|interface\s+|export\s+|const\s+|//|/\*)
    // And replace it with just the captured group (the 'import {' or 'interface' part).
    
    let regex = /import\s+\{\s*(?:Z_[A-Z_]+\s*)+(import\s+\{|interface\s+|export\s+|const\s+|\/\/|\/\*|@)/g;
    content = content.replace(regex, (match, p1) => {
        return p1;
    });

    // Also match lines that are JUST 'import { Z_MODAL Z_OVERLAY' without any valid syntax.
    let regex2 = /^import\s+\{\s*(?:Z_[A-Z_]+\s*)+$/gm;
    content = content.replace(regex2, '');
    
    // Also match 'import { Z_MODAL Z_OVERLAY;'
    let regex3 = /^import\s+\{\s*(?:Z_[A-Z_]+\s*)+;$/gm;
    content = content.replace(regex3, '');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed syntax:', file);
    }
});
