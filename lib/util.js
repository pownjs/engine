const ensureArray = (input) => {
    return Array.isArray(input) ? input : input ? [input] : []
}

const ensureObject = (input) => {
    return typeof(input) === 'object' ? input : { value: input }
}

const btoa = (input) => (!Buffer.isBuffer(input) ? Buffer.from(input) : input).toString('base64')
const atob = (input) => Buffer.from(input, 'base64')

module.exports = { ensureArray, ensureObject, btoa, atob }
