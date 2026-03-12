#!/bin/bash

echo "🔧 Setting up development environment..."

# Install pre-commit if not installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."
    pip install pre-commit
fi

# Install the git hook scripts
echo "🔗 Installing pre-commit hooks..."
pre-commit install

# Install pre-push hooks
echo "🔗 Installing pre-push hooks..."
pre-commit install --hook-type pre-push

# Run against all files to verify setup
echo "✅ Running pre-commit on all files..."
pre-commit run --all-files

echo "🎉 Setup complete! Hooks are now active."