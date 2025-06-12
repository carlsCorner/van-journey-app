const { google } = require('googleapis');

exports.handler = async (event, context) => {
    try {
        const sheets = google.sheets({ version: 'v4' });

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const client = await auth.getClient();
        google.options({ auth: client });

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A2:H', // A to H columns
        });

        const rows = res.data.values;

        if (!rows || rows.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ points: [] }),
            };
        }

        const points = rows.map(row => ({
            timestamp: row[0],
            type: row[1] || '',
            name: row[2] || '',
            message: row[3] || '',
            location: row[4] || '',
            lat: parseFloat(row[5]),
            lon: parseFloat(row[6]),
            image_url: row[7] || '',
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ points }),
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error('Error fetching journey data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
