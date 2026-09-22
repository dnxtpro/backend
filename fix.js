const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'controllers');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.controller.js')) {
    const p = path.join(dir, file);
    let c = fs.readFileSync(p, 'utf8');
    let o = c;

    c = c.replace(/const\s+error\s*=\s*new\s+Error/g, 'const errObj = new Error');
    c = c.replace(/error\.status\s*=\s*500/g, 'errObj.status = 500');
    c = c.replace(/next\(error\)/g, 'next(errObj)');
    
    // Fix any collateral damage to catch (error)
    c = c.replace(/catch\s*\(errObj\)/g, 'catch (error)');

    if (c !== o) {
      fs.writeFileSync(p, c);
      console.log('Fixed', file);
    }
  }
});
