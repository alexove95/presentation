(() => {
  const chapters = [...document.querySelectorAll(".chapter")];
  const links = [...document.querySelectorAll(".chapter-dock a")];
  let frame = 0;

  const updateActiveChapter = () => {
    frame = 0;
    const center = window.innerHeight / 2;
    let activeIndex = 0;
    let nearestDistance = Infinity;

    chapters.forEach((chapter, index) => {
      const chapterCenter = chapter.getBoundingClientRect().top + chapter.offsetHeight / 2;
      const distance = Math.abs(chapterCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        activeIndex = index;
      }
    });

    links.forEach((link, index) => {
      if (index === activeIndex) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  };

  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateActiveChapter);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  updateActiveChapter();
})();

(() => {
  const canvas = document.querySelector("#showcase");
  const sections = [...document.querySelectorAll(".chapter")];
  if (!canvas || !window.THREE || sections.length !== 4) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
  const orbitRadius = 6.8;
  const object = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.22, 0.36, 220, 32, 2, 3),
    new THREE.MeshPhysicalMaterial({
      color: "#d8dce5",
      metalness: 1,
      roughness: 0.19,
      clearcoat: 0.8,
      clearcoatRoughness: 0.14
    })
  );
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);

  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: "#8c9bc4",
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const ringSpecs = [
    { radius: 2.2, tube: 0.009, rotation: [0.35, 0.1, 0.12] },
    { radius: 2.65, tube: 0.006, rotation: [1.05, 0.4, -0.55] },
    { radius: 2.95, tube: 0.005, rotation: [0.6, -0.9, 0.8] }
  ];

  ringSpecs.forEach(({ radius, tube, rotation }) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 160),
      ringMaterial
    );
    ring.rotation.set(...rotation);
    orbitGroup.add(ring);
  });

  const nodeGeometry = new THREE.SphereGeometry(0.055, 12, 10);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: "#b9cbff",
    emissive: "#5269b5",
    emissiveIntensity: 1.4,
    metalness: 0.35,
    roughness: 0.28
  });
  const nodeCount = 24;
  const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
  const nodeData = [];
  const dummy = new THREE.Object3D();

  for (let index = 0; index < nodeCount; index += 1) {
    const orbitIndex = index % ringSpecs.length;
    const phase = (index / nodeCount) * Math.PI * 2;
    const { radius } = ringSpecs[orbitIndex];
    nodeData.push({ orbitIndex, phase, radius });
    dummy.position.set(Math.cos(phase) * radius, 0, Math.sin(phase) * radius);
    dummy.scale.setScalar(index % 6 === 0 ? 1.45 : 1);
    dummy.updateMatrix();
    nodes.setMatrixAt(index, dummy.matrix);
  }
  orbitGroup.add(nodes);

  const moduleGeometry = new THREE.BoxGeometry(0.19, 0.19, 0.19);
  const moduleMaterial = new THREE.MeshStandardMaterial({
    color: "#7183b2",
    emissive: "#17264f",
    emissiveIntensity: 0.65,
    metalness: 0.7,
    roughness: 0.3,
    wireframe: true
  });
  const moduleCount = 9;
  const modules = new THREE.InstancedMesh(moduleGeometry, moduleMaterial, moduleCount);
  const moduleData = [];

  for (let index = 0; index < moduleCount; index += 1) {
    const angle = (index / moduleCount) * Math.PI * 2;
    const radius = 2.15 + (index % 3) * 0.24;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(index * 1.7) * 1.45,
      Math.sin(angle) * radius
    );
    moduleData.push({ position, phase: index * 0.83, radius });
    dummy.position.copy(position);
    dummy.rotation.set(angle * 0.6, angle, angle * 0.3);
    dummy.updateMatrix();
    modules.setMatrixAt(index, dummy.matrix);
  }
  orbitGroup.add(modules);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ color: "#030407", opacity: 0.4 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.35;
  ground.receiveShadow = true;
  scene.add(ground);

  const ambient = new THREE.HemisphereLight("#aab9e8", "#111015", 1.35);
  scene.add(ambient);

  const blueLight = new THREE.SpotLight("#426dff", 115, 24, Math.PI / 5, 0.55, 1.2);
  blueLight.position.set(-4.5, 5, 2);
  blueLight.castShadow = true;
  blueLight.shadow.mapSize.set(1024, 1024);
  blueLight.shadow.bias = -0.0001;
  scene.add(blueLight, blueLight.target);

  const warmLight = new THREE.SpotLight("#ff8658", 145, 24, Math.PI / 4.5, 0.6, 1.1);
  warmLight.position.set(4, 3.5, -3);
  warmLight.castShadow = true;
  warmLight.shadow.mapSize.set(1024, 1024);
  warmLight.shadow.bias = -0.0001;
  scene.add(warmLight, warmLight.target);

  const materials = ["#d8dce5", "#315fe0", "#108451", "#b76337"].map(color => new THREE.Color(color));
  const targetColor = materials[0].clone();
  const currentColor = materials[0].clone();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const orbit = { current: 0, target: 0 };
  let scrollFrame = 0;
  let previousTime = 0;

  const updateScrollTarget = () => {
    scrollFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1) : 0;
    const sectionPosition = progress * (sections.length - 1);
    const sectionIndex = Math.min(Math.floor(sectionPosition), sections.length - 1);
    const sectionMix = sectionPosition - sectionIndex;

    targetColor.copy(materials[sectionIndex]);
    if (sectionIndex < materials.length - 1) {
      targetColor.lerp(materials[sectionIndex + 1], sectionMix);
    }
    orbit.target = progress * Math.PI * 2;
  };

  const requestScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollTarget);
  };
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestScrollUpdate();
  };
  window.addEventListener("resize", resize, { passive: true });
  updateScrollTarget();

  const render = time => {
    requestAnimationFrame(render);
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    const damping = 1 - Math.exp(-3.6 * delta);

    orbit.current = THREE.MathUtils.lerp(orbit.current, orbit.target, damping);
    currentColor.lerp(targetColor, damping);
    object.material.color.copy(currentColor);
    object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, 0.22, damping);
    object.rotation.y += delta * 0.12;
    orbitGroup.rotation.y = reducedMotion.matches ? 0 : time * 0.00008;
    orbitGroup.rotation.x = reducedMotion.matches ? 0 : Math.sin(time * 0.00012) * 0.045;

    nodeData.forEach(({ orbitIndex, phase, radius }, index) => {
      const angle = phase + time * 0.00016 * (orbitIndex % 2 === 0 ? 1 : -1);
      const height = Math.sin(angle * 2 + orbitIndex) * 0.18;
      dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      dummy.scale.setScalar(index % 6 === 0 ? 1.45 : 1);
      dummy.updateMatrix();
      nodes.setMatrixAt(index, dummy.matrix);
    });
    nodes.instanceMatrix.needsUpdate = true;

    moduleData.forEach(({ position, phase }, index) => {
      const motionTime = reducedMotion.matches ? 0 : time;
      const bob = reducedMotion.matches ? 0 : Math.sin(time * 0.001 + phase) * 0.12;
      dummy.position.set(position.x, position.y + bob, position.z);
      dummy.rotation.set(
        phase + motionTime * 0.00012,
        phase * 0.7 + motionTime * 0.00016,
        phase * 0.35
      );
      dummy.scale.setScalar(index % 3 === 0 ? 1.2 : 1);
      dummy.updateMatrix();
      modules.setMatrixAt(index, dummy.matrix);
    });
    modules.instanceMatrix.needsUpdate = true;

    const angle = orbit.current;
    const elevation = 0.25 + Math.sin(angle * 0.5) * 0.18;
    camera.position.set(
      Math.sin(angle) * orbitRadius,
      elevation * orbitRadius,
      Math.cos(angle) * orbitRadius
    );
    camera.lookAt(0, 0, 0);

    if (reducedMotion.matches) {
      object.rotation.y = 0;
      orbit.current = orbit.target = 0;
      currentColor.copy(materials[0]);
      object.material.color.copy(currentColor);
      camera.position.set(0, 1.2, orbitRadius);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  };
  requestAnimationFrame(render);
})();
