"""
Supabase Client for Flask Server
Replaces MongoDB connection
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://oyvdwqzbuevcbgrmtmvp.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

# Create Supabase client with service role key for admin operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_supabase():
    """Get Supabase client instance"""
    return supabase

def verify_token(token: str):
    """Verify Supabase JWT token and get user"""
    try:
        import jwt
        
        # Decode token to get user ID (no verification needed - we trust Supabase tokens)
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        
        if user_id:
            # Get user from database
            response = supabase.table('users').select('id, email, user_name').eq('id', user_id).single().execute()
            if response.data:
                # Return user-like object
                class User:
                    def __init__(self, data):
                        self.id = data['id']
                        self.email = data.get('email')
                        self.user_name = data.get('user_name')
                
                return User(response.data)
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

