'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreatPacket, HoneypotEvent, StreamMode, TrafficStats, TimeSeriesPoint } from '@/lib/types';
import { generateThreatPacket, generateHoneypotEvent, generateTimeSeriesPoint } from '@/lib/simulation/threatGenerator';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface DataStreamState {
  isActive: boolean;
  streamMode: StreamMode;
  threats: ThreatPacket[];
  honeypotEvents: HoneypotEvent[];
  trafficStats: TrafficStats;
  timeSeries: TimeSeriesPoint[];
  selectedThreat: ThreatPacket | null;
  aiInsight: string;
  totalThreatsToday: number;
  criticalCount: number;
  blockedIPs: number;
  anomalyCount: number;
  riskScore: number;
  setActive: (v: boolean) => void;
  selectThreat: (t: ThreatPacket | null) => void;
  sendCommand: (cmd: string) => void;
  sendGeoBlock: (countryCode: string, block: boolean) => void;
  flushFirewall: () => void;
  isPaused: boolean;
  togglePause: () => void;
}

const INITIAL_STATS: TrafficStats = {
  pps: 12443, bandwidth: 1.26,
  tcpRatio: 58.2, udpRatio: 19.7, httpRatio: 12.1, httpsRatio: 7.3, icmpRatio: 1.9, dnsRatio: 0.8,
};

