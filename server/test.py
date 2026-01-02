import os
import sys
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ----------------------------------
# Load server/.env explicitly
# ----------------------------------
ENV_PATH = os.path.join("server", ".env")

if not os.path.exists(ENV_PATH):
    print(f"❌ Env file not found at {ENV_PATH}")
    sys.exit(1)

load_dotenv(ENV_PATH)
print("✅ Loaded server/.env")

# ----------------------------------
# Validate environment variables
# ----------------------------------
REQUIRED_VARS = [
    "PORT",
    "NODE_ENV",
    "GOOGLE_SHEET_ID",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
]

missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
if missing:
    print("❌ Missing environment variables:")
    for v in missing:
        print(f"   - {v}")
    sys.exit(1)

print("✅ All required environment variables are present")

# ----------------------------------
# Prepare Google credentials
# ----------------------------------
private_key = os.getenv("GOOGLE_PRIVATE_KEY").replace("\\n", "\n")

credentials_info = {
    "type": "service_account",
    "project_id": "ai-team-482111",
    "private_key": private_key,
    "client_email": os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    "token_uri": "https://oauth2.googleapis.com/token",
}

try:
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
    )
    print("✅ Google credentials initialized")
except Exception as e:
    print("❌ Google credentials failed")
    print(e)
    sys.exit(1)

# ----------------------------------
# Connect to Google Sheets
# ----------------------------------
try:
    service = build("sheets", "v4", credentials=credentials)
    sheet = service.spreadsheets()
    print("✅ Connected to Google Sheets API")
except Exception as e:
    print("❌ Sheets API connection failed")
    print(e)
    sys.exit(1)

# ----------------------------------
# Read test data
# ----------------------------------
try:
    result = sheet.values().get(
        spreadsheetId=os.getenv("GOOGLE_SHEET_ID"),
        range="A1:E5"
    ).execute()

    rows = result.get("values", [])

    if not rows:
        print("⚠️ Sheet accessible but empty")
    else:
        print("✅ Sheet read successful:")
        for r in rows:
            print(r)

except Exception as e:
    print("❌ Failed to read Google Sheet")
    print(e)
    sys.exit(1)

print("\n🎉 SUCCESS: server/.env keys are valid and working")
