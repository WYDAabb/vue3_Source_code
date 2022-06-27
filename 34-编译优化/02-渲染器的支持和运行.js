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


/* 当获得动态节点后 可以这么执行更新 */
function patchElement(n1, n2) {
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props
    //检查是否有新的节点
    if (n2.patchFlags) {
        //靶向更新
        if (n2.patchFlags === 1) {
            //只更新 text
        } else if (n2.patchFlags === 2) {
            //只更新class
        } else if (n2.patchFlags === 3) {
            // 更新其他等等
        }
    } else {
        //全部更新
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
    }




    if (n2.dynamicChildrenStack) {
        //调用patchBlockChildren只会更新动态节点
        patchBlockChildren(n1, n2)
    } else {
        patchChildren(n1, n2, el)
    }
}
function patchBlockChildren(n1, n2) {
    //只更新新节点的动态节点
    for (let i = 0; i < n2.dynamicChildrenStack.length; i++) {
        patchElement(n1.dynamicChildrenStack[i], n2.dynamicChildrenStack[i])
    }
}