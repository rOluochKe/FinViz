#!/usr/bin/env python3
"""
Fix script to resolve import and migration issues.
"""
import os
import sys
import subprocess

def main():
    print("🔧 Fixing FinViz Pro Backend Setup...")
    
    # Step 1: Check current directory
    current_dir = os.getcwd()
    print(f"📁 Current directory: {current_dir}")
    
    # Step 2: Check if run.py exists
    if not os.path.exists('run.py'):
        print("❌ run.py not found in current directory")
        sys.exit(1)
    
    # Step 3: Set Flask app environment variable
    os.environ['FLASK_APP'] = 'run.py'
    print("✅ Set FLASK_APP=run.py")
    
    # Step 4: Try to import create_app
    try:
        from app import create_app
        print("✅ Successfully imported create_app")
        app = create_app('development')
        print("✅ Successfully created app")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        
        # Check if __init__.py exists in app directory
        if not os.path.exists('app/__init__.py'):
            print("❌ app/__init__.py not found")
        else:
            print("✅ app/__init__.py exists")
        
        # Check extensions.py
        if not os.path.exists('app/extensions.py'):
            print("❌ app/extensions.py not found")
        else:
            print("✅ app/extensions.py exists")
        
        sys.exit(1)
    
    # Step 5: Check Flask-Migrate installation
    try:
        import flask_migrate
        print(f"✅ Flask-Migrate version: {flask_migrate.__version__}")
    except ImportError:
        print("❌ Flask-Migrate not installed. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'flask-migrate'])
    
    # Step 6: Initialize migrations
    print("\n📦 Initializing database migrations...")
    try:
        from flask_migrate import init
        with app.app_context():
            if not os.path.exists('migrations'):
                init()
                print("✅ Migrations initialized successfully")
            else:
                print("✅ Migrations directory already exists")
    except Exception as e:
        print(f"❌ Failed to initialize migrations: {e}")
        sys.exit(1)
    
    # Step 7: Create initial migration
    print("\n📦 Creating initial migration...")
    try:
        from flask_migrate import migrate
        with app.app_context():
            migrate(message="Initial migration")
            print("✅ Initial migration created")
    except Exception as e:
        print(f"❌ Failed to create migration: {e}")
    
    print("\n✅ Setup fix completed!")

if __name__ == '__main__':
    main()
    