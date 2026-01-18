import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
PARENT_DIR = ROOT_DIR.parent

JWT_SECRET = os.environ.get('JWT_SECRET', 'craven-cooling-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

FRONTEND_BUILD_DIR = PARENT_DIR / "frontend" / "build"
