'use strict';

const ora = require('ora');
const consola = require('consola');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ora__default = /*#__PURE__*/_interopDefaultCompat(ora);
const consola__default = /*#__PURE__*/_interopDefaultCompat(consola);

const a = 1;

consola__default.info("Using consola 3.0.0");
consola__default.start("Building project...");
consola__default.warn("A new version of consola is available: 3.0.1");
consola__default.success("Project built!");
consola__default.error(new Error("This is an example error. Everything is fine!"));
consola__default.box("I am a simple box");
consola__default.prompt("Deploy to the production?", {
  type: "confirm"
});
const spinner = ora__default("Loading unicorns").start();
setTimeout(() => {
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
  spinner.clear();
}, 1e3);
console.log(a);
