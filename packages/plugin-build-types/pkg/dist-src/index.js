import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";
import execa from "execa";
export function manifest(manifest) {
  manifest.types = manifest.types || "dist-types/index.d.ts";
}
export async function build({
  cwd,
  out,
  reporter,
  manifest
}) {
  await (async () => {
    const tscBin = path.join(cwd, "node_modules/.bin/tsc");
    const writeToTypings = path.join(out, "dist-types/index.d.ts");
    const importAsNode = path.join(out, "dist-node", "index.js");

    if (fs.existsSync(path.join(cwd, "index.d.ts"))) {
      mkdirp.sync(path.dirname(writeToTypings));
      fs.copyFileSync(path.join(cwd, "index.d.ts"), writeToTypings);
      return;
    }

    if (fs.existsSync(path.join(cwd, "src", "index.d.ts"))) {
      mkdirp.sync(path.dirname(writeToTypings));
      fs.copyFileSync(path.join(cwd, "src", "index.d.ts"), writeToTypings);
      return;
    }

    if (fs.existsSync(tscBin) && fs.existsSync(path.join(cwd, "tsconfig.json"))) {
      await execa(tscBin, ["-d", "--emitDeclarationOnly", "--declarationMap", "false", "--declarationDir", path.join(out, "dist-types/")], {
        cwd
      });
      return;
    }

    const dtTypesDependency = path.join(cwd, "node_modules", "@types", manifest.name);
    const dtTypesExist = fs.existsSync(dtTypesDependency);

    if (dtTypesExist) {
      fs.copyFileSync(dtTypesDependency, writeToTypings);
      return;
    } // log: we're auto-generating types now


    reporter.info('no type definitions found, auto-generating...');
    const tsc = await import("typescript");

    if (tsc && tsc.generateTypesForModule) {
      const nodeImport = await import(importAsNode);
      const guessedTypes = tsc.generateTypesForModule("AutoGeneratedTypings", nodeImport, {});
      mkdirp.sync(path.dirname(writeToTypings));
      fs.writeFileSync(writeToTypings, guessedTypes);
      return;
    }

    console.error(`
⚠️  dist-types/: Attempted to generate type definitions, but "typescript" package was not found.
                Please install either locally or globally and try again.
       $ pika add --dev typescript
[alt.] $ pika global add typescript
[alt.] *   Write your own type definition file to "index.d.ts"
`);
    throw new Error(`Failed to build: dist-types/`);
  })();
  reporter.created(path.join(out, "dist-types", "index.d.ts"), 'types');
}