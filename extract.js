const fs = require('fs');
const c = fs.readFileSync('kappi-2-order.html', 'utf8');
const scriptStart = c.lastIndexOf('<script type="module">');
const scriptEnd = c.lastIndexOf('</script>');
const script = c.substring(scriptStart + 22, scriptEnd);
// Get the last 40000 chars which has the app logic
const appPart = script.substring(Math.max(0, script.length - 40000));
fs.writeFileSync('app-extracted.js', appPart);
console.log('Extracted', appPart.length, 'chars to app-extracted.js');
