//1.数组返回的values方法的返回值实际上就是数组内建的迭代器
console.log(Array.prototype.values === Array.prototype[Symbol.iterator]); //true


//因为数组里面使用迭代协议 所以 需要配对所有symbol做下处理、
const obj = {
    val: 0,
    [Symbol.iterator]() {
        return {
            next() {
                return {
                    value: obj.val++,
                    done: obj.val > 10 ? true : false
                }
            }
        }
    }
}

const arr = [1, 2, 3, 4, 5, 6]

const itr = arr[Symbol.iterator]();
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());
console.log(itr.next());

function createReactive(obj, isShallow = false, isReadOnly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            //代理对象可以通过raw属性访问原始数据
            if (key === 'raw') {
                return target
            }

            //非只读的时候 建立响应式收集依赖 并且当key不是symbol的时候 才会进行追踪
            if (!isReadOnly && typeof key !== 'symbol') {
                track(target, key)
            }

            //得到原始执行结果
            const res = Reflect.get(target, key, receiver);
            //如果是浅相应就返回结果
            if (isShallow) {
                return res
            }

            if (typeof res === 'object' && res !== null) {
                //  调用reactive将结果包装成响应式数据并返回
                return reactive(res)
            }
            return res
        }
    })
}