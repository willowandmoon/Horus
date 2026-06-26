"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { useMemo, useEffect } from "react";

// 1×1 píxel PNG color crema #F2F1EC (RGB 242,241,236)
const CREAM_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

function createCardShape(width: number, height: number, radius: number) {
  const s = new THREE.Shape();
  const w = width, h = height, r = radius;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function CardBase({ width, height, radius, depth }: { width: number; height: number; radius: number; depth: number }) {
  const geometry = useMemo(() => {
    const shape = createCardShape(width, height, radius);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 2,
      curveSegments: 32,
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, height, radius, depth]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {/* Color crema base — visible en los bordes */}
      <meshStandardMaterial color="#F2F1EC" roughness={0.4} metalness={0.05} />
    </mesh>
  );
}

function RoundedPlaneGeometry({ width, height, radius }: { width: number; height: number; radius: number }) {
  const geometry = useMemo(() => {
    const shape = createCardShape(width, height, radius);
    const geo = new THREE.ShapeGeometry(shape);
    const posAttribute = geo.attributes.position;
    const uvAttribute = geo.attributes.uv;
    if (posAttribute && uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        uvAttribute.setXY(i, (x + width / 2) / width, (y + height / 2) / height);
      }
      uvAttribute.needsUpdate = true;
    }
    return geo;
  }, [width, height, radius]);

  return <primitive object={geometry} attach="geometry" />;
}

function useCoverTexture(texture: THREE.Texture | THREE.Texture[], targetAspect: number) {
  useEffect(() => {
    const tex = Array.isArray(texture) ? texture[0] : texture;
    if (!tex || !tex.image) return;
    const img = tex.image as HTMLImageElement;
    const update = () => {
      const imageAspect = img.width / img.height;
      if (imageAspect > targetAspect) {
        tex.repeat.set(targetAspect / imageAspect, 1);
        tex.offset.set((1 - targetAspect / imageAspect) / 2, 0);
      } else {
        tex.repeat.set(1, imageAspect / targetAspect);
        tex.offset.set(0, (1 - imageAspect / targetAspect) / 2);
      }
      tex.needsUpdate = true;
    };
    if (img.complete || img.width > 0) update();
    else img.onload = update;
  }, [texture, targetAspect]);
}

function CardFace({ url, side, w, h, r, d }: { url: string; side: "front" | "back"; w: number; h: number; r: number; d: number }) {
  const tex = useTexture(url);
  useCoverTexture(tex, w / h);
  const isFront = side === "front";
  return (
    <mesh
      position={[0, 0, isFront ? d / 2 + 0.006 : -d / 2 - 0.006]}
      rotation={isFront ? undefined : [0, Math.PI, 0]}
      castShadow
      receiveShadow
    >
      <RoundedPlaneGeometry width={w} height={h} radius={r} />
      <meshStandardMaterial map={tex} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function Card({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  const w = 3.375 * 1.2;
  const h = 2.125 * 1.2;
  const d = 0.03;
  const r = 0.2;

  return (
    <group rotation={[0, -0.3, 0]}>
      <CardBase width={w} height={h} radius={r} depth={d} />
      {/* Solo renderiza la cara si hay imagen real o usamos el pixel crema por defecto */}
      <CardFace url={frontUrl || CREAM_PIXEL} side="front" w={w} h={h} r={r} d={d} />
      <CardFace url={backUrl || CREAM_PIXEL} side="back" w={w} h={h} r={r} d={d} />
    </group>
  );
}

export default function CardModel({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas shadows camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Card frontUrl={frontUrl} backUrl={backUrl} />
        </Suspense>
        <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        <OrbitControls enableZoom={true} enablePan={false} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
