import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Procedural Master Barber Chair & Salon Environment
 * Crafted with exact Aura Salon luxury palette tokens:
 * Charcoal (#191817 / #1C1A18), Antique Gold (#C89B45), Champagne Gold (#E8C982),
 * Polished Chrome Steel (#E8EEF5), and Dark Ebony/Rubber (#121110).
 */
function createBarberChair({ goldMaterial, champagneMaterial, steelMaterial, leatherMaterial, darkEbonyMaterial, floorMaterial }) {
  const chairGroup = new THREE.Group();

  // 1. BASE ASSEMBLY (Heavy circular pedestal, hydraulic lift, pump pedal)
  const baseGroup = new THREE.Group();

  // Heavy circular base disc with beveled edge
  const baseDiscGeom = new THREE.CylinderGeometry(1.45, 1.55, 0.12, 48);
  const baseDiscMesh = new THREE.Mesh(baseDiscGeom, champagneMaterial);
  baseDiscMesh.position.y = 0.06;
  baseGroup.add(baseDiscMesh);

  // Protective rubber bottom gasket
  const gasketGeom = new THREE.TorusGeometry(1.52, 0.035, 16, 48);
  const gasketMesh = new THREE.Mesh(gasketGeom, darkEbonyMaterial);
  gasketMesh.rotation.x = Math.PI / 2;
  gasketMesh.position.y = 0.035;
  baseGroup.add(gasketMesh);

  // Central hydraulic cylinder housing
  const hydraOuterGeom = new THREE.CylinderGeometry(0.38, 0.44, 0.55, 32);
  const hydraOuterMesh = new THREE.Mesh(hydraOuterGeom, goldMaterial);
  hydraOuterMesh.position.y = 0.38;
  baseGroup.add(hydraOuterMesh);

  // Chrome hydraulic inner lift shaft
  const hydraShaftGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.75, 32);
  const hydraShaftMesh = new THREE.Mesh(hydraShaftGeom, steelMaterial);
  hydraShaftMesh.position.y = 0.88;
  baseGroup.add(hydraShaftMesh);

  // Hydraulic pump foot lever (angled outwards to the front-right)
  const pedalRodGeom = new THREE.CylinderGeometry(0.038, 0.038, 1.05, 16);
  const pedalRodMesh = new THREE.Mesh(pedalRodGeom, goldMaterial);
  pedalRodMesh.position.set(0.48, 0.34, 0.48);
  pedalRodMesh.rotation.set(-0.25, 0.78, 0.35);
  baseGroup.add(pedalRodMesh);

  const pedalPlateGeom = new THREE.BoxGeometry(0.32, 0.06, 0.48);
  const pedalPlateMesh = new THREE.Mesh(pedalPlateGeom, darkEbonyMaterial);
  pedalPlateMesh.position.set(0.85, 0.16, 0.85);
  pedalPlateMesh.rotation.set(-0.2, 0.78, 0.1);
  baseGroup.add(pedalPlateMesh);

  chairGroup.add(baseGroup);

  // 2. SEAT SUBFRAME & CARRIAGE
  const carriageGroup = new THREE.Group();
  carriageGroup.position.y = 1.18;

  // Swivel collar & heavy cast bracket
  const collarGeom = new THREE.CylinderGeometry(0.44, 0.38, 0.24, 24);
  const collarMesh = new THREE.Mesh(collarGeom, goldMaterial);
  carriageGroup.add(collarMesh);

  // Left & Right arching seat cradle arms
  const cradleGeom = new THREE.BoxGeometry(0.12, 0.28, 1.5);
  const cradleLMesh = new THREE.Mesh(cradleGeom, goldMaterial);
  cradleLMesh.position.set(0.82, 0.15, 0);
  carriageGroup.add(cradleLMesh);

  const cradleRMesh = new THREE.Mesh(cradleGeom, goldMaterial);
  cradleRMesh.position.set(-0.82, 0.15, 0);
  carriageGroup.add(cradleRMesh);

  // Cross support beams
  const crossBeamGeom = new THREE.BoxGeometry(1.6, 0.12, 0.15);
  const crossFront = new THREE.Mesh(crossBeamGeom, champagneMaterial);
  crossFront.position.set(0, 0.15, 0.6);
  carriageGroup.add(crossFront);

  const crossBack = new THREE.Mesh(crossBeamGeom, champagneMaterial);
  crossBack.position.set(0, 0.15, -0.6);
  carriageGroup.add(crossBack);

  // Recline hydraulic piston under seat
  const reclinePistonGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16);
  const reclinePiston = new THREE.Mesh(reclinePistonGeom, steelMaterial);
  reclinePiston.rotation.x = -0.6;
  reclinePiston.position.set(0, 0.08, -0.25);
  carriageGroup.add(reclinePiston);

  chairGroup.add(carriageGroup);

  // 3. SEAT CUSHION WITH LUXURY RIBBED LEATHER TUFTING
  const seatGroup = new THREE.Group();
  seatGroup.position.y = 1.42;

  // Gold perimeter casing trim around seat
  const seatTrimGeom = new THREE.BoxGeometry(1.8, 0.22, 1.8);
  const seatTrimMesh = new THREE.Mesh(seatTrimGeom, champagneMaterial);
  seatGroup.add(seatTrimMesh);

  // Main thick leather seat cushion
  const seatBaseGeom = new THREE.BoxGeometry(1.72, 0.36, 1.72);
  const seatBaseMesh = new THREE.Mesh(seatBaseGeom, leatherMaterial);
  seatBaseMesh.position.y = 0.12;
  seatGroup.add(seatBaseMesh);

  // Horizontal ribbed tufting segments (3 cushion ribs on top of seat)
  const ribGeom = new THREE.BoxGeometry(1.64, 0.08, 0.46);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeom, leatherMaterial);
    rib.position.set(0, 0.32, -0.52 + i * 0.52);
    seatGroup.add(rib);

    // Deep stitching seam between ribs
    if (i < 2) {
      const seamGeom = new THREE.BoxGeometry(1.65, 0.035, 0.04);
      const seam = new THREE.Mesh(seamGeom, darkEbonyMaterial);
      seam.position.set(0, 0.32, -0.26 + i * 0.52);
      seatGroup.add(seam);
    }
  }

  chairGroup.add(seatGroup);

  // 4. RECLINING BACKREST ASSEMBLY
  const backrestGroup = new THREE.Group();
  backrestGroup.position.set(0, 1.58, -0.76);
  backrestGroup.rotation.x = 0.24; // Ergonomic 14-degree recline

  // Heavy gold spine/frame backplate
  const backPlateGeom = new THREE.BoxGeometry(1.6, 1.62, 0.08);
  const backPlateMesh = new THREE.Mesh(backPlateGeom, goldMaterial);
  backPlateMesh.position.set(0, 0.82, -0.06);
  backrestGroup.add(backPlateMesh);

  // Lower Lumbar Cushion
  const lumbarGeom = new THREE.BoxGeometry(1.52, 0.74, 0.26);
  const lumbarMesh = new THREE.Mesh(lumbarGeom, leatherMaterial);
  lumbarMesh.position.set(0, 0.44, 0.08);
  backrestGroup.add(lumbarMesh);

  // Upper Shoulder Cushion
  const shoulderGeom = new THREE.BoxGeometry(1.44, 0.7, 0.24);
  const shoulderMesh = new THREE.Mesh(shoulderGeom, leatherMaterial);
  shoulderMesh.position.set(0, 1.18, 0.08);
  backrestGroup.add(shoulderMesh);

  // Horizontal quilted seam on backrest
  const backSeamGeom = new THREE.BoxGeometry(1.46, 0.035, 0.27);
  const backSeam = new THREE.Mesh(backSeamGeom, darkEbonyMaterial);
  backSeam.position.set(0, 0.82, 0.08);
  backrestGroup.add(backSeam);

  // Recline release hand lever (attached to right side of backrest hinge)
  const leverRodGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
  const leverRod = new THREE.Mesh(leverRodGeom, champagneMaterial);
  leverRod.position.set(0.9, 0.24, 0.05);
  leverRod.rotation.set(0.2, 0, -0.6);
  backrestGroup.add(leverRod);

  const leverKnobGeom = new THREE.SphereGeometry(0.075, 16, 16);
  const leverKnob = new THREE.Mesh(leverKnobGeom, darkEbonyMaterial);
  leverKnob.position.set(1.08, 0.4, 0.05);
  backrestGroup.add(leverKnob);

  // 5. ADJUSTABLE HEADREST (Mounted to top of backrest)
  const headrestGroup = new THREE.Group();
  headrestGroup.position.set(0, 1.62, 0);

  // Dual height adjustment stalks
  const stalkGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.48, 12);
  const stalkL = new THREE.Mesh(stalkGeom, steelMaterial);
  stalkL.position.set(0.28, 0.2, 0);
  headrestGroup.add(stalkL);

  const stalkR = new THREE.Mesh(stalkGeom, steelMaterial);
  stalkR.position.set(-0.28, 0.2, 0);
  headrestGroup.add(stalkR);

  // Padded oval leather headrest cushion
  const headrestPillowGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.88, 24);
  const headrestPillow = new THREE.Mesh(headrestPillowGeom, leatherMaterial);
  headrestPillow.rotation.z = Math.PI / 2;
  headrestPillow.position.set(0, 0.42, 0.04);
  headrestGroup.add(headrestPillow);

  // Gold end caps for headrest
  const capGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24);
  const capL = new THREE.Mesh(capGeom, champagneMaterial);
  capL.rotation.z = Math.PI / 2;
  capL.position.set(0.46, 0.42, 0.04);
  headrestGroup.add(capL);

  const capR = new THREE.Mesh(capGeom, champagneMaterial);
  capR.rotation.z = Math.PI / 2;
  capR.position.set(-0.46, 0.42, 0.04);
  headrestGroup.add(capR);

  backrestGroup.add(headrestGroup);
  chairGroup.add(backrestGroup);

  // 6. POLISHED CURVED ARMRESTS (Left & Right)
  const armrestGroup = new THREE.Group();
  armrestGroup.position.y = 1.62;

  const armSupportGeom = new THREE.BoxGeometry(0.1, 0.44, 1.35);
  const padGeom = new THREE.BoxGeometry(0.24, 0.1, 1.38);
  const capEndGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);

  // Left Armrest
  const armL = new THREE.Group();
  armL.position.set(0.98, 0, 0.05);

  const armLSupport = new THREE.Mesh(armSupportGeom, goldMaterial);
  armLSupport.position.y = 0.1;
  armL.add(armLSupport);

  const padL = new THREE.Mesh(padGeom, leatherMaterial);
  padL.position.y = 0.35;
  armL.add(padL);

  const capEndL = new THREE.Mesh(capEndGeom, champagneMaterial);
  capEndL.rotation.x = Math.PI / 2;
  capEndL.position.set(0, 0.35, 0.72);
  armL.add(capEndL);

  armrestGroup.add(armL);

  // Right Armrest
  const armR = new THREE.Group();
  armR.position.set(-0.98, 0, 0.05);

  const armRSupport = new THREE.Mesh(armSupportGeom, goldMaterial);
  armRSupport.position.y = 0.1;
  armR.add(armRSupport);

  const padR = new THREE.Mesh(padGeom, leatherMaterial);
  padR.position.y = 0.35;
  armR.add(padR);

  const capEndR = new THREE.Mesh(capEndGeom, champagneMaterial);
  capEndR.rotation.x = Math.PI / 2;
  capEndR.position.set(0, 0.35, 0.72);
  armR.add(capEndR);

  armrestGroup.add(armR);

  chairGroup.add(armrestGroup);

  // 7. ARTICULATED FOOTREST & CALF SUPPORT ASSEMBLY
  const footrestGroup = new THREE.Group();
  footrestGroup.position.set(0, 1.38, 0.88);

  // Dual drop extension arms angled forward-downward
  const dropArmGeom = new THREE.BoxGeometry(0.1, 0.12, 1.28);

  const dropArmL = new THREE.Mesh(dropArmGeom, goldMaterial);
  dropArmL.position.set(0.7, -0.44, 0.46);
  dropArmL.rotation.x = 0.65;
  footrestGroup.add(dropArmL);

  const dropArmR = new THREE.Mesh(dropArmGeom, goldMaterial);
  dropArmR.position.set(-0.7, -0.44, 0.46);
  dropArmR.rotation.x = 0.65;
  footrestGroup.add(dropArmR);

  // Calf support padded leather cushion
  const calfGeom = new THREE.BoxGeometry(1.28, 0.18, 0.44);
  const calfMesh = new THREE.Mesh(calfGeom, leatherMaterial);
  calfMesh.position.set(0, -0.36, 0.46);
  calfMesh.rotation.x = 0.65;
  footrestGroup.add(calfMesh);

  // Heavy foot treadplate at the bottom
  const plateGeom = new THREE.BoxGeometry(1.38, 0.06, 0.84);
  const plateMesh = new THREE.Mesh(plateGeom, champagneMaterial);
  plateMesh.position.set(0, -0.9, 0.98);
  plateMesh.rotation.x = 0.1;
  footrestGroup.add(plateMesh);

  // Textured ribbed black rubber treads on footplate
  const treadGeom = new THREE.BoxGeometry(1.18, 0.02, 0.12);
  for (let i = 0; i < 3; i++) {
    const tread = new THREE.Mesh(treadGeom, darkEbonyMaterial);
    tread.position.set(0, -0.87, 0.74 + i * 0.22);
    tread.rotation.x = 0.1;
    footrestGroup.add(tread);
  }

  // Dual floor peg stops with rubber buffers
  const pegGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12);
  const pegL = new THREE.Mesh(pegGeom, darkEbonyMaterial);
  pegL.position.set(0.62, -1.04, 1.18);
  footrestGroup.add(pegL);

  const pegR = new THREE.Mesh(pegGeom, darkEbonyMaterial);
  pegR.position.set(-0.62, -1.04, 1.18);
  footrestGroup.add(pegR);

  chairGroup.add(footrestGroup);

  // 8. POLISHED SALON TERRAZZO FLOOR PLINTH BENEATH CHAIR
  const floorPlinthGeom = new THREE.CylinderGeometry(4.4, 4.5, 0.08, 64);
  const floorPlinthMesh = new THREE.Mesh(floorPlinthGeom, floorMaterial);
  floorPlinthMesh.position.y = -0.04;
  chairGroup.add(floorPlinthMesh);

  return chairGroup;
}

