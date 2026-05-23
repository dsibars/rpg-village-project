.PHONY: build build-web build-app build-debug dev run test clean

# --- Build Targets ---

build: build-web build-app
	@echo "All builds complete!"

build-web:
	@echo "Building RPG Village (web)..."
	@npm run build
	@echo "Web build complete! Output: dist/"

build-app:
	@echo "Building RPG Village (electron app)..."
	@npm run build
	@npm run electron:package
	@echo "App build complete! Check out/ directory."

build-debug:
	@echo "Building RPG Village (debug)..."
	@npm run build:debug
	@echo "Debug build complete! Output: dist/index.html"

# --- Development ---

dev:
	@echo "Starting development server..."
	@npm run dev

run:
	@echo "Starting Electron app from dist/..."
	@npm run electron:run

# --- Testing ---

test:
	@echo "Running RPG Village tests..."
	@echo "Step 1: Running Unit Tests..."
	@node --test tests/unit/*.test.js
	@echo "Step 2: Running Behaviour / Functional Tests..."
	@node --test tests/behaviour/*.test.js
	@echo "All RPG Village tests passed!"

# --- Utility ---

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist out
	@echo "Clean complete."
