Tessdata folder

Place Tesseract traineddata files here so Tesseract.js can run locally.

Required files:
- `eng.traineddata`
- `spa.traineddata`
 
Automatic download:
- Run `npm run download:tessdata` from the project root to download both `eng` and `spa` using the included script `scripts/download-tessdata.js`.

Manual download:
- Official traineddata files are available at: https://github.com/tesseract-ocr/tessdata
- Download `eng.traineddata` and `spa.traineddata` into this folder.

Notes:
- If compressed files (`*.traineddata.gz`) are present the OCR module will try to uncompress them.
- Ensure the `tessdata/` folder is included in your deployment artifacts (server-side only). For serverless providers, copy traineddata into the function bundle or use a persistent disk.

Expected structure:

horus-braslet/
tessdata/
  eng.traineddata
  spa.traineddata
