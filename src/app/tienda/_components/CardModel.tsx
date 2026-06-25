"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { useMemo, useEffect } from "react";

const DEFAULT_FRONT = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop";
const DEFAULT_BACK = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

function createCardShape(width: number, height: number, radius: number) {
  const s = new THREE.Shape();
  const w = width;
  const h = height;
  const r = radius;
  s.moveTo(-w/2 + r, -h/2);
  s.lineTo(w/2 - r, -h/2);
  s.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
  s.lineTo(w/2, h/2 - r);
  s.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
  s.lineTo(-w/2 + r, h/2);
  s.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
  s.lineTo(-w/2, -h/2 + r);
  s.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
  return s;
}

function CardBase({ width, height, radius, depth }: { width: number, height: number, radius: number, depth: number }) {
  const geometry = useMemo(() => {
    const shape = createCardShape(width, height, radius);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 2,
      curveSegments: 32
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, height, radius, depth]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#1C1917" roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function RoundedPlaneGeometry({ width, height, radius }: { width: number, height: number, radius: number }) {
  const geometry = useMemo(() => {
    const shape = createCardShape(width, height, radius);
    const geo = new THREE.ShapeGeometry(shape);
    
    // Safely recalculate UVs using the actual vertex positions
    const posAttribute = geo.attributes.position;
    const uvAttribute = geo.attributes.uv;
    if (posAttribute && uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const u = (x + width / 2) / width;
        const v = (y + height / 2) / height;
        uvAttribute.setXY(i, u, v);
      }
      uvAttribute.needsUpdate = true;
    }
    
    return geo;
  }, [width, height, radius]);
  
  // Attach the instantiated geometry object directly to the parent mesh
  return <primitive object={geometry} attach="geometry" />;
}

// Hook to make texture behave like object-fit: cover
function useCoverTexture(texture: THREE.Texture | THREE.Texture[], targetAspect: number) {
  useEffect(() => {
    const tex = Array.isArray(texture) ? texture[0] : texture;
    if (!tex || !tex.image) return;
    
    // In case image is not loaded yet
    const updateTex = () => {
      const imageAspect = tex.image.width / tex.image.height;
      if (imageAspect > targetAspect) {
        tex.repeat.set(targetAspect / imageAspect, 1);
        tex.offset.set((1 - targetAspect / imageAspect) / 2, 0);
      } else {
        tex.repeat.set(1, imageAspect / targetAspect);
        tex.offset.set(0, (1 - imageAspect / targetAspect) / 2);
      }
      tex.needsUpdate = true;
    };

    if (tex.image.complete || tex.image.width > 0) {
      updateTex();
    } else {
      tex.image.onload = updateTex;
    }
  }, [texture, targetAspect]);
}

function Card({ frontUrl, backUrl }: { frontUrl: string, backUrl: string }) {
  const frontTx = useTexture(frontUrl || DEFAULT_FRONT);
  const backTx = useTexture(backUrl || DEFAULT_BACK);
  
  const w = 3.375 * 1.2;
  const h = 2.125 * 1.2;
  const d = 0.03; 
  const r = 0.2; 
  
  const targetAspect = w / h;
  useCoverTexture(frontTx, targetAspect);
  useCoverTexture(backTx, targetAspect);

  return (
    <group rotation={[0, -0.3, 0]}>
      {/* Base black plastic card body with rounded corners but thin depth */}
      <CardBase width={w} height={h} radius={r} depth={d} />

      {/* Front Face Texture */}
      {/* The plane renders its own mesh, we clone the element but replace material */}
      <mesh position={[0, 0, d/2 + 0.006]} castShadow receiveShadow>
        <RoundedPlaneGeometry width={w} height={h} radius={r} />
        <meshStandardMaterial map={frontTx} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Back Face Texture */}
      {/* Rotated 180 degrees so the image isn't flipped horizontally from behind */}
      <mesh position={[0, 0, -d/2 - 0.006]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <RoundedPlaneGeometry width={w} height={h} radius={r} />
        <meshStandardMaterial map={backTx} roughness={0.3} metalness={0.1} />
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
