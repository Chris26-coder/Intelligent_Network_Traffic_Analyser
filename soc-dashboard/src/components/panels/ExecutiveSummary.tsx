'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { BarChart3, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ExecutiveSummaryProps {
  threats: ThreatPacket[];
  totalThreatsToday: number;
  criticalCount: number;
  blockedIPs: number;
  anomalyCount: number;
  aiInsight: string;
}

const THREAT_INTEL_FEEDS = [
  { name: 'AbuseIPDB',      ip: '185.220.101.45', status: 'Malicious', color: '#FF3333' },
  { name: 'AlienVault OTX', ip: '103.45.67.89',   status: 'Scanner',   color: '#FF8C00' },
  { name: 'VirusTotal',     ip: '185.220.101.45', status: '8 / 89',    color: '#FF8C00' },
  { name: 'GreyNoise',      ip: '185.159.158.26', status: 'Noisy',     color: '#FFCC00' },
];

export default function ExecutiveSummary({ threats, totalThreatsToday, criticalCount, blockedIPs, anomalyCount, aiInsight }: ExecutiveSummaryProps) {
  const topAttackType = threats.length > 0
    ? threats.reduce((acc, t) => { acc[t.attackType] = (acc[t.attackType] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    : {};
  const topType = Object.entries(topAttackType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Port Scan';

  const topRegion = threats.length > 0
    ? threats.reduce((acc, t) => { acc[t.srcGeo.country] = (acc[t.srcGeo.country] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    : {};
  const topCountry = Object.entries(topRegion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Germany';

  // Mini sparkline data
  const sparkData = Array.from({ length: 12 }, (_, i) => ({ v: Math.floor(20 + Math.random() * 60) }));

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={10} style={{ color: 'var(--color-accent)' }} />
            <span className="panel-title">Executive Summary (AI Generated)</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '8px 10px' }}>
          {[
            { label: 'Threats Today', value: totalThreatsToday, color: 'var(--color-accent)', trend: 'up' },
            { label: 'Critical',      value: criticalCount,     color: '#FF3333',              trend: 'up' },
            { label: 'Blocked IPs',   value: blockedIPs,        color: '#00FF88',              trend: 'up' },
            { label: 'Anomalies',     value: anomalyCount,      color: '#FF8C00',              trend: 'down' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(var(--color-accent-rgb),0.1)',
              borderRadius: 4, padding: '6px 8px',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', marginBottom: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
              <motion.div
                key={s.value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}
              >
                {s.value}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Summary stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 10px 6px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Top Attack Type</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#FF3333', fontWeight: 600 }}>{topType}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Most Active Region</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)', fontWeight: 600 }}>{topCountry}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Risk Trend (24h)</div>
            <div style={{ height: 24 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Line type="monotone" dataKey="v" stroke="#FF8C00" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div style={{ padding: '0 10px 8px', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>AI Recommendation</span>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }}
            />
          </div>
          <motion.div
            key={aiInsight}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', lineHeight: 1.6,
              padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 4,
              border: '1px solid rgba(var(--color-accent-rgb),0.15)',
              boxShadow: 'inset 0 0 10px rgba(var(--color-accent-rgb), 0.05)'
            }}>
            {aiInsight}
          </motion.div>
        </div>
      </div>
  );
}
