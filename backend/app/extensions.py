"""
Flask extensions initialization.
"""

from flask_caching import Cache
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions without app
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cache = Cache()

# Configure limiter with a default key function
limiter = Limiter(
    key_func=get_remote_address, default_limits=["200 per day", "50 per hour"]
)

# RESTful API
api = Api()
