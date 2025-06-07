// netlify/functions/submit-journal.js
const { google } = require('googleapis');
require('dotenv').config(); // Load environment variables for local testing

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    const { type, name, message, location, lat, lon, image_url, password } = JSON.parse(event.body);

    // Basic validation for required fields
    if (!type || !name || !message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields: type, name, message' })
        };
    }

    // Password check for 'journal' type
    if (type === 'journal' && password !== process.env.PRIVATE_PAGE_PASSWORD) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized: Invalid password' })
        };
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email,
            private_key: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).private_key.replace(/\\n/g, '\n'), // Handle escaped newlines
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Data to append to the sheet
    const rowData = [
        new Date().toISOString(), // timestamp
        type,                     // type (journal or guestbook)
        name,                     // name
        message,                  // message
        location || '',           // location (only for journal)
        lat || '',                // lat (only for journal)
        lon || '',                // lon (only for journal)
        image_url || ''           // image_url (only for journal)
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:H', // Assuming your sheet is named 'Sheet1' and has 8 columns
            valueInputOption: 'RAW',
            resource: {
                values: [rowData],
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Entry submitted successfully!' })
        };
    } catch (error) {
        console.error('Error appending to Google Sheet:', error.message, error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to submit entry', error: error.message })
        };
    }
};