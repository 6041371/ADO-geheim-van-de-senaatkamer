function tone(frequency: number, start: number, duration: number, type: OscillatorType) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + duration + 0.02);
  oscillator.onended = () => void context.close();
}

export function playCorrect() {
  tone(660, 0, 0.12, "sine");
  tone(880, 0.1, 0.18, "sine");
}

export function playDenied() {
  tone(196, 0, 0.22, "triangle");
}

export function playUnlocked() {
  tone(523, 0, 0.14, "sine");
  tone(659, 0.12, 0.14, "sine");
  tone(784, 0.24, 0.28, "sine");
}
