"""
Cache service for Redis caching operations.
"""

import hashlib
from functools import wraps
from typing import Any, Callable, Dict
import uuid

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
        try:
            value = cache.get(key)
            if value is not None:
                return value
        except Exception as e:
            # If cache is unavailable, just execute the function
            pass

        value = func()
        try:
            if value is not None:
                cache.set(key, value, timeout=timeout)
        except Exception as e:
            # Cache set failed, but we still have the value
            pass

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
        try:
            if hasattr(cache.cache, "delete_pattern"):
                return cache.cache.delete_pattern(pattern)
        except Exception:
            pass
        return 0

    @staticmethod
    def clear_user_cache(user_id: uuid.UUID):
        """Clear all cache for a user."""
        try:
            patterns = [
                f"user:{str(user_id)}:*",
                f"transactions:{str(user_id)}:*",
                f"dashboard:{str(user_id)}:*",
            ]
            for pattern in patterns:
                CacheService.delete_pattern(pattern)
        except Exception:
            pass  # Silently fail if cache is unavailable

    @staticmethod
    def get_stats() -> Dict:
        """Get cache statistics."""
        stats = {"backend": cache.__class__.__name__, "available": False}

        try:
            if hasattr(cache.cache, "get_client"):
                client = cache.cache.get_client()
                info = client.info()
                stats.update(
                    {
                        "available": True,
                        "hits": info.get("keyspace_hits", 0),
                        "misses": info.get("keyspace_misses", 0),
                        "memory": info.get("used_memory_human", "0"),
                        "keys": client.dbsize(),
                    }
                )
            else:
                # For non-Redis caches
                stats.update(
                    {
                        "available": True,
                        "hits": 0,
                        "misses": 0,
                        "memory": "N/A",
                        "keys": 0,
                    }
                )
        except Exception as e:
            stats.update(
                {
                    "available": False,
                    "error": str(e),
                    "hits": None,
                    "misses": None,
                    "memory": None,
                    "keys": None,
                }
            )

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
            try:
                # Build key
                key_parts = [prefix or f.__name__]

                # Add user_id if present
                if "user_id" in kwargs and kwargs["user_id"]:
                    key_parts.append(f"user:{str(kwargs['user_id'])}")

                key = CacheService.generate_key(*key_parts)

                # Get or set cache
                return CacheService.get_or_set(key, lambda: f(*args, **kwargs), timeout)
            except Exception:
                # If cache fails, just execute the function
                return f(*args, **kwargs)

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
            try:
                CacheService.delete_pattern(pattern)
            except Exception:
                pass
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