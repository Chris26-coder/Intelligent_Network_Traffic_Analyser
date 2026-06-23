# Intelligent Network Traffic Analyser (SOC Dashboard)

A modern, high-performance Security Operations Center (SOC) dashboard. This application provides real-time visualization of network threats, honeypot attacks, and system analytics using a sleek, cyberpunk-inspired UI with 3D geographical tracking.

## Features
- **3D Global Threat Map:** Real-time visualization of IP packet paths from attacker origins to your host using hardware-accelerated 3D graphics (Three.js).
- **MITRE ATT&CK Matrix:** Dynamic tracking of attacker techniques and tactics mapped directly to the MITRE framework.
- **Honeypot Feed:** Live monitoring of attack attempts across various simulated services (SSH, HTTP, MySQL, Telnet).
- **Traffic Analytics:** High-performance, memoized charting of network throughput and anomalous activity.
- **AI Threat Insights:** Automated, AI-driven analysis of selected network packets and anomalies.
- **Search & Filtering:** Instantly filter the entire dashboard by IP, Domain, Country, or Attack Type.

## Project Structure

This repository is divided into two main components:

1. **`soc-dashboard/` (Frontend)**
   - Built with Next.js, React, and Turbopack.
   - Uses `framer-motion` for UI animations and `@react-three/fiber` for the 3D globe.
   - Features comprehensive state management and performance optimizations (memoization, pure CSS animations) to handle high-frequency data streams without UI lag.

2. **`backend/` (Backend)**
   - Built with Python (FastAPI).
   - Simulates/analyzes network packet traffic and streams data to the frontend via WebSockets.

## Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **Npcap** (Windows) or **libpcap** (Linux/Mac): Required by the `scapy` library to sniff raw network packets. 
- **Windows OS (Optional but recommended):** The "Geo Kill Switch" feature currently uses Windows `netsh advfirewall` commands to block IPs. If running on Linux/Mac, the dashboard will still work, but the firewall blocking feature will fail.

### Frontend Setup
```bash
cd soc-dashboard
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The backend WebSocket server will start on `http://localhost:8000`.

## Recent Updates
- Improved React rendering performance (batched updates, disabled redundant chart animations).
- Optimized 3D coordinate math for the globe, perfectly aligning equirectangular texture maps with spherical lat/lng nodes.
- Built-in search functionality instantly filtering all dashboard widgets.
- Added Login/Authentication routing.

## License
MIT License
