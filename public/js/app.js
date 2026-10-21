/**
 * Executive Portfolio Web Application
 * Resilient, zero-crash client controller with Instant Zero-Latency Page Transitions
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Smooth hash migration to dedicated standalone pages
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#/, '');
    const routeMap = {
      about: './about.html',
      skills: './skills.html',
      certifications: './certifications.html',
      projects: './projects.html',
      resume: './resume.html',
      resumeSection: './resume.html',
      contacts: './contact.html',
      contact: './contact.html',
    };
    if (routeMap[rawHash]) {
      window.location.replace(routeMap[rawHash]);
      return;
    }
  }

  // State Management
  const state = {
    profile: null,
    resume: null,
    qrUrl: null,
  };

  // Toast System
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const iconSvg = type === 'success'
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    toast.innerHTML = `
      <span style="display:flex; align-items:center;">${iconSvg}</span>
      <span>${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 1. Navigation Active Route Highlighting (Bulletproof across localhost & GitHub Pages subpaths)
   */
  function updateActiveNav() {
    const knownPages = ['about', 'skills', 'certifications', 'projects', 'resume', 'contact'];
    const currentPath = window.location.pathname.toLowerCase();

    let matchedPage = 'index';
    for (const page of knownPages) {
      if (currentPath.includes(page)) {
        matchedPage = page;
        break;
      }
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      let linkPage = 'index';
      for (const page of knownPages) {
        if (href.includes(page)) {
          linkPage = page;
          break;
        }
      }

      if (linkPage === matchedPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * 2. Mobile Navigation Toggle
   */
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mainNav = document.getElementById('mainNav');
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      const isOpen = mainNav.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  function closeMobileNav() {
    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * 3. Fetch & Populate Profile Data
   */
  async function loadProfile() {
    try {
      if (state.profile) {
        updateProfileUI(state.profile);
        return;
      }
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Profile fetch failed');
      const data = await res.json();
      if (data.success && data.data) {
        state.profile = data.data;
        updateProfileUI(data.data);
      }
    } catch (err) {
      console.warn('[PROFILE] Using static profile data:', err.message);
    }
  }

  function updateProfileUI(profile) {
    const nameEls = document.querySelectorAll('.dynamic-name');
    nameEls.forEach((el) => (el.textContent = profile.fullName));

    const titleEls = document.querySelectorAll('.dynamic-title');
    titleEls.forEach((el) => {
      if (el.id !== 'heroRoleCycler' && el.id !== 'roleTypingText') {
        el.textContent = profile.title;
      }
    });

    if (typeof initHeroRoleCycler === 'function') {
      initHeroRoleCycler();
    }

    const bioEl = document.getElementById('dynamicBio');
    if (bioEl && profile.bio) bioEl.textContent = profile.bio;

    const avatarEls = document.querySelectorAll('.dynamic-avatar');
    if (profile.avatarUrl) {
      avatarEls.forEach((img) => (img.src = profile.avatarUrl));
    }

    const emailEls = document.querySelectorAll('.dynamic-email');
    emailEls.forEach((el) => {
      el.textContent = profile.email;
      if (el.tagName === 'A') el.href = `mailto:${profile.email}`;
    });

    const locEl = document.getElementById('dynamicLocationDisplay');
    if (locEl && profile.location) {
      locEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 6px; color: var(--cyber-cyan);">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${escapeHtml(profile.location)}
      `;
    }

    const phoneEl = document.getElementById('dynamicPhone');
    if (phoneEl && profile.phone) phoneEl.textContent = profile.phone;

    document.querySelectorAll('.dynamic-github, #dynamicGithub').forEach((el) => {
      if (profile.githubUrl) el.href = profile.githubUrl;
    });

    document.querySelectorAll('.dynamic-linkedin, #dynamicLinkedin').forEach((el) => {
      if (profile.linkedinUrl) el.href = profile.linkedinUrl;
    });
  }

  /**
   * 4. Fetch & Manage Active Resume Metadata
   */
  async function loadResumeInfo() {
    try {
      if (state.resume) {
        updateResumeUI(state.resume);
        return;
      }
      const res = await fetch('/api/resume/info');
      if (!res.ok) throw new Error('Resume metadata unavailable');
      const json = await res.json();
      if (json.success && json.data) {
        state.resume = json.data;
        updateResumeUI(json.data);
      }
    } catch (err) {
      console.warn('[RESUME] Resume info notice:', err.message);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function updateResumeUI(resume) {
    const resumeMetaSize = document.getElementById('resumeMetaSize');
    const resumeMetaHash = document.getElementById('resumeMetaHash');
    const resumeMetaDate = document.getElementById('resumeMetaDate');

    if (resumeMetaSize) resumeMetaSize.textContent = formatBytes(resume.fileSize);
    if (resumeMetaHash) {
      resumeMetaHash.textContent = resume.sha256Hash.substring(0, 16) + '...';
      resumeMetaHash.title = `Full SHA-256 Checksum: ${resume.sha256Hash}`;
    }
    if (resumeMetaDate) {
      const date = new Date(resume.uploadedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      resumeMetaDate.textContent = date;
    }
  }

  /**
   * 5. Front Page Dynamic QR Code Generator
   */
  async function loadQrCode() {
    try {
      const frontpageQrImg = document.getElementById('frontpageQrImg');
      if (!frontpageQrImg) return;

      if (!frontpageQrImg.getAttribute('src')) {
        frontpageQrImg.src = '/assets/portfolio-qr.png';
      }

      if (state.qrUrl) {
        frontpageQrImg.src = state.qrUrl;
        return;
      }

      const currentUrl = window.location.origin;
      const res = await fetch(`/api/qr?url=${encodeURIComponent(currentUrl)}`);
      if (!res.ok) throw new Error('QR generation failed');
      const data = await res.json();
      if (data.success && data.qrDataUrl) {
        state.qrUrl = data.qrDataUrl;
        frontpageQrImg.src = data.qrDataUrl;
      }
    } catch (err) {
      console.warn('[QR] Error loading QR code:', err.message);
      const frontpageQrImg = document.getElementById('frontpageQrImg');
      if (frontpageQrImg && !frontpageQrImg.getAttribute('src')) {
        frontpageQrImg.src = './assets/portfolio-qr.png';
      }
    }
  }

  /**
   * 5b. Dynamic Role Cycler Terminal
   * Natural typewriter cadence, pause, backspace, and cycling across key roles
   */
  let roleCyclerTimer = null;
  let currentRoleIdx = 0;
  let currentCharIdx = 0;
  let isDeleting = false;
  let isHovered = false;

  const defaultRoles = [
    'B.Tech AI & Data Science',
    'Frontend Developer',
    'UI/UX Designer'
  ];

  function initHeroRoleCycler() {
    const container = document.getElementById('heroRoleCycler');
    const textEl = document.getElementById('roleTypingText');
    if (!container || !textEl) {
      if (roleCyclerTimer) {
        clearTimeout(roleCyclerTimer);
        roleCyclerTimer = null;
      }
      return;
    }

    if (roleCyclerTimer) {
      clearTimeout(roleCyclerTimer);
      roleCyclerTimer = null;
    }

    // Individual clean professional roles
    let roles = [...defaultRoles];
    if (state.profile && state.profile.title) {
      const customTitle = state.profile.title.trim();
      if (
        customTitle &&
        !customTitle.includes('|') &&
        !/sih|hackathon|python|aiml/i.test(customTitle) &&
        !roles.some(r => r.toLowerCase() === customTitle.toLowerCase())
      ) {
        roles.unshift(customTitle);
      }
    }

    isHovered = false;

    container.onmouseenter = () => {
      isHovered = true;
    };

    container.onmouseleave = () => {
      isHovered = false;
      if (!roleCyclerTimer) {
        step();
      }
    };

    // Click to advance instantly to the next role
    container.onclick = () => {
      if (roleCyclerTimer) clearTimeout(roleCyclerTimer);
      isDeleting = false;
      currentRoleIdx = (currentRoleIdx + 1) % roles.length;
      currentCharIdx = roles[currentRoleIdx].length;
      textEl.textContent = roles[currentRoleIdx];

      // Tactile visual feedback
      container.style.transform = 'scale(0.98)';
      setTimeout(() => { container.style.transform = ''; }, 100);

      roleCyclerTimer = setTimeout(() => {
        isDeleting = true;
        step();
      }, 2000);
    };

    function step() {
      if (roleCyclerTimer) {
        clearTimeout(roleCyclerTimer);
        roleCyclerTimer = null;
      }

      // If user is hovering and full title is visible, pause until mouse leaves
      if (isHovered && !isDeleting && currentCharIdx >= roles[currentRoleIdx].length) {
        return;
      }

      const activeText = roles[currentRoleIdx];

      if (isDeleting) {
        currentCharIdx--;
        textEl.textContent = activeText.substring(0, currentCharIdx);

        if (currentCharIdx <= 0) {
          isDeleting = false;
          currentRoleIdx = (currentRoleIdx + 1) % roles.length;
          roleCyclerTimer = setTimeout(step, 300);
          return;
        }
        roleCyclerTimer = setTimeout(step, 24);
      } else {
        currentCharIdx++;
        textEl.textContent = activeText.substring(0, currentCharIdx);

        if (currentCharIdx >= activeText.length) {
          isDeleting = true;
          // Hold full text for 2.4 seconds so it can be easily read
          roleCyclerTimer = setTimeout(step, 2400);
          return;
        }

        // Natural typing cadence (40ms - 60ms)
        const delay = 40 + Math.random() * 20;
        roleCyclerTimer = setTimeout(step, delay);
      }
    }

    // Set initial text and start after an initial 2-second hold
    currentRoleIdx = 0;
    currentCharIdx = roles[0].length;
    textEl.textContent = roles[0];
    isDeleting = true;
    roleCyclerTimer = setTimeout(step, 2200);
  }

  /**
   * 6. Rebind All Page Interactive Listeners
   */
  function rebindPageComponents() {
    // 6.0 Hero Role Cycler
    initHeroRoleCycler();

    // 6a. Copy Hash Button
    const copyHashBtn = document.getElementById('copyHashBtn');
    if (copyHashBtn) {
      copyHashBtn.onclick = async () => {
        if (state.resume && state.resume.sha256Hash) {
          try {
            await navigator.clipboard.writeText(state.resume.sha256Hash);
            showToast('SHA-256 Checksum copied to clipboard!', 'success');
          } catch (e) {
            showToast('Checksum: ' + state.resume.sha256Hash, 'success');
          }
        }
      };
    }

    // 6b. Resume PDF Theme Toggle (Dark Cyber Mode / Standard Paper)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const resumeIframe = document.getElementById('resumeIframe');
    const themeToggleLabel = document.getElementById('themeToggleLabel');
    if (themeToggleBtn && resumeIframe) {
      themeToggleBtn.onclick = () => {
        const isDark = resumeIframe.classList.toggle('dark-mode');
        if (themeToggleLabel) {
          themeToggleLabel.textContent = isDark ? 'DARK THEME' : 'LIGHT THEME';
        }
        showToast(isDark ? 'Resume styled in Cyber Dark mode' : 'Resume switched to Standard Paper mode', 'success');
      };
    }

    // 6c. Resume Frame Size Toggle (Minimize / Compact view vs Fit/Expand)
    const sizeToggleBtn = document.getElementById('sizeToggleBtn');
    const resumeTerminalFrame = document.getElementById('resumeTerminalFrame');
    const sizeToggleLabel = document.getElementById('sizeToggleLabel');
    if (sizeToggleBtn && resumeTerminalFrame) {
      sizeToggleBtn.onclick = () => {
        const isMinimized = resumeTerminalFrame.classList.toggle('is-minimized');
        if (sizeToggleLabel) {
          sizeToggleLabel.textContent = isMinimized ? 'EXPAND' : 'COMPACT';
        }
        showToast(isMinimized ? 'Resume view minimized for compact browsing' : 'Resume view expanded', 'success');
      };
    }

    // 6b. QR Code Buttons
    const copyPortfolioUrlBtn = document.getElementById('copyPortfolioUrlBtn');
    if (copyPortfolioUrlBtn) {
      copyPortfolioUrlBtn.onclick = async () => {
        try {
          const shareUrl = window.location.href.split('#')[0].split('?')[0];
          await navigator.clipboard.writeText(shareUrl);
          showToast('Portfolio link copied to clipboard!', 'success');
        } catch (err) {
          showToast(window.location.href, 'success');
        }
      };
    }

    const downloadQrBtn = document.getElementById('downloadQrBtn');
    if (downloadQrBtn) {
      downloadQrBtn.onclick = () => {
        const qrImg = document.getElementById('frontpageQrImg');
        const qrSrc = state.qrUrl || qrImg?.src || './assets/portfolio-qr.png';
        if (qrSrc) {
          const link = document.createElement('a');
          link.download = 'nanthakumar-portfolio-qr.png';
          link.href = qrSrc;
          link.click();
          showToast('QR Code image downloaded.', 'success');
        } else {
          showToast('QR Code is rendering, please try in a moment.', 'error');
        }
      };
    }

    // 6c. Project Filter Tabs (ALL, COLLABORATIVE, INDIVIDUAL)
    const projectFilterBtns = document.querySelectorAll('.projects-filter-bar:not(.cert-filter-bar):not(.skills-filter-bar) .filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    projectFilterBtns.forEach((btn) => {
      btn.onclick = () => {
        projectFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        projectCards.forEach((card) => {
          const category = (card.getAttribute('data-category') || '').toLowerCase();
          const categories = category.split(/\s+/);
          if (filter === 'all' || categories.includes(filter)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    // 6c-2. Certification Filter Tabs (ALL, EVENTS, COMPETITIONS, SKILLS) & Domain Sub-Filters
    const certFilterBtns = document.querySelectorAll('.cert-filter-btn');
    const certSubfilterBar = document.getElementById('certSubfilterBar');
    const certSubfilterBtns = document.querySelectorAll('.cert-subfilter-btn');
    const certCards = document.querySelectorAll('.cert-card');

    let currentCertFilter = 'all';
    let currentCertSubfilter = 'all-skills';

    function updateCertCardVisibility() {
      certCards.forEach((card) => {
        const category = (card.getAttribute('data-skill-category') || card.getAttribute('data-category') || '').toLowerCase();
        const subCat = (card.getAttribute('data-sub-category') || '').toLowerCase();
        const categories = category.split(/\s+/);
        const subCategories = subCat.split(/\s+/);

        if (currentCertFilter === 'all') {
          card.style.display = 'flex';
        } else if (currentCertFilter === 'skills') {
          if (!categories.includes('skills')) {
            card.style.display = 'none';
          } else {
            if (currentCertSubfilter === 'all-skills') {
              card.style.display = 'flex';
            } else {
              card.style.display = subCategories.includes(currentCertSubfilter) ? 'flex' : 'none';
            }
          }
        } else {
          card.style.display = categories.includes(currentCertFilter) ? 'flex' : 'none';
        }
      });
    }

    certFilterBtns.forEach((btn) => {
      btn.onclick = () => {
        certFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        currentCertFilter = (btn.getAttribute('data-filter') || 'all').toLowerCase();

        if (certSubfilterBar) {
          if (currentCertFilter === 'skills') {
            certSubfilterBar.style.display = 'flex';
            currentCertSubfilter = 'all-skills';
            certSubfilterBtns.forEach((sb) => {
              if (sb.getAttribute('data-subfilter') === 'all-skills') {
                sb.classList.add('active');
              } else {
                sb.classList.remove('active');
              }
            });
          } else {
            certSubfilterBar.style.display = 'none';
          }
        }

        updateCertCardVisibility();
      };
    });

    certSubfilterBtns.forEach((sBtn) => {
      sBtn.onclick = () => {
        certSubfilterBtns.forEach((sb) => sb.classList.remove('active'));
        sBtn.classList.add('active');
        currentCertSubfilter = (sBtn.getAttribute('data-subfilter') || 'all-skills').toLowerCase();
        updateCertCardVisibility();
      };
    });

    // 6c-3. Skills Categorization Filter Tabs
    const skillFilterBtns = document.querySelectorAll('.skill-filter-btn');
    const skillBoxes = document.querySelectorAll('.skill-box');
    skillFilterBtns.forEach((btn) => {
      btn.onclick = () => {
        skillFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        skillBoxes.forEach((box) => {
          const category = (box.getAttribute('data-category') || '').toLowerCase();
          const categories = category.split(/\s+/);
          if (filter === 'all' || categories.includes(filter)) {
            box.style.display = 'flex';
          } else {
            box.style.display = 'none';
          }
        });
      };
    });

    // 6c-4. Quick-Stats Counter Animation
    const counters = document.querySelectorAll('.counter-val');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      if (isNaN(target)) return;
      let current = 0;
      const duration = 650;
      const stepTime = Math.max(30, Math.floor(duration / target));
      counter.textContent = '0';
      const timer = setInterval(() => {
        current++;
        counter.textContent = String(current);
        if (current >= target) {
          clearInterval(timer);
        }
      }, stepTime);
    });

    // 6d. Certificate Document Viewer (Simple UX Architecture)
    const certModal = document.getElementById('certModal');
    const closeCertModal = document.getElementById('closeCertModal');
    const certModalCloseFooterBtn = document.getElementById('certModalCloseFooterBtn');
    const certModalTitle = document.getElementById('certModalTitle');
    const certModalOrg = document.getElementById('certModalOrg');
    const certModalId = document.getElementById('certModalId');
    const certModalDate = document.getElementById('certModalDate');
    const certModalExpandBtn = document.getElementById('certModalExpandBtn');
    const certModalOnlineVerify = document.getElementById('certModalOnlineVerify');
    const certImageContainer = document.getElementById('certImageContainer');
    const certIframeContainer = document.getElementById('certIframeContainer');
    const certModalImg = document.getElementById('certModalImg');
    const certModalIframe = document.getElementById('certModalIframe');
    const certImageLoading = document.getElementById('certImageLoading');
    const certImgFallback = document.getElementById('certImgFallback');
    const certFallbackLink = document.getElementById('certFallbackLink');
    const certPdfDirectLink = document.getElementById('certPdfDirectLink');

    function openCertificateViewer(data) {
      const { title, org, id, date, file, verifyUrl } = data;

      if (certModalTitle) certModalTitle.textContent = title || 'Certificate of Completion';
      if (certModalOrg) certModalOrg.textContent = org || 'VERIFIED CREDENTIAL';
      if (certModalId) certModalId.textContent = id || 'N/A';
      if (certModalDate) certModalDate.textContent = date || 'Verified';

      // Bulletproof path cleanup (removes root slash and ensures relative pathing for GitHub Pages & subpaths)
      let cleanFile = (file || '').trim();
      if (cleanFile) {
        if (cleanFile.startsWith('/')) {
          cleanFile = '.' + cleanFile;
        } else if (!cleanFile.startsWith('./') && !cleanFile.startsWith('http')) {
          cleanFile = './' + cleanFile;
        }
      }
      const safeFileUrl = cleanFile.startsWith('http') ? cleanFile : encodeURI(cleanFile);

      if (certModalExpandBtn) {
        if (safeFileUrl) {
          certModalExpandBtn.href = safeFileUrl;
          certModalExpandBtn.style.display = 'inline-flex';
        } else {
          certModalExpandBtn.style.display = 'none';
        }
      }

      if (certFallbackLink) certFallbackLink.href = safeFileUrl;
      if (certPdfDirectLink) certPdfDirectLink.href = safeFileUrl;

      if (certModalOnlineVerify) {
        if (verifyUrl) {
          certModalOnlineVerify.href = verifyUrl;
          certModalOnlineVerify.style.display = 'inline-flex';
        } else {
          certModalOnlineVerify.style.display = 'none';
        }
      }

      // Reset viewer containers
      if (certImageContainer) certImageContainer.style.display = 'none';
      if (certIframeContainer) certIframeContainer.style.display = 'none';
      if (certImageLoading) certImageLoading.style.display = 'none';
      if (certImgFallback) certImgFallback.style.display = 'none';

      // Display the actual certificate
      if (safeFileUrl) {
        const isImage = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(safeFileUrl);
        if (isImage) {
          if (certModalIframe) certModalIframe.src = '';
          if (certImageContainer) certImageContainer.style.display = 'flex';
          if (certModalImg) {
            if (certImageLoading) certImageLoading.style.display = 'flex';
            certModalImg.style.display = 'none';

            certModalImg.onload = () => {
              if (certImageLoading) certImageLoading.style.display = 'none';
              certModalImg.style.display = 'block';
            };

            certModalImg.onerror = () => {
              if (certImageLoading) certImageLoading.style.display = 'none';
              certModalImg.style.display = 'none';
              if (certImgFallback) certImgFallback.style.display = 'flex';
            };

            certModalImg.src = safeFileUrl;
            certModalImg.alt = title || 'Certificate';
          }
        } else {
          // PDF document
          if (certModalImg) certModalImg.src = '';
          if (certIframeContainer) certIframeContainer.style.display = 'flex';
          if (certModalIframe) {
            certModalIframe.src = `${safeFileUrl}#toolbar=0&navpanes=0&view=FitH`;
          }
        }
      }

      if (certModal) {
        certModal.classList.add('active');
      }
    }

    function closeCertificateViewer() {
      if (certModal && certModal.classList.contains('active')) {
        certModal.classList.remove('active');
        if (certModalIframe) certModalIframe.src = '';
        if (certModalImg) certModalImg.src = '';
        if (certImageLoading) certImageLoading.style.display = 'none';
        if (certImgFallback) certImgFallback.style.display = 'none';
      }
    }

    document.querySelectorAll('.view-cert-btn').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        openCertificateViewer({
          title: btn.getAttribute('data-title'),
          org: btn.getAttribute('data-org'),
          id: btn.getAttribute('data-id'),
          date: btn.getAttribute('data-date'),
          file: btn.getAttribute('data-file'),
          verifyUrl: btn.getAttribute('data-verify'),
          skills: btn.getAttribute('data-skills'),
        });
      };
    });

    if (closeCertModal) closeCertModal.onclick = closeCertificateViewer;
    if (certModalCloseFooterBtn) certModalCloseFooterBtn.onclick = closeCertificateViewer;
    if (certModal) {
      certModal.onclick = (e) => {
        if (e.target === certModal) closeCertificateViewer();
      };
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && certModal && certModal.classList.contains('active')) {
        closeCertificateViewer();
      }
    });

    // 6d-2. Project Architecture & Sensor Telemetry Viewer Modal
    const projectModal = document.getElementById('projectModal');
    const closeProjectModal = document.getElementById('closeProjectModal');
    const projectModalCloseFooterBtn = document.getElementById('projectModalCloseFooterBtn');
    const projModalCategory = document.getElementById('projModalCategory');
    const projModalTitle = document.getElementById('projModalTitle');
    const projModalOverview = document.getElementById('projModalOverview');
    const projModalDiagram = document.getElementById('projModalDiagram');
    const projModalSpecs = document.getElementById('projModalSpecs');

    const projectDataMap = {
      sih: {
        category: 'SMART GOVERNANCE (SIH 2026) • TEAM LEADER',
        title: 'MPLAD System - Project Guardian',
        overview: 'A premier civic transparency and public fund governance platform engineered for the Members of Parliament Local Area Development Scheme (MPLADS). Developed for Smart India Hackathon 2026 (Problem Statement SIH26102), where Nanthakumar spearheaded the six-member engineering squad (Code Dominators), earning national shortlist distinction. The architecture institutes comprehensive civic accountability, modernizing how multi-crore constituency development funds are allocated, spatially tracked, and audited across Indian parliamentary districts.',
        diagram: `+-------------------------------------------------------------+
|                MPLADS CIVIC GOVERNANCE PIPELINE             |
+-------------------------------------------------------------+
[ Citizen Portal / Mobile ]  --> [ GeoJSON Milestone Telemetry ]
               |                               |
               v                               v
[ React 18 Admin Dashboard ] --> [ FastAPI Python Security Gateway ]
                                               |
                   +---------------------------+---------------------------+
                   |                                                       |
                   v                                                       v
        [ PostgreSQL Master Ledger ]                              [ Anti-Duplication Engine ]
         - Fund allocations (₹15 Cr)                               - Cross-scheme budget diffing
         - Work completion telemetry                               - Contractor collision checks
         - Immutable audit history                                 - Automated civic alerts`,
        specs: [
          { label: 'ROLE & LEADERSHIP', value: 'Team Leader (Squad: Code Dominators)' },
          { label: 'HACKATHON STATUS', value: 'Smart India Hackathon 2026 National Shortlist' },
          { label: 'PROBLEM STATEMENT', value: 'SIH26102 (Civic Fund Governance)' },
          { label: 'FINANCIAL SCOPE', value: '₹15 Crore / MP District Scheme Tracking' },
          { label: 'CORE STACK', value: 'React.js, FastAPI, Python, PostgreSQL, GeoJSON' },
          { label: 'KEY INNOVATION', value: 'Automated Dual-Ledger Fraud & Duplicate Work Prevention' }
        ]
      },
      dom: {
        category: 'APPLIED AI & ADAPTIVE STUDY PLATFORM',
        title: 'DOM - Smart AI Study Companion',
        overview: 'An intelligent educational copilot that ingests student academic materials, syllabus roadmaps, and complex documentation to synthesize structured knowledge maps, automated flashcards, and concept evaluations.',
        diagram: `+-------------------------------------------------------------+
|               DOM AI CONTEXT PROCESSING ENGINE              |
+-------------------------------------------------------------+
[ Syllabus / PDF Ingestion ] --> [ Text Extractor & Normalizer ]
                                                |
                                                v
[ User Query / Study Goal ]  --> [ Context Window Assembly ]
                                                |
                                                v
                                 [ Gemini / LLM Evaluation API ]
                                                |
                   +----------------------------+----------------------------+
                   |                                                         |
                   v                                                         v
        [ Dynamic Knowledge Cards ]                               [ Interactive Quiz Engine ]
         - Markdown formatted notes                                - Adaptive difficulty
         - Memory retention cues                                   - Mistake telemetry & review`,
        specs: [
          { label: 'PROJECT TYPE', value: 'Independent Full-Stack AI Application' },
          { label: 'ARCHITECTURE', value: 'Client Context Orchestration + LLM REST Gateway' },
          { label: 'CORE STACK', value: 'JavaScript ES6+, Modern Semantic HTML5, CSS Grid' },
          { label: 'CORE CAPABILITIES', value: 'Contextual Summarization, Adaptive Flashcards, Quiz Generation' },
          { label: 'DATA PRIVACY', value: 'Zero persistent storage of student documents' }
        ]
      },
      battery: {
        category: 'EMBEDDED IOT & REAL-TIME SENSOR TELEMETRY (STUDENT PROTOTYPE)',
        title: 'ESP32 Battery SOH & Impedance Telemetry',
        overview: 'A hands-on applied student hardware build created to acquire real-time electrochemical health data from Li-Ion battery cells under dynamic load. Computes State-of-Charge (SOC) and internal DC impedance trends using calibrated analog sensor reads.',
        diagram: `+-------------------------------------------------------------+
|             ESP32 BATTERY TELEMETRY HARDWARE FLOW           |
+-------------------------------------------------------------+
[ Li-Ion Cell 3.7V - 4.2V ]
       |             |
       v             v
[ INA219 Current ] [ Precision Resistor Divider ]
[ Sensor (I2C)   ] [ Analog Pin (ADC1)         ]
       |             |
       +------+------+
              |
              v
[ ESP32 NodeMCU (Xtensa 32-bit Dual Core) ]
       |  - 12-bit ADC Sampling (Oversampled 64x)
       |  - Calibrated Voltage Polynomial
       |  - Ohmic Drop Internal Impedance Calculation
       v
[ Local Serial / OLED HUD + HTTP Telemetry Endpoint ]`,
        specs: [
          { label: 'HARDWARE SCOPE', value: 'Applied Student Prototype (Hands-on Lab Rig)' },
          { label: 'MICROCONTROLLER', value: 'ESP32 NodeMCU (Xtensa 32-bit Dual-Core 240MHz)' },
          { label: 'SENSORS USED', value: 'INA219 I2C Current/Power Sensor, Precision Calibrated Divider' },
          { label: 'METRICS TRACKED', value: 'Terminal Voltage (mV), Load Current (mA), DC ESR (mΩ)' },
          { label: 'FIRMWARE ENVIRONMENT', value: 'C++ / Arduino Core with 64x oversampling' }
        ]
      },
      vibration: {
        category: 'INDUSTRIAL SENSOR TELEMETRY (STUDENT PROTOTYPE)',
        title: 'IoT Industrial Motor Vibration & Thermal Node',
        overview: 'A student IoT prototype engineered to monitor induction motor health metrics on the lab testbench. Captures 3-axis acceleration telemetry via MPU6050 and surface temperatures via DS18B20 to flag mechanical unbalance, misalignment, or bearing wear.',
        diagram: `+-------------------------------------------------------------+
|              MOTOR DIAGNOSTIC SENSOR TOPOLOGY               |
+-------------------------------------------------------------+
[ 3-Phase AC Motor Chassis ]
       |                  |
       v                  v
[ MPU6050 Accelerometer ] [ DS18B20 Waterproof 1-Wire ]
[ (3-Axis Vibrational G) ] [ (Thermal Probe Sensor)    ]
       |                  |
       |  I2C (0x68)      |  1-Wire GPIO (DQ)
       +--------+---------+
                |
                v
[ ESP32 Industrial Node Controller ]
       |  - RMS Peak-to-Peak Acceleration Calculation
       |  - Surface Temperature Gradient Tracking
       |  - Edge Threshold Anomaly Flagging (> 2.8g RMS)
       v
[ Serial Diagnostic Stream / HTTP Alert Telemetry ]`,
        specs: [
          { label: 'HARDWARE SCOPE', value: 'Applied Student Prototype (Lab Testbed)' },
          { label: 'CONTROLLER', value: 'ESP32 WiFi / BLE SoC (240MHz)' },
          { label: 'SENSORS USED', value: 'MPU6050 6-DOF IMU (I2C), DS18B20 1-Wire Thermal Probe' },
          { label: 'SAMPLING RATE', value: '200 Hz Ring Buffer with Peak-to-Peak RMS analysis' },
          { label: 'ANOMALY LOGIC', value: 'Vibration envelope trigger & thermal rate-of-rise alert' }
        ]
      },
      portfolio: {
        category: 'FULL-STACK RESILIENT WEB ARCHITECTURE',
        title: 'Executive Cyber Portfolio Web App',
        overview: 'The ultra-responsive, zero-latency portfolio application running this site. Built with a Node.js Express backend, native Web Audio API 8-bit sound synthesis, instant 0ms DOM page transitions, dynamic QR code engine, and cryptographic SHA-256 resume integrity verification.',
        diagram: `+-------------------------------------------------------------+
|            SPA CLIENT-ROUTER & EXPRESS ARCHITECTURE         |
+-------------------------------------------------------------+
[ Browser User ] <--> [ Instant 0ms History DOM Router ]
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
[ Cyber Audio FX Engine ]              [ Command Palette (Ctrl+K) ]
(Web Audio Synthesizer)                (Fuzzy Index: 7 Pages, 5 Projects)
         |                                       |
         +-------------------+-------------------+
                             |
                             v
           [ Node.js / Express Security Gateway ]
                             |
              +--------------+--------------+
              |                             |
              v                             v
    [ Dynamic QR Service ]       [ SHA-256 Resume Verifier ]
    (Real-time Canvas PNG)       (Crypto Hash & Payload Stream)`,
        specs: [
          { label: 'ARCHITECTURE', value: 'Zero-Dependency Vanilla JS SPA + Node.js Express' },
          { label: 'AUDIO SYNTHESIS', value: '100% Native Web Audio API (Synthesized in real-time)' },
          { label: 'SEARCH ENGINE', value: 'Universal Command Palette (Ctrl+K / Cmd+K / /)' },
          { label: 'SECURITY CONTROLS', value: 'Strict CSP, Honeypot Anti-Spam, SHA-256 Checksums' },
          { label: 'DESIGN SYSTEM', value: 'Pixel Cyber HUD (Dark Blue #0a1945, Cyber Cyan, Cyber Orange)' }
        ]
      }
    };

    function openProjectViewer(key) {
      const data = projectDataMap[key];
      if (!data) return;

      if (projModalCategory) projModalCategory.textContent = data.category;
      if (projModalTitle) projModalTitle.textContent = data.title;
      if (projModalOverview) projModalOverview.textContent = data.overview;
      if (projModalDiagram) projModalDiagram.textContent = data.diagram;

      if (projModalSpecs) {
        projModalSpecs.innerHTML = data.specs.map(s => `
          <div class="arch-spec-item">
            <span class="spec-label">${escapeHtml(s.label)}</span>
            <span class="spec-value">${escapeHtml(s.value)}</span>
          </div>
        `).join('');
      }

      if (projectModal) {
        projectModal.classList.add('active');
      }
    }

    function closeProjectViewer() {
      if (projectModal && projectModal.classList.contains('active')) {
        projectModal.classList.remove('active');
      }
    }

    document.querySelectorAll('.view-arch-btn').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-project');
        if (key) openProjectViewer(key);
      };
    });

    if (closeProjectModal) closeProjectModal.onclick = closeProjectViewer;
    if (projectModalCloseFooterBtn) projectModalCloseFooterBtn.onclick = closeProjectViewer;
    if (projectModal) {
      projectModal.onclick = (e) => {
        if (e.target === projectModal) closeProjectViewer();
      };
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && projectModal && projectModal.classList.contains('active')) {
        closeProjectViewer();
      }
    });

    // Check if URL query has ?proj=
    const urlParams = new URLSearchParams(window.location.search);
    const requestedProj = urlParams.get('proj');
    if (requestedProj && projectDataMap[requestedProj]) {
      setTimeout(() => openProjectViewer(requestedProj), 150);
    }

    // Check if URL query has ?cert=
    const requestedCert = urlParams.get('cert');
    if (requestedCert) {
      setTimeout(() => {
        const decoded = decodeURIComponent(requestedCert);
        const btn = document.querySelector(`.view-cert-btn[data-file="${decoded}"]`) || document.querySelector(`.view-cert-btn[data-file*="${decoded}"]`);
        if (btn) btn.click();
      }, 150);
    }

    // 6e. Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const formAlert = document.getElementById('formAlert');
    const submitContactBtn = document.getElementById('submitContactBtn');

    if (contactForm && !contactForm.dataset.bound) {
      contactForm.dataset.bound = 'true';
      contactForm.onsubmit = async (e) => {
        e.preventDefault();

        if (formAlert) {
          formAlert.className = 'form-alert';
          formAlert.textContent = '';
        }

        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const subject = document.getElementById('contactSubject')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();
        const hp_website = document.getElementById('hp_website')?.value.trim();

        if (!name || !email || !message) {
          if (formAlert) {
            formAlert.textContent = 'Please provide your name, valid email, and inquiry message.';
            formAlert.className = 'form-alert error';
          }
          return;
        }

        if (submitContactBtn) {
          submitContactBtn.disabled = true;
          submitContactBtn.textContent = 'Encrypting & Transmitting...';
        }

        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message, hp_website }),
          });

          if (!response.ok) {
            throw new Error('API route unavailable');
          }

          const data = await response.json();

          if (data.success) {
            contactForm.reset();
            if (formAlert) {
              formAlert.textContent = data.message || 'Your inquiry was securely received. Thank you.';
              formAlert.className = 'form-alert success';
            }
            showToast('Message safely delivered to secure inbox.', 'success');
          } else {
            throw new Error(data.error || 'Submission failed');
          }
        } catch (err) {
          // Resilient fallback for static hosting (e.g. GitHub Pages) where Node.js backend is not running
          const subjectText = encodeURIComponent(subject || 'Portfolio Inquiry');
          const bodyText = encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`);
          const mailtoUrl = `mailto:nanthakumar7750@gmail.com?subject=${subjectText}&body=${bodyText}`;
          window.location.href = mailtoUrl;

          if (formAlert) {
            formAlert.textContent = 'Inquiry prepared! Launching your default email client to send directly to nanthakumar7750@gmail.com.';
            formAlert.className = 'form-alert success';
          }
          showToast('Opening email client...', 'success');
        } finally {
          if (submitContactBtn) {
            submitContactBtn.disabled = false;
            submitContactBtn.textContent = 'SEND SECURE MESSAGE';
          }
        }
      };
    }

    // Refresh dynamic data
    loadProfile();
    loadResumeInfo();
    loadQrCode();
  }

  /**
   * 7. Instant Zero-Latency Page Router (Zero Cursor Flicker / Complete Continuity)
   */
  const pageCache = new Map();

  async function instantNavigate(targetUrl, pushState = true) {
    try {
      const urlObj = new URL(targetUrl, window.location.origin);
      const cleanPath = urlObj.pathname.toLowerCase().replace(/\.html$/, '') || '/';

      let htmlText = pageCache.get(cleanPath);

      if (!htmlText) {
        const res = await fetch(cleanPath);
        if (!res.ok) throw new Error('Navigation fetch failed');
        htmlText = await res.text();
        pageCache.set(cleanPath, htmlText);
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const newMain = doc.querySelector('main');
      const currentMain = document.querySelector('main');

      if (newMain && currentMain) {
        currentMain.innerHTML = newMain.innerHTML;
        currentMain.className = newMain.className;
        document.title = doc.title;

        if (pushState) {
          window.history.pushState(null, '', cleanPath);
        }

        window.scrollTo({ top: 0, behavior: 'instant' });
        updateActiveNav();
        closeMobileNav();
        rebindPageComponents();
      } else {
        window.location.href = targetUrl;
      }
    } catch (err) {
      window.location.href = targetUrl;
    }
  }

  // On static hosts (like GitHub Pages), allow native page transitions
  const isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';
  if (!isStaticHost) {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore downloads, external links, api endpoints, certificate/storage files, and anchor hashes
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('/api') ||
        href.includes('/certificates/') ||
        href.includes('certificates/') ||
        href.startsWith('/storage/') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        link.hasAttribute('download') ||
        link.getAttribute('target') === '_blank'
      ) {
        return;
      }

      e.preventDefault();
      instantNavigate(href, true);
    });

    // Handle browser Back / Forward buttons seamlessly
    window.addEventListener('popstate', () => {
      instantNavigate(window.location.pathname, false);
    });

    // Pre-cache primary routes for instant 0ms transitions on click (Dynamic Server only)
    const coreRoutes = ['/', '/about', '/skills', '/certifications', '/projects', '/resume', '/contact'];
    setTimeout(() => {
      coreRoutes.forEach(async (route) => {
        try {
          if (!pageCache.has(route)) {
            const res = await fetch(route);
            if (res.ok) {
              const text = await res.text();
              pageCache.set(route, text);
            }
          }
        } catch (e) {}
      });
    }, 100);
  }

  // Initialize First Run
  updateActiveNav();
  rebindPageComponents();
});
