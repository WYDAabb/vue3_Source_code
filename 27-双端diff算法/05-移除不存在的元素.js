const newVnode = {
    type: 'div',
    children: [
        { type: 'p', children: '1', key: 1 },
        { type: 'p', children: '2', key: 2 },
        { type: 'p', children: 'hello', key: 3 }
    ]
}
renderer.render(newVnode, document.querySelector('#app'))

const oldVnode = {
    type: 'div',
    children: [
        { type: 'p', children: 'world', key: 3 },
        { type: 'p', children: '1', key: 1 },
        { type: 'p', children: '2', key: 2 }
    ]
}

//用in操作符判断key是否存在对应的DomProperties 以及特殊只读属性的处理
function shouldSetAsProps(el, key, value) {
    //特殊处理
    if (key === 'from' && el.taName === 'INPUT') return false
    //兜底
    //使用shouldSetAsProps函数来判断是否作为Dom Properties设置
    return key in el
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

    //双端diff算法
    function patchKeyedChildren(n1, n2, container) {
        const oldChildren = n1.children
        const newChildren = n2.children

        //1.建立四个索引
        let oldStartIdx = 0
        let oldEndIdx = oldChildren.length - 1
        let newStartIdx = 0
        let newEndIdx = newChildren.length - 1

        //2.四个索引指向的vnode节点
        let oldStartVNode = oldChildren[oldStartIdx]
        let oldEndVNode = oldChildren[oldEndIdx]
        let newStartVNode = newChildren[newStartIdx]
        let newEndVNode = newChildren[newEndIdx]

        //3.进行双端判断比较 进行多次判断封装带一个while循环中
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            //新增判断分支 如果头部和尾部节点是undefined说明该节点被处理过了 直接跳走
            if (!oldStartVNode) {
                oldStartVNode = oldChildren[++oldStartIdx]
            } else if (!oldEndVNode) {
                oldEndVNode = newChildren[--oldEndIdx]
            } else if (oldStartVNode.key === newStartVNode.key) {
                //第一步：旧的第一个节点和新的第一个节点比较       
                //调用patch函数进行打补丁   
                patch(oldStartVNode, newStartVNode, container)
                oldStartVNode = oldChildren[++oldStartIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else if (oldEndVNode.key === newEndVNode.key) {
                //第二步：旧的最后一个节点和新的最后一个节点比较
                patch(oldEndVNode, newEndVNode, container)
                //节点在新的顺序中仍然处于尾部，不需要移动，但仍然需要打补丁
                oldEndVNode = oldChildren[--oldEndIdx]
                newEndVNode = newChildren[--newEndIdx]
            } else if (oldStartVNode.key === newEndVNode.key) {
                //第三步：旧的第一个节点和新的最后一个节点比较
                patch(oldStartVNode, newEndVNode, container)
                // 将旧的一组子节点的头部节点对应的真实DOM节点oldStartVNode.el移动到
                // 旧的一组子节点的尾部节点对应的真实DOM节点后面
                insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)
                oldStartVNode = oldChildren[++oldStartIdx]
                newEndVNode = newChildren[--newEndIdx]
            } else if (oldEndVNode.key === newStartVNode.key) {
                //第四步：旧的最后一个节点和新的第一个节点比较
                //仍然需要调用patch函数进行打补丁
                patch(oldEndVNode, newStartVNode, container)
                //移动DOM操作 oldEndVNode.el移动到oldStartVNode.el前面
                insert(oldEndVNode.el, container, oldStartVNode.el)

                //移动完成后，更新索引值，并指向下一个位置
                oldEndVNode = oldChildren[--oldEndIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else {
                //遍历旧的一组子节点，试图寻找与newStartVNode拥有相同key值得节点
                //idInOld 就是新的一组子节点的头部节点在旧的一组子节点中的索引
                const idxInOld = oldChildren.findIndex(
                    node => node.key === newStartVNode.key
                )
                //判断将要移动的位置 如果idxInOld大于0 说明找到了可用的节点，并且需要将其对应的真实DOM移动到头部
                if (idxInOld > 0) {
                    //idxInOld 位置对应的vnode就是需要移动的节点
                    const vnodeToMove = oldChildren[idxInOld]
                    //除了移动操作外还需要打补丁
                    patch(vnodeToMove, newStartVNode, container)
                    //将vnodeToMove.el移动到头部节点oldStartVNode之前，使用oldStartVNode作为锚点
                    insert(vnodeToMove.el, container, oldStartVNode.el)
                    // 给idxInOld位置的节点已经移走了 所以给这个设置为undefined
                    oldChildren[idxInOld] = undefined
                    //最后更新索引 
                    newStartVNode = newChildren[++newStartIdx]

                    //新增节点的挂载
                } else {
                    //将newStartVNode作为新节点挂载到头部，使用当前头部节点oldStartVNode.el作为锚点
                    patch(null, newStartVNode, container, oldStartVNode.el)
                }
                newStartVNode = newChildren[++newStartIdx]
            }
        }

        //4.如果循环结束后，检查索引值的情况 怕有遗漏节点
        if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
            // 如果满足条件 说明有新节点的遗留 挂载新节点
            for (let i = newStartIdx; i <= newEndIdx; i++) {
                patch(null, newChildren[i], container, oldStartVNode.el)
            }
            //5.移除不存在的节点
        } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
            for (let i = oldStartIdx; i <= oldEndIdx; i++) {
                unmount(oldchildren[i])
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
            //判断新子节点是狗是一组子节点 这里进行diff算法的比对
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

renderer.render(TextVnode, document.querySelector('#app'))


/*
insertBefore用法
let insertedNode = parentNode.insertBefore(newNode, referenceNode);
newNode：将要插入的节点
referenceNode：被参照的节点（即要插在该节点之前）
insertedNode：插入后的节点
parentNode：父节点
*/