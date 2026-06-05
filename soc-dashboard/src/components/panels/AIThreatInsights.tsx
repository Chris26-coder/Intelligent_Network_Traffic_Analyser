'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { PLAYBOOK_TEMPLATES } from '@/lib/simulation/threatGenerator';
import { Brain, Copy, CheckCheck, AlertTriangle } from 'lucide-react';

type Tab = 'SUMMARY' | 'PLAYBOOK' | 'MITRE' | 'IOC';

interface AIThreatInsightsProps {
  threat: ThreatPacket | null;
  threats: ThreatPacket[];
}

function getAnomaly(threats: ThreatPacket[]): number {
  if (!threats.length) return 0;
  const topAnomaly = Math.max(...threats.slice(0, 10).map(t => t.anomalyScore));
  return topAnomaly;
}

function AIThreatInsights({ threat, threats }: AIThreatInsightsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('SUMMARY');
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const anomalyScore = getAnomaly(threats);

  const topThreat = threat ?? threats[0];

  // Streaming text reveal for AI summary
  const summaryText = topThreat
    ? `The IP ${topThreat.srcIp} (${topThreat.srcGeo.country}) is performing an aggressive ${topThreat.attackType.toLowerCase()} activity across multiple common ports. This behavior is typically used to identify open ports and potential vulnerabilities. Anomaly Score: ${topThreat.anomalyScore}/10. Likely intent: Reconnaissance to prepare for exploitation.`
    : 'Awaiting threat data. Start analysis to begin AI threat monitoring.';

  useEffect(() => {
    if (!topThreat) return;
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < summaryText.length) {
        setDisplayedText(summaryText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [topThreat?.id]);

  const playbook = topThreat ? (PLAYBOOK_TEMPLATES[topThreat.attackType] ?? PLAYBOOK_TEMPLATES['Port Scan']) : [];

  const handleCopyAll = () => {
    const text = playbook.map(cmd => cmd.replace('{IP}', topThreat?.srcIp ?? '0.0.0.0')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = anomalyScore >= 8.5 ? '#FF3333' : anomalyScore >= 6.5 ? '#FF8C00' : anomalyScore >= 4 ? '#FFCC00' : '#00FF88';
  const scoreLabel = anomalyScore >= 8.5 ? 'HIGH RISK' : anomalyScore >= 6.5 ? 'ELEVATED' : anomalyScore >= 4 ? 'MODERATE' : 'LOW';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain size={10} style={{ color: 'var(--color-accent)' }} />
          <span className="panel-title">AI Threat Insights</span>
        </div>
        {anomalyScore >= 7.5 && (
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            <AlertTriangle size={12} style={{ color: '#FF3333' }} />
          </motion.div>
        )}
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Anomaly Score Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="32"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - anomalyScore / 10) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <motion.span
                key={anomalyScore}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: scoreColor, lineHeight: 1 }}
              >
                {anomalyScore.toFixed(1)}
              </motion.span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>/ 10</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: scoreColor, letterSpacing: '0.1em' }}>
            {scoreLabel}
          </div>
        </div>

        {/* Top Threat */}
        <div style={{ flex: 1 }}>
          {topThreat && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>TOP THREAT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {topThreat.attackType}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>CONFIDENCE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00FF88', fontWeight: 600 }}>
                    {Math.floor(70 + topThreat.anomalyScore * 3)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>IMPACT</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: scoreColor, fontWeight: 600 }}>
                    {topThreat.severity}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-panel-border)', paddingLeft: 12 }}>
        {(['SUMMARY', 'PLAYBOOK', 'MITRE', 'IOC'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
              padding: '6px 12px', border: 'none', cursor: 'pointer', background: 'none',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              transition: 'all 0.2s', marginBottom: -1,
            }}
          >{tab}</button>
        ))}
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '10px 12px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'SUMMARY' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-dim)', lineHeight: 1.8, marginBottom: 10 }}>
                {displayedText}<span style={{ animation: 'livePulse 1s infinite' }}>█</span>
              </div>
              {topThreat && (
                <div style={{ padding: 8, background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.2)', borderRadius: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#FFCC00', fontWeight: 600, marginBottom: 4, letterSpacing: '0.1em' }}>
                    RECOMMENDED ACTION
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
                    Block the source IP and monitor for further suspicious activity.
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'PLAYBOOK' && (
            <motion.div key="playbook" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                AUTOMATED PLAYBOOK — {topThreat?.attackType ?? 'Port Scan'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {playbook.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      display: 'flex', gap: 8, padding: '6px 8px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: 3,
                      border: '1px solid rgba(var(--color-accent-rgb),0.08)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-dim)', lineHeight: 1.6, wordBreak: 'break-all' }}>
                      {step.replace('{IP}', topThreat?.srcIp ?? '0.0.0.0')}
                    </span>
                  </motion.div>
                ))}
              </div>
              <button className="hud-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={handleCopyAll}>
                {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
                {copied ? 'COPIED!' : 'COPY ALL COMMANDS'}
              </button>
            </motion.div>
          )}

          {activeTab === 'MITRE' && (
            <motion.div key="mitre" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {topThreat && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ padding: '8px 10px', background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 4 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#FF3333', fontWeight: 700 }}>{topThreat.mitreTechniqueId}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-primary)', marginTop: 2 }}>{topThreat.mitreTechniqueName}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', marginTop: 2 }}>Tactic: {topThreat.mitreTactic}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'IOC' && (
            <motion.div key="ioc" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {topThreat && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    ['IP', topThreat.srcIp],
                    ['ASN', topThreat.asn],
                    ['ISP', topThreat.isp],
                    ['Country', `${topThreat.srcGeo.flag} ${topThreat.srcGeo.country}`],
                    ['Protocol', topThreat.protocol],
                    ['Port', `${topThreat.dstPort}`],
                    ['Entropy', `${topThreat.payloadEntropy}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-accent)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(AIThreatInsights);
