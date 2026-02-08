"""
Kloset Kifayah Backend - Date Utilities

Helper functions for date handling.
"""
from datetime import date, datetime, timedelta
from typing import List, Tuple, Optional


def get_date_range(start: date, end: date) -> List[date]:
    """
    Get all dates between start and end (inclusive).
    
    Args:
        start: Start date
        end: End date
        
    Returns:
        List of dates
    """
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def date_ranges_overlap(
    start1: date, end1: date,
    start2: date, end2: date
) -> bool:
    """
    Check if two date ranges overlap.
    
    Args:
        start1, end1: First date range
        start2, end2: Second date range
        
    Returns:
        True if ranges overlap
    """
    return start1 <= end2 and start2 <= end1


def days_between(date1: date, date2: date) -> int:
    """
    Calculate days between two dates.
    
    Args:
        date1: First date
        date2: Second date
        
    Returns:
        Number of days (can be negative)
    """
    return (date2 - date1).days


def is_late(end_date: date, return_date: Optional[date] = None) -> Tuple[bool, int]:
    """
    Check if a rental is late.
    
    Args:
        end_date: Expected end date
        return_date: Actual return date (None = not returned yet)
        
    Returns:
        Tuple of (is_late, days_late)
    """
    check_date = return_date or date.today()
    
    if check_date > end_date:
        days_late = days_between(end_date, check_date)
        return True, days_late
    
    return False, 0


def format_date_range(start: date, end: date) -> str:
    """
    Format a date range for display.
    
    Args:
        start: Start date
        end: End date
        
    Returns:
        Formatted string like "Jan 15 - Jan 20, 2024"
    """
    if start.year == end.year:
        if start.month == end.month:
            return f"{start.strftime('%b %d')} - {end.strftime('%d, %Y')}"
        else:
            return f"{start.strftime('%b %d')} - {end.strftime('%b %d, %Y')}"
    else:
        return f"{start.strftime('%b %d, %Y')} - {end.strftime('%b %d, %Y')}"


def get_relative_time(dt: datetime) -> str:
    """
    Get relative time string (e.g., "2 hours ago").
    
    Args:
        dt: Datetime to compare with now
        
    Returns:
        Relative time string
    """
    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    else:
        return dt.strftime('%b %d, %Y')


def parse_date_string(date_str: str) -> Optional[date]:
    """
    Parse a date string in various formats.
    
    Args:
        date_str: Date string
        
    Returns:
        Parsed date or None
    """
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%B %d, %Y",
        "%b %d, %Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    return None
