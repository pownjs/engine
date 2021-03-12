const esprima = require('esprima')
const jsonPath = require('jsonpath')
const deepmerge = require('deepmerge')
const staticEval = require('static-eval')
const { RegExp } = require('@pown/regexp')

const { calculateEntropy } = require('./entropy')
const { asyncEvery, asyncSome, asyncNone } = require('./async')

const query = (object, path) => {
    if (!path.startsWith('$')) {
        path = `$.${path}`
    }

    return jsonPath.value(object, path)
}

const assign = (object, path, value) => {
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

const getArray = (input) => {
    return Array.isArray(input) ? input : input ? [input] : []
}

const getConditionFunc = (condition) => {
    return {
        'all': asyncEvery,

        'every': asyncEvery,
        'some': asyncSome,
        'none': asyncNone,

        'and': asyncEvery,
        'or': asyncSome,
        'not': asyncNone
    }[condition] || asyncEvery
}

const isString = (input) => {
    return typeof(input) === 'string' || input instanceof String
}

const isBuffer = (input) => {
    return Buffer.isBuffer(input)
}

class Matcher {
    constructor(matcher) {
        this.matcher = matcher
    }

    async test(input) {
        const { part, type, condition, word, words, regex, regexes, flag, flags, entropy, script } = this.matcher

        if (part && !isString(input)) {
            input = query(input, part || '$')
        }

        switch (type) {
            case 'word':
            case 'words':
                if (isString(input) || isBuffer(input)) {
                    return getConditionFunc(condition)(getArray(word || words || ''), (word) => {
                        return input.indexOf(word) >= 0
                    })
                }
                else {
                    return false
                }

            case 'regex':
            case 'regexes':
                if (isString(input) || isBuffer(input)) {
                    return getConditionFunc(condition)(getArray(regex || regexes || ''), (regex) => {
                        const r = new RegExp(regex, flag || flags || '')

                        return r.test(input)
                    })
                }
                else {
                    return false
                }

            case 'entropy':
                if (isString(input) || isBuffer(input)) {
                    return calculateEntropy(input) >= entropy
                }
                else {
                    return false
                }

            case 'script':
                return getConditionFunc(condition)(getArray(script || ''), (script) => {
                    return staticEval(esprima.parse(script || 'false').body[0].expression, input)
                })
        }

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`Invalid matcher type ${type}`)
        }

        return false
    }

    async match(input) {
        const { negative, not } = this.matcher

        if (negative || not) {
            return !this.test(input)
        }
        else {
            return this.test(input)
        }
    }
}

class MatcherSet {
    constructor(matchers, matchersCondition = 'and') {
        this.matchers = matchers
        this.matchersCondition = matchersCondition
    }

    async match(input) {
        return getConditionFunc(this.matchersCondition)(this.matchers, (matcher) => {
            if (!matcher) {
                return false
            }

            if (!matcher.match) {
                matcher = new Matcher(matcher)
            }

            return matcher.match(input)
        })
    }
}

class Extractor {
    constructor(extractor) {
        this.extractor = extractor
    }

    async extract(input) {
        const { part, type, name, jsonpath, value, path, regex, flag, flags, group, script } = this.extractor

        if (part && !isString(input)) {
            input = query(input, part || '$')
        }

        switch (type) {
            case 'value':
            case 'jsonpath':
                return assign({}, name || 'value', query(input, value || jsonpath || path || '$'))

            case 'regex':
                if (isString(input) || isBuffer(input)) {
                    const match = (new RegExp(regex, flag || flags || '')).match(input)

                    if (match) {
                        return assign({}, name || 'value', match[group || 0])
                    }
                }
                else {
                    if (process.env.NODE_ENV !== 'production') {
                        console.debug(`Invalid regex input`)
                    }

                    return {}
                }

            case 'script':
                return assign({}, name || 'value', staticEval(esprima.parse(script || '""').body[0].expression))
        }

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`Invalid extractor type ${type}`)
        }
    }
}

class ExtractorSet {
    constructor(extractors) {
        this.extractors = extractors
    }

    async extract(input) {
        const result = {}

        for (let extractor of this.extractors) {
            if (!extractor) {
                continue
            }

            if (!extractor.extract) {
                extractor = new Extractor(extractor)
            }

            Object.assign(result, deepmerge(result, await extractor.extract(input)))
        }

        return result
    }
}

class Task {
    constructor(task) {
        this.task = task
    }

    async match(input) {
        const {
            match,
            matcher,
            matchers,

            ['match-condition']: mc,
            ['matcher-condition']: mrc,
            ['matchers-condition']: mrsc,

            matchCondition = mc,
            matcherCondition = mrc,
            matchersCondition = mrsc
        } = this.task

        const m = getArray(match || matcher || matchers)
        const c = matchCondition || matcherCondition || matchersCondition || 'and'

        const ms = new MatcherSet(m, c)

        return ms.match(input)
    }

