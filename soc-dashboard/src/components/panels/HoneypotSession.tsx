'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoneypotEvent } from '@/lib/types';
import { Skull } from 'lucide-react';

interface HoneypotSessionProps {
  events: HoneypotEvent[];
}

export default function HoneypotSession({ events }: HoneypotSessionProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  const latestAttacker = events[0];

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="panel-header">
        <span className="panel-title" style={{ fontSize: 9, color: '#FF8C00' }}>Live Attacker Session (SSH Honeypot)</span>
        <div className="live-dot" style={{ background: '#FF8C00', boxShadow: '0 0 6px #FF8C00' }} />
      </div>

      <div
        ref={logRef}
        className="scroll-area"
        style={{ flex: 1, padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.7 }}
      >
        <AnimatePresence initial={false}>
          {events.slice(0, 12).map(evt => (
            <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 1 }}>
              <span style={{ color: 'rgba(0,255,255,0.4)' }}>
                {evt.timestamp.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              {' '}
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>({evt.srcIp})</span>
              {' '}
              {evt.service === 'SSH' && evt.credentials ? (
                <span style={{ color: '#FF8C00' }}>
                  Trying {evt.credentials.username}:{evt.credentials.password}
                </span>
              ) : (
                <span style={{ color: '#FFCC00' }}>
                  {evt.service} attempt on port {evt.port}
                </span>
              )}
              {evt.commands.slice(0, 1).map((cmd, j) => (
                <div key={j} style={{ paddingLeft: 12, color: 'rgba(0,255,136,0.7)' }}>
                  $ {cmd}
                </div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {latestAttacker && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', borderTop: '1px solid rgba(255,51,51,0.3)',
            background: 'rgba(255,51,51,0.06)', flexShrink: 0,
          }}
        >
          <Skull size={9} style={{ color: '#FF3333', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#FF3333', fontWeight: 700, letterSpacing: '0.08em' }}>
            ATTACKER IP: {latestAttacker.srcIp} — {latestAttacker.srcGeo.country}
          </span>
        </motion.div>
      )}
    </div>
  );
}
