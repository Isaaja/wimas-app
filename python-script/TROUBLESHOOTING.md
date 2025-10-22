# 🔧 Troubleshooting Guide - SPT Extractor

## ❌ Error: "Analysis Failed"

Error ini terjadi ketika LLM (Gemini AI) gagal mengekstrak data dari PDF. Berikut langkah-langkah untuk mengatasi:

### 1. Check Python Service Logs

Setelah upload PDF, periksa terminal/console Python service untuk error detail:

```bash
# Logs yang akan muncul:
📄 Processing PDF: filename.pdf
✅ Extracted text length: XXXX characters
✅ Cleaned text length: XXXX characters
✅ Pre-validation passed
```

Jika ada error, akan muncul:

```bash
❌ Error in analyze_text_with_llm: [error message]
Error type: [error type]
[Full traceback]
```

### 2. Common Causes & Solutions

#### A. API Key Issues

**Error:**

```
ValueError: ❌ API key tidak ditemukan
```

**Solution:**

```bash
# Check if .env exists
ls .env

# If not, create it:
# Windows PowerShell:
"GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA" | Out-File -FilePath .env -Encoding utf8

# Linux/Mac:
echo "GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA" > .env

# Verify .env content:
cat .env
```

**Restart Python service after creating .env**

#### B. Gemini API Quota Exceeded

**Error:**

```
ResourceExhausted: 429 Resource has been exhausted
```

**Solution:**

- Wait for quota reset (usually resets daily)
- Check API quota di Google Cloud Console
- Upgrade API quota jika diperlukan

#### C. Invalid JSON Response

**Error:**

```
JSONDecodeError: Expecting value
```

**Cause:** Gemini tidak return valid JSON

**Solution:**

```python
# Check response di logs
# Jika response bukan JSON, coba:

1. Restart Python service
2. Upload ulang PDF
3. Pastikan PDF quality bagus (tidak terlalu blur)
```

#### D. Network/Connection Issues

**Error:**

```
ConnectionError / TimeoutError
```

**Solution:**

```bash
# Check internet connection
ping google.com

# Check if Gemini API accessible
curl -I https://generativelanguage.googleapis.com

# Restart service
python app/main.py
```

### 3. PDF Quality Issues

**Symptoms:**

- Analysis Failed consistently
- Empty extraction
- Partial data only

**Solutions:**

1. **Check PDF Text Extraction:**

   ```python
   # Add debug di extract_text_from_pdf
   print(f"First 500 chars: {text[:500]}")
   ```

2. **PDF Quality Requirements:**

   - ✅ Clear, readable text
   - ✅ Standard SPT format
   - ✅ Contains "SURAT TUGAS"
   - ✅ Contains "BALMON.33"
   - ❌ Scanned images (poor OCR)
   - ❌ Corrupted PDF
   - ❌ Password-protected

3. **Try Different PDF:**
   - Use PDF with clear text (not scanned)
   - Ensure PDF is not corrupted
   - Check file size < 5MB

### 4. Model/API Issues

**Error:**

```
Model 'gemini-2.5-flash' not found
```

**Solution:**

```python
# Update model name di main.py line 190:
# Try alternative models:
model='gemini-2.0-flash'  # or
model='gemini-1.5-flash'  # or
model='gemini-pro'
```

### 5. Enable Debug Mode

Add more detailed logging:

```python
# In analyze_text_with_llm function, add:
print(f"📝 Sending to Gemini, text length: {len(extracted_text)}")
print(f"🔍 First 200 chars: {extracted_text[:200]}")

# After response:
print(f"📨 Gemini response: {response.text[:500]}")
print(f"📋 Parsed JSON: {extracted_data}")
```

### 6. Test Gemini API Directly

Create test script `test_gemini.py`:

```python
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ No API key")
    exit(1)

print(f"✅ API Key found: {API_KEY[:20]}...")

client = genai.Client(api_key=API_KEY)

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello, are you working?",
    )
    print(f"✅ Gemini response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
```

