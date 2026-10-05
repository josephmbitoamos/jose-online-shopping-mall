import base64
import requests
from datetime import datetime
from django.conf import settings


def get_access_token():
    """
    Get OAuth access token from Safaricom Daraja.
    """

    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate"

    response = requests.get(
        url,
        params={
            "grant_type": "client_credentials"
        },
        auth=(
            settings.MPESA_CONSUMER_KEY,
            settings.MPESA_CONSUMER_SECRET
        )
    )

    response.raise_for_status()

    return response.json()["access_token"]


def initiate_stk_push(phone_number, amount, account_reference, transaction_desc):
    """
    Initiate M-PESA Express STK Push.
    """

    access_token = get_access_token()

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY

    password_string = f"{shortcode}{passkey}{timestamp}"

    password = base64.b64encode(
        password_string.encode()
    ).decode("utf-8")

    url = (
        "https://sandbox.safaricom.co.ke/"
        "mpesa/stkpush/v1/processrequest"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc,
    }

    response = requests.post(
        url,
        json=payload,
        headers=headers
    )

    return response.json()
def query_stk_push(checkout_request_id):
    """
    Query the status of an M-Pesa STK Push transaction.
    """

    access_token = get_access_token()

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY

    password_string = f"{shortcode}{passkey}{timestamp}"

    password = base64.b64encode(
        password_string.encode()
    ).decode("utf-8")

    url = (
        "https://sandbox.safaricom.co.ke/"
        "mpesa/stkpushquery/v1/query"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    response = requests.post(
        url,
        json=payload,
        headers=headers
    )

    return response.json()