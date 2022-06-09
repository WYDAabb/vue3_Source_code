

const data = { foo: 1, bar: 2 };

//清除副作用
function cleanup(effectFn) {
    //遍历数组
    for (let i = 0; i < effectFn.deps.length; i++) {
        //deps是依赖集合
        const deps = effectFn.deps[i]
        //将effectFn 从依赖集合中移除
        deps.delete(effectFn)
    }
    //重置effectFn.deps数组
    effectFn.deps.length = 0
}



//设置一个顶层变量 用来设置具体的副作用函数
let activeEffect
//写一个函数执行栈 类似ECStack一样 让activeEffect始终指向栈顶
const effectStack = [];
//副作用函数 当值改变的时候 重新执行这个函数
function effect(fn, options = {}) {
    //effectFn是一个函数 如果这个函数不执行 那么里面的fn也不会执行
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn
        //在调用副作用函数之前将当前的副作用函数压入栈中
        effectStack.push(effectFn)
        fn()
        //在当前副作用函数执行完毕之和 ,将当前副作用函数弹出栈 并将acttiveEffect还原之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.options = options //设置一个调度对象 里面内容是调度函数 scheduler 函数
    effectFn.deps = []
    if (!options.lazy) { //非lazy:true的时候才执行
        effectFn()
    }
    return effectFn //副作用函数返回 自己去执行
}

/* 
数据结构
weakMap:{
    对象:{
        key:Set({所有响应式函数})
    }
}
*/

//追踪变化函数 也可以说是收集依赖函数
function track(target, key) {
    if (!activeEffect || !shouldTrack) return //停止追踪时和没有副作用函数时 直接返回
    let depsMap = bucket.get(target)
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps)
}

//触发变化函数
function trigger(target, key, type, newValue) {
    //根据target从桶中取得 depsMap 是key ==> effect
    const depsMap = bucket.get(target);
    //如果没有就返回出去
    if (!depsMap) return
    //根据key 拿到对应的effect函数 进行副作用函数的重新执行
    const effects = depsMap.get(key)
    const effectsToRun = new Set(effects)

    //与key相关联的副作用函数放入 effectsToRun
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
            effectsToRun.add(effectFn)
        }
    })

    //1.对数组的判断
    if (type === "ADD" && Array.isArray(target)) {
        //取出与length相关的副作用函数
        const lengthEffects = depsMap.get('length')
        lengthEffects && lengthEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })
    }

    //2.如果操作目标是数组，并且修改了数组的length属性
    if (Array.isArray(target) && key === 'length') {
        //对于索引大于或等于新的length值得元素
        //需要取出相关的副作用函数并添加到effectsToRun中
        depsMap.forEach((effects, key) => {
            if (key >= newValue) {  //之前得长度大于等于新的索引长度
                effects && effects.forEach(effectFn => {
                    if (effectFn !== activeEffect) {
                        effectsToRun.add(effectFn)
                    }
                })
            }
        })
    }

    // 代理对象 当操作为ADD 和 DELETE时候 重新执行
    if (type === "ADD" || type === "DELETE") {
        //取得与ITERATE_KEY相关的副作用函数变量
        const iterateEffects = depsMap.get(ITERATE_KEY)
        //与ITERATE_KEY相关联的副作用函数放入 effectsToRun
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })
    }

    //执行
    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就延缓执行
            effectFn.options.scheduler(effectFn)
        } else {
            effectFn();
        }
    })

}

//重写数组中的查找方法
const arrayInstrumentations = {} //存储数组中的查找方法
const ArrayFindMethods = ['includes', 'indexOf', 'lastIndexOf']
ArrayFindMethods.forEach(method => {
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args) {
        //this是代理对象，先在代理对象中查找，将结果存储到res中
        let res = originMethod.apply(this, args)
        if (res === false) {
            //res如果是false 说明没找到 通过this.raw拿到原始数组，再去查找并更新res
            res = originMethod.apply(this.raw, args)
        }
        return res
    }
});

//重写数组中的 栈方法 栈方法会隐式的修改数组长度
// 一个标记变量，代表是否进行追踪。默认值为true，即允许追踪
let shouldTrack = true;
const arrayStackMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
arrayStackMethods.forEach(method => {
    //获取原始的方法 
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args) {
        //在调用原始方法之前 禁止追踪
        shouldTrack = false
        //方法的默认行为
        let res = originMethod.apply(this, args)
        //调用方法后回复原来的状态
        shouldTrack = true
        return res
    }
})


