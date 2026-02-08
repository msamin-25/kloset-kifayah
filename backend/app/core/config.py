"""
Kloset Kifayah Backend - Configuration Settings
"""
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    app_name: str = "Kloset Kifayah"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Supabase
    supabase_url: str = "https://your-project.supabase.co"
    supabase_anon_key: str = "your-anon-key"
    supabase_service_role_key: str = "your-service-role-key"
    
    # Stripe (Placeholder)
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_webhook_secret: str = "whsec_placeholder"
    
    # Cleaning Service (Placeholder)
    cleaning_service_api_key: str = "placeholder_key"
    cleaning_service_base_fee: float = 15.00
    
    # Regions
    supported_regions: List[str] = [
        "GTA",
        "Waterloo",
        "Mississauga", 
        "Brampton",
        "Hamilton",
        "Kitchener",
        "London",
        "Ottawa"
    ]
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
