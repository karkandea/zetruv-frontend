import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWhatsApp, parseWhatsAppInput } from './whatsappPhone.js'
test('WhatsApp country calling code normalizes local and international formats', () => {
  assert.equal(normalizeWhatsApp('081234567890','ID'), '+6281234567890')
  assert.equal(normalizeWhatsApp('6281234567890','ID'), '+6281234567890')
  assert.equal(normalizeWhatsApp('81234567890','ID'), '+6281234567890')
  assert.equal(normalizeWhatsApp('91234567','SG'), '+6591234567')
  assert.equal(normalizeWhatsApp('0123456789','MY'), '+60123456789')
  assert.equal(parseWhatsAppInput('+65 9123 4567','ID').country,'SG')
  assert.equal(normalizeWhatsApp('12345','ID'),'')
  assert.equal(normalizeWhatsApp('abc081234567890','ID'),'')
})
