// ===== 3D GUIDE AVATAR =====
// A small three.js girl that pops up at the bottom-right each time a new
// section reaches the middle of the screen, waves, and says its name.
// Click her to turn her voice on or off (off by default).
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

  // ---------- scene ----------
  const canvas = document.getElementById('guideCanvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { wrap.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.12, 5.0);
  camera.lookAt(0, 1.02, 0);

  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x30443a, 0.62));
  const rim = new THREE.DirectionalLight(0x9fe0bd, 0.35);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2, 3, 4);
  scene.add(key);

  const mat = (c, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const SKIN = mat(0xe3aa86, 0.6);
  const HIJAB = mat(0x6e1832, 0.85);   // burgundy
  const HIJAB2 = mat(0x7d1f3b, 0.85);
  const TOP = mat(0x24704a, 0.8);     // emerald
  const DARK = mat(0x1b1512);
  const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const CHEEK = new THREE.MeshBasicMaterial({ color: 0xe58a8a, transparent: true, opacity: 0.45 });
  const CAMEL = mat(0xc9a07a, 0.9);
  const SHOE = mat(0x2a1a1c, 0.5);
  const GOLD = new THREE.MeshStandardMaterial({ color: 0xd9b25c, roughness: 0.3, metalness: 0.6 });

  const girl = new THREE.Group();
  scene.add(girl);

  const lathe = (pts, m, phiStart = 0, phiLen = Math.PI * 2) => {
    const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 48, phiStart, phiLen);
    const mesh = new THREE.Mesh(g, m);
    return mesh;
  };

  // long A-line dress (emerald)
  girl.add(lathe([[0.001, 1.02], [0.27, 1.02], [0.33, 0.85], [0.35, 0.62], [0.41, 0.3], [0.49, 0.02], [0.001, 0.02]], TOP));

  // long open duster (camel), open at the front
  const COAT_OPEN = 0.62;
  const coatMat = CAMEL.clone(); coatMat.side = THREE.DoubleSide;
  girl.add(lathe([[0.295, 1.0], [0.36, 0.86], [0.385, 0.62], [0.445, 0.3], [0.53, 0.06]], coatMat, COAT_OPEN, Math.PI * 2 - COAT_OPEN * 2));

  // shoes peeking out
  [-0.13, 0.13].forEach(x => {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), SHOE);
    sh.scale.set(1, 0.55, 1.5);
    sh.position.set(x, 0.03, 0.2);
    girl.add(sh);
  });

  // hijab wrap around neck and shoulders, ending at the chest
  const wrapMat = HIJAB.clone(); wrapMat.side = THREE.DoubleSide;
  const hijabWrap = lathe([[0.2, 1.36], [0.27, 1.24], [0.34, 1.12], [0.39, 0.99], [0.41, 0.9], [0.4, 0.84]], wrapMat);
  girl.add(hijabWrap);
  // one end of the hijab falling over the front shoulder
  const tail = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), HIJAB2);
  tail.scale.set(0.12, 0.3, 0.05);
  tail.position.set(0.15, 0.86, 0.36);
  tail.rotation.z = 0.18;
  girl.add(tail);

  // head group (so it can tilt and follow the cursor)
  const head = new THREE.Group();
  head.position.y = 1.52;
  girl.add(head);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.41, 40, 32), SKIN);
  face.scale.set(1, 1.06, 0.95);
  face.position.z = 0.03;
  head.add(face);

  // hijab: a sphere shell open at the front, plus a crown that covers the forehead
  const OPEN = 1.1; // radians of opening around the face
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 40, 32, Math.PI / 2 + OPEN / 2, Math.PI * 2 - OPEN),
    HIJAB
  );
  shell.material.side = THREE.DoubleSide;
  shell.scale.set(1, 1.08, 1);
  shell.position.z = -0.02;
  head.add(shell);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.485, 40, 16, 0, Math.PI * 2, 0, 0.72), HIJAB2);
  crown.scale.set(1, 1.08, 1);
  crown.position.z = -0.01;
  crown.rotation.x = 0.28;
  head.add(crown);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), GOLD);
  pin.position.set(-0.25, -0.34, 0.3);
  head.add(pin);

  // eyes
  const eyes = [];
  [-0.14, 0.14].forEach(x => {
    const e = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), DARK);
    ball.scale.set(1, 1.15, 0.6);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), WHITE);
    shine.position.set(0.018, 0.022, 0.03);
    e.add(ball, shine);
    e.position.set(x, 0.02, 0.385);
    head.add(e);
    eyes.push(e);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.01), DARK);
    brow.position.set(x, 0.12, 0.39);
    brow.rotation.z = x < 0 ? 0.04 : -0.04;
    head.add(brow);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), CHEEK);
    cheek.position.set(x * 1.65, -0.09, 0.355);
    cheek.rotation.y = x < 0 ? -0.45 : 0.45;
    head.add(cheek);
  });

  // mouth: a smile at rest, an open oval while talking
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.013, 8, 20, Math.PI), DARK);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.13, 0.38);
  head.add(smile);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), mat(0x6b2a2a));
  mouth.position.set(0, -0.15, 0.37);
  mouth.scale.set(1.1, 0.5, 0.4);
  mouth.visible = false;
  head.add(mouth);

  // arms (pivot at the shoulder)
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.35 * side, 0.97, 0);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 0.48, 16, 1, true), coatMat);
    sleeve.position.y = -0.24;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), TOP);
    cuff.position.y = -0.47;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), SKIN);
    hand.position.y = -0.54;
    pivot.add(cuff);
    pivot.add(sleeve, hand);
    pivot.rotation.z = 0.12 * side;
    girl.add(pivot);
    return pivot;
  }
  makeArm(1);
  const armWave = makeArm(-1);

  // ---------- sizing ----------
  function resize() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, canvas.clientHeight);
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
  let voiceOn = false;
  let voice = null;
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
    u.pitch = 1.25; u.rate = 1.02; u.volume = 0.9;
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
  let running = false, talkUntil = 0, waveUntil = 0, hideTimer = null, current = null;
  let nextBlink = performance.now() + 2500;

  function show(id, keep) {
    const name = NAMES[id];
    if (!name) return;
    bubbleText.textContent = name;
    resize();
    wrap.classList.add('show');
    const now = performance.now();
    talkUntil = now + 1100;
    waveUntil = now + 1800;
    speak(name);
    start();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, keep ? 4500 : 3200);
  }
  function hide() {
    wrap.classList.remove('show');
    setTimeout(() => { if (!wrap.classList.contains('show')) running = false; }, 700);
  }

  // ---------- loop ----------
  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!running || document.hidden) { running = false; return; }
    const t = now / 1000;
    const calm = reduceMotion ? 0 : 1;

    girl.position.y = Math.sin(t * 2.2) * 0.025 * calm;
    girl.rotation.y = Math.sin(t * 0.9) * 0.08 * calm + mx * 0.25;
    head.rotation.y = mx * 0.3;
    head.rotation.x = my * 0.12;
    head.rotation.z = Math.sin(t * 1.6) * 0.04 * calm;

    // wave
    const target = now < waveUntil ? -2.55 + Math.sin(t * 12) * 0.3 * calm : -0.12;
    armWave.rotation.z += (target - armWave.rotation.z) * 0.18;

    // talk
    const talking = now < talkUntil;
    smile.visible = !talking;
    mouth.visible = talking;
    if (talking) mouth.scale.y = 0.35 + Math.abs(Math.sin(t * 16)) * 0.55;

    // blink
    const blinking = now > nextBlink && now < nextBlink + 130;
    if (now > nextBlink + 130) nextBlink = now + 2200 + Math.random() * 2500;
    eyes.forEach(e => (e.scale.y = blinking ? 0.12 : 1));

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
  renderer.render(scene, camera);
})();
