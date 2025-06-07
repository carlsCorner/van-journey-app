// netlify/functions/fetch-guestbook.js
const { google } = require('googleapis');
require('dotenv').config(); // Load environment variables for local testing

exports.handler = async function(event, context) {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email,
            private_key: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).private_key.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Read-only scope is sufficient
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:H', // Read all columns you care about
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify([])
            };
        }

        // Assume the first row is headers
        const headers = rows[0];
        const entries = rows.slice(1).map(row => {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = row[index];
            });
            return entry;
        });

        // Filter for public entries (guestbook and journal entries)
        const publicEntries = entries.filter(entry => entry.type === 'guestbook' || entry.type === 'journal');

        return {
            statusCode: 200,
            body: JSON.stringify(publicEntries)
        };
    } catch (error) {
        console.error('Error fetching from Google Sheet:', error.message, error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to fetch entries', error: error.message })
        };
    }
};