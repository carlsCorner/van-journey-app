const { google } = require('googleapis');

exports.handler = async (event, context) => {
    try {
        // Load env vars
        const sheetId = process.env.GOOGLE_SHEET_ID;
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

        // Authenticate
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Fetch data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Journey!A2:D' // Adjust sheet name and range
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ points: [] })
            };
        }

        // Map rows to JSON
        const points = rows.map(row => ({
            timestamp: row[0],
            lat: parseFloat(row[1]),
            lon: parseFloat(row[2]),
            location: row[3] || ''
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ points })
        };

    } catch (error) {
        console.error('Error fetching journey data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
