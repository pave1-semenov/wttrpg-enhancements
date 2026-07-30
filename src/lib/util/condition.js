const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'prototype', 'constructor'])
const CONDITION_ROOTS = new Set([
    'actor',
    'attacker',
    'target',
    'damage',
    'source',
    'professionTree'
])
const WEAPON_SKILL_TYPES = new Set([
    'weapon-skill',
    'wttrpg-enhancements.weapon-skill'
])
const RESOURCE_HELPERS = new Map([
    ['hp', ['derivedStats', 'hp', 'value']],
    ['maxHp', ['derivedStats', 'hp', 'max']],
    ['sta', ['derivedStats', 'sta', 'value']],
    ['maxSta', ['derivedStats', 'sta', 'max']],
    ['shield', ['derivedStats', 'shield', 'value']],
    ['maxShield', ['derivedStats', 'shield', 'max']],
    ['focus', ['derivedStats', 'focus', 'value']],
    ['maxFocus', ['derivedStats', 'focus', 'max']],
    ['resolve', ['derivedStats', 'resolve', 'value']],
    ['maxResolve', ['derivedStats', 'resolve', 'max']],
    ['vigor', ['derivedStats', 'vigor', 'value']],
    ['maxVigor', ['derivedStats', 'vigor', 'max']],
    ['luck', ['stats', 'luck', 'value']],
    ['maxLuck', ['stats', 'luck', 'max']],
    ['toxicity', ['stats', 'toxicity', 'value']],
    ['maxToxicity', ['stats', 'toxicity', 'max']]
])
const ARMOR_LOCATIONS = new Map([
    ['head', 'head'],
    ['torso', 'torso'],
    ['body', 'torso'],
    ['leftarm', 'leftArm'],
    ['rightarm', 'rightArm'],
    ['leftleg', 'leftLeg'],
    ['rightleg', 'rightLeg'],
    ['tailwing', 'tailWing']
])

export function evaluateCondition(expression, context) {
    if (!expression?.trim()) return true

    try {
        return Boolean(new ConditionParser(tokenize(expression), prepareConditionContext(context)).parse())
    } catch (error) {
        console.warn('WTTRPG Enhancements | Invalid enhancement condition', { expression, error: error.message })
        return false
    }
}

function tokenize(expression) {
    const tokens = []
    let offset = 0

    while (offset < expression.length) {
        const remaining = expression.slice(offset)
        const whitespace = remaining.match(/^\s+/)
        if (whitespace) {
            offset += whitespace[0].length
            continue
        }

        const previousToken = tokens.at(-1)
        const canStartDecimal = !previousToken
            || (previousToken.type === 'operator' && ![')', ']'].includes(previousToken.value))
        const operator = canStartDecimal && /^\.\d/.test(remaining)
            ? null
            : remaining.match(/^(&&|\|\||===|!==|==|!=|>=|<=|[()[\],.!><+\-*/%])/)
        if (operator) {
            tokens.push({ type: 'operator', value: operator[0] })
            offset += operator[0].length
            continue
        }

        const number = previousToken?.value === '.'
            ? remaining.match(/^\d+/)
            : remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)/)
        if (number) {
            tokens.push({ type: 'literal', value: Number(number[0]) })
            offset += number[0].length
            continue
        }

        if (remaining[0] === '"' || remaining[0] === "'") {
            const string = readString(remaining)
            tokens.push({ type: 'literal', value: string.value })
            offset += string.length
            continue
        }

        const identifier = remaining.match(/^[A-Za-z_$][\w$]*/)
        if (identifier) {
            const keywords = { true: true, false: false, null: null, undefined: undefined }
            const value = identifier[0]
            tokens.push(Object.hasOwn(keywords, value)
                ? { type: 'literal', value: keywords[value] }
                : { type: 'identifier', value })
            offset += value.length
            continue
        }

        throw new Error(`Unexpected token at position ${offset + 1}`)
    }

    return tokens
}

function readString(input) {
    const quote = input[0]
    let value = ''
    let escaped = false

    for (let index = 1; index < input.length; index++) {
        const character = input[index]
        if (escaped) {
            value += ({ n: '\n', r: '\r', t: '\t' })[character] ?? character
            escaped = false
        } else if (character === '\\') {
            escaped = true
        } else if (character === quote) {
            return { value, length: index + 1 }
        } else {
            value += character
        }
    }

    throw new Error('Unterminated string literal')
}

class ConditionParser {
    constructor(tokens, context) {
        this.tokens = tokens
        this.context = context
        this.position = 0
    }

    parse() {
        const result = this.parseOr()
        if (this.peek()) throw new Error(`Unexpected token "${this.peek().value}"`)
        return result
    }

