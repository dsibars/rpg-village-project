import os
import math
import struct
import random

# Ensure output directory exists
OUTPUT_DIR = "public/assets/sounds"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SAMPLE_RATE = 44100

def write_wav(filename, duration, sample_rate, wave_func):
    """
    Writes a mono 16-bit WAV file.
    wave_func is a function taking time t (seconds) and returning a amplitude (-1.0 to 1.0)
    """
    filepath = os.path.join(OUTPUT_DIR, filename)
    num_samples = int(duration * sample_rate)
    
    with open(filepath, "wb") as f:
        # RIFF Header
        f.write(b"RIFF")
        # File size placeholder (will write later)
        f.write(struct.pack("<I", 36 + num_samples * 2))
        f.write(b"WAVE")
        
        # Format chunk
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))  # Chunk size
        f.write(struct.pack("<H", 1))   # Audio format (1 = PCM)
        f.write(struct.pack("<H", 1))   # Number of channels (1 = Mono)
        f.write(struct.pack("<I", sample_rate))  # Sample rate
        f.write(struct.pack("<I", sample_rate * 2))  # Byte rate (Sample rate * block align)
        f.write(struct.pack("<H", 2))   # Block align (channels * bytes per sample)
        f.write(struct.pack("<H", 16))  # Bits per sample (16)
        
        # Data chunk
        f.write(b"data")
        f.write(struct.pack("<I", num_samples * 2))  # Data size
        
        # Write audio frames
        for i in range(num_samples):
            t = i / sample_rate
            sample = wave_func(t)
            # Clip sample to [-1.0, 1.0]
            sample = max(-1.0, min(1.0, sample))
            # Convert to 16-bit signed integer
            int_val = int(sample * 32767)
            f.write(struct.pack("<h", int_val))
            
    print(f"Generated: {filepath} ({duration:.2f}s)")

# Envelope utilities
def adsr(t, duration, attack=0.01, decay=0.1, sustain=0.8, release=0.1):
    """ADSR Envelope function returning a multiplier between 0.0 and 1.0"""
    if t < 0 or t > duration:
        return 0.0
    
    if t < attack:
        return t / attack
    
    t_after_attack = t - attack
    if t_after_attack < decay:
        # Fade from 1.0 to sustain
        return 1.0 - (1.0 - sustain) * (t_after_attack / decay)
    
    t_after_decay = t_after_attack - decay
    release_start = duration - release
    
    if t < release_start:
        return sustain
    
    t_after_release_start = t - release_start
    if t_after_release_start < release:
        # Fade from sustain to 0.0
        return sustain * (1.0 - t_after_release_start / release)
    
    return 0.0

# Sound generators
def gen_ui_click():
    def synth(t):
        env = adsr(t, 0.05, attack=0.002, decay=0.04, sustain=0.0, release=0.008)
        # Soft click using a high pitch sine with minor FM modulation for warmth
        freq = 1100
        mod_freq = 250
        mod_index = 0.3
        val = math.sin(2 * math.pi * freq * t + mod_index * math.sin(2 * math.pi * mod_freq * t))
        return val * env
    write_wav("ui_click.wav", 0.05, SAMPLE_RATE, synth)

def gen_battle_start():
    def synth(t):
        duration = 1.0
        env = adsr(t, duration, attack=0.4, decay=0.2, sustain=0.6, release=0.4)
        
        # Deep swell pitch rising from 70Hz to 160Hz
        freq = 70 + 90 * (t / duration)
        
        # FM modulation to make it a rich brassy horn-like drone
        mod_freq = freq * 1.5
        mod_index = 2.0 * env  # richer harmonics as it gets louder
        
        # Add a sub-bass sine wave for thickness
        sub_bass = math.sin(2 * math.pi * (freq / 2.0) * t) * 0.4
        lead = math.sin(2 * math.pi * freq * t + mod_index * math.sin(2 * math.pi * mod_freq * t)) * 0.6
        
        return (lead + sub_bass) * env * 0.8
    write_wav("battle_start.wav", 1.0, SAMPLE_RATE, synth)

def gen_hit_physical():
    # Simple low pass filter state
    lp_state = [0.0]
    def synth(t):
        env = adsr(t, 0.22, attack=0.003, decay=0.12, sustain=0.0, release=0.1)
        
        # Thump: pitch slides from 140Hz down to 45Hz
        freq = 140 - 95 * min(1.0, t / 0.15)
        thump = math.sin(2 * math.pi * freq * t)
        
        # Noise burst for impact crack
        noise = random.uniform(-1.0, 1.0)
        # Low pass filter the noise for impact weight
        lp_state[0] = lp_state[0] + 0.15 * (noise - lp_state[0])
        
        return (thump * 0.5 + lp_state[0] * 0.5) * env * 0.9
    write_wav("hit_physical.wav", 0.22, SAMPLE_RATE, synth)

