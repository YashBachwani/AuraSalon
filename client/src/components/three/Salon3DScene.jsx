import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function Salon3DScene() {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // 1. WebGL & Reduced Motion Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebGLSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // 2. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#141414', 0.05);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.2, 7.8);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight('#2A2620', 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFF7E6', 3.2);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const goldSpotLight = new THREE.SpotLight('#E8C982', 5.0, 25, Math.PI / 4, 0.4, 1.2);
    goldSpotLight.position.set(0, 6, 4);
    goldSpotLight.target.position.set(0, 0, 0);
    scene.add(goldSpotLight);
    scene.add(goldSpotLight.target);

    const warmRimLight = new THREE.PointLight('#C89B45', 3.5, 14);
    warmRimLight.position.set(-4, -2, -3);
    scene.add(warmRimLight);

    const coolRimLight = new THREE.PointLight('#7A8D9E', 2.2, 14);
    coolRimLight.position.set(4, -3, -2);
    scene.add(coolRimLight);

    // 4. Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: '#D4AF70',
      metalness: 0.94,
      roughness: 0.18,
    });

    const champagneMaterial = new THREE.MeshStandardMaterial({
      color: '#E8C982',
      metalness: 0.96,
      roughness: 0.14,
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      metalness: 0.95,
      roughness: 0.12,
    });

    const darkEbonyMaterial = new THREE.MeshStandardMaterial({
      color: '#161413',
      metalness: 0.25,
      roughness: 0.35,
    });

    const darkMirrorMaterial = new THREE.MeshStandardMaterial({
      color: '#121212',
      metalness: 0.9,
      roughness: 0.08,
    });

    // 5. Build Master Barber Shears (Articulated Pivoted Blades)
    const shearsGroup = new THREE.Group();

    // Central Pivot Bolt
    const boltGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24);
    const boltMesh = new THREE.Mesh(boltGeometry, champagneMaterial);
    boltMesh.rotation.x = Math.PI / 2;
    shearsGroup.add(boltMesh);

    // Blade A (Left Articulated Group)
    const bladeAGroup = new THREE.Group();
    // Blade Body
    const bladeAGeom = new THREE.CylinderGeometry(0.04, 0.18, 2.6, 16);
    bladeAGeom.scale(1, 1, 0.22);
    const bladeAMesh = new THREE.Mesh(bladeAGeom, goldMaterial);
    bladeAMesh.position.set(0, 1.3, 0);
    bladeAGroup.add(bladeAMesh);

    // Shank A
    const shankAGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.1, 14);
    const shankAMesh = new THREE.Mesh(shankAGeom, goldMaterial);
    shankAMesh.position.set(0.12, -0.6, 0);
    shankAMesh.rotation.z = -0.12;
    bladeAGroup.add(shankAMesh);

    // Finger Ring A
    const ringAGeom = new THREE.TorusGeometry(0.38, 0.07, 16, 32);
    const ringAMesh = new THREE.Mesh(ringAGeom, goldMaterial);
    ringAMesh.position.set(0.24, -1.3, 0);
    bladeAGroup.add(ringAMesh);

    // Finger Tang
    const tangGeom = new THREE.CylinderGeometry(0.05, 0.02, 0.45, 12);
    const tangMesh = new THREE.Mesh(tangGeom, champagneMaterial);
    tangMesh.position.set(0.55, -1.5, 0);
    tangMesh.rotation.z = -0.6;
    bladeAGroup.add(tangMesh);

    shearsGroup.add(bladeAGroup);

    // Blade B (Right Articulated Group)
    const bladeBGroup = new THREE.Group();
    const bladeBGeom = new THREE.CylinderGeometry(0.04, 0.18, 2.6, 16);
    bladeBGeom.scale(1, 1, 0.22);
    const bladeBMesh = new THREE.Mesh(bladeBGeom, steelMaterial);
    bladeBMesh.position.set(0, 1.3, 0);
    bladeBGroup.add(bladeBMesh);

    const shankBGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.1, 14);
    const shankBMesh = new THREE.Mesh(shankBGeom, goldMaterial);
    shankBMesh.position.set(-0.12, -0.6, 0);
    shankBMesh.rotation.z = 0.12;
    bladeBGroup.add(shankBMesh);

    const ringBGeom = new THREE.TorusGeometry(0.38, 0.07, 16, 32);
    const ringBMesh = new THREE.Mesh(ringBGeom, goldMaterial);
    ringBMesh.position.set(-0.24, -1.3, 0);
    bladeBGroup.add(ringBMesh);

    shearsGroup.add(bladeBGroup);

    // 6. Build Classic Straight Razor
    const razorGroup = new THREE.Group();

    // Razor Handle Scales
    const scale1Geom = new THREE.BoxGeometry(0.16, 3.0, 0.06);
    const scale1Mesh = new THREE.Mesh(scale1Geom, darkEbonyMaterial);
    scale1Mesh.position.set(0, 0, 0.05);
    razorGroup.add(scale1Mesh);

    const scale2Mesh = new THREE.Mesh(scale1Geom, darkEbonyMaterial);
    scale2Mesh.position.set(0, 0, -0.05);
    razorGroup.add(scale2Mesh);

    // Razor Brass Pivot Pin
    const pinGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12);
    const pinMesh = new THREE.Mesh(pinGeom, champagneMaterial);
    pinMesh.rotation.x = Math.PI / 2;
    pinMesh.position.set(0, 1.35, 0);
    razorGroup.add(pinMesh);

    // Razor Blade (Articulated at pivot pin)
    const razorBladeGroup = new THREE.Group();
    razorBladeGroup.position.set(0, 1.35, 0);

    const bladeSliceGeom = new THREE.BoxGeometry(0.05, 2.4, 0.45);
    const bladeSliceMesh = new THREE.Mesh(bladeSliceGeom, steelMaterial);
    bladeSliceMesh.position.set(0, 1.2, 0.15);
    bladeSliceMesh.rotation.y = 0.1;
    razorBladeGroup.add(bladeSliceMesh);

    // Tang / Shank of Razor
    const razorTangGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.7, 12);
    const razorTangMesh = new THREE.Mesh(razorTangGeom, steelMaterial);
    razorTangMesh.position.set(0, -0.3, 0);
    razorBladeGroup.add(razorTangMesh);

    // Open angle on razor blade
    razorBladeGroup.rotation.z = -1.8;
    razorGroup.add(razorBladeGroup);

    razorGroup.position.set(2.4, -0.5, -0.8);
    razorGroup.rotation.set(0.3, -0.4, 0.5);

    // 7. Build Fine Precision Barber Styling Comb
    const combGroup = new THREE.Group();
    const combSpineGeom = new THREE.BoxGeometry(0.12, 3.2, 0.22);
    const combSpineMesh = new THREE.Mesh(combSpineGeom, champagneMaterial);
    combGroup.add(combSpineMesh);

    // Teeth array
    const toothGeom = new THREE.BoxGeometry(0.05, 0.05, 0.65);
    for (let i = 0; i < 28; i++) {
      const toothMesh = new THREE.Mesh(toothGeom, goldMaterial);
      toothMesh.position.set(0, -1.35 + i * 0.1, 0.42);
      combGroup.add(toothMesh);
    }
    combGroup.position.set(-2.4, -0.3, -1.0);
    combGroup.rotation.set(-0.2, 0.5, -0.4);

    // 8. Background Luxury Beveled Mirror Ring
    const mirrorGroup = new THREE.Group();
    const mirrorRimGeom = new THREE.TorusGeometry(3.6, 0.06, 16, 64);
    const mirrorRimMesh = new THREE.Mesh(mirrorRimGeom, champagneMaterial);
    mirrorGroup.add(mirrorRimMesh);

    const mirrorBackingGeom = new THREE.CircleGeometry(3.55, 48);
    const mirrorBackingMesh = new THREE.Mesh(mirrorBackingGeom, darkMirrorMaterial);
    mirrorGroup.add(mirrorBackingMesh);

    mirrorGroup.position.set(0, 0, -2.5);
    scene.add(mirrorGroup);

    // 9. Floating Golden Embers Particle Field
    const particleCount = isMobile ? 160 : 320;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
      scales[i] = Math.random() * 0.05 + 0.02;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: '#E8C982',
      size: 0.07,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMaterial);
    scene.add(particleSystem);

    // Add tools into a master world group
    const worldGroup = new THREE.Group();
    worldGroup.add(shearsGroup);
    worldGroup.add(razorGroup);
    worldGroup.add(combGroup);
    scene.add(worldGroup);

    // 10. Scroll & Mouse Tracking
    let targetScroll = 0;
    let currentScroll = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docHeight > 0 ? Math.min(Math.max(window.scrollY / docHeight, 0), 1) : 0;
    };

    const handlePointerMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    handleScroll();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 11. Animation Loop with Smooth Choreography
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth lerp for scroll and mouse
      currentScroll += (targetScroll - currentScroll) * 0.065;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      const p = currentScroll; // 0.0 to 1.0

      // Shears Scissor Articulation
      const scissorSnip = Math.sin(elapsed * 2.5 + p * 12) * 0.16 + 0.12;
      bladeAGroup.rotation.z = -scissorSnip;
      bladeBGroup.rotation.z = scissorSnip;

      // Dynamic Camera & Tool Motion Choreography across 5 Sections
      if (!prefersReducedMotion) {
        if (p < 0.22) {
          // --- HERO STAGE (0.0 to 0.22) ---
          const t = p / 0.22;
          shearsGroup.position.set(0, 0, 0);
          shearsGroup.rotation.set(0.2 + currentMouseY * 0.15, currentMouseX * 0.25, Math.sin(elapsed * 0.8) * 0.06);

          razorGroup.position.set(2.4 - t * 0.4, -0.5 + t * 0.3, -0.8);
          combGroup.position.set(-2.4 + t * 0.4, -0.3 + t * 0.2, -1.0);

          camera.position.set(currentMouseX * 0.3, 0.2 + currentMouseY * 0.2, 7.8 - t * 0.6);
          camera.lookAt(0, 0, 0);
        } else if (p < 0.5) {
          // --- SALON EXPERIENCE STAGE (0.22 to 0.5) ---
          const t = (p - 0.22) / 0.28;
          // Shift tools to the right side so editorial hospitality story reads clearly on left
          shearsGroup.position.set(1.5 + t * 0.4, 0.1 - t * 0.3, 0.2);
          shearsGroup.rotation.set(0.4 + t * 0.3, -0.5 - t * 0.4, -0.2);

          razorGroup.position.set(1.8 + t * 0.3, -1.2, 0.5);
          razorGroup.rotation.set(0.6, -0.8, 0.3);

          combGroup.position.set(1.2, 1.4 - t * 0.4, -0.2);
          combGroup.rotation.set(0.2, 0.4, 0.6);

          camera.position.set(0.5, 0.1, 7.2 - t * 0.4);
          camera.lookAt(0.8, 0, 0);
        } else if (p < 0.72) {
          // --- CURATED SERVICES FLAT-LAY STAGE (0.5 to 0.72) ---
          const t = (p - 0.5) / 0.22;
          // Flat-lay overhead tool arrangement
          shearsGroup.position.set(-0.2 + t * 0.4, -0.2, 0.5);
          shearsGroup.rotation.set(-0.75, 0.1, 0.4);

          razorGroup.position.set(2.2, -0.8, 0.2);
          razorGroup.rotation.set(-0.6, 0.3, -0.4);

          combGroup.position.set(-2.2, -0.6, 0.3);
          combGroup.rotation.set(-0.6, -0.3, 0.3);

          camera.position.set(0, 0.4, 6.8);
          camera.lookAt(0, -0.2, 0);
        } else if (p < 0.88) {
          // --- MEET MASTER BARBER ISHA SPOTLIGHT STAGE (0.72 to 0.88) ---
          const t = (p - 0.72) / 0.16;
          // Macro zoom on the precision shears with gold spotlight
          shearsGroup.position.set(0, 0.3, 1.6 + t * 0.4);
          shearsGroup.rotation.set(0.1, Math.sin(elapsed) * 0.15, -0.15);

          razorGroup.position.set(-2.8, -1.0, -1.2);
          combGroup.position.set(2.8, -1.0, -1.2);

          camera.position.set(0, 0.2, 6.2);
          camera.lookAt(0, 0.3, 1.6);
        } else {
          // --- LIVE QUEUE & CLOSING CTA CREST STAGE (0.88 to 1.0) ---
          shearsGroup.position.set(0, 0.2, 0.2);
          shearsGroup.rotation.set(0.15, 0, 0);

          razorGroup.position.set(1.4, -0.2, -0.4);
          razorGroup.rotation.set(0.2, -0.3, 0.6);

          combGroup.position.set(-1.4, -0.2, -0.4);
          combGroup.rotation.set(0.2, 0.3, -0.6);

          camera.position.set(0, 0.1, 7.4);
          camera.lookAt(0, 0, 0);
        }

        // Ambient Embers Rotation
        particleSystem.rotation.y = elapsed * 0.03 + p * 0.8;
        particleSystem.rotation.x = currentMouseY * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-gradient-to-b from-[#191817] via-[#292622]/40 to-[#141414]"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full overflow-hidden"
      aria-hidden="true"
    />
  );
}
