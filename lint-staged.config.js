export default {
    '*.{js,ts,tsx,vue,html,css,json,yml,yaml}': ['oxfmt --no-error-on-unmatched-pattern'],
    '*.{js,ts,tsx,vue}': ['oxlint --fix', 'eslint --fix'],
    '*.rs': () => ['cargo +nightly fmt --manifest-path src-tauri/Cargo.toml'],
};
