const esprima = require('esprima')
const jsonPath = require('jsonpath')
const deepmerge = require('deepmerge')
const staticEval = require('static-eval')
const { RegExp } = require('@pown/regexp')

const { calculateEntropy } = require('./entropy')
const { asyncEvery, asyncSome, asyncNone } = require('./async')
const { ensureArray, ensureObject, btoa, atob } = require('./util')

class Template {
    constructor(template) {
        this.template = template
    }

    // ---

    isString(input) {
        return typeof(input) === 'string' || input instanceof String
    }

    isBuffer(input) {
        return Buffer.isBuffer(input)
    }

    // ---

    query(object, path) {
        if (!path.startsWith('$')) {
            path = `$.${path}`
        }

        return jsonPath.value(object, path)
    }

    assign(object, path, value) {
        const root = object
        const parts = path.split('.')

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i]

            if (!object[part]) {
                object = object[part] = {}
            }
        }

        object[parts[parts.length - 1]] = value

        return root
    }

    // ---

    getEvaluationScope(scope) {
        return {
            ...scope,

            JSON,
            Math,
            encodeURI,
            decodeURI,
            encodeURIComponent,
            decodeURIComponent,
            escape,
            unescape,
            btoa,
            atob
        }
    }

    evaluate(script, scope) {
        return staticEval(esprima.parse(script || 'false').body[0].expression, this.getEvaluationScope(scope))
    }

    // ---

    interpolate(input, scope) {
        return input.split(/(\$\{.+?\})/g).map((token) => {
            if (token.startsWith('${') && token.endsWith('}')) {
                return this.evaluate(token.slice(2, -1), scope)
            }
            else {
                return token
            }
        }).join('')
    }

    // ---

    getConditionFunc(condition) {
        return {
            'all': asyncEvery,
            'any': asyncSome,

            'every': asyncEvery,
            'some': asyncSome,
            'none': asyncNone,

            'and': asyncEvery,
            'or': asyncSome,
            'not': asyncNone
        }[condition] || asyncEvery
    }

    // ---

    async toArray(items) {
        const results = []

        for await (let item of items) {
            results.push(item)
        }

        return results
    }

    // ---

    async getTaskDefinition(task) {
        const {
            id,

            match,
            matches,
            matcher,
            matchers,
            ['match-condition']: mc,
            ['matches-condition']: msc,
            ['matcher-condition']: mrc,
            ['matchers-condition']: mrsc,
            matchCondition = mc,
            matchesCondition = msc,
            matcherCondition = mrc,
            matchersCondition = mrsc,

            extract,
            extracts,
            extractor,
            extractors,

            ...definition
        } = task

        id;

        match;
        matches
        matcher;
        matchers;
        mc;
        msc;
        mrc;
        mrsc;
        matchCondition;
        matchesCondition;
        matcherCondition;
        matchersCondition;

        extract;
        extracts;
        extractor;
        extractors;

        return definition
    }

    // ---

    async test(matcher, input = {}) {
        const { part, condition, number, numbers, string, strings, word, words, regex, regexes, flag, flags, entropy, script } = matcher

        if (part && !this.isString(input)) {
            input = this.query(input, part || '')
        }

        let { type } = matcher

        if (!type) {
            if (number || numbers) {
                type = 'number'
            }
            else
            if (string || strings || word || words) {
                type = 'string'
            }
            else
            if (regex || regexes) {
                type = 'regex'
            }
            else
            if (entropy) {
                type = 'entropy'
            }
            else
            if (script) {
                type = 'script'
            }
        }

        switch (type) {
            case 'number':
            case 'numbers':
                return this.getConditionFunc(condition)(ensureArray(number || numbers || NaN), (number) => {
                    number = parseInt(number)

                    return !isNaN(number) && input === number
                })

            case 'string':
            case 'strings':
            case 'word':
            case 'words':
                if (this.isString(input) || this.isBuffer(input)) {
                    return this.getConditionFunc(condition)(ensureArray(word || words || ''), (word) => {
                        return input.indexOf(word) >= 0
                    })
                }
                else {
                    return false
                }

            case 'regex':
            case 'regexes':
                if (this.isString(input) || this.isBuffer(input)) {
                    return this.getConditionFunc(condition)(ensureArray(regex || regexes || ''), (regex) => {
                        const r = new RegExp(regex, flag || flags || '')

                        return r.test(input)
                    })
                }
                else {
                    return false
                }

            case 'entropy':
                if (this.isString(input) || this.isBuffer(input)) {
                    return calculateEntropy(input) >= entropy
                }
                else {
                    return false
                }

            case 'script':
                return this.getConditionFunc(condition)(ensureArray(script || ''), (script) => {
                    return this.evaluate(script, input)
                })
        }

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`Invalid matcher type ${type}`)
        }

        return false
    }

    async match(matcher, input = {}) {
        const { negative, not, ...rest } = matcher

        if (negative || not) {
            return !this.test(rest, input)
        }
        else {
            return this.test(rest, input)
        }
    }

    async matchWithTask(task, input = {}) {
        const {
            match,
            matches,
            matcher,
            matchers,

            ['match-condition']: mc,
            ['matches-condition']: msc,
            ['matcher-condition']: mrc,
            ['matchers-condition']: mrsc,

            matchCondition = mc,
            matchesCondition = msc,
            matcherCondition = mrc,
            matchersCondition = mrsc
        } = task

        const m = ensureArray(match || matches || matcher || matchers)
        const c = matchCondition || matchesCondition || matcherCondition || matchersCondition || 'and'

        return this.getConditionFunc(c)(m, (m) => this.match(m, input))
    }

    // ---

    async extract(extractor, input = {}) {
        const { part, name, value, jsonpath, path, regex, flag, flags, group, script } = extractor

        if (part && !this.isString(input)) {
            input = this.query(input, part || '$')
        }

        let { type } = extractor

        if (!type) {
            if (value || jsonpath) {
                type = 'value'
            }
            else
            if (regex) {
                type = 'regex'
            }
            else
            if (script) {
                type = 'script'
            }
        }

        switch (type) {
            case 'value':
            case 'jsonpath':
                return this.assign({}, name || 'value', this.query(input, value || jsonpath || path || '$'))

            case 'regex':
                if (this.isString(input) || this.isBuffer(input)) {
                    const match = (new RegExp(regex, flag || flags || '')).match(input)

                    if (match) {
                        return this.assign({}, name || 'value', match[group || 0])
                    }
                }
                else {
                    if (process.env.NODE_ENV !== 'production') {
                        console.debug(`Invalid regex input`)
                    }

                    return {}
                }

            case 'script':
                return this.evaluate(script, input)
        }

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`Invalid extractor type ${type}`)
        }
    }

    async extractWithTask(task, input = {}) {
        const {
            extract,
            extracts,
            extractor,
            extractors
        } = task

        let result = {}

        for (let e of ensureArray(extract || extracts || extractor || extractors)) {
            result = deepmerge(result, await this.extract(e, input))
        }

        return result
    }

    // ---

    async executeTask(taskName, task, input = {}) {
        // NOTE: implementors should override this method
    }

    // ---

    async runTask(taskName, task, input = {}, ...args) {
        // NOTE: implementors can override the method to normalise the task name

        const result = await this.executeTask(taskName, await this.getTaskDefinition(task), input, ...args)

        let matches = false
        let extracts = {}

        let output = ensureObject(input)

        if (await this.matchWithTask(task, result || input)) {
            matches = true
            extracts = await this.extractWithTask(task, result || input)

            output = deepmerge(output, extracts)
        }

        return { id: task.id, name: taskName, result, input, matches, extracts, output }
    }

    // ---

    async * runTaskSetIt(taskName, tasks, input = {}, ...args) {
        for (let task of tasks) {
            const result = await this.runTask(taskName, task, input, ...args)

            yield result

            if (!result.matches) {
                return
            }
            else {
                input = result.output
            }
        }
    }

    async runTaskSet(taskName, tasks, input = {}, ...args) {
        return this.toArray(this.runTaskSetIt(taskName, tasks, input, ...args))
    }

    // ---

    async * runTaskDefinitionsIt(taskDefinitions, input = {}, ...args) {
        for (let [taskName, taskConfig] of Object.entries(taskDefinitions)) {
            for await (let result of this.runTaskSetIt(taskName, ensureArray(taskConfig), input, ...args)) {
                yield result

                if (!result.matches) {
                    return
                }
                else {
                    input = result.output
                }
            }
        }
    }

    async runTaskDefinitions(taskDefinitions, input = {}, ...args) {
        return await this.toArray(this.runTaskDefinitionsIt(taskDefinitions, input, ...args))
    }

    // ---

    async * runIt(input = {}, ...args) {
        const { id, ...tasks } = this.template

        id;

        yield* this.runTaskDefinitionsIt(tasks, input, ...args)
    }

    async run(input = {}, ...args) {
        const { id } = this.template

        const tasks = await this.toArray(this.runIt(input, ...args))

        const output = (tasks[tasks.length - 1] || {}).output || {}

        return { id, input, tasks, output }
    }
}

module.exports = { Template }
