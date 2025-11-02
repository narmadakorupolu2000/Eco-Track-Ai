"""Quick script to test Perplexity image classification helper.

Usage: activate your virtualenv where `perplexity` (or `perplexityai`) is installed,
then run: python backend/scripts/test_perplexity.py

Set PERPLEXITY_API_KEY in your environment or a .env file.
"""
import os
from dotenv import load_dotenv
from app.utils.perplexity_client import classify_image_with_perplexity

load_dotenv()

TEST_IMAGE = os.environ.get("TEST_IMAGE_URL") or "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG"

def main():
    print("Testing Perplexity classification for:", TEST_IMAGE)
    try:
        parsed, raw, tokens = classify_image_with_perplexity(TEST_IMAGE)
        print("Parsed result:", parsed)
        print("Raw model output:\n", raw)
        print("Tokens used:", tokens)
    except Exception as e:
        import traceback
        print("Error during classification:")
        traceback.print_exc()

if __name__ == '__main__':
    main()
