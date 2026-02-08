"""
Kloset Kifayah Backend - Enums
"""
from enum import Enum


class ListingStatus(str, Enum):
    """Status of a listing."""
    PENDING = "pending"       # Awaiting admin approval
    ACTIVE = "active"         # Available for rental
    RENTED = "rented"         # Currently rented out
    INACTIVE = "inactive"     # Deactivated by owner


class ListingCondition(str, Enum):
    """Condition of an item."""
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"


class ListingCategory(str, Enum):
    """Categories for listings."""
    ABAYA = "abaya"
    THOBE = "thobe"
    HIJAB = "hijab"
    NIQAB = "niqab"
    JEWELRY = "jewelry"
    DECOR = "decor"
    PRAYER_ITEMS = "prayer_items"
    EVENT_WEAR = "event_wear"
    KIDS = "kids"
    OTHER = "other"


class RentalStatus(str, Enum):
    """Status of a rental."""
    PENDING = "pending"           # Request submitted, awaiting owner response
    ACCEPTED = "accepted"         # Owner accepted, awaiting pickup
    REJECTED = "rejected"         # Owner rejected
    PICKED_UP = "picked_up"       # Item picked up by renter
    RETURNED = "returned"         # Item returned by renter
    COMPLETED = "completed"       # Rental fully completed
    CANCELLED = "cancelled"       # Cancelled by either party
    DISPUTED = "disputed"         # In dispute resolution


class PaymentStatus(str, Enum):
    """Status of payment."""
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"


class ReviewType(str, Enum):
    """Type of review."""
    RENTER_TO_OWNER = "renter_to_owner"
    OWNER_TO_RENTER = "owner_to_renter"


class CleaningStatus(str, Enum):
    """Status of cleaning order."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AvailabilityReason(str, Enum):
    """Reason for date blocking."""
    RENTAL = "rental"
    BLOCKED = "blocked"
    MAINTENANCE = "maintenance"
