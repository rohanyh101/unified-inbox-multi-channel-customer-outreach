import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Webhook signature validation utilities
 */

export interface WebhookConfig {
  secret: string;
  tolerance: number; // Tolerance in seconds for timestamp validation
  headerName: string;
  algorithm: 'sha256' | 'sha1';
}

const defaultConfig: Omit<WebhookConfig, 'secret'> = {
  tolerance: 300, // 5 minutes
  headerName: 'x-webhook-signature',
  algorithm: 'sha256',
};

/**
 * Verify webhook signature using HMAC
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    // Remove algorithm prefix if present (e.g., "sha256=")
    const cleanSignature = signature.replace(/^(sha256|sha1)=/, '');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 */
export function verifyWebhookTimestamp(
  timestamp: number,
  tolerance: number = 300
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - timestamp);
  return timeDiff <= tolerance;
}

/**
 * Parse Stripe-style webhook signature header
 * Format: "t=1633024800,v1=signature1,v1=signature2"
 */
export function parseStripeSignatureHeader(header: string): {
  timestamp?: number;
  signatures: string[];
} {
  const elements = header.split(',');
  const result: { timestamp?: number; signatures: string[] } = { signatures: [] };

  for (const element of elements) {
    const [key, value] = element.split('=');
    
    if (key === 't') {
      result.timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      result.signatures.push(value);
    }
  }

  return result;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string,
  tolerance: number = 300
): boolean {
  try {
    const { timestamp, signatures } = parseStripeSignatureHeader(signature);

    if (!timestamp) {
      console.error('No timestamp found in webhook signature');
      return false;
    }

    // Verify timestamp
    if (!verifyWebhookTimestamp(timestamp, tolerance)) {
      console.error('Webhook timestamp is outside tolerance window');
      return false;
    }

    // Create expected signature
    const payloadString = typeof payload === 'string' ? payload : payload.toString();
    const signedPayload = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Check if any provided signature matches
    return signatures.some(sig => 
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(sig, 'hex')
      )
    );
  } catch (error) {
    console.error('Error verifying Stripe webhook:', error);
    return false;
  }
}

/**
 * Verify Twilio webhook signature
 * Twilio uses a different approach with URL and parameters
 */
export function verifyTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  try {
    // Sort parameters by key
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    // Create the signature string
    const signatureString = url + sortedParams;

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(signatureString)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying Twilio webhook:', error);
    return false;
  }
}

/**
 * Generic webhook verification middleware for Next.js
 */
export function createWebhookVerifier(config: WebhookConfig) {
  return (payload: string | Buffer, signature: string): boolean => {
    return verifyWebhookSignature(
      payload,
      signature,
      config.secret,
      config.algorithm
    );
  };
}

/**
 * Extract and verify webhook from Next.js request
 */
export async function verifyWebhookRequest(
  request: NextRequest,
  config: Partial<WebhookConfig> & { secret: string }
): Promise<{ valid: boolean; payload: string; error?: string }> {
  const finalConfig = { ...defaultConfig, ...config };

  try {
    // Get signature from headers
    const signature = request.headers.get(finalConfig.headerName);
    if (!signature) {
      return {
        valid: false,
        payload: '',
        error: `Missing ${finalConfig.headerName} header`,
      };
    }

    // Get payload
    const payload = await request.text();
    if (!payload) {
      return {
        valid: false,
        payload: '',
        error: 'Empty request body',
      };
    }

    // Verify signature
    const valid = verifyWebhookSignature(
      payload,
      signature,
      finalConfig.secret,
      finalConfig.algorithm
    );

    return {
      valid,
      payload,
      error: valid ? undefined : 'Invalid signature',
    };
  } catch (error) {
    return {
      valid: false,
      payload: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Rate limiting for webhooks to prevent abuse
 */
export class WebhookRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  reset(identifier?: string) {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiter instance
export const webhookRateLimiter = new WebhookRateLimiter();
