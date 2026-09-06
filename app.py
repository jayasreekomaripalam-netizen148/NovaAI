import os
import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

load_dotenv()

app = Flask(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_URL = "https://api.openai.com/v1/responses"
MAX_MESSAGES = 20


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}

        message = data.get("message", "").strip()
        history = data.get("history", [])

        if not message:
            return jsonify({
                "success": False,
                "error": "Message cannot be empty."
            }), 400

        if not OPENAI_API_KEY:
            return jsonify({
                "success": False,
                "error": "OPENAI_API_KEY is missing."
            }), 500

        if not isinstance(history, list):
            history = []

        history = history[-MAX_MESSAGES:]

        conversation = []

        for item in history:
            if not isinstance(item, dict):
                continue

            role = item.get("role")
            text = item.get("content", "")

            if role not in ("user", "assistant"):
                continue

            if not isinstance(text, str) or not text.strip():
                continue

            conversation.append({
                "role": role,
                "content": text[:4000]
            })

        conversation.append({
            "role": "user",
            "content": message[:4000]
        })

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-5",
            "instructions": (
                "You are NovaAI, a helpful, friendly and professional "
                "AI assistant. Give clear, accurate and easy-to-understand "
                "answers. When explaining programming concepts, include "
                "useful examples when appropriate. Do not claim to have "
                "performed actions that you cannot actually perform."
            ),
            "input": conversation
        }

        response = requests.post(
            OPENAI_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

        print("AI API STATUS:", response.status_code)

        if not response.ok:
            print("AI API ERROR:", response.text)

            return jsonify({
                "success": False,
                "error": "The AI service returned an error.",
                "status": response.status_code
            }), 502

        result = response.json()

        answer = ""

        for item in result.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    answer += content.get("text", "")

        answer = answer.strip()

        if not answer:
            print("EMPTY AI RESPONSE:", result)

            return jsonify({
                "success": False,
                "error": "The AI returned an empty response."
            }), 502

        return jsonify({
            "success": True,
            "response": answer
        })

    except requests.Timeout:
        return jsonify({
            "success": False,
            "error": "The AI request timed out."
        }), 504

    except requests.RequestException as error:
        print("CONNECTION ERROR:", error)

        return jsonify({
            "success": False,
            "error": "Could not connect to the AI service."
        }), 502

    except Exception as error:
        print("UNEXPECTED ERROR:", error)

        return jsonify({
            "success": False,
            "error": "An unexpected server error occurred."
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
