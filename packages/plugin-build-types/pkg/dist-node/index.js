'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var mkdirp = _interopDefault(require('mkdirp'));
var execa = _interopDefault(require('execa'));

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function manifest(manifest) {
  manifest.types = manifest.types || "dist-types/index.d.ts";
}
function build(_x) {
  return _build.apply(this, arguments);
}

function _build() {
  _build = _asyncToGenerator(function* ({
    cwd,
    out,
    reporter,
    manifest
  }) {
    yield _asyncToGenerator(function* () {
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
        yield execa(tscBin, ["-d", "--emitDeclarationOnly", "--declarationMap", "false", "--declarationDir", path.join(out, "dist-types/")], {
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
      const tsc = yield Promise.resolve().then(() => require("typescript"));

      if (tsc && tsc.generateTypesForModule) {
        const nodeImport = yield Promise.resolve().then(() => require(`${importAsNode}`));
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
  });
  return _build.apply(this, arguments);
}

exports.manifest = manifest;
exports.build = build;
