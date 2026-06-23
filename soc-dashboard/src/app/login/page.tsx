'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Shield, User, Lock, Mail, Calendar, MapPin, Building, Globe, ChevronRight, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'register';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India',
  'Japan', 'Singapore', 'Netherlands', 'Brazil', 'South Africa', 'UAE', 'Sweden', 'Norway',
  'Switzerland', 'Italy', 'Spain', 'Mexico', 'South Korea', 'Other'
];

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [reg, setReg] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    dob: '', address: '', city: '', state: '', country: '',
  });

  const updateReg = (field: keyof typeof reg, value: string) =>
    setReg(prev => ({ ...prev, [field]: value }));

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(loginEmail, loginPassword);
    setLoading(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed.');
    }
  }, [login, loginEmail, loginPassword, router]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (reg.password !== reg.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (reg.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = register({
      email: reg.email, password: reg.password, firstName: reg.firstName,
      lastName: reg.lastName, dob: reg.dob, address: reg.address,
      city: reg.city, state: reg.state, country: reg.country,
    });
    setLoading(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Registration failed.');
    }
  }, [register, reg, router]);

  return (
    <div style={{
      minHeight: '100vh', background: '#020810',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
      position: 'relative', overflow: 'auto',
      padding: '40px 16px',
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,255,255,0.06) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: mode === 'register' ? 640 : 420, margin: 'auto', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(0,255,255,0.3)', '0 0 40px rgba(0,255,255,0.6)', '0 0 20px rgba(0,255,255,0.3)'] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{
              width: 56, height: 56, borderRadius: 12, margin: '0 auto 14px',
              background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,255,255,0.04))',
              border: '1px solid rgba(0,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}
          >🛡️</motion.div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00FFFF', letterSpacing: '0.2em', textShadow: '0 0 20px rgba(0,255,255,0.6)' }}>
            INTELLIGENT NETWORK TRAFFIC ANALYZER
          </div>
          <div style={{ fontSize: 9, color: 'rgba(0,255,255,0.4)', marginTop: 4, letterSpacing: '0.3em' }}>
            SECURITY OPERATIONS CENTER — v4.2.1
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(4, 14, 28, 0.95)',
          border: '1px solid rgba(0,255,255,0.15)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,255,0.05)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '14px 0',
                  background: mode === m ? 'rgba(0,255,255,0.07)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: mode === m ? '2px solid #00FFFF' : '2px solid transparent',
                  color: mode === m ? '#00FFFF' : 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase', transition: 'all 0.2s',
                }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px 28px' }}>
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
                  onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <AuthField icon={<Mail size={13} />} label="Email Address" type="email"
                    value={loginEmail} onChange={setLoginEmail} placeholder="operator@soc.local" required />
                  <AuthField icon={<Lock size={13} />} label="Password" type={showPassword ? 'text' : 'password'}
                    value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" required
                    extra={<button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,255,255,0.5)', padding: 0 }}>
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>} />

                  {error && <ErrorBox msg={error} />}

                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 0', marginTop: 4,
                      background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,255,255,0.08))',
                      border: '1px solid rgba(0,255,255,0.4)', borderRadius: 6,
                      color: '#00FFFF', fontFamily: 'var(--font-mono)', fontSize: 10,
                      letterSpacing: '0.18em', cursor: loading ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                    }}>
                    {loading ? 'AUTHENTICATING...' : <><Shield size={12} /> AUTHENTICATE</>}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                  onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <SectionLabel>Personal Information</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <AuthField icon={<User size={13} />} label="First Name" value={reg.firstName}
                      onChange={v => updateReg('firstName', v)} placeholder="John" required />
                    <AuthField icon={<User size={13} />} label="Last Name" value={reg.lastName}
                      onChange={v => updateReg('lastName', v)} placeholder="Doe" required />
                  </div>
                  <AuthField icon={<Calendar size={13} />} label="Date of Birth" type="date"
                    value={reg.dob} onChange={v => updateReg('dob', v)} required />

                  <SectionLabel>Address</SectionLabel>
                  <AuthField icon={<MapPin size={13} />} label="Street Address" value={reg.address}
                    onChange={v => updateReg('address', v)} placeholder="123 Security Blvd" required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <AuthField icon={<Building size={13} />} label="City" value={reg.city}
                      onChange={v => updateReg('city', v)} placeholder="New York" required />
                    <AuthField icon={<Building size={13} />} label="State / Province" value={reg.state}
                      onChange={v => updateReg('state', v)} placeholder="NY" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 8, color: 'rgba(0,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      <Globe size={10} style={{ display: 'inline', marginRight: 5 }} />Country
                    </label>
                    <select value={reg.country} onChange={e => updateReg('country', e.target.value)} required
                      style={{
                        background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.15)',
                        borderRadius: 5, padding: '9px 12px',
                        color: reg.country ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
                        fontFamily: 'var(--font-mono)', fontSize: 9, outline: 'none', width: '100%',
                      }}>
                      <option value="" disabled>Select country...</option>
                      {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#040e1c' }}>{c}</option>)}
                    </select>
                  </div>

                  <SectionLabel>Account Credentials</SectionLabel>
                  <AuthField icon={<Mail size={13} />} label="Email Address" type="email"
                    value={reg.email} onChange={v => updateReg('email', v)} placeholder="operator@soc.local" required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <AuthField icon={<Lock size={13} />} label="Password" type={showPassword ? 'text' : 'password'}
                      value={reg.password} onChange={v => updateReg('password', v)} placeholder="Min. 8 chars" required />
                    <AuthField icon={<Lock size={13} />} label="Confirm Password" type={showPassword ? 'text' : 'password'}
                      value={reg.confirmPassword} onChange={v => updateReg('confirmPassword', v)} placeholder="Repeat password" required />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>
                      <input type="checkbox" onChange={() => setShowPassword(!showPassword)}
                        style={{ accentColor: '#00FFFF' }} />
                      Show passwords
                    </label>
                  </div>

                  {error && <ErrorBox msg={error} />}

                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 0', marginTop: 4,
                      background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,255,255,0.08))',
                      border: '1px solid rgba(0,255,255,0.4)', borderRadius: 6,
                      color: '#00FFFF', fontFamily: 'var(--font-mono)', fontSize: 10,
                      letterSpacing: '0.18em', cursor: loading ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                    }}>
                    {loading ? 'CREATING ACCOUNT...' : <><ChevronRight size={12} /> CREATE ACCOUNT</>}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
          CLASSIFIED — AUTHORIZED PERSONNEL ONLY
        </div>
      </motion.div>
    </div>
  );
}

function AuthField({ icon, label, type = 'text', value, onChange, placeholder, required, extra }: {
  icon: React.ReactNode; label: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 8, color: 'rgba(0,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}{label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          style={{
            width: '100%', padding: '9px 12px', paddingRight: extra ? 36 : 12,
            background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.15)',
            borderRadius: 5, color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-mono)', fontSize: 9, outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(0,255,255,0.45)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,255,255,0.15)')}
        />
        {extra && <div style={{ position: 'absolute', right: 10 }}>{extra}</div>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 8, color: 'rgba(0,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase',
      borderBottom: '1px solid rgba(0,255,255,0.08)', paddingBottom: 6, marginTop: 4,
    }}>{children}</div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.3)',
        borderRadius: 5, fontSize: 9, color: '#FF6666',
      }}>
      <AlertCircle size={12} />{msg}
    </motion.div>
  );
}
