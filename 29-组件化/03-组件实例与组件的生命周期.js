
//用in操作符判断key是否存在对应的DomProperties 以及特殊只读属性的处理
function shouldSetAsProps(el, key, value) {
    //特殊处理
    if (key === 'from' && el.taName === 'INPUT') return false
    //兜底
    //使用shouldSetAsProps函数来判断是否作为Dom Properties设置
    return key in el
}
//最长递增子序列算法
function lis(arr) {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = result.length - 1
            while (u < v) {
                c = ((u + v) / 2) | 0
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}


function createRenderer(options) {

    const { createElement, setElementText, insert, patchProps, createText, setText } = options


    //mountElement 挂载函数
    function mountElement(vnode, container, anchor) {
        //让vnode.el引用真实dom元素 为了后续卸载dom节点使用 因为dom卸载节点需要使用父元素
        const el = vnode.el = createElement(vnode.type)
        //挂载子节点，首先判断children的类型 
        //如果是字符串类型，说明是文本子节点
        if (typeof vnode.children === 'string') {
            //因此只需要设置元素的文本节点
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {   //如果children是数组 那么遍历每一个子节点 并调用patch函数挂载
            vnode.children.forEach(child => {
                patch(null, child, el)
            });
        }
        // props属性处理
        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }

        //将元素添加到容器之中 将锚点元素传给insert
        insert(el, container, anchor);
    }

    //unmount卸载函数
    function unmount(vnode) {
        //Fragment处理所有子节点
        if (vnode.type === Fragment) {
            vnode.children.forEach(c => unmount(c))
            return
        }
        const parent = vnode.el.parentNode
        if (parent) {
            parent.removeChild(vnode.el)
        }
    }

    //快速diff算法
    function patchKeyedChildren(n1, n2, container) {
        const oldChildren = n1.children
        const newChildren = n2.children

        /*  处理相同的前置节点 */
        //索引j指向新旧两组子节点的开头
        let j = 0
        let oldVNode = oldChildren[j]
        let newVnode = newChildren[j]

        //while循环向后遍历，直到遇到拥有不同key值的节点为止
        while (oldVnode.key === newVnode.key) {
            //调用patch函数进行更新
            patch(oldVNode, newVNode, container)
            //更新索引j，让其递增
            j++
            oldVNode = oldChildren[j]
            newVnode = newChildren[j]
        }

        /* 更新相同的后置节点 */
        //索引oldEnd指向旧的一组子节点的最后一个节点  因为新旧子节点的长度不同，所以创建两个索引
        let oldEnd = oldChildren.length - 1
        // 索引 newEnd 指向新的一组子节点的最后一个节点
        let newEnd = newChildren.length - 1
        oldVNode = oldChildren[oldEnd]
        newVNode = newChildren[newEnd]

        //while循环从后面向前遍历,直到遇到拥有不同key值得节点为止
        while (oldVNode.key === newVNode.key) {
            //调用patch函数进行更新
            patch(oldVNode, newVNode, container)
            oldEnd--;
            newEnd--;
            oldVNode = oldChildren[oldEnd]
            newVNode = newChildren[newEnd]
        }

        /* 预处理完成后，如果满足如下条件，则说明从j--> newEnd 之间的节点应作为新节点插入 */
        if (j > oldEnd && j <= newEnd) {
            //拿到锚点的索引 
            const anchorIndex = newEnd + 1
            //锚点元素
            const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
            //采用while循环 调用patch函数逐个挂载
            while (j <= newEnd) {
                patch(null, newChildren[j++], container, anchor)
            }

            /* 满足 j>newEnd 并且 j<=oldEnd 说明旧的节点需要卸载*/
        } else if (j > newEnd && j <= oldEnd) {
            unmount(oldChildren[j++])
            /*  不理想状态下的处理思路*/
        } else {
            //构建新的source数组
            const count = newEnd - j + 1  //新的一组子节点中剩余未处理节点的数量
            const source = new Array(count)
            source.fill(-1) //给数组里面填充-1  数组用来记录新的子节点在旧的一组子节点中的位置索引
            //oldStart和newStart分别为起始索引 即j
            const oldStart = j
            const newStart = j
            //构建索引表
            const keyIndex = {}
            //新增变量判断是否需要移动位置
            let moved = false
            let pos = 0 //遇到的最大索引值

            //遍历新的一组子节点 存储索引值
            for (let i = newStart; i <= newEnd; i++) {
                keyIndex[newChildren[i].key] = i
            }

            //新增patched变量，代表更新过的节点数量
            let patched = 0;
            //遍历旧的一组子节点中剩余未处理的节点
            for (let i = oldStart; i <= oldEnd; i++) {
                oldVNode = oldChildren[i]
                if (patched <= count) {
                    //通过索引表快速找到新的一组子节点中具有相同key值的节点位置
                    const k = keyIndex[oldVNode.key]
                    if (typeof k !== 'undefined') {
                        newVNode = newChildren[k]
                        //调用patch进行更新
                        patch(oldVNode, newVNode, container)
                        //每次更新一个节点我们就将patched的数量+1
                        patched++
                        //填充source数组
                        source[k - newStart] = i
                        //判断节点是否需要移动
                        if (k < pos) {
                            moved = true
                        } else {
                            pos = k
                        }
                    } else {
                        // 没找到
                        unmount(oldVNode)
                    }
                } else {
                    //如果更新的节点数量大于需要更新的节点数量，则卸载多余的节点
                    unmount(oldVNode)
                }
            }

            /* 如果moved为true，则需要进行DOM移动操作 */
            if (moved) {
                //返回最长递增子序列的索引
                const seq = lis(source)
                /* 
                定义两个索引 一个指向最长递增子序列的最后一个元素 s
                            一个指向新的一组子节点中的最后一个节点 i
                    count:  新的一组子节点中剩余未处理节点的数量
                */
                let s = seq.length - 1
                let i = count - 1
                //for循环 使得i逐渐递减，从下往上进行移动
                for (i; i >= 0; i--) {
                    //如果索引等于-1 那么说明新的节点在旧的子节点中未存在过
                    if (source[i] === -1) {
                        //说明索引为i的节点是全新的节点，应该将其挂载
                        //该节点在新children中的真实位置索引
                        const pos = newStart + i;
                        const newVNode = newChildren[pos]
                        //该节点的下一个节点的索引 用来当作锚点
                        const nextPos = pos + 1
                        //锚点
                        const anchor = nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null
                        // 挂载新的节点
                        patch(null, newVNode, container, anchor)
                    } else if (i !== seq[s]) {
                        //r如果节点的索引 i 不等于seq[s]的值,说明该节点需要移动
                        // 该节点在新的一组子节点中的真实位置索引
                        const pos = i + newStart
                        const newVNode = newChildren[pos]
                        // 该节点下一个节点的位置索引
                        const nextPos = pos + 1
                        // 锚点
                        const anchor = nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null
                        // 移动
                        insert(newVNode.el, container, anchor)

                    } else {
                        //当i===seq[s] 时 说明该位置不需要移动 
                        // 并让 s 指向下一个位置
                        s--
                    }

                }

            }
        }


    }

    //更新子节点
    function patchChildren(n1, n2, container) {
        //判断新子节点的类型是否为文字节点
        if (typeof n2.children === 'string') {
            //当旧的节点为一组子节点的时候 才需要逐个卸载
            if (Array.isArray(n1.children)) {
                n1.children.forEach((c) => unmount(c))
            }
            setElementText(container, n2.children)
            //判断新子节点是一组子节点 这里进行diff算法的比对
        } else if (Array.isArray(n2.children)) {
            patchKeyedChildren(n1, n2, container)
        } else {
            //代码运行到这里说明新子节点不存在 旧的子节点是一组子节点 逐个卸载就行
            if (Array.isArray(n1.children)) {
                n1.children.forEach(c => unmount(c))
            } else if (typeof n1.children === 'string') {
                setElementText(container, '')
            }
        }
    }

    //对比函数
    function patchElement(n1, n2) {
        const el = n2.el = n1.el
        const oldProps = n1.props
        const newProps = n2.props
        //更新props
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key])
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                patchProps(el, key, oldProps[key], null)
            }
        }

        //第二步 更新children子节点
        patchChildren(n1, n2, el)
    }


    //patch函数传入三个参数 第一个旧的vnode 第二个新的vnode 第三个同期
    function patch(n1, n2, container, anchor) {
        if (n1 && n1.type !== n2.type) {
            //新旧vnode类型不同 旧的vnode卸载
            unmount(n1)
            n1 = null; //保证后续挂载操作执行
        }
        //代码到这里保证n1 n2的所描述内容相同
        const { type } = n2
        //判断呢n2type是字符串类型那么就是 普通标签元素
        if (typeof type === 'string') {
            //如果n1不存在，意味着挂载 则调用mountElement函数完成挂载
            if (!n1) {
                mountElement(n2, container, anchor);
            } else {
                //n1,n2都存在
                patchElement(n1, n2)
            }
        } else if (type === Text) { //文本元素 
            if (!n1) {
                const el = n2.el = createText(n2.children)
                insert(el, container)
            } else { //旧的节点存在
                const el = n2.el = n1.el
                if (n2.children !== n1.children) {
                    setText(el, n2.children)
                }
            }
        } else if (type === Fragment) { //多根节点
            if (!n1) {  //旧的vnode不存在 将所有Fragment里面的值逐个挂载
                n2.children.forEach(c => patch(null, c, container))
            } else {
                //旧的vnode存在 更新Fragment children就可以
                patchChildren(n1, n2, container)
            }
        } else if (typeof type === 'object') {
            //vnode.type的值是选项对象，作为组件来处理
            if (!n1) {
                //  挂载组件
                mountComponent(n2, container, anchor)
            } else {
                //更新组件
                patchComponent(n1, n2, anchor)
            }
        }

        /* 设计一个微任务缓存队列 实现响应式缓存 */
        //实现微任务队列 调度器控制执行次数
        const queue = new Set();
        //使用promise.resolve创建一个promise实例，我们用它将一个任务添加到微任务队列
        const p = Promise.resolve();
        //一个标志看是否在刷新队列 
        let isFlushing = false;
        function queueJob(job) {
            //添加到队列之中
            queue.add(job)
            if (!isFlushing) {
                isFlushing = true
                //在微任务中刷新队列执行任务
                p.then(() => {
                    try {
                        queue.forEach(jon => job())
                    } finally {
                        //清空状态
                        isFlushing = false
                        queue.clear()
                    }
                })
            }
        }

        //挂载组件函数
        function mountComponent(vnode, container, anchor) {
            //1.通过vnode获取组件的选项对象,即vnode.type
            const componentOptions = vnode.type
            //获取组件的函数生命周期等各种信息
            const { render, data, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, } = componentOptions

            //生命周期-1:在这里调用beforeCreate钩子
            beforeCreate && beforeCreate();

            //3.调用data函数得到原始数据，调用reactive函数将其包裹成响应式数据
            const state = reactive(data())

            //定义一个组件实例,一个组件实例本质上就是一个对象，它包含与组件有关的状态信息
            const instance = {
                //组件自身的状态数据 即data
                state,
                //一个布尔值，用来表示组件是否已经被挂载，初始值为false
                isMounted: false,
                //组件所渲染的内容，即子树（subTree）
                subTree: null
            }

            //将组件实例设置上vnode上，用于后续更新
            vnode.comoponent = instance

            //生命周期-2:在这里调用Created钩子
            created && created.call(state)


            //数据改变 实现自更新
            effect(() => {
                //调用组件的渲染函数，获得子树
                const subTree = render.call(state, state)
                //检查组件是否已经挂载
                if (!instance.isMounted) {
                    //生命周期-3:在这里调用 beforeMount钩子
                    beforeMount && beforeMount.call(state)

                    //初次挂载，调用patch函数第一个参数传递null
                    patch(null, subTree, container, anchor)
                    //重点：将组件实例的isMounted设置为true，这样当更新发生时就不会再次进行挂载操作，
                    //二十执行更新
                    instance.isMounted = true;

                    //生命周期-4:在这里调用 mounted狗子
                    mounted && mounted.call(state);

                } else {
                    //生命周期-5：在这里调用 beforeUpdate钩子
                    beforeUpdate && beforeUpdate.call(state);

                    // 当isMounted为true时，说明组件已经被挂载，只需要完成自更新就可以，
                    // 所以在调用patch函数时，第一个参数为组件上一次渲染的子树，
                    //意思是 使用新的子树与上一次渲染的子树进行打补丁操作
                    patch(instance.subTree, subTree, container, anchor)

                    //生命周期-6:在这里调用 updated 钩子
                    updated && updated.call(state)
                }
                //更新组件实例的子树
                instance.subTree = subTree
            },
                {
                    //指定该副作用函数的调度器为queueJob
                    scheduler: queueJob
                })
        }




    }

    function render(vnode, container) {
        if (vnode) {
            //如果新的vnode存在 将其与旧的vnode一起传递给patch函数 进行打补丁 我叫做patch比较函数
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                //如果旧的vnode存在 并且新的vnode不存在 说明是卸载操作
                unmount(container._vnode)
            }
        }
        //将vnode存储到container._vnode下面 既后续渲染中旧的vnode
        container._vnode = vnode
    }

    return {
        render
    }
}

