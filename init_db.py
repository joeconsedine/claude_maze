#!/usr/bin/env python3
"""
Database initialization script for Claude Maze
Creates tables and sample data for development/testing
"""

import os
import sys
from app import app, db
from models import Organization, User, UserSession

def create_sample_data():
    """Create sample organizations and users for testing"""
    try:
        # Create sample organization
        sample_org = Organization(
            name="Sample Organization",
            seat_limit=10,
            current_seats=0
        )
        db.session.add(sample_org)
        db.session.flush()  # Get the ID

        # Create admin user
        admin_user = User(
            username="admin",
            role="admin",
            organization_id=sample_org.id
        )
        admin_user.set_password("admin123")
        db.session.add(admin_user)

        # Create standard user
        standard_user = User(
            username="user",
            role="standard",
            organization_id=sample_org.id
        )
        standard_user.set_password("user123")
        db.session.add(standard_user)

        db.session.commit()
        print("✅ Sample data created successfully!")
        print("   Admin user: admin / admin123")
        print("   Standard user: user / user123")

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating sample data: {e}")

def init_database():
    """Initialize the database"""
    try:
        # Create all tables
        with app.app_context():
            db.create_all()
            print("✅ Database tables created successfully!")

            # Check if we should create sample data
            if len(User.query.all()) == 0:
                print("📝 Creating sample data...")
                create_sample_data()
            else:
                print("📊 Database already contains users, skipping sample data creation")

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Initializing Claude Maze database...")

    # Check if DATABASE_URL is set
    if not os.environ.get('DATABASE_URL'):
        print("⚠️  DATABASE_URL not set, using default local PostgreSQL")
        print("   Make sure PostgreSQL is running and database 'claude_maze' exists")

    init_database()
    print("🎉 Database initialization complete!")