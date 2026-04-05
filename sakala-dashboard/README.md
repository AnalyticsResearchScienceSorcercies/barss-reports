# SAKALA Community Wealth Fund - Transparency Dashboard

Public-facing single-page dashboard showing exactly where every dollar goes.

## Quick Start

Serve the directory with any static file server:

```bash
# Python
cd sakala_dashboard
python -m http.server 8000

# Node
npx serve .

# Or just open index.html in a browser (subscriber lookup requires a server for fetch)
```

Then visit `http://localhost:8000`.

## Deployment

### GitHub Pages

1. Copy the four files (`index.html`, `style.css`, `dashboard.js`, `data.json`) to a GitHub Pages repo or subdirectory.
2. Push. The site is live.

### Any Static Host

Works on Netlify, Vercel, Cloudflare Pages, or any web server. No build step required.

## Connecting Real Data

The dashboard reads from `data.json` on load and refreshes every 60 seconds.

To connect to live treasury data:

1. Replace the static `data.json` with an API endpoint that returns the same JSON schema.
2. In `dashboard.js`, change `DATA_URL` to point to your API:

```js
const DATA_URL = 'https://your-api.example.com/treasury/status';
```

3. Alternatively, run `treasury_monitor.py` as a cron job that writes updated `data.json` to the served directory.

## Data Schema

See `data.json` for the full schema. Key sections:

- `overview` - Fund totals, member count, Phi score
- `split` - Allocation percentages and dollar amounts
- `transactions` - Array of recent transactions with Base chain hashes
- `impact` - Youth employed, franchise sites, merchants, books, cards
- `comparison` - USAID vs SAKALA Phi scores and reach rates
- `subscribers` - Keyed by subscriber ID (SAK-XXXXXX), contains split breakdown and youth info

## Customization

- **Colors:** Edit CSS variables in `:root` block in `style.css`
- **Split percentages:** Update both `data.json` and the donut `conic-gradient` in `style.css`
- **Refresh interval:** Change `REFRESH_INTERVAL` in `dashboard.js` (milliseconds)
- **BaseScan URL:** Change `BASESCAN_URL` in `dashboard.js` if using a different block explorer

## Dependencies

None. Zero external dependencies. Works offline once loaded (except Google Fonts, which fall back to system fonts).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main dashboard page |
| `style.css` | All styles (dark mode, responsive, print-friendly) |
| `dashboard.js` | Data loading, counter animation, subscriber lookup |
| `data.json` | Sample data (replace with live feed) |
