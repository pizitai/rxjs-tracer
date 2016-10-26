'use strict'
import * as path from 'path'
import * as fs from 'fs'
const rollup = require('rollup')
const nodeResolve = require('rollup-plugin-node-resolve')
const alias = require('rollup-plugin-alias')
const commonjs = require('rollup-plugin-commonjs')
const compiler = require('google-closure-compiler-js').compile

export function bundle (entry: string, output: string, name: string, ise2e?: boolean) {
  let plugins: any[]
  if (!ise2e) {
    plugins = [
      alias({
        // 'isomorphic-fetch': path.join(process.cwd(), 'node_modules/whatwg-fetch/fetch.js'),
        // 'engine.io-client': path.join(process.cwd(), 'node_modules/engine.io-client/engine.io.js')
      }),
      nodeResolve({
        jsnext: false,
        main: true
      }),
      commonjs({
        exclude: [ 'dist/es6/**' ]
      })
    ]
  }
  rollup.rollup({
    entry: entry,
    plugins: plugins
  })
    .then(bundle => {
      const code = bundle.generate({
        format: 'umd',
        moduleName: name,
        globals: {
          'rx-tracer': 'rxtracer'
        }
      }).code

      return code
    })
    .then(code => {
      return write(path.resolve(process.cwd(), output), code)
    })
    .then(() => {
      const source = fs.readFileSync(path.resolve(process.cwd(), output), 'utf8')
      const compilerFlags = {
        jsCode: [{src: source}],
        compilationLevel: 'ADVANCED',
        languageIn: 'ES5',
        createSourceMap: true,
      }
      const result: any = compiler(compilerFlags)
      const minPath = `dist/bundle/${output.split('/').pop().split('.')[0]}.min.js`
      const code = result.compiledCode
      fs.writeFileSync(minPath, code, 'utf8')
      fs.writeFileSync(`${minPath}.map`, result.sourceMap, 'utf8')
      console.log(blue(minPath) + ' ' + getSize(code))
    })
    .catch(e => console.error(e.stack))
}

export function write (dest: string, code: string) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(blue(dest) + ' ' + getSize(code))
      resolve()
    })
  })
}

function getSize (code: string): string {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function blue (str: string): string {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
