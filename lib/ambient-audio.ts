export const AMBIENT_AUDIO_SRC = "/ambient.mp3"

export function createAmbientAudio(volume = 0.28): HTMLAudioElement {
  const audio = new Audio(AMBIENT_AUDIO_SRC)
  audio.loop = true
  audio.volume = volume
  audio.preload = "auto"
  audio.muted = true
  void audio.play().catch(() => {})
  return audio
}

export function unlockAmbientAudio(audio: HTMLAudioElement | null) {
  if (!audio) return
  audio.muted = false
  void audio.play().catch(() => {})
}
