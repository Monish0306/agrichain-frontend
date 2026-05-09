import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, OrbitControls, Sphere, Torus, Trail } from "@react-three/drei";
import * as THREE from "three";

const Globe = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  return (
    <group>
      <Sphere ref={ref} args={[1.6, 48, 48]}>
        <meshStandardMaterial
          color="#0a2218"
          emissive="#0fff7a"
          emissiveIntensity={0.18}
          wireframe
        />
      </Sphere>
      <Sphere args={[1.58, 32, 32]}>
        <meshBasicMaterial color="#031309" transparent opacity={0.6} />
      </Sphere>
    </group>
  );
};

const Ring = ({ radius, speed, color, tilt }: { radius: number; speed: number; color: string; tilt: [number, number, number] }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <Torus ref={ref} args={[radius, 0.012, 16, 100]} rotation={tilt}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
    </Torus>
  );
};

const Particle = ({ orbit, speed, offset, color }: { orbit: number; speed: number; offset: number; color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * orbit;
      ref.current.position.z = Math.sin(t) * orbit;
      ref.current.position.y = Math.sin(t * 1.3) * 0.4;
    }
  });
  return (
    <Trail width={0.4} length={6} color={color} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </Trail>
  );
};

const FloatingCrystal = ({ position, color }: { position: [number, number, number]; color: string }) => (
  <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
    <Icosahedron args={[0.22, 0]} position={position}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.2} metalness={0.6} />
    </Icosahedron>
  </Float>
);

export const HeroScene = () => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <pointLight position={[5, 5, 5]} intensity={1.4} color="#0fff9a" />
        <pointLight position={[-5, -3, -2]} intensity={1.2} color="#00e7d1" />
        <pointLight position={[0, 4, -3]} intensity={0.8} color="#ffae00" />

        <Globe />
        <Ring radius={2.0} speed={0.6} color="#0fff7a" tilt={[Math.PI / 2.4, 0, 0]} />
        <Ring radius={2.4} speed={-0.4} color="#00e7d1" tilt={[Math.PI / 1.7, Math.PI / 6, 0]} />
        <Ring radius={2.9} speed={0.3} color="#ffae00" tilt={[Math.PI / 2, Math.PI / 3, 0]} />

        <Particle orbit={2.0} speed={0.8} offset={0} color="#0fff7a" />
        <Particle orbit={2.4} speed={-0.6} offset={2} color="#00e7d1" />
        <Particle orbit={2.9} speed={0.5} offset={4} color="#ffae00" />
        <Particle orbit={2.2} speed={0.7} offset={1.5} color="#0fff7a" />

        <FloatingCrystal position={[2.2, 1.4, 0.5]} color="#0fff7a" />
        <FloatingCrystal position={[-2.4, -1.2, 0.3]} color="#00e7d1" />
        <FloatingCrystal position={[1.8, -1.6, -0.5]} color="#ffae00" />
        <FloatingCrystal position={[-2.0, 1.6, -0.2]} color="#0fff7a" />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Suspense>
    </Canvas>
  );
};
