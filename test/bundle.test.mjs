import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')
const pkg = JSON.parse(read('package.json'))

test('the manifest declares the dual-face bundle and the client entry', () => {
  assert.equal(pkg.name, 'dsh-panel-titlebar')
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.deepEqual(pkg.dsh.client.inject, ['@deepseek-ai/dsh-client-ui-sidebar'])
})

test('the bundle patch mounts one row named after the package', () => {
  const patch = read('cordis.patch.yml')
  assert.match(patch, /^-\s+insert:/m)
  assert.match(patch, /^\s{4}-\s+id:\s+panel-titlebar$/m)
  assert.match(patch, /^\s{6}name:\s+dsh-panel-titlebar$/m)
  assert.equal((patch.match(/- id:/g) ?? []).length, 1)
})

test('display metadata describes the delivered capability in both locales', () => {
  for (const locale of ['en', 'zh']) {
    const resource = JSON.parse(read(`locale/${locale}.json`))
    assert.ok(resource.meta.title.length > 0, `${locale}: meta.title`)
    assert.ok(resource.meta.description.length > 20, `${locale}: meta.description`)
  }
})

test('every exported runtime file exists', () => {
  for (const path of [
    pkg.main,
    pkg.dsh.bundle.patch,
    pkg.dsh.client && Object.values(pkg.exports)[0],
    pkg.exports['./client'],
    pkg.exports['./icon'],
    'locale/en.json',
    'locale/zh.json',
    'LICENSE',
    'README.md',
    'README.zh.md',
    'CHANGELOG.md',
  ]) {
    if (path === undefined) continue
    assert.ok(existsSync(join(root, path)), `${path} is missing`)
  }
})

