import requests
import os

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL")
POST_SERVICE_URL = os.environ.get("POST_SERVICE_URL")

def validate_user(auth_header):
    if not auth_header:
        return None

    r = requests.get(
        f"{USER_SERVICE_URL}/users/me",
        headers={"Authorization": auth_header}
    )

    if r.status_code != 200:
        return None

    return r.json()

def validate_post(post_id):
    r = requests.get(f"{POST_SERVICE_URL}/posts/{post_id}")
    return r.status_code == 200
