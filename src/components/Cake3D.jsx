import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Cake3D() {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let width = container.clientWidth || window.innerWidth / 2;
    let height = container.clientHeight || window.innerHeight * 0.9;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, 6.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xfff5ea, 0.8);
    dirLight2.position.set(-5, 5, -3);
    scene.add(dirLight2);

    const cakeGroup = new THREE.Group();
    if (window.innerWidth > 992) {
      cakeGroup.position.x = -1.5;
    }
    scene.add(cakeGroup);

    const plateGeo = new THREE.CylinderGeometry(2.1, 2.2, 0.06, 64);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.2,
      metalness: 0.4,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -1.1;
    cakeGroup.add(plate);

    const cakeBodyGeo = new THREE.CylinderGeometry(1.7, 1.7, 1.4, 64);
    const cakeBodyMat = new THREE.MeshStandardMaterial({
      color: 0xff6b8b,
      roughness: 0.4,
      metalness: 0.05,
    });
    const cakeBody = new THREE.Mesh(cakeBodyGeo, cakeBodyMat);
    cakeBody.position.y = -0.3;
    cakeGroup.add(cakeBody);

    const creamLayerGeo = new THREE.CylinderGeometry(1.71, 1.71, 0.15, 64);
    const creamLayerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    const creamLayer = new THREE.Mesh(creamLayerGeo, creamLayerMat);
    creamLayer.position.y = -0.3;
    cakeGroup.add(creamLayer);

    const swirlCount = 32;
    const swirlGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const swirlMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });

    for (let i = 0; i < swirlCount; i += 1) {
      const angle = (i / swirlCount) * Math.PI * 2;

      const topSwirl = new THREE.Mesh(swirlGeo, swirlMat);
      topSwirl.position.set(
        Math.cos(angle) * 1.68,
        0.42,
        Math.sin(angle) * 1.68
      );
      cakeGroup.add(topSwirl);

      const bottomSwirl = new THREE.Mesh(swirlGeo, swirlMat);
      bottomSwirl.position.set(
        Math.cos(angle) * 1.72,
        -1,
        Math.sin(angle) * 1.72
      );
      cakeGroup.add(bottomSwirl);
    }

    const strawberryCount = 10;
    const strawMat = new THREE.MeshStandardMaterial({
      color: 0xd61c4e,
      roughness: 0.3,
      metalness: 0.1,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4e9f3d,
      roughness: 0.5,
    });

    for (let k = 0; k < strawberryCount; k += 1) {
      const angle = (k / strawberryCount) * Math.PI * 2;
      const strawberryGroup = new THREE.Group();

      const strawGeo = new THREE.ConeGeometry(0.12, 0.22, 16);
      const strawMesh = new THREE.Mesh(strawGeo, strawMat);
      strawMesh.rotation.x = Math.PI;
      strawberryGroup.add(strawMesh);

      const leafGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.y = 0.12;
      strawberryGroup.add(leafMesh);

      const radius = 1.2;
      strawberryGroup.position.set(
        Math.cos(angle) * radius,
        0.52,
        Math.sin(angle) * radius
      );
      strawberryGroup.rotation.y = -angle;

      cakeGroup.add(strawberryGroup);
    }

    const centerStraw = new THREE.Group();
    const bigStrawGeo = new THREE.ConeGeometry(0.16, 0.28, 16);
    const bigStrawMesh = new THREE.Mesh(bigStrawGeo, strawMat);
    bigStrawMesh.rotation.x = Math.PI;
    centerStraw.add(bigStrawMesh);

    const centerLeaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      leafMat
    );
    centerLeaf.position.y = 0.15;
    centerStraw.add(centerLeaf);

    centerStraw.position.set(0, 0.55, 0);
    cakeGroup.add(centerStraw);

    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 150;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 12;
      posArray[i + 1] = (Math.random() - 0.5) * 8;
      posArray[i + 2] = (Math.random() - 0.8) * 5;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0xd4af37,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };
      cakeGroup.rotation.y += deltaMove.x * 0.006;
      cakeGroup.rotation.x += deltaMove.y * 0.006;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);

    let animationFrame = 0;

    function animate() {
      animationFrame = requestAnimationFrame(animate);

      if (
        renderer.domElement.clientWidth !== container.clientWidth ||
        renderer.domElement.clientHeight !== container.clientHeight
      ) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w && h) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }

      if (!isDragging) {
        cakeGroup.rotation.y += 0.004;
      }

      const positions = particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.003;
        if (positions[i] < -4) positions[i] = 4;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0008;

      renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;

      camera.aspect = w / h;
      cakeGroup.position.x = window.innerWidth > 992 ? -1.5 : 0;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      cameraRef.current = null;
    };
  }, []);

  const handleZoom = (amount) => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.z -= amount;
    if (camera.position.z < 3) camera.position.z = 3;
    if (camera.position.z > 12) camera.position.z = 12;
  };

  const handleFullscreen = () => {
    const element = containerRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((error) => {
        alert(`Error trying to enable fullscreen mode: ${error.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div id="cake-3d-container" ref={containerRef}>
      <div className="view-controls">
        <button type="button" onClick={handleFullscreen} title="Full Screen">
          📺 Fullscreen
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          title="Zoom In"
        >
          ➕ Zoom In
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          title="Zoom Out"
        >
          ➖ Zoom Out
        </button>
      </div>
    </div>
  );
}
