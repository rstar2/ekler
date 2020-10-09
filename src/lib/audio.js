const audioContext = new AudioContext();

const buffers = new Map();

/**
 * @param {String} url
 * @return {Promise<ArrayBuffer>}
 */
const loadSound = async url => {
  return fetch(url)
    .then(r => r.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => buffers.set(url, audioBuffer));
};

export const SNAPSHOT = 'audio/snap.wav';

export async function playSound(url) {
  // load if not already
  if (!buffers.has(url)) {
    await loadSound(url);
  }

  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = buffers.get(url);
  audioSource.connect(audioContext.destination);
  audioSource.start(0);
}

// preload these sounds
loadSound(SNAPSHOT);
