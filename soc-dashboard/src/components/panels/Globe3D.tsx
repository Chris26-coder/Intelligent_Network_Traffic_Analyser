'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ThreatPacket } from '@/lib/types';
import { HOST_GEO } from '@/lib/simulation/threatGenerator';
import { useTheme } from '@/contexts/ThemeContext';

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function severityColorHex(s: string): string {
  if (s === 'CRITICAL') return '#FF3333';
  if (s === 'HIGH') return '#FF8C00';
  if (s === 'MEDIUM') return '#FFCC00';
  return '#00FF88';
}

// Animated rotating globe
function GlobeCore({ accentColor }: { accentColor: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);

  // Rotation is handled globally by OrbitControls autoRotate so the nodes stay locked to the map

  const color = new THREE.Color(accentColor);

  const texture = useTexture('/earth-dark.jpg');

  return (
    <group>
      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial
          map={texture}
          color="#ffffff"
        />
      </mesh>
      {/* Wireframe */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.51, 24, 24]} />
        <meshBasicMaterial
          color={color}
          wireframe
          opacity={0.05}
          transparent
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.58, 32, 32]} />
        <meshPhongMaterial
          color={color}
          opacity={0.04}
          transparent
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Attack arc between two points
function AttackArc({ src, dst, color }: { src: THREE.Vector3; dst: THREE.Vector3; color: string }) {
  const pointsRef = useRef<THREE.Line>(null!);
  const particleRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);

  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(src, dst).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(2.1); // lift above sphere
    return new THREE.QuadraticBezierCurve3(src, mid, dst);
  }, [src, dst]);

  const points = useMemo(() => curve.getPoints(60), [curve]);

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + delta * 0.3) % 1;
    if (particleRef.current) {
      const pos = curve.getPoint(progressRef.current);
      particleRef.current.position.copy(pos);
    }
  });

  const hexColor = new THREE.Color(color);

  return (
    <group>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <line ref={pointsRef as any}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={hexColor} opacity={0.6} transparent linewidth={1} />
      </line>
      {/* Moving particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color={hexColor} />
      </mesh>
    </group>
  );
}

// Host and threat nodes
function ThreatNode({ position, color, isHost }: { position: THREE.Vector3; color: string; isHost?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.3);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.3;
    }
  });

  const c = new THREE.Color(color);

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[isHost ? 0.06 : 0.04, 8, 8]} />
        <meshBasicMaterial color={c} transparent opacity={0.3} />
      </mesh>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[isHost ? 0.04 : 0.025, 8, 8]} />
        <meshBasicMaterial color={c} />
      </mesh>
    </group>
  );
}

// Scene lighting
function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#004466" />
    </>
  );
}

// Stars background
function Starfield() {
  const starPositions = useMemo(() => {
    const arr = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      arr[i] = (Math.random() - 0.5) * 100;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" opacity={0.6} transparent />
    </points>
  );
}

interface Globe3DProps {
  threats: ThreatPacket[];
  selectedThreat: ThreatPacket | null;
  onSelectThreat: (t: ThreatPacket | null) => void;
}

export default function Globe3D({ threats, selectedThreat, onSelectThreat }: Globe3DProps) {
  const { theme } = useTheme();
  const RADIUS = 1.5;

  const hostPos = useMemo(() => latLngToVector3(HOST_GEO.lat, HOST_GEO.lng, RADIUS), []);

  const uniqueThreats = useMemo(() => {
    const seen = new Set<string>();
    return threats.filter(t => {
      if (seen.has(t.srcIp)) return false;
      seen.add(t.srcIp);
      return true;
    }).slice(0, 15);
  }, [threats]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(0,20,40,0.6) 0%, rgba(0,0,0,0) 70%)' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} style={{ background: 'transparent' }}>
        <Lights />
        <Starfield />
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshBasicMaterial color="#001122" wireframe />
          </mesh>
        }>
          <GlobeCore accentColor={theme.accent} />
        </Suspense>

        {/* Host node */}
        <ThreatNode position={hostPos} color={theme.accent} isHost />

        {/* Threat nodes + arcs */}
        {uniqueThreats.map(threat => {
          const srcPos = latLngToVector3(threat.srcGeo.lat, threat.srcGeo.lng, RADIUS);
          const color = severityColorHex(threat.severity);
          return (
            <group key={threat.id}>
              <ThreatNode position={srcPos} color={color} />
              <AttackArc src={srcPos} dst={hostPos} color={color} />
            </group>
          );
        })}

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={!selectedThreat}
          autoRotateSpeed={0.5}
          minDistance={2.5}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}
