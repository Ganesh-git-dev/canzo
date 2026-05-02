/* ============================================
   CANZO - Loading Screen Animation
   Clock alone zoomed in → "O" builds around it → full logo
   ============================================ */

(function() {
    localStorage.removeItem('canzo_visited');

    if (localStorage.getItem('canzo_visited')) {
        return;
    }

    const savedTheme = localStorage.getItem('canzo_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    const loadingHTML = `
        <div class="loading-screen" id="loadingScreen">
            <div class="loading-bg-orb loading-bg-orb--1"></div>
            <div class="loading-bg-orb loading-bg-orb--2"></div>
            <div class="loading-bg-orb loading-bg-orb--3"></div>
            <div class="loading-bg-orb loading-bg-orb--4"></div>
            <div class="loading-logo-wrapper">
                <div class="loading-clock-standalone" id="loadingClockStandalone"></div>
                <div class="loading-logo-container" id="loadingLogoContainer">
                    <img src="https://canzo.in/assets/image/canzo official logo.png" alt="Canzo" class="loading-logo">
                    <div class="loading-clock" id="loadingClock"></div>
                </div>
            </div>
            <div class="loading-percentage">Loading <span id="loadingPercentText">0%</span></div>
            <div class="loading-bar-container">
                <div class="loading-bar" id="loadingBar"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
    document.body.style.overflow = 'hidden';

    const loadingScreen = document.getElementById('loadingScreen');
    const loadingWrapper = loadingScreen.querySelector('.loading-logo-wrapper');
    const loadingClockStandalone = document.getElementById('loadingClockStandalone');
    const loadingLogoContainer = document.getElementById('loadingLogoContainer');
    const loadingPercentText = document.getElementById('loadingPercentText');
    const loadingBar = document.getElementById('loadingBar');
    const loadingBubbles = loadingScreen.querySelectorAll('.loading-bg-orb');

    // Build clock SVG
    function buildClockSVG(container) {
        const size = 100;
        const r = size * 0.3;
        const cx = size / 2;
        const cy = size / 2;
        const hLen = r * 0.53;
        const mLen = r * 0.8;
        const sLen = r * 0.93;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.style.width = '100%';
        svg.style.height = '100%';

        let ticks = '';
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * 360 * Math.PI / 180;
            const o = r - 2, inn = r - 5;
            ticks += `<line x1="${cx + o * Math.sin(a)}" y1="${cy - o * Math.cos(a)}" x2="${cx + inn * Math.sin(a)}" y2="${cy - inn * Math.cos(a)}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round"/>`;
        }

        svg.innerHTML = `
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
            ${ticks}
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#2d3748" stroke-width="${r * 0.17}" stroke-linecap="round" class="ch"/>
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#2d3748" stroke-width="${r * 0.12}" stroke-linecap="round" class="cm"/>
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#e8a838" stroke-width="${r * 0.05}" stroke-linecap="round" class="cs"/>
            <circle cx="${cx}" cy="${cy}" r="${r * 0.1}" fill="#2d3748"/>
        `;

        container.appendChild(svg);
        return {
            h: svg.querySelector('.ch'),
            m: svg.querySelector('.cm'),
            s: svg.querySelector('.cs'),
            cx, cy, hLen, mLen, sLen
        };
    }

    const standClock = buildClockSVG(loadingClockStandalone);
    const logoClock = buildClockSVG(document.getElementById('loadingClock'));

    function tick(clk) {
        const now = new Date();
        const h = now.getHours() % 12;
        const m = now.getMinutes();
        const s = now.getSeconds();
        const hA = ((h / 12) * 360 + (m / 60) * 30) * Math.PI / 180;
        const mA = ((m / 60) * 360 + (s / 60) * 6) * Math.PI / 180;
        const sA = ((s / 60) * 360) * Math.PI / 180;
        clk.h.setAttribute('x2', clk.cx + clk.hLen * Math.sin(hA));
        clk.h.setAttribute('y2', clk.cy - clk.hLen * Math.cos(hA));
        clk.m.setAttribute('x2', clk.cx + clk.mLen * Math.sin(mA));
        clk.m.setAttribute('y2', clk.cy - clk.mLen * Math.cos(mA));
        clk.s.setAttribute('x2', clk.cx + clk.sLen * Math.sin(sA));
        clk.s.setAttribute('y2', clk.cy - clk.sLen * Math.cos(sA));
    }

    tick(standClock);
    tick(logoClock);
    const interval = setInterval(() => { tick(standClock); tick(logoClock); }, 1000);

    // Initialize bubbles as hidden
    loadingBubbles.forEach(b => { b.style.opacity = '0'; b.style.transition = 'opacity 0.6s ease'; });

    const duration = 4000;
    const start = Date.now();

    function ease(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate() {
        const p = Math.min((Date.now() - start) / duration, 1);
        const e = ease(p);

        loadingPercentText.textContent = Math.round(e * 100) + '%';
        loadingBar.style.width = Math.round(e * 100) + '%';

        // Phase 1 (0-30%): clock alone, 8x → 2.1x at center
        if (p < 0.3) {
            const t = p / 0.3;
            const et = ease(t);
            const scale = 8 + (2.1 - 8) * et;
            loadingWrapper.style.transform = 'scale(1)';
            loadingClockStandalone.style.transform = `scale(${scale})`;
            loadingClockStandalone.style.opacity = '1';
            loadingLogoContainer.style.opacity = '0';
            loadingLogoContainer.style.clipPath = 'inset(0 0 0 100%)';

        // Phase 2 (30-60%): clock moves to "O" position, 2.1x → 0.85x
        } else if (p < 0.6) {
            const t = (p - 0.3) / 0.3;
            const et = 1 - Math.pow(1 - t, 4);
            const scale = 2.1 + (0.85 - 2.1) * et;
            const moveX = et * 290;
            loadingWrapper.style.transform = 'scale(1)';
            loadingClockStandalone.style.transform = `scale(${scale}) translateX(${moveX}px) translateY(${et * -12}px)`;
            loadingLogoContainer.style.opacity = '0';
            loadingLogoContainer.style.clipPath = 'inset(0 0 0 100%)';

        // Phase 3 (60-65%): clock settled, brief pause
        } else if (p < 0.65) {
            loadingWrapper.style.transform = 'scale(1)';
            loadingClockStandalone.style.transform = 'scale(0.85) translateX(290px) translateY(-12px)';
            loadingLogoContainer.style.opacity = '0';
            loadingLogoContainer.style.clipPath = 'inset(0 0 0 100%)';

        // Phase 4 (65-85%): logo reveals from clock position right-to-left, piece by piece
        } else if (p < 0.85) {
            const t = (p - 0.65) / 0.2;
            // Fast initial reveal around clock, then slower sweep left
            const reveal = t < 0.2 ? t / 0.2 * 0.15 : 0.15 + (t - 0.2) / 0.8 * 0.85;
            loadingWrapper.style.transform = 'scale(1)';
            loadingClockStandalone.style.transform = 'scale(0.85) translateX(290px) translateY(-12px)';
            loadingLogoContainer.style.opacity = '1';
            loadingLogoContainer.style.clipPath = `inset(0 0 0 ${100 - reveal * 100}%)`;

        // Phase 5 (85-100%): lock in place, zoom to 150%, bubbles fade in
        } else {
            const t = (p - 0.85) / 0.15;
            const et = ease(t);
            loadingWrapper.style.transform = `scale(${1 + et * 0.5})`;
            loadingClockStandalone.style.transform = 'scale(0.85) translateX(290px) translateY(-12px)';
            loadingLogoContainer.style.opacity = '1';
            loadingLogoContainer.style.clipPath = 'inset(0 0 0 0)';
            // Bubbles fade in
            loadingBubbles.forEach((b, i) => {
                b.style.opacity = String(et);
                b.style.transitionDelay = `${i * 0.08}s`;
            });
        }

        if (p < 1) {
            requestAnimationFrame(animate);
        } else {
            loadingClockStandalone.style.transform = 'scale(0.85) translateX(290px) translateY(-12px)';
            loadingPercentText.textContent = '100%';
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingScreen.classList.add('exiting');
                clearInterval(interval);
                document.body.style.overflow = '';
                setTimeout(() => {
                    loadingScreen.remove();
                    localStorage.setItem('canzo_visited', 'true');
                }, 600);
            }, 400);
        }
    }

    requestAnimationFrame(animate);
})();
