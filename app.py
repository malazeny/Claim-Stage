from flask import Flask, render_template, jsonify
import json
from pathlib import Path

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "static" / "claims.json"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/claims")
def claims():
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)