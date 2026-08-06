const fs = require('fs');
const p = 'C:/Users/yao/Documents/Ai美妆/cloudflare-worker/functions/index.ts';
let c = fs.readFileSync(p, 'utf8');

// Fix import line to also import AnalysisTaskWorker class
c = c.replace(
  "import { handleProcessAnalysisTasks, handleAnalysisTaskStats } from '../services/tasks/AnalysisTaskWorker';",
  "import { handleProcessAnalysisTasks, handleAnalysisTaskStats, AnalysisTaskWorker } from '../services/tasks/AnalysisTaskWorker';"
);

// Remove dynamic import lines (they will use the statically imported class)
c = c.replace(/    const \{ AnalysisTaskWorker \} = await import\("\.\/\.\/services\/tasks\/AnalysisTaskWorker"\);\n/g, '');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed');