def gen_hit_magic():
    def synth(t):
        env = adsr(t, 0.4, attack=0.01, decay=0.15, sustain=0.2, release=0.2)
        
        # Rapid sweeping pitches: sine 800Hz to 1600Hz
        freq = 800 + 800 * (t / 0.4)
        
        # Shimmer vibrato (8Hz)
        vib = math.sin(2 * math.pi * 8 * t) * 15
        
        # FM modulation for glass/crystal texture
        mod_freq = freq * 2.1
        mod_index = 1.5
        
        sig1 = math.sin(2 * math.pi * (freq + vib) * t + mod_index * math.sin(2 * math.pi * mod_freq * t))
        
        # Add high-pitch ring modulation chime
        chime_freq = 2400 * (1 - t / 0.4)
        sig2 = math.sin(2 * math.pi * chime_freq * t) * 0.3
        
        return (sig1 * 0.7 + sig2 * 0.3) * env * 0.7
    write_wav("hit_magic.wav", 0.4, SAMPLE_RATE, synth)

def gen_heal():
    def synth(t):
        duration = 0.8
        env = adsr(t, duration, attack=0.15, decay=0.2, sustain=0.5, release=0.3)
        
        # Ascending frequencies
        base_freq = 350 + 400 * (t / duration)
        
        # Shimmer vibrato
        vib = math.sin(2 * math.pi * 12 * t) * 8
        
        # Multi-voice chord for warm harmony: C-major feeling
        voice1 = math.sin(2 * math.pi * (base_freq + vib) * t) * 0.5
        voice2 = math.sin(2 * math.pi * (base_freq * 1.25 + vib) * t) * 0.3  # Major Third
        voice3 = math.sin(2 * math.pi * (base_freq * 1.5 + vib) * t) * 0.2   # Perfect Fifth
        
        return (voice1 + voice2 + voice3) * env * 0.8
    write_wav("heal.wav", 0.8, SAMPLE_RATE, synth)

def gen_level_up():
    def synth(t):
        duration = 1.0
        env = adsr(t, duration, attack=0.05, decay=0.3, sustain=0.7, release=0.3)
        
        # Ascending C-Major Chime notes trigger at offsets:
        # C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
        chimes = [
            {"t": 0.0, "f": 523.25, "vol": 0.35},
            {"t": 0.1, "f": 659.25, "vol": 0.35},
            {"t": 0.2, "f": 783.99, "vol": 0.35},
            {"t": 0.3, "f": 1046.50, "vol": 0.5}
        ]
        
        sig = 0.0
        for chime in chimes:
            dt = t - chime["t"]
            if dt >= 0:
                # Individual note decay
                note_env = math.exp(-6.0 * dt)
                # FM synthesis for ringing crystal chime
                freq = chime["f"]
                mod = math.sin(2 * math.pi * (freq * 2.0) * dt) * 0.5
                sig += math.sin(2 * math.pi * freq * dt + mod) * chime["vol"] * note_env
                
        return sig * env * 0.75
    write_wav("level_up.wav", 1.0, SAMPLE_RATE, synth)

def gen_defeat():
    def synth(t):
        duration = 1.4
        env = adsr(t, duration, attack=0.2, decay=0.4, sustain=0.5, release=0.6)
        
        # Desending somber tone: C3 (130.8Hz) to F2 (87.3Hz)
        base_freq = 130.81 - 43.5 * min(1.0, t / 0.8)
        
        # Detuned double oscillator for standard chorus beating
        osc1 = math.sin(2 * math.pi * base_freq * t)
        osc2 = math.sin(2 * math.pi * (base_freq + 1.2) * t)
        
        # Modulating low hum
        sig = (osc1 * 0.5 + osc2 * 0.5)
        
        # Add a quiet low noise rumble
        rumble = random.uniform(-0.1, 0.1)
        
        return (sig + rumble) * env * 0.75
    write_wav("defeat.wav", 1.4, SAMPLE_RATE, synth)

def gen_victory():
    def synth(t):
        duration = 1.0
        env = adsr(t, duration, attack=0.08, decay=0.2, sustain=0.6, release=0.4)
        
        # Trumpet fanfare: C5 (0.0s), E5 (0.15s), G5 (0.3s), C6 (0.45s)
        notes = [
            {"t": 0.0, "f": 523.25},
            {"t": 0.15, "f": 659.25},
            {"t": 0.30, "f": 783.99},
            {"t": 0.45, "f": 1046.50}
        ]
        
        sig = 0.0
        active_count = 0
        for note in notes:
            dt = t - note["t"]
            if dt >= 0:
                active_count += 1
                # Brass tone: FM synthesis with mod index
                freq = note["f"]
                mod_freq = freq * 1.0
                mod_index = 1.2 * math.exp(-3.0 * dt)
                note_sig = math.sin(2 * math.pi * freq * dt + mod_index * math.sin(2 * math.pi * mod_freq * dt))
                note_env = math.exp(-2.0 * dt) if note["t"] < 0.45 else 1.0
                sig += note_sig * 0.3 * note_env
                
        if active_count > 0:
            sig /= active_count
            
        return sig * env * 0.95
    write_wav("victory.wav", 1.0, SAMPLE_RATE, synth)

