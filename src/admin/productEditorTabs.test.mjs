import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeProductTab, isProductTabDirty } from './productEditorTabs.js'

const saved = { name: 'Game A', categoryId: 'c1', thumbnailUrl: '/old.png', isActive: true, isFeatured: false, sortOrder: 0 }
const draft = { ...saved, name: 'Game B', thumbnailUrl: '/new.png', isActive: false }

test('saving information never saves unsaved image or publishing changes', () => {
  const result = mergeProductTab(saved, draft, 'information')
  assert.equal(result.name, 'Game B')
  assert.equal(result.thumbnailUrl, '/old.png')
  assert.equal(result.isActive, true)
})

test('saving image never saves unsaved information', () => {
  const result = mergeProductTab(saved, draft, 'images')
  assert.equal(result.thumbnailUrl, '/new.png')
  assert.equal(result.name, 'Game A')
  assert.equal(result.isActive, true)
})

test('dirty flags are isolated to each tab', () => {
  assert.ok(isProductTabDirty(saved, draft, 'information'))
  assert.ok(isProductTabDirty(saved, draft, 'images'))
  assert.ok(isProductTabDirty(saved, draft, 'publishing'))
  assert.equal(isProductTabDirty(saved, saved, 'variants'), false)
})
