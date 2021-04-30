const assert = require('assert')

const { Template } = require('../lib/template')

describe('template', () => {
    describe('Template', () => {
        it('#test', async() => {
            const t = new Template()

            assert(await t.test({ b64: Buffer.from('test').toString('base64') }, 'test'))
            assert(!await t.test({ b64: Buffer.from('test').toString('base64') }, 'tset'))
        })
    })
})
