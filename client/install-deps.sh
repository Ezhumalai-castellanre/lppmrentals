#!/bin/bash

echo "=== Installing Rollup dependencies specifically ==="

# Force install Rollup with all optional dependencies
npm install rollup@latest --include=optional --no-optional=false --force

# Install platform-specific Rollup binaries
npm install @rollup/rollup-linux-x64-gnu --include=optional --no-optional=false --force
npm install @rollup/rollup-linux-x64-musl --include=optional --no-optional=false --force

# Verify Rollup installation
echo "=== Verifying Rollup installation ==="
ls -la node_modules/rollup/ || echo "Rollup not found"
ls -la node_modules/@rollup/ || echo "@rollup packages not found"

# Rebuild any native modules
echo "=== Rebuilding native modules ==="
npm rebuild

echo "=== Rollup dependencies installation completed ==="
