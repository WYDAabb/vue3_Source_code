
export const isString = (val) => typeof val === 'string'
export const isObject = (val) => val !== null && typeof val === 'object'
export const isArray = Array.isArray

export function normalizeClass(value) {
    let res = ''
    if (isString(value)) {
        res = value
    } else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const normalized = normalizeClass(value[i])
            if (normalized) {
                res += normalized + ' '
            }
        }
    } else if (isObject(value)) {
        for (const name in value) {
            if (value[name]) {
                res += name + ' '
            }
        }
    }
    return res.trim()
}
/*
通过这个normalize函数对vue中不同类型的class来进行序列化
*/