'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { useDataStream } from '@/hooks/useDataStream';
import HUDHeader from '@/components/layout/HUDHeader';
import LiveThreatFeed from '@/components/panels/LiveThreatFeed';
import TrafficAnalytics from '@/components/panels/TrafficAnalytics';
import AIThreatInsights from '@/components/panels/AIThreatInsights';
import MITREMatrix from '@/components/panels/MITREMatrix';
import HoneypotFeed from '@/components/panels/HoneypotFeed';
import GeoKillSwitch from '@/components/panels/GeoKillSwitch';
import ForensicTimeline from '@/components/panels/ForensicTimeline';
import VirtualTerminal from '@/components/panels/VirtualTerminal';
import NotificationHub from '@/components/panels/NotificationHub';
import ExecutiveSummary from '@/components/panels/ExecutiveSummary';
import ThreatMap2D from '@/components/panels/ThreatMap2D';
import HoneypotSession from '@/components/panels/HoneypotSession';
import ThreatIntelFeed from '@/components/panels/ThreatIntelFeed';
import PCAPCapture from '@/components/panels/PCAPCapture';
import { AudioManager } from '@/lib/audio/AudioManager';

const Globe3D = dynamic(() => import('@/components/panels/Globe3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      Loading 3D Engine...
    </div>
  ),
});

