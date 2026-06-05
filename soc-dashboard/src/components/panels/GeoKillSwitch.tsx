'use client';

import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { CountryBlock } from '@/lib/types';
import { INITIAL_COUNTRY_BLOCKS } from '@/lib/simulation/threatGenerator';
import { ShieldOff, ShieldCheck, Zap } from 'lucide-react';

function GeoKillSwitch({ sendGeoBlock, flushFirewall }: GeoKillSwitchProps) {
  const [countries, setCountries] = useState<CountryBlock[]>(INITIAL_COUNTRY_BLOCKS);

  const toggleBlock = (code: string) => {
    setCountries(prev => prev.map(c => c.countryCode === code ? { ...c, isBlocked: !c.isBlocked } : c));
  };

  const blockAll = () => setCountries(prev => prev.map(c => ({ ...c, isBlocked: true })));

  const threatColor = (t: string) => t === 'CRITICAL' ? '#FF3333' : t === 'HIGH' ? '#FF8C00' : t === 'MEDIUM' ? '#FFCC00' : '#00FF88';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldOff size={10} style={{ color: '#FF8C00' }} />
          <span className="panel-title" style={{ color: '#FF8C00' }}>Geo Kill Switch</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px', gap: 6, padding: '4px 10px', borderBottom: '1px solid rgba(var(--color-accent-rgb),0.1)' }}>
          {['COUNTRY', 'THREAT', 'STATUS', 'ACTION'].map(h => (
            <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {countries.map((c, i) => (
          <motion.div
            key={c.countryCode}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px', gap: 6,
              padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)',
              alignItems: 'center',
            }}
          >
            {/* Country */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{c.flag}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)' }}>{c.country}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>{c.attackCount.toLocaleString()} attacks</div>
              </div>
            </div>

            {/* Threat Level */}
            <span className={`badge badge-${c.threatLevel.toLowerCase()}`}>{c.threatLevel}</span>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: c.isBlocked ? '#FF3333' : '#00FF88',
                boxShadow: `0 0 5px ${c.isBlocked ? '#FF3333' : '#00FF88'}`,
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: c.isBlocked ? '#FF3333' : '#00FF88', fontWeight: 600 }}>
                {c.isBlocked ? 'BLOCKED' : 'ACTIVE'}
              </span>
            </div>

            {/* Action */}
            <button
              className={`btn-block ${c.isBlocked ? 'blocked' : 'unblocked'}`}
              onClick={() => toggleBlock(c.countryCode)}
            >
              {c.isBlocked ? 'UNBLOCK' : 'BLOCK'}
            </button>
          </motion.div>
        ))}
      </div>

      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-panel-border)' }}>
        <button className="hud-btn" onClick={blockAll} style={{ width: '100%', justifyContent: 'center', fontSize: 9, color: '#FF3333', borderColor: 'rgba(255,51,51,0.4)' }}>
          <Zap size={9} />
          APPLY IPTABLES RULES
        </button>
      </div>
    </div>
  );
}

export default memo(GeoKillSwitch);
