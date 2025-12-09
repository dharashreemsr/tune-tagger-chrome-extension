from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import torch
from transformers import CLIPProcessor, CLIPModel
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
from dotenv import load_dotenv

# Load environment variables (store secrets in .env)
load_dotenv("spotify.env")

app = Flask(__name__)
CORS(app, resources={r"/analyze": {"origins": "*"}})
# Load CLIP model and processor once
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Labels for prediction
labels = [
    "college", "school", "festival", "nature", "sunset", "beach",
    "street food", "birthday", "selfie", "temple", "night sky", "car", 
    "bike", "love", "friends", "solo trip", "rain", "books", "classroom",
    "football", "cricket", "exam", "hostel", "library", "picnic", "DJ party",
    "independence day", "ganesh chaturthi", "holi", "onam", "eid", "navratri",
    "sleep", "gaming", "meme", "shopping", "chai", "coffee"
]

# Setup Spotify credentials
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET")
))

def analyze_image(image_data):
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    outputs = model(**inputs)

    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1).detach().numpy()[0]

    top_indices = probs.argsort()[-3:][::-1]
    top_labels = [labels[i] for i in top_indices]

    return [f"#{label}" for label in top_labels], suggest_songs(top_labels)

def suggest_songs(keywords):
    songs = []
    for word in keywords:
        results = sp.search(q=word, type="track", limit=2)  # Fetch 2 top matching tracks
        for item in results["tracks"]["items"]:
            song_name = item["name"]
            artist_name = item["artists"][0]["name"]
            songs.append(f"{song_name} by {artist_name}")
    return songs


@app.route("/analyze", methods=["POST"])    
def analyze():
    try:
        data = request.json
        image_b64 = data["image"]
        image_data = base64.b64decode(image_b64)

        tags, songs = analyze_image(image_data)

        return jsonify({"tags": tags, "songs": songs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)
