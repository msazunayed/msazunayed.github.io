// ── SHAKIL AHMED PORTFOLIO — MAIN JAVASCRIPT ──

// ── HERO TEXT TILT ────────────────────────────────────────────
(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  const content = hero.querySelector('.hero-inner');
  if(!content) return;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(isReduced) return;

  const tilt = {x:0, y:0, tx:0, ty:0, raf:0};

  function renderTilt(){
    tilt.x += (tilt.tx - tilt.x) * 0.16;
    tilt.y += (tilt.ty - tilt.y) * 0.16;
    const floatY = Math.sin(performance.now() * 0.0014) * -8;
    content.style.setProperty('--hero-fy', `${floatY}px`);
    content.style.setProperty('--hero-ry', `${tilt.x * 12}deg`);
    content.style.setProperty('--hero-rx', `${tilt.y * -12}deg`);

    tilt.raf = requestAnimationFrame(renderTilt);
  }

  function queueTilt(){
    if(!tilt.raf) tilt.raf = requestAnimationFrame(renderTilt);
  }

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    tilt.tx = (e.clientX - rect.left - halfW) / halfW;
    tilt.ty = (e.clientY - rect.top - halfH) / halfH;
    queueTilt();
  });

  hero.addEventListener('mouseleave', () => {
    tilt.tx = 0;
    tilt.ty = 0;
    queueTilt();
  });

  queueTilt();
})();