const bucket = new WeakMap();
const ITERATE_KEY = Symbol();//因为ownKeys不具备属于自己的键值 所以自定义键值 for-in 使用
//isShallow 判断是否是浅响应 isReadonly 只读
//创建响应式函数
export function createReactive(data, isShallow = false, isReadonly = false) {
    return new Proxy(data, {
        get(target, key, receiver) {// receiver 代表代理对象
            //代理对象可以通过raw属性访问原始数据  receiver.raw = target 解决原型引起的 多次调用effect[[set]]方法的问题
            if (key === 'raw') {
                return target
            }

            //判断操作是否是数组 并且key是我们定义的数组方法 arrayInstrumentations中的
            //返回定义在arrayInstrumentations上的值
            if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
                return Reflect.get(arrayInstrumentations, key, receiver)
            }

            // 非只读的时候 才建立收集依赖 要不只读的时候浪费性能 只读肯定不是响应式 因为不能修改
            if (!isReadonly && typeof key !== 'symbol') { //key不是symbol才会追踪
                track(target, key);
            }

            const res = Reflect.get(target, key, receiver);

            //浅响应 直接返回
            if (isShallow) {
                return res
            }

            //深度响应式
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res) //调用reactive 将结果包装成响应式数据并返回
            }
            return res
        },
        set(target, key, newValue, receiver) {
            if (isReadonly) {
                console.warn(`属性${key}是只读的`);
                return true //只读属性返回出去
            }
            const oldValue = target[key];
            //判断属性是否存在 如果存在的话那么就是设置 不存在就是添加
            const type = Array.isArray(target)
                //如果代理目标是数组，则检测被设置的索引值是否小于数组长度  如果是对象判断对象上是否有这个属性
                ? Number(key) < target.length ? "SET" : "ADD" : Object.prototype.hasOwnProperty.call(target, key) ? "SET" : "ADD";
            const res = Reflect.set(target, key, newValue, receiver)
            // 判断receiver是target的代理对象 就执行解决了 child[[set]]调用和parent[[set]]调用 两次响应式函数执行的问题
            if (target === receiver.raw) {
                //旧的值和新的值不同的时候 在触发响应 并且都不是NAN的时候 在触发响应
                if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
                    trigger(target, key, type, newValue) //增加第四个参数 触发响应的新值
                }
            }
            return res
        },
        //副作用函数通过 in 操作符操作响应式数据时，能够建立依赖关系
        has(target, key) {
            track(target, key)
            return Reflect.has(target, key)
        },
        //拦截for in函数  因为track是symbol值 所以track也点改变
        ownKeys(target) {
            //判断是否是数组 数组也会forin循环 ? 数组length函数 : 将副作用函数和ITERATE_KEY相关联
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`属性${key}是只读的`);
                return true //只读属性返回出去
            }
            //检查被操作的属性是否是对象自己的属性
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            const res = Reflect.deleteProperty(target, key) //使用Reflect删除属性
            if (res && hadKey) {
                //属性删除成功 触发响应
                trigger(target, key, 'DELETE')
            }
            return res
        }
    })
}


//定义一个map实例，存储原始对象到代理对象的映射 优先检查是否已经存在的代理对象 避免为一个原始对象多次创建代理对象的问题
const reactiveMap = new Map();
function reactive(obj) {
    //优先通过原始对象obj寻找之前创建的代理对象，如果找到了，直接返回已有的代理对象
    const existionProxy = reactiveMap.get(obj)
    if (existionProxy) {
        return existionProxy
    }
    //创建新的代理对象 
    const proxy = createReactive(obj)
    //存储到Map中 从而避免重复创建
    reactiveMap.set(obj, proxy)
    return proxy
}
//只读函数
function shallowReadonly(obj) {
    return createReactive(obj, true,/* 浅响应式 */ true)
}

function readonly(obj) {
    return createReactive(obj, false, true /* 只读 */)
}



const arr = reactive(["2"])

effect(() => {
    console.log(arr);
    arr.push(1)
})
effect(() => {
    arr.pop(1)
})


