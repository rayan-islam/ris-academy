const SSLC_STORE_ID = process.env.SSLC_STORE_ID || '';
const SSLC_STORE_PASSWORD = process.env.SSLC_STORE_PASSWORD || '';
const SSLC_BASE_URL = process.env.SSLC_BASE_URL || 'https://sandbox.sslcommerz.com';

interface SSLCommerzSession {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  product_name: string;
  product_category: string;
  product_profile: string;
}

interface SSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  storeBanner?: string;
}

export async function createSSLCSession(params: SSLCommerzSession): Promise<SSLCommerzResponse | null> {
  try {
    const response = await fetch(`${SSLC_BASE_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        store_id: SSLC_STORE_ID,
        store_passwd: SSLC_STORE_PASSWORD,
        ...params,
      } as unknown as Record<string, string>),
    });
    return await response.json();
  } catch (error) {
    console.error('SSLCommerz session creation failed:', error);
    return null;
  }
}

export async function validateSSLCPayment(valId: string): Promise<{ status: string; amount: number; tran_id: string } | null> {
  try {
    const url = `${SSLC_BASE_URL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${SSLC_STORE_ID}&store_passwd=${SSLC_STORE_PASSWORD}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('SSLCommerz validation failed:', error);
    return null;
  }
}

export async function initiateSSLRefund(bank_tran_id: string, refund_amount: number, refund_remarks: string) {
  try {
    const response = await fetch(`${SSLC_BASE_URL}/validator/api/merchantTransIDvalidationAPI.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        store_id: SSLC_STORE_ID,
        store_passwd: SSLC_STORE_PASSWORD,
        bank_tran_id,
        refund_amount: refund_amount.toString(),
        refund_remarks,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('SSLCommerz refund failed:', error);
    return null;
  }
}
