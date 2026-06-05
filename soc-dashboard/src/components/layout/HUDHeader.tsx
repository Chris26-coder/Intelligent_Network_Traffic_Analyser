'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeName, ThreatPacket } from '@/lib/types';
import { AudioManager } from '@/lib/audio/AudioManager';
import { Wifi, Shield, Search, Bell, Palette, User, Activity, Cpu, Zap, X, LogOut, AlertTriangle, ChevronDown } from 'lucide-react';

interface HUDHeaderProps {
  isActive: boolean;
  onToggleActive: () => void;
  streamMode: string;
  riskScore: number;
  uptime: string;
  threats?: ThreatPacket[];
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

const THEMES: { name: ThemeName; label: string; color: string }[] = [
  { name: 'cyberpunk',  label: 'Cyberpunk',  color: '#00FFFF' },
  { name: 'matrix',    label: 'The Matrix',  color: '#00FF41' },
  { name: 'neonred', label: 'Neon Red',   color: '#FF0033' },
  { name: 'biohazard', label: 'Bio-Hazard',  color: '#FFCC00' },
  { name: 'neonvoid',  label: 'Neon Void',   color: '#B829FF' },
];

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#FF3333',
  HIGH: '#FF8C00',
  MEDIUM: '#FFCC00',
  LOW: '#00FF88',
};

