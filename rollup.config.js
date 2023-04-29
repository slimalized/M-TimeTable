import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default {
    input: "content.js",
    output: {
        file: "dist/content.js",
        format: "esm"
    },
    plugins: [
        copy({
            targets: [
                { src: "notice-icons", dest: "dist"},
                { src: "extension-icons", dest: "dist"},
                { src: "manifest.json", dest: "dist"},
                { src: "style/style.css", dest: "dist/style"}
            ]
        }),
        nodeResolve({ jsnext: true}),
        commonjs()
    ]
}