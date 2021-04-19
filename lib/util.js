const ensureArray = (input) => {
    return Array.isArray(input) ? input : input ? [input] : []
}

const ensureObject = (input) => {
    return typeof(input) === 'object' ? input : { value: input }
}

module.exports = { ensureArray, ensureObject }
