#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import packageJson from './package.json' with { type: 'json' };

const OLD_VERSION = packageJson.version;

async function updateVersion() {
    // Check if version argument is provided
    const newVersion = process.argv[2];
    if (!newVersion) {
        console.error('Please provide a version number as argument');
        console.error('Usage: node bump-version.js VERSION');
        process.exit(1);
    }

    // Function to update file if it exists
    async function updateFile(filename, searchPattern, replacement) {
        try {
            const filePath = join(process.cwd(), filename);
            const fileContent = await readFile(filePath, 'utf8');
            // Create the replacement pattern based on the file type
            const updatedContent = fileContent.replace(searchPattern(OLD_VERSION), replacement(newVersion));
            await writeFile(filePath, updatedContent);
            console.log(`Updated ${filename} version to ${newVersion}`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`Warning: ${filename} not found`);
            } else {
                console.error(`Error updating ${filename}:`, error.message);
            }
        }
    }

    await updateFile(
        'package.json',
        (oldVer) => `"version": "${oldVer}"`,
        (newVer) => `"version": "${newVer}"`,
    );

    await updateFile(
        'src-tauri/tauri.conf.json',
        (oldVer) => `"version": "${oldVer}"`,
        (newVer) => `"version": "${newVer}"`,
    );

    await updateFile(
        'src-tauri/Cargo.toml',
        (oldVer) => `version = "${oldVer}"`,
        (newVer) => `version = "${newVer}"`,
    );
}

try {
    await updateVersion();
} catch (error) {
    console.error(error);
}
