import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'dpg-d4079k15pdvs73fnmip0-a.oregon-postgres.render.com'),
    'user': os.getenv('DB_USER', 'smartfarm_user'),
    'password': os.getenv('DB_PASSWORD', 'QlKgIjMQ3URu7G317WfolWIFatOOiU9n'),
    'database': os.getenv('DB_NAME', 'smartfarm_seor'),
    'port': int(os.getenv('DB_PORT', 5432)),  # PostgreSQL 기본 포트
    'charset': 'utf8mb4'
}