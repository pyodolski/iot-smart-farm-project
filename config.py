import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'q1w2e3r4'),
    'database': os.getenv('DB_NAME', 'smartfarm'),
    'port': int(os.getenv('DB_PORT', 5432)),  # PostgreSQL 기본 포트
    'charset': 'utf8mb4'
}