def gen_forge_success():
    def synth(t):
        duration = 0.8
        env = adsr(t, duration, attack=0.005, decay=0.15, sustain=0.4, release=0.4)
        
        # Metal anvil strike (heavy high-pitch metallic decay)
        strike_env = math.exp(-25.0 * t)
        metal = (
            math.sin(2 * math.pi * 950 * t) * 0.4 +
            math.sin(2 * math.pi * 1750 * t) * 0.3 +
            math.sin(2 * math.pi * 2300 * t) * 0.2
        ) * strike_env
        
        # Shimmer sparkle rising (0.1s to 0.6s)
        sparkle = 0.0
        dt_sparkle = t - 0.1
        if dt_sparkle >= 0:
            sparkle_env = adsr(dt_sparkle, 0.6, attack=0.05, decay=0.1, sustain=0.5, release=0.35)
            freq = 1200 + 1000 * (dt_sparkle / 0.6)
            # Vibrato
            vib = math.sin(2 * math.pi * 16 * dt_sparkle) * 10
            sparkle = math.sin(2 * math.pi * (freq + vib) * dt_sparkle) * 0.45 * sparkle_env
            
        return (metal + sparkle) * env * 0.85
    write_wav("forge_success.wav", 0.8, SAMPLE_RATE, synth)

def gen_forge_fail():
    lp_state = [0.0]
    def synth(t):
        duration = 0.8
        env = adsr(t, duration, attack=0.005, decay=0.15, sustain=0.3, release=0.4)
        
        # Anvil strike (same as above)
        strike_env = math.exp(-20.0 * t)
        metal = (
            math.sin(2 * math.pi * 950 * t) * 0.4 +
            math.sin(2 * math.pi * 1750 * t) * 0.3
        ) * strike_env
        
        # Steam fizzle (low passed noise fading in after 0.05s)
        fizzle = 0.0
        dt_fizzle = t - 0.05
        if dt_fizzle >= 0:
            fizzle_env = math.exp(-4.0 * dt_fizzle)
            noise = random.uniform(-1.0, 1.0)
            # Low pass filter for heavy steam
            lp_state[0] = lp_state[0] + 0.25 * (noise - lp_state[0])
            fizzle = lp_state[0] * 0.4 * fizzle_env
            
        return (metal + fizzle) * env * 0.85
    write_wav("forge_fail.wav", 0.8, SAMPLE_RATE, synth)

def gen_build_complete():
    # Hammer strikes at 0.0, 0.2, 0.4
    def synth(t):
        duration = 1.2
        env = adsr(t, duration, attack=0.01, decay=0.2, sustain=0.6, release=0.4)
        
        sig = 0.0
        strikes = [0.0, 0.2, 0.4]
        for strike_t in strikes:
            dt = t - strike_t
            if 0 <= dt < 0.2:
                # Hammer tap: wood-metal impact
                strike_env = math.exp(-30.0 * dt)
                sig += (
                    math.sin(2 * math.pi * 600 * dt) * 0.4 +
                    math.sin(2 * math.pi * 1200 * dt) * 0.3 +
                    random.uniform(-0.1, 0.1)
                ) * strike_env
                
        # Triumphant bell chime at 0.6s
        bell = 0.0
        dt_bell = t - 0.6
        if dt_bell >= 0:
            bell_env = math.exp(-3.5 * dt_bell)
            # Bell chord (E-major: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz))
            bell = (
                math.sin(2 * math.pi * 659.25 * dt_bell) * 0.35 +
                math.sin(2 * math.pi * 830.61 * dt_bell) * 0.25 +
                math.sin(2 * math.pi * 987.77 * dt_bell) * 0.2 +
                math.sin(2 * math.pi * 1318.51 * dt_bell) * 0.2
            ) * bell_env
            
        return (sig + bell) * env * 0.85
    write_wav("build_complete.wav", 1.2, SAMPLE_RATE, synth)

def generate_all():
    print("Starting Sound Effects Generation...")
    gen_ui_click()
    gen_battle_start()
    gen_hit_physical()
    gen_hit_magic()
    gen_heal()
    gen_level_up()
    gen_defeat()
    gen_victory()
    gen_forge_success()
    gen_forge_fail()
    gen_build_complete()
    print("All sound effects generated successfully!")

if __name__ == "__main__":
    generate_all()
