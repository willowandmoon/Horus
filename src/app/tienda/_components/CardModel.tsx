"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

const DEFAULT_FRONT = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop"; // Abstract dark placeholder
const DEFAULT_BACK = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";  // Abstract dark placeholder

function Card({ frontUrl, backUrl }: { frontUrl: string, backUrl: string }) {
  // We use useTexture. It expects valid URLs.
  const frontTx = useTexture(frontUrl || DEFAULT_FRONT);
  const backTx = useTexture(backUrl || DEFAULT_BACK);

  // Box geometry has 6 materials: right, left, top, bottom, front, back
  // Front face is index 4, Back face is index 5
  const materials = [
    new THREE.MeshStandardMaterial({ color: "#1C1917" }), // right
    new THREE.MeshStandardMaterial({ color: "#1C1917" }), // left
    new THREE.MeshStandardMaterial({ color: "#1C1917" }), // top
    new THREE.MeshStandardMaterial({ color: "#1C1917" }), // bottom
    new THREE.MeshStandardMaterial({ map: frontTx, roughness: 0.3, metalness: 0.1 }), // front
    new THREE.MeshStandardMaterial({ map: backTx, roughness: 0.3, metalness: 0.1 }),  // back
  ];

  return (
    <group rotation={[0, -0.3, 0]}>
      <mesh castShadow receiveShadow material={materials}>
        {/* Standard credit card proportions 3.375 x 2.125 inches */}
        <boxGeometry args={[3.375 * 1.2, 2.125 * 1.2, 0.05]} />
      </mesh>
    </group>
  );
}

export default function CardModel({ frontUrl, backUrl }: { frontUrl: string, backUrl: string }) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Card frontUrl={frontUrl} backUrl={backUrl} />
        </Suspense>
        <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5} 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
