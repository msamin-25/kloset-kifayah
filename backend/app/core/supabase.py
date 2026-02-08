"""
Kloset Kifayah Backend - Supabase Client
"""
from functools import lru_cache
from supabase import create_client, Client
from .config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client with anon key (for user operations)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache()
def get_supabase_admin() -> Client:
    """Get Supabase client with service role key (for admin operations)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_storage_url(bucket: str, path: str) -> str:
    """Generate public URL for a Supabase Storage object."""
    settings = get_settings()
    return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{path}"
