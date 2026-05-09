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

    let ocrResult: OcrResult;

    if (process.env.OCR_SPACE_API_KEY && process.env.OCR_SPACE_API_KEY !== 'your-ocr-space-api-key') {
      // Use OCR.Space API if key is configured
      ocrResult = await processWithOcrSpace(filePath, req.file.mimetype);
    } else {
      // Try Tesseract as fallback
      ocrResult = await processWithTesseract(filePath);
    }

    res.json({
      success: true,
      fileUrl,
      ocr: ocrResult,
    });
  } catch (error) {
    logger.error('OCR processing error:', error);
    // Return empty OCR result instead of failing — user can fill in manually
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

    return {
      text,
      confidence,
      ...extractReceiptData(text),
    };
  } catch (error) {
    logger.warn('Tesseract not available, returning empty OCR result:', error);
    // Return empty result — user fills in manually on frontend
    return { text: '', confidence: 0 };
  }
}

async function processWithOcrSpace(filePath: string, mimeType: string): Promise<OcrResult> {
  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), { contentType: mimeType });
    formData.append('apikey', process.env.OCR_SPACE_API_KEY!);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const data = response.data;
    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage);
    }

    const text = data.ParsedResults?.[0]?.ParsedText || '';
    const confidence = (data.ParsedResults?.[0]?.TextOverlay?.Lines?.length > 0) ? 0.85 : 0.5;

    return {
      text,
      confidence,
      ...extractReceiptData(text),
    };
  } catch (error) {
    logger.error('OCR.Space error, falling back to Tesseract:', error);
    return processWithTesseract(filePath);
  }
}

function extractReceiptData(text: string): Partial<OcrResult> {
  const result: Partial<OcrResult> = {};

  // Extract amount
  const amountPatterns = [
    /(?:total|amount|grand total|subtotal|net amount)[:\s]*[$₹€£¥]?\s*([0-9,]+\.?[0-9]*)/i,
    /[$₹€£¥]\s*([0-9,]+\.[0-9]{2})/,
    /([0-9,]+\.[0-9]{2})\s*(?:total|amount)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        result.amount = amount;
        break;
      }
    }
  }

  // Extract date and convert to YYYY-MM-DD for HTML date input
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Try to convert to YYYY-MM-DD format for the date input
      const raw = match[1];
      const ddmmyy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
      if (ddmmyy) {
        let [, day, month, year] = ddmmyy;
        if (year.length === 2) year = `20${year}`;
        result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        result.date = raw;
      }
      break;
    }
  }

  // Extract merchant name (first clean line)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  for (const line of lines.slice(0, 5)) {
    if (!/^\d+$/.test(line) && !/^\+?\d[\d\s\-()]+$/.test(line) && line.length < 50) {
      result.merchantName = line;
      break;
    }
  }

  return result;
}
