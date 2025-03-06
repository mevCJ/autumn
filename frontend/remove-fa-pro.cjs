const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Regex patterns
const proIconImportPattern = /@fortawesome\/pro-[^'"]+-svg-icons/g;
const proIconUsagePattern = /\bfa[A-Z][a-zA-Z]+ as \w+|\bfa[A-Z][a-zA-Z]+(?=[\s,}])/g;

async function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      fileList = await findFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      (filePath.endsWith('.ts') || 
       filePath.endsWith('.tsx') || 
       filePath.endsWith('.js') || 
       filePath.endsWith('.jsx'))
    ) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// ... existing code ...

async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let modified = false;
    
    // Check if file contains pro icon imports or usage
    if (proIconImportPattern.test(content) || proIconUsagePattern.test(content)) {
      console.log(`Processing: ${filePath}`);
      
      // Replace pro icon imports with faStripe import
      let newContent = content.replace(
        /import\s+{[^}]*}\s+from\s+['"]@fortawesome\/pro-[^'"]+['"]\s*;?\n?/g,
        'import { faStripe } from "@fortawesome/free-brands-svg-icons";\n'
      );
      
      // Replace all pro icon usages with faStripe
      newContent = newContent.replace(proIconUsagePattern, 'faStripe');
      
      // Log found pro icons for reference
      const matches = content.match(proIconUsagePattern);
      if (matches) {
        console.log(`Replacing icons in ${filePath}:`, matches);
      }
      
      if (newContent !== content) {
        await writeFile(filePath, newContent);
        modified = true;
        console.log(`Modified: ${filePath}`);
      }
    }
    
    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// ... existing code ...

async function main() {
  const rootDir = process.cwd();
  console.log('Scanning directory:', rootDir);
  
  const files = await findFiles(rootDir);
  console.log(`Found ${files.length} files to scan`);
  
  let modifiedCount = 0;
  for (const file of files) {
    const wasModified = await processFile(file);
    if (wasModified) modifiedCount++;
  }
  
  console.log(`\nSummary:`);
  console.log(`Total files scanned: ${files.length}`);
  console.log(`Files modified: ${modifiedCount}`);
  console.log('\nPlease review the changes and update any remaining pro icon references manually.');
}

main().catch(console.error);