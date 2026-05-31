#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

function parseArgs() {
    const args = process.argv.slice(2).filter((arg) => arg !== '--');
    if (args.length !== 1 || args[0].startsWith('--')) {
        throw new Error('Usage: node bump-version.js VERSION');
    }

    return {
        version: args[0],
    };
}

function replaceAll(content, replacements) {
    return replacements.reduce(
        (updatedContent, [search, replacement]) => updatedContent.replace(search, replacement),
        content,
    );
}

async function updateFile(path, replacements) {
    const content = await readFile(path, 'utf8');
    await writeFile(path, replaceAll(content, replacements));
    console.log(`Updated ${path}`);
}

async function main() {
    const options = parseArgs();

    await updateFile('package.json', [[/^(\s*"version":\s*")[^"]+(")/m, `$1${options.version}$2`]]);
    await updateFile('src-tauri/tauri.conf.json', [
        [/^(\s*"version":\s*")[^"]+(")/m, `$1${options.version}$2`],
    ]);
    await updateFile('src-tauri/Cargo.toml', [
        [/^version = "[^"]+"/m, `version = "${options.version}"`],
    ]);
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
