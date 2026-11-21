const missingRelationCodes = new Set(['42P01', 'PGRST205']);

export function normalizePaymentMethod(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isActive(row) {
  if (typeof row.is_active === 'boolean') return row.is_active;
  if (typeof row.active === 'boolean') return row.active;
  return true;
}

export function normalizePaymentMethodRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter(row => row && typeof row === 'object' && isActive(row))
    .map(row => {
      const rawMethodCode = String(row.method_code ?? row.code ?? row.id ?? '').trim();
      const displayName = String(row.display_name ?? row.label ?? row.name ?? rawMethodCode).trim();
      const normalizedCode = normalizePaymentMethod(rawMethodCode || displayName);
      const methodCode = normalizedCode === 'vodafonecash'
        ? 'vodafone_cash'
        : normalizedCode === 'instapay'
          ? 'instapay'
          : rawMethodCode;
      const id = String(row.id ?? methodCode ?? displayName).trim();
      const identifier = String(
        row.payment_identifier ?? row.account_value ?? row.identifier ?? row.account ?? ''
      ).trim();
      const instructions = typeof row.instructions === 'string' && row.instructions
        ? row.instructions
        : methodCode === 'instapay'
          ? 'حوّل المبلغ إلى حساب InstaPay الموضح، واكتب رقم الطلب في ملاحظات التحويل إن أمكن.'
          : methodCode === 'vodafone_cash'
            ? 'حوّل المبلغ إلى رقم Vodafone Cash الموضح، ثم ارفع صورة الإيصال لإتمام الطلب.'
            : '';

      return {
        id,
        method_code: methodCode || id || displayName,
        display_name: displayName,
        label: String(row.label ?? displayName).trim(),
        payment_identifier: identifier,
        instructions,
      };
    })
    .filter(method => method.display_name);
}

export async function loadActivePaymentMethods(client) {
  let lastMissingError = null;

  for (const table of ['payment_methods', 'payment_method']) {
    const { data, error } = await client.from(table).select('*');
    if (!error) {
      return { rows: normalizePaymentMethodRows(data), error: null, table };
    }
    if (missingRelationCodes.has(error.code)) {
      lastMissingError = error;
      continue;
    }
    return { rows: [], error, table };
  }

  return {
    rows: [],
    error: lastMissingError || { code: 'PAYMENT_METHODS_MISSING' },
    table: null,
  };
}

export function findPaymentMethod(methods, requestedValue) {
  const requested = normalizePaymentMethod(requestedValue);
  if (!requested) return null;

  return methods.find(method => {
    const aliases = [method.id, method.method_code, method.label, method.display_name];
    if (method.display_name === 'Vodafone Cash' || method.label === 'Vodafone Cash') {
      aliases.push('vodafone_cash');
    }
    if (method.display_name === 'InstaPay' || method.label === 'InstaPay') {
      aliases.push('instapay');
    }
    return aliases.some(value => normalizePaymentMethod(value) === requested);
  }) || null;
}

export function canonicalPaymentMethodLabel(method) {
  const values = [method?.id, method?.method_code, method?.label, method?.display_name];
  if (values.some(value => normalizePaymentMethod(value) === 'vodafonecash')) return 'Vodafone Cash';
  if (values.some(value => normalizePaymentMethod(value) === 'instapay')) return 'InstaPay';
  return null;
}
