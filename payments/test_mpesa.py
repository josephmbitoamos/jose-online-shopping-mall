import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings


def get_mpesa_access_token():
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate"

    params = {
        "grant_type": "client_credentials"
    }

    response = requests.get(
        url,
        params=params,
        auth=HTTPBasicAuth(
            settings.MPESA_CONSUMER_KEY,
            settings.MPESA_CONSUMER_SECRET
        )
    )

    print("Status Code:", response.status_code)
    print("Response:", response.text)


get_mpesa_access_token()