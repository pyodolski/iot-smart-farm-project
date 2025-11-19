#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def check_greenhouses():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'q1w2e3r4'),
            database=os.getenv('DB_NAME', 'smartfarm'),
            port=int(os.getenv('DB_PORT', 5432))
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=== greenhouses 테이블 구조 ===")
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'greenhouses'
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        for col in columns:
            print(f"컬럼: {col['column_name']} ({col['data_type']}) - NULL 허용: {col['is_nullable']}")
        
        print("\n=== greenhouses 테이블 데이터 ===")
        cur.execute("SELECT * FROM greenhouses ORDER BY id")
        greenhouses = cur.fetchall()
        if greenhouses:
            for gh in greenhouses:
                print(f"ID: {gh['id']}, 이름: {gh.get('name')}, Farm ID: {gh.get('farm_id')}")
        else:
            print("데이터가 없습니다.")
        
        print("\n=== sensor_log 테이블 최근 데이터 ===")
        cur.execute("SELECT * FROM sensor_log ORDER BY timestamp DESC LIMIT 5")
        sensors = cur.fetchall()
        if sensors:
            for sensor in sensors:
                print(f"GH_ID: {sensor.get('gh_id')}, 온도: {sensor.get('temperature')}, 습도: {sensor.get('humidity')}, 시간: {sensor.get('timestamp')}")
        else:
            print("센서 데이터가 없습니다.")
        
        print("\n=== crop_groups 테이블 데이터 ===")
        cur.execute("SELECT id, greenhouse_id, crop_type FROM crop_groups ORDER BY id LIMIT 10")
        groups = cur.fetchall()
        if groups:
            for group in groups:
                print(f"Group ID: {group['id']}, Greenhouse ID: {group['greenhouse_id']}, Crop Type: {group['crop_type']}")
        else:
            print("그룹 데이터가 없습니다.")
        
        conn.close()
        
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_greenhouses()
