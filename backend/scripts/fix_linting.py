#!/usr/bin/env python3
"""
Script to automatically fix common linting issues.
"""
import os
import subprocess
import sys


def main():
    """Run auto-formatters to fix linting issues."""
    print("🔧 Fixing linting issues...")
    
    # Run black
    print("\n📦 Running Black formatter...")
    subprocess.run(["black", "app/", "tests/"], check=False)
    
    # Run isort
    print("\n📦 Running isort...")
    subprocess.run(["isort", "app/", "tests/"], check=False)
    
    # Run autoflake to remove unused imports
    print("\n📦 Running autoflake to remove unused imports...")
    subprocess.run([
        "autoflake", "--in-place", "--recursive", 
        "--remove-all-unused-imports", "--remove-unused-variables",
        "app/", "tests/"
    ], check=False)
    
    # Run autopep8 for additional fixes
    print("\n📦 Running autopep8...")
    subprocess.run([
        "autopep8", "--in-place", "--recursive", "--aggressive",
        "app/", "tests/"
    ], check=False)
    
    print("\n✅ Linting fixes applied!")
    print("\n📊 Remaining issues (if any):")
    subprocess.run(["flake8", "app/", "tests/", "--count", "--statistics"], check=False)


if __name__ == "__main__":
    main()