//更新子节点
function patchChildren(n1, n2, container) {
    //判断新子节点的类型是否为文字节点
    if (typeof n2.children === 'string') {
        //当旧的节点为一组子节点的时候 才需要逐个卸载
        if (Array.isArray(n1.children)) {
            n1.children.forEach((c) => unmount(c))
        }
        setElementText(container, n2.children)
        //判断新子节点是狗是一组子节点
    } else if (Array.isArray(n2.children)) {
        if (Array.isArray(n1.children)) { //判断旧的节点是也是一组子节点
            n1.children.forEach(c => unmount(c))
            n2.children.forEach(c => patch(null, c, container))
        } else {
            /* 
            要么旧的子节点要么是文字节点，要么不存在
            但无论哪一种情况，我们只需要将容器清空，然后将新的子节点挂载
            */
            setElementText(container, '')
            n2.children.forEach(c => patch(null, c, container))
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

    //第二步 更新children
    patchChildren(n1, n2, el)
}