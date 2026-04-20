const assert = require('assert')
const { mappings } = require('..')

const classMapping = mappings.find(m => m.path === 'sensors.ais.class')
assert.ok(classMapping, 'sensors.ais.class mapping is registered')
assert.strictEqual(classMapping.key, 'MMSI', 'class mapping is triggered by MMSI so it is always emitted')

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: 9181786 }, 123456789),
  'A',
  'valid non-zero IMO maps to class A'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: '9181786' }, 123456789),
  'A',
  'valid IMO as string still maps to class A'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: 0 }, 123456789),
  'B',
  'IMO of 0 maps to class B'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: '0' }, 123456789),
  'B',
  'IMO string "0" maps to class B'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789 }, 123456789),
  'B',
  'missing IMO maps to class B'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: 'N/A' }, 123456789),
  'B',
  'non-numeric IMO placeholder maps to class B'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: 'UNKNOWN' }, 123456789),
  'B',
  'non-numeric IMO text maps to class B'
)

assert.strictEqual(
  classMapping.conversion({ MMSI: 123456789, IMO: '' }, 123456789),
  'B',
  'empty IMO string maps to class B'
)

console.log('All tests passed.')
