const legacyTrackingTokenPattern = /^[A-Za-z0-9_-]{40,50}$/;

export function normalizeOrderNumber(value) {
  const compact = String(value || '').trim().toUpperCase().replace(/[\s-]/g, '');
  if (!/^MLT[A-HJ-NP-Z2-9]{12}$/.test(compact)) return '';
  const code = compact.slice(3);
  return `MLT-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

export function extractTrackingCredential(value, origin) {
  const input = String(value || '').trim();
  if (!input) return null;

  let credential = input;
  try {
    const url = new URL(input, origin);
    if (url.pathname.replace(/\/+$/, '') === '/track-order' && url.hash) {
      credential = decodeURIComponent(url.hash.slice(1));
    }
  } catch {
    // Raw order numbers and older tokens are also accepted.
  }

  credential = credential.startsWith('#') ? credential.slice(1) : credential;
  const orderNumber = normalizeOrderNumber(credential);
  if (orderNumber) return { type: 'orderNumber', value: orderNumber };
  if (legacyTrackingTokenPattern.test(credential)) {
    return { type: 'trackingToken', value: credential };
  }
  return null;
}
