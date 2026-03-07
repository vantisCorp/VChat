/**
 * 🥚 Easter Egg Module
 * 
 * This module contains fun Easter Eggs for curious developers.
 * If you're reading this, you've found one already!
 * 
 * @module easter-eggs
 * @secret The cake is a lie, but the encryption is real.
 */

// Hidden message encoded in ASCII
export const SECRET_MESSAGE = [86, 45, 67, 79, 77, 77].map(c => String.fromCharCode(c)).join('');

// The Konami Code sequence for frontend Easter Eggs
export const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 
  'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 
  'ArrowLeft', 'ArrowRight', 
  'KeyB', 'KeyA'
];

// Hidden feature flags (shhh!)
export const HIDDEN_FLAGS = {
  // Enable retro mode
  retro: 'VCOMM_RETRO_MODE',
  // Enable matrix rain
  matrix: 'VCOMM_MATRIX_RAIN',
  // Enable rainbow theme
  rainbow: 'VCOMM_RAINBOW_TIME',
  // Enable ghost mode (invisible)
  ghost: 'VCOMM_GHOST_MODE',
};

/**
 * Check if the user has discovered the secret
 * @param input - The user's input
 * @returns A special message if correct
 */
export function checkSecret(input: string): string | null {
  const secrets: Record<string, string> = {
    'konami': '🎮 You entered the Konami code! Achievement unlocked.',
    'matrix': '💊 Take the red pill. Follow the white rabbit.',
    'vcomm': '🔐 Welcome to V-COMM, secure communicator.',
    'rust': '🦀 Rust: The language of secure systems.',
    'crypto': '🔒 Cryptography is not magic, but it\'s close.',
  };
  
  const lowerInput = input.toLowerCase().trim();
  return secrets[lowerInput] || null;
}

/**
 * Generate a random Easter Egg fact
 */
export function getRandomFact(): string {
  const facts = [
    '🥚 The first computer bug was an actual bug - a moth found in a Harvard Mark II in 1947.',
    '🔐 The first message sent over the internet was "LO" - they were trying to type "LOGIN".',
    '🦀 Rust was named after the rust fungus, not oxidation.',
    '📱 The first smartphone was released in 1992, 15 years before the iPhone.',
    '💾 A 5.25" floppy disk could hold 1.2MB. Today, you can fit 100,000+ of those on a thumbnail-sized SD card.',
    '🌐 The first website is still online: info.cern.ch',
    '🎮 The Konami Code was created by Kazuhisa Hashimoto for testing purposes.',
    '🔐 The Caesar cipher was used by Julius Caesar to communicate with his generals.',
    '🦀 Ferris the crab is the unofficial mascot of Rust.',
    '📡 The first satellite, Sputnik 1, transmitted a simple beep signal.',
  ];
  
  return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Decode a hidden message
 */
export function decodeHidden(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return 'Invalid encoded message';
  }
}

/**
 * Easter Egg: Generate ASCII art
 */
export function getASCIIArt(): string {
  return `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗   ██╗ █████╗ ██████╗ ██████╗ ███████╗██╗               ║
║   ██║   ██║██╔══██╗██╔══██╗██╔══██╗██╔════╝██║               ║
║   ██║   ██║███████║██████╔╝██████╔╝███████╗██║               ║
║   ╚██╗ ██╔╝██╔══██║██╔══██╗██╔══██╗╚════██║██║               ║
║    ╚████╔╝ ██║  ██║██║  ██║██████╔╝███████║██║               ║
║     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝               ║
║                                                               ║
║              Secure Communication Platform                    ║
║                                                               ║
║         "The only secure system is one that is                ║
║          powered off, encased in concrete,                    ║
║          and sealed in a lead-lined room"                     ║
║                                      - Eugene H. Spafford     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
}

// Shh... this is a secret
export const _SECRET = {
  hint: 'Look at the first letter of each property name in this object',
  hidden: 'You found the hidden message!',
  another: 'Congratulations, curious developer!',
  nested: {
    treasure: '🏆 You have achieved: Master Easter Egg Hunter',
  },
  ultimate: 'The real treasure was the friends we made along the way.',
};