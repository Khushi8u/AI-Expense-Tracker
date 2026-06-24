import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';
import fs from 'fs';

interface OcrResult {
  text: string;
  merchantName?: string;
  amount?: number;
  date?: string;
  confidence: number;
}

export const processReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileUrl = `/uploads/receipts/${req.file.filename}`;

    let ocrResult: OcrResult = { text: '', confidence: 0 };

    const hasOcrKey = process.env.OCR_SPACE_API_KEY &&
      !['your-ocr-space-api-key', 'undefined', ''].includes(process.env.OCR_SPACE_API_KEY);

    if (hasOcrKey) {
      logger.info('Using OCR.Space API for receipt processing');
      ocrResult = await processWithOcrSpace(filePath, req.file.mimetype);
    } else {
      logger.info('Using Tesseract for receipt processing (no OCR.Space key)');
      ocrResult = await processWithTesseract(filePath);
    }

    logger.info(`OCR result: confidence=${ocrResult.confidence}, amount=${ocrResult.amount}, merchant=${ocrResult.merchantName}`);

    res.json({ success: true, fileUrl, ocr: ocrResult });
  } catch (error) {
    logger.error('OCR processing error:', error);
    res.json({
      success: true,
      fileUrl: req.file ? `/uploads/receipts/${req.file.filename}` : '',
      ocr: { text: '', confidence: 0 },
    });
  }
};

async function processWithTesseract(filePath: string): Promise<OcrResult> {
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    const text = result.data.text;
    const confidence = result.data.confidence / 100;
    logger.info(`Tesseract extracted ${text.length} chars at ${(confidence * 100).toFixed(0)}% confidence`);
    return { text, confidence, ...extractReceiptData(text) };
  } catch (error: any) {
    logger.warn('Tesseract failed:', error?.message);
    return { text: '', confidence: 0 };
  }
}

async function processWithOcrSpace(filePath: string, mimeType: string): Promise<OcrResult> {
  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    // Try OCR Engine 2 first (better for printed receipts)
    for (const engine of ['2', '1']) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), { contentType: mimeType });
        formData.append('apikey', process.env.OCR_SPACE_API_KEY!);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('isTable', 'true');
        formData.append('OCREngine', engine);

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
          headers: formData.getHeaders(),
          timeout: 30000,
        });

        const data = response.data;

        if (data.IsErroredOnProcessing) {
          logger.warn(`OCR Engine ${engine} error: ${data.ErrorMessage}`);
          continue;
        }

        const text = data.ParsedResults?.[0]?.ParsedText || '';
        if (text.trim().length < 5) {
          logger.warn(`OCR Engine ${engine} returned too little text, trying next`);
          continue;
        }

        const confidence = text.length > 50 ? 0.85 : 0.5;
        logger.info(`OCR.Space Engine ${engine} extracted ${text.length} chars`);
        return { text, confidence, ...extractReceiptData(text) };
      } catch (engineErr: any) {
        logger.warn(`OCR Engine ${engine} failed:`, engineErr?.message);
      }
    }

    // Both engines failed, fall back to Tesseract
    logger.warn('Both OCR engines failed, falling back to Tesseract');
    return processWithTesseract(filePath);
  } catch (error: any) {
    logger.error('OCR.Space fatal error:', error?.message);
    return processWithTesseract(filePath);
  }
}

function extractReceiptData(text: string): Partial<OcrResult> {
  if (!text || text.trim().length === 0) return {};
  const result: Partial<OcrResult> = {};

  // ── Amount extraction (many patterns for Indian receipts) ──
  const amountPatterns = [
    // Grand total / total patterns
    /grand\s*total\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i,
    /total\s*amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i,
    /net\s*amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i,
    /(?:total|amount|bill\s*amount|payable|to\s*pay)\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i,
    // Currency symbol patterns
    /₹\s*([0-9,]+\.?[0-9]{0,2})/,
    /rs\.?\s*([0-9,]+\.?[0-9]{0,2})/i,
    /inr\s*([0-9,]+\.?[0-9]{0,2})/i,
    /\$\s*([0-9,]+\.[0-9]{2})/,
    // Amount at end of line
    /([0-9,]+\.[0-9]{2})\s*(?:total|amount|₹|rs)?$/im,
    // Standalone large number (likely total)
    /\b([0-9]{3,6}\.[0-9]{2})\b/,
  ];

  let bestAmount = 0;
  for (const pattern of amountPatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val > bestAmount && val < 1000000) {
        bestAmount = val;
      }
    }
    if (bestAmount > 0) break;
  }
  if (bestAmount > 0) result.amount = bestAmount;

  // ── Date extraction ──
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,  // DD/MM/YY or DD-MM-YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,    // YYYY-MM-DD
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Try to parse and format as YYYY-MM-DD
        const raw = match[0];
        const ddmmyy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (ddmmyy) {
          let [, day, month, year] = ddmmyy;
          if (year.length === 2) year = `20${year}`;
          const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          if (!isNaN(parsed.getTime())) {
            result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            break;
          }
        }
        const yyyymmdd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (yyyymmdd) {
          const [, y, m, d] = yyyymmdd;
          result.date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          break;
        }
        // Try native Date parse for text dates
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          result.date = d.toISOString().split('T')[0];
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // ── Merchant name extraction ──
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 60);

  // Skip lines that look like addresses, phone numbers, amounts, or dates
  const skipPatterns = [
    /^\d+$/,                          // only numbers
    /^\+?\d[\d\s\-()]{7,}/,           // phone number
    /^[0-9]{1,2}[\/\-][0-9]{1,2}/,   // date
    /^(gst|vat|tax|tin|cin|pan|fssai)/i, // tax numbers
    /^(tel|phone|mob|email|web|www)/i,   // contact info
    /₹|rs\.?|total|amount|bill/i,        // financial terms
  ];

  for (const line of lines.slice(0, 8)) {
    const shouldSkip = skipPatterns.some(p => p.test(line));
    if (!shouldSkip && /[a-zA-Z]/.test(line)) {
      // Clean up the merchant name
      result.merchantName = line
        .replace(/[^\w\s\-&'.]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (result.merchantName.length > 2) break;
    }
  }

  return result;
}