export default function HUDHeader({ isActive, onToggleActive, streamMode, riskScore, uptime, threats = [], searchQuery = '', onSearchChange }: HUDHeaderProps) {
  const { theme, themeName, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const scoreColor = riskScore >= 8 ? '#FF3333' : riskScore >= 6 ? '#FF8C00' : '#FFCC00';

  // Derive top alerts from live threats
  const criticalAlerts = useMemo(() => {
    return threats
      .filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH')
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        severity: t.severity,
        title: t.attackType,
        srcIp: t.srcIp,
        dstPort: t.dstPort,
        protocol: t.protocol,
        time: new Date(t.timestamp instanceof Date ? t.timestamp : t.timestamp).toLocaleTimeString('en-US', { hour12: false }),
        color: SEV_COLOR[t.severity] || '#FFCC00',
      }));
  }, [threats]);

  const unreadCount = criticalAlerts.filter(a => !seenIds.has(a.id)).length;

  const handleOpenNotif = () => {
    setNotifOpen(v => !v);
    setThemeOpen(false);
    setUserMenuOpen(false);
    AudioManager.playClick();
    // Mark all as seen
    setSeenIds(new Set(criticalAlerts.map(a => a.id)));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header style={{
      height: 42,
      background: 'rgba(5, 12, 22, 0.98)',
      borderBottom: '1px solid rgba(var(--color-accent-rgb), 0.18)',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: '0 10px',
      flexShrink: 0,
      backdropFilter: 'blur(10px)',
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(var(--color-accent-rgb),0.12)', flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 5,
          background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb),0.3), rgba(var(--color-accent-rgb),0.05))',
          border: '1px solid rgba(var(--color-accent-rgb),0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          boxShadow: '0 0 10px rgba(var(--color-accent-rgb),0.2)',
        }}>🛡️</div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.12em', lineHeight: 1.2 }}>
            INTELLIGENT NETWORK
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.12em', lineHeight: 1.2 }}>
            TRAFFIC ANALYZER
          </div>
        </div>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 12 }}>
        <StatusPill label="SYSTEM STATUS" value="ONLINE" color="#00FF88" icon={<Wifi size={8} />} />
        <StatusPill label="SENSOR" value="CONNECTED" color="#00FF88" icon={<Activity size={8} />} />
        <StatusPill label="AI ENGINE" value="ACTIVE" color="#00FFFF" icon={<Cpu size={8} />} />
        <StatusPill label="HONEYPOT" value="ACTIVE" color="#FF8C00" icon={<Zap size={8} />} />
        <StatusPill label="UPTIME" value={uptime} color="var(--color-text-primary)" />
        <StatusPill label="HOST IP" value="103.21.244.1" color="var(--color-text-primary)" />
        {/* Risk Score */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 12px', borderLeft: '1px solid rgba(var(--color-accent-rgb),0.08)',
          height: 42,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>RISK SCORE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <motion.span
              key={riskScore}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: scoreColor, lineHeight: 1, textShadow: `0 0 8px ${scoreColor}` }}
            >
              {riskScore.toFixed(1)}
            </motion.span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>/ 10</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(var(--color-accent-rgb),0.12)', borderRadius: 4, marginRight: 8 }}>
        <Search size={10} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
        <input 
          placeholder="Search IP, Domain, Country..." 
          value={searchQuery}
          onChange={e => onSearchChange?.(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', width: 180 }} 
        />
      </div>

      {/* Icon controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* ── Notification Bell ── */}
        <div style={{ position: 'relative' }}>
          <button
            id="notif-bell-btn"
            onClick={handleOpenNotif}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: notifOpen ? 'rgba(var(--color-accent-rgb),0.12)' : 'none', border: `1px solid ${notifOpen ? 'rgba(var(--color-accent-rgb),0.3)' : 'transparent'}`, borderRadius: 4, cursor: 'pointer', position: 'relative' }}
          >
            <Bell size={13} style={{ color: 'var(--color-text-dim)' }} />
            {unreadCount > 0 && (
              <motion.div
                key={unreadCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: 3, right: 3,
                  minWidth: 12, height: 12, borderRadius: 6,
                  background: '#FF3333', boxShadow: '0 0 6px #FF3333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 7, color: '#fff', padding: '0 2px',
                }}
              >{unreadCount > 9 ? '9+' : unreadCount}</motion.div>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: 'absolute', top: 34, right: 0, width: 310,
                  background: 'rgba(4,10,22,0.98)', border: '1px solid rgba(var(--color-accent-rgb),0.25)',
                  borderRadius: 6, overflow: 'hidden', zIndex: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}>
                    🔔 CRITICAL ALERTS ({criticalAlerts.length})
                  </span>
                  <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', padding: 0 }}>
                    <X size={11} />
                  </button>
                </div>

                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {criticalAlerts.length === 0 ? (
                    <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                      ✅ No active critical alerts
                    </div>
                  ) : criticalAlerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', flexDirection: 'column', gap: 3,
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={9} style={{ color: alert.color }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: alert.color, fontWeight: 600 }}>
                            [{alert.severity}]
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)' }}>
                            {alert.title}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>{alert.time}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-accent)', paddingLeft: 15 }}>
                        {alert.srcIp} → :{alert.dstPort} ({alert.protocol})
                      </div>
                    </motion.div>
                  ))}
                </div>

                {criticalAlerts.length > 0 && (
                  <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>
                    <button
                      onClick={() => { setSeenIds(new Set(criticalAlerts.map(a => a.id))); setNotifOpen(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-accent)', letterSpacing: '0.1em' }}
                    >DISMISS ALL</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Color Palette (Theme Switcher) ── */}
        <div style={{ position: 'relative' }}>
          <button
            id="palette-btn"
            onClick={() => { setThemeOpen(!themeOpen); setNotifOpen(false); setUserMenuOpen(false); AudioManager.playClick(); }}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: themeOpen ? 'rgba(var(--color-accent-rgb),0.12)' : 'none', border: `1px solid ${themeOpen ? 'rgba(var(--color-accent-rgb),0.3)' : 'transparent'}`, borderRadius: 4, cursor: 'pointer' }}
          >
            <Palette size={13} style={{ color: 'var(--color-text-dim)' }} />
          </button>
          <AnimatePresence>
            {themeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: 'absolute', top: 34, right: 0, width: 170,
                  background: 'rgba(4,10,22,0.98)', border: '1px solid rgba(var(--color-accent-rgb),0.25)',
                  borderRadius: 5, overflow: 'hidden', zIndex: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  SELECT THEME
                </div>
                {THEMES.map(t => (
                  <button key={t.name} onClick={() => { setTheme(t.name); setThemeOpen(false); AudioManager.playThemeSwitch(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '7px 10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: themeName === t.name ? 'rgba(var(--color-accent-rgb),0.1)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--color-accent-rgb),0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = themeName === t.name ? 'rgba(var(--color-accent-rgb),0.1)' : 'transparent')}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: themeName === t.name ? t.color : 'var(--color-text-dim)' }}>{t.label}</span>
                    {themeName === t.name && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: t.color }}>✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── User button ── */}
        <div style={{ position: 'relative' }}>
          <button
            id="user-menu-btn"
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setThemeOpen(false); }}
            style={{
              height: 28, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
              background: 'rgba(var(--color-accent-rgb),0.08)', border: '1px solid rgba(var(--color-accent-rgb),0.2)',
              borderRadius: 4, cursor: 'pointer',
            }}
          >
            <User size={12} style={{ color: 'var(--color-accent)' }} />
            {user && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-accent)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName}
              </span>
            )}
            <ChevronDown size={9} style={{ color: 'var(--color-text-dim)' }} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: 'absolute', top: 34, right: 0, width: 200,
                  background: 'rgba(4,10,22,0.98)', border: '1px solid rgba(var(--color-accent-rgb),0.25)',
                  borderRadius: 5, overflow: 'hidden', zIndex: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
              >
                {user && (
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {user.email}
                    </div>
                  </div>
                )}
                <button onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: 'transparent', color: '#FF6666',
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,51,51,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={11} /> SIGN OUT
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Start / Stop Analysis */}
      <motion.button
        className={`start-btn${isActive ? ' active' : ''}`}
        onClick={onToggleActive}
        whileTap={{ scale: 0.96 }}
        style={{ fontSize: 9, padding: '5px 14px', marginLeft: 10, letterSpacing: '0.12em' }}
      >
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1], opacity: [1, 0.4, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Shield size={11} />
        </motion.div>
        {isActive ? 'STOP ANALYSIS' : 'START ANALYSIS'}
      </motion.button>
    </header>
  );
}

function StatusPill({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '0 10px', borderLeft: '1px solid rgba(var(--color-accent-rgb),0.08)',
      height: 42, flexShrink: 0,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon && <div style={{ color, opacity: 0.8 }}>{icon}</div>}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color, lineHeight: 1 }}>
          {value}
        </span>
      </div>
    </div>
  );
}
