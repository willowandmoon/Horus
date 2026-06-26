"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";

function ThickCurvedPlate({
  innerRadius, outerRadius, height, thetaStart, thetaLength, color
}: {
  innerRadius: number; outerRadius: number; height: number;
  thetaStart: number; thetaLength: number; color: string;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, thetaStart, thetaStart + thetaLength, false);
    shape.absarc(0, 0, innerRadius, thetaStart + thetaLength, thetaStart, true);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      curveSegments: 32,
    });
    geo.translate(0, 0, -height / 2);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, [innerRadius, outerRadius, height, thetaStart, thetaLength]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} />
    </mesh>
  );
}

function Bracelet({ color, userData }: { color: string; userData: any }) {
  // Ref imperativo para actualizar el color sin depender del reconciler de R3F
  const strapRef = useRef<THREE.MeshStandardMaterial>(null!);

  useEffect(() => {
    if (strapRef.current) {
      strapRef.current.color.set(color);
      strapRef.current.needsUpdate = true;
    }
  }, [color]);

  return (
    <group dispose={null} rotation={[0.2, -Math.PI / 2 - 0.2, 0]}>
      {/* Correa principal */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 3.5]}>
        <torusGeometry args={[2.5, 0.12, 32, 64]} />
        <meshStandardMaterial ref={strapRef} color={color} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Placa metálica frontal */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <ThickCurvedPlate innerRadius={2.52} outerRadius={2.65} height={0.8} thetaStart={-0.4} thetaLength={0.8} color="#E4E4E5" />
        <group position={[2.69, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text position={[0, 0.23, 0]} fontSize={0.11} color="#222" font="/fonts/SpaceGrotesk.ttf" anchorX="center" anchorY="middle" maxWidth={1.4} textAlign="center">
            {(userData?.name || "USUARIO").toUpperCase()}
          </Text>
          <Text position={[0, 0.09, 0]} fontSize={0.08} color="#444" font="/fonts/SpaceGrotesk.ttf" anchorX="center" anchorY="middle">
            {`ID: ${userData?.idNumber || "N/A"} - RH: ${userData?.bloodType || "N/A"}`.toUpperCase()}
          </Text>
          <Text position={[0, -0.10, 0]} fontSize={0.065} color="#666" font="/fonts/SpaceGrotesk.ttf" anchorX="center" anchorY="middle">
            CONTACTO DE EMERGENCIA
          </Text>
          <Text position={[0, -0.23, 0]} fontSize={0.095} color="#222" font="/fonts/SpaceGrotesk.ttf" anchorX="center" anchorY="middle">
            {(userData?.emergencyContact || "NO REGISTRADO").toUpperCase()}
          </Text>
        </group>
      </group>

      {/* Broche trasero */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <ThickCurvedPlate innerRadius={2.52} outerRadius={2.65} height={0.5} thetaStart={-0.15} thetaLength={0.3} color="#E4E4E5" />
        <mesh position={[2.65, 0, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.15]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.4} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function BraceletModel({ color, userData }: { color: string; userData?: any }) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas shadows camera={{ position: [0, 3, 11], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />
        <Bracelet color={color} userData={userData} />
        <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls enableZoom={true} enablePan={false} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
