'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { Clock, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface ForensicTimelineProps {
  threats: ThreatPacket[];
  isActive: boolean;
  isPaused?: boolean;
  togglePause?: () => void;
}

const SPEEDS = [1, 2, 5, 10] as const;

export default function ForensicTimeline({ threats, isActive, isPaused = false, togglePause }: ForensicTimelineProps) {
  const [speed, setSpeed] = useState<1 | 2 | 5 | 10>(1);
  const [sliderPos, setSliderPos] = useState(100); // 100 = live

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Timeline markers
  const markers = now ? Array.from({ length: 6 }, (_, i) => {
    const t = new Date(now.getTime() - (5 - i) * 600000);
    return t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }) : Array.from({ length: 6 }, (_, i) => `--:--:${i}`);

  // Prepare chart data from threats
  const chartData = [...threats].reverse().map((t, i) => ({
    index: i,
    anomaly: t.anomalyScore,
    severity: t.severity === 'CRITICAL' ? 10 : t.severity === 'HIGH' ? 7 : 3,
  }));

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top row: Timeline header + PCAP capture side by side */}
      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
        {/* Timeline section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={10} style={{ color: 'var(--color-accent)' }} />
              <span className="panel-title">Forensic Timeline (Time-Machine)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-accent)' }}>
                {now ? now.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'}
              </span>
              {isPaused ? <span className="badge badge-warning" style={{ fontSize: 7, background: 'rgba(255, 140, 0, 0.2)', color: '#FF8C00' }}>PAUSED</span> 
                        : <span className="badge badge-critical" style={{ fontSize: 7 }}>LIVE</span>}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <button className="hud-btn" style={{ padding: '3px 6px' }} onClick={() => setSliderPos(0)}>
              <SkipBack size={9} />
            </button>
            <button className="hud-btn" style={{ padding: '3px 8px' }} onClick={() => togglePause?.()}>
              {!isPaused ? <Pause size={9} /> : <Play size={9} />}
            </button>
            <button className="hud-btn" style={{ padding: '3px 6px' }} onClick={() => setSliderPos(100)}>
              <SkipForward size={9} />
            </button>

            {/* Speed buttons */}
            <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, padding: '3px 6px',
                    background: speed === s ? 'rgba(var(--color-accent-rgb),0.2)' : 'transparent',
                    border: `1px solid ${speed === s ? 'var(--color-accent)' : 'rgba(var(--color-accent-rgb),0.2)'}`,
                    color: speed === s ? 'var(--color-accent)' : 'var(--color-text-dim)',
                    borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >{s}×</button>
              ))}
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              2024-05-16
            </div>
          </div>

          {/* Visualization & Slider */}
          <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Chart */}
            <div style={{ height: 35, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3333" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF3333" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 10]} hide />
                  <Area type="monotone" dataKey="severity" stroke="#FF3333" fillOpacity={1} fill="url(#colorAnomaly)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Markers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              {markers.map((m, i) => (
                <span key={`marker-${i}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>{m}</span>
              ))}
            </div>
            {/* Range input */}
            <div style={{ position: 'relative' }}>
              <input
                type="range" min="0" max="100" value={sliderPos}
                onChange={e => setSliderPos(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)', height: 4, cursor: 'pointer' }}
              />
              {/* Event markers on timeline */}
              {threats.slice(0, 12).map((t, i) => (
                <div
                  key={`threat-${t.id}-${i}`}
                  style={{
                    position: 'absolute', top: -4, width: 4, height: 4, borderRadius: '50%',
                    background: t.severity === 'CRITICAL' ? '#FF3333' : t.severity === 'HIGH' ? '#FF8C00' : '#FFCC00',
                    left: `${10 + i * 7}%`, transform: 'translateX(-50%)',
                    boxShadow: `0 0 4px ${t.severity === 'CRITICAL' ? '#FF3333' : '#FF8C00'}`,
                    cursor: 'pointer',
                  }}
                  title={`${t.attackType} from ${t.srcIp}`}
                />
              ))}
            </div>
          </div>
      </div>
    </div>
    </div>
  );
}
