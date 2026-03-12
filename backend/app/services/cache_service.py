"""
Cache service for Redis caching operations.
"""

import hashlib
from functools import wraps
from typing import Any, Callable, Dict

from flask import request
from flask_jwt_extended import get_jwt_identity

from app.extensions import cache


class CacheService:
    """Service for cache operations."""

    @staticmethod
    def generate_key(prefix: str, *args, **kwargs) -> str:
        """
        Generate cache key from prefix and args.

        Args:
            prefix: Key prefix
            *args: Positional args
            **kwargs: Keyword args

        Returns:
            Cache key
        """
        parts = [prefix]

        # Add args
        for arg in args:
            if arg:
                parts.append(str(arg))

        # Add sorted kwargs
        if kwargs:
            for k in sorted(kwargs.keys()):
                if kwargs[k]:
                    parts.append(f"{k}:{kwargs[k]}")

        key = ":".join(parts)

        # Hash if too long
        if len(key) > 200:
            key = f"{prefix}:{hashlib.md5(key.encode()).hexdigest()}"

        return key

    @staticmethod
    def get_or_set(key: str, func: Callable, timeout: int = 300) -> Any:
        """
        Get from cache or set using function.

        Args:
            key: Cache key
            func: Function to call
            timeout: Cache timeout

        Returns:
            Cached value
        """
        value = cache.get(key)
        if value is not None:
            return value

        value = func()
        if value is not None:
            cache.set(key, value, timeout=timeout)

        return value

    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """
        Delete keys matching pattern.

        Args:
            pattern: Key pattern

        Returns:
            Number deleted
        """
        if hasattr(cache.cache, "delete_pattern"):
            return cache.cache.delete_pattern(pattern)
        return 0

    @staticmethod
    def clear_user_cache(user_id: int):
        """Clear all cache for a user."""
        patterns = [
            f"user:{user_id}:*",
            f"transactions:{user_id}:*",
            f"dashboard:{user_id}:*",
        ]
        for pattern in patterns:
            CacheService.delete_pattern(pattern)

    @staticmethod
    def get_stats() -> Dict:
        """Get cache statistics."""
        stats = {"backend": cache.__class__.__name__}

        if hasattr(cache.cache, "get_client"):
            try:
                client = cache.cache.get_client()
                info = client.info()
                stats.update(
                    {
                        "hits": info.get("keyspace_hits", 0),
                        "misses": info.get("keyspace_misses", 0),
                        "memory": info.get("used_memory_human", "0"),
                        "keys": client.dbsize(),
                    }
                )
            except BaseException:
                pass

        return stats


def cached(prefix: str = None, timeout: int = 300):
    """
    Decorator for caching function results.

    Args:
        prefix: Cache key prefix
        timeout: Cache timeout
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Build key
            key_parts = [prefix or f.__name__]

            # Add user_id if present
            if "user_id" in kwargs:
                key_parts.append(f"user:{kwargs['user_id']}")

            key = CacheService.generate_key(*key_parts)

            # Get or set cache
            return CacheService.get_or_set(key, lambda: f(*args, **kwargs), timeout)

        return decorated

    return decorator


def invalidate_cache(pattern: str):
    """
    Decorator to invalidate cache after function.

    Args:
        pattern: Cache pattern to delete
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            result = f(*args, **kwargs)
            CacheService.delete_pattern(pattern)
            return result

        return decorated

    return decorator


def cache_key_for_request(prefix: str = None):
    """
    Generate cache key from request.

    Args:
        prefix: Key prefix

    Returns:
        Cache key
    """
    parts = [prefix or request.endpoint]

    # Add query params
    if request.args:
        for k in sorted(request.args.keys()):
            parts.append(f"{k}:{request.args[k]}")

    # Add user if authenticated
    try:
        user_id = get_jwt_identity()
        if user_id:
            parts.append(f"user:{user_id}")
    except BaseException:
        pass

    return CacheService.generate_key(*parts)
