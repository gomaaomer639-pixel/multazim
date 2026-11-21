import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalPaymentMethodLabel,
  findPaymentMethod,
  loadActivePaymentMethods,
  normalizePaymentMethodRows,
} from '../supabase/functions/_shared/payment-methods.js';

test('normalizes modern and legacy rows without exposing unrelated columns', () => {
  const methods = normalizePaymentMethodRows([
    {
      method_code: 'vodafone_cash',
      display_name: 'Vodafone Cash',
      payment_identifier: 'value-is-preserved',
      is_active: true,
      internal_note: 'must not be returned',
    },
    { id: 'InstaPay', label: 'InstaPay', account_value: 'another-value', active: true },
    { id: 'disabled', label: 'Disabled', active: false },
  ]);

  assert.equal(methods.length, 2);
  assert.equal(methods[0].method_code, 'vodafone_cash');
  assert.equal(methods[1].payment_identifier, 'another-value');
  assert.equal(methods[1].method_code, 'instapay');
  assert.equal(Object.hasOwn(methods[0], 'internal_note'), false);
});

test('reads the existing plural table first and falls back only when it is missing', async () => {
  const queried = [];
  const client = {
    from(table) {
      queried.push(table);
      return {
        async select() {
          if (table === 'payment_methods') {
            return { data: null, error: { code: 'PGRST205' } };
          }
          return { data: [{ id: 'instapay', label: 'InstaPay', active: true }], error: null };
        },
      };
    },
  };

  const result = await loadActivePaymentMethods(client);
  assert.deepEqual(queried, ['payment_methods', 'payment_method']);
  assert.equal(result.error, null);
  assert.equal(result.rows[0].display_name, 'InstaPay');
});

test('does not fall back to another payment table after a permission or service error', async () => {
  const queried = [];
  const client = {
    from(table) {
      queried.push(table);
      return { async select() { return { data: null, error: { code: '42501' } }; } };
    },
  };

  const result = await loadActivePaymentMethods(client);
  assert.deepEqual(queried, ['payment_methods']);
  assert.equal(result.error.code, '42501');
});

test('matches either payment method schema to the accepted order labels', () => {
  const methods = normalizePaymentMethodRows([
    { method_code: 'vodafone_cash', display_name: 'Vodafone Cash', is_active: true },
    { id: 'instapay', label: 'InstaPay', active: true },
  ]);

  assert.equal(canonicalPaymentMethodLabel(findPaymentMethod(methods, 'vodafone_cash')), 'Vodafone Cash');
  assert.equal(canonicalPaymentMethodLabel(findPaymentMethod(methods, 'InstaPay')), 'InstaPay');
  assert.equal(findPaymentMethod(methods, 'unknown'), null);
});
