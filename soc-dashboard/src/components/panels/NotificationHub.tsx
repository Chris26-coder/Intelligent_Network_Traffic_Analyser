'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, MessageSquare, Send, Mail, ExternalLink } from 'lucide-react';
import { ThreatPacket, HoneypotEvent } from '@/lib/types';
import { Socket } from 'socket.io-client';

interface NotifEntry {
  id: string;
  time: string;
  title: string;
  body: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

type WebhookTab = 'Discord' | 'Slack' | 'Telegram' | 'Email';

const severityColor = (s: string) => s === 'CRITICAL' ? '#FF3333' : s === 'HIGH' ? '#FF8C00' : '#FFCC00';

interface NotificationHubProps {
  threats?: ThreatPacket[];
  honeypotEvents?: HoneypotEvent[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function NotificationHub({ threats = [], honeypotEvents = [] }: NotificationHubProps) {
  const [activeTab, setActiveTab] = useState<WebhookTab>('Discord');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testSent, setTestSent] = useState(false);
  const sentWebhooksRef = useRef<Set<string>>(new Set());
  const [notifs, setNotifs] = useState<NotifEntry[]>([]);
  const internalSocketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      internalSocketRef.current = io(BACKEND_URL);
    });
    return () => {
      internalSocketRef.current?.disconnect();
    };
  }, []);

  // Load webhook URL from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('soc_webhook_url');
    if (saved) setWebhookUrl(saved);
  }, []);

  // Save webhook URL on change
  useEffect(() => {
    if (webhookUrl) localStorage.setItem('soc_webhook_url', webhookUrl);
  }, [webhookUrl]);

  // Derive notifications from live data
  useEffect(() => {
    const allNotifs: NotifEntry[] = [];
    
    threats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').forEach(t => {
      allNotifs.push({
        id: t.id,
        time: new Date(t.timestamp).toLocaleTimeString('en-US', { hour12: false }),
        title: `Threat from ${t.srcIp} (${t.srcGeo.countryCode})`,
        body: `${t.attackType} on port ${t.dstPort}`,
        severity: t.severity,
      });
    });

    honeypotEvents.forEach(h => {
      allNotifs.push({
        id: h.id,
        time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour12: false }),
        title: `Honeypot Triggered: ${h.service}`,
        body: `Attacker IP: ${h.srcIp}`,
        severity: h.severity,
      });
    });

    // Sort by newest first
    allNotifs.sort((a, b) => b.id.localeCompare(a.id));
    // Keep top 20
    const topNotifs = allNotifs.slice(0, 20);
    setNotifs(topNotifs);

    // Fire webhook for new critical/high alerts
    if (webhookUrl && internalSocketRef.current) {
      topNotifs.forEach(n => {
        if (!sentWebhooksRef.current.has(n.id) && (n.severity === 'CRITICAL' || n.severity === 'HIGH')) {
          sentWebhooksRef.current.add(n.id);
          const payload = {
            content: `🚨 **${n.severity} ALERT**: ${n.title}\n> ${n.body}`,
            username: "SOC Dashboard",
          };
          internalSocketRef.current?.emit('send_webhook', { url: webhookUrl, payload });
        }
      });
    }
  }, [threats, honeypotEvents, webhookUrl]);

  const handleTestSend = () => {
    if (webhookUrl && internalSocketRef.current) {
      internalSocketRef.current.emit('send_webhook', {
        url: webhookUrl,
        payload: { content: "✅ **SOC Dashboard**: Webhook test successful!", username: "SOC Dashboard" }
      });
    }
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={10} style={{ color: 'var(--color-accent)' }} />
          <span className="panel-title">Notification Hub</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#FF3333' }}>
          {notifs.filter(n => n.severity === 'CRITICAL').length} CRITICAL
        </span>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 0, overflow: 'hidden' }}>
        {/* Webhook config */}
        <div style={{ width: 180, borderRight: '1px solid var(--color-panel-border)', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-panel-border)' }}>
            {(['Discord', 'Slack', 'Telegram', 'Email'] as WebhookTab[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, fontFamily: 'var(--font-mono)', fontSize: 8, padding: '5px 2px',
                background: activeTab === t ? 'rgba(var(--color-accent-rgb),0.1)' : 'transparent',
                color: activeTab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: 'none', cursor: 'pointer', borderBottom: activeTab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ padding: '8px 10px', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              {activeTab} Webhook URL
            </div>
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(var(--color-accent-rgb),0.2)',
                borderRadius: 3, padding: '4px 6px', color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 8, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button className="hud-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 6, fontSize: 8 }} onClick={handleTestSend}>
              <Send size={8} />
              {testSent ? 'SENT ✓' : 'TEST WEBHOOK'}
            </button>
          </div>
        </div>

        {/* Notification log */}
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 8px' }}>
          {notifs.length === 0 ? (
            <div style={{ padding: 10, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)' }}>
              No critical or high events yet.
            </div>
          ) : notifs.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0 }}
              style={{
                display: 'flex', gap: 8, padding: '7px 8px', marginBottom: 4, borderRadius: 4,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${severityColor(n.severity)}22`,
                borderLeft: `3px solid ${severityColor(n.severity)}`,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: `rgba(${n.severity === 'CRITICAL' ? '255,51,51' : '255,140,0'},0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeTab === 'Discord' ? '💬' : activeTab === 'Slack' ? '💼' : '📱'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 2 }}>{n.time}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)' }}>{n.body}</div>
              </div>
              <span className={`badge badge-${n.severity.toLowerCase()}`} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>{n.severity}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
