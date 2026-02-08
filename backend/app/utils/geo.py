"""
Kloset Kifayah Backend - Geo Utilities

Helper functions for location and distance calculations.
"""
import math
from typing import Tuple, Optional


def haversine_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """
    Calculate the great circle distance between two points on earth.
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
        
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def is_within_radius(
    center_lat: float, center_lon: float,
    point_lat: float, point_lon: float,
    radius_km: float
) -> bool:
    """
    Check if a point is within a radius of a center point.
    
    Args:
        center_lat, center_lon: Center coordinates
        point_lat, point_lon: Point to check
        radius_km: Radius in kilometers
        
    Returns:
        True if point is within radius
    """
    distance = haversine_distance(center_lat, center_lon, point_lat, point_lon)
    return distance <= radius_km


# Predefined region centers (approximate)
REGION_CENTERS = {
    "GTA": (43.6532, -79.3832),          # Toronto
    "Waterloo": (43.4643, -80.5204),      # Waterloo
    "Mississauga": (43.5890, -79.6441),
    "Brampton": (43.7315, -79.7624),
    "Hamilton": (43.2557, -79.8711),
    "Kitchener": (43.4516, -80.4925),
    "London": (42.9849, -81.2453),
    "Ottawa": (45.4215, -75.6972),
    "Markham": (43.8561, -79.3370),
    "Vaughan": (43.8361, -79.4983),
}


def get_region_center(region: str) -> Optional[Tuple[float, float]]:
    """
    Get the center coordinates for a named region.
    
    Args:
        region: Region name
        
    Returns:
        Tuple of (latitude, longitude) or None if not found
    """
    return REGION_CENTERS.get(region)


def get_nearby_regions(
    lat: float, lon: float,
    radius_km: float = 50
) -> list:
    """
    Get regions within a certain radius of a point.
    
    Args:
        lat, lon: Center coordinates
        radius_km: Radius to search
        
    Returns:
        List of region names within radius
    """
    nearby = []
    
    for region, (region_lat, region_lon) in REGION_CENTERS.items():
        if is_within_radius(lat, lon, region_lat, region_lon, radius_km):
            nearby.append(region)
    
    return nearby


def normalize_region_name(region: str) -> Optional[str]:
    """
    Normalize a region name to match our predefined regions.
    
    Args:
        region: User-input region name
        
    Returns:
        Normalized region name or None if not matched
    """
    region_lower = region.lower().strip()
    
    # Direct match
    for name in REGION_CENTERS:
        if name.lower() == region_lower:
            return name
    
    # Common aliases
    aliases = {
        "toronto": "GTA",
        "greater toronto area": "GTA",
        "greater toronto": "GTA",
        "to": "GTA",
        "kw": "Kitchener",
        "kitchener-waterloo": "Kitchener",
        "k-w": "Kitchener",
        "sauga": "Mississauga",
        "the hammer": "Hamilton",
    }
    
    return aliases.get(region_lower)


def format_distance(distance_km: float) -> str:
    """
    Format distance for display.
    
    Args:
        distance_km: Distance in kilometers
        
    Returns:
        Formatted string
    """
    if distance_km < 1:
        return f"{int(distance_km * 1000)}m"
    elif distance_km < 10:
        return f"{distance_km:.1f}km"
    else:
        return f"{int(distance_km)}km"
