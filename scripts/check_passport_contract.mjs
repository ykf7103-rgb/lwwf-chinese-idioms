import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("passport-integration.js", "utf8");
for (const value of [
  '"lwwf-chinese-idioms"',
  '"lwwf-progress/v2"',
  '"idiom-master-p5-2026.08-v1"',
  '"idiom-v1:start:p5"',
  '"idiom-v1:mission:"',
  '"teacher-evidence/v1"',
  '"meaning-recognition"',
  '"context-application"',
  '"misuse-detection"',
  '"value-connection"',
  '"sentence-writing"',
]) assert.ok(source.includes(value), `Missing contract value ${value}`);

assert.match(source, /taskId:\s*PASSPORT_START_TASK_ID[\s\S]*?completed:\s*false[\s\S]*?score:\s*0[\s\S]*?coins:\s*0/);
assert.match(source, /action:\s*"start_learning"/);
assert.match(source, /activityType:\s*"idiom-learning-start"/);
assert.match(source, /action:\s*"complete_task"/);
assert.match(source, /activityType:\s*"idiom-mission"/);
assert.match(source, /passportProgressQueue\s*=\s*passportProgressQueue/);
console.log("Passport idiom contract scan passed.");