// ── NEURAL NETWORK LIVE WALLPAPER ──────────────────────────────
(function(){
  const canvas = document.getElementById('nn-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, t = 0, animId;
  const isLiteDevice = window.matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse), (prefers-reduced-motion: reduce)').matches;

  // Multi-color palette for nodes/edges
  const PALETTE = [
    {r:217,g:174,b:120},  // warm gold
    {r:196,g:150,b:90 },   // amber
    {r:123,g:198,b:255},   // ice blue
    {r:80, g:188,b:168},   // teal
    {r:245,g:236,b:223},   // parchment
    {r:101,g:111,b:124},   // slate
    {r:233,g:196,b:106},   // muted brass
  ];

  function rgba(c, a){ return `rgba(${c.r},${c.g},${c.b},${a})`; }
  function lerpColor(a,b,t){ return {r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t}; }
  function drawPolygon(cx, cy, radius, sides, rot){
    ctx.beginPath();
    for(let i=0;i<=sides;i++){
      const ang = rot + (Math.PI * 2 * i) / sides;
      const px = cx + Math.cos(ang) * radius;
      const py = cy + Math.sin(ang) * radius;
      if(i===0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }

  // Network layers: input(4), three hidden(6 each), output(3)
  const LAYERS = [4, 6, 6, 6, 3];
  const TRAIL_LEN = isLiteDevice ? 12 : 20;
  let nodes = [];
  let pulses = [];
  let orbitParticles = [];
  let hubParticles = [];
  const hubTrailA = [];
  const hubTrailB = [];

  function layerPalette(layerIndex){
    const last = LAYERS.length - 1;
    if(layerIndex === 0) return [
      {r:170,g:241,b:168},
      {r:143,g:232,b:140},
      {r:198,g:245,b:170}
    ];
    if(layerIndex === last) return [
      {r:244,g:223,b:82},
      {r:247,g:206,b:60},
      {r:255,g:233,b:131}
    ];
    return [
      {r:123,g:198,b:255},
      {r:96,g:165,b:250},
      {r:80,g:188,b:168},
      {r:217,g:174,b:120}
    ];
  }

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    buildNodes();
  }

  function buildNodes(){
    nodes = [];
    const isPhone = W <= 700;
    const isTablet = W > 700 && W <= 1024;
    const isSmallLaptop = W > 1024 && W <= 1200;
    const layerPositions = isPhone
      ? [0.08, 0.28, 0.48, 0.68, 0.88]
      : isTablet
        ? [0.34, 0.48, 0.62, 0.76, 0.9]
        : isSmallLaptop
          ? [0.38, 0.52, 0.66, 0.8, 0.93]
          : [0.44, 0.57, 0.7, 0.83, 0.96];
    const sizeX = isPhone ? 0.88 : isTablet ? 0.47 : isSmallLaptop ? 0.49 : 0.52;
    const sizeY = isPhone ? 0.37 : isTablet ? 0.4 : isSmallLaptop ? 0.43 : 0.46;
    const leftAnchor = W * layerPositions[0];
    const topPad = isPhone ? H * 0.1 : isTablet ? H * 0.11 : isSmallLaptop ? H * 0.12 : H * 0.11;
    const bottomPad = isPhone ? H * 0.1 : isTablet ? H * 0.11 : isSmallLaptop ? H * 0.12 : H * 0.11;
    const usableHeight = Math.max(120, H - topPad - bottomPad);
    for(let l=0;l<LAYERS.length;l++){
      nodes.push([]);
      const count = LAYERS[l];
      const originalX = W * layerPositions[l];
      const x = leftAnchor + (originalX - leftAnchor) * sizeX;
      const palette = layerPalette(l);
      const jitterX = isPhone ? 0.28 : isTablet ? 0.32 : isSmallLaptop ? 0.42 : 0.5;
      const jitterY = isPhone ? 0.74 : isTablet ? 0.86 : isSmallLaptop ? 0.98 : 1.1;
      const layerSpreadScale = l === 0 ? (isPhone ? 0.65 : isTablet ? 0.28 : isSmallLaptop ? 0.3 : 0.32) : (l === LAYERS.length - 1 ? (isPhone ? 0.45 : isTablet ? 0.19 : isSmallLaptop ? 0.21 : 0.22) : (isPhone ? 1.15 : isTablet ? 0.66 : isSmallLaptop ? 0.69 : 0.72));
      const spread = count > 1 ? usableHeight * layerSpreadScale * sizeY : 0;
      const top = H * 0.5 - spread * 0.5;
      for(let n=0;n<count;n++){
        const posT = count === 1 ? 0.5 : n / (count - 1);
        const baseY = count === 1 ? H * 0.5 : top + spread * posT;
        const rawX = x + Math.sin((l + n) * 1.3 + t * 0.2) * jitterX;
        const rawY = baseY + Math.cos((l * 0.8 + n) * 1.1 + t * 0.24) * jitterY;
        const col = palette[(n + l) % palette.length];
          nodes[l].push({
            x: rawX,
            y: rawY,
            col,
            phase: l*1.3+n*0.75,
            act:0,
            layer:l,
            index:n,
            depthSeed: l*0.9 + n*0.35,
            twistSeed: l*0.65 + n*0.22,
            warpSeed: l*0.4 + n*0.31
          });
      }
    }

    orbitParticles = [];
    const particleCount = isPhone ? 8 : isTablet ? 10 : isSmallLaptop ? 12 : 14;
    for(let i=0;i<particleCount;i++){
      orbitParticles.push({
        angleSeed:(i/particleCount)*Math.PI*2,
        speed:0.11 + (i % 5) * 0.018,
        wobble:0.28 + (i % 4) * 0.07,
        radiusBase:0.24 + (i % 6) * 0.012,
        radiusAmp:0.026 + (i % 3) * 0.01,
        yStretch:0.76 + (i % 4) * 0.05,
        phase:i * 0.7,
        col:PALETTE[i % PALETTE.length],
        history:[]
      });
    }

    hubParticles = [];
    const outputCount = LAYERS[LAYERS.length - 1];
    for(let i=0;i<outputCount;i++){
      const base = {
        sourceIndex:i,
        speed:(isLiteDevice ? 0.0085 : 0.011) + i * 0.0017,
        phase:i * 0.9,
        col:layerPalette(LAYERS.length - 1)[i % 3],
        history:[]
      };
      hubParticles.push({...base, progress:(i / outputCount) * 0.55});
      hubParticles.push({...base, sourceIndex:(i + 1) % outputCount, progress:((i / outputCount) * 0.55 + 0.42) % 1, phase:base.phase + 1.2, speed:base.speed * 0.92, col:layerPalette(LAYERS.length - 1)[(i + 1) % 3], history:[]});
    }
  }

  function pushTrail(history, x, y, maxLen){
    history.push({x, y});
    if(history.length > maxLen) history.shift();
  }

  function smoothTrail(history, lerpAmt){
    if(history.length === 0) return history;
    const out = [];
    let sx = history[0].x;
    let sy = history[0].y;
    out.push({x:sx, y:sy});
    for(let i=1;i<history.length;i++){
      sx += (history[i].x - sx) * lerpAmt;
      sy += (history[i].y - sy) * lerpAmt;
      out.push({x:sx, y:sy});
    }
    return out;
  }

  function drawTrail(history, col, headWidth, tailWidth, maxAlpha){
    if(history.length < 2) return;
    const pts = smoothTrail(history, 0.42);
    const segs = pts.length - 1;
    for(let i=1;i<pts.length;i++){
      const p0 = pts[i-1];
      const p1 = pts[i];
      const u = i / segs;
      const alpha = 0.02 + maxAlpha * u;
      const width = tailWidth + (headWidth - tailWidth) * u;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = rgba(col, alpha);
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  function spawnPulse(){
    const l = Math.floor(Math.random()*(LAYERS.length-1));
    const fi = Math.floor(Math.random()*LAYERS[l]);
    const ti = Math.floor(Math.random()*LAYERS[l+1]);
    const colA = nodes[l][fi].col;
    const colB = nodes[l+1][ti].col;
    pulses.push({mode:'edge', l, fi, ti, prog:0, speed:0.007+Math.random()*0.013, colA, colB, history:[]});
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    t += 0.007;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const showGlow = !isLiteDevice;
    const isSmartphone = W <= 480;
    if(isSmartphone){
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(1.03, 1.03);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    const bgGlow = ctx.createRadialGradient(W * 0.25, H * 0.34, 0, W * 0.25, H * 0.34, Math.max(W, H) * 0.9);
      bgGlow.addColorStop(0, 'rgba(123,198,255,0.2)');
      bgGlow.addColorStop(0.42, 'rgba(196,150,90,0.24)');
      bgGlow.addColorStop(0.8, 'rgba(80,188,168,0.12)');
    bgGlow.addColorStop(1, 'rgba(9,9,11,0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, W, H);

    // Animate activations
    for(let l=0;l<LAYERS.length;l++)
      for(let n=0;n<LAYERS[l];n++){
        const nd = nodes[l][n];
        nd.act = 0.62 + 0.52*Math.abs(Math.sin(t*0.9 + nd.phase));
      }

    // Draw edges
    for(let l=0;l<LAYERS.length-1;l++){
      for(let a=0;a<LAYERS[l];a++){
        for(let b=0;b<LAYERS[l+1];b++){
          const n1=nodes[l][a], n2=nodes[l+1][b];
              const alpha = 0.22 + 0.16*n1.act*n2.act;
          const mid = lerpColor(n1.col, n2.col, 0.5);
          const grad = ctx.createLinearGradient(n1.x,n1.y,n2.x,n2.y);
          grad.addColorStop(0, rgba(n1.col, alpha));
          grad.addColorStop(0.4, rgba(mid, alpha*1.12));
          grad.addColorStop(0.68, 'rgba(255,252,242,0.48)');
          grad.addColorStop(1, rgba(n2.col, alpha));
          ctx.save();
          ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.lineTo(n2.x,n2.y);
          ctx.strokeStyle = grad; ctx.lineWidth = isSmartphone ? 1.88 : 1.44; ctx.globalAlpha = 0.66; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.lineTo(n2.x,n2.y);
          ctx.strokeStyle = grad; ctx.lineWidth = isSmartphone ? 1.48 : 1.1; ctx.globalAlpha = 1; ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw pulses
    pulses.forEach(p=>{
      const n1 = nodes[p.l][p.fi];
      const n2 = nodes[p.l+1][p.ti];
      const px=n1.x+(n2.x-n1.x)*p.prog;
      const py=n1.y+(n2.y-n1.y)*p.prog;
      const col = lerpColor(p.colA, p.colB, p.prog);

      pushTrail(p.history, px, py, TRAIL_LEN);
      drawTrail(p.history, col, isSmartphone ? 3.3 : 2.55, 0.32, 0.78);

      const pulseR = isSmartphone ? 7.8 : 6.2;
      const g = ctx.createRadialGradient(px,py,0,px,py,pulseR);
      g.addColorStop(0, rgba({r:255,g:255,b:255}, 1));
      g.addColorStop(0.18, rgba(col, 1));
      g.addColorStop(0.35, rgba(col, 0.5));
      g.addColorStop(1, rgba(col, 0));
      ctx.beginPath(); ctx.arc(px,py,pulseR,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
      p.prog += p.speed;
    });
    pulses = pulses.filter(p=>{
      if(p.prog>=1){
        if(p.mode === 'edge') nodes[p.l+1][p.ti].act=1;
        return false;
      }
      return true;
    });
    if(pulses.length < (isLiteDevice ? 12 : 20) && Math.random() < (isLiteDevice ? 0.18 : 0.24)) spawnPulse();

    // Draw nodes
    for(let l=0;l<LAYERS.length;l++){
      for(let n=0;n<LAYERS[l];n++){
        const nd=nodes[l][n], act=nd.act;
        const sx = nd.x + Math.sin(t*0.55+nd.phase)*0.85;
        const sy = nd.y + Math.cos(t*0.48+nd.phase*1.1)*0.85;
        const r = l === 0 || l === LAYERS.length - 1 ? (isSmartphone ? 5.2 : 4.2) + act*1.1 : (isSmartphone ? 4.2 : 3.2) + act*1.0;
        if(showGlow){
          const glow=ctx.createRadialGradient(sx,sy,0,sx,sy,r*2.2);
          glow.addColorStop(0, rgba({r:255,g:255,b:255}, 0.18));
          glow.addColorStop(0.22, rgba(nd.col, 0.22*act));
          glow.addColorStop(0.7, rgba(nd.col, 0.04*act));
          glow.addColorStop(1, rgba(nd.col, 0));
          ctx.beginPath(); ctx.arc(sx,sy,r*2.2,0,Math.PI*2);
          ctx.fillStyle=glow; ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx,sy,r+0.8,0,Math.PI*2);
        ctx.strokeStyle = rgba(nd.col, 1);
        ctx.lineWidth = isSmartphone ? 1.72 : 1.28;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx,sy,r*0.9,0,Math.PI*2);
        ctx.fillStyle = l === LAYERS.length - 1
          ? rgba({r:255,g:255,b:248}, 1)
          : (l === 0 ? rgba({r:248,g:255,b:245}, 1) : rgba({r:255,g:255,b:255}, 1));
        ctx.fill();
      }
    }

    // Right-side atom-style hub
    const hubX = W * (isPhone ? 0.94 : (isLiteDevice ? 0.905 : 0.94));
    const hubY = H * 0.5 + Math.sin(t * 1.35) * 1.8;
    const beat = Math.max(0, Math.sin(t * 5.2));
    const hubPulse = Math.pow(beat, 3);
    const hubCore = { r: 255, g: 228, b: 150 };
    const hubShell = { r: 237, g: 180, b: 92 };
    const hubBlue = { r: 108, g: 182, b: 255 };
    const hubBlueSoft = { r: 86, g: 152, b: 230 };
    const outLayer = nodes[LAYERS.length - 1];
    const hubDepth = Math.sin(t * 0.42) * 0.6 + Math.cos(t * 0.18) * 0.4;
    const hubTwist = Math.sin(t * 0.7) * 0.35;
    const hubScale = 1 + hubDepth * 0.05;
    const hubShiftX = Math.sin(t * 0.36) * 2.2;
    const hubShiftY = Math.cos(t * 0.33) * 1.5;

    for(let i=0;i<outLayer.length;i++){
      const n = outLayer[i];
      const grad = ctx.createLinearGradient(n.x, n.y, hubX, hubY);
      grad.addColorStop(0, rgba({r:255,g:255,b:255}, 0.3 + n.act * 0.12));
      grad.addColorStop(0.45, rgba(n.col, 0.72 + n.act * 0.22));
      grad.addColorStop(1, rgba(hubShell, 0.96 + hubPulse * 0.28));
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(hubX, hubY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.48;
      ctx.stroke();
    }

    // Core nucleus with bright inner center and warm shell
    const coreR = (isLiteDevice ? 5.4 : 7.1) * hubScale;
    if(showGlow){
      const coreGlow = ctx.createRadialGradient(hubX, hubY, 0, hubX, hubY, coreR * 2.8);
      coreGlow.addColorStop(0, rgba({r:255,g:255,b:255}, 1));
      coreGlow.addColorStop(0.18, rgba({r:255,g:252,b:236}, 0.92));
      coreGlow.addColorStop(0.42, rgba(hubCore, 0.62));
      coreGlow.addColorStop(1, rgba(hubCore, 0));
      ctx.beginPath();
      ctx.arc(hubX, hubY, coreR * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(hubX, hubY, coreR * 1.06, 0, Math.PI * 2);
    ctx.fillStyle = rgba({r:255,g:255,b:250}, 1);
    ctx.fill();

    const orbits = [
      {
        rx:(isLiteDevice ? 17.2 : 23) + hubPulse * 1.95 + Math.sin(t * 1.9) * 0.6 + hubDepth * 0.8,
        ry:(isLiteDevice ? 10 : 13.7) + hubPulse * 1.45 + Math.cos(t * 1.6) * 0.45 + hubDepth * 0.45,
        rot:t * 0.62 + 0.2 + hubTwist,
        col:hubShell,
        glow:rgba(hubShell, 0.3),
        speed:5.4,
        phase:0.85,
        trail:hubTrailA,
        dotR:2.05
      },
      {
        rx:(isLiteDevice ? 18.6 : 25.8) + hubPulse * 2.2 + Math.cos(t * 1.7) * 0.68 - hubDepth * 0.55,
        ry:(isLiteDevice ? 9.1 : 12.4) + hubPulse * 1.4 + Math.sin(t * 1.45) * 0.42 + hubDepth * 0.35,
        rot:-0.98 + t * 0.5 - hubTwist,
        col:hubBlue,
        glow:rgba(hubBlue, 0.25),
        speed:-4.9,
        phase:2.1,
        trail:hubTrailB,
        dotR:1.95
      }
    ];

    for(let i=0;i<orbits.length;i++){
      const o = orbits[i];

      // Soft glow pass for each elliptical orbit
      if(showGlow){
        ctx.save();
        ctx.translate(hubX, hubY);
        ctx.rotate(o.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = o.glow;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // Sharp visible orbit stroke
      ctx.save();
      ctx.translate(hubX, hubY);
      ctx.rotate(o.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(o.col, 1);
      ctx.lineWidth = 1.06;
      ctx.stroke();
      ctx.restore();

      // Orbital particle with history tail
      const a = t * o.speed + o.phase;
      const localWarp = Math.sin(t * 0.44 + o.phase) * 0.28 + Math.cos(t * 0.27 + o.phase) * 0.16;
      const lx = Math.cos(a + localWarp) * (o.rx * (1 + hubDepth * 0.02));
      const ly = Math.sin(a - localWarp) * (o.ry * (1 + hubDepth * 0.02));
      const dx = hubX + hubShiftX + lx * Math.cos(o.rot) - ly * Math.sin(o.rot);
      const dy = hubY + hubShiftY + lx * Math.sin(o.rot) + ly * Math.cos(o.rot);

      pushTrail(o.trail, dx, dy, TRAIL_LEN + 6);
      drawTrail(o.trail, o.col, 1.7, 0.38, 0.34);

      ctx.beginPath();
      ctx.arc(dx, dy, o.dotR, 0, Math.PI * 2);
      ctx.fillStyle = rgba({r:255,g:255,b:255}, 0.96);
      ctx.fill();
    }

    // Particles traveling from the last column into the hub
    for(let i=0;i<hubParticles.length;i++){
      const p = hubParticles[i];
      const source = outLayer[p.sourceIndex % outLayer.length];
      const startX = source.x;
      const startY = source.y;
      const endX = hubX;
      const endY = hubY;

      p.progress += p.speed;
      if(p.progress > 1){
        p.progress = 0;
        p.history.length = 0;
      }

      const eased = 1 - Math.pow(1 - p.progress, 2.2);
      const px = startX + (endX - startX) * eased;
      const py = startY + (endY - startY) * eased;

      pushTrail(p.history, px, py, TRAIL_LEN + 4);
      const tailAlpha = p.phase % 2 > 1 ? 0.48 : 0.64;
      drawTrail(p.history, p.col, 2.45, 0.24, tailAlpha);

      const trailLead = ctx.createLinearGradient(startX, startY, px, py);
      trailLead.addColorStop(0, rgba(p.col, 0));
      trailLead.addColorStop(1, rgba({r:255,g:255,b:255}, p.phase % 2 > 1 ? 0.8 : 1));
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(px, py);
      ctx.strokeStyle = trailLead;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = rgba({r:255,g:255,b:255}, p.phase % 2 > 1 ? 0.82 : 1);
      ctx.fill();
    }

    // Floating data particles
    for(let i=0;i<orbitParticles.length;i++){
      const p = orbitParticles[i];
      const angle = p.angleSeed + t * p.speed + Math.sin(t * 0.3 + p.phase) * p.wobble;
      const radius = W * p.radiusBase + Math.sin(t * 0.5 + p.phase) * W * p.radiusAmp;
      const px = W * 0.5 + Math.cos(angle) * radius + Math.sin(t * 0.41 + p.phase) * 3.5;
      const py = H * 0.5 + Math.sin(angle * p.yStretch) * H * 0.28 + Math.cos(t * 0.29 + p.phase) * 2.1;
      const headAlpha = 0.07 + 0.07 * Math.abs(Math.sin(t + p.phase));

      pushTrail(p.history, px, py, TRAIL_LEN);
      drawTrail(p.history, p.col, 2.15, 0.26, 0.56);

      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = rgba({r:255,g:255,b:255}, Math.min(0.84, headAlpha + 0.28));
      ctx.fill();
    }

    if(isSmartphone){
      ctx.restore();
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll('.sr');
if('IntersectionObserver' in window){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
  },{threshold:0.1});
  revealEls.forEach(el=>io.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in'));
}

// ── MOBILE NAV TOGGLE ──
const nav = document.getElementById('nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinksPanel = document.getElementById('nav-links');
if(nav && navToggle && navLinksPanel){
  navToggle.addEventListener('click', ()=>{
    const open = nav.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinksPanel.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click', ()=>{
      nav.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 920 && nav.classList.contains('menu-open')){
      nav.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── NAV ACTIVE LINK ──
const secs = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a:not(.nav-hire)');
const nio = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){
    navAs.forEach(a=>a.classList.remove('active'));
    const lnk=document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
    if(lnk) lnk.classList.add('active');
  }});
},{threshold:0.4});
secs.forEach(s=>nio.observe(s));

// ── SCROLL PROGRESS & NAV MORPH ──
window.addEventListener('scroll',()=>{
  const curr=window.scrollY;
  const total=document.documentElement.scrollHeight - window.innerHeight;
  const pct = curr/total*100;
  document.documentElement.style.setProperty('--scroll-progress', pct+'%');
  document.getElementById('nav').classList.toggle('scrolled', curr>20);
  if(curr > 40 && nav?.classList.contains('menu-open')){
    nav.classList.remove('menu-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
},{ passive:true });

// ── CINEMATIC HERO CAMERA ROLL ──
const heroSection = document.querySelector('.hero');
if(heroSection && hero){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    heroSection.addEventListener('mousemove', e=>{
      const r = heroSection.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--hero-ry', `${px * 6}deg`);
      hero.style.setProperty('--hero-rx', `${-py * 5}deg`);
    });
    heroSection.addEventListener('mouseleave', ()=>{
      hero.style.setProperty('--hero-ry', '0deg');
      hero.style.setProperty('--hero-rx', '0deg');
    });
  }
}

// ── 6D TILT ON PROFILE IMAGE ──
const aboutPhoto = document.querySelector('.about-photo-frame');
const aboutPhotoImg = aboutPhoto?.querySelector('img');
if(aboutPhoto && aboutPhotoImg){
  aboutPhoto.addEventListener('mousemove', e=>{
    const r = aboutPhoto.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    aboutPhotoImg.style.setProperty('--img-ry', `${px * 8}deg`);
    aboutPhotoImg.style.setProperty('--img-rx', `${-py * 8}deg`);
  });
  aboutPhoto.addEventListener('mouseleave', ()=>{
    aboutPhotoImg.style.setProperty('--img-ry', '0deg');
    aboutPhotoImg.style.setProperty('--img-rx', '0deg');
  });
}

// ── 6D TILT ON PROJECT CARDS ──
document.querySelectorAll('.proj').forEach(card=>{
  const panel = card.querySelector('.proj-main');
  if(!panel) return;
  card.addEventListener('mousemove', e=>{
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    panel.style.setProperty('--card-ry', `${px * 6}deg`);
    panel.style.setProperty('--card-rx', `${-py * 5}deg`);
  });
  card.addEventListener('mouseleave', ()=>{
    panel.style.setProperty('--card-ry', '0deg');
    panel.style.setProperty('--card-rx', '0deg');
  });
});

// ── CONTACT FORM HANDLER ──
// Opens email client with pre-filled content
const contactForm = document.getElementById('contact-form');
if(contactForm){
  contactForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name    = document.getElementById('contact-name').value.trim();
    const email   = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if(!name || !email || !message) return;

    // Validate name (letters and spaces only)
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      alert('Name should only contain letters and spaces.');
      return;
    }

    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    // ── CHANGE THIS TO YOUR REAL EMAIL ──
    window.location.href = `mailto:shakilahmedzunayed@gmail.com?subject=${subject}&body=${body}`;
  });
}
