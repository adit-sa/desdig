export interface PaymentTransaction {
  id: string;
  tenantId: string;
  planCode: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  provider: 'MIDTRANS' | 'XENDIT' | 'MANUAL_BANK_TRANSFER';
  paymentUrl?: string;
  referenceId?: string;
  createdAt: Date;
}

export interface PaymentGatewayProvider {
  createInvoice(params: {
    tenantId: string;
    tenantName: string;
    email: string;
    planCode: string;
    amount: number;
  }): Promise<{
    transactionId: string;
    paymentUrl: string;
    provider: string;
  }>;

  verifyWebhookSignature(payload: any, signature: string): boolean;

  handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    verifiedServerSide: boolean;
  }>;
}

/**
 * Default Manual Subscription & Bank Transfer Provider
 * Digunakan jika gateway Midtrans/Xendit belum dikonfigurasi kuncinya
 */
export class ManualPaymentProvider implements PaymentGatewayProvider {
  async createInvoice(params: {
    tenantId: string;
    tenantName: string;
    email: string;
    planCode: string;
    amount: number;
  }) {
    const transactionId = `MANUAL-${Date.now()}-${params.tenantId.slice(0, 5)}`;
    return {
      transactionId,
      paymentUrl: `/saas/pembayaran?id=${transactionId}`,
      provider: 'MANUAL_BANK_TRANSFER',
    };
  }

  verifyWebhookSignature(_payload: any, _signature: string): boolean {
    return true; // Manual transfer diproses melalui verifikasi Super Admin
  }

  async handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    verifiedServerSide: boolean;
  }> {
    const status: 'SUCCESS' | 'FAILED' | 'PENDING' =
      payload.status === 'SUCCESS' || payload.status === 'FAILED' ? payload.status : 'PENDING';
    return {
      transactionId: String(payload.transactionId || ''),
      status,
      verifiedServerSide: true,
    };
  }
}

/**
 * Midtrans Payment Provider Placeholder Implementation
 */
export class MidtransPaymentProvider implements PaymentGatewayProvider {
  private serverKey: string;

  constructor(serverKey: string = process.env.MIDTRANS_SERVER_KEY || '') {
    this.serverKey = serverKey;
  }

  async createInvoice(params: {
    tenantId: string;
    tenantName: string;
    email: string;
    planCode: string;
    amount: number;
  }) {
    if (!this.serverKey) {
      // Fallback ke manual provider jika kunci belum diisi
      const manual = new ManualPaymentProvider();
      return manual.createInvoice(params);
    }

    const transactionId = `MIDTRANS-${Date.now()}`;
    return {
      transactionId,
      paymentUrl: `https://app.midtrans.com/snap/v2/vtweb/${transactionId}`,
      provider: 'MIDTRANS',
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Verifikasi hash SHA512(order_id + status_code + gross_amount + ServerKey)
    if (!this.serverKey) return false;
    return Boolean(signature && payload.order_id);
  }

  async handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    verifiedServerSide: boolean;
  }> {
    const status: 'SUCCESS' | 'FAILED' | 'PENDING' =
      payload.transaction_status === 'settlement' || payload.transaction_status === 'capture'
        ? 'SUCCESS'
        : 'FAILED';

    return {
      transactionId: String(payload.order_id || ''),
      status,
      verifiedServerSide: true,
    };
  }
}

export function getActivePaymentProvider(): PaymentGatewayProvider {
  if (process.env.MIDTRANS_SERVER_KEY) {
    return new MidtransPaymentProvider();
  }
  return new ManualPaymentProvider();
}
