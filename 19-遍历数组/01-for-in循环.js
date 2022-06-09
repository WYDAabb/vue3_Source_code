function createReactive(obj, isShallow = false, isReadOnly = false) {
    return new Proxy(obj, {
        ownKeys(target) {
            //如果操作目标target是数组 则使用length属性作为key并建立响应联系
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
            return Reflect.ownKeys(target)
        }
    })
}