/* ============================================
   CANZO - Fluid Cursor Animation
   Canvas-based fluid trail with purple gradient
   Distorts nearby pixels subtly
   ============================================ */

(function() {
    // Check if not mobile
    if (window.innerWidth <= 768) return;

    // Create canvas for fluid trail
    const canvas = document.createElement('canvas');
    canvas.className = 'cursor-fluid';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Cursor elements
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    const cursorRing = document.createElement('div');
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorRing);

    // Hide default cursor
    document.body.style.cursor = 'none';

    // Trail points
    const trailPoints = [];
    const maxTrail = 25;

    // Mouse position
    let mouseX = -100;
    let mouseY = -100;
    let isHovering = false;

    // Track mouse
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Add to trail
        trailPoints.push({
            x: mouseX,
            y: mouseY,
            age: 0,
            radius: 20 + Math.random() * 10
        });

        if (trailPoints.length > maxTrail) {
            trailPoints.shift();
        }
    });

    // Hover detection
    const interactiveElements = document.querySelectorAll('a, button, .menu-item-add, .menu-category-btn, .canteen-card, .feature-card, .benefit-card, .testimonial-card, .order-card, .cart-qty-btn, .stat-card, .content-card');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            isHovering = true;
            cursorGlow.classList.add('hover');
            cursorRing.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            isHovering = false;
            cursorGlow.classList.remove('hover');
            cursorRing.classList.remove('hover');
        });
    });

    // Animation loop
    let animFrame;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update trail points
        for (let i = trailPoints.length - 1; i >= 0; i--) {
            const p = trailPoints[i];
            p.age++;
            p.radius *= 0.96;

            if (p.age > 40 || p.radius < 5) {
                trailPoints.splice(i, 1);
                continue;
            }

            // Draw fluid blob
            const alpha = (1 - p.age / 40) * 0.15;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            gradient.addColorStop(0, `rgba(124, 58, 237, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(109, 40, 217, ${alpha * 0.6})`);
            gradient.addColorStop(1, 'rgba(92, 34, 180, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw connecting fluid between points
        if (trailPoints.length > 2) {
            ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(trailPoints[0].x, trailPoints[0].y);

            for (let i = 1; i < trailPoints.length - 1; i++) {
                const xc = (trailPoints[i].x + trailPoints[i + 1].x) / 2;
                const yc = (trailPoints[i].y + trailPoints[i + 1].y) / 2;
                ctx.quadraticCurveTo(trailPoints[i].x, trailPoints[i].y, xc, yc);
            }
            ctx.stroke();
        }

        // Update cursor glow position (smooth follow)
        cursorGlow.style.left = mouseX + 'px';
        cursorGlow.style.top = mouseY + 'px';

        // Update cursor ring position (slight delay)
        cursorRing.style.left = mouseX + 'px';
        cursorRing.style.top = mouseY + 'px';

        animFrame = requestAnimationFrame(animate);
    }

    animate();

    // Click effect - ripple
    document.addEventListener('click', (e) => {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const radius = 30 + Math.random() * 20;
            trailPoints.push({
                x: e.clientX + Math.cos(angle) * radius,
                y: e.clientY + Math.sin(angle) * radius,
                age: 0,
                radius: 15 + Math.random() * 10
            });
        }
    });

    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrame);
        } else {
            animate();
        }
    });
})();
