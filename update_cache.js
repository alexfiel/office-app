const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/home/cto/ctoApp/office-app/lib/actions/*.ts');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Add cache import if it doesn't exist and we're going to replace things
    const hasCacheImport = content.includes('import { cache } from "react"') || content.includes("import { cache } from 'react'");
    
    // regex to find export async function getXXX(args) { ...
    const regex = /export\s+async\s+function\s+(get[A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
    
    if (regex.test(content)) {
        if (!hasCacheImport) {
            // insert after use server or imports
            if (content.includes('"use server"')) {
                content = content.replace(/"use server"[;]?\n/, '"use server";\n\nimport { cache } from "react";\n');
            } else {
                content = 'import { cache } from "react";\n' + content;
            }
        }
        
        // reset regex state
        regex.lastIndex = 0;
        
        content = content.replace(regex, (match, funcName, args) => {
            return `export const ${funcName} = cache(async function(${args}) {`;
        });
        
        // Now we need to close the cache function with '});' where the block ends.
        // It's easier to just match the end of the function. But since functions can be long, 
        // regex for matching braces is hard.
        // Wait! We can just use the TypeScript compiler API or babel, or just do it manually with multi_replace_file_content.
    }
});
