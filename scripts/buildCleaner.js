const fs = require('fs');
const curr = fs.readFileSync('./dist/buildJekyll.js', 'utf-8');
const next = curr.replaceAll('react/jsx-runtime', 'preact/jsx-runtime');
fs.writeFileSync('./dist/buildJekyll.js', next);

