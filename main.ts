// Break Production, Own It — postmortem one-liner, entry writer.
//
// The joke lives in one-line.txt. This program only proves the line is
// a single well-formed line under the competition cap, then writes it to
// /output/entry.txt so the sealed scorer can read it. Nothing else.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CAP = 200;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const SOURCE = new URL("./one-line.txt", import.meta.url);

function charCount(text: string): number {
  return [...text].length;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

type Problem = string;
type Rule = (text: string) => Problem | null;

const RULES: Rule[] = [
  (t) => (t.length === 0 ? "line is empty" : null),
  (t) => (charCount(t) > CAP ? `line is ${charCount(t)} chars, cap is ${CAP}` : null),
  (t) => (t !== t.trim() ? "line has leading or trailing space" : null),
  (t) => (t.includes("\r") ? "line carries a carriage return" : null),
  (t) => (t.includes("\n") ? "line spans more than one line" : null),
  (t) => (/\s\s/.test(t) ? "line has a double space" : null),
  (t) => (/[\u0000-\u001f\u007f]/.test(t) ? "line has a control character" : null),
  (t) => ((t.match(/"/g) ?? []).length % 2 !== 0 ? "double quotes are unbalanced" : null),
  (t) => (wordCount(t) < 2 ? "line is a single word, not a postmortem" : null),
  (t) => (!/[a-z]/.test(t) ? "line has no lowercase letter, not a confession" : null),
  (t) => (!/[.!?]$/.test(t) ? "line does not end with punctuation" : null),
];

const line = readFileSync(SOURCE, "utf8").replace(/\r?\n$/, "");

const problems: Problem[] = [];
for (const rule of RULES) {
  const found = rule(line);
  if (found !== null) problems.push(found);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "entry.txt"), `${line}\n`);

console.log(line);
console.log(`OK: ${charCount(line)}/${CAP} characters, ${wordCount(line)} words, one line.`);
