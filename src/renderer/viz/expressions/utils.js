import { number, category, array } from '../expressions';
import BaseExpression from './base';

export const DEFAULT = undefined;

// To support literals (string and numeric) out of the box we need to cast them implicitly on constructors
export function implicitCast(value) {
    if (_isNumber(value)) {
        return number(value);
    }
    if (typeof value == 'string') {
        return category(value);
    }
    if (Array.isArray(value)) {
        return array(value);
    }
    return value;
}

export function hexToRgb(hex) {
    // Evaluate #ABC
    let result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1] + result[1], 16),
            g: parseInt(result[2] + result[2], 16),
            b: parseInt(result[3] + result[3], 16),
            a: 1
        };
    }

    // Evaluate #ABCD
    result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1] + result[1], 16),
            g: parseInt(result[2] + result[2], 16),
            b: parseInt(result[3] + result[3], 16),
            a: parseInt(result[4] + result[4], 16) / 255,
        };
    }


    // Evaluate #ABCDEF
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 1
        };
    }

    // Evaluate #ABCDEFAF
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: parseInt(result[4], 16) / 255,
        };
    }

    throw new Error('Invalid hexadecimal color');
}

export function getOrdinalFromIndex(index) {
    const indexToOrdinal = {
        1: 'first',
        2: 'second',
        3: 'third',
        4: 'fourth'
    };
    return indexToOrdinal[index] || String(index);
}

export function getStringErrorPreface(expressionName, parameterName, parameterIndex) {
    return `${expressionName}(): invalid ${getOrdinalFromIndex(parameterIndex + 1)} parameter '${parameterName}'`;
}
export function throwInvalidType(expressionName, parameterName, parameterIndex, expectedType, actualType) {
    throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
expected type was '${expectedType}', actual type was '${actualType}'`);
}

export function throwInvalidInstance(expressionName, parameterName, parameterIndex, expectedClass, actualInstance) {
    throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
    '${actualInstance}' is not an instance of '${expectedClass.name}'`);
}

export function throwInvalidNumber(expressionName, parameterName, parameterIndex, number) {
    throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
    '${number}' is not a number`);
}

export function throwInvalidArray(expressionName, parameterName, parameterIndex, array) {
    throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
    '${array}' is not an array`);
}

export function throwInvalidString(expressionName, parameterName, parameterIndex, str) {
    throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
    '${str}' is not a string`);
}

// Try to check the type, but accept undefined types without throwing, unless the expected type had to be known at constructor time
// This condition happens with types like color or fade, see isArgConstructorTimeTyped for details
//
// This is useful to make constructor-time checks, at constructor-time some types can be already known and errors can be throw.
// Constructor-time is the best time to throw, but metadata is not provided yet, therefore, the checks cannot be complete,
// they must be loose, the unknown of variables aliases types makes, also, a point to reduce the strictness of the check
export function checkLooseType(expressionName, parameterName, parameterIndex, expectedType, parameter) {
    checkExpression(expressionName, parameterName, parameterIndex, parameter);
    const constructorTimeTyped = Array.isArray(expectedType) ? expectedType.every(isArgConstructorTimeTyped) : isArgConstructorTimeTyped(expectedType);
    if (parameter.type !== undefined || constructorTimeTyped) {
        checkType(expressionName, parameterName, parameterIndex, expectedType, parameter);
    }
}

// Returns true if the argument is of a type that cannot be strictly checked at constructor time
export function isArgConstructorTimeTyped(arg) {
    switch (arg) {
        case 'number':
        case 'number-array':
        case 'number-property':
        case 'category':
        case 'category-array':
        case 'category-property':
            return false;
        default:
            return true;
    }
}

export function checkExpression(expressionName, parameterName, parameterIndex, parameter) {
    if (!(parameter instanceof BaseExpression)) {
        throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
        '${parameter}' is not of type carto.expressions.Base`);
    }
}

export function checkType(expressionName, parameterName, parameterIndex, expectedType, parameter) {
    checkExpression(expressionName, parameterName, parameterIndex, parameter);
    if (Array.isArray(expectedType)) {
        const ok = expectedType.some(type =>
            parameter.type == type
        );
        if (!ok) {
            throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
            expected type was one of ${expectedType.join()}, actual type was '${parameter.type}'`);
        }
    } else if (parameter.type != expectedType) {
        throwInvalidType(expressionName, parameterName, parameterIndex, expectedType, parameter.type);
    }
}

export function checkInstance(expressionName, parameterName, parameterIndex, expectedClass, parameter) {
    checkExpression(expressionName, parameterName, parameterIndex, parameter);
    if (!(parameter.isA(expectedClass))) {
        throwInvalidInstance(expressionName, parameterName, parameterIndex, expectedClass, parameter.type);
    }
}

export function checkNumber(expressionName, parameterName, parameterIndex, number) {
    if (!_isNumber(number)) {
        throwInvalidNumber(expressionName, parameterName, parameterIndex, number);
    }
}

export function checkString(expressionName, parameterName, parameterIndex, str) {
    if (typeof str !== 'string') {
        throwInvalidString(expressionName, parameterName, parameterIndex, str);
    }
}

export function checkArray(expressionName, parameterName, parameterIndex, array) {
    if (!Array.isArray(array)) {
        throwInvalidArray(expressionName, parameterName, parameterIndex, array);
    }
}

export function checkFeatureIndependent(expressionName, parameterName, parameterIndex, parameter) {
    if (parameter.isFeatureDependent()) {
        throw new Error(`${getStringErrorPreface(expressionName, parameterName, parameterIndex)}
        parameter cannot be feature dependent`);
    }
}

export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

export function mix(x, y, a) {
    return x * (1 - a) + y * a;
}

function _isNumber(value) {
    return Number.isFinite(value) || value == Infinity || value == -Infinity || Number.isNaN(value);
}
