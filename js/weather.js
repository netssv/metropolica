// ── WEATHER & DAY/NIGHT ENGINE ──

let currentWeather = 'clear'; // 'clear', 'rain', 'fog'
let weatherTimer = 0;

function getAmbientLighting(t) {
  // Day/Night cycle = 120 seconds per full day (0..120)
  const cycle = 120;
  const timeInDay = (t % cycle) / cycle; // 0..1

  let alpha = 0;
  let tintColor = 'rgba(0,0,0,0)';
  let isNight = false;

  // Sun position angle for shadows (-1..1)
  const sunAngleX = Math.cos(timeInDay * Math.PI * 2);
  const sunAngleY = Math.sin(timeInDay * Math.PI * 2);

  if (timeInDay < 0.15) {
    // Dawn / Amanecer (0..18s)
    const factor = timeInDay / 0.15;
    alpha = 0.35 * (1 - factor);
    tintColor = `rgba(249, 115, 22, ${0.2 * (1 - factor)})`;
  } else if (timeInDay >= 0.15 && timeInDay < 0.55) {
    // Day / Día pleno (18s..66s)
    alpha = 0;
    tintColor = 'rgba(0,0,0,0)';
  } else if (timeInDay >= 0.55 && timeInDay < 0.65) {
    // Sunset / Atardecer (66s..78s)
    const factor = (timeInDay - 0.55) / 0.1;
    alpha = 0.25 * factor;
    tintColor = `rgba(239, 68, 68, ${0.25 * factor})`;
  } else {
    // Night / Noche (78s..120s)
    isNight = true;
    const factor = (timeInDay - 0.65) / 0.35;
    alpha = 0.52;
    tintColor = 'rgba(5, 10, 24, 0.52)';
  }

  return { alpha, tintColor, isNight, timeInDay, sunAngleX, sunAngleY };
}

function drawWeatherOverlay(ctx, cw, ch, t) {
  weatherTimer += 0.016;
  if (weatherTimer > 30) {
    weatherTimer = 0;
    const weathers = ['clear', 'clear', 'rain', 'fog'];
    currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
  }

  if (currentWeather === 'rain') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 1.2;
    const drops = 120;
    for (let i = 0; i < drops; i++) {
      const rx = (Math.sin(i * 99 + t * 5) * 0.5 + 0.5) * cw;
      const ry = ((i * 37 + t * 900) % ch);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 16);
      ctx.stroke();
    }
    ctx.restore();
  } else if (currentWeather === 'fog') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fogAlpha = 0.18 + 0.06 * Math.sin(t * 1.5);
    ctx.fillStyle = `rgba(203, 213, 225, ${fogAlpha})`;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }
}
