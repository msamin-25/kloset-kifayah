"""
Kloset Kifayah Backend - Main Application Entry Point

Muslim Rental Marketplace API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.api.routes import (
    auth_router,
    users_router,
    listings_router,
    rentals_router,
    messages_router,
    reviews_router,
    uploads_router,
    admin_router,
)
from app.schemas.common import HealthCheck


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"🚀 Starting {settings.app_name} API...")
    print(f"📍 Debug mode: {settings.debug}")
    yield
    # Shutdown
    print(f"👋 Shutting down {settings.app_name} API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="""
    Kloset Kifayah is a hyperlocal rental marketplace for the Muslim community.
    
    ## Features
    
    - 🏠 **Listings**: Browse and list items for rent
    - 📅 **Rentals**: Full rental lifecycle management
    - 💬 **Messaging**: In-app chat between users
    - ⭐ **Reviews**: Trust-building through ratings
    - ✅ **Verification**: Community and identity verification
    - 🛡️ **Trust**: Badge system and response rate tracking
    
    ## Regions Supported
    
    - GTA (Greater Toronto Area)
    - Waterloo
    - Mississauga
    - Brampton
    - Hamilton
    - Kitchener
    - London
    - Ottawa
    """,
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return HealthCheck(status="healthy", version="1.0.0")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled",
        "regions": settings.supported_regions,
    }


# Include routers
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(listings_router, prefix=settings.api_v1_prefix)
app.include_router(rentals_router, prefix=settings.api_v1_prefix)
app.include_router(messages_router, prefix=settings.api_v1_prefix)
app.include_router(reviews_router, prefix=settings.api_v1_prefix)
app.include_router(uploads_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
