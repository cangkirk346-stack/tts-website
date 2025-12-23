// ====================================
// TTS GRATIS - script.js
// ====================================

console.log("TTS Website loaded!");

// Variabel global
let currentAudioUrl = null;

// Fungsi utama untuk generate suara
async function generateSpeech() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    // Validasi input
    if (!text) {
        showMessage('⚠️ Masukkan teks dulu!', 'error');
        return;
    }
    
    if (text.length > 1000) {
        showMessage('⚠️ Teks terlalu panjang (max 1000 karakter)', 'warning');
        return;
    }
    
    // Tampilkan loading
    showLoading(true);
    
    try {
        // Cek mode yang dipilih
        const mode = document.querySelector('input[name="ttsMode"]:checked').value;
        
        if (mode === 'browser') {
            // Mode 1: Browser TTS (gratis, cepat)
            await useBrowserTTS(text);
            showMessage('✅ Suara diputar menggunakan browser TTS', 'success');
            
        } else if (mode === 'coqui') {
            // Mode 2: Coqui TTS (kualitas lebih baik)
            await useCoquiTTS(text);
            showMessage('✅ Suara dihasilkan menggunakan Coqui TTS', 'success');
            
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
        
        // Fallback ke browser TTS
        await useBrowserTTS(text);
    } finally {
        // Sembunyikan loading
        showLoading(false);
    }
}

// ====================================
// MODE 1: BROWSER TTS (GRATIS)
// ====================================
function useBrowserTTS(text) {
    return new Promise((resolve, reject) => {
        // Cek browser support
        if (!('speechSynthesis' in window)) {
            reject(new Error('Browser tidak mendukung Text-to-Speech'));
            return;
        }
        
        // Buat utterance (suara)
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set bahasa Indonesia
        utterance.lang = 'id-ID';
        
        // Atur kecepatan dari slider
        const speed = parseFloat(document.getElementById('speedSlider').value);
        utterance.rate = speed;
        
        // Cari suara Indonesia
        const voices = speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        const selectedVoice = voiceSelect.value;
        
        if (selectedVoice === 'auto') {
            // Cari otomatis suara Indonesia
            const idVoice = voices.find(v => v.lang.includes('ID') || v.lang.includes('id'));
            if (idVoice) utterance.voice = idVoice;
        } else if (selectedVoice !== 'default') {
            // Pakai suara yang dipilih
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) utterance.voice = voice;
        }
        
        // Event handlers
        utterance.onend = function() {
            console.log('Suara selesai');
            resolve();
        };
        
        utterance.onerror = function(event) {
            reject(new Error('Error memutar suara'));
        };
        
        // Mulai bicara
        speechSynthesis.speak(utterance);
    });
}

// ====================================
// MODE 2: COQUI TTS (KUALITAS BAIK)
// ====================================
async function useCoquiTTS(text) {
    // URL backend Google Colab (nanti diisi user)
    const colabUrl = document.getElementById('colabUrl').value.trim();
    
    if (!colabUrl) {
        throw new Error('Silakan setup Google Colab backend dulu. Klik link di bawah.');
    }
    
    // Kirim request ke Colab backend
    const response = await fetch(colabUrl + '/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            model: 'indonesia',
            speed: parseFloat(document.getElementById('speedSlider').value)
        })
    });
    
    if (!response.ok) {
        throw new Error('Backend Colab tidak merespon');
    }
    
    const result = await response.json();
    
    if (result.success && result.audio_url) {
        // Putar audio hasil
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = result.audio_url;
        currentAudioUrl = result.audio_url;
        
        // Tampilkan audio player
        audioPlayer.style.display = 'block';
        
        // Auto play
        setTimeout(() => {
            audioPlayer.play().catch(e => {
                console.log('Autoplay blocked, user harus klik play manual');
            });
        }, 500);
        
    } else {
        throw new Error(result.error || 'Gagal generate audio');
    }
}

// ====================================
// FUNGSI BANTUAN
// ====================================
function showLoading(show) {
    const loading = document.getElementById('loading');
    const generateBtn = document.getElementById('generateBtn');
    
    if (show) {
        loading.style.display = 'block';
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        generateBtn.disabled = true;
    } else {
        loading.style.display = 'none';
        generateBtn.innerHTML = '<i class="fas fa-play"></i> Generate Suara';
        generateBtn.disabled = false;
    }
}

function showMessage(text, type = 'info') {
    // Buat elemen message jika belum ada
    let messageBox = document.getElementById('messageBox');
    
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            font-weight: bold;
            max-width: 300px;
        `;
        document.body.appendChild(messageBox);
    }
    
    // Set warna berdasarkan type
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    
    messageBox.style.backgroundColor = colors[type] || colors.info;
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    
    // Auto hide setelah 5 detik
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function downloadAudio() {
    if (!currentAudioUrl) {
        showMessage('⚠️ Tidak ada audio untuk didownload', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.href = currentAudioUrl;
    link.download = `tts-audio-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('✅ Audio berhasil didownload', 'success');
}

function clearText() {
    document.getElementById('textInput').value = '';
    document.getElementById('charCount').textContent = '0';
    showMessage('📝 Teks telah dibersihkan', 'info');
}

// ====================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing TTS...');
    
    // Isi teks contoh
    const textInput = document.getElementById('textInput');
    if (textInput && !textInput.value.trim()) {
        textInput.value = `Halo! Selamat datang di website Text-to-Speech gratis.

Fitur yang tersedia:
1. Browser TTS - Gratis, cepat, tanpa API key
2. Coqui TTS - Kualitas lebih baik (butuh setup Colab)
3. Download hasil sebagai MP3
4. Atur kecepatan suara

Coba ketik teks Anda di sini, lalu klik "Generate Suara"!`;
        
        // Update karakter count
        if (document.getElementById('charCount')) {
            document.getElementById('charCount').textContent = textInput.value.length;
        }
    }
    
    // Setup character counter
    if (textInput && document.getElementById('charCount')) {
        textInput.addEventListener('input', function() {
            document.getElementById('charCount').textContent = this.value.length;
        });
    }
    
    // Setup speed slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', function() {
            speedValue.textContent = this.value + 'x';
        });
        // Set nilai awal
        speedValue.textContent = speedSlider.value + 'x';
    }
    
    // Load voices untuk browser TTS
    setTimeout(() => {
        const voices = speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        
        if (voiceSelect && voices.length > 0) {
            // Kosongkan dulu
            voiceSelect.innerHTML = '';
            
            // Tambah opsi default
            voiceSelect.innerHTML += `
                <option value="default">Default System Voice</option>
                <option value="auto">Auto Indonesia</option>
            `;
            
            // Tambah semua voices yang tersedia
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        }
    }, 1000);
    
    console.log('TTS initialized successfully!');
});

// Export fungsi untuk digunakan di HTML
window.generateSpeech = generateSpeech;
window.downloadAudio = downloadAudio;
window.clearText = clearText;
