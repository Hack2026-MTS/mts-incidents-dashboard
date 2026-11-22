class SoundAlert {
  private ctx: AudioContext | null = null
  public enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlock()
      }
      window.addEventListener('click', unlock, { passive: true })
      window.addEventListener('keydown', unlock, { passive: true })
      window.addEventListener('touchstart', unlock, { passive: true })
    }
  }

  public unlock() {
    try {
      this.initCtx()
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
    } catch {
      // ignore
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  private async ensureRunning(): Promise<AudioContext | null> {
    const ctx = this.initCtx()
    if (!ctx) return null
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // user hasn't clicked yet
      }
    }
    return ctx
  }

  // Dual-tone urgent emergency siren (Critical Alert)
  public async playCriticalAlert() {
    if (!this.enabled) return
    try {
      const ctx = await this.ensureRunning()
      if (ctx && ctx.state === 'running') {
        const now = ctx.currentTime + 0.05
        // Alternating high-low alarm
        this.playTone(ctx, 920, now, 0.16, 'triangle', 0.25)
        this.playTone(ctx, 680, now + 0.18, 0.16, 'triangle', 0.25)
        this.playTone(ctx, 920, now + 0.36, 0.22, 'triangle', 0.3)
      } else {
        // Fallback to synthesized beep audio
        this.playFallbackBeep(880, 250)
      }
    } catch (e) {
      console.warn('[Audio] playCriticalAlert error:', e)
      this.playFallbackBeep(880, 250)
    }
  }

  // Soft double chime (Coordinator Alert)
  public async playCoordinatorAlert() {
    if (!this.enabled) return
    try {
      const ctx = await this.ensureRunning()
      if (ctx && ctx.state === 'running') {
        const now = ctx.currentTime + 0.05
        this.playTone(ctx, 587.33, now, 0.12, 'sine', 0.2) // D5
        this.playTone(ctx, 880, now + 0.14, 0.22, 'sine', 0.25) // A5
      } else {
        this.playFallbackBeep(600, 150)
      }
    } catch (e) {
      console.warn('[Audio] playCoordinatorAlert error:', e)
      this.playFallbackBeep(600, 150)
    }
  }

  // Pleasant resolution chime
  public async playResolvedAlert() {
    if (!this.enabled) return
    try {
      const ctx = await this.ensureRunning()
      if (ctx && ctx.state === 'running') {
        const now = ctx.currentTime + 0.05
        this.playTone(ctx, 523.25, now, 0.1, 'sine', 0.18) // C5
        this.playTone(ctx, 659.25, now + 0.11, 0.1, 'sine', 0.18) // E5
        this.playTone(ctx, 783.99, now + 0.22, 0.25, 'sine', 0.22) // G5
      }
    } catch {
      // ignore
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    vol = 0.25
  ) {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(vol, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    } catch (err) {
      console.warn('[Audio] playTone error:', err)
    }
  }

  // Base64 WAV fallback beep for browsers restricting AudioContext
  private playFallbackBeep(freq: number, durationMs: number) {
    try {
      // Quick tone generator using data URI
      const sampleRate = 8000
      const numSamples = Math.floor((sampleRate * durationMs) / 1000)
      const buffer = new Uint8Array(44 + numSamples)

      // RIFF header
      buffer.set([0x52, 0x49, 0x46, 0x46]) // "RIFF"
      const fileSize = 36 + numSamples
      buffer[4] = fileSize & 0xff
      buffer[5] = (fileSize >> 8) & 0xff
      buffer[6] = (fileSize >> 16) & 0xff
      buffer[7] = (fileSize >> 24) & 0xff
      buffer.set([0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20], 8) // "WAVEfmt "
      buffer.set([16, 0, 0, 0, 1, 0, 1, 0], 16) // SubChunk1Size, AudioFormat(PCM), NumChannels(1)
      buffer[24] = sampleRate & 0xff
      buffer[25] = (sampleRate >> 8) & 0xff
      buffer[28] = sampleRate & 0xff
      buffer[29] = (sampleRate >> 8) & 0xff
      buffer.set([1, 0, 8, 0], 32) // BlockAlign(1), BitsPerSample(8)
      buffer.set([0x64, 0x61, 0x74, 0x61], 36) // "data"
      buffer[40] = numSamples & 0xff
      buffer[41] = (numSamples >> 8) & 0xff

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const sample = Math.sin(2 * Math.PI * freq * t)
        buffer[44 + i] = Math.floor((sample + 1) * 127.5)
      }

      let binary = ''
      for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i])
      }
      const base64 = btoa(binary)
      const audio = new Audio('data:audio/wav;base64,' + base64)
      audio.volume = 0.4
      audio.play().catch(() => {})
    } catch {
      // ignore
    }
  }
}

export const soundAlert = new SoundAlert()
