#!/bin/bash

set -e  # Exit on any error

echo "=== Installing Rollup dependencies specifically ==="

# Function to install with retry and graceful failure
install_with_retry() {
    local package=$1
    local max_attempts=2
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt to install $package"
        if npm install "$package" --include=optional --no-optional=false --force --timeout=300000 --silent; then
            echo "✅ Successfully installed $package"
            return 0
        else
            echo "⚠️ Failed to install $package on attempt $attempt"
            if [ $attempt -eq $max_attempts ]; then
                echo "❌ All attempts failed for $package - continuing without it"
                return 1
            fi
            attempt=$((attempt + 1))
            sleep 3
        fi
    done
}

# Function to check if package is already installed
check_package() {
    local package=$1
    if [ -d "node_modules/$package" ]; then
        echo "✅ $package already installed"
        return 0
    else
        return 1
    fi
}

# Install Rollup only if not already present
if ! check_package "rollup"; then
    echo "Installing Rollup..."
    install_with_retry "rollup@latest" || echo "Warning: Rollup installation failed, continuing..."
fi

# Install platform-specific Rollup binaries only if needed
if ! check_package "@rollup/rollup-linux-x64-gnu"; then
    echo "Installing Linux GNU binary..."
    install_with_retry "@rollup/rollup-linux-x64-gnu" || echo "Warning: Linux GNU binary installation failed"
fi

if ! check_package "@rollup/rollup-linux-x64-musl"; then
    echo "Installing Linux musl binary..."
    install_with_retry "@rollup/rollup-linux-x64-musl" || echo "Warning: Linux musl binary installation failed"
fi

# Verify critical packages
echo "=== Verifying critical packages ==="
echo "Checking Vite installation..."
if [ -d "node_modules/vite" ]; then
    echo "✅ Vite found"
    ls -la node_modules/vite/ | head -3
else
    echo "❌ Vite not found - this is critical for build"
fi

echo "Checking React installation..."
if [ -d "node_modules/react" ]; then
    echo "✅ React found"
else
    echo "❌ React not found - this is critical for build"
fi

echo "Checking TypeScript installation..."
if [ -d "node_modules/typescript" ]; then
    echo "✅ TypeScript found"
else
    echo "❌ TypeScript not found - this is critical for build"
fi

echo "Checking Zod installation..."
if [ -d "node_modules/zod" ]; then
    echo "✅ Zod found"
else
    echo "❌ Zod not found - this is critical for build"
fi

# Only rebuild if we have native modules
if [ -d "node_modules/@rollup" ] || [ -d "node_modules/rollup" ]; then
    echo "=== Rebuilding native modules ==="
    npm rebuild --timeout=300000 --silent || echo "Warning: npm rebuild failed, continuing..."
fi

echo "=== Rollup dependencies installation completed ==="
echo "Build can proceed with available packages"
