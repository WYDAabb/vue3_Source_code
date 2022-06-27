
//创建虚拟DOM节点的辅助函数
function createVNode(tag, props, children, flags) {
    const key = props && props.key
    props && delete props.key

    const vnode = {
        tag,
        props,
        children,
        key,
        patchFlags
    }

    if (typeof flags !== 'undefined' && currentDynamicChildren) {
        // 动态节点
        currentDynamicChildren.push(vnode)
    }

    return vnode
}
/* 收集动态block 函数执行从内层执行到外层 */
// 动态节点栈
const dynamicChildrenStack = []
// 当前动态节点集合
let currentDynamicChildren = null

// openBlock 用来创建一个新的动态节点集合，并将该集合压入栈中
function openBlock() {
    dynamicChildrenStack.push((currentDynamicChildren = []))
}

// closeBlock 用来将通过 openBlock 创建的动弹节点集合从栈中弹出
function closeBlock() {
    currentDynamicChildren = dynamicChildrenStack.pop()
}

function createBlock(tag, props, children) {
    //block本质上也是一个vnode
    const block = createVNode(tag, props, children)
    //将当前动态节点集合作为block.dynamicChildrenStack
    block.dynamicChildren = currentDynamicChildren
    //关闭block
    closeBlock()

    return block
}


const block = (openBlock(), createBlock('div', null, [
    createVNode('p', { class: 'foo' }, null, 1),
    createVNode('p', { class: 'bar' }, null),
]))

console.log(block)




  // render() {
  //   return createVNode('div', { }, [
  //     createVNode('div', { }, [
  //       createVNode('div', { }, [
  //         createVNode('div', { }, [
  //           createVNode('div', { }, [
  //             // ...
  //           ])
  //         ])
  //       ])
  //     ])
  //   ])
  // }

