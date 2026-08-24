import assert from "node:assert/strict";
import fs from "node:fs";

const files = ["index.html", "passport-integration.js"];
const content = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const checks = [
  ["browser persistence", /\b(?:localStorage|sessionStorage|indexedDB)\b/i],
  ["child login UI", /type=["']password["']|studentPassword|teacherPassword|studentLogin|teacherLogin/i],
  ["embedded roster or digest", /\bpwdHash\b|(?:const|let|var)\s+STUDENTS\s*=|["'][a-f0-9]{64}["']/i],
  ["legacy child credential", /AUTH_KEY|sessionToken|lwwfToken|Authorization/i],
  ["direct student database", /supabase|student_scores|student_edx|\.from\s*\(/i],
  ["student-side AI route", /WORKER_URL|systemPrompt|lwwf-math-ai\.lwwfaiteams|messages\s*:\s*\[/i],
];

const violations = [];
for (const [label, pattern] of checks) {
  for (const file of files) if (pattern.test(content[file])) violations.push(`${label}: ${file}`);
}
if (violations.length) {
  console.error(`Sensitive-boundary scan failed with ${violations.length} violation(s).`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

assert.match(content["index.html"], /lwwf-passport-sdk\.js/);
assert.match(content["index.html"], /data-feedback-widget="true"/);
assert.doesNotMatch(content["index.html"], /lwwf-passport-sdk\.js[\s\S]{0,280}\bdefer\b/i);
assert.match(content["passport-integration.js"], /passport\.init/);
assert.match(content["passport-integration.js"], /LWWFPassport\.recordProgress/);
assert.match(content["passport-integration.js"], /studentView\?\.synthetic === true/);
assert.match(content["passport-integration.js"], /sandboxMode: isReadOnlyPreview\(\) \? "memory-only"/);
console.log(`Sensitive-boundary scan passed for ${files.length} deployment files.`);
