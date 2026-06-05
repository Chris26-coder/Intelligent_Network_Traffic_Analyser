import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'SOC Dashboard — Intelligent Network Traffic Analyzer',
  description: 'Enterprise-grade Security Operations Center dashboard with real-time network traffic analysis, AI threat detection, honeypot telemetry, and MITRE ATT&CK mapping.',
  keywords: ['SOC dashboard', 'network security', 'threat detection', 'MITRE ATT&CK', 'cybersecurity'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
