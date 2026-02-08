"""
API Routes module.
"""
from .auth import router as auth_router
from .users import router as users_router
from .listings import router as listings_router
from .rentals import router as rentals_router
from .messages import router as messages_router
from .reviews import router as reviews_router
from .uploads import router as uploads_router
from .admin import router as admin_router
