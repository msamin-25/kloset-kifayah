#!/usr/bin/env python3
"""Test Supabase Auth signup with a real email format."""
import os
import sys

sys.path.insert(0, '/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend')

from dotenv import load_dotenv
load_dotenv('/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend/.env')

from supabase import create_client

def test_auth():
    url = os.getenv('SUPABASE_URL')
    anon_key = os.getenv('SUPABASE_ANON_KEY')
    
    print("Testing Auth Signup...")
    
    client = create_client(url, anon_key)
    
    # Use a proper email format
    test_email = "testuser123@example.com"
    test_password = "ibtikar123"
    
    print(f"📧 Attempting signup with: {test_email}")
    
    try:
        result = client.auth.sign_up({
            "email": test_email,
            "password": test_password
        })
        
        if result.user:
            print(f"✅ SIGNUP SUCCESSFUL!")
            print(f"   User ID: {result.user.id}")
            print(f"   Email: {result.user.email}")
            
            # Check if profile was created
            service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            admin_client = create_client(url, service_key)
            
            profile = admin_client.table('profiles').select('*').eq('id', result.user.id).execute()
            if profile.data:
                print(f"   ✅ Profile created: {profile.data[0]}")
            else:
                print(f"   ⚠️ Profile NOT created (trigger may have failed silently)")
            
            # Clean up test user
            admin_client.auth.admin.delete_user(result.user.id)
            print("   🧹 Test user cleaned up")
        else:
            print(f"❌ No user returned")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_auth()