    parseOr() { return this.parseBinary(() => this.parseAnd(), ['||']) }
    parseAnd() { return this.parseBinary(() => this.parseEquality(), ['&&']) }
    parseEquality() { return this.parseBinary(() => this.parseComparison(), ['===', '!==', '==', '!=']) }
    parseComparison() { return this.parseBinary(() => this.parseAdditive(), ['>', '>=', '<', '<=']) }
    parseAdditive() { return this.parseBinary(() => this.parseMultiplicative(), ['+', '-']) }
    parseMultiplicative() { return this.parseBinary(() => this.parseUnary(), ['*', '/', '%']) }

    parseBinary(parseOperand, operators) {
        let left = parseOperand()
        while (operators.includes(this.peek()?.value)) {
            left = applyOperator(this.consume().value, left, parseOperand())
        }
        return left
    }

    parseUnary() {
        const operator = this.peek()?.value
        if (['!', '+', '-'].includes(operator)) {
            this.consume()
            const value = this.parseUnary()
            return operator === '!' ? !value : operator === '+' ? +value : -value
        }
        return this.parsePrimary()
    }

    parsePrimary() {
        const token = this.consume()
        if (!token) throw new Error('Expected a value')

        let value
        if (token.type === 'literal') {
            value = token.value
        } else if (token.type === 'identifier') {
            value = this.peek()?.value === '('
                ? this.parseHelperCall(token.value)
                : resolveRoot(token.value, this.context)
        } else if (token.value === '(') {
            value = this.parseOr()
            if (this.consume()?.value !== ')') throw new Error('Expected closing parenthesis')
        } else {
            throw new Error(`Expected a value, received "${token.value}"`)
        }

        return this.parseMembers(value)
    }

    parseHelperCall(name) {
        this.consume()
        const args = []

        if (this.peek()?.value !== ')') {
            while (true) {
                args.push(this.parseOr())
                if (this.peek()?.value !== ',') break
                this.consume()
            }
        }

        if (this.consume()?.value !== ')') throw new Error('Expected closing parenthesis')
        return callHelper(name, args, this.context)
    }

    parseMembers(initialValue) {
        let value = initialValue

        while (this.peek()?.value === '.' || this.peek()?.value === '[') {
            const accessor = this.consume().value
            let property

            if (accessor === '.') {
                const token = this.consume()
                const isProperty = token?.type === 'identifier'
                    || (token?.type === 'literal' && Number.isInteger(token.value))
                if (!isProperty) throw new Error('Expected a property name')
                property = token.value
            } else {
                property = this.parseOr()
                if (this.consume()?.value !== ']') throw new Error('Expected closing bracket')
            }

            value = resolveProperty(value, property)
        }

        return value
    }

    peek() { return this.tokens[this.position] }
    consume() { return this.tokens[this.position++] }
}

function resolveRoot(root, context) {
    if (!CONDITION_ROOTS.has(root)) throw new Error(`Unknown condition root "${root}"`)
    return root === 'actor' ? context?.attacker : context?.[root]
}

function prepareConditionContext(context = {}) {
    const attacker = context?.attacker
    return {
        ...context,
        source: context?.source ?? getDamageSource(context?.damage),
        professionTree: context?.professionTree ?? getProfessionTree(attacker)
    }
}

function getDamageSource(damage) {
    if (damage?.item) return damage.item
    if (!damage?.itemUuid || typeof fromUuidSync !== 'function') return undefined

    try {
        return fromUuidSync(damage.itemUuid) ?? undefined
    } catch {
        return undefined
    }
}

function resolveProperty(value, property) {
    const key = String(property)
    if (FORBIDDEN_PROPERTIES.has(key)) throw new Error(`Property "${key}" is not allowed`)
    if (value == null) return undefined
    return value[key]
}

function callHelper(name, args, context) {
    const resourcePath = RESOURCE_HELPERS.get(name)
    if (resourcePath) return getActorProperty(args[0] ?? context?.attacker, ['system', ...resourcePath])

    switch (name) {
        case 'attribute':
            return getAttribute(args[0], args[1] ?? context?.attacker, 'value')
        case 'maxAttribute':
            return getAttribute(args[0], args[1] ?? context?.attacker, 'max')
        case 'stat':
            return getActorProperty(args[1] ?? context?.attacker, ['system', 'stats', args[0], 'value'])
        case 'hasActiveEffect':
            return Boolean(findActiveEffect(args[0], args[1] ?? context?.attacker))
        case 'getActiveEffect':
            return findActiveEffect(args[0], args[1] ?? context?.attacker)
        case 'armor':
            return getArmor(args, context)
        case 'isSourceAWeaponSkill':
            return isNamedSource(context?.source, WEAPON_SKILL_TYPES, args[0])
        case 'isSourceAWeapon':
            return isNamedSource(context?.source, new Set(['weapon']), args[0])
        case 'professionTree':
            return getProfessionTree(args[0] ?? context?.attacker)
        case 'professionSkill':
            return findProfessionSkill(args[0], args[1] ?? context?.attacker)
        case 'professionSkillRank':
            return getProfessionSkillRank(args[0], args[1] ?? context?.attacker)
        case 'hasProfessionSkill':
            return hasProfessionSkill(args, context)
        default:
            throw new Error(`Unknown condition helper "${name}"`)
    }
}