test('the client module registers under the package name', () => {
  const client = read('client.js')
  assert.match(client, /window\.__ModuleLoader__\.load\(\{/)
  assert.match(client, /id:\s*"dsh-panel-titlebar"/)
  assert.match(client, /apply\(ctx\)/)
})

test('the stylesheet only restyles the two measured, marked seats', () => {
  const client = read('client.js')
  const opening = 'const CSS = `'
  const start = client.indexOf(opening)
  assert.ok(start > 0, 'the stylesheet constant must exist')
  const from = start + opening.length
  const to = client.indexOf('`;', from)
  assert.ok(to > from, 'the stylesheet constant must be terminated')
  const css = client
    .slice(from, to)
    .replace(/\$\{[^}]*\}/g, 'INTERPOLATED')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  const rules = css
    .split('}')
    .map((block) => block.split('{')[0].trim())
    .filter((selector) => selector.length > 0)
  assert.ok(rules.length >= 6, 'expected the caption-row and stats rules')
  const scopes = ['html[data-windows-titlebar]', 'html[data-dsh-statbar']
  for (const selector of rules) {
    for (const line of selector.split('\n').map((entry) => entry.trim()).filter((entry) => entry.length > 0)) {
      assert.ok(
        scopes.some((scope) => line.startsWith(scope)),
        `every rule must carry a measured seat scope, found: ${line}`,
      )
    }
  }

  assert.match(css, /position:\s*fixed/)
  assert.match(css, /--dsh-panel-titlebar-left/)
  assert.match(css, /\[data-composer-dock\]/)
  assert.match(css, /--dsh-statbar-left/)
  assert.doesNotMatch(client, /document\.body\.appendChild|removeChild|innerHTML/)
})

test('the caption hoist follows the 0.2.2 entry wrapper and its scroll ports', () => {
  const client = read('client.js')
  const opening = 'const CSS = `'
  const start = client.indexOf(opening) + opening.length
  const css = client.slice(start, client.indexOf('`;', start)).replace(/\/\*[\s\S]*?\*\//g, '')
  // 0.2.2 wraps each entry in a `panelEntry` and hides the list inside the
  // sidebar's scroll ports, so the marker must match at any depth.
  assert.match(css, /nav:has\(\[class\*="panelRow"\]\)/, 'the row marker must not require a direct child')
  assert.doesNotMatch(css, /nav:has\(> \[class\*="panelRow"\]\)/, 'the direct-child marker no longer matches')
  assert.match(css, /> \[class\*="panelEntry"\] \{\s*border: 0;\s*background: transparent;/, 'the wrapper carries no sidebar paint')
  assert.match(css, /\[class\*="panelUnpin"\] \{\s*display: none;/, 'the inline unpin slot has no room in a menu bar')
  assert.match(css, /\[class\*="panelRow"\]:is\([^)]*\[aria-current="page"\][^)]*\) \{\s*background: var\(--dsw-alias-interactive-bg-hover\);/, 'the selected row is painted from the shipped state marker')
  // A query container is a containing block for fixed descendants; the port
  // and the region that holds it both have to be withdrawn.
  assert.match(css, /\[data-sidebar-scrollport\],\s*html\[data-windows-titlebar\] :has\(> \[data-sidebar-scrollport\]\) \{\s*container-type: normal !important;/)
})

test('the session stats follow the View tab row and fall back cleanly', () => {
  const client = read('client.js')
  assert.match(client, /function statPlacer/)
  assert.match(client, /button\[class\*="viewsMore"\]/)
  assert.match(client, /class\*="viewTabs"/)
  assert.match(client, /removeAttribute\("data-dsh-statbar"\)/, 'the dock must return when the anchor is gone')
  assert.match(client, /setAttribute\("data-dsh-statbar"/)
})

test('the hoisted dock keeps resolving against the viewport', () => {
  const client = read('client.js')
  // A composited composer seat is the containing block for fixed descendants,
  // so the hoist has to withdraw that hint while it is active.
  assert.match(
    client,
    /html\[data-dsh-statbar\] \[data-composer-seat\] \{\s*will-change: auto !important;/,
    'the seat hint that captures the fixed dock must be withdrawn while hoisted',
  )
  // And a build that captures it anyway must fall back to the shipped place
  // instead of parking the pills on the composer.
  assert.match(client, /let parked = false/)
  assert.match(client, /parked = true[\s\S]*?removeAttribute\("data-dsh-statbar"\)/)
})

test('a code reload rewrites the stylesheet instead of running the old one', () => {
  const client = read('client.js')
  assert.match(
    client,
    /if \(tag\.textContent !== CSS\) tag\.textContent = CSS/,
    'an existing tag must be brought up to date, not skipped',
  )
  assert.match(client, /dataset\.pluginOwner/, 'the teardown must drop only its own tag')
})

test('the placer follows the caption menubar instead of a hardcoded offset', () => {
  const client = read('client.js')
  assert.match(client, /\[data-windows-menu\]/)
  assert.match(client, /getBoundingClientRect\(\)/)
  assert.match(client, /ctx\.effect\(/)
})

test('a second press on the selected entry returns to the conversation', () => {
  const client = read('client.js')
  assert.match(client, /inject: \["layout"\]/)
  assert.match(client, /selectPanel\(null\)/)
  assert.match(client, /getAttribute\("aria-current"\) !== "page"/)
  assert.match(client, /addEventListener\("pointerdown", onPointerDown, true\)/, 'cancel on the press')
  assert.match(client, /addEventListener\("click", onClick, true\)/, 'keyboard activation still cancels')
  assert.match(client, /removeEventListener\("pointerdown", onPointerDown, true\)/)
  assert.match(client, /removeEventListener\("click", onClick, true\)/)
  assert.match(client, /stopPropagation\(\)/, 'the shipped re-select must be preempted')
  assert.match(client, /getAttribute\("aria-haspopup"\) !== null/, 'the More launcher must stay a launcher')
  assert.match(client, /const nav = row\.closest\("nav"\);\s*if \(nav === null\) return null;/, 'the toggle stays scoped to rows inside the panel nav')
  assert.doesNotMatch(client, /:scope > \[class\*="panelRow"\]/, 'the direct-child check no longer matches 0.2.2')
  assert.match(client, /data-dsh-pending/, 'the press must look acted on immediately')
})
