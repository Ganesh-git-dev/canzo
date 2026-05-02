/* ============================================
   CANZO - Real-Time Clock Component
   Analog clock that renders inside the "O" of Canzo logo
   Updates every second
   ============================================ */

(function() {
    const clockContainers = document.querySelectorAll('.canzo-clock');

    if (clockContainers.length === 0) return;

    clockContainers.forEach(container => {
        const size = container.dataset.size || 'large';
        const clockSize = size === 'small' ? 50 : 100;
        const clockRadius = clockSize * 0.3;
        const centerX = clockSize / 2;
        const centerY = clockSize / 2;

        const hourLen = clockRadius * 0.53;
        const minuteLen = clockRadius * 0.8;
        const secondLen = clockRadius * 0.93;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${clockSize} ${clockSize}`);
        svg.classList.add('canzo-clock-svg');
        if (size === 'small') {
            svg.style.width = '100%';
            svg.style.height = '100%';
        }

        // Generate hour tick marks
        let tickMarks = '';
        for (let i = 0; i < 12; i++) {
            const tickAngle = (i / 12) * 360 * Math.PI / 180;
            const tickOuter = clockRadius - 2;
            const tickInner = clockRadius - 5;
            const x1 = centerX + tickOuter * Math.sin(tickAngle);
            const y1 = centerY - tickOuter * Math.cos(tickAngle);
            const x2 = centerX + tickInner * Math.sin(tickAngle);
            const y2 = centerY - tickInner * Math.cos(tickAngle);
            tickMarks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round"/>`;
        }

        svg.innerHTML = `
            <circle cx="${centerX}" cy="${centerY}" r="${clockRadius}" fill="#ffffff" class="canzo-clock-face"/>
            <circle cx="${centerX}" cy="${centerY}" r="${clockRadius}" fill="none" stroke="rgba(0, 0, 0, 0.1)" stroke-width="1" class="canzo-clock-border"/>
            ${tickMarks}
            <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${centerY}" stroke="#2d3748" stroke-width="${clockRadius * 0.17}" stroke-linecap="round" class="canzo-clock-hour"/>
            <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${centerY}" stroke="#2d3748" stroke-width="${clockRadius * 0.12}" stroke-linecap="round" class="canzo-clock-minute"/>
            <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${centerY}" stroke="#e8a838" stroke-width="${clockRadius * 0.05}" stroke-linecap="round" class="canzo-clock-second"/>
            <circle cx="${centerX}" cy="${centerY}" r="${clockRadius * 0.1}" fill="#2d3748" class="canzo-clock-center"/>
        `;

        container.appendChild(svg);

        const hourHand = svg.querySelector('.canzo-clock-hour');
        const minuteHand = svg.querySelector('.canzo-clock-minute');
        const secondHand = svg.querySelector('.canzo-clock-second');

        function updateClock() {
            const now = new Date();
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;
            const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
            const secondDeg = (seconds / 60) * 360;

            const hourRad = hourDeg * Math.PI / 180;
            const minuteRad = minuteDeg * Math.PI / 180;
            const secondRad = secondDeg * Math.PI / 180;

            hourHand.setAttribute('x2', centerX + hourLen * Math.sin(hourRad));
            hourHand.setAttribute('y2', centerY - hourLen * Math.cos(hourRad));

            minuteHand.setAttribute('x2', centerX + minuteLen * Math.sin(minuteRad));
            minuteHand.setAttribute('y2', centerY - minuteLen * Math.cos(minuteRad));

            secondHand.setAttribute('x2', centerX + secondLen * Math.sin(secondRad));
            secondHand.setAttribute('y2', centerY - secondLen * Math.cos(secondRad));
        }

        updateClock();
        setInterval(updateClock, 1000);
    });
})();
