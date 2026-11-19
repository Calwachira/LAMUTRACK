LamuTrack - Lamu Port cargo tracking (prototype)
================================================

HOW TO RUN
1. Unzip this folder anywhere on your PC (Windows, Mac or Linux).
2. Double-click "index.html". It opens in your browser (Chrome, Edge, Firefox or Safari).
No installation, internet connection or server is needed.
(Online, the page loads two Google fonts. Offline it falls back to your system fonts.)

WHAT IT DOES
- Control tower: live route map from Lamu Port, KPIs and active shipments
- Shipment detail: journey timeline, ETA, truck, driver, e-seal, documents
- Shipments table with search and filters, plus a "New shipment" form
- Vessels and Alerts views

NOTES
- All data is sample data and truck positions are simulated.
- There is no database yet: shipments you add reset when the page is reloaded.
- To change the sample data, open index.html in a text editor (Notepad, VS Code)
  and edit the "S" (shipments) and "V" (vessels) lists in the script near the bottom.

OPTIONAL: run on a local web server (needed only if you later add a backend)
  Python:  python -m http.server 8000     then open http://localhost:8000