const options1 = {  //浏览器使用
    //用于创建元素
    createElement(tag) {
        return document.createElement(tag);
    },
    //用于设置元素的文本节点
    setElementText(el, text) {
        el.textContent = text;
    },
    //用于给定的parent下添加指定元素
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor)
    },
    //创建文本节点
    createText(text) {
        return document.createTextNode(text)
    },
    //将原来文本节点的内容换成新的文本
    setText(el, text) {
        el.nodeValue = text
    },
    //用来处理props中的属性
    /* 
    * params
    * 挂载节点el  
    * 当前元素属性的key
    * 修改前的属性值
    * 当前元素属性的props值
    */
    patchProps(el, key, preValue, nextValue) {
        //匹配以on开头的属性 视其为事件
        if (/^on/.test(key)) {
            //获取为该元素伪造的事件处理函数 设置为一个对象事件名:事件函数  减少removeEventListener的使用
            let invokers = el._vei || (el._vei = {})
            let invoker = invokers[key]
            const name = key.slice(2).toLowerCase()
            if (nextValue) {
                if (!invoker) {
                    //如果没有invoker 则将一个伪造的invoker缓存到el.vei中  
                    //vei 是 vue event invoker 的首字母缩写
                    invoker = el._vei[key] = (e) => {
                        //e.timeStamp 是事件发生的时间
                        //如果事件触发的时间早于事件处理函数绑定的时间， 则不执行事件处理函数
                        if (e.timeStamp < invoker.attached) return
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach(fn => fn(e))
                        } else {
                            //当伪造的事件处理函数执行时,会执行真正的事件处理函数 也就是执行invoker.value函数
                            invoker.value(e)
                        }

                    }
                    //将真正的事件处理函数赋值给invoker.value
                    invoker.value = nextValue;
                    //添加invoker.attached属性 存储事件处理函数被绑定的时间
                    invoker.attached = performance.now()
                    //绑定事件
                    el.addEventListener(name, invoker)
                } else {
                    //如果invoker存在 那么证明是更新 只需要更新值就可以
                    invoker.value = nextValue
                }
            } else if (invoker) {
                //之前事件绑定函数不存在 且之前绑定的invoker存在 移除绑定
                el.removeEventListener(name, invoker)
            }
        } else if (key === 'class') {      //对class的特殊处理  DOM Properties 叫做className
            el.className = nextValue || ''
        } else if (shouldSetAsProps(el, key, nextValue)) {
            //获取DOM properties的类型
            const type = typeof el[key];
            //如果是布尔类型，并且value是空字符串，则矫正为true 优先设置Dom Properties
            if (type === 'boolean' && nextValue === '') {
                el[key] = true;
            } else {
                el[key] = value;
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    }

}
const renderer = createRenderer(options1)

//.vue文件编译成这个对象
const myComponent = {
    //组件名称，可选
    name: 'MyComponent',
    //data函数来定义组件自身的状态
    data() {
        return {
            foo: 'hello,world'
        }
    },
    //组件的渲染函数 返回一个虚拟DOM
    render() {
        //返回虚拟dom、
        return {
            type: 'div',
            children: `foo的值是${this.foo}`  //渲染函数中使用组件状态
        }
    }
}

//渲染示例 描述组件的vnode对象
const CompVNode = {
    type: myComponent //因为组件的类型是object
}
//调用渲染器来渲染组件
renderer.render(CompVNode, document.querySelector('#app'))
