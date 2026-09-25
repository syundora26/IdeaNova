/** P1 step order, W1 stroke lengths, B3 meteor. The CSS in motion.css does the drawing. */
export function setupDecor(): void {
  document.querySelectorAll<HTMLElement>('.step').forEach((step, i) => step.style.setProperty('--seq', String(i)));
  document.querySelectorAll<SVGGeometryElement>('.work__thumb svg :is(path, ellipse)').forEach((shape) => {
    shape.style.setProperty('--len', String(Math.ceil(shape.getTotalLength())));
  });
  meteor();
}

/** B3: one thin streak in the fixed background, same angle/band as the meteor painted in starfield.webp. */
function meteor(): void {
  const universe = document.querySelector('.universe');
  if (!universe) return;
  const streak = document.createElement('i');
  streak.className = 'meteor';
  universe.appendChild(streak);
  let timer = 0;
  function schedule(minSeconds: number): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(shoot, (minSeconds + Math.random() * 10) * 1000);
  }
  function shoot(): void {
    streak.style.left = `${60 + Math.random() * 36}%`;
    streak.style.top = `${3 + Math.random() * 15}%`;
    streak.classList.remove('is-on');
    void streak.offsetWidth; // restart the one-shot animation
    streak.classList.add('is-on');
    schedule(14); // next one in 14-24s
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer); else schedule(14);
  });
  // never within the first 5s after load
  if (document.readyState === 'complete') schedule(5);
  else window.addEventListener('load', () => schedule(5), { once: true });
}