function isNamedSource(source, allowedTypes, expectedName) {
    if (!source || !allowedTypes.has(source.type)) return false
    if (expectedName == null || expectedName === '') return true
    return normalizeName(source.name) === normalizeName(expectedName)
}

function getProfessionTree(actor) {
    if (!actor) return undefined

    let profession
    if (typeof actor.getList === 'function') {
        profession = actor.getList('profession')?.[0]
    }
    profession ??= Array.from(actor.items ?? []).find(item => item?.type === 'profession')

    return profession?.system
}

function findProfessionSkill(name, actor) {
    if (typeof name !== 'string') return undefined
    const expectedName = normalizeName(name)
    if (!expectedName) return undefined

    const professionTree = getProfessionTree(actor)
    if (!professionTree) return undefined

    const skills = [
        professionTree.definingSkill,
        ...['skillPath1', 'skillPath2', 'skillPath3'].flatMap(path => {
            const skillPath = professionTree[path]
            return [skillPath?.skill1, skillPath?.skill2, skillPath?.skill3]
        })
    ]

    return skills.find(skill => normalizeName(skill?.skillName) === expectedName)
}

function getProfessionSkillRank(name, actor) {
    const skill = findProfessionSkill(name, actor)
    return skill ? Number(skill.level) || 0 : 0
}

function hasProfessionSkill(args, context) {
    const [name, rankOrActor, actorArg] = args
    const rankWasOmitted = rankOrActor == null || typeof rankOrActor === 'object'
    const minimumRank = rankWasOmitted ? 1 : Number(rankOrActor)
    const actor = (rankWasOmitted ? rankOrActor : actorArg) ?? context?.attacker
    return getProfessionSkillRank(name, actor) >= (Number.isFinite(minimumRank) ? minimumRank : 1)
}

function normalizeName(value) {
    return typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''
}

function getAttribute(name, actor, property) {
    if (typeof name !== 'string') return undefined
    const derived = getActorProperty(actor, ['system', 'derivedStats', name, property])
    return derived ?? getActorProperty(actor, ['system', 'stats', name, property])
}

function getActorProperty(actor, properties) {
    let value = actor
    for (const property of properties) {
        value = resolveProperty(value, property)
    }
    return value
}

function findActiveEffect(name, actor) {
    if (typeof name !== 'string' || !actor) return undefined
    const expectedName = name.trim().toLocaleLowerCase()
    if (!expectedName) return undefined

    const effects = actor.appliedEffects ?? actor.effects ?? []
    return Array.from(effects).find(effect => {
        const isActive = !effect.disabled
            && !effect.isDisabled
            && !effect.isSuppressed
            && effect.active !== false
        return isActive && effect.name?.trim().toLocaleLowerCase() === expectedName
    })
}

function getArmor(args, context) {
    let [location, actor] = args
    if (location?.system) {
        actor = location
        location = undefined
    }

    actor ??= context?.target ?? context?.attacker
    location ??= context?.damage?.location
    const locationName = normalizeArmorLocation(location)
    if (!actor || !locationName || typeof actor.getLocationArmor !== 'function') return undefined

    const locationData = typeof location === 'object'
        ? { ...location, name: locationName }
        : { name: locationName, value: locationName }
    return actor.getLocationArmor(locationData, context?.damage?.properties ?? {})?.totalSP
}

function normalizeArmorLocation(location) {
    const value = location?.name ?? location?.value ?? location
    if (typeof value !== 'string') return undefined
    return ARMOR_LOCATIONS.get(value.replace(/[\s_-]/g, '').toLocaleLowerCase())
}

function applyOperator(operator, left, right) {
    switch (operator) {
        case '||': return left || right
        case '&&': return left && right
        case '===': return left === right
        case '!==': return left !== right
        case '==': return left == right
        case '!=': return left != right
        case '>': return left > right
        case '>=': return left >= right
        case '<': return left < right
        case '<=': return left <= right
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': return left / right
        case '%': return left % right
        default: throw new Error(`Unsupported operator "${operator}"`)
    }
}
