const fs = require('fs');
const path = require('path');

const zConstants = [
    'Z_ERROR_BOUNDARY', 'Z_TOAST', 'Z_LIGHTBOX_CLOSE', 'Z_LIGHTBOX_CONTENT',
    'Z_LIGHTBOX', 'Z_OVERLAY', 'Z_OVERLAY_BACKDROP', 'Z_ADMIN_MODAL_TOP',
    'Z_ADMIN_MODAL_NESTED', 'Z_ADMIN_MODAL', 'Z_MODAL_NESTED', 'Z_MODAL',
    'Z_DROPDOWN', 'Z_FLOATING_PANEL'
];

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

    // 1. Clean broken Z_ imports.
    // Many are like: import { Z_MODAL Z_OVERLAYinterface Props {
    // We regex match any line containing 'import { Z_' that doesn't have 'from' or '}'
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('import {') && line.includes('Z_')) {
            // It's a broken zIndex import line from previous bad sed/replace
            if (!line.includes('from') || !line.includes('}')) {
                // Remove the 'import { Z_... ' part
                let cleaned = line.replace(/import\s+\{\s*/, '');
                // Remove all Z_ constants from this line
                zConstants.forEach(c => {
                    let regex = new RegExp(c + '\\\s*', 'g');
                    cleaned = cleaned.replace(regex, '');
                });
                
                cleaned = cleaned.trim();
                
                // If the cleaned line starts with something weird that we need to keep
                if (cleaned.startsWith('}')) cleaned = cleaned.substring(1).trim();
                if (cleaned.startsWith('from')) {
                    cleaned = ''; // It was just a broken import
                }
                if (cleaned === ';' || cleaned === '') {
                    lines[i] = '';
                } else {
                    lines[i] = cleaned;
                }
            }
        }
    }
    content = lines.join('\n');

    // Remove any valid-looking zIndex imports to recreate them correctly and deduplicate
    content = content.replace(/import\s+\{[^}]*\}\s+from\s+['\"'][^'\"]*zIndex['\"];?/g, '');

    // Now scan for used Z_ constants
    let usedZ = zConstants.filter(c => {
        let regex = new RegExp('\\b' + c + '\\b');
        return regex.test(content);
    });

    if (usedZ.length > 0) {
        let newImport = 'import { ' + usedZ.join(', ') + ' } from \'@/constants/zIndex\';\n';
        content = newImport + content;
    }
    
    // Fix missing UI components
    if (/\\bCloseButton\\b/.test(content) && !/import.*CloseButton.*from/.test(content)) {
        content = 'import { CloseButton } from \'@/components/ui/controls/CloseButton\';\n' + content;
    }
    if (/\\bDeleteConfirmationModal\\b/.test(content) && !/import.*DeleteConfirmationModal.*from/.test(content)) {
        content = 'import { DeleteConfirmationModal } from \'@/components/common/DeleteConfirmationModal\';\n' + content;
    }
    
    // Fix missing hooks
    if (/\\buseGlobalModalEscape\\b/.test(content) && !/import.*useGlobalModalEscape.*from/.test(content)) {
        content = 'import { useGlobalModalEscape } from \'@/hooks/useGlobalModalEscape\';\n' + content;
    }
    
    // Fix missing types
    const typeImports = [
        { name: 'User', path: '@/types/users' },
        { name: 'PointOfInterest', path: '@/types/index' },
        { name: 'CitySummary', path: '@/types/index' },
        { name: 'Review', path: '@/types/index' },
        { name: 'DiaryDay', path: '@/types/index' },
        { name: 'PhotoSubmission', path: '@/types/index' }
    ];
    
    typeImports.forEach(t => {
        if (new RegExp('\\b' + t.name + '\\b').test(content) && !new RegExp('import.*\\b' + t.name + '\\b.*from').test(content)) {
            // Also ensure we aren't adding it if it's declared in the same file
            if (!new RegExp('interface\\s+' + t.name + '\\b').test(content) && !new RegExp('type\\s+' + t.name + '\\b').test(content)) {
                content = 'import type { ' + t.name + ' } from \'' + t.path + '\';\n' + content;
            }
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
});
