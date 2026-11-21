Lamu Port Track - port operations and cargo tracking (prototype)
================================================================

HOW TO RUN
1. Unzip this folder anywhere on your PC (Windows, Mac or Linux).
2. Double-click "index.html". It opens in Chrome, Edge, Firefox or Safari.
No installation, internet connection or server is needed.
Keep these files together in the same folder: index.html, ops.js, ops.css.
(Online, the page loads two Google fonts. Offline it uses your system fonts.)

WHAT IS NEW (modelled on how world-class terminals such as Singapore run smoothly)
- Port operations: one-screen health check. Berth occupancy, vessel waiting time,
  gate waiting time, container yard blocks, quay crane productivity, and
  risk-based customs channels (green / yellow / red).
- Berth planner: a 72-hour berth timetable that rebuilds itself after every change.
  Priority (reefer/pharma) ships go first, short jobs before long ones, with ageing so
  nobody waits forever. "Just-in-time arrival" tells ships to slow down at sea instead
  of queuing at anchorage, with an estimate of CO2 avoided.
  Buttons: delay the next arrival, add an arriving vessel.
- Truck gate: appointment slots for the next 24 hours. Excess trucks are moved to quieter
  hours. Compare waiting time with and without appointments, and book a slot
  for each container waiting at the port.
- Surge simulator: raise traffic from 1x to 3x and switch between 3 and 6 berths. It
  compares first-come-first-served against smart planning on identical traffic and tells
  you when the port has hit its physical limit.
- Existing views are unchanged: Control tower, Shipments, Vessels, Alerts.

NOTES
- All data is sample data and every metric is simulated. Numbers such as 26 moves per crane
  per hour, 60 trucks per hour at the gate and the CO2 factor are assumptions, not Lamu figures.
- There is no database yet: changes reset when the page is reloaded.
- To change the sample data, open ops.js in a text editor (Notepad, VS Code):
    INB  = inbound vessels (name, line, units, ETA in hours, 1 = priority cargo)
    BF   = hours until each berth is free,  CAP = gate trucks per hour,  CR = crane moves/hour
  The older shipment lists "S" and "V" are near the bottom of index.html.

NEXT STEPS FOR REAL TRAFFIC
Connect real feeds (AIS vessel positions, terminal operating system, KRA/KenTrade customs,
gate cameras and e-seals) through a backend and database, then replace the simulated
numbers. The planning logic in ops.js can move to the server unchanged.

OPTIONAL: run on a local web server
  Python:  python -m http.server 8000     then open http://localhost:8000
