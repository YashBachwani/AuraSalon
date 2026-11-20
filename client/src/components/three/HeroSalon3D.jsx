import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * HeroSalon3D — Bespoke Luxury 3D Salon Composition
 * Built with Three.js for Aura Salon.
 *
 * Features:
 * - High-end procedural 3D Barber Chair & Sculptural Golden Shears
 * - Cinematic three-point lighting (Champagne Gold Spotlight, Amber Fill, Cool Rim Light)
 * - Atmospheric floating starlight particles
 * - Smooth pointer parallax (damped with lerp)
 * - Scroll-linked camera lift and elevation
 * - Strict WebGL capability detection & graceful fallback
 * - Reduced-motion accessibility support
 * - Complete resource disposal on unmount
 */
export function HeroSalon3D({ className = '' }) {
  const containerRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Verify WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Check motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x191817, 0.045);

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 7.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Lighting Architecture
    // A. Main Key Spotlight: Warm Champagne Gold
    const keySpot = new THREE.SpotLight(0xe8c982, 4.5, 20, Math.PI / 4.5, 0.75, 1.2);
    keySpot.position.set(3.5, 6, 4.5);
    keySpot.castShadow = true;
    keySpot.shadow.bias = -0.0005;
    keySpot.shadow.mapSize.width = 1024;
    keySpot.shadow.mapSize.height = 1024;
    scene.add(keySpot);

    // B. Warm Amber Fill Light
    const fillLight = new THREE.PointLight(0xc89b45, 1.8, 12);
    fillLight.position.set(-4, 2.5, 3.5);
    scene.add(fillLight);

    // C. Crisp Steel Rim Backlight
    const rimLight = new THREE.DirectionalLight(0x94a3b8, 2.0);
    rimLight.position.set(2, 4.5, -4.5);
    scene.add(rimLight);

    // D. Subtle Ambient Base
    const ambientLight = new THREE.AmbientLight(0x292622, 1.4);
    scene.add(ambientLight);

    // E. Pedestal Underglow
    const pedestalGlow = new THREE.PointLight(0xc89b45, 1.6, 6);
    pedestalGlow.position.set(0, -1.2, 0);
    scene.add(pedestalGlow);

    // 4. Materials Palette
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xc89b45,
      metalness: 0.92,
      roughness: 0.22,
    });

    const champagneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8c982,
      metalness: 0.95,
      roughness: 0.16,
    });

    const polishedBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5efe4,
      metalness: 0.98,
      roughness: 0.12,
    });

    const darkLeatherMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1c1a,
      roughness: 0.78,
      metalness: 0.15,
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x161514,
      metalness: 0.85,
      roughness: 0.35,
    });

    const podiumMaterial = new THREE.MeshStandardMaterial({
      color: 0x141312,
      roughness: 0.88,
      metalness: 0.2,
    });

    const glowingRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xc89b45,
      emissive: 0xc89b45,
      emissiveIntensity: 0.65,
      roughness: 0.2,
    });

    // 5. Build Procedural Salon Composition
    const compositionGroup = new THREE.Group();
    scene.add(compositionGroup);

    // --- A. Base & Podium ---
    const podiumGeo = new THREE.CylinderGeometry(2.3, 2.4, 0.12, 48);
    const podiumMesh = new THREE.Mesh(podiumGeo, podiumMaterial);
    podiumMesh.position.y = -1.65;
    podiumMesh.receiveShadow = true;
    compositionGroup.add(podiumMesh);

    const podiumRingGeo = new THREE.TorusGeometry(2.32, 0.025, 16, 64);
    const podiumRing = new THREE.Mesh(podiumRingGeo, glowingRingMaterial);
    podiumRing.rotation.x = Math.PI / 2;
    podiumRing.position.y = -1.6;
    compositionGroup.add(podiumRing);

    // --- B. Barber Chair Assembly ---
    const chairGroup = new THREE.Group();
    chairGroup.position.set(-0.25, -0.65, 0);
    compositionGroup.add(chairGroup);

    // Chair Hydraulic Base (Polished Gold Disc)
    const baseGeo = new THREE.CylinderGeometry(1.3, 1.45, 0.14, 48);
    const baseMesh = new THREE.Mesh(baseGeo, goldMaterial);
    baseMesh.position.y = -0.9;
    baseMesh.receiveShadow = true;
    chairGroup.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(1.38, 0.03, 16, 48);
    const baseRing = new THREE.Mesh(baseRingGeo, champagneMaterial);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -0.85;
    chairGroup.add(baseRing);

    // Hydraulic Column
    const colGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.95, 32);
    const colMesh = new THREE.Mesh(colGeo, darkMetalMaterial);
    colMesh.position.y = -0.38;
    chairGroup.add(colMesh);

    // Column Accent Collar
    const collarGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.15, 32);
    const collarMesh = new THREE.Mesh(collarGeo, goldMaterial);
    collarMesh.position.y = -0.7;
    chairGroup.add(collarMesh);

    // Seat Under-cradle
    const cradleGeo = new THREE.BoxGeometry(1.65, 0.18, 1.65);
    const cradleMesh = new THREE.Mesh(cradleGeo, darkMetalMaterial);
    cradleMesh.position.y = 0.12;
    chairGroup.add(cradleMesh);

    // Seat Leather Cushion
    const seatGeo = new THREE.BoxGeometry(1.6, 0.38, 1.6);
    const seatMesh = new THREE.Mesh(seatGeo, darkLeatherMaterial);
    seatMesh.position.y = 0.38;
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    chairGroup.add(seatMesh);

    // Cushion Gold Side Trims
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.62), goldMaterial);
    trimL.position.set(-0.81, 0.38, 0);
    chairGroup.add(trimL);

    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.62), goldMaterial);
    trimR.position.set(0.81, 0.38, 0);
    chairGroup.add(trimR);

    // Backrest Assembly (Angled Slightly Back)
    const backrestGroup = new THREE.Group();
    backrestGroup.position.set(0, 0.55, -0.75);
    backrestGroup.rotation.x = -0.16;
    chairGroup.add(backrestGroup);

    const backSupportGeo = new THREE.BoxGeometry(1.35, 1.7, 0.12);
    const backSupport = new THREE.Mesh(backSupportGeo, darkMetalMaterial);
    backSupport.position.y = 0.85;
    backrestGroup.add(backSupport);

    const backCushionGeo = new THREE.BoxGeometry(1.28, 1.6, 0.28);
    const backCushion = new THREE.Mesh(backCushionGeo, darkLeatherMaterial);
    backCushion.position.set(0, 0.85, 0.12);
    backCushion.castShadow = true;
    backrestGroup.add(backCushion);

    // Backrest Gold Crown Bar
    const backCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.36, 16), champagneMaterial);
    backCrown.rotation.z = Math.PI / 2;
    backCrown.position.set(0, 1.72, 0);
    backrestGroup.add(backCrown);

    // Adjustable Headrest
    const headRodL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), champagneMaterial);
    headRodL.position.set(-0.3, 1.9, -0.02);
    backrestGroup.add(headRodL);

    const headRodR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), champagneMaterial);
    headRodR.position.set(0.3, 1.9, -0.02);
    backrestGroup.add(headRodR);

    const headPillowGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.85, 24);
    const headPillow = new THREE.Mesh(headPillowGeo, darkLeatherMaterial);
    headPillow.rotation.z = Math.PI / 2;
    headPillow.position.set(0, 2.1, 0.05);
    headPillow.castShadow = true;
    backrestGroup.add(headPillow);

    // Armrests (Left & Right)
    [-0.95, 0.95].forEach((xSide) => {
      const armSupport = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 1.3), champagneMaterial);
      armSupport.position.set(xSide, 0.58, 0.1);
      chairGroup.add(armSupport);

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 1.35), darkLeatherMaterial);
      armPad.position.set(xSide, 0.92, 0.1);
      armPad.castShadow = true;
      chairGroup.add(armPad);
    });

    // Footrest Lever & Platform
    const footRod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 16), goldMaterial);
    footRod.rotation.x = 0.55;
    footRod.position.set(0, -0.15, 0.95);
    chairGroup.add(footRod);

    const footPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.65), darkMetalMaterial);
    footPlate.position.set(0, -0.45, 1.3);
    footPlate.castShadow = true;
    chairGroup.add(footPlate);

    const footTrim = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.06), champagneMaterial);
    footTrim.position.set(0, -0.43, 1.62);
    chairGroup.add(footTrim);

    // --- C. Floating Precision Master Barber Shears ---
    const shearsGroup = new THREE.Group();
    shearsGroup.position.set(1.4, 0.85, 0.9);
    shearsGroup.rotation.set(-0.25, 0.35, -0.2);
    compositionGroup.add(shearsGroup);

    // Pivot Knurled Screw
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 24), champagneMaterial);
    pivot.rotation.x = Math.PI / 2;
    shearsGroup.add(pivot);

    // Blade 1
    const blade1Group = new THREE.Group();
    shearsGroup.add(blade1Group);

    const blade1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 1.5, 4), polishedBladeMaterial);
    blade1.rotation.z = -Math.PI / 2;
    blade1.scale.set(0.35, 1, 0.08);
    blade1.position.set(0.75, 0.04, 0);
    blade1.castShadow = true;
    blade1Group.add(blade1);

    const handle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), champagneMaterial);
    handle1.rotation.z = Math.PI / 2.3;
    handle1.position.set(-0.35, -0.12, 0);
    blade1Group.add(handle1);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 16, 32), champagneMaterial);
    ring1.position.set(-0.65, -0.25, 0);
    blade1Group.add(ring1);

    // Blade 2 (Open Styling Pose)
    const blade2Group = new THREE.Group();
    blade2Group.rotation.z = -0.32; // Open angle
    shearsGroup.add(blade2Group);

    const blade2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 1.5, 4), polishedBladeMaterial);
    blade2.rotation.z = -Math.PI / 2;
    blade2.scale.set(0.35, 1, 0.08);
    blade2.position.set(0.75, -0.04, 0);
    blade2.castShadow = true;
    blade2Group.add(blade2);

    const handle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), champagneMaterial);
    handle2.rotation.z = Math.PI / 1.7;
    handle2.position.set(-0.35, 0.12, 0);
    blade2Group.add(handle2);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 16, 32), champagneMaterial);
    ring2.position.set(-0.65, 0.25, 0);
    blade2Group.add(ring2);

    // Tang / Finger Rest
    const tang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 12), champagneMaterial);
    tang.rotation.z = 2.4;
    tang.position.set(-0.85, 0.35, 0);
    blade2Group.add(tang);

    // --- D. Sculptural Stylist Comb ---
    const combGroup = new THREE.Group();
    combGroup.position.set(1.55, -0.4, 0.6);
    combGroup.rotation.set(0.2, -0.4, 0.35);
    compositionGroup.add(combGroup);

    const combSpine = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.18, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xc89b45,
        roughness: 0.25,
        metalness: 0.5,
        transparent: true,
        opacity: 0.88,
      })
    );
    combGroup.add(combSpine);

    // Comb Fine Teeth
    const teethCount = 22;
    const toothGeo = new THREE.BoxGeometry(0.02, 0.35, 0.03);
    for (let i = 0; i < teethCount; i++) {
      const tooth = new THREE.Mesh(toothGeo, champagneMaterial);
      tooth.position.set(-0.75 + i * 0.07, -0.22, 0);
      combGroup.add(tooth);
    }

    // --- E. Floating Atmospheric Starlight Particles ---
    const particleCount = 65;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      particleSpeeds[i] = 0.003 + Math.random() * 0.006;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xe8c982,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Interaction State (Damped Pointer & Scroll Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollYOffset = 0;

    const handlePointerMove = (e) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = normX * 0.45;
      targetY = normY * 0.3;
    };

    const handleScroll = () => {
      scrollYOffset = (window.scrollY || window.pageYOffset || 0) * 0.0012;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 550;
      const newH = container.clientHeight || 550;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 7. Render Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth pointer lerping
      mouseX += (targetX - mouseX) * 0.045;
      mouseY += (targetY - mouseY) * 0.045;

      // Subtle ambient hover motions
      if (!prefersReducedMotion) {
        // Floating shears dynamic oscillation
        shearsGroup.position.y = 0.85 + Math.sin(elapsed * 1.5) * 0.06;
        shearsGroup.rotation.z = -0.2 + Math.cos(elapsed * 1.2) * 0.05;

        // Floating comb gentle breathing
        combGroup.position.y = -0.4 + Math.sin(elapsed * 1.8 + 1) * 0.04;
        combGroup.rotation.y = -0.4 + Math.sin(elapsed * 1.1) * 0.06;

        // Slow particle drift
        const positions = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += particleSpeeds[i];
          if (positions[i * 3 + 1] > 3) positions[i * 3 + 1] = -2.5;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Composition interactive rotation & scroll lift
        compositionGroup.rotation.y = 0.35 + mouseX + Math.sin(elapsed * 0.4) * 0.04;
        compositionGroup.rotation.x = 0.08 - mouseY * 0.6 + scrollYOffset * 0.35;
        compositionGroup.position.y = scrollYOffset * 0.8;
      } else {
        compositionGroup.rotation.y = 0.35;
        compositionGroup.rotation.x = 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // 8. Cleanup & Resource Disposal
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  // Graceful Fallback if WebGL is unavailable
  if (!webglSupported) {
    return (
      <div
        className={`relative rounded-3xl overflow-hidden border border-salon-gold/30 bg-gradient-to-br from-[#292622] via-[#191817] to-[#121110] shadow-2xl flex items-center justify-center p-8 ${className}`}
        aria-label="Aura Salon Sculptural Showcase"
      >
        <div className="text-center space-y-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-salon-gold/10 border border-salon-gold/40 flex items-center justify-center text-salon-gold">
            <span className="text-2xl font-serif font-black tracking-widest">AURA</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-white tracking-wide">
            The Master Barber Chair
          </h3>
          <p className="text-xs text-salon-textSecondary max-w-xs mx-auto">
            Where precision craftsmanship meets effortless queueing elegance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[580px] transition-opacity duration-700 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-label="Interactive 3D Master Salon Station"
    >
      {/* Subtle radial champagne glow behind the 3D scene */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-radial-gradient from-salon-gold/15 via-transparent to-transparent blur-2xl"
        aria-hidden="true"
      />
    </div>
  );
}
