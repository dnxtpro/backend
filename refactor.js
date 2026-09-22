const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We split by "catch (" and then find the corresponding closing brace.
  const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{/g;
  let match;
  let newContent = '';
  let lastIndex = 0;

  while ((match = catchRegex.exec(originalContent)) !== null) {
    const errVarName = match[1];
    const startIndex = match.index + match[0].length;
    
    // find the closing brace for this catch block
    let openBraces = 1;
    let endIndex = startIndex;
    while (endIndex < originalContent.length && openBraces > 0) {
      if (originalContent[endIndex] === '{') openBraces++;
      if (originalContent[endIndex] === '}') openBraces--;
      endIndex++;
    }

    // Now we have the catch block content between startIndex and endIndex-1
    let catchContent = originalContent.substring(startIndex, endIndex - 1);
    
    // Replace res.status(500) inside catchContent
    // This handles both return res.status(500) and res.status(500)
    catchContent = catchContent.replace(/(?:return\s+)?res\.status\(500\)\.(?:send|json)\(\s*\{([\s\S]*?)\}\s*\);?/g, (fullMatch, payload) => {
      // payload is the object inside send/json
      if (payload.includes(`${errVarName}.message`)) {
        return `next(${errVarName});`;
      } else {
        const msgMatch = payload.match(/(?:message|error):\s*['"](.+?)['"]/);
        if (msgMatch) {
          return `const error = new Error('${msgMatch[1]}');\n    error.status = 500;\n    next(error);`;
        } else {
          return `next(${errVarName});`;
        }
      }
    });

    newContent += originalContent.substring(lastIndex, startIndex) + catchContent + '}';
    lastIndex = endIndex;
  }
  newContent += originalContent.substring(lastIndex);

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

fs.readdirSync(controllersDir).forEach(file => {
  if (file.endsWith('.controller.js')) {
    processFile(path.join(controllersDir, file));
  }
});
