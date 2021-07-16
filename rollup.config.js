import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import autoPreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'ui/rdb/index.ts',
    output: {
        dir: "dist/ui/rdb",
        sourcemap: true,
        format: 'iife',
        name: 'app'
    },
    plugins: [
        css({
            output: 'bundle.css'
        }),
        svelte({
            compilerOptions: {
                dev: !production
            },
            preprocess: autoPreprocess()
        }),
        typescript({
            tsconfig: "./ui/tsconfig.json",
            sourceMap: true
        }),

        // If you have external dependencies installed from
        // npm, you'll most likely need these plugins. In
        // some cases you'll need additional configuration -
        // consult the documentation for details:
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        resolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser()
    ],
    watch: {
        clearScreen: false
    }
};