export function Salon3DScene() {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // 1. WebGL & Reduced Motion Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 1024;

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
    scene.fog = new THREE.FogExp2('#141414', 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 8.2);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight('#2A2622', 2.2);
    scene.add(ambientLight);

    // Warm Directional Key Light from High Right-Front
    const keyLight = new THREE.DirectionalLight('#FFF5E6', 3.6);
    keyLight.position.set(5, 7.5, 6);
    scene.add(keyLight);

    // Golden Spot Light Focused on Chair
    const goldSpotLight = new THREE.SpotLight('#E8C982', 5.5, 28, Math.PI / 4, 0.4, 1.2);
    goldSpotLight.position.set(2, 6.5, 4.5);
    goldSpotLight.target.position.set(1.5, 0, 0);
    scene.add(goldSpotLight);
    scene.add(goldSpotLight.target);

    // Warm Golden Rim Light for Silhouette Highlights
    const warmRimLight = new THREE.PointLight('#C89B45', 4.0, 16);
    warmRimLight.position.set(-3.5, 3.2, -3);
    scene.add(warmRimLight);

    // Cool Contrast Fill Light for Cinematic Depth
    const coolRimLight = new THREE.PointLight('#5A6E82', 1.8, 14);
    coolRimLight.position.set(-4, -2, 3);
    scene.add(coolRimLight);

    // 4. Luxury Materials (Palette Aligned)
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
      color: '#E8EEF5',
      metalness: 0.98,
      roughness: 0.08,
    });

    const leatherMaterial = new THREE.MeshStandardMaterial({
      color: '#1C1917',
      metalness: 0.12,
      roughness: 0.42,
    });

    const darkEbonyMaterial = new THREE.MeshStandardMaterial({
      color: '#121110',
      metalness: 0.2,
      roughness: 0.6,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#161514',
      metalness: 0.72,
      roughness: 0.22,
    });

    const darkMirrorMaterial = new THREE.MeshStandardMaterial({
      color: '#101010',
      metalness: 0.92,
      roughness: 0.06,
    });

    // 5. Build Master Barber Chair
    const chairGroup = createBarberChair({
      goldMaterial,
      champagneMaterial,
      steelMaterial,
      leatherMaterial,
      darkEbonyMaterial,
      floorMaterial,
    });

    // Initial Chair Staging
    const chairInitialX = isMobile ? 0 : 1.7;
    const chairInitialY = isMobile ? -0.45 : -0.65;
    chairGroup.position.set(chairInitialX, chairInitialY, 0.3);
    chairGroup.rotation.set(0.08, isMobile ? -0.32 : -0.54, 0);
    chairGroup.scale.set(isMobile ? 0.78 : 0.96, isMobile ? 0.78 : 0.96, isMobile ? 0.78 : 0.96);

    // 6. Build Master Barber Shears (Articulated Pivoted Blades)
    const shearsGroup = new THREE.Group();

    // Central Pivot Bolt
    const boltGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24);
    const boltMesh = new THREE.Mesh(boltGeometry, champagneMaterial);
    boltMesh.rotation.x = Math.PI / 2;
    shearsGroup.add(boltMesh);

    // Blade A (Left Articulated Group)
    const bladeAGroup = new THREE.Group();
    const bladeAGeom = new THREE.CylinderGeometry(0.04, 0.18, 2.6, 16);
    bladeAGeom.scale(1, 1, 0.22);
    const bladeAMesh = new THREE.Mesh(bladeAGeom, goldMaterial);
    bladeAMesh.position.set(0, 1.3, 0);
    bladeAGroup.add(bladeAMesh);

    const shankAGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.1, 14);
    const shankAMesh = new THREE.Mesh(shankAGeom, goldMaterial);
    shankAMesh.position.set(0.12, -0.6, 0);
    shankAMesh.rotation.z = -0.12;
    bladeAGroup.add(shankAMesh);

    const ringAGeom = new THREE.TorusGeometry(0.38, 0.07, 16, 32);
    const ringAMesh = new THREE.Mesh(ringAGeom, goldMaterial);
    ringAMesh.position.set(0.24, -1.3, 0);
    bladeAGroup.add(ringAMesh);

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

    // 7. Build Classic Straight Razor
    const razorGroup = new THREE.Group();
    const scale1Geom = new THREE.BoxGeometry(0.16, 3.0, 0.06);
    const scale1Mesh = new THREE.Mesh(scale1Geom, darkEbonyMaterial);
    scale1Mesh.position.set(0, 0, 0.05);
    razorGroup.add(scale1Mesh);

    const scale2Mesh = new THREE.Mesh(scale1Geom, darkEbonyMaterial);
    scale2Mesh.position.set(0, 0, -0.05);
    razorGroup.add(scale2Mesh);

    const pinGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12);
    const pinMesh = new THREE.Mesh(pinGeom, champagneMaterial);
    pinMesh.rotation.x = Math.PI / 2;
    pinMesh.position.set(0, 1.35, 0);
    razorGroup.add(pinMesh);

    const razorBladeGroup = new THREE.Group();
    razorBladeGroup.position.set(0, 1.35, 0);

    const bladeSliceGeom = new THREE.BoxGeometry(0.05, 2.4, 0.45);
    const bladeSliceMesh = new THREE.Mesh(bladeSliceGeom, steelMaterial);
    bladeSliceMesh.position.set(0, 1.2, 0.15);
    bladeSliceMesh.rotation.y = 0.1;
    razorBladeGroup.add(bladeSliceMesh);

    const razorTangGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.7, 12);
    const razorTangMesh = new THREE.Mesh(razorTangGeom, steelMaterial);
    razorTangMesh.position.set(0, -0.3, 0);
    razorBladeGroup.add(razorTangMesh);

    razorBladeGroup.rotation.z = -1.8;
    razorGroup.add(razorBladeGroup);

    // 8. Build Fine Precision Barber Styling Comb
    const combGroup = new THREE.Group();
    const combSpineGeom = new THREE.BoxGeometry(0.12, 3.2, 0.22);
    const combSpineMesh = new THREE.Mesh(combSpineGeom, champagneMaterial);
    combGroup.add(combSpineMesh);

    const toothGeom = new THREE.BoxGeometry(0.05, 0.05, 0.65);
    for (let i = 0; i < 28; i++) {
      const toothMesh = new THREE.Mesh(toothGeom, goldMaterial);
      toothMesh.position.set(0, -1.35 + i * 0.1, 0.42);
      combGroup.add(toothMesh);
    }

    // 9. Background Luxury Beveled Mirror Ring
    const mirrorGroup = new THREE.Group();
    const mirrorRimGeom = new THREE.TorusGeometry(3.6, 0.06, 16, 64);
    const mirrorRimMesh = new THREE.Mesh(mirrorRimGeom, champagneMaterial);
    mirrorGroup.add(mirrorRimMesh);

    const mirrorBackingGeom = new THREE.CircleGeometry(3.55, 48);
    const mirrorBackingMesh = new THREE.Mesh(mirrorBackingGeom, darkMirrorMaterial);
    mirrorGroup.add(mirrorBackingMesh);

    mirrorGroup.position.set(0, 0, -2.8);
    scene.add(mirrorGroup);

    // 10. Floating Golden Embers Particle Field
    const particleCount = isMobile ? 120 : 220;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: '#E8C982',
      size: 0.055,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMaterial);
    scene.add(particleSystem);

    // Add elements into master world group
    const worldGroup = new THREE.Group();
    worldGroup.add(chairGroup);
    worldGroup.add(shearsGroup);
    worldGroup.add(razorGroup);
    worldGroup.add(combGroup);
    scene.add(worldGroup);

    // Initial peripheral staging for tools in Hero mode
    shearsGroup.position.set(isMobile ? 1.4 : -2.6, 0.5, -1.2);
    shearsGroup.rotation.set(0.3, 0.4, -0.2);

    razorGroup.position.set(isMobile ? -1.5 : 3.2, 0.1, -1.4);
    razorGroup.rotation.set(0.4, -0.5, 0.4);

    combGroup.position.set(isMobile ? -1.8 : -3.2, -0.8, -1.6);
    combGroup.rotation.set(-0.2, 0.5, -0.4);

    // 11. Scroll & Mouse Tracking
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

    // 12. Animation Loop with Smooth Choreography
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth lerp for scroll and mouse
      currentScroll += (targetScroll - currentScroll) * 0.065;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      const p = currentScroll; // 0.0 to 1.0

      // Shears Scissor Articulation (gentle pulse)
      const scissorSnip = Math.sin(elapsed * 2.2 + p * 10) * 0.14 + 0.1;
      bladeAGroup.rotation.z = -scissorSnip;
      bladeBGroup.rotation.z = scissorSnip;

      // Dynamic Camera & Scene Motion Choreography across 5 Sections
      if (!prefersReducedMotion) {
        if (p < 0.22) {
          // --- SECTION 1: CINEMATIC LUXURY HERO (0.0 to 0.22) ---
          const t = p / 0.22;

          // Barber chair stands commandingly in the hero
          const baseChairX = isMobile ? 0 : 1.7;
          const baseChairY = isMobile ? -0.45 : -0.65;
          chairGroup.position.set(baseChairX, baseChairY, 0.3 - t * 0.8);
          chairGroup.rotation.set(
            0.08 - currentMouseY * 0.08,
            (isMobile ? -0.32 : -0.54) + currentMouseX * 0.18,
            0
          );

          // Subtle breathing floating motion for peripheral station tools
          shearsGroup.position.set(isMobile ? 1.4 : -2.6, 0.5 + Math.sin(elapsed * 0.8) * 0.08, -1.2);
          shearsGroup.rotation.set(0.3, 0.4 + currentMouseX * 0.1, -0.2);

          razorGroup.position.set(isMobile ? -1.5 : 3.2, 0.1 + Math.cos(elapsed * 0.7) * 0.08, -1.4);
          combGroup.position.set(isMobile ? -1.8 : -3.2, -0.8 + Math.sin(elapsed * 0.6) * 0.06, -1.6);

          // Camera gentle parallax
          camera.position.set(currentMouseX * 0.35, 0.4 + currentMouseY * 0.2, (isMobile ? 8.6 : 8.0) - t * 0.5);
          camera.lookAt(isMobile ? 0 : 0.6, 0.1, 0);
        } else if (p < 0.5) {
          // --- SECTION 2: SALON EXPERIENCE (0.22 to 0.5) ---
          const t = (p - 0.22) / 0.28;

          // Chair gracefully dollies back & right into ambient suite setting
          chairGroup.position.set(1.7 + t * 0.8, -0.65 - t * 0.8, -0.5 - t * 1.5);
          chairGroup.rotation.set(0.1, -0.54 - t * 0.4, 0);

          // Shears and razor slide into view for the craftsmanship narrative
          shearsGroup.position.set(1.4 + t * 0.4, 0.2 - t * 0.2, 0.1);
          shearsGroup.rotation.set(0.4 + t * 0.3, -0.5 - t * 0.4, -0.2);

          razorGroup.position.set(1.8 + t * 0.3, -1.0, 0.4);
          combGroup.position.set(1.1, 1.2 - t * 0.4, -0.2);

          camera.position.set(0.5, 0.1, 7.5 - t * 0.4);
          camera.lookAt(0.7, 0, 0);
        } else if (p < 0.72) {
          // --- SECTION 3: CURATED SERVICES FLAT-LAY (0.5 to 0.72) ---
          const t = (p - 0.5) / 0.22;

          // Chair recedes into soft backdrop
          chairGroup.position.set(0, -2.6, -3.8);

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
          // --- SECTION 4: MEET MASTER BARBER ISHA (0.72 to 0.88) ---
          const t = (p - 0.72) / 0.16;

          chairGroup.position.set(-2.4, -1.8, -3.2);

          // Macro zoom on the precision shears with gold spotlight
          shearsGroup.position.set(0, 0.3, 1.6 + t * 0.4);
          shearsGroup.rotation.set(0.1, Math.sin(elapsed) * 0.15, -0.15);

          razorGroup.position.set(-2.8, -1.0, -1.2);
          combGroup.position.set(2.8, -1.0, -1.2);

          camera.position.set(0, 0.2, 6.2);
          camera.lookAt(0, 0.3, 1.6);
        } else {
          // --- SECTION 5: LIVE QUEUE & CLOSING CTA CREST (0.88 to 1.0) ---
          chairGroup.position.set(0, -1.2, -1.6);
          chairGroup.rotation.set(0.1, 0, 0);

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

    // 13. Cleanup on Unmount
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
