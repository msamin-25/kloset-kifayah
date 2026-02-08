#!/usr/bin/env python3
"""Test with actual email."""
import os
import sys
sys.path.insert(0, '/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend')
from dotenv import load_dotenv
load_dotenv('/Users/abdullahalamaan/Documents/GitHub/ibtikar/backend/.env')
from supabase import create_client

url = os.getenv('SUPABASE_URL')
anon_key = os.getenv('SUPABASE_ANON_KEY')
client = create_client(url, anon_key)

# Test with the user's email
print("Testing signup with amaan@gmail.com...")
try:
    result = client.auth.sign_up({
        "email": "amaan@gmail.com",
        "password": "ibtikar123"
    })
    if result.user:
        print(f"✅ SUCCESS! User ID: {result.user.id}")
    else:
        print(f"Result: {result}")
except Exception as e:
    print(f"Error: {e}")
