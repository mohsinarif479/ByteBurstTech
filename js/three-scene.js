const canvas = document.getElementById('hero3dCanvas');

if (canvas) {
  import('https://unpkg.com/three@0.164.1/build/three.module.js')
    .then((THREE) => {
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0.4, 7);

      const group = new THREE.Group();
      scene.add(group);

      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        emissive: 0x0f766e,
        emissiveIntensity: 0.35,
        metalness: 0.72,
        roughness: 0.22,
      });
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x60a5fa,
        metalness: 0.35,
        roughness: 0.1,
        transmission: 0.25,
        transparent: true,
        opacity: 0.58,
      });
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0xbdfcff,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
      });
      const darkPanelMaterial = new THREE.MeshStandardMaterial({
        color: 0x10243a,
        emissive: 0x07111f,
        emissiveIntensity: 0.3,
        metalness: 0.55,
        roughness: 0.32,
      });
      const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0xf973b7,
        emissive: 0x7c1d4b,
        emissiveIntensity: 0.36,
        metalness: 0.35,
        roughness: 0.28,
      });

      function createTextTexture(label, caption, color = '#2dd4bf') {
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 512;
        textureCanvas.height = 512;
        const context = textureCanvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, 'rgba(255,255,255,0.18)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.035)');
        context.fillStyle = 'rgba(7, 17, 31, 0.88)';
        context.fillRect(0, 0, 512, 512);
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        context.strokeStyle = color;
        context.lineWidth = 10;
        context.strokeRect(22, 22, 468, 468);
        context.fillStyle = color;
        context.font = '900 132px Inter, Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, 256, 215);
        context.fillStyle = 'rgba(247, 251, 255, 0.86)';
        context.font = '800 42px Inter, Arial, sans-serif';
        context.fillText(caption, 256, 335);
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      function createIconCard(label, caption, color) {
        const card = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.08),
          new THREE.MeshPhysicalMaterial({
            map: createTextTexture(label, caption, color),
            metalness: 0.25,
            roughness: 0.18,
            transparent: true,
            opacity: 0.9,
          })
        );
        return card;
      }

      function createServerRack() {
        const rack = new THREE.Group();
        for (let index = 0; index < 4; index += 1) {
          const unit = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.26, 0.46), darkPanelMaterial);
          unit.position.y = index * 0.32;
          rack.add(unit);

          const light = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), coreMaterial);
          light.position.set(-0.42, index * 0.32, 0.245);
          rack.add(light);

          const line = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.02), glassMaterial);
          line.position.set(0.18, index * 0.32, 0.25);
          rack.add(line);
        }
        rack.position.set(-3.0, 1.25, -0.25);
        rack.rotation.y = 0.36;
        rack.rotation.z = -0.08;
        return rack;
      }

      function createDatabaseModel() {
        const db = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.78, 42), glassMaterial);
        const top = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 10, 42), coreMaterial);
        const bottom = top.clone();
        top.position.y = 0.39;
        bottom.position.y = -0.39;
        db.add(body, top, bottom);
        db.position.set(3.0, -1.15, 0.25);
        db.rotation.z = 0.16;
        return db;
      }

      function createCloudNodes() {
        const cloud = new THREE.Group();
        const positions = [
          [-0.24, 0, 0],
          [0.08, 0.08, 0],
          [0.36, 0, 0],
          [0.04, -0.12, 0],
        ];
        positions.forEach(([x, y, z], index) => {
          const node = new THREE.Mesh(new THREE.SphereGeometry(index === 1 ? 0.25 : 0.2, 20, 20), glassMaterial);
          node.position.set(x, y, z);
          cloud.add(node);
        });
        cloud.position.set(-2.75, -1.45, 0.1);
        cloud.rotation.y = -0.26;
        return cloud;
      }

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), coreMaterial);
      const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.85, 1), wireMaterial);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.025, 16, 160), glassMaterial);
      const satelliteOne = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), glassMaterial);
      const satelliteTwo = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), coreMaterial);
      const floatingBoxOne = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), accentMaterial);
      const floatingBoxTwo = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), coreMaterial);
      const serverRack = createServerRack();
      const databaseModel = createDatabaseModel();
      const cloudNodes = createCloudNodes();
      const iconCards = [
        createIconCard('SRV', 'SERVER', '#2dd4bf'),
        createIconCard('DB', 'DATA', '#60a5fa'),
        createIconCard('API', 'ROUTES', '#f973b7'),
        createIconCard('</>', 'CODE', '#a78bfa'),
      ];

      satelliteOne.position.set(2.55, 0.55, -0.2);
      satelliteTwo.position.set(-2.35, -0.85, 0.35);
      floatingBoxOne.position.set(-1.85, 1.65, 0.78);
      floatingBoxTwo.position.set(1.78, -1.72, 0.62);
      halo.rotation.x = Math.PI / 2.65;
      iconCards[0].position.set(-2.15, 0.36, 1.05);
      iconCards[1].position.set(2.12, 1.55, 0.72);
      iconCards[2].position.set(2.72, -0.05, 0.35);
      iconCards[3].position.set(-1.1, -1.76, 0.75);
      iconCards.forEach((card, index) => {
        card.rotation.y = index % 2 === 0 ? 0.34 : -0.42;
        card.rotation.x = index % 2 === 0 ? -0.08 : 0.08;
        card.userData.baseY = card.position.y;
      });

      group.add(
        core,
        shell,
        halo,
        satelliteOne,
        satelliteTwo,
        floatingBoxOne,
        floatingBoxTwo,
        serverRack,
        databaseModel,
        cloudNodes,
        ...iconCards
      );

      const pointLight = new THREE.PointLight(0x2dd4bf, 30, 18);
      pointLight.position.set(2.5, 3, 4);
      scene.add(pointLight);
      scene.add(new THREE.AmbientLight(0xffffff, 1.4));

      const particles = new THREE.BufferGeometry();
      const particleCount = 120;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < positions.length; index += 3) {
        positions[index] = (Math.random() - 0.5) * 7;
        positions[index + 1] = (Math.random() - 0.5) * 5;
        positions[index + 2] = (Math.random() - 0.5) * 4;
      }
      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      scene.add(new THREE.Points(
        particles,
        new THREE.PointsMaterial({
          color: 0x8bd8ff,
          size: 0.025,
          transparent: true,
          opacity: 0.74,
        })
      ));

      function resize() {
        const { width, height } = canvas.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function animate(time) {
        const seconds = time * 0.001;
        core.rotation.x = seconds * 0.38;
        core.rotation.y = seconds * 0.52;
        shell.rotation.y = -seconds * 0.28;
        halo.rotation.z = seconds * 0.22;
        satelliteOne.rotation.x = seconds * 0.8;
        satelliteOne.rotation.y = seconds * 0.65;
        satelliteTwo.rotation.y = -seconds * 0.72;
        floatingBoxOne.rotation.x = seconds * 0.9;
        floatingBoxOne.rotation.y = seconds * 0.7;
        floatingBoxTwo.rotation.y = -seconds * 0.85;
        floatingBoxTwo.rotation.z = seconds * 0.42;
        serverRack.position.y = 1.25 + Math.sin(seconds * 1.1) * 0.12;
        databaseModel.position.y = -1.15 + Math.cos(seconds * 1.35) * 0.12;
        databaseModel.rotation.y = seconds * 0.28;
        cloudNodes.position.y = -1.45 + Math.sin(seconds * 1.55) * 0.08;
        cloudNodes.rotation.y = -0.26 + Math.sin(seconds * 0.8) * 0.12;
        iconCards.forEach((card, index) => {
          card.position.y = card.userData.baseY + Math.sin(seconds * 1.35 + index) * 0.12;
          card.rotation.z = Math.sin(seconds * 0.9 + index) * 0.05;
        });
        group.position.y = Math.sin(seconds * 1.2) * 0.12;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      resize();
      window.addEventListener('resize', resize);
      canvas.closest('.hero-visual')?.classList.add('is-loaded');
      requestAnimationFrame(animate);
    })
    .catch(() => {
      canvas.closest('.hero-visual')?.classList.add('has-fallback');
    });
}
