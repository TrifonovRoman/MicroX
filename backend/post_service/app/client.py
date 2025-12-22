import requests
import os
from flask import request

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://localhost:5000")

def validate_user(auth_header):
    headers = {}
    cookies = None

    if auth_header:
        headers['Authorization'] = auth_header

    if request.cookies:
        cookies = request.cookies

    try:
        r = requests.get(f"{USER_SERVICE_URL}/users/me", headers=headers, cookies=cookies, timeout=3)
    except requests.RequestException:
        return None

    if r.status_code != 200:
        return None
    return r.json()