import os
import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.5-flash:generateContent"
)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}

        message = str(data.get("message", "")).strip()
        history = data.get("history", [])

        if not message:
            return jsonify({
                "success": False,
                "error": "Message cannot be empty."
            }), 400

        if not GEMINI_API_KEY:
            return jsonify({
                "success": False,
                "error": "Gemini API key is not configured."
            }), 500

        contents = []

        if isinstance(history, list):
            for item in history[-20:]:
                if not isinstance(item, dict):
                    continue

                role = item.get("role")
                text = item.get("content", "")

                if role not in ("user", "assistant"):
                    continue

                if not isinstance(text, str) or not text.strip():
                    continue

                gemini_role = "model" if role == "assistant" else "user"

                contents.append({
                    "role": gemini_role,
                    "parts": [
                        {"text": text[:4000]}
                    ]
                })

        contents.append({
            "role": "user",
            "parts": [
                {"text": message}
            ]
        })

        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are NovaAI, a helpful, friendly and "
                            "professional AI assistant. Give clear, "
                            "accurate and easy-to-understand answers."
                        )
                    }
                ]
            },
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048
            }
        }

        response = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=60
        )

        print("GEMINI API STATUS:", response.status_code)

        if not response.ok:
            print("GEMINI API ERROR:", response.text)

            return jsonify({
                "success": False,
                "error": "The AI service returned an error.",
                "status": response.status_code
            }), 502

        result = response.json()

        answer = ""

        for candidate in result.get("candidates", []):
            content = candidate.get("content", {})

            for part in content.get("parts", []):
                text = part.get("text", "")

                if text:
                    answer += text

        answer = answer.strip()

        if not answer:
            print("EMPTY GEMINI RESPONSE:", result)

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
            "error": "The AI request timed out. Please try again."
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