    async extract(input) {
        const {
            extract,
            extractor,
            extractors
        } = this.task

        const e = getArray(extract || extractor || extractors)

        const es = new ExtractorSet(e)

        return es.extract(input)
    }

    get data() {
        const {
            match,
            matcher,
            matchers,
            ['match-condition']: mc,
            ['matcher-condition']: mrc,
            ['matchers-condition']: mrsc,
            matchCondition,
            matcherCondition,
            matchersCondition,

            extract,
            extractor,
            extractors,

            ...data
        } = this.task

        match;
        matcher;
        matchers;
        mc;
        mrc;
        mrsc;
        matchCondition;
        matcherCondition;
        matchersCondition;
        extract;
        extractor;
        extractors;

        return data
    }

    async run(input) {
        const { id = `task-${Math.random().toString(32).slice(2)}` } = this.task

        let matches = false
        let data = {}
        let extracts = {}

        if (await this.match(input)) {
            matches = true
            data = data
            extracts = await this.extract(input)
        }

        return { id, matches, extracts, data }
    }
}

class TaskSet {
    constructor(tasks) {
        this.tasks = tasks
    }

    async run(input) {
        const result = []

        for (let task of this.tasks) {
            if (!task) {
                continue
            }

            if (!task.run) {
                task = new Task()
            }

            result.push(await task.run(input))
        }

        return result
    }
}

class Template {
    // typically you would implement your own template by extending the base class

    constructor(template) {
        this.template = template
    }

    async run(input) {
        const { id = `template-${Math.random().toString(32).slice(2)}`, ...tasks } = this.template

        let data = {}

        for (let [name, task] of Object.entries(tasks)) {
            if (!task.run) {
                task = new TaskSet(getArray(task))
            }

            data[name] = await task.run(input)
        }

        return { id, data }
    }
}

class TemplateSet {
    // typically you would implement your own template set by extending the base class

    constructor(templates) {
        this.templates = templates
    }

    async run(input) {
        const results = []

        for (let template of this.templates) {
            if (!template) {
                continue
            }

            if (!template.run) {
                template = new Template(template)
            }

            results.push(await template.run(input))
        }

        return results
    }
}

const createTaskSetClass = (Type) => {
    return class extends TaskSet {
        async run(...args) {
            const result = []

            for (let task of this.tasks) {
                if (!task) {
                    continue
                }

                if (!task.run) {
                    task = new Type(task)
                }

                result.push(await task.run(...args))
            }

            return result
        }
    }
}

const createTemplateSetClass = (Type) => {
    return class extends TemplateSet {
        async run(...args) {
            const results = []

            for (let template of this.templates) {
                if (!template) {
                    continue
                }

                if (!template.run) {
                    template = new Type(template)
                }

                results.push(await template.run(...args))
            }

            return results
        }
    }
}

const createSimpleTemplateHandler = (definition) => {
    class GenericTask extends Task {
        async run(name, ...args) {
            const {
                [name]: subdefinition
            } = definition

            const { pre, post } = subdefinition

            let results = await super.run(...(pre ? await pre(...args) : args))

            if (post) {
                results = await post(...args, results)
            }

            return results
        }
    }

    const GenericTaskSet = createTaskSetClass(GenericTask)

    class OperationTask extends Task {
        async run(...args) {
            const { ...rest } = this.task

            const results = []

            for (let [name, value] of Object.entries(rest)) {
                if (!Object.prototype.hasOwnProperty.call(definition, name)) {
                    continue
                }

                const ts = new GenericTaskSet(getArray(value))

                results.push(...await ts.run(name, ...args))
            }

            return results
        }
    }

    const OperationTaskSet = createTaskSetClass(OperationTask)

    class EngineTemplate extends Template {
        async run(...args) {
            const { op, ops, operation, operations, ...rest } = this.template

            const results = []

            for (let [name, value] of Object.entries(rest)) {
                if (!Object.prototype.hasOwnProperty.call(definition, name)) {
                    continue
                }

                const ot = new OperationTask({
                    [name]: value
                })

                results.push(...await ot.run(...args))
            }

            const ots = new OperationTaskSet(getArray(op || ops || operation || operations))

            for (let result of await ots.run(...args)) {
                results.push(...result)
            }

            return results
        }
    }

    const EngineTemplateSet = createTemplateSetClass(EngineTemplate)

    return { EngineTemplate, EngineTemplateSet, OperationTask, OperationTaskSet, GenericTask, GenericTaskSet }
}

module.exports = { Template, TemplateSet, Task, TaskSet, createTemplateSetClass, createTaskSetClass, createSimpleTemplateHandler, getArray }
