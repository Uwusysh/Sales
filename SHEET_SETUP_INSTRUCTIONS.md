# Action Required: Connect Google Sheet

I have successfully updated the application with your Service Account credentials. 
However, **I am missing the Google Sheet ID** to store the data.

## Please follow these steps:

1.  **Create a New Google Sheet** (or open an existing one you want to use).
2.  **Share the Sheet** with this email address (as Editor):
    
    `sheets-access-sales@ai-team-482111.iam.gserviceaccount.com`

3.  **Copy the Spreadsheet ID** from the URL.
    *   URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit`
    *   Example ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

4.  **Send me the ID**, or run this command in the terminal to set it:

    ```bash
    # Replace with your actual ID
    echo GOOGLE_SHEET_ID=your_actual_sheet_id_here >> server/.env
    ```

Once you provide the ID, I will run the database setup script to generate the 7 required sheets automatically.
