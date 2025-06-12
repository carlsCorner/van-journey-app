const { google } = require('googleapis');
require('dotenv').config(); // Only needed for local dev

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  const body = JSON.parse(event.body);
  const {
    type,
    name,
    message,
    location,
    lat,
    lon,
    image_url,
    password,
    action,
    public: isPublic
  } = body;

  if (action === 'verify') {
    console.log('Submitted password:', password);
    console.log('Env password:', process.env.PRIVATE_PAGE_PASSWORD);

    const isAuthorized = password === process.env.PRIVATE_PAGE_PASSWORD;
    return {
        statusCode: isAuthorized ? 200 : 401,
        body: JSON.stringify({
            success: isAuthorized,
            message: isAuthorized ? 'Access granted' : 'Invalid password'
        })
    };
}

  if (!type || !name || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required fields: type, name, message' })
    };
  }

  if (type === 'journal' && password !== process.env.PRIVATE_PAGE_PASSWORD) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Unauthorized: Invalid password' })
    };
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const rowData = [
    new Date().toISOString(),
    type,
    name,
    message,
    location || '',
    lat || '',
    lon || '',
    image_url || '',
    isPublic ? 'Yes' : 'No'
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:I',
      valueInputOption: 'RAW',
      resource: { values: [rowData] }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Entry submitted successfully!' })
    };
  } catch (error) {
    console.error('Google Sheets Error:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to submit entry',
        error: error.message
      })
    };
  }
};
