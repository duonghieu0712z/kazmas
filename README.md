# Kazmas

## Setup

Install Node.js, pnpm, Rust, and the Tauri system dependencies for your operating system. This project requires Node.js `>=22.12.0`.

On Ubuntu/Debian, install the Tauri Linux dependencies:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

Install project dependencies:

```bash
pnpm install
```

## Local Development

Run the desktop app in development mode:

```bash
pnpm start
```

## Build

Build the full Tauri desktop app locally:

```bash
pnpm make
```

The generated installers and bundles are written under `src-tauri/target/release/bundle/`.

## Lint and Format

Check formatting and linting:

```bash
pnpm format
pnpm lint
```

Apply automatic fixes:

```bash
pnpm format:fix
pnpm lint:fix
```

## Version

Bump the app version:

```bash
pnpm bump 0.1.0
```

The version script updates `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.

## License

Licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT License ([LICENSE-MIT](LICENSE-MIT))

at your option.