Run:

```bash
python test_gemini.py
```

## 🐛 Other Common Errors

### Error: "Invalid SPT Document"

**Cause:** PDF tidak memenuhi validasi awal

**Check:**

```python
# Validation checks:
1. Must contain "SURAT TUGAS" (case insensitive)
2. Must contain pattern "NOMOR.*BALMON.33"
```

**Solution:**

- Verify PDF is actually a SPT document
- Check nomor surat format contains "BALMON.33"

### Error: "Invalid SPT Format"

**Cause:** Extracted nomor surat tidak mengandung "BALMON.33"

**Solution:**

- Check if nomor surat extraction correct
- Verify PDF quality
- Manual check: does nomor surat have "BALMON.33"?

### Error: "Empty PDF"

**Cause:** PDF has no extractable text

**Solution:**

- PDF might be scanned image
- Use PDF with text layer
- Try OCR if necessary

### Error: "File too large"

**Cause:** File > 5MB

**Solution:**

```bash
# Compress PDF
# Or increase limit in code:
if file.size > 10 * 1024 * 1024:  # 10MB
```

## 📊 Debugging Checklist

When "Analysis Failed" occurs:

- [ ] Check Python service logs
- [ ] Verify .env file exists with correct API key
- [ ] Test Gemini API directly
- [ ] Check internet connection
- [ ] Verify PDF quality and content
- [ ] Check API quota
- [ ] Try with different PDF
- [ ] Restart Python service
- [ ] Check Gemini model name/version

## 🔍 Log Analysis

### Good Logs (Success):

```
📄 Processing PDF: spt_test.pdf
✅ Extracted text length: 2456 characters
✅ Cleaned text length: 2100 characters
✅ Pre-validation passed
127.0.0.1 - - [22/Oct/2025 21:12:20] "POST /process-pdf HTTP/1.1" 200 -
```

### Bad Logs (Failed):

```
📄 Processing PDF: spt_test.pdf
✅ Extracted text length: 2456 characters
✅ Cleaned text length: 2100 characters
✅ Pre-validation passed
❌ Error in analyze_text_with_llm: [error detail]
⚠️ analyze_text_with_llm returned None
127.0.0.1 - - [22/Oct/2025 21:12:20] "POST /process-pdf HTTP/1.1" 500 -
```

## 💡 Quick Fixes

### 1. Restart Everything

```bash
# Stop Python service (Ctrl+C)
# Restart
python app/main.py

# In browser, hard refresh (Ctrl+Shift+R)
```

### 2. Clear Temp Files

```bash
# Windows
del /q %TEMP%\*.pdf

# Linux/Mac
rm /tmp/*.pdf
```

### 3. Verify Installation

```bash
pip list | grep -E "google-genai|pypdf|flask"

# Should show:
# google-genai   1.27.0
# pypdf          6.1.0
# flask          2.3.3
```

### 4. Test with Curl

```bash
curl -X POST http://localhost:5000/
# Should return: {"message": "SPT Processing API is running"}

curl -X POST http://localhost:5000/process-pdf \
  -F "pdf=@your_spt.pdf"
```

## 📞 Still Not Working?

1. **Capture Full Error:**

   - Check Python terminal for full error
   - Check browser console (F12)
   - Check Network tab in browser DevTools

2. **Provide Information:**

   - Python version: `python --version`
   - Package versions: `pip list`
   - Error logs
   - PDF sample (if possible)

3. **Try Alternative:**
   - Use `python_service.py` instead of `main.py`
   - Try different Gemini model
   - Test with minimal PDF first

## 🎯 Success Indicators

You know it's working when:

- ✅ No errors in Python logs
- ✅ Status 200 in response
- ✅ Form auto-filled dengan data
- ✅ User list extracted
- ✅ All fields populated correctly

---

**Last Updated:** October 22, 2025
