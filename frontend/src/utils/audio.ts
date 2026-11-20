class SoundAlert {
  private ctx: AudioContext | null = null
  public enabled = true

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public playCriticalAlert() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      // High-low alarm pattern
      this.playTone(880, now, 0.15, 'triangle')
      this.playTone(660, now + 0.16, 0.15, 'triangle')
      this.playTone(880, now + 0.32, 0.25, 'triangle')
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }

  public playCoordinatorAlert() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      // Soft double chime
      this.playTone(523.25, now, 0.12, 'sine') // C5
      this.playTone(659.25, now + 0.13, 0.18, 'sine') // E5
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }

  private playTone(freq: number, startTime: number, duration: number, type: OscillatorType) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    gain.gain.setValueAtTime(0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }
}

export const soundAlert = new SoundAlert()
