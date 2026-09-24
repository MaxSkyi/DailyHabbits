import confetti from 'canvas-confetti';

/**
 * Triggers a premium multi-burst celebratory confetti animation
 * when all daily habits are completed.
 */
export function triggerCelebrationConfetti(): void {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // 1. Initial central burst (Emerald, Teal, Gold, Violet, Rose)
  fire(0.25, {
    spread: 30,
    startVelocity: 55,
    colors: ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#34D399', '#38BDF8', '#FBBF24', '#A78BFA'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#10B981', '#6EE7B7', '#FDE047', '#C084FC'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    shapes: ['circle'],
    colors: ['#FFD700', '#10B981', '#38BDF8'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#10B981', '#34D399', '#F59E0B', '#EC4899'],
  });

  // 2. Secondary side cannons (left & right) after 250ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      zIndex: 9999,
      colors: ['#10B981', '#06B6D4', '#F59E0B'],
    });

    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      zIndex: 9999,
      colors: ['#10B981', '#8B5CF6', '#EC4899'],
    });
  }, 250);
}
