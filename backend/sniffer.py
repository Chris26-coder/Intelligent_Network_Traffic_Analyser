import time
import uuid
import logging
from scapy.all import sniff, IP, TCP, UDP
from scapy.utils import PcapWriter
from geoip import get_geoip
import asyncio
import threading

logger = logging.getLogger(__name__)

PORT_ATTACK_MAP = {
    22: ("SSH Brute Force", "HIGH"),
    23: ("Telnet Probe", "HIGH"),
    80: ("HTTP Recon", "LOW"),
    443: ("Encrypted TLS Stream", "LOW"),
    3389: ("RDP Exploit Attempt", "CRITICAL"),
    445: ("SMB Ransomware Probe", "CRITICAL"),
    53: ("DNS Amplification", "MEDIUM"),
    3306: ("MySQL Injection", "HIGH"),
}

_pcap_writer = None
_pcap_lock = threading.Lock()

def start_pcap_capture(filename="capture.pcap"):
    global _pcap_writer
    with _pcap_lock:
        if _pcap_writer:
            _pcap_writer.close()
        _pcap_writer = PcapWriter(filename, append=False, sync=True)
        return True

def stop_pcap_capture():
    global _pcap_writer
    with _pcap_lock:
        if _pcap_writer:
            _pcap_writer.close()
            _pcap_writer = None
            return True
    return False

def analyze_packet(packet):
    if not packet.haslayer(IP):
        return None

    ip_layer = packet.getlayer(IP)
    src_ip = ip_layer.src
    dst_ip = ip_layer.dst
    
    if src_ip == "127.0.0.1" and dst_ip == "127.0.0.1":
        return None

    src_port = 0
    dst_port = 0
    protocol = "UNKNOWN"
    
    if packet.haslayer(TCP):
        tcp_layer = packet.getlayer(TCP)
        src_port = tcp_layer.sport
        dst_port = tcp_layer.dport
        protocol = "TCP"
    elif packet.haslayer(UDP):
        udp_layer = packet.getlayer(UDP)
        src_port = udp_layer.sport
        dst_port = udp_layer.dport
        protocol = "UDP"
    else:
        return None

    # Filter out mDNS / SSDP noise unless you want massive spam
    if dst_port in [5353, 1900]:
        return None

    src_geo = get_geoip(src_ip)
    
    attack_type, severity = PORT_ATTACK_MAP.get(dst_port, PORT_ATTACK_MAP.get(src_port, ("Generic Traffic", "LOW")))
    
    anomaly_score = 1.2
    if severity == "CRITICAL":
        anomaly_score = 8.5 + (len(packet) % 15) / 10.0
    elif severity == "HIGH":
        anomaly_score = 6.0 + (len(packet) % 20) / 10.0
    elif severity == "MEDIUM":
        anomaly_score = 4.0 + (len(packet) % 10) / 10.0
    
    threat_packet = {
        "id": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "srcIp": src_ip,
        "dstIp": dst_ip,
        "srcPort": src_port,
        "dstPort": dst_port,
        "protocol": protocol,
        "attackType": attack_type,
        "severity": severity,
        "srcGeo": src_geo,
        "anomalyScore": round(anomaly_score, 1),
        "asn": src_geo.get("asn", "Local"),
        "packets": 1,
        "bytes": len(packet),
        "isBlocked": severity == "CRITICAL"
    }
    return threat_packet

def start_sniffing(queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
    def packet_handler(pkt):
        global _pcap_writer
        with _pcap_lock:
            if _pcap_writer:
                _pcap_writer.write(pkt)
                
        try:
            threat = analyze_packet(pkt)
            if threat:
                asyncio.run_coroutine_threadsafe(queue.put(threat), loop)
        except Exception as e:
            pass # ignore malformed packets safely

    def sniff_thread():
        logger.info("Starting Scapy packet sniffer. (Ensure you have Admin rights/Npcap on Windows)")
        try:
            sniff(prn=packet_handler, store=False)
        except Exception as e:
            logger.error(f"Failed to start sniffer: {e}. Check Admin rights or Npcap installation.")

    t = threading.Thread(target=sniff_thread, daemon=True)
    t.start()
