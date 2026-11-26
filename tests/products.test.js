import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductDiscount, mapActiveProducts } from '../src/lib/products.js';

test('storefront products include only explicitly active catalog rows and keep current prices', () => {
  const products = mapActiveProducts([
    { id: 'pdf', name: 'PDF جديد', price: '59.5', old_price: '79', active: true },
    { id: 'printed', name: 'نسخة مطبوعة', price: 89, active: false },
    { id: 'unknown', name: 'سعر غير صالح', price: null, active: true },
  ], [{ id: 'pdf', description: 'تفاصيل النسخة' }]);

  assert.equal(products.length, 1);
  assert.equal(products[0].price, 59.5);
  assert.equal(products[0].old_price, 79);
  assert.equal(products[0].description, 'تفاصيل النسخة');
});

test('discount is shown only for a valid old price greater than the current price', () => {
  assert.deepEqual(getProductDiscount({ price: 60, old_price: 100 }), {
    oldPrice: 100,
    percentage: 40,
  });
  assert.equal(getProductDiscount({ price: 60, old_price: 60 }), null);
  assert.equal(getProductDiscount({ price: 60, old_price: 50 }), null);
  assert.equal(getProductDiscount({ price: 60, old_price: 'not-a-price' }), null);
});
