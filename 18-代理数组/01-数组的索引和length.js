// isReadOnly 判断是否是只读的
function createReactive(obj, isShallow = false, isReadOnly = false) {
    return new Proxy(obj, {
        set(target, key, newValue, receiver) {
            //如果只是只读的 打印警告信息
            if (isReadOnly) {
                console.warn(`属性${key}是只读的`);
                return true;
            }
            const oldValue = target[key];
            //判断变量type 如果属性不存在，说明是在添加属性，否则是设置已有属性
            /* 判断代理目标是数组，则检测被设置的索引值是否小于数组长度，如果是则设置为set操作 如果不是则是Add操作 */
            const type = Array.isArray(target) ? Number(key) < target.length ? 'SET' : 'ADD' : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'


            const res = Reflect.set(target, key, newValue, receiver);
            //target === receiver.raw 说明receiver就是target的代理对象
            if (target === receiver.raw) {
                //比较新值和旧值，只有当他们不全等，并且都不是NAN的时候才触发相应    NAN === NAN(false)   NAN!==NAN(true) 
                if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
                    trigger(target, key, type, newValue) //将类型传给trigger函数  新的值也传过去
                }
            }
            return res;
        }
    })
}

// 根据判断类型是否是ADD 并且判断target如果是数组类型 那么就需要处理.length长度的问题
//触发变化函数
function trigger(target, key, key, newValue) {
    const depsMap = bucket.get(target);
    if (!depsMap) return
    const effects = depsMap.get(key)
    const effectsToRun = new Set(effects)
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
            effectsToRun.add(effectFn)
        }
    })

    //根据判断类型是否是ADD 并且判断target如果是数组类型 那么我们就需要处理.length长度的问题
    if (type === 'ADD' && Array.isArray(target)) {
        //取出length相关的副作用函数
        const lengthEffects = depsMap.get('length');
        //将这些副作用函数添加到effectsToRun中 待执行
        lengthEffects && lengthEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
                effectsToRun.add(effectFn)
            }
        })
    }

    //对于length属性的处理
    //判断如果操作目标是数组，并且修改了数组.length属性 
    if (Array.isArray(target) && key === 'length') {
        //对于索引大于或等于新的length值的元素
        //需要吧所有相关联的副作用函数取出并添加到effectTORun去执行
        depsMap.forEach((effects, key) => {
            if (key >= newValue) {
                effects && effects.forEach(effectFn => {
                    if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
                        effectsToRun.add(effectFn)
                    }
                })
            }
        })
    }

    //判断类型为ADD的时候 才出发与ITERATE_KEY相关函数的重新执行
    //将与ITERATE_KEY 相关联的副作用函数也添加到effectsToRun
    if (type === 'ADD') {
        const iterateEffects = depsMap.get(ITERATE_KEY) //取得与forin相关的副作用函数变量
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
                effectsToRun.add(effectFn)
            }
        })
    }

    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就延缓执行
            effectFn.options.scheduler(effectFn.options)
        } else {
            effectFn();
        }
    })
}
