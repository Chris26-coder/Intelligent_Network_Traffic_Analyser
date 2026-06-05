'use client';

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { Radio, Eye } from 'lucide-react';

interface LiveThreatFeedProps {
  threats: ThreatPacket[];
  selectedThreat: ThreatPacket | null;
  onSelectThreat: (t: ThreatPacket | null) => void;
  isActive: boolean;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#FF2222', HIGH: '#FF8C00', MEDIUM: '#FFCC00', LOW: '#00FF88',
};

function LiveThreatFeed({ threats, selectedThreat, onSelectThreat, isActive }: LiveThreatFeedProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? threats.slice(0, 50) : threats.slice(0, 8);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Radio size={9} style={{ color: '#FF3333' }} />
          <span className="panel-title" style={{ color: '#FF3333' }}>Live Threat Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>LIVE</span>
          <div className="live-dot" style={{ background: '#FF3333', boxShadow: '0 0 5px #FF3333' }} />
        </div>
      </div>

      {/* Feed */}
      <div className="scroll-area" style={{ flex: 1 }}>
        <AnimatePresence initial={false}>
          {displayed.map(threat => {
            const isSelected = selectedThreat?.id === threat.id;
            const color = SEV_COLOR[threat.severity];
            return (
              <motion.div
                key={threat.id}
                layout
                initial={{ opacity: 0, x: -12, backgroundColor: `${color}22` }}
                animate={{ opacity: 1, x: 0, backgroundColor: isSelected ? `${color}18` : 'transparent' }}
                exit={{ opacity: 0, x: -12 }}
                onClick={() => onSelectThreat(isSelected ? null : threat)}
                style={{
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s',
                }}
                whileHover={{ backgroundColor: `${color}10` }}
              >
                {/* Row 1: Flag + IP + Severity + Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, lineHeight: 1 }}>{threat.srcGeo.flag}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: isSelected ? color : 'var(--color-text-primary)', lineHeight: 1 }}>
                        {threat.srcIp}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', lineHeight: 1, marginTop: 1 }}>
                        {threat.srcGeo.country}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span className={`badge badge-${threat.severity.toLowerCase()}`}>{threat.severity}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>
                      {threat.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                  </div>
                </div>
                {/* Row 2: Attack type + Packets */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: color, fontWeight: 600 }}>
                    {threat.attackType}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>
                    {threat.packets.toLocaleString()} pkts
                  </span>
                </div>
                {/* Severity bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 4 }}>
                  <motion.div
                    style={{ height: '100%', background: color, borderRadius: 1, boxShadow: `0 0 4px ${color}` }}
                    animate={{ width: `${Math.min(100, threat.anomalyScore * 10)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* View All */}
      <button
        onClick={() => setShowAll(!showAll)}
        style={{
          width: '100%', padding: '7px 0', background: 'rgba(var(--color-accent-rgb),0.06)',
          border: 'none', borderTop: '1px solid rgba(var(--color-accent-rgb),0.12)',
          color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 9,
          fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--color-accent-rgb),0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(var(--color-accent-rgb),0.06)')}
      >
        <Eye size={9} />
        {showAll ? 'SHOW LESS' : `VIEW ALL THREATS (${threats.length})`}
      </button>
    </div>
  );
}

export default memo(LiveThreatFeed);
