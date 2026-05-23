# Developer Workflow & Testing Guidelines

## Local Testing

### Web Build (Static HTML)

To test the web version locally:

```bash
make build-web
```

Then open `dist/index.html` directly in your browser via `file://` protocol:

```
file:///absolute/path/to/project/dist/index.html
```

This tests the exact compiled bundle that will be used for web distribution.

### Electron App (Desktop)

To test the desktop version locally:

```bash
make run
```

This launches the Electron app loading `dist/index.html` via `file://` protocol.

### Development Server (Hot Reload)

For rapid iteration during development, you can use Vite's dev server:

```bash
make dev
```

This starts `vite` on `http://localhost:5173` with hot module replacement. Note that the Electron app (`make run`) loads the static `dist/` build, not the dev server.

### Running Tests

```bash
make test
```

Runs all unit and behaviour tests via `node --test`.

### Cleaning Build Artifacts

```bash
make clean
```

Removes `dist/` and `out/` directories.

---

## Build Targets Reference

| Command | Output | Purpose |
|---------|--------|---------|
| `make build-web` | `dist/index.html` + `dist/assets/` | Static web build |
| `make build-app` | `dist/` + `out/` | Electron packaged app |
| `make build` | Both of the above | Full production build |
| `make build-debug` | `dist/index.html` (unminified) | Debug web build |
| `make run` | Electron window | Test desktop app |
| `make dev` | `localhost:5173` | Web dev server |
| `make test` | Test results | Run all tests |
| `make clean` | — | Remove build artifacts |
