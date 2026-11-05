import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryPayload } from '../src/inquiry.mjs';
import { createHandler } from '../supabase/functions/chemicals-cms/handler.mjs';

function inquiryForm({ checked = true } = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    name: ' Test Person ', email: 'test@example.com', company: '', product: '',
    quantity: '', message: 'Please discuss this specification.', website: '',
  })) form.set(name, value);
  if (checked) form.set('consent', 'on');
  return form;
}

test('checked consent survives form validation and the API accepts the inquiry', async () => {
  const body = createInquiryPayload(inquiryForm());
  assert.equal(body.consent, true);
  let stored;
  const origin = 'http://127.0.0.1:4173';
  const handler = createHandler({
    url: 'https://project.supabase.co', secret: 'test-server-secret', origins: [origin],
    fetcher: async (url, options) => {
      if (url.endsWith('/rpc/cms_take_rate_limit')) return Response.json(true);
      assert.ok(url.endsWith('/cms_inquiries'));
      assert.equal(options.method, 'POST');
      stored = JSON.parse(options.body);
      return Response.json([]);
    },
  });
  const response = await handler(new Request('https://project.supabase.co/functions/v1/chemicals-cms?action=inquiry', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(stored.name, 'Test Person');
  assert.equal(stored.email, body.email);
  assert.equal(stored.message, body.message);
});

test('unchecked consent cannot produce a submission payload', () => {
  assert.throws(() => createInquiryPayload(inquiryForm({ checked: false })), /agree/);
});
