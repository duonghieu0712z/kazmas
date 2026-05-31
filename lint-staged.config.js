import picomatch from 'picomatch';

const ignorePatterns = ['src/generated/**'];

const isIgnored = picomatch(ignorePatterns, { dot: true });

const normalizePath = (file) => {
    const path = file.replaceAll('\\', '/');
    const cwd = process.cwd().replaceAll('\\', '/');

    return path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : path;
};

const shouldIgnore = (file) => isIgnored(normalizePath(file));

const filterFiles = (files) => files.filter((file) => !shouldIgnore(file));

const quotePath = (file) => `"${file.replaceAll('"', '\\"')}"`;

const createCommand = (command, files) => `${command} ${files.map(quotePath).join(' ')}`;

export default {
    '*.{js,ts,tsx,vue,html,css,json,yml,yaml}': (files) => {
        const filtered = filterFiles(files);
        return filtered.length > 0
            ? [createCommand('oxfmt --no-error-on-unmatched-pattern', filtered)]
            : [];
    },
    '*.{js,ts,tsx,vue}': (files) => {
        const filtered = filterFiles(files);
        return filtered.length > 0
            ? [createCommand('oxlint --fix', filtered), createCommand('eslint --fix', filtered)]
            : [];
    },
    '*.rs': () => ['cargo +nightly fmt --manifest-path src-tauri/Cargo.toml'],
};
