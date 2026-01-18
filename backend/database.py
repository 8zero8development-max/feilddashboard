from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
PARENT_DIR = ROOT_DIR.parent
load_dotenv(PARENT_DIR / '.env')

supabase: Client = create_client(
    os.environ.get('SUPABASE_URL') or os.environ.get('SUPERBASE_URL'),
    os.environ.get('SUPABASE_KEY') or os.environ.get('SUPERBASE_KEY')
)
