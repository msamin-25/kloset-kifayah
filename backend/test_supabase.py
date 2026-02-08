#!/usr/bin/env python3
"""Quick test script to verify Supabase connection."""
import os
import sys

# Add backend to path
sys.path.insert(0, '/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend')

from dotenv import load_dotenv
load_dotenv('/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend/.env')

from supabase import create_client

def test_connection():
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print(f"🔗 Supabase URL: {url}")
    print(f"🔑 Key (first 20 chars): {key[:20]}...")
    
    try:
        client = create_client(url, key)
        print("✅ Supabase client created successfully!")
        
        # Test: Try to query profiles table
        print("\n📋 Testing profiles table...")
        result = client.table('profiles').select('id').limit(1).execute()
        print(f"✅ Profiles table exists! Found {len(result.data)} records")
        
    except Exception as e:
        error_msg = str(e)
        if 'relation "profiles" does not exist' in error_msg or 'profiles' in error_msg.lower():
            print(f"❌ Profiles table NOT FOUND!")
            print("   👉 You need to run the migration SQL in Supabase Dashboard")
            print("   👉 Go to: https://supabase.com/dashboard → Your Project → SQL Editor")
            print("   👉 Paste contents of: backend/migrations/001_initial_schema.sql")
        else:
            print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("=" * 50)
    print("SUPABASE CONNECTION TEST")
    print("=" * 50)
    test_connection()
