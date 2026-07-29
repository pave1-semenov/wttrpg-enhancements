const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'prototype', 'constructor'])

export function evaluateCondition(expression, context) {
    if (!expression?.trim()) return true

    try {
        return Boolean(new ConditionParser(tokenize(expression), context).parse())
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

        const operator = remaining.match(/^(&&|\|\||===|!==|==|!=|>=|<=|[()!><+\-*/%])/)
        if (operator) {
            tokens.push({ type: 'operator', value: operator[0] })
            offset += operator[0].length
            continue
        }

        const number = remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)/)
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

        const identifier = remaining.match(/^[A-Za-z_$][\w$]*(?:\.(?:[A-Za-z_$][\w$]*|\d+))*/)
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
        if (token.type === 'literal') return token.value
        if (token.type === 'identifier') return resolvePath(token.value, this.context)
        if (token.value === '(') {
            const value = this.parseOr()
            if (this.consume()?.value !== ')') throw new Error('Expected closing parenthesis')
            return value
        }
        throw new Error(`Expected a value, received "${token.value}"`)
    }

    peek() { return this.tokens[this.position] }
    consume() { return this.tokens[this.position++] }
}

function resolvePath(path, context) {
    const [root, ...properties] = path.split('.')
    if (!['actor', 'attacker', 'target', 'damage'].includes(root)) {
        throw new Error(`Unknown condition root "${root}"`)
    }

    let value = root === 'actor' ? context?.attacker : context?.[root]
    for (const property of properties) {
        if (FORBIDDEN_PROPERTIES.has(property)) throw new Error(`Property "${property}" is not allowed`)
        if (value == null) return undefined
        value = value[property]
    }
    return value
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
