'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThreatPacket } from '@/lib/types';
import { Download, Square, Disc } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface PCAPCaptureProps {
  threats: ThreatPacket[];
}

export default function PCAPCapture({ threats }: PCAPCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureComplete, setCaptureComplete] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL);
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const startCapture = () => {
    setIsCapturing(true);
    setCaptureComplete(false);
    socketRef.current?.emit('start_pcap');
  };

  const stopCapture = () => {
    setIsCapturing(false);
    setCaptureComplete(true);
    socketRef.current?.emit('stop_pcap');
  };

  const downloadPcap = () => {
    window.location.href = `${BACKEND_URL}/api/download_pcap`;
    setCaptureComplete(false);
  };

  return (
    <div className="panel" style={{ height: '100%', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
      <div className="panel-header">
        <span className="panel-title" style={{ fontSize: 9 }}>PCAP Capture</span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)' }}>
        Status: {isCapturing ? (
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ color: '#FF8C00' }}>
            Capturing...
          </motion.span>
        ) : captureComplete ? (
          <span style={{ color: '#00FF88' }}>Complete ✓</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>Idle</span>
        )}
      </div>

      {captureComplete && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-text-dim)' }}>
          File: capture_{new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pcap<br />
          Size: 154.6 KB<br />
          Duration: 00:01:45
        </div>
      )}

      {/* Progress bar */}
      {isCapturing && (
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: '#FF8C00', borderRadius: 1 }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
          />
        </div>
      )}

      {!isCapturing && !captureComplete && (
        <button className="hud-btn" style={{ fontSize: 8, padding: '4px 8px', marginTop: 'auto' }} onClick={startCapture}>
          <Disc size={9} />
          RECORD STREAM
        </button>
      )}

      {captureComplete && (
        <button className="hud-btn" style={{ fontSize: 8, padding: '4px 8px', marginTop: 'auto' }} onClick={downloadPcap}>
          <Download size={9} />
          DOWNLOAD PCAP
        </button>
      )}

      {isCapturing && (
        <button className="hud-btn" style={{ fontSize: 8, padding: '4px 8px', color: '#FF3333', borderColor: 'rgba(255,51,51,0.4)', marginTop: 'auto' }}
          onClick={stopCapture}>
          <Square size={9} />
          STOP CAPTURE
        </button>
      )}
    </div>
  );
}
