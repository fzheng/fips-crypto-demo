.PHONY: dev server install build clean test

# Install dependencies
install:
	npm install

# Start relay server and dev server together
dev: install
	@echo "Starting PQC Demo..."
	@echo "  Relay server: ws://localhost:3001"
	@echo "  Web app:      http://localhost:5173"
	@echo ""
	npx concurrently --kill-others "npx tsx server/server.ts" "npx vite"

# Build for production
build: install
	npx tsc -b && npx vite build

# Run all tests
test: install
	npx vitest run

# Start relay server only
server:
	npx tsx server/server.ts

# Clean build artifacts
clean:
	rm -rf dist node_modules/.vite
