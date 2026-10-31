import os
from google import genai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Gemini API configuration
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is missing from your .env file"
    )

client = genai.Client(api_key=API_KEY)

# Primary and fallback models
MODEL_NAMES = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite"
]

# AI safety and behaviour instructions
SYSTEM_INSTRUCTION = """
You are SWASTHYA SENSE, a patient health education assistant.

YOUR RESPONSIBILITIES:
1. Explain general health information in simple language.
2. Help patients understand their health records when provided.
3. Summarise patient-provided information.
4. Explain existing system-generated alerts.
5. Help patients understand appointments and follow-ups.
6. Support English, Hindi and Marathi.

STRICT MEDICAL SAFETY RULES:
1. Never diagnose diseases.
2. Never prescribe medicines or dosages.
3. Never replace a qualified doctor.
4. Never invent patient records or measurements.
5. Never independently determine clinical emergency severity.
6. If a patient describes potentially life-threatening symptoms,
   advise them to seek immediate emergency medical assistance.
7. Clearly distinguish general health education from medical advice.
8. Never claim to have accessed records that were not provided.
9. Do not make up medical information.

Keep answers clear, short and easy to understand.
"""

def ask_gemini(
    message: str,
    language: str = "English"
) -> str:

    prompt = f"""
{SYSTEM_INSTRUCTION}

STRICT LANGUAGE INSTRUCTIONS:
- Respond entirely in {language}.
- If Hindi is selected, use Devanagari script.
- If Marathi is selected, use natural Marathi in Devanagari script.
- Do not switch to English unless English is selected.
- Keep medical explanations simple and understandable.
- Preserve important medical terms where necessary.

Patient question:
{message}
"""

    last_error = None

    for model in MODEL_NAMES:
        try:
            print(f"Trying Gemini model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response.text:
                print(f"Gemini response received from {model}")
                return response.text

            print(f"{model} returned an empty response")

        except Exception as e:
            last_error = e
            print(f"GEMINI MODEL ERROR ({model}):", repr(e))

    raise Exception(
        f"All configured Gemini models failed: {last_error}"
    )