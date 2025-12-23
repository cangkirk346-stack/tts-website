# coqui_tts_backend.py
# Google Colab Backend untuk Coqui TTS

# %% [Cell 1] Install Dependencies
!pip install TTS flask-ngrok flask-cors pydub
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# %% [Cell 2] Import Libraries
from flask import Flask, request, jsonify, send_file
from flask_ngrok import run_with_ngrok
from flask_cors import CORS
from TTS.api import TTS
import torch
import os
import uuid
from pydub import AudioSegment
import IPython

# %% [Cell 3] Initialize TTS Models
print("🚀 Initializing Coqui TTS Models...")

# Dictionary of available models
MODELS = {
    'indonesia': 'tts_models/id/cv/vits',
    'english': 'tts_models/en/ljspeech/tacotron2-DDC',
    'multilingual': 'tts_models/multilingual/multi-dataset/your_tts'
}

# Load models
loaded_models = {}
for name, model_path in MODELS.items():
    try:
        print(f"Loading {name} model...")
        loaded_models[name] = TTS(model_name=model_path, gpu=torch.cuda.is_available())
        print(f"✅ {name} model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load {name} model: {e}")

print(f"\n✅ Total models loaded: {len(loaded_models)}")
print(f"✅ GPU Available: {torch.cuda.is_available()}")

# %% [Cell 4] Create Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
run_with_ngrok(app)  # Start ngrok when app is run

# Create output directory
os.makedirs('/content/outputs', exist_ok=True)

# %% [Cell 5] Helper Functions
def generate_speech(text, model_type='indonesia', speed=1.0):
    """Generate speech from text using Coqui TTS"""
    
    if model_type not in loaded_models:
        model_type = 'indonesia'  # Fallback to Indonesian
    
    # Generate unique filename
    filename = f"/content/outputs/{uuid.uuid4().hex}.wav"
    
    try:
        # Generate speech
        loaded_models[model_type].tts_to_file(
            text=text,
            file_path=filename
        )
        
        # Adjust speed if needed
        if speed != 1.0:
            adjust_speed(filename, speed)
        
        # Convert to MP3
        mp3_filename = filename.replace('.wav', '.mp3')
        convert_to_mp3(filename, mp3_filename)
        
        return mp3_filename
        
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None

def adjust_speed(audio_file, speed_factor):
    """Adjust audio speed using pydub"""
    sound = AudioSegment.from_file(audio_file)
    new_sample_rate = int(sound.frame_rate * speed_factor)
    adjusted_sound = sound._spawn(sound.raw_data, 
                                  overrides={'frame_rate': new_sample_rate})
    adjusted_sound.export(audio_file, format="wav")

def convert_to_mp3(wav_file, mp3_file):
    """Convert WAV to MP3"""
    sound = AudioSegment.from_wav(wav_file)
    sound.export(mp3_file, format="mp3", bitrate="192k")

# %% [Cell 6] API Routes
@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'service': 'Coqui TTS Backend',
        'models': list(loaded_models.keys()),
        'gpu': torch.cuda.is_available()
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate speech from text"""
    try:
        data = request.json
        
        # Validate input
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        text = data['text']
        model_type = data.get('model', 'indonesia')
        speed = float(data.get('speed', 1.0))
        
        # Limit text length
        if len(text) > 5000:
            text = text[:5000] + "..."
        
        print(f"Generating speech: {text[:50]}...")
        
        # Generate audio
        audio_file = generate_speech(text, model_type, speed)
        
        if audio_file and os.path.exists(audio_file):
            # Create public URL for the file
            # In Colab, we can serve files via ngrok
            base_url = request.host_url.rstrip('/')
            audio_url = f"{base_url}/download/{os.path.basename(audio_file)}"
            
            return jsonify({
                'success': True,
                'audio_url': audio_url,
                'filename': os.path.basename(audio_file),
                'text_length': len(text)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate audio'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/download/<filename>')
def download_file(filename):
    """Download generated audio file"""
    filepath = f"/content/outputs/{filename}"
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/models')
def list_models():
    """List available models"""
    return jsonify({
        'models': list(loaded_models.keys()),
        'current': 'indonesia'
    })

# %% [Cell 7] Start Server
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Coqui TTS Backend Server")
    print("="*50)
    print(f"📦 Models loaded: {list(loaded_models.keys())}")
    print(f"⚡ GPU: {'Enabled' if torch.cuda.is_available() else 'Disabled'}")
    print("\n🌐 Starting server...")
    
    app.run()
