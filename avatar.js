// ===== 3D GUIDE: a small AI robot =====
// Pops up at the bottom-right each time a new section reaches the middle of the
// screen, waves, makes a happy face and shows the section's name.
// Click it to turn its voice on/off (off by default).
(function () {
  const wrap = document.getElementById('guide');
  const bubbleText = document.getElementById('guideText');
  if (!wrap || typeof THREE === 'undefined') { if (wrap) wrap.remove(); return; }

  const NAMES = {
    about: 'About me',
    stack: 'My stack',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    competitions: 'Activities',
    certs: 'Certificates',
    contact: 'Say hi!',
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- renderer / scene ----------
  const canvas = document.getElementById('guideCanvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { wrap.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.05, 5.2);
  camera.lookAt(0, 0.95, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x203a2c, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fe3a6, 1.2);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xe08aa6, 0.5);
  rim2.position.set(3, 1, -2);
  scene.add(rim2);

  const std = (color, rough = 0.35, metal = 0.05) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const glow = color => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const SHELL = std(0xf3f5f4, 0.3);
  const TRIM = std(0xb9c4be, 0.4, 0.3);
  const DARK = std(0x16201b, 0.5, 0.2);
  const WINE = std(0x5e1228, 0.4, 0.1);
  const EMERALD = glow(0x2fd486);

  const bot = new THREE.Group();
  scene.add(bot);
  const floatGroup = new THREE.Group();   // everything that bobs
  bot.add(floatGroup);

  // ---------- body ----------
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 32), SHELL);
  body.scale.set(1, 1.05, 0.9);
  body.position.y = 0.55;
  floatGroup.add(body);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.022, 12, 64), TRIM);
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.42; belt.scale.set(1, 0.9, 1);
  floatGroup.add(belt);

  // chest core (pulses)
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 16, 48), TRIM);
  coreRing.position.set(0, 0.64, 0.355);
  floatGroup.add(coreRing);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x2fd486, toneMapped: false });
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), coreMat);
  core.position.set(0, 0.64, 0.36);
  floatGroup.add(core);

  // hover ring underneath + soft shadow
  const hover = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 12, 48), EMERALD);
  hover.rotation.x = Math.PI / 2; hover.position.y = 0.1;
  floatGroup.add(hover);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.28;
  bot.add(shadow);

  // ---------- head ----------
  const head = new THREE.Group();
  head.position.y = 1.42;
  floatGroup.add(head);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 24), DARK);
  neck.position.y = 1.0;
  floatGroup.add(neck);

  const skull = new THREE.Group();
  skull.scale.set(1.25, 0.95, 1.0);
  head.add(skull);
  skull.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), SHELL));

  // face screen: a patch of a slightly larger sphere, textured with a live canvas
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256; faceCanvas.height = 160;
  const fctx = faceCanvas.getContext('2d');
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.encoding = THREE.sRGBEncoding;
  const PHI = 1.55, THETA = 1.05;
  const screen = new THREE.Mesh(
    new THREE.SphereGeometry(0.508, 48, 32, Math.PI / 2 - PHI / 2, PHI, Math.PI / 2 - THETA / 2, THETA),
    new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false })
  );
  skull.add(screen);
  const bezel = new THREE.Mesh(
    new THREE.SphereGeometry(0.504, 48, 32, Math.PI / 2 - PHI / 2 - 0.08, PHI + 0.16, Math.PI / 2 - THETA / 2 - 0.08, THETA + 0.16),
    DARK
  );
  skull.add(bezel);

  // ears (headphone-like) with a burgundy cap and a glowing ring
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 32), WINE);
    ear.rotation.z = Math.PI / 2; ear.position.set(0.63 * side, 0, 0);
    head.add(ear);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 12, 32), EMERALD);
    ring.rotation.y = Math.PI / 2; ring.position.set(0.695 * side, 0, 0);
    head.add(ring);
  });

  // antenna with a springy, glowing tip
  const antenna = new THREE.Group();
  antenna.position.y = 0.46;
  head.add(antenna);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.24, 12), TRIM);
  stem.position.y = 0.12;
  antenna.add(stem);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0x2fd486, toneMapped: false });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), tipMat);
  tip.position.y = 0.27;
  antenna.add(tip);

  // ---------- arms (floating, cartoon style) ----------
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.5 * side, 0.8, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.3, 16), TRIM);
    arm.position.y = -0.17;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), SHELL);
    hand.position.y = -0.36;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 10, 24), EMERALD);
    cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.29;
    pivot.add(arm, hand, cuff);
    pivot.rotation.z = 0.28 * side;
    floatGroup.add(pivot);
    return pivot;
  }
  const armWave = makeArm(-1);   // the arm on the page side
  const armOther = makeArm(1);

  // ---------- orbiting "neural" nodes ----------
  const orbit = new THREE.Group();
  orbit.position.y = 0.95;
  floatGroup.add(orbit);
  const nodes = [];
  for (let i = 0; i < 3; i++) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0xc0476e : 0x2fd486, toneMapped: false }));
    orbit.add(n); nodes.push(n);
  }
  const links = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0x2fd486, transparent: true, opacity: 0.4, toneMapped: false })
  );
  orbit.add(links);

  // ---------- face drawing ----------
  let mood = 'idle';          // idle | happy
  let talkUntil = 0, blinkAt = performance.now() + 2500, lookX = 0, lookY = 0;
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    fctx.beginPath();
    fctx.moveTo(x + r, y); fctx.arcTo(x + w, y, x + w, y + h, r); fctx.arcTo(x + w, y + h, x, y + h, r);
    fctx.arcTo(x, y + h, x, y, r); fctx.arcTo(x, y, x + w, y, r); fctx.closePath(); fctx.fill();
  }
  function drawFace(now) {
    const W = 256, H = 160;
    const g = fctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c2418'); g.addColorStop(1, '#050d09');
    fctx.shadowBlur = 0;
    fctx.fillStyle = g; fctx.fillRect(0, 0, W, H);
    fctx.fillStyle = 'rgba(95,224,160,0.05)';        // faint scanlines
    for (let y = 0; y < H; y += 6) fctx.fillRect(0, y, W, 2);

    fctx.shadowColor = '#5fe0a0'; fctx.shadowBlur = 14;
    fctx.fillStyle = '#7ff0b6'; fctx.strokeStyle = '#7ff0b6';
    const ex = lookX * 10, ey = lookY * 6;
    const blinking = now > blinkAt && now < blinkAt + 120;
    if (now > blinkAt + 120) blinkAt = now + 2200 + Math.random() * 2600;
    [-1, 1].forEach(s => {
      const cx = W / 2 + s * 52 + ex, cy = 70 + ey;
      if (mood === 'happy') {
        fctx.lineWidth = 9; fctx.lineCap = 'round';
        fctx.beginPath(); fctx.arc(cx, cy + 8, 17, Math.PI * 1.15, Math.PI * 1.85); fctx.stroke();
      } else {
        const h = blinking ? 5 : 40;
        roundRect(cx - 14, cy - h / 2, 28, h, 13);
      }
    });
    if (now < talkUntil) {                             // talking mouth
      const o = 6 + Math.abs(Math.sin(now / 70)) * 12;
      roundRect(W / 2 - 14 + ex * 0.6, 112 + ey - o / 2, 28, o, 7);
    } else {                                           // smile
      fctx.lineWidth = 6; fctx.lineCap = 'round';
      fctx.beginPath(); fctx.arc(W / 2 + ex * 0.6, 100 + ey, 16, Math.PI * 0.2, Math.PI * 0.8); fctx.stroke();
    }
    fctx.shadowBlur = 0;                               // cheeks
    fctx.fillStyle = 'rgba(224,138,166,0.35)';
    [-1, 1].forEach(s => { fctx.beginPath(); fctx.ellipse(W / 2 + s * 86 + ex, 104 + ey, 13, 7, 0, 0, Math.PI * 2); fctx.fill(); });
    faceTex.needsUpdate = true;
  }

  // ---------- sizing ----------
  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // ---------- mouse look ----------
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ---------- voice (opt-in) ----------
  let voiceOn = false, voice = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voice = vs.find(v => /en/i.test(v.lang) && /female|zira|aria|jenny|samantha|susan|hazel|libby|sonia/i.test(v.name))
      || vs.find(v => /en/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace('!', ''));
    if (voice) u.voice = voice;
    u.pitch = 1.35; u.rate = 1.05; u.volume = 0.9;
    speechSynthesis.speak(u);
  }
  wrap.addEventListener('click', () => {
    voiceOn = !voiceOn;
    wrap.classList.toggle('voice-on', voiceOn);
    if (voiceOn) speak(bubbleText.textContent || 'Hi');
    else if (window.speechSynthesis) speechSynthesis.cancel();
    show(current || 'about', true);
  });

  // ---------- show / hide ----------
  let running = false, hideTimer = null, current = null;
  let waveUntil = 0, happyUntil = 0, popAt = 0;

  function show(id, keep) {
    const name = NAMES[id];
    if (!name) return;
    bubbleText.textContent = name;
    resize();
    wrap.classList.add('show');
    const now = performance.now();
    popAt = now;
    waveUntil = reduceMotion ? 0 : now + 1900;
    happyUntil = now + 2200;
    talkUntil = now + 1000;
    speak(name);
    start();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, keep ? 4800 : 3600);
  }
  function hide() {
    wrap.classList.remove('show');
    setTimeout(() => { if (!wrap.classList.contains('show')) running = false; }, 800);
  }

  // ---------- loop ----------
  let last = 0, antV = 0, prevY = 0;
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!running || document.hidden) { running = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const t = now / 1000, calm = reduceMotion ? 0 : 1;

    // float + a small squash-and-stretch when it pops in
    const y = Math.sin(t * 2.1) * 0.06 * calm;
    floatGroup.position.y = y;
    const p = Math.min(1, (now - popAt) / 600);
    const s = p < 1 ? 1 + Math.sin(p * Math.PI) * 0.08 * calm : 1;
    floatGroup.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
    shadow.scale.setScalar(1 - y * 1.2);
    shadow.material.opacity = 0.2 - y * 0.6;

    // body and head follow the cursor smoothly
    lookX += (mx - lookX) * 0.08; lookY += (my - lookY) * 0.08;
    bot.rotation.y = -0.25 + lookX * 0.25;
    head.rotation.y = lookX * 0.35;
    head.rotation.x = lookY * 0.15;
    head.rotation.z = Math.sin(t * 1.3) * 0.04 * calm + (now < happyUntil ? Math.sin(t * 5) * 0.06 * calm : 0);

    // arms: wave with the page-side arm, gentle sway otherwise
    const wTarget = now < waveUntil ? -2.5 + Math.sin(t * 13) * 0.35 : -0.28 + Math.sin(t * 1.8) * 0.05 * calm;
    armWave.rotation.z += (wTarget - armWave.rotation.z) * Math.min(1, dt * 9);
    armOther.rotation.z += (0.28 - Math.sin(t * 1.8) * 0.05 * calm - armOther.rotation.z) * Math.min(1, dt * 6);

    // springy antenna: reacts to bobbing and head tilt
    const vel = (y - prevY) / Math.max(dt, 0.001); prevY = y;
    const force = (-vel * 0.12 - head.rotation.z * 0.6) - antenna.rotation.z;
    antV += force * 60 * dt; antV *= Math.pow(0.02, dt);
    antenna.rotation.z += antV * dt;
    tipMat.color.setHSL(0.42, 0.65, 0.48 + Math.sin(t * 4) * 0.12);

    // chest core pulse and orbiting nodes
    coreMat.color.setHSL(0.42, 0.7, 0.42 + Math.sin(t * 3) * 0.12);
    const lp = links.geometry.attributes.position;
    nodes.forEach((n, i) => {
      const a = t * 0.8 + i * (Math.PI * 2 / 3);
      n.position.set(Math.cos(a) * 0.95, Math.sin(a * 1.3) * 0.18, Math.sin(a) * 0.45);
      lp.setXYZ(i, n.position.x, n.position.y, n.position.z);
    });
    lp.setXYZ(3, nodes[0].position.x, nodes[0].position.y, nodes[0].position.z);
    lp.needsUpdate = true;

    mood = now < happyUntil ? 'happy' : 'idle';
    drawFace(now);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && wrap.classList.contains('show')) start(); });

  // ---------- section watcher ----------
  let pending = null;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      if (id === current) return;
      clearTimeout(pending);
      pending = setTimeout(() => {
        current = id;
        if (NAMES[id]) show(id); else hide();
      }, 280);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));

  resize();
  drawFace(performance.now());
  renderer.render(scene, camera);
})();
