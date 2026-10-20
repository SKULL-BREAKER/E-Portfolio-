/**
 * Cyber-Quantum Tactical HUD Scanner Cursor
 * Pure tactical targeting reticle with dynamic state transformations:
 * - When cursor inspects cards/links: Activates laser cyan radar sweep, cyan targeting brackets,
 *   and synchronizes comet trail particles into glowing laser cyan.
 * - When cursor targets buttons/actions: Activates cyber orange targeting reticle and high-speed sweep.
 */

(function () {
  'use strict';

  // Only initialize on desktop / fine-pointer devices
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  function init() {
    if (!document.body || document.getElementById('cyberHudCursor')) return;

    // Setup DOM Elements
    const container = document.createElement('div');
    container.id = 'cyberHudCursor';
    container.className = 'cyber-hud-cursor';
    container.setAttribute('aria-hidden', 'true');

    container.innerHTML = `
      <div class="hud-center-dot" id="hudCenterDot"></div>
      <div class="hud-reticle" id="hudReticle">
        <span class="hud-bracket hud-tl"></span>
        <span class="hud-bracket hud-tr"></span>
        <span class="hud-bracket hud-bl"></span>
        <span class="hud-bracket hud-br"></span>
        <span class="hud-cross-h"></span>
        <span class="hud-cross-v"></span>
        <div class="hud-radar-sweep"></div>
        <div class="hud-laser-scan"></div>
      </div>
      <div class="hud-shockwave" id="hudShockwave"></div>
    `;

    document.body.appendChild(container);

  // Ghost Comet Particle Trail Elements (6 discrete nodes)
  const TRAIL_LENGTH = 6;
  const trailNodes = [];
  for (let i = 0; i < TRAIL_LENGTH; i++) {
    const node = document.createElement('div');
    node.className = `hud-trail-node hud-trail-${i}`;
    node.setAttribute('aria-hidden', 'true');
    document.body.appendChild(node);
    trailNodes.push({
      el: node,
      x: -100,
      y: -100,
      alpha: 1 - i / TRAIL_LENGTH,
      size: Math.max(2, 4.5 - i * 0.5),
    });
  }

  // Element References
  const dotEl = document.getElementById('hudCenterDot');
  const reticleEl = document.getElementById('hudReticle');
  const shockwaveEl = document.getElementById('hudShockwave');

  // Tracking Coordinates & State
  let mouseX = -200;
  let mouseY = -200;
  let reticleX = -200;
  let reticleY = -200;
  let isVisible = false;
  let currentState = 'state-default';

  // Instant restoration from previous coordinate state
  try {
    const sX = sessionStorage.getItem('hud_mouse_x');
    const sY = sessionStorage.getItem('hud_mouse_y');
    if (sX !== null && sY !== null) {
      mouseX = parseFloat(sX);
      mouseY = parseFloat(sY);
      reticleX = mouseX;
      reticleY = mouseY;
      isVisible = true;
      container.classList.add('hud-visible');
      dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      reticleEl.style.transform = `translate3d(${reticleX}px, ${reticleY}px, 0) translate(-50%, -50%)`;
      trailNodes.forEach((n) => n.el.classList.add('hud-visible'));
    }
  } catch (e) {}

  // History buffer for trail
  const trailHistory = [];
  for (let i = 0; i < TRAIL_LENGTH * 3; i++) {
    trailHistory.push({ x: mouseX, y: mouseY });
  }

  // Mouse Move Event
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    try {
      sessionStorage.setItem('hud_mouse_x', mouseX);
      sessionStorage.setItem('hud_mouse_y', mouseY);
    } catch (err) {}

    if (!isVisible) {
      isVisible = true;
      container.classList.add('hud-visible');
      trailNodes.forEach((n) => n.el.classList.add('hud-visible'));
    }

    // Zero-latency instant tracking for center dot
    dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

    // Dynamic Target Inspection & Mode Switching
    const target = e.target;
    if (target && target.closest) {
      const isInput = target.closest('input, textarea, [contenteditable="true"]');
      const isInteractive = target.closest(
        'a, button, .nav-link, .brand-identity, .btn-white-solid, .btn-dark-outline, .btn-qr-action, .filter-btn, .skill-item, .tech-chip, .view-cert-btn, .project-card, .cert-card, .timeline-entry, .skill-box, .about-card, .contact-card, .hero-tagline-text, [role="button"]'
      );

      if (isInput) {
        setReticleState('state-input');
      } else if (isInteractive) {
        setReticleState('state-card'); // Unified Blue / Cyan Cyber Laser HUD Scan
      } else {
        setReticleState('state-default');
      }
    }
  }, { passive: true });

  function setReticleState(stateClass) {
    if (currentState !== stateClass) {
      currentState = stateClass;
      reticleEl.className = 'hud-reticle ' + stateClass;
      dotEl.className = 'hud-center-dot ' + stateClass;
      container.className = 'cyber-hud-cursor hud-visible ' + stateClass;
      shockwaveEl.className = 'hud-shockwave ' + stateClass;

      // Synchronize all comet trail nodes to the new state color and glow!
      trailNodes.forEach((node, i) => {
        node.el.className = `hud-trail-node hud-trail-${i} hud-visible ${stateClass}`;
      });
    }
  }

  // Click Mechanical Snap & Shockwave Detonation
  window.addEventListener('mousedown', () => {
    reticleEl.classList.add('hud-click-active');
    dotEl.classList.add('hud-click-active');

    // Trigger shockwave
    shockwaveEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(0.3)`;
    shockwaveEl.classList.remove('hud-pulse-run');
    void shockwaveEl.offsetWidth; // Force CSS reflow
    shockwaveEl.classList.add('hud-pulse-run');
  }, { passive: true });

  window.addEventListener('mouseup', () => {
    reticleEl.classList.remove('hud-click-active');
    dotEl.classList.remove('hud-click-active');
  }, { passive: true });

  // Boundary Detection
  document.addEventListener('mouseleave', () => {
    isVisible = false;
    container.classList.remove('hud-visible');
    trailNodes.forEach((n) => n.el.classList.remove('hud-visible'));
  });

  document.addEventListener('mouseenter', () => {
    isVisible = true;
    container.classList.add('hud-visible');
    trailNodes.forEach((n) => n.el.classList.add('hud-visible'));
  });

  // 60FPS Fluid Animation Engine (Lerp & Ghost Trail Physics)
  function loop() {
    if (isVisible) {
      // Fluid spring lerp for the outer HUD targeting brackets (smooth lag)
      reticleX += (mouseX - reticleX) * 0.22;
      reticleY += (mouseY - reticleY) * 0.22;

      reticleEl.style.transform = `translate3d(${reticleX}px, ${reticleY}px, 0) translate(-50%, -50%)`;

      // Update trail history buffer
      trailHistory.unshift({ x: mouseX, y: mouseY });
      if (trailHistory.length > TRAIL_LENGTH * 3) {
        trailHistory.pop();
      }

      // Position discrete comet trail nodes along historical coordinates
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const historyIdx = (i + 1) * 2;
        const pt = trailHistory[historyIdx] || { x: mouseX, y: mouseY };
        const node = trailNodes[i];
        node.el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`;
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
