'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { Maximize2, Plus, Minus, RotateCcw, Globe, ZoomIn, ZoomOut, X } from 'lucide-react';
import { geoEquirectangular } from 'd3-geo';
import { WORLD_PATHS } from './WorldPaths';

// ─── Mercator projection ──────────────────────────────────────────────────────
const MAP_W = 920;
const MAP_H = 480;

const projection = geoEquirectangular()
  .scale(146.42254764454373)
  .translate([460, 231.87988833333333]);

function lngLatToXY(lng: number, lat: number): [number, number] {
  return projection([lng, lat]) as [number, number];
}

// ─── Severity colors ──────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#FF2222',
  HIGH:     '#FF8C00',
  MEDIUM:   '#FFCC00',
  LOW:      '#00FF88',
};

// ─── Server location (Mumbai) ─────────────────────────────────────────────────
const SERVER_LNG = 72.88;
const SERVER_LAT = 19.07;
const [SERVER_X, SERVER_Y] = lngLatToXY(SERVER_LNG, SERVER_LAT);

interface ThreatMap2DProps {
  threats: ThreatPacket[];
  selectedThreat: ThreatPacket | null;
  onSelectThreat: (t: ThreatPacket | null) => void;
  onToggle3D: () => void;
  is3D: boolean;
}

