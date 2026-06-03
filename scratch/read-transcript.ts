import * as fs from 'fs';
import * as path from 'path';

const logPath = 'C:/Users/DELL/.gemini/antigravity/brain/61365aa5-6a04-4412-a657-c98520944e22/.system_generated/logs/transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const contentText = obj.content || '';
      if (contentText.includes("Sally Engine — Configuration")) {
        console.log("FOUND BLUEPRINT MATCH:");
        console.log("==========================================");
        console.log(contentText);
        console.log("==========================================");
        break;
      }
    } catch (e) {
      // Ignored parsing errors
    }
  }
} catch (err: any) {
  console.error("Error reading transcript:", err.message);
}
