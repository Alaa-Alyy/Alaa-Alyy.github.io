// ===== 3D GUIDE AVATAR =====
// A rigged 3D character (built with MakeHuman/MPFB in Blender, see guide.glb) that
// slides up at the bottom-right each time a new section reaches the middle of the
// screen, waves, and shows the section's name. Click her to turn her voice on/off.
(function () {
  const wrap = document.getElementById('guide');
  const bubbleText = document.getElementById('guideText');
  if (!wrap || typeof THREE === 'undefined' || !THREE.GLTFLoader) { if (wrap) wrap.remove(); return; }

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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.set(0, 1.28, 3.9);
  camera.lookAt(0, 1.16, 0);

  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x1d2a22, 0.75));
  const key = new THREE.DirectionalLight(0xfff1e6, 1.25);
  key.position.set(1.5, 2.6, 2.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe3d8, 0.4);
  fill.position.set(-2, 1.5, 1.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9fe0bd, 0.9);
  rim.position.set(-1.5, 2, -2.5);
  scene.add(rim);

  // ---------- model ----------
  let mixer = null, actions = {}, head = null, neck = null, neckBaseY = 0, ready = false;
  const clock = new THREE.Clock();

  function load() {
    const loader = new THREE.GLTFLoader();
    if (THREE.DRACOLoader) {
      const draco = new THREE.DRACOLoader();
      draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(draco);
    }
    loader.load(wrap.dataset.model || 'guide.glb', gltf => {
      const model = gltf.scene;
      model.rotation.y = -0.32;          // turned slightly toward the page
      model.traverse(o => {
        if (o.isMesh) {
          o.frustumCulled = false;
          // the hijab is a thin shell: show both sides so its inner edge never looks hollow
          if (o.material && /hijab/i.test(o.material.name)) o.material.side = THREE.DoubleSide;
        }
        if (o.isBone && /Head$/.test(o.name)) head = o;
        if (o.isBone && /Neck$/.test(o.name)) neck = o;
      });
      if (neck) neckBaseY = neck.rotation.y;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach(clip => { actions[clip.name] = mixer.clipAction(clip); });
      if (actions.idle) actions.idle.play();
      if (actions.wave) {
        actions.wave.setLoop(THREE.LoopOnce, 1);
        actions.wave.clampWhenFinished = false;
      }
      mixer.addEventListener('finished', e => {
        if (e.action === actions.wave && actions.idle) {
          actions.idle.reset().fadeIn(0.45).play();
          actions.wave.fadeOut(0.45);
        }
      });
      ready = true;
      if (pendingId) show(pendingId);
    }, undefined, err => { console.warn('guide avatar failed to load', err); wrap.remove(); });
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
  let mx = 0, my = 0, lx = 0, ly = 0;
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
    u.pitch = 1.1; u.rate = 1.0; u.volume = 0.9;
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
  let running = false, hideTimer = null, current = null, pendingId = null;

  function show(id, keep) {
    const name = NAMES[id];
    if (!name) return;
    if (!ready) { pendingId = id; return; }
    pendingId = null;
    bubbleText.textContent = name;
    resize();
    wrap.classList.add('show');
    if (actions.wave && !reduceMotion) {
      actions.wave.reset().setEffectiveWeight(1).fadeIn(0.35).play();
      if (actions.idle) actions.idle.fadeOut(0.35);
    }
    speak(name);
    start();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, keep ? 5200 : 4200);
  }
  function hide() {
    wrap.classList.remove('show');
    setTimeout(() => { if (!wrap.classList.contains('show')) running = false; }, 800);
  }

  // ---------- loop ----------
  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(tick);
  }
  function tick() {
    if (!running || document.hidden) { running = false; return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(dt);
    // gentle head follow on top of the animation
    lx += (mx - lx) * 0.06; ly += (my - ly) * 0.06;
    if (head) { head.rotation.y += lx * 0.35; head.rotation.x += ly * 0.12; }
    if (neck) { neck.rotation.y = neckBaseY + lx * 0.12; }
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

  // load the model after the page itself is ready, so it never slows the first paint
  const kick = () => setTimeout(load, 600);
  if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick);
  resize();
})();
