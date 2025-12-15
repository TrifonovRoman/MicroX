import requests
import os

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL")

def validate_token(auth_header):
    if not auth_header:
        return None

    headers = {"Authorization": auth_header}
    r = requests.get(f"{USER_SERVICE_URL}/users/me", headers=headers)

    if r.status_code != 200:
        return None

    return r.json()
