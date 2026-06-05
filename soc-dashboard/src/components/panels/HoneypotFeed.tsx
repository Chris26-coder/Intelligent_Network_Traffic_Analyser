'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoneypotEvent } from '@/lib/types';
import { Bug, Skull } from 'lucide-react';

interface HoneypotFeedProps {
  events: HoneypotEvent[];
  isActive: boolean;
}

const SERVICE_COLORS: Record<string, string> = {
  SSH: '#00FFFF', HTTP: '#FF8C00', Telnet: '#FFCC00', MySQL: '#B829FF', FTP: '#00FF88',
};

function HoneypotFeed({ events, isActive }: HoneypotFeedProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [highInterest, setHighInterest] = useState(false);

  // Count attacks by service
  const serviceCounts = events.reduce((acc, e) => {
    acc[e.service] = (acc[e.service] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Flash on critical honeypot hit
  useEffect(() => {
    const crit = events[0];
    if (crit?.severity === 'CRITICAL') {
      setHighInterest(true);
      const t = setTimeout(() => setHighInterest(false), 3000);
      return () => clearTimeout(t);
    }
  }, [events[0]?.id]);

  // Auto-scroll SSH log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  const latestEvent = events[0];
  const sshEvent = events.find(e => e.service === 'SSH');

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bug size={10} style={{ color: '#FF8C00' }} />
          <span className="panel-title" style={{ color: '#FF8C00' }}>Honeypot Attack Feed</span>
        </div>
        {isActive && <div className="live-dot" style={{ background: '#FF8C00', boxShadow: '0 0 6px #FF8C00' }} />}
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {highInterest && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'rgba(255,51,51,0.15)', borderBottom: '1px solid rgba(255,51,51,0.4)',
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
              overflow: 'hidden',
            }}
          >
            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <Skull size={12} style={{ color: '#FF3333' }} />
            </motion.div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#FF3333', fontWeight: 700, letterSpacing: '0.1em' }}>
              !! HONEYPOT TRIGGERED — HIGH INTEREST ATTACKER
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service rows */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries({ SSH: 22, HTTP: 80, Telnet: 23, MySQL: 3306 }).map(([svc, port]) => {
          const count = serviceCounts[svc] ?? 0;
          const color = SERVICE_COLORS[svc];
          return (
            <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `rgba(${color === '#00FFFF' ? '0,255,255' : color === '#FF8C00' ? '255,140,0' : color === '#FFCC00' ? '255,204,0' : '184,41,255'},0.1)`,
                border: `1px solid ${color}33`, borderRadius: 3,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color, fontWeight: 700 }}>{svc}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)' }}>Port {port}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, fontWeight: 600 }}>{count} attacks</span>
                </div>
                {/* Mini progress bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 2 }}>
                  <motion.div
                    style={{ height: '100%', background: color, borderRadius: 1 }}
                    animate={{ width: `${Math.min(100, count * 5)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              {/* Live dots */}
              {count > 0 && isActive && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }}
                      style={{ width: 4, height: 4, borderRadius: '50%', background: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hud-divider" style={{ margin: '0 10px' }} />

      {/* SSH Live Session Log */}
      <div style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Live Attacker Session (SSH Honeypot)
        </div>
        <div
          ref={logRef}
          className="scroll-area"
          style={{
            flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.8,
            color: 'rgba(0,255,136,0.8)', background: 'rgba(0,0,0,0.3)', borderRadius: 4,
            padding: '6px 8px', maxHeight: 120,
          }}
        >
          <AnimatePresence initial={false}>
            {events.slice(0, 8).map((evt, i) => (
              <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span style={{ color: 'rgba(0,255,255,0.5)', fontSize: 8 }}>
                  {evt.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>
                  {evt.srcIp}
                </span>
                {evt.service === 'SSH' && evt.credentials && (
                  <span style={{ color: '#FF8C00' }}>
                    Trying {evt.credentials.username}:{evt.credentials.password}
                  </span>
                )}
                {evt.commands.slice(0, 1).map((cmd, j) => (
                  <div key={j} style={{ paddingLeft: 8, color: 'rgba(0,255,136,0.7)' }}>
                    $ {cmd}
                  </div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
          {events[0] && (
            <motion.div
              style={{
                marginTop: 4, color: '#FF3333', fontWeight: 700, fontSize: 9,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Skull size={9} />
              ATTACKER IP: {events[0].srcIp} — {events[0].srcGeo.country}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(HoneypotFeed);
