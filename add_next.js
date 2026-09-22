const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

fs.readdirSync(controllersDir).forEach(file => {
  if (file.endsWith('.controller.js')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // add next parameter
    content = content.replace(/async\s*\(\s*req\s*,\s*res\s*\)/g, 'async (req, res, next)');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Added next to', file);
    }
  }
});
