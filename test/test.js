const assert = require('assert')
const Module = require('module')

const cannedResponse = JSON.stringify([
  {},
  [
    { MMSI: 111111111, IMO: 9181786, TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 222222222, IMO: 0,       TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 333333333, IMO: 'N/A',   TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 444444444,               TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 555555555, IMO: 123456,  TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 666666666, IMO: 12345678,TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 777777777, IMO: '9181786',TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 },
    { MMSI: 888888888, IMO: '0000000',TIME: '2024-01-01 12:00:00 UTC', LATITUDE: 0, LONGITUDE: 0 }
  ]
])

const originalLoad = Module._load
Module._load = function(request) {
  if (request === 'superagent-promise') {
    return function() {
      return function() {
        return { end: () => Promise.resolve({ text: cannedResponse }) }
      }
    }
  }
  return originalLoad.apply(this, arguments)
}

const factory = require('..')

const deltas = []
const app = {
  selfId: 'test-self',
  debug: () => {},
  getSelfPath: () => ({ value: { latitude: 0, longitude: 0 } }),
  handleMessage: (_id, delta) => deltas.push(delta)
}

const plugin = factory(app)
plugin.start({ apikey: 'x', url: 'http://example.invalid/ws', updaterate: 61, boxEnabled: true })

setImmediate(() => {
  plugin.stop()

  const classByMmsi = {}
  for (const delta of deltas) {
    const match = delta.context.match(/mmsi:(\d+)$/)
    if (!match) continue
    const entry = delta.updates[0].values.find(v => v.path === 'sensors.ais.class')
    if (entry) classByMmsi[match[1]] = entry.value
  }

  assert.strictEqual(classByMmsi['111111111'], 'A', '7-digit IMO emits class A')
  assert.strictEqual(classByMmsi['222222222'], 'B', 'IMO of 0 emits class B')
  assert.strictEqual(classByMmsi['777777777'], 'A', '7-digit IMO string emits class A')
  assert.strictEqual(classByMmsi['888888888'], 'B', 'zero-padded IMO value of 0 emits class B')
  assert.strictEqual(classByMmsi['333333333'], undefined, 'non-numeric IMO is invalid and emits no class')
  assert.strictEqual(classByMmsi['444444444'], undefined, 'missing IMO is invalid and emits no class')
  assert.strictEqual(classByMmsi['555555555'], undefined, '6-digit IMO is invalid and emits no class')
  assert.strictEqual(classByMmsi['666666666'], undefined, '8-digit IMO is invalid and emits no class')

  console.log('All tests passed.')
})
