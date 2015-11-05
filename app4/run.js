#!/usr/bin/env node

var fs = require('fs');
var spawn = require('child_process').spawn;
var webpack = require('webpack');
var optimist = require('optimist');
var replaceStream = require('replacestream');

var webpackConfig = require('./webpack.config.js');

var optsParser = optimist.boolean("watch").alias("watch", "w").describe("watch");
var opts = optsParser.argv;

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch (e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}
ensureDir('./lib');
ensureDir('./built');


var babelArgs = 'src -d lib';
if (opts.watch) {
  babelArgs += ' -w';
}
var babelProc = spawn('babel', babelArgs.split(' '));
var babelSilence = replaceStream(/\[BABEL\].*Custom module formatters are deprecated.*\n/g, '');
babelProc.stdout.pipe(babelSilence).pipe(process.stdout);
babelProc.stderr.pipe(babelSilence).pipe(process.stderr);

var lastHash = null;
function handleWebpackResult(err, stats) {
  if (err) {
    lastHash = null;
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    if(! opts.watch) {
      process.on("exit", function() {
        process.exit(1);
      });
    }
  } else {
    if (stats.hash !== lastHash) {
      lastHash = stats.hash;
      process.stdout.write(stats.toString({
        modules: false,
        chunkModules: false
      }) + "\n");

      emitLESSFakes(listLESSFiles(stats));
    }
  }
}

function listLESSFiles(stats) {
  var lessFiles = [];
  var modules = stats.toJson({
    source: false,
    chunks: false,
    reasons: false
  }).modules;
  modules.forEach(function (m) {
    var match = /\.\/src\/(.*)\.less$/.exec(m.name);
    if (match) {
      lessFiles.push(match[1]);
    }
  });
  return lessFiles;
}

function emitLESSFakes(files) {
  files.forEach(function (f) {
    fs.writeFileSync('./lib/' + f + '.less.js', '');
  });
}

var compiler = new webpack(webpackConfig);

if (opts.watch) {
  compiler.watch({}, handleWebpackResult);
} else {
  compiler.run(handleWebpackResult);
}
