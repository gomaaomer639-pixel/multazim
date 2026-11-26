import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../supabase/functions/create-order/index.ts', import.meta.url), 'utf8');

test('receipt storage path interpolates the validated file extension', () => {
  assert.match(
    source,
    /const proofPath = `\$\{crypto\.randomUUID\(\)\}\.\$\{fileType\.extension\}`;/,
  );
  assert.doesNotMatch(source, /const proofPath = `\$\{crypto\.randomUUID\(\)\}\.\{fileType\.extension\}`;/);
});
