const ts = require('typescript');
const fs = require('fs');
const file = 'app/admin/hr/page.tsx';
const text = fs.readFileSync(file, 'utf8');
const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diag = source.parseDiagnostics;
if (!diag.length) {
  console.log('NO_PARSE_ERRORS');
  process.exit(0);
}
for (const d of diag) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  console.log(`${line+1}:${character+1}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  const start = Math.max(0, d.start - 80);
  const end = Math.min(text.length, d.start + 160);
  console.log('CONTEXT:', JSON.stringify(text.slice(start,end).replace(/\r/g,'').replace(/\n/g,'\\n')));
}
