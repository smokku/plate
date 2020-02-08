import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'

module.exports = {
  input: 'src/main.js',
  output: { file: 'bundle.js', format: 'cjs' },
  plugins: [
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    resolve(),
    commonjs(),
  ],
  // these libraries are peer dependencies
  external: ['seamless-immutable', 'normalizr', 'axios']
}
