"""E2E smoke test for EcoTrack tracking endpoints.

This script will:
- Register a test user (if not already registered)
- Log in and obtain an access token
- POST a tracking/log activity
- GET tracking/history and carbon/monthly

Set environment variables to override defaults:
- E2E_EMAIL, E2E_PASSWORD

Run from repo root:
python scripts/e2e_tracking_test.py
"""

import os
import sys
import json
from urllib import request, parse

API = os.getenv('API_BASE', 'http://127.0.0.1:8000')
EMAIL = os.getenv('E2E_EMAIL', 'e2e_test_user@example.com')
PASSWORD = os.getenv('E2E_PASSWORD', 'TestPass123!')


def http_post(url, data=None, headers=None):
    data_bytes = None
    if data is not None:
        data_bytes = json.dumps(data).encode('utf-8')
    req = request.Request(url, data=data_bytes, method='POST')
    headers = headers or {}
    for k, v in headers.items():
        req.add_header(k, v)
    if data_bytes is not None and 'Content-Type' not in headers:
        req.add_header('Content-Type', 'application/json')
    try:
        with request.urlopen(req, timeout=10) as r:
            return r.getcode(), json.loads(r.read().decode())
    except Exception as e:
        print('POST error', url, e)
        return None, None


def http_get(url, headers=None):
    req = request.Request(url, method='GET')
    headers = headers or {}
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with request.urlopen(req, timeout=10) as r:
            return r.getcode(), json.loads(r.read().decode())
    except Exception as e:
        print('GET error', url, e)
        return None, None


def register_user():
    url = f"{API}/api/auth/register"
    payload = {
        "full_name": "E2E Test",
        "email": EMAIL,
        "username": EMAIL.split('@')[0],
        "password": PASSWORD,
    }
    code, body = http_post(url, payload)
    if code == 200 or code == 201:
        print('Registered user:', EMAIL)
        return True
    else:
        print('Register response code:', code, 'body:', body)
        return False


def login_user():
    # main_mongodb login endpoint expects POST with query params email/password
    url = f"{API}/api/auth/token?email={parse.quote(EMAIL)}&password={parse.quote(PASSWORD)}"
    code, body = http_post(url, None, {'Content-Type': 'application/json'})
    if code and code >= 200 and code < 300 and body:
        token = body.get('access_token') or body.get('access_token')
        print('Logged in, token received')
        return token, body
    print('Login failed', code, body)
    return None, None


def log_activity(token):
    url = f"{API}/api/tracking/log"
    payload = {
        "activity_type": "transport",
        "description": "E2E test - biked to work",
        "points_earned": 5,
        "carbon_impact": -1.2
    }
    headers = {'Authorization': f'Bearer {token}'}
    code, body = http_post(url, payload, headers)
    print('Log activity response:', code, body)
    return code == 200 or code == 201


def fetch_history(token):
    url = f"{API}/api/tracking/history?limit=10"
    headers = {'Authorization': f'Bearer {token}'}
    code, body = http_get(url, headers)
    print('History response:', code)
    if body:
        print(json.dumps(body, indent=2, default=str))
    return code == 200


def fetch_monthly_carbon(token):
    url = f"{API}/api/carbon/monthly"
    headers = {'Authorization': f'Bearer {token}'}
    code, body = http_get(url, headers)
    print('Monthly carbon response:', code, body)
    return code == 200


if __name__ == '__main__':
    print('Starting E2E smoke test')
    # Try register (ignore failure if already exists)
    register_user()

    token, raw = login_user()
    if not token:
        print('Cannot continue without token')
        sys.exit(1)

    ok = log_activity(token)
    if not ok:
        print('Logging activity failed')
        sys.exit(1)

    ok = fetch_history(token)
    ok2 = fetch_monthly_carbon(token)

    if ok and ok2:
        print('E2E smoke test completed successfully')
    else:
        print('E2E smoke test encountered issues')
