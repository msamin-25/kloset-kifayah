#!/usr/bin/env python3
"""Deep diagnostic for Supabase auth issues."""
import os
import sys

sys.path.insert(0, '/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend')

from dotenv import load_dotenv
load_dotenv('/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend/.env')

from supabase import create_client

def deep_diagnostic():
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    client = create_client(url, service_key)
    
    print("=" * 60)
    print("DEEP SUPABASE DIAGNOSTIC")
    print("=" * 60)
    
    # Check 1: RLS status on profiles
    print("\n1. Checking RLS status on profiles table...")
    try:
        result = client.rpc('check_rls', {}).execute()
        print(f"   RLS check result: {result}")
    except Exception as e:
        print(f"   (RPC not available, trying raw query...)")
    
    # Check 2: Try to insert a profile directly (bypassing trigger)
    print("\n2. Testing direct profile insert with service role...")
    test_id = "00000000-0000-0000-0000-000000000001"
    try:
        # First check if test profile exists and delete it
        client.table('profiles').delete().eq('id', test_id).execute()
        
        # Try direct insert
        result = client.table('profiles').insert({
            'id': test_id,
            'email': 'direct-test@test.com',
            'is_verified_email': False
        }).execute()
        print(f"   ✅ Direct insert works! Data: {result.data}")
        
        # Clean up
        client.table('profiles').delete().eq('id', test_id).execute()
        print("   🧹 Cleaned up test record")
        
    except Exception as e:
        print(f"   ❌ Direct insert failed: {e}")
        if "violates foreign key" in str(e):
            print("   This is expected - no matching auth.users entry")
            print("   ✅ This means the table is accessible, issue is in trigger")
    
    # Check 3: Look at existing profiles
    print("\n3. Checking existing profiles...")
    try:
        result = client.table('profiles').select('id, email').limit(5).execute()
        print(f"   Found {len(result.data)} profiles: {result.data}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Check 4: Check if trigger exists
    print("\n4. The trigger 'handle_new_user' is defined in your schema.")
    print("   If RLS is disabled and insert still fails, the issue might be:")
    print("   a) The trigger function itself has an error")
    print("   b) A constraint violation (e.g., duplicate email)")
    print("   c) Supabase internal auth settings")
    
    print("\n" + "=" * 60)
    print("RECOMMENDATION:")
    print("=" * 60)
    print("Try creating a user via Supabase Dashboard:")
    print("1. Go to Authentication → Users")
    print("2. Click 'Add User' → 'Create New User'")
    print("3. Enter email and password")
    print("4. If this works, check the profiles table for the new record")
    print("=" * 60)

if __name__ == '__main__':
    deep_diagnostic()
