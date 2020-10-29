/*jslint node */
"use strict";

const {parsers} = require("./parser-babel.js");
const fs = require("fs");

fs.readFile(process.argv[2], "utf8", function (err, file) {
    if (err) {
        console.error(err);
        return process.exit(1);
    }

    const ast = parsers.babel.parse(file);

    const keys_to_ignore = [
        "tokens",
        "start",
        "end",
        "loc",
        "range"
    ];
    function replacer(key, value) {
        return (
            keys_to_ignore.includes(key)
            ? undefined
            : value
        );
    }
    return process.stdout.write(
        JSON.stringify(ast, replacer, "    ") + "\n",
        "utf8"
    );
});