export function useDataStream(): DataStreamState {
  const [isActive, setIsActive] = useState(false);
  const [streamMode, setStreamMode] = useState<StreamMode>('SIMULATED');
  const [threats, setThreats] = useState<ThreatPacket[]>([]);
  const [honeypotEvents, setHoneypotEvents] = useState<HoneypotEvent[]>([]);
  const [trafficStats, setTrafficStats] = useState<TrafficStats>(INITIAL_STATS);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(() => {
    const pts: TimeSeriesPoint[] = [];
    for (let i = 0; i < 20; i++) pts.push(generateTimeSeriesPoint(12000));
    return pts;
  });
  const [selectedThreat, setSelectedThreat] = useState<ThreatPacket | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("Analyzing network traffic heuristics...");
  const [counters, setCounters] = useState({ total: 0, critical: 0, blocked: 0, anomaly: 0, risk: 0 });
  const [isPaused, setIsPaused] = useState(false);
  
  const isPausedRef = useRef(false);
  const bufferedThreatsRef = useRef<ThreatPacket[]>([]);
  const bufferedHoneypotsRef = useRef<HoneypotEvent[]>([]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      isPausedRef.current = next;
      // If unpausing, flush buffers
      if (!next) {
        if (bufferedThreatsRef.current.length > 0) {
          setThreats(t => [...bufferedThreatsRef.current, ...t].slice(0, 100));
          bufferedThreatsRef.current = [];
        }
        if (bufferedHoneypotsRef.current.length > 0) {
          setHoneypotEvents(h => [...bufferedHoneypotsRef.current, ...h].slice(0, 50));
          bufferedHoneypotsRef.current = [];
        }
      }
      return next;
    });
  }, []);

  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const honeypotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveAccumulatorRef = useRef({ bytes: 0, packets: 0, tcp: 0, udp: 0 });
  const socketRef = useRef<any>(null);

  const startSimulation = useCallback(() => {
    // Generate initial batch
    const initial: ThreatPacket[] = [];
    for (let i = 0; i < 8; i++) initial.push(generateThreatPacket());
    setThreats(initial);

    const honeyInitial: HoneypotEvent[] = [];
    for (let i = 0; i < 3; i++) honeyInitial.push(generateHoneypotEvent());
    setHoneypotEvents(honeyInitial);

    setCounters({ total: 247, critical: 8, blocked: 34, anomaly: 48, risk: 87 });

    simIntervalRef.current = setInterval(() => {
      const pkts: ThreatPacket[] = [];
      for (let i = 0; i < 2; i++) pkts.push(generateThreatPacket());
      const critCount = pkts.filter(p => p.severity === 'CRITICAL').length;
      const blockedCount = pkts.filter(p => p.isBlocked).length;
      const anomCount = pkts.filter(p => p.anomalyScore > 7).length;
      if (isPausedRef.current) {
        pkts.forEach(pkt => { bufferedThreatsRef.current.unshift(pkt); });
        if (bufferedThreatsRef.current.length > 100) bufferedThreatsRef.current.length = 100;
      } else {
        setThreats(prev => [...pkts, ...prev].slice(0, 100));
      }
      setCounters(prev => ({
        total: prev.total + pkts.length,
        critical: prev.critical + critCount,
        blocked: prev.blocked + blockedCount,
        anomaly: prev.anomaly + anomCount,
        risk: Math.min(100, prev.risk + critCount),
      }));
    }, 2500);

    honeypotIntervalRef.current = setInterval(() => {
      const evt = generateHoneypotEvent();
      if (isPausedRef.current) {
        bufferedHoneypotsRef.current.unshift(evt);
        if (bufferedHoneypotsRef.current.length > 50) bufferedHoneypotsRef.current.pop();
      } else {
        setHoneypotEvents(prev => [evt, ...prev].slice(0, 50));
      }
    }, 4000);

    statsIntervalRef.current = setInterval(() => {
      setTimeSeries(prev => {
        const next = [...prev, generateTimeSeriesPoint(12000)].slice(-20);
        return next;
      });
      setTrafficStats(prev => ({
        ...prev,
        pps: Math.floor(10000 + Math.random() * 5000),
        bandwidth: parseFloat((1.0 + Math.random() * 0.5).toFixed(2)),
      }));
    }, 3000);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (honeypotIntervalRef.current) clearInterval(honeypotIntervalRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
  }, []);

  const tryLiveConnection = useCallback(() => {
    if (!BACKEND_URL) {
      setStreamMode('SIMULATED');
      startSimulation();
      return;
    }
    // Dynamic import to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      const socket = io(BACKEND_URL, { timeout: 5000 });
      socketRef.current = socket;

      socket.on('connect', () => {
        setStreamMode('LIVE_STREAM');
        
        // Start live chart update interval
        if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = setInterval(() => {
          const acc = liveAccumulatorRef.current;
          
          // Calculate stats for this 1.5s window
          const windowPps = Math.floor(acc.packets / 1.5);
          const windowBw = parseFloat((acc.bytes / 1024 / 1024 / 1.5).toFixed(2));
          
          // Determine protocol ratio for this window
          const totalProto = Math.max(1, acc.tcp + acc.udp);
          const tcpRatio = parseFloat(((acc.tcp / totalProto) * 100).toFixed(1));
          const udpRatio = parseFloat(((acc.udp / totalProto) * 100).toFixed(1));

          // Update chart
          setTimeSeries(prev => {
            const pt = generateTimeSeriesPoint(12000);
            pt.bandwidth = windowBw || 0.1;
            pt.packets = windowPps || 5;
            return [...prev, pt].slice(-20);
          });
          
          // Update analytics panel
          setTrafficStats(prev => ({
            ...prev,
            pps: windowPps || 10,
            bandwidth: windowBw || 0.05,
            tcpRatio: tcpRatio || 50,
            udpRatio: udpRatio || 50
          }));
          
          // Reset accumulator
          liveAccumulatorRef.current = { bytes: 0, packets: 0, tcp: 0, udp: 0 };
        }, 1500);
      });
      
      socket.on('packet_telemetry', (data: any) => {
        // Convert timestamp to Date object
        data.timestamp = new Date(data.timestamp);
        
        // Add fallback properties that the frontend interface expects but backend doesn't send
        data.dstGeo = data.dstGeo || { lat: 19.0760, lng: 72.8777, country: 'India', city: 'Mumbai', countryCode: 'IN', flag: '🇮🇳' };
        data.isp = data.isp || 'Unknown ISP';
        
        // Dynamic MITRE mapping
        let tactic = 'Execution';
        let techId = 'T1059';
        let techName = 'Command and Scripting Interpreter';
        
        if (data.attackType) {
          const type = data.attackType.toLowerCase();
          if (type.includes('brute force')) {
            tactic = 'Credential Access'; techId = 'T1110'; techName = 'Brute Force';
          } else if (type.includes('recon') || type.includes('probe') || type.includes('scan')) {
            tactic = 'Discovery'; techId = 'T1046'; techName = 'Network Service Discovery';
          } else if (type.includes('exploit') || type.includes('injection')) {
            tactic = 'Initial Access'; techId = 'T1190'; techName = 'Exploit Public-Facing Application';
          } else if (type.includes('amplification') || type.includes('ddos') || type.includes('dos')) {
            tactic = 'Impact'; techId = 'T1498'; techName = 'Network Denial of Service';
          }
        }
        
        data.mitreTactic = data.mitreTactic || tactic;
        data.mitreTechniqueId = data.mitreTechniqueId || techId;
        data.mitreTechniqueName = data.mitreTechniqueName || techName;
        data.flags = data.flags || [data.protocol === 'TCP' ? 'SYN' : 'UDP'];
        
        // Calculate realistic pseudo-entropy (between 2.0 and 7.9) based on bytes
        const baseEntropy = Math.min(7.9, 2.0 + (data.bytes || 0) / 500);
        data.payloadEntropy = data.payloadEntropy || parseFloat(baseEntropy.toFixed(2));
        
        data.bandwidth = data.bandwidth || (data.bytes / 1024 / 1024);

        // Update live accumulator
        liveAccumulatorRef.current.bytes += data.bytes || 0;
        liveAccumulatorRef.current.packets += 1;
        if (data.protocol === 'TCP') liveAccumulatorRef.current.tcp += 1;
        if (data.protocol === 'UDP') liveAccumulatorRef.current.udp += 1;

        if (isPausedRef.current) {
          bufferedThreatsRef.current.unshift(data);
          if (bufferedThreatsRef.current.length > 100) bufferedThreatsRef.current.pop();
        } else {
          setThreats(prev => [data as ThreatPacket, ...prev].slice(0, 100));
        }

        // Update summary counters
        setCounters(prev => ({
          total: prev.total + 1,
          critical: data.severity === 'CRITICAL' ? prev.critical + 1 : prev.critical,
          blocked: data.isBlocked ? prev.blocked + 1 : prev.blocked,
          anomaly: data.anomalyScore > 7 ? prev.anomaly + 1 : prev.anomaly,
          risk: Math.min(100, prev.risk + (data.severity === 'CRITICAL' ? 1 : 0)),
        }));
      });
      socket.on('ai_insight', (text: string) => {
        setAiInsight(text);
      });
      socket.on('honeypot_event', (event: any) => {
        // Hydrate timestamp back to Date object
        event.timestamp = new Date(event.timestamp);
        
        if (isPausedRef.current) {
          bufferedHoneypotsRef.current.unshift(event);
          if (bufferedHoneypotsRef.current.length > 50) bufferedHoneypotsRef.current.pop();
        } else {
          setHoneypotEvents(prev => [event as HoneypotEvent, ...prev].slice(0, 50));
        }
      });
      socket.on('connect_error', () => {
        setStreamMode('SIMULATED');
        if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        startSimulation();
      });
      socket.on('disconnect', () => {
        setStreamMode('SIMULATED');
        if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        startSimulation();
      });
    });
  }, [startSimulation]);

  useEffect(() => {
    if (isActive) {
      tryLiveConnection();
    } else {
      stopSimulation();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
    return () => {
      stopSimulation();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isActive, tryLiveConnection, stopSimulation]);

  const setActive = useCallback((v: boolean) => setIsActive(v), []);

  const sendCommand = useCallback((cmd: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('terminal_command', { cmd });
    } else {
      console.warn("Socket not connected, cannot send command.");
    }
  }, []);

  const sendGeoBlock = useCallback((countryCode: string, block: boolean) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('geo_block', { countryCode, block });
    } else {
      console.warn("Socket not connected, cannot send geo block.");
    }
  }, []);

  const flushFirewall = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('clear_firewall');
    } else {
      console.warn("Socket not connected, cannot flush firewall.");
    }
  }, []);

  return {
    isActive, streamMode, threats, honeypotEvents, trafficStats, timeSeries,
    selectedThreat, selectThreat: setSelectedThreat, aiInsight,
    totalThreatsToday: counters.total,
    criticalCount: counters.critical,
    blockedIPs: counters.blocked,
    anomalyCount: counters.anomaly,
    riskScore: parseFloat(((counters.critical / Math.max(counters.total, 1)) * 10).toFixed(1)),
    setActive, sendCommand, sendGeoBlock, flushFirewall,
    isPaused, togglePause
  };
}
