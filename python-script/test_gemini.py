#!/usr/bin/env python3
"""
Test script untuk memverifikasi Gemini API connection
"""

import os
from dotenv import load_dotenv
from google import genai

print("=" * 60)
print("🧪 Testing Gemini API Connection")
print("=" * 60)

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Check 1: API Key
print("\n1️⃣ Checking API Key...")
if not API_KEY:
    print("❌ FAILED: No API key found in .env")
    print("📝 Create .env file with: GEMINI_API_KEY=your_key_here")
    exit(1)
else:
    print(f"✅ PASSED: API Key found ({API_KEY[:20]}...)")

# Check 2: Initialize Client
print("\n2️⃣ Initializing Gemini Client...")
try:
    client = genai.Client(api_key=API_KEY)
    print("✅ PASSED: Client initialized successfully")
except Exception as e:
    print(f"❌ FAILED: {e}")
    exit(1)

# Check 3: Simple Request
print("\n3️⃣ Testing simple request...")
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Say hello in one word",
    )
    print(f"✅ PASSED: Gemini response: '{response.text}'")
except Exception as e:
    print(f"❌ FAILED: {e}")
    print("\n💡 Try alternative model:")
    print("   - gemini-2.0-flash")
    print("   - gemini-1.5-flash")
    print("   - gemini-pro")
    exit(1)

# Check 4: JSON Response
print("\n4️⃣ Testing JSON response...")
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Return JSON: {"test": "success"}',
        config={
            "response_mime_type": "application/json",
        }
    )
    print(f"✅ PASSED: JSON response: {response.text}")
except Exception as e:
    print(f"❌ FAILED: {e}")
    exit(1)

# Check 5: SPT-like Request
print("\n5️⃣ Testing SPT-like extraction...")
test_text = """
SURAT TUGAS
NOMOR: 366/BALMON.33/KP.01.06/07/2025

Tempat: Kota Semarang
Tanggal: 28 Juli 2025 s.d 01 Agustus 2025
Tujuan: Inspeksi Monitoring
"""

try:
    system_instruction = "Extract data from SPT document in JSON format."
    user_prompt = f"""
    Extract information from this SPT:
    
    {test_text}
    
    Return JSON:
    {{
      "nomor_surat": "...",
      "tempat_pelaksanaan": "...",
      "tujuan_kegiatan": "..."
    }}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=user_prompt,
        config={
            "system_instruction": system_instruction,
            "response_mime_type": "application/json",
        }
    )
    
    print(f"✅ PASSED: Extraction successful")
    print(f"📄 Response: {response.text[:200]}...")
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
print("\n💡 Your Gemini API is working correctly.")
print("   If main.py still fails, the issue is likely:")
print("   - PDF extraction problem")
print("   - Text cleaning removing too much")
print("   - Validation rules too strict")
print("\n🔍 Next steps:")
print("   1. Run: python app/main.py")
print("   2. Upload a PDF and check logs")
print("   3. Look for detailed error messages")
print("=" * 60)

