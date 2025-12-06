const fs = require('fs');
const filePath = '/Users/susp3kt/.gemini/antigravity/scratch/myfleet/web/app/dashboard/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add cancel button after first completion button (overview)
content = content.replace(
  /(task\.status === 'ACCEPTED' && \(\s*<div className="mt-4">\s*<button[^>]*onClick[^>]*setTaskToComplete[^>]*>[^<]*<\/button>\s*<\/div>\s*\)\s*<\/div>\s*\)\)}\s*<\/div>\s*<\/div>\s*\)\s*}\s*\{activeTab === 'tasks')/,
  `$1`
);

fs.writeFileSync(filePath, content);
console.log('Updated successfully');
