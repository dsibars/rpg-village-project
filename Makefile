-include itch.config

.PHONY: build build-web build-app build-debug dev run test clean deploy-itch docs-hash


# --- Docs Hash (invalidates PM memories when specs change) ---
# Maintains a rolling history of the last 50 hashes with timestamps.
# Enables temporal queries: "what changed between hash A and hash B?"

docs-hash:
	@mkdir -p .agents_shared_memory
	@CURRENT=$$(find docs/ -type f -name "*.md" | sort | xargs md5sum | md5sum | awk '{print $$1}'); \
	LAST=$$(tail -1 .agents_shared_memory/docs_hash_history 2>/dev/null | awk '{print $$2}'); \
	if [ "$$CURRENT" != "$$LAST" ]; then \
		echo "$$(date -Iseconds) $$CURRENT" >> .agents_shared_memory/docs_hash_history; \
		tail -n 50 .agents_shared_memory/docs_hash_history > .agents_shared_memory/docs_hash_history.tmp && mv .agents_shared_memory/docs_hash_history.tmp .agents_shared_memory/docs_hash_history; \
	fi; \
	echo "$$CURRENT" > .agents_shared_memory/docs_hash

# --- Build Targets ---

build: docs-hash build-web build-app
	@echo "All builds complete!"

build-web: docs-hash
	@echo "Building RPG Village (web)..."
	@npm run build
	@echo "Web build complete! Output: dist/index.html"

build-app: docs-hash
	@echo "Building RPG Village (electron app)..."
	@npm run build
	@npm run electron:package
	@echo "App build complete! Check out/ directory."

build-debug: docs-hash
	@echo "Building RPG Village (debug)..."
	@npm run build:debug
	@echo "Debug build complete! Output: dist/index.html"

# --- Development ---

dev: docs-hash
	@echo "Starting development server..."
	@npm run dev

run: docs-hash
	@echo "Starting Electron app from dist/..."
	@npm run electron:run

# --- Testing ---

test: docs-hash
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
	@echo "Staging build for itch.io..."
	@rm -rf .itch-staging && mkdir -p .itch-staging
	@cp -r dist/* .itch-staging/
	@python3 -c "import shutil; shutil.make_archive('rpg-village-web', 'zip', '.itch-staging')"
	@rm -rf .itch-staging
	@echo "Uploading Vue web build to itch.io under $(ITCH_USER)/$(ITCH_GAME)..."
	butler push rpg-village-web.zip $(ITCH_USER)/$(ITCH_GAME):web-html

