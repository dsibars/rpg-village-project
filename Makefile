-include itch.config

.PHONY: build build-web build-app build-debug dev run test clean deploy-itch


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

# --- Deployment ---

deploy-itch: build-web
	@if [ -z "$(ITCH_USER)" ] || [ "$(ITCH_USER)" = "your-itch-username-here" ]; then \
		echo "Error: ITCH_USER is not configured."; \
		echo "Please copy 'itch.config.example' to 'itch.config' and set your Itch.io username/game slug."; \
		exit 1; \
	fi
	@echo "Zipping web build..."
	@python3 -c "import shutil; shutil.make_archive('rpg-village-web', 'zip', 'dist')"
	@echo "Uploading web build to itch.io under $(ITCH_USER)/$(ITCH_GAME)..."
	butler push rpg-village-web.zip $(ITCH_USER)/$(ITCH_GAME):web-html

