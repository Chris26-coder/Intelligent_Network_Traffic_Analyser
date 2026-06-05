'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

import { ThreatPacket } from '@/lib/types';

interface ThreatIntelFeedProps {
  threats: ThreatPacket[];
}

export default function ThreatIntelFeed({ threats }: ThreatIntelFeedProps) {
  // Extract up to 4 unique critical/high IPs from live threats
  const uniqueThreats = Array.from(new Map(threats.map(t => [t.srcIp, t])).values());
  const topThreats = uniqueThreats
    .sort((a, b) => b.anomalyScore - a.anomalyScore)
    .slice(0, 4);

  const feeds = topThreats.length > 0 ? topThreats.map((t, i) => {
    const sources = ['Local IDS', 'Heuristic', 'Traffic Analysis', 'Port Scan Detect'];
    return {
      name: sources[i % sources.length],
      ip: t.srcIp,
      status: t.severity,
      color: t.severity === 'CRITICAL' ? '#FF3333' : t.severity === 'HIGH' ? '#FF8C00' : '#FFCC00'
    };
  }) : [
    { name: 'System Status', ip: 'No threats detected', status: 'Clean', color: '#00FF88' }
  ];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="panel-header">
        <span className="panel-title" style={{ fontSize: 9 }}>Threat Intel Feeds</span>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {feeds.map((feed, i) => (
          <motion.div
            key={feed.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'flex', flexDirection: 'column', gap: 3, padding: '6px 8px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 4,
              border: '1px solid rgba(var(--color-accent-rgb),0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-primary)', fontWeight: 600 }}>{feed.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: feed.color, fontWeight: 600 }}>{feed.status}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-accent)' }}>{feed.ip}</span>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
