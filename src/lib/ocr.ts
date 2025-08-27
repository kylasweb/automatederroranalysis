import ZAI from 'z-ai-web-dev-sdk';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: {
    text: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }[];
}

export async function extractTextFromImage(imageBase64: string): Promise<OCRResult> {
  try {
    const zai = await ZAI.create();

    // Convert base64 to buffer for processing
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Use ZAI's vision capabilities for OCR
    const prompt = `
    Extract all text from this image. This is likely a screenshot of error logs, code, or technical documentation.
    
    Please provide:
    1. All extracted text exactly as it appears
    2. Confidence score (0-1) for the extraction
    3. Text blocks with their approximate positions if possible
    
    Focus on:
    - Error messages and stack traces
    - Code snippets and function names
    - File paths and line numbers
    - Timestamps and log levels
    - Any technical information that would be useful for debugging
    
    Return the result as a JSON object with the structure:
    {
      "text": "extracted text",
      "confidence": 0.95,
      "blocks": [
        {
          "text": "block text",
          "boundingBox": {"x": 0, "y": 0, "width": 100, "height": 50},
          "confidence": 0.9
        }
      ]
    }
    `;

    // For image analysis, we'll use a different approach
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert OCR and text extraction specialist. Extract text from images with high accuracy, especially from technical content like error logs, code, and system messages.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nImage to analyze: data:image/png;base64,${imageBase64}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, return the raw text
      return {
        text: content,
        confidence: 0.7,
        blocks: [{
          text: content,
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.7
        }]
      };
    }
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return {
      text: 'OCR extraction failed',
      confidence: 0,
      blocks: []
    };
  }
}

export async function processImageForLogAnalysis(imageBase64: string): Promise<{
  extractedText: string;
  isLogContent: boolean;
  confidence: number;
  suggestedAnalysis: string;
}> {
  try {
    const ocrResult = await extractTextFromImage(imageBase64);

    // Analyze if the extracted text looks like log content
    const zai = await ZAI.create();

    const analysisPrompt = `
    Analyze the following extracted text and determine if it contains error logs, technical content, or debugging information:
    
    Extracted Text:
    ${ocrResult.text}
    
    Please provide a JSON response with:
    {
      "isLogContent": true/false,
      "confidence": 0.8,
      "suggestedAnalysis": "Brief description of what type of analysis would be most appropriate"
    }
    
    Look for indicators like:
    - Error messages (ERROR, FATAL, CRITICAL)
    - Stack traces
    - File paths and line numbers
    - Function names and method calls
    - Timestamps and log levels
    - System or application names
    - Exception types
    `;

    const analysisResponse = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying technical content and error logs. Analyze text to determine if it contains debugging information.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content || '{}';

    try {
      const analysis = JSON.parse(analysisContent);
      return {
        extractedText: ocrResult.text,
        isLogContent: analysis.isLogContent,
        confidence: analysis.confidence || ocrResult.confidence,
        suggestedAnalysis: analysis.suggestedAnalysis || 'General technical analysis'
      };
    } catch (parseError) {
      return {
        extractedText: ocrResult.text,
        isLogContent: false,
        confidence: ocrResult.confidence,
        suggestedAnalysis: 'General text analysis'
      };
    }
  } catch (error) {
    console.error('Image processing failed:', error);
    return {
      extractedText: 'Image processing failed',
      isLogContent: false,
      confidence: 0,
      suggestedAnalysis: 'Processing failed'
    };
  }
}

// Real-time OCR processing with WebSocket support
export class RealTimeOCRProcessor {
  private socket: any;
  private processingQueue: Array<{ id: string; imageBase64: string; userId: string }> = [];
  private isProcessing: boolean = false;

  constructor(socket: any) {
    this.socket = socket;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.socket.on('ocr_process', async (data: { id: string; imageBase64: string; userId: string }) => {
      this.addToQueue(data);
      this.processQueue();
    });
  }

  public addToQueue(data: { id: string; imageBase64: string; userId: string }) {
    this.processingQueue.push(data);
    this.socket.emit('ocr_queued', { id: data.id, queuePosition: this.processingQueue.length });
  }

  public async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const current = this.processingQueue.shift()!;

      try {
        this.socket.emit('ocr_processing', { id: current.id, status: 'processing' });

        const result = await processImageForLogAnalysis(current.imageBase64);

        this.socket.emit('ocr_completed', {
          id: current.id,
          result,
          timestamp: new Date().toISOString()
        });

        // Emit real-time alert
        this.socket.emit('alert', {
          type: 'OCR_COMPLETED',
          message: `OCR processing completed for image ${current.id}`,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('OCR processing error:', error);
        this.socket.emit('ocr_error', {
          id: current.id,
          error: 'OCR processing failed',
          timestamp: new Date().toISOString()
        });
      }
    }

    this.isProcessing = false;
  }
}