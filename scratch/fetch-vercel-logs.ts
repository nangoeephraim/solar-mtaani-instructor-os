import { spawn } from 'child_process';
import * as fs from 'fs';

const child = spawn('npx', ['vercel', 'logs', 'dpl_4C7puJRR8uJuk4yi9voCEn1ZypNZ'], {
  shell: true
});

let output = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  output += str;
  process.stdout.write(str);
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  output += str;
  process.stderr.write(str);
});

setTimeout(() => {
  console.log("\n[Terminating logs fetcher after 8s]");
  child.kill();
  fs.writeFileSync('scratch/live-logs.txt', output, 'utf8');
  process.exit(0);
}, 8000);
