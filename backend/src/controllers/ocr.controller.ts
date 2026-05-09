import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';
import path from 'path';
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

    // Try OCR.Space API first (faster), fallback to Tesseract
    if (process.env.OCR_SPACE_API_KEY) {
      ocrResult = await processWithOcrSpace(filePath, req.file.mimetype);
    } else {
      ocrResult = await processWithTesseract(filePath);
    }

    res.json({
      success: true,
      fileUrl,
      ocr: ocrResult,
    });
  } catch (error) {
    logger.error('OCR processing error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
};

async function processWithTesseract(filePath: string): Promise<OcrResult> {
  try {
    // Dynamic import to avoid issues if tesseract is not installed
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
    logger.error('Tesseract error:', error);
    return { text: '', confidence: 0 };
  }
}

async function processWithOcrSpace(filePath: string, mimeType: string): Promise<OcrResult> {
  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      contentType: mimeType,
    });
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
    logger.error('OCR.Space error:', error);
    // Fallback to Tesseract
    return processWithTesseract(filePath);
  }
}

function extractReceiptData(text: string): Partial<OcrResult> {
  const result: Partial<OcrResult> = {};

  // Extract amount - look for patterns like $123.45, ₹1,234.56, Total: 123.45
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

  // Extract date
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // Extract merchant name (usually first non-empty line)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length > 0) {
    // Skip lines that look like addresses or phone numbers
    for (const line of lines.slice(0, 5)) {
      if (!/^\d+$/.test(line) && !/^\+?\d[\d\s\-()]+$/.test(line) && line.length < 50) {
        result.merchantName = line;
        break;
      }
    }
  }

  return result;
}
