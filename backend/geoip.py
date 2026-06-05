import requests
import functools
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_flag_emoji(country_code: str) -> str:
    if not country_code or len(country_code) != 2:
        return "🌐"
    return chr(ord(country_code[0]) + 127397) + chr(ord(country_code[1]) + 127397)

@functools.lru_cache(maxsize=1024)
def get_geoip(ip: str):
    if ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172.") or ip == "127.0.0.1" or ip.startswith("169.254."):
        return {
            "lat": 0.0,
            "lng": 0.0,
            "country": "Local Network",
            "city": "Localhost",
            "flag": "🏠",
            "asn": "Local"
        }
    
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon,as"
        resp = requests.get(url, timeout=2)
        data = resp.json()
        
        if data.get("status") == "success":
            return {
                "lat": data.get("lat", 0.0),
                "lng": data.get("lon", 0.0),
                "country": data.get("country", "Unknown"),
                "city": data.get("city", "Unknown"),
                "flag": get_flag_emoji(data.get("countryCode", "")),
                "asn": data.get("as", "")
            }
    except Exception as e:
        logger.warning(f"GeoIP failed for {ip}: {e}")
        
    return {
        "lat": 0.0,
        "lng": 0.0,
        "country": "Unknown",
        "city": "Unknown",
        "flag": "🌐",
        "asn": "Unknown"
    }
