const assert = require('assert')

const { Template } = require('../lib/template')

describe('template', () => {
    describe('Template', () => {
        it('#interpolate', () => {
            const t = new Template()

            assert(t.interpolate(1) === 1)
            assert(t.interpolate('test') === 'test')
            assert(t.interpolate('test${value}', { value: 123 }) === 'test123')
            assert(t.interpolate(['test${value}'], { value: 123 })[0] === 'test123')
            assert(t.interpolate({ value: 'test${value}' }, { value: 123 }).value === 'test123')
        })

        it('#test', async() => {
            const t = new Template()

            assert(await t.test({ lt: 1 }, 2))
            assert(await t.test({ gt: 2 }, 1))
            assert(await t.test({ lte: 1 }, 1))
            assert(await t.test({ gte: 1 }, 1))

            assert(await t.test({ b64: Buffer.from('test').toString('base64') }, 'test'))
            assert(!await t.test({ b64: Buffer.from('test').toString('base64') }, 'tset'))
        })
    })
})
