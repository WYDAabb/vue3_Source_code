function createRenderer() {
    function render(vnode, container) {
        if (vnode) {
            //如果新的vnode存在 将其与旧的vnode一起传递给patch函数 进行打补丁 我叫做patch比较函数
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                //如果旧的vnode存在 并且新的vnode不存在 说明是卸载操作
                //需要将container内的dom清空即可
                container.innerHTML = ''
            }
        }
        //将vnode存储到container._vnode下面 既后续渲染中旧的vnode
        container._vnode = vnode
    }

    return {
        render
    }
}

const renderer = createRenderer()

//首次渲染 
renderer.render(vnode1, document.getElementById('app'))
//二次渲染 
renderer.render(vnode2, document.getElementById('app'))
//三次渲染 
renderer.render(null, document.getElementById('app'))


//patch函数传入三个参数 第一个旧的vnode 第二个新的vnode 第三个同期
function patch(n1, n2, container) {

}