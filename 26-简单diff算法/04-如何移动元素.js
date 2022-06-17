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
    function mountElement(vnode, container) {
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

        //将元素添加到容器之中
        insert(el, container);
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
            //重新实现两组子节点的更新方式
            //1.新旧 children
            const oldChildren = n1.children
            const newChildren = n2.children
            //用来存储寻找过程中遇到的最大索引值
            let lastIndex = 0
            for (let i = 0; i < newChildren.length; i++) {
                const newVNode = newChildren[i]
                //遍历旧的children
                for (let j = 0; j < oldChildren.length; j++) {
                    const oldVnode = oldChildren[j]
                    // 如果找到了具有相同 key 值的两个节点，则调用 `patch` 函数更新之
                    if (newVNode.key === oldVnode.key) {
                        patch(oldVNode, newVNode, container)
                        if (j < lastIndex) {
                            /* 
                            如果当前找到的节点在旧Children中的索引小于最大索引LatIndex
                            说明该节点需要移动
                            */
                            // 需要移动
                            //先获取newNode的前一个vnode，即preVnode
                            const prevVNode = newChildren[i - 1]
                            //如果不存在preVnode 说明是第一个节点 不需要移动
                            if (prevVNode) {
                                //由于要将newVNode对应的真实Dom 移动到PreVnode所对应真实DOM后面
                                //所以我们获取preVnode所对应真实DOM的下一个兄弟节点，并将其作为锚点 【换句话说就是插入这个兄弟节点的前面】
                                const anchor = prevVNode.el.nextSibling
                                //调用insert方法将newVnode对应的真实DOM插入到锚点元素前面
                                // 也就是preVnode 对应真实DOM后边
                                insert(newVNode.el, container, anchor)
                            }
                        } else {
                            //如果找到的当前节点字旧的Children中索引大于最大索引值
                            // 更新 lastIndex
                            lastIndex = j
                        }
                        break // 这里需要 break
                    }
                }
            }
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
        const el = n2.el = n1.el //旧节点的el 赋值给新节点的el 
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
    function patch(n1, n2, container) {
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
                mountElement(n2, container);
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