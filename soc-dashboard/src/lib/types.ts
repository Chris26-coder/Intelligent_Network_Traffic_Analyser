// Core data types for the SOC Dashboard

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ThreatProtocol = 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | 'FTP' | 'SMTP';
export type AttackType =
  | 'Port Scan'
  | 'SSH Brute Force'
  | 'DDoS'
  | 'SQL Injection'
  | 'Web Exploit'
  | 'Malware Activity'
  | 'Reconnaissance'
  | 'C2 Communication'
  | 'Data Exfiltration'
  | 'Ransomware'
  | 'Phishing'
  | 'Zero-Day Exploit';

export type MitreTactic =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege Escalation'
  | 'Defense Evasion'
  | 'Credential Access'
  | 'Discovery'
  | 'Lateral Movement'
  | 'Collection'
  | 'Exfiltration'
  | 'Impact';

export interface GeoCoords {
  lat: number;
  lng: number;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
}

export interface ThreatPacket {
  id: string;
  srcIp: string;
  dstIp: string;
  domain?: string;
  srcPort: number;
  dstPort: number;
  protocol: ThreatProtocol;
  severity: ThreatSeverity;
  attackType: AttackType;
  anomalyScore: number; // 0-10
  packets: number;
  bandwidth: number; // Mbps
  timestamp: Date;
  srcGeo: GeoCoords;
  dstGeo: GeoCoords;
  asn: string;
  isp: string;
  mitreTactic: MitreTactic;
  mitreTechniqueId: string;
  mitreTechniqueName: string;
  flags: string[];
  payloadEntropy: number;
  isBlocked: boolean;
}

export interface HoneypotEvent {
  id: string;
  service: 'SSH' | 'HTTP' | 'Telnet' | 'MySQL' | 'FTP';
  port: number;
  srcIp: string;
  srcGeo: GeoCoords;
  timestamp: Date;
  commands: string[];
  credentials?: { username: string; password: string };
  severity: ThreatSeverity;
  sessionId: string;
}

export interface TrafficStats {
  pps: number;          // packets per second
  bandwidth: number;    // Gbps
  tcpRatio: number;
  udpRatio: number;
  httpRatio: number;
  httpsRatio: number;
  icmpRatio: number;
  dnsRatio: number;
}

export interface CountryBlock {
  countryCode: string;
  country: string;
  flag: string;
  threatLevel: ThreatSeverity;
  isBlocked: boolean;
  attackCount: number;
}

export type StreamMode = 'SIMULATED' | 'LIVE_STREAM';

export type ThemeName = 'cyberpunk' | 'matrix' | 'neonred' | 'biohazard' | 'neonvoid';

export interface Theme {
  name: ThemeName;
  label: string;
  bg: string;
  accent: string;
  alert: string;
  secondary: string;
  description: string;
}

export interface MitreCell {
  tacticId: string;
  tactic: MitreTactic;
  techniqueId: string;
  techniqueName: string;
  state: 'inactive' | 'detected' | 'high-confidence' | 'critical';
}

export interface AlertNotification {
  id: string;
  timestamp: Date;
  title: string;
  body: string;
  severity: ThreatSeverity;
  ip?: string;
}

export interface TimeSeriesPoint {
  time: string;
  pps: number;
  bandwidth: number;
  packets?: number;
}