export default function ThreatMap2D({ threats, selectedThreat, onSelectThreat, onToggle3D, is3D }: ThreatMap2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute source positions for rendered threats
  const threatPositions = threats.slice(0, 40).map(t => ({
    t,
    xy: lngLatToXY(t.srcGeo.lng, t.srcGeo.lat) as [number, number],
  }));

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={10} style={{ color: 'var(--color-accent)' }} />
          <span className="panel-title">Global Threat Map</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 2D / 3D toggle */}
          <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(var(--color-accent-rgb),0.25)' }}>
            <button style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', background: 'rgba(var(--color-accent-rgb),0.15)', color: 'var(--color-accent)', border: 'none', cursor: 'pointer' }}>2D MAP</button>
            <button onClick={onToggle3D} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', background: 'transparent', color: 'var(--color-text-dim)', border: 'none', cursor: 'pointer' }}>3D GLOBE</button>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(SEV_COLOR).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}` }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#021525" />
              <stop offset="100%" stopColor="#010B14" />
            </radialGradient>
            {/* Grid line pattern */}
            <pattern id="grid" width="46" height="24" patternUnits="userSpaceOnUse">
              <path d={`M 46 0 L 0 0 0 24`} fill="none" stroke="rgba(0,180,255,0.06)" strokeWidth="0.5" />
            </pattern>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {threatPositions.map(({ t }) => (
              <radialGradient key={`grad-${t.id}`} id={`arcGrad-${t.id}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={SEV_COLOR[t.severity]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={SEV_COLOR[t.severity]} stopOpacity="0.1" />
              </radialGradient>
            ))}
          </defs>

          {/* Ocean background */}
          <rect width={MAP_W} height={MAP_H} fill="url(#oceanGrad)" />
          <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />

          {/* Equator + Tropics */}
          <line x1="0" y1={MAP_H / 2} x2={MAP_W} y2={MAP_H / 2} stroke="rgba(0,200,255,0.08)" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1={MAP_H * 0.385} x2={MAP_W} y2={MAP_H * 0.385} stroke="rgba(0,200,255,0.04)" strokeWidth="0.5" />
          <line x1="0" y1={MAP_H * 0.615} x2={MAP_W} y2={MAP_H * 0.615} stroke="rgba(0,200,255,0.04)" strokeWidth="0.5" />

          {/* Continents */}
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} fill="rgba(20,50,80,0.85)" stroke="rgba(0,200,255,0.25)" strokeWidth="0.5" />
          ))}

          {/* Attack arcs */}
          {threatPositions.map(({ t, xy }) => {
            const [x1, y1] = xy;
            const [x2, y2] = [SERVER_X, SERVER_Y];
            const cx = (x1 + x2) / 2;
            const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.35;
            const color = SEV_COLOR[t.severity];
            const isSelected = selectedThreat?.id === t.id;
            return (
              <g key={t.id} onClick={() => onSelectThreat(isSelected ? null : t)} style={{ cursor: 'pointer' }}>
                {/* Arc shadow */}
                <path
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeOpacity={isSelected ? 0.3 : 0.12}
                  filter="url(#glowStrong)"
                />
                {/* Arc line */}
                <motion.path
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isSelected ? 1 : 0.6 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                {/* Moving packet dot */}
                <motion.circle
                  r={isSelected ? 3 : 2}
                  fill={color}
                  filter="url(#glow)"
                  style={{ offsetPath: `path("M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}")` } as React.CSSProperties}
                  animate={{ offsetDistance: ['0%', '100%'] }}
                  transition={{ duration: 2 + Math.random(), ease: 'linear', repeat: Infinity, delay: Math.random() * 2 }}
                />
                {/* Source node */}
                <motion.circle
                  cx={x1} cy={y1} r={isSelected ? 5 : 3.5}
                  fill={color}
                  fillOpacity={0.8}
                  stroke={color}
                  strokeWidth={1}
                  filter="url(#glow)"
                  animate={{ r: isSelected ? [5, 7, 5] : [3.5, 5, 3.5], fillOpacity: [0.8, 0.4, 0.8] }}
                  transition={{ repeat: Infinity, duration: t.severity === 'CRITICAL' ? 1 : 2, ease: 'easeInOut' }}
                />
              </g>
            );
          })}

          {/* Server / Your Server node */}
          <g>
            {/* Rings */}
            {[18, 28, 38].map((r, i) => (
              <motion.circle
                key={r}
                cx={SERVER_X} cy={SERVER_Y} r={r}
                fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="0.5"
                animate={{ r: [r, r + 4, r], opacity: [0.4, 0.1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
              />
            ))}
            {/* Core */}
            <circle cx={SERVER_X} cy={SERVER_Y} r={6} fill="rgba(0,255,255,0.2)" stroke="#00FFFF" strokeWidth={1.5} filter="url(#glow)" />
            <circle cx={SERVER_X} cy={SERVER_Y} r={3} fill="#00FFFF" />
            {/* Label */}
            <text x={SERVER_X + 10} y={SERVER_Y - 8} fill="#00FFFF" fontSize="9" fontFamily="monospace" fontWeight="700">YOUR SERVER</text>
            <text x={SERVER_X + 10} y={SERVER_Y + 2} fill="rgba(0,255,255,0.6)" fontSize="7" fontFamily="monospace">103.21.244.1</text>
            <text x={SERVER_X + 10} y={SERVER_Y + 10} fill="rgba(0,255,255,0.4)" fontSize="7" fontFamily="monospace">Mumbai, India</text>
          </g>
        </svg>

        {/* Threat Detail Card (overlay, triggered by selection) */}
        <AnimatePresence>
          {selectedThreat && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                position: 'absolute', right: 8, top: 8, width: 188,
                background: 'rgba(2,10,20,0.97)', border: '1px solid rgba(var(--color-accent-rgb),0.35)',
                borderRadius: 5, padding: '8px 10px', backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 0 12px rgba(var(--color-accent-rgb),0.1)',
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--color-accent)' }}>
                  THREAT DETAILS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${selectedThreat.severity.toLowerCase()}`}>{selectedThreat.severity}</span>
                  <button onClick={() => onSelectThreat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', padding: 0 }}>
                    <X size={10} />
                  </button>
                </div>
              </div>
              {[
                ['Source IP', selectedThreat.srcIp],
                ['Country', `${selectedThreat.srcGeo.flag} ${selectedThreat.srcGeo.country}`],
                ['ASN', selectedThreat.asn],
                ['Type', selectedThreat.attackType],
                ['Protocol', selectedThreat.protocol],
                ['Port', `${selectedThreat.dstPort}`],
                ['Packets', selectedThreat.packets.toLocaleString()],
                ['Score', `${selectedThreat.anomalyScore} / 10`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-primary)', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
              <button className="hud-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 8, padding: '4px 0' }}>
                RUN DIAGNOSTICS
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threat count badge */}
        <div style={{
          position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>
            Active Threats: <span style={{ color: '#FF3333', fontWeight: 700 }}>{threats.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
