import * as $ from "@dz/-";
import { fs } from "@dz/-/node";
import { glob } from "glob";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const Path = {
  npm: fs.PathBuilder(__dirname, ".."),
  org: fs.PathBuilder(process.env["DZ_ORG_DIR"] || "~/.org"),
  get docs() {
    return Path.npm.partial("docs");
  },
  get db() {
    return Path.docs.partial("db");
  },
  get notes() {
    return Path.org.partial("notes");
  },
};

async function main() {
  const globs = [Path.notes("**", "*.org")];
  const allFilenameGroups = await Promise.all(globs.map((s) => glob(s)));
  const allFilenames = [
    ...new Set(allFilenameGroups.flatMap((group) => group)),
  ].filter(
    (filename) =>
      !/vodReview\//.test(filename) || /vodReview\/dz/.test(filename),
  );
  const notes = {};
  for (const filename of allFilenames) {
    const content = await fs.readFile(filename, "utf8");
    const path = filename.substring(Path.notes().length);
    notes[path] = content;
  }
  await fs.spit(Path.db("notes.json"), notes);
  console.log(Path.db("notes"));
  console.log($.enc({ a: 1, b: [2, { c: 3 }] }));
}

$.execAndExit(main());