// ─── Boot Screen ─────────────────────────────────────────────────────────────
const BOOT_LINES = [
  '> Initializing SOC Dashboard v4.2.1...',
  '> Loading threat intelligence modules...',
  '> Connecting to MaxMind GeoIP database...',
  '> Calibrating AI anomaly detection engine...',
  '> Mounting MITRE ATT&CK Enterprise v14...',
  '> Binding honeypot listeners on ports 22, 80, 3306...',
  '> Establishing WebSocket channels...',
  '> Loading packet capture interface...',
  '> System ready. All modules operational.',
];

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setDone(true), 400);
        setTimeout(onComplete, 900);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center', zIndex: 2 }}>
        <motion.div
          animate={{ boxShadow: ['0 0 20px rgba(0,255,255,0.3)', '0 0 40px rgba(0,255,255,0.6)', '0 0 20px rgba(0,255,255,0.3)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: 56, height: 56, borderRadius: 10, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.25), rgba(0,255,255,0.05))',
            border: '1px solid rgba(0,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}
        >🛡️</motion.div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#00FFFF', letterSpacing: '0.2em', textShadow: '0 0 30px rgba(0,255,255,0.8)' }}>
          INTELLIGENT NETWORK TRAFFIC ANALYZER
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,255,255,0.4)', marginTop: 4, letterSpacing: '0.3em' }}>
          SECURITY OPERATIONS CENTER — v4.2.1
        </div>
      </motion.div>

      <div style={{ width: 480, padding: '16px 20px', background: 'rgba(0,15,8,0.9)', border: '1px solid rgba(0,255,255,0.2)', borderRadius: 4, zIndex: 2 }}>
        {lines.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, lineHeight: 1.9, color: i === lines.length - 1 ? '#00FF41' : 'rgba(0,255,136,0.6)' }}>
            {line}
          </motion.div>
        ))}
        {!done && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00FF41' }}>█</motion.span>}
      </div>

      <div style={{ width: 480, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, marginTop: 10, overflow: 'hidden', zIndex: 2 }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(to right, #00FFFF, #00FF88)', borderRadius: 1 }}
          initial={{ width: '0%' }}
          animate={{ width: `${(lines.length / BOOT_LINES.length) * 100}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </motion.div>
  );
}

// ─── Uptime counter ───────────────────────────────────────────────────────────
function useUptime(): string {
  const startRef = useRef(Date.now() - 9120000); // Start at 2h 32m for realism
  const [uptime, setUptime] = useState('2d 14h 32m');
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const d = Math.floor(elapsed / 86400);
      const h = Math.floor((elapsed % 86400) / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setUptime(`${d > 0 ? d + 'd ' : ''}${h}h ${String(m).padStart(2,'0')}m`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  return uptime;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [booting, setBooting] = useState(true);
  const [show3D, setShow3D] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const uptime = useUptime();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const {
    isActive, streamMode, threats, honeypotEvents, trafficStats, timeSeries,
    selectedThreat, selectThreat, aiInsight,
    totalThreatsToday, criticalCount, blockedIPs, anomalyCount, riskScore, setActive, sendGeoBlock, flushFirewall,
    isPaused, togglePause
  } = useDataStream();

  const filteredThreats = useMemo(() => {
    if (!searchQuery.trim()) return threats;
    const q = searchQuery.toLowerCase();
    return threats.filter(t => 
      t.srcIp.toLowerCase().includes(q) ||
      t.dstIp.toLowerCase().includes(q) ||
      t.srcGeo.country.toLowerCase().includes(q) ||
      t.srcGeo.countryCode.toLowerCase().includes(q) ||
      t.attackType.toLowerCase().includes(q) ||
      (t.domain && t.domain.toLowerCase().includes(q))
    );
  }, [threats, searchQuery]);

  // Auto-start simulation after boot
  const handleBootComplete = useCallback(() => {
    setBooting(false);
    setTimeout(() => setActive(true), 300);
  }, [setActive]);

  const handleToggleActive = useCallback(() => {
    if (!isActive) AudioManager.playBoot();
    else AudioManager.playNav();
    setActive(!isActive);
  }, [isActive, setActive]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
  };
  const panelVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  };

  return (
    <>
      <AnimatePresence>
        {booting && <BootScreen onComplete={handleBootComplete} />}
      </AnimatePresence>

      <div className="dashboard-root hud-grid" style={{ background: 'var(--color-bg)' }}>
        {/* Header */}
        <HUDHeader
          isActive={isActive}
          onToggleActive={handleToggleActive}
          streamMode={streamMode}
          riskScore={riskScore}
          uptime={uptime}
          threats={threats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main Dashboard Grid — scrollable with generous min-heights */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={booting ? 'hidden' : 'show'}
          className="scroll-area"
          style={{
            flex: 1,
            display: 'grid',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '5px',
            gap: '5px',
            gridTemplateColumns: '210px 1fr 262px',
            // 6 rows with generous minimum heights to prevent cramping
            gridTemplateRows: 'minmax(400px, 1.8fr) minmax(180px, 0.7fr) minmax(200px, 0.75fr) minmax(180px, 0.7fr) minmax(220px, 0.9fr) minmax(240px, 1fr)',
          }}
        >
          {/* ═══ COLUMN 1 — LEFT SIDEBAR ═══ */}

          {/* Live Threat Feed — rows 1-2 */}
          <motion.div variants={panelVariants} style={{ gridRow: '1 / 3', gridColumn: '1', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <LiveThreatFeed threats={filteredThreats} selectedThreat={selectedThreat} onSelectThreat={selectThreat} isActive={isActive} />
          </motion.div>

          <motion.div variants={panelVariants} style={{ gridRow: '3 / 5', gridColumn: '1', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <GeoKillSwitch threats={filteredThreats} sendGeoBlock={sendGeoBlock} flushFirewall={flushFirewall} />
          </motion.div>

          {/* Honeypot Attack Feed — rows 5-6 */}
          <motion.div variants={panelVariants} style={{ gridRow: '5 / 7', gridColumn: '1', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <HoneypotFeed events={honeypotEvents} isActive={isActive} />
          </motion.div>

          {/* ═══ COLUMN 2 — CENTER ═══ */}

          {/* Global Threat Map — row 1 */}
          <motion.div variants={panelVariants} style={{ gridRow: '1', gridColumn: '2', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {show3D ? (
              <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header">
                  <span className="panel-title">🌐 Global Threat Map — 3D Globe</span>
                  <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(var(--color-accent-rgb),0.25)' }}>
                    <button onClick={() => setShow3D(false)} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px', background: 'transparent', color: 'var(--color-text-dim)', border: 'none', cursor: 'pointer' }}>2D MAP</button>
                    <button style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px', background: 'rgba(var(--color-accent-rgb),0.15)', color: 'var(--color-accent)', border: 'none', cursor: 'pointer' }}>3D GLOBE</button>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Globe3D threats={filteredThreats} selectedThreat={selectedThreat} onSelectThreat={selectThreat} />
                </div>
              </div>
            ) : (
              <ThreatMap2D
                threats={filteredThreats}
                selectedThreat={selectedThreat}
                onSelectThreat={selectThreat}
                onToggle3D={() => setShow3D(true)}
                is3D={false}
              />
            )}
          </motion.div>

          {/* Traffic Analytics — row 2 */}
          <motion.div variants={panelVariants} style={{ gridRow: '2', gridColumn: '2', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TrafficAnalytics stats={trafficStats} timeSeries={timeSeries} />
          </motion.div>

          {/* Honeypot Session Log + Interactive Terminal — row 3 */}
          <motion.div variants={panelVariants} style={{ gridRow: '3', gridColumn: '2', minHeight: 0, height: '100%', display: 'flex', gap: 5 }}>
            <HoneypotSession events={honeypotEvents} />
            <InteractiveTerminalInline selectedIp={selectedThreat?.srcIp} />
          </motion.div>

          {/* Forensic Timeline — row 4 */}
          <motion.div variants={panelVariants} style={{ gridRow: '4', gridColumn: '2', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ForensicTimeline threats={filteredThreats} isActive={isActive} isPaused={isPaused} togglePause={togglePause} />
          </motion.div>

          {/* ═══ COLUMN 3 — RIGHT SIDEBAR ═══ */}

          {/* AI Threat Insights — row 1 */}
          <motion.div variants={panelVariants} style={{ gridRow: '1', gridColumn: '3', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <AIThreatInsights threat={selectedThreat} threats={threats} />
          </motion.div>

          {/* Executive Summary (Gemini AI) — row 2 */}
          <motion.div variants={panelVariants} style={{ gridRow: '2', gridColumn: '3', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ExecutiveSummary
              threats={threats}
              totalThreatsToday={totalThreatsToday}
              criticalCount={criticalCount}
              blockedIPs={blockedIPs}
              anomalyCount={anomalyCount}
              aiInsight={aiInsight}
            />
          </motion.div>

          {/* Threat Intel Feeds — row 3 */}
          <motion.div variants={panelVariants} style={{ gridRow: '3', gridColumn: '3', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ThreatIntelFeed threats={filteredThreats} />
          </motion.div>

          {/* PCAP Capture — row 4 (on top of Notification Hub) */}
          <motion.div variants={panelVariants} style={{ gridRow: '4', gridColumn: '3', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <PCAPCapture threats={filteredThreats} />
          </motion.div>

          {/* ═══ BOTTOM ROW (Spans cols 2 & 3) ═══ */}

          {/* Notification Hub — row 5 */}
          <motion.div variants={panelVariants} style={{ gridRow: '5', gridColumn: '2 / 4', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <NotificationHub threats={threats} honeypotEvents={honeypotEvents} />
          </motion.div>

          {/* ═══ BOTTOM ROW (Spans all columns) ═══ */}
          
          {/* MITRE ATT&CK Matrix — row 6 */}
          <motion.div variants={panelVariants} style={{ gridRow: '6', gridColumn: '2 / 4', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MITREMatrix threats={filteredThreats} />
          </motion.div>
        </motion.div>

        {/* Floating Terminal */}
        <VirtualTerminal selectedThreat={selectedThreat} />
      </div>
    </>
  );
}

import { io, Socket } from 'socket.io-client';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

function InteractiveTerminalInline({ selectedIp }: { selectedIp?: string }) {
  const [output, setOutput] = useState<{ id: string; text: string; color: string }[]>([
    { id: '1', text: 'Welcome to SOC Interactive Terminal.', color: '#00FFFF' },
    { id: '2', text: 'Type "help" for a list of available commands.', color: 'rgba(0,255,136,0.7)' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL);
    socketRef.current.on('terminal_output', (data: { output: string[] }) => {
      setIsProcessing(false);
      const newLines = data.output.map((line, i) => ({
        id: `out-${Date.now()}-${i}`,
        text: line,
        color: 'rgba(0,255,136,0.7)'
      }));
      setOutput(prev => [...prev, ...newLines].slice(-100));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && !isProcessing) {
      const cmd = input.trim();
      setInput('');
      setOutput(prev => [...prev, { id: `cmd-${Date.now()}`, text: `root@soc-dashboard:~# ${cmd}`, color: '#00FFFF' }]);
      
      if (cmd.toLowerCase() === 'clear') {
        setOutput([{ id: 'clear', text: 'Terminal cleared.', color: 'rgba(0,255,136,0.7)' }]);
      } else {
        setIsProcessing(true);
        socketRef.current?.emit('terminal_command', { cmd });
      }
    }
  };

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="panel-header">
        <span className="panel-title" style={{ fontSize: 9 }}>Interactive Terminal</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />)}
        </div>
      </div>
      <div className="scroll-area" style={{ flex: 1, padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.7 }}>
        {output.map((line) => (
          <div key={line.id} style={{ color: line.color || 'transparent', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line.text || '\u00A0'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '5px 8px', borderTop: '1px solid var(--color-panel-border)', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#00FFFF', fontFamily: 'var(--font-mono)', fontSize: 9, marginRight: 5 }}>root@soc-dashboard:~#</span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleCommand}
          disabled={isProcessing}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: 'rgba(0,255,136,0.9)',
            fontFamily: 'var(--font-mono)', fontSize: 9, outline: 'none'
          }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
