'use client';

import React, { memo, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrafficStats, TimeSeriesPoint } from '@/lib/types';
import { Activity } from 'lucide-react';

interface TrafficAnalyticsProps {
  stats: TrafficStats;
  timeSeries: TimeSeriesPoint[];
}

const PROTOCOL_COLORS = ['#00FFFF', '#00FF88', '#FF8C00', '#FF3333', '#B829FF', '#FFCC00'];

function TrafficAnalytics({ stats, timeSeries }: TrafficAnalyticsProps) {
  const protocolData = useMemo(() => [
    { name: 'TCP',   value: stats.tcpRatio,   color: '#00FFFF' },
    { name: 'UDP',   value: stats.udpRatio,   color: '#00FF88' },
    { name: 'HTTP',  value: stats.httpRatio,  color: '#FF8C00' },
    { name: 'HTTPS', value: stats.httpsRatio, color: '#FF3333' },
    { name: 'ICMP',  value: stats.icmpRatio,  color: '#B829FF' },
    { name: 'DNS',   value: stats.dnsRatio,   color: '#FFCC00' },
  ], [stats.tcpRatio, stats.udpRatio, stats.httpRatio, stats.httpsRatio, stats.icmpRatio, stats.dnsRatio]);

  const topTalkers = [
    { ip: '185.220.101.45', packets: '12.4K', bandwidth: '320 Mbps', score: 9.6 },
    { ip: '103.45.67.89',   packets: '8.7K',  bandwidth: '210 Mbps', score: 7.8 },
    { ip: '203.0.113.77',   packets: '6.1K',  bandwidth: '180 Mbps', score: 6.9 },
    { ip: '93.184.216.34',  packets: '4.3K',  bandwidth: '110 Mbps', score: 8.2 },
    { ip: '185.53.88.232',  packets: '2.9K',  bandwidth: '90 Mbps',  score: 5.4 },
  ];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={10} style={{ color: 'var(--color-accent)' }} />
          <span className="panel-title">Live Traffic Analytics</span>
        </div>
        <div className="live-dot" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: 8, padding: '8px 10px', flex: 1, minWidth: 0 }}>
        {/* PPS Chart */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Packets / Second</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>
            {stats.pps.toLocaleString()}
            <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-dim)', marginLeft: 3 }}>pps</span>
          </div>
          <div style={{ height: 50, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ppsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pps" stroke="var(--color-accent)" strokeWidth={1.5} fill="url(#ppsGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bandwidth Chart */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Bandwidth Usage</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#FF8C00', lineHeight: 1 }}>
            {stats.bandwidth}
            <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-dim)', marginLeft: 3 }}>Gbps</span>
          </div>
          <div style={{ height: 50, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Line type="monotone" dataKey="bandwidth" stroke="#FF8C00" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Donut */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Protocols</span>
          </div>
          <div style={{ height: 70 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={protocolData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={34} strokeWidth={0} isAnimationActive={false}>
                  {protocolData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} opacity={0.9} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {protocolData.slice(0, 3).map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)' }}>{p.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-primary)', marginLeft: 'auto' }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Talkers */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Top Talkers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 4, marginBottom: 2 }}>
              {['IP ADDRESS','PACKETS','BANDWIDTH','SCORE'].map(h => (
                <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {topTalkers.map(t => (
              <div key={t.ip} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 4, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-accent)' }}>{t.ip}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)', textAlign: 'right' }}>{t.packets}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', textAlign: 'right' }}>{t.bandwidth}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: t.score >= 8 ? '#FF3333' : t.score >= 6 ? '#FF8C00' : '#FFCC00', textAlign: 'right', fontWeight: 700 }}>{t.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TrafficAnalytics);
