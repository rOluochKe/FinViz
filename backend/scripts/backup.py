#!/usr/bin/env python3
"""
Database backup script.
"""
import os
import sys
import argparse
import subprocess
from datetime import datetime
import gzip
import shutil

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Database backup tool')
    parser.add_argument('--output', default='backups', help='Output directory')
    parser.add_argument('--no-compress', action='store_true', help='Do not compress')
    parser.add_argument('--cleanup', type=int, default=0, help='Delete backups older than N days')
    parser.add_argument('--env', default='production', help='Environment')
    return parser.parse_args()

def main():
    """Main backup function."""
    args = parse_args()
    
    app = create_app(args.env)
    
    with app.app_context():
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        
        # Create backup directory
        os.makedirs(args.output, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(args.output, f"backup_{timestamp}.sql")
        
        # Backup based on database type
        if 'postgresql' in db_uri:
            backup_postgresql(db_uri, backup_file)
        elif 'sqlite' in db_uri:
            backup_sqlite(db_uri, backup_file)
        else:
            print(f"Unsupported database: {db_uri}")
            sys.exit(1)
        
        # Compress if requested
        if not args.no_compress:
            compress_file(backup_file)
        
        # Cleanup old backups
        if args.cleanup > 0:
            cleanup_old_backups(args.output, args.cleanup)
        
        print(f"✅ Backup completed: {backup_file}")

def backup_postgresql(db_uri, backup_file):
    """Backup PostgreSQL database."""
    import re
    
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_uri)
    if not match:
        print("Invalid PostgreSQL URI")
        sys.exit(1)
    
    username, password, host, port, database = match.groups()
    
    env = os.environ.copy()
    env['PGPASSWORD'] = password
    
    cmd = [
        'pg_dump',
        '-h', host,
        '-p', port,
        '-U', username,
        '-d', database,
        '-f', backup_file,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges'
    ]
    
    try:
        subprocess.run(cmd, env=env, check=True)
        print(f"PostgreSQL backup created: {backup_file}")
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e}")
        sys.exit(1)

def backup_sqlite(db_uri, backup_file):
    """Backup SQLite database."""
    db_path = db_uri.replace('sqlite:///', '')
    
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        sys.exit(1)
    
    shutil.copy2(db_path, backup_file)
    print(f"SQLite backup created: {backup_file}")

def compress_file(filepath):
    """Compress file with gzip."""
    with open(filepath, 'rb') as f_in:
        with gzip.open(f"{filepath}.gz", 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    os.remove(filepath)
    print(f"Compressed to: {filepath}.gz")

def cleanup_old_backups(backup_dir, days):
    """Delete backups older than days."""
    cutoff = datetime.now().timestamp() - (days * 24 * 3600)
    deleted = 0
    
    for filename in os.listdir(backup_dir):
        filepath = os.path.join(backup_dir, filename)
        if os.path.isfile(filepath) and os.path.getmtime(filepath) < cutoff:
            os.remove(filepath)
            deleted += 1
    
    if deleted > 0:
        print(f"Deleted {deleted} old backup files")

if __name__ == '__main__':
    main()