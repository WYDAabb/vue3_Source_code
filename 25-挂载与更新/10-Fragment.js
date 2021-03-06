const Fragment = Symbol()
const oldVnode = {
    type: Fragment,
    children: [
        { type: 'p', children: 'text 1' },
        { type: 'p', children: 'text 2' },
        { type: 'p', children: 'text 3' },
        { type: 'p', children: 'text 4' }
    ]
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
    } else if (typeof type === Text) { //文本元素 
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
        if (!n1) {
            //旧的vnode不存在 将所有Fragment的children的值逐个挂载
            n2.children.forEach(c => patch(null, c, container))
        } else {
            //旧的vnode存在 更新Fragment children就可以
            patchChildren(n1, n2, container)
        }
    }
}

//unmount卸载函数 也需要支持Fragment
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