#!/usr/bin/env node

const { compile } = require('nexe')


console.log('Building Executable for OSX x64')
compile({
  input: './tiddlywiki.js',
  output: 'tiddlywiki.command',
  targets: 'mac-x64',
  resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
}).then(() => {
  console.log('done')
}).catch((e) => {console.log('error?', e)})

