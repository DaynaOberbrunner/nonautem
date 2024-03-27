'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var babelPluginDynamicImportSyntax = _interopDefault(require('@babel/plugin-syntax-dynamic-import'));
var babelPluginImportMetaSyntax = _interopDefault(require('@babel/plugin-syntax-import-meta'));
var babelPresetEnv = _interopDefault(require('@babel/preset-env'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var rollupBabel = _interopDefault(require('rollup-plugin-babel'));
var types = require('@pika/types');

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

function beforeJob(_x) {
  return _beforeJob.apply(this, arguments);
}

function _beforeJob() {
  _beforeJob = _asyncToGenerator(function* ({
    out
  }) {
    const srcDirectory = path.join(out, "dist-src/");

    if (!fs.existsSync(srcDirectory)) {
      throw new types.MessageError('"dist-src/" does not exist, or was not yet created in the pipeline.');
    }

    const srcEntrypoint = path.join(out, "dist-src/index.js");

    if (!fs.existsSync(srcEntrypoint)) {
      throw new types.MessageError('"dist-src/index.js" is the expected standard entrypoint, but it does not exist.');
    }
  });
  return _beforeJob.apply(this, arguments);
}

function manifest(manifest) {
  manifest.module = manifest.module || 'dist-web/index.js';
}
function build(_x2) {
  return _build.apply(this, arguments);
}

function _build() {
  _build = _asyncToGenerator(function* ({
    out,
    rollup,
    reporter
  }) {
    const writeToWeb = path.join(out, 'dist-web', 'index.js');
    const srcBundle = yield rollup('web', {
      plugins: [rollupBabel({
        babelrc: false,
        compact: false,
        presets: [[babelPresetEnv, {
          modules: false,
          targets: {
            esmodules: true
          },
          spec: true
        }]],
        plugins: [babelPluginDynamicImportSyntax, babelPluginImportMetaSyntax]
      })],
      onwarn: (warning, defaultOnWarnHandler) => {
        // // Unresolved external imports are expected
        if (warning.code === 'UNRESOLVED_IMPORT' && !(warning.source.startsWith('./') || warning.source.startsWith('../'))) {
          return;
        }

        defaultOnWarnHandler(warning);
      }
    });
    yield srcBundle.write({
      file: writeToWeb,
      format: 'esm',
      exports: 'named'
    });
    reporter.created(writeToWeb, 'module');
  });
  return _build.apply(this, arguments);
}

exports.beforeJob = beforeJob;
exports.manifest = manifest;
exports.build = build;
