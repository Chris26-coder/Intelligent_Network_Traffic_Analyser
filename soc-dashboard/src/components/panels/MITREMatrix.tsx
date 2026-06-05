'use client';

import React, { useMemo, memo } from 'react';
import { ThreatPacket, MitreTactic } from '@/lib/types';
import { Grid3X3 } from 'lucide-react';

interface MITREMatrixProps {
  threats: ThreatPacket[];
}

type CellState = 'inactive' | 'detected' | 'high-confidence' | 'critical';

interface TechniqueCell {
  id: string;
  name: string;
  state: CellState;
}

interface TacticColumn {
  id: string;
  tactic: MitreTactic;
  techniques: TechniqueCell[];
}

// Abbreviated MITRE ATT&CK Enterprise matrix
const MATRIX_DATA: { tactic: MitreTactic; id: string; techniques: { id: string; name: string }[] }[] = [
  { tactic: 'Initial Access',       id: 'TA0001', techniques: [
    { id: 'T1190', name: 'Public-Facing App' }, { id: 'T1566', name: 'Phishing' },
    { id: 'T1078', name: 'Valid Accounts' }, { id: 'T1189', name: 'Drive-by' },
  ]},
  { tactic: 'Execution',            id: 'TA0002', techniques: [
    { id: 'T1059', name: 'CLI Interpreter' }, { id: 'T1203', name: 'Client Exploit' },
    { id: 'T1204', name: 'User Execution' }, { id: 'T1072', name: 'Remote Deploy' },
  ]},
  { tactic: 'Persistence',          id: 'TA0003', techniques: [
    { id: 'T1071', name: 'App Layer Proto' }, { id: 'T1098', name: 'Account Manip' },
    { id: 'T1053', name: 'Scheduled Task' }, { id: 'T1136', name: 'Create Account' },
  ]},
  { tactic: 'Privilege Escalation', id: 'TA0004', techniques: [
    { id: 'T1055', name: 'Process Inject' }, { id: 'T1068', name: 'Exploit Vuln' },
    { id: 'T1484', name: 'Domain Policy' }, { id: 'T1611', name: 'Escape to Host' },
  ]},
  { tactic: 'Defense Evasion',      id: 'TA0005', techniques: [
    { id: 'T1036', name: 'Masquerading' }, { id: 'T1562', name: 'Impair Defenses' },
    { id: 'T1027', name: 'Obfuscation' }, { id: 'T1070', name: 'Indicator Remove' },
  ]},
  { tactic: 'Credential Access',    id: 'TA0006', techniques: [
    { id: 'T1110', name: 'Brute Force' }, { id: 'T1003', name: 'OS Credentials' },
    { id: 'T1555', name: 'From Stores' }, { id: 'T1558', name: 'Steal Tickets' },
  ]},
  { tactic: 'Discovery',            id: 'TA0007', techniques: [
    { id: 'T1046', name: 'Net Svc Scan' }, { id: 'T1595', name: 'Active Scanning' },
    { id: 'T1082', name: 'System Info' }, { id: 'T1083', name: 'File Discovery' },
  ]},
  { tactic: 'Lateral Movement',     id: 'TA0008', techniques: [
    { id: 'T1021', name: 'Remote Services' }, { id: 'T1080', name: 'Taint Content' },
    { id: 'T1550', name: 'Alt Auth' }, { id: 'T1534', name: 'Internal Spear' },
  ]},
  { tactic: 'Collection',           id: 'TA0009', techniques: [
    { id: 'T1005', name: 'Local Data' }, { id: 'T1114', name: 'Email Collection' },
    { id: 'T1113', name: 'Screen Capture' }, { id: 'T1560', name: 'Archive Data' },
  ]},
  { tactic: 'Exfiltration',         id: 'TA0010', techniques: [
    { id: 'T1041', name: 'Exfil over C2' }, { id: 'T1048', name: 'Alt Protocol' },
    { id: 'T1052', name: 'Physical Medium' }, { id: 'T1567', name: 'Web Service' },
  ]},
  { tactic: 'Impact',               id: 'TA0040', techniques: [
    { id: 'T1498', name: 'Network DoS' }, { id: 'T1486', name: 'Data Encrypted' },
    { id: 'T1491', name: 'Defacement' }, { id: 'T1529', name: 'System Shutdown' },
  ]},
];

function MITREMatrix({ threats }: MITREMatrixProps) {
  // Build set of active technique IDs from threats
  const activeTechniques = useMemo(() => {
    const map = new Map<string, { count: number; maxScore: number }>();
    threats.forEach(t => {
      const existing = map.get(t.mitreTechniqueId) ?? { count: 0, maxScore: 0 };
      map.set(t.mitreTechniqueId, {
        count: existing.count + 1,
        maxScore: Math.max(existing.maxScore, t.anomalyScore),
      });
    });
    return map;
  }, [threats]);

  const getState = (techniqueId: string): CellState => {
    const data = activeTechniques.get(techniqueId);
    if (!data) return 'inactive';
    if (data.maxScore >= 8.5) return 'critical';
    if (data.maxScore >= 6.5) return 'high-confidence';
    return 'detected';
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Grid3X3 size={10} style={{ color: 'var(--color-accent)' }} />
          <span className="panel-title">MITRE ATT&CK Matrix</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['inactive','Inactive'],['detected','Detected'],['high-confidence','High Conf.'],['critical','Critical']].map(([state, label]) => (
            <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 6, height: 6, borderRadius: 1,
                background: state === 'inactive' ? 'rgba(255,255,255,0.1)' : state === 'detected' ? 'rgba(255,204,0,0.4)' : state === 'high-confidence' ? 'rgba(255,140,0,0.5)' : 'rgba(255,51,51,0.5)',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 8px' }}>
        {/* Tactic headers */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MATRIX_DATA.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
          {MATRIX_DATA.map(col => (
            <div key={col.id} style={{
              fontFamily: 'var(--font-mono)', fontSize: 7, fontWeight: 700, color: 'var(--color-accent)',
              textAlign: 'center', padding: '3px 2px', letterSpacing: '0.05em',
              borderBottom: '1px solid rgba(var(--color-accent-rgb),0.3)', lineHeight: 1.3,
            }}>
              {col.tactic.replace(' ', '\n')}
            </div>
          ))}
        </div>

        {/* Technique cells */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MATRIX_DATA.length}, 1fr)`, gap: 3 }}>
          {MATRIX_DATA.map(col =>
            col.techniques.map(tech => {
              const state = getState(tech.id);
              return (
                <div
                  key={tech.id}
                  className={`mitre-cell ${state}`}
                  title={`${tech.id}: ${tech.name}`}
                >
                  <div style={{ fontSize: 7, fontWeight: 700 }}>{tech.id}</div>
                  <div style={{ fontSize: 6, lineHeight: 1.2, marginTop: 1, opacity: 0.8 }}>{tech.name}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MITREMatrix);
