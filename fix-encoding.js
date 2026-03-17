const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'src', 'shared', 'i18n', 'locales', 'es.json');

let content = fs.readFileSync(filePath, 'utf8');

// Fix double-encoded UTF-8 mojibake: UTF-8 bytes were read as Latin-1 then re-encoded to UTF-8
const replacements = [
  // Lowercase accented vowels
  [/Ã¡/g, 'á'],
  [/Ã©/g, 'é'],
  [/Ã\xAD/g, 'í'],
  [/Ã³/g, 'ó'],
  [/Ãº/g, 'ú'],
  // Ñ/ñ
  [/Ã±/g, 'ñ'],
  [/Ã'/g, 'Ñ'],
  // Ü/ü
  [/Ã¼/g, 'ü'],
  // Uppercase accented vowels
  [/Ã"/g, 'Ó'],
  [/Ãš/g, 'Ú'],
  [/Ã‰/g, 'É'],
  // ¿ ¡ °
  [/Â¿/g, '¿'],
  [/Â¡/g, '¡'],
  [/Â°/g, '°'],
  // Em-dash, en-dash
  [/â€"/g, '—'],
  [/â€"/g, '–'],
  // Smart quotes  
  [/â€™/g, '\u2019'],
  [/â€˜/g, '\u2018'],
  [/â€œ/g, '\u201C'],
  // Emoji
  [/ðŸŽ‰/g, '🎉'],
  [/ðŸ"…/g, '📅'],
];

let count = 0;
for (const [pattern, replacement] of replacements) {
  const matches = content.match(pattern);
  if (matches) {
    count += matches.length;
    content = content.replace(pattern, replacement);
  }
}

try {
  JSON.parse(content);
  console.log('Valid JSON. ' + count + ' replacements made.');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('File saved successfully.');
} catch (e) {
  console.log('ERROR: Invalid JSON after fix:', e.message);
}
