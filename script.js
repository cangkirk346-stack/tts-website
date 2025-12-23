// ====================
// KONFIGURASI AWAL
// ====================

// GANTI INI DENGAN API KEY ANDA
const ELEVENLABS_API_KEY = '96a07bf8dc9a3fa2e2e5ecf59d86a48c9ce907bcbec10b8e9cb6c4ea82a81995';

// Daftar suara yang tersedia
const VOICES = {
    '21m00Tcm4TlvDq8ikWAM': { name: 'Rachel', gender: 'female', language: 'en' },
    'pNInz6obpgDQGcFmaJgB': { name: 'Adam', gender: 'male', language: 'en' },
    'XB0fDUnXU5powFXDhCwa': { name: 'Matilda', gender: 'female', language: 'en' }
};

// ====================
// ELEMEN DOM
// ====================
const textInput = document.getElementById('textInput');
const voiceSelect = document.getElementById('voiceSelect');
const languageSelect = document.getElementById('languageSelect');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const charCount = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const previewBtn = document.getElementById('previewBtn');
const clearBtn = document.getElementById('clearBtn');
const audioPlayer = document.getElementById('audioPlayer');
const audioContainer = document.getElementById('audioContainer');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const downloadBtn = document.getElementById('downloadBtn');

// ====================
// FUNGSI UTAMA
// ====================

// Update karakter count
textInput.addEventListener('input', function() {
    charCount.textContent = this.value.length;
});

// Update speed value display
speedSlider.addEventListener('input', function() {
    speedValue.textContent = `${this.value}x`;
});

// Clear text
clearBtn.addEventListener('click', function() {
    textInput.value = '';
    charCount.textContent = '0';
    audioContainer.style.display = 'none';
    errorMessage.style.display = 'none';
});

// Preview (generate dengan teks pendek)
previewBtn.addEventListener('click', function() {
    const text = textInput.value.trim();
    if (!text) {
        showError('Silahkan masukkan teks terlebih dahulu');
        return;
    }
    
    // Ambil 100 karakter pertama untuk preview
    const previewText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    generateTTS(previewText, true);
});

// Generate full TTS
generateBtn.addEventListener('click', function() {
    const text = textInput.value.trim();
    if (!text) {
        showError('Silahkan masukkan teks terlebih dahulu');
        return;
    }
    
    if (text.length > 5000) {
        showError('Teks terlalu panjang. Maksimal 5000 karakter');
        return;
    }
    
    generateTTS(text, false);
});

// Fungsi utama untuk generate TTS
async function generateTTS(text, isPreview = false) {
    // Validasi API Key
    if (ELEVENLABS_API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Silahkan tambahkan API Key ElevenLabs Anda di file script.js');
        return;
    }
    
    // Tampilkan loading, sembunyikan error dan audio sebelumnya
    loading.style.display = 'block';
    audioContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Disable button selama proses
    generateBtn.disabled = true;
    previewBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const selectedVoiceId = voiceSelect.value;
        const speed = parseFloat(speedSlider.value);
        
        // Konfigurasi request
        const requestBody = {
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: isPreview ? 0.5 : 0.7,
                similarity_boost: isPreview ? 0.75 : 0.8,
                style: isPreview ? 0.2 : 0.3,
                use_speaker_boost: true
            }
        };
        
        // Tambahkan speed adjustment jika bukan 1.0
        if (speed !== 1.0) {
            requestBody.text = `<speak><prosody rate="${speed}">${text}</prosody></speak>`;
        }
        
        // Kirim request ke ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        // Konversi response ke audio blob
        const audioBlob = await response.blob();
        
        if (audioBlob.size === 0) {
            throw new Error('Audio gagal dihasilkan');
        }
        
        // Buat URL untuk audio blob
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Set audio player source
        audioPlayer.src = audioUrl;
        
        // Setup download button
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `tts-${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        
        // Tampilkan audio player, sembunyikan loading
        loading.style.display = 'none';
        audioContainer.style.display = 'flex';
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Gagal membuat suara: ${error.message}`);
    } finally {
        // Reset button state
        generateBtn.disabled = false;
        previewBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Suara';
        loading.style.display = 'none';
    }
}

// Fungsi untuk menampilkan error
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    audioContainer.style.display = 'none';
}

// ====================
// INISIALISASI
// ====================

// Tambahkan contoh teks jika kosong
window.addEventListener('load', function() {
    if (!textInput.value.trim()) {
        textInput.value = `Halo! Selamat datang di Text-to-Speech Converter kami.

Website ini menggunakan teknologi AI canggih dari ElevenLabs untuk menghasilkan suara yang terdengar sangat natural seperti manusia.

Coba ketik atau paste teks Anda di sini, lalu klik "Generate Suara" untuk mendengarkan hasilnya. Anda juga bisa mengunduh hasilnya dalam format MP3.

Selamat mencoba! 🎵`;
        charCount.textContent = textInput.value.length;
    }
    
    // Update speed display awal
    speedValue.textContent = `${speedSlider.value}x`;
});

// Event listener untuk play audio
audioPlayer.addEventListener('play', function() {
    console.log('Audio started playing');
});

audioPlayer.addEventListener('error', function() {
    showError('Gagal memainkan audio. Coba generate ulang.');
});
