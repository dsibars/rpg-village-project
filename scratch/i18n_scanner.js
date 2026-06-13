import fs from 'fs';
import path from 'path';

const TRANSLATIONS_DIR = './js/engine/shared/core/i18n/translations';
const UX_DIR = './ux';

// Load translation files and extract keys
function loadTranslations() {
  const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.js'));
  const translations = {};
  
  for (const file of files) {
    const lang = path.basename(file, '.js');
    const content = fs.readFileSync(path.join(TRANSLATIONS_DIR, file), 'utf8');
    const keys = new Set();
    
    // Simple regex to extract keys: key_name: "value" or key_name: 'value' or key_name: `value`
    const regex = /^\s*([a-zA-Z0-9_]+)\s*:/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1] !== 'export' && match[1] !== 'const') {
        keys.add(match[1]);
      }
    }
    
    translations[lang] = keys;
  }
  
  return translations;
}

// Find all .vue files recursively
function getVueFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getVueFiles(filePath));
    } else if (file.endsWith('.vue')) {
      results.push(filePath);
    }
  }
  return results;
}

// Scan a Vue file for i18n usage and hardcoded texts
function scanVueFile(filePath, allKeysMap) {
  const content = fs.readFileSync(filePath, 'utf8');
  const reports = {
    file: filePath,
    missingKeys: [],
    hardcodedTexts: []
  };

  // 1. Extract t(...) keys
  const tRegex = /\bt\(\s*(['"`])(.*?)\1/g;
  let tMatch;
  const usedKeys = new Set();
  while ((tMatch = tRegex.exec(content)) !== null) {
    usedKeys.add(tMatch[2]);
  }

  // Check if used keys exist in translations
  for (const key of usedKeys) {
    for (const [lang, keys] of Object.entries(allKeysMap)) {
      if (!keys.has(key)) {
        reports.missingKeys.push({ key, lang });
      }
    }
  }

  // 2. Scan for hardcoded texts in template section
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    const template = templateMatch[1];
    
    // Remove comments
    const cleanTemplate = template.replace(/<!--[\s\S]*?-->/g, '');

    // Check tags text content
    // Find text between tags that contains letters but isn't a mustache expression or script/style
    // We can split by tag boundaries '<' and '>' and examine the text portions.
    const parts = cleanTemplate.split(/(<[^>]+>)/);
    let lineNum = 1;
    
    for (const part of parts) {
      if (!part) continue;
      
      // Update line count
      const newlines = part.match(/\n/g);
      const linesAdded = newlines ? newlines.length : 0;
      
      if (part.startsWith('<')) {
        // It's a tag, search for hardcoded attribute values like placeholder="...", title="..."
        // where the value does not come from a binding (i.e. not prepended with ':')
        const attrRegex = /\b(placeholder|title|label|alt|subtitle|headline|text)\s*=\s*(['"])(.*?)\2/gi;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(part)) !== null) {
          const attrName = attrMatch[1];
          const attrVal = attrMatch[3].trim();
          // If it contains letters and is not translation key format, and doesn't look like variable name
          if (attrVal && /[a-zA-Z]/.test(attrVal) && !attrVal.includes('{{') && !attrVal.includes('}}')) {
            reports.hardcodedTexts.push({
              type: 'attribute',
              name: attrName,
              value: attrVal,
              line: lineNum
            });
          }
        }
      } else {
        // It's text content between tags. Let's analyze it
        // Remove mustache expressions first to check what's left
        const textOnly = part.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
        
        // If it contains alphanumeric characters, it might be hardcoded text
        // But ignore simple symbols or punctuation or empty strings
        if (textOnly && /[a-zA-Z]/.test(textOnly)) {
          // Exclude text that consists entirely of whitespace/newlines/symbols
          reports.hardcodedTexts.push({
            type: 'text_node',
            value: textOnly.replace(/\s+/g, ' '),
            line: lineNum
          });
        }
      }
      
      lineNum += linesAdded;
    }
  }

  return reports;
}

function run() {
  console.log('Loading translations...');
  const translations = loadTranslations();
  console.log('Languages found:', Object.keys(translations));
  console.log('Translation keys count:', Object.fromEntries(
    Object.entries(translations).map(([l, keys]) => [l, keys.size])
  ));

  console.log('\nScanning Vue components...');
  const vueFiles = getVueFiles(UX_DIR);
  console.log(`Found ${vueFiles.length} Vue files.`);

  const allMissing = [];
  const allHardcoded = [];

  for (const file of vueFiles) {
    const report = scanVueFile(file, translations);
    if (report.missingKeys.length > 0) {
      allMissing.push({ file: report.file, keys: report.missingKeys });
    }
    if (report.hardcodedTexts.length > 0) {
      allHardcoded.push({ file: report.file, texts: report.hardcodedTexts });
    }
  }

  // Find keys present in some languages but missing in others (cross-language consistency)
  const allKeySet = new Set();
  for (const keys of Object.values(translations)) {
    for (const k of keys) {
      allKeySet.add(k);
    }
  }

  const crossLanguageMissing = [];
  for (const key of allKeySet) {
    const missingIn = [];
    for (const [lang, keys] of Object.entries(translations)) {
      if (!keys.has(key)) {
        missingIn.push(lang);
      }
    }
    if (missingIn.length > 0) {
      crossLanguageMissing.push({ key, missingIn });
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`\n1. Missing Translation Keys Used in Vue Components: ${allMissing.length} files`);
  for (const item of allMissing) {
    console.log(`\nFile: ${item.file}`);
    for (const k of item.keys) {
      console.log(`  - Key "${k.key}" is missing in language "${k.lang}"`);
    }
  }

  console.log(`\n2. Cross-Language Key Mismatches (Defined in some files but missing in others): ${crossLanguageMissing.length} keys`);
  for (const item of crossLanguageMissing) {
    console.log(`  - Key "${item.key}" is missing in: ${item.missingIn.join(', ')}`);
  }

  console.log(`\n3. Hardcoded English Texts in Templates: ${allHardcoded.length} files`);
  for (const item of allHardcoded) {
    console.log(`\nFile: ${item.file}`);
    for (const t of item.texts) {
      if (t.type === 'attribute') {
        console.log(`  - Line ~${t.line}: Hardcoded attribute "${t.name}" = "${t.value}"`);
      } else {
        console.log(`  - Line ~${t.line}: Hardcoded text node: "${t.value}"`);
      }
    }
  }
}

run();
