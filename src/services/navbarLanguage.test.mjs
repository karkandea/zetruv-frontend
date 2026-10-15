import test from 'node:test'
import assert from 'node:assert/strict'
import { stableIcons } from '../data/stableIcons.js'
import {
  NAVBAR_COPY,
  NAVBAR_LANGUAGES,
  normalizeNavbarLanguage,
  readNavbarLanguage,
} from './navbarLanguage.js'

test('EN, ID, MY are distinct options with standard locale and flag icons', () => {
  assert.deepEqual(NAVBAR_LANGUAGES.map(({ code, badge }) => [code, badge]), [
    ['en', 'EN'], ['id', 'ID'], ['ms', 'MY'],
  ])
  for (const option of NAVBAR_LANGUAGES) {
    const flag = stableIcons[option.flag]
    assert.ok(flag?.startsWith('data:image/svg+xml'), option.flag)
    const markup = decodeURIComponent(flag.split(',')[1])
    assert.match(markup, /<svg/)
    assert.match(markup, /<rect/)
  }
})

test('unsupported or missing values fall back to English', () => {
  assert.equal(normalizeNavbarLanguage('en'), 'en')
  assert.equal(normalizeNavbarLanguage('id'), 'id')
  assert.equal(normalizeNavbarLanguage('ms'), 'ms')
  assert.equal(normalizeNavbarLanguage('my'), 'en') // MY is display-only; ms is locale.
  assert.equal(normalizeNavbarLanguage(null), 'en')
  assert.equal(readNavbarLanguage(), 'en') // Node has no window.
})

test('every option has complete navbar labels and copy', () => {
  const keys = Object.keys(NAVBAR_COPY.en)
  for (const { code } of NAVBAR_LANGUAGES) {
    for (const key of keys) {
      assert.ok(Object.hasOwn(NAVBAR_COPY[code], key), `${code} missing ${key}`)
    }
    assert.ok(NAVBAR_COPY[code].search)
    assert.ok(NAVBAR_COPY[code].cart)
  }
})
