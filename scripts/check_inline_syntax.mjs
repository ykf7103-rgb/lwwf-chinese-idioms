import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (!inlineScripts.length) throw new Error("No inline script found");
for (const source of inlineScripts) new Function(source);
console.log(`Inline JavaScript syntax passed (${inlineScripts.length} script block).`);
