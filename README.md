# Van Journey App 🚐✨

This is a personal travel app to document and share the adventures of our van journeys.  
Built with simple HTML, JavaScript, and Netlify Functions — deployed live on Netlify.

## Features

- 📍 **Live Tracking** — track and display current van location on a map.
- 📝 **Private Journal** — personal travel notes, protected by password.
- 💬 **Guestbook** — visitors can leave public comments.
- 🖼️ **Photos** — journey images showcased on the homepage.
- ⚙️ **Serverless Functions** — powered by Netlify Functions and Google Sheets API.

## Project Structure


## Deployment

This app is deployed on **Netlify**.  
On every push to the `main` branch, Netlify will automatically:

1. Install dependencies (`npm install`)
2. Bundle and deploy the Functions
3. Deploy the static site to the `public/` folder

## Environment Variables

These are set in Netlify’s dashboard:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `PRIVATE_PAGE_PASSWORD`
- `NETLIFY_BUILD_HOOK_URL`

## License

MIT License.
