'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { Terminal, X, ChevronRight } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface VirtualTerminalProps {
  selectedThreat: ThreatPacket | null;
}

interface TerminalLine {
  id: string;
  text: string;
  type: 'command' | 'output' | 'error' | 'system';
}

const WHOIS_TEMPLATE = (ip: string) => [
  `% This is the RIPE Database query service.`,
  `% The objects are in RPSL format.`,
  ``,
  `inetnum: ${ip}`,
  `netname: HETZNER-AS`,
  `descr:   Hetzner Online GmbH`,
  `country: DE`,
  `org:     ORG-HOI1-RIPE`,
  `admin-c: HOAS1-RIPE`,
  `tech-c:  HI73-RIPE`,
  `status:  ASSIGNED PA`,
  `mnt-by:  HM73-RIPE`,
  ``,
  `% Information related to 'AS24940'`,
  `aut-num: AS24940`,
  `as-name: HETZNER-AS`,
  ``,
  `source:  RIPE`,
];

const TRACEROUTE_TEMPLATE = (ip: string) => [
  `traceroute to ${ip} (${ip}), 30 hops max`,
  ` 1  gateway (192.168.1.1)    0.543 ms   0.312 ms   0.298 ms`,
  ` 2  103.21.244.1 (103.21.244.1)  1.125 ms  1.632 ms  1.988 ms`,
  ` 3  172.16.3.1   2.456 ms   2.301 ms   2.498 ms`,
  ` 4  80.158.32.3  8.133 ms  12.440 ms  12.301 ms`,
  ` 5  10.22.101.43 13.652 ms  19.321 ms  13.581 ms`,
  ` 6  ${ip}  22.441 ms  21.998 ms  22.134 ms`,
];

export default function VirtualTerminal({ selectedThreat }: VirtualTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '0', text: 'SOC Terminal v1.0 — Ready', type: 'system' },
    { id: '1', text: 'Type "help" for available commands', type: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to terminal socket independently
    socketRef.current = io(BACKEND_URL);
    socketRef.current.on('terminal_output', (data: { output: string[] }) => {
      setIsProcessing(false);
      addLines(data.output.map((line, i) => ({
        id: `out-${Date.now()}-${i}`,
        text: line,
        type: 'output'
      })));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLines = (newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  };

  const simulateOutput = async (outputLines: string[], type: TerminalLine['type'] = 'output') => {
    setIsProcessing(true);
    for (let i = 0; i < outputLines.length; i++) {
      await new Promise(r => setTimeout(r, 40));
      setLines(prev => [...prev, {
        id: `${Date.now()}-${i}`,
        text: outputLines[i],
        type,
      }]);
    }
    setIsProcessing(false);
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    addLines([{ id: `cmd-${Date.now()}`, text: `root@soc-dashboard:~# ${cmd}`, type: 'command' }]);

    if (trimmed === 'help') {
      addLines([
        { id: `h1`, text: 'Available commands:', type: 'output' },
        { id: `h2`, text: '  nslookup <IP>    — Query WHOIS/DNS information', type: 'output' },
        { id: `h3`, text: '  tracert <IP>     — Trace network route', type: 'output' },
        { id: `h4`, text: '  ping <IP>        — Test connectivity', type: 'output' },
        { id: `h5`, text: '  block <IP>       — Block IP in Windows Firewall', type: 'output' },
        { id: `h6`, text: '  clear            — Clear terminal', type: 'output' },
      ]);
    } else if (trimmed === 'clear') {
      setLines([{ id: 'clear', text: 'Terminal cleared.', type: 'system' }]);
    } else {
      setIsProcessing(true);
      socketRef.current?.emit('terminal_command', { cmd });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    handleCommand(input);
    setInput('');
  };

  const lineColor = (type: TerminalLine['type']) => {
    if (type === 'command') return 'var(--color-accent)';
    if (type === 'error') return '#FF3333';
    if (type === 'system') return '#FFCC00';
    return 'rgba(0,255,136,0.8)';
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="hud-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100, gap: 6 }}
      >
        <Terminal size={11} />
        TERMINAL {isOpen ? '▼' : '▲'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            style={{
              position: 'fixed', bottom: 50, right: 16, width: 520, height: 320,
              background: 'rgba(2,5,12,0.98)', border: '1px solid rgba(var(--color-accent-rgb),0.4)',
              borderRadius: 8, zIndex: 99, display: 'flex', flexDirection: 'column',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.8), 0 0 24px rgba(var(--color-accent-rgb),0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Terminal header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderBottom: '1px solid rgba(var(--color-accent-rgb),0.2)',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <Terminal size={10} style={{ color: 'var(--color-accent)', marginLeft: 4 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-accent)', letterSpacing: '0.1em' }}>
                INTERACTIVE TERMINAL — SOC v1.0
              </span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', padding: 2 }}
                onClick={() => setIsOpen(false)}>
                <X size={12} />
              </button>
            </div>

            {/* Output area */}
            <div className="scroll-area" style={{ flex: 1, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              {lines.map(line => (
                <div key={line.id} style={{ color: lineColor(line.type), lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line.text}
                </div>
              ))}
              {isProcessing && (
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ color: 'var(--color-accent)' }}>_</motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderTop: '1px solid rgba(var(--color-accent-rgb),0.2)',
            }}>
              <ChevronRight size={10} style={{ color: 'var(--color-accent)' }} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={selectedThreat ? `whois ${selectedThreat.srcIp}` : 'Type a command...'}
                disabled={isProcessing}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent)',
                  letterSpacing: '0.05em',
                }}
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
