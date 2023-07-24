'use strict';

var ora = require('ora');
var consola = require('consola');

consola.info('Using consola 3.0.0');
consola.start('Building project...');
consola.warn('A new version of consola is available: 3.0.1');
consola.success('Project built!');
consola.error(new Error('This is an example error. Everything is fine!'));
consola.box('I am a simple box');
consola.prompt('Deploy to the production?', {
    type: 'confirm',
});
const spinner = ora('Loading unicorns').start();
setTimeout(() => {
    spinner.color = 'yellow';
    spinner.text = 'Loading rainbows';
}, 1000);
