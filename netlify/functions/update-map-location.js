// netlify/functions/update-map-location.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config(); // Load environment variables for local testing

// Define the path for the static JSON file that Leaflet will read
const MAP_DATA_FILE_PATH = path.join(__dirname, '../../public/map-data.json'); // Relative to the function's location

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    const { password, lat, lon } = JSON.parse(event.body);

    if (password !== process.env.PRIVATE_PAGE_PASSWORD) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized: Invalid password' })
        };
    }

    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields: lat, lon' })
        };
    }

    // Append to Google Sheet (same as submit-journal, but only if type is 'journal')
    // We already do this in submit-journal, but this function's primary purpose is for map updates.
    // If you want to ONLY update map data here, you'd remove the Google Sheet integration.
    // However, it's good to keep track of ALL updates in the sheet for a single source of truth.

    // For map updates, we will read the current locations, add the new one, and rewrite the file.
    let currentPoints = [];
    try {
        if (fs.existsSync(MAP_DATA_FILE_PATH)) {
            const fileContent = fs.readFileSync(MAP_DATA_FILE_PATH, 'utf8');
            currentPoints = JSON.parse(fileContent).points || [];
        }
    } catch (error) {
        console.warn('Could not read existing map-data.json, starting fresh.', error);
        currentPoints = [];
    }

    const newPoint = { lat: parseFloat(lat), lon: parseFloat(lon), timestamp: new Date().toISOString() };
    currentPoints.push(newPoint);

    try {
        fs.writeFileSync(MAP_DATA_FILE_PATH, JSON.stringify({ points: currentPoints }, null, 2), 'utf8');

        // Trigger Netlify build hook to redeploy the site with the new map-data.json
        // This is crucial because Netlify Functions cannot directly modify deployed static files.
        // The function writes to *its local file system*, which will be deployed on *the next build*.
        // Therefore, we need to trigger a build.
        // You'll need to create a Build Hook in your Netlify settings and add it as an environment variable.
        const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
        if (buildHookUrl) {
            await fetch(buildHookUrl, { method: 'POST' });
            console.log('Netlify build hook triggered.');
        } else {
            console.warn('NETLIFY_BUILD_HOOK_URL not set. Map data update will require manual redeploy.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Map location updated and build triggered!' })
        };
    } catch (error) {
        console.error('Error writing map data or triggering build:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to update map location', error: error.message })
        };
    }
};