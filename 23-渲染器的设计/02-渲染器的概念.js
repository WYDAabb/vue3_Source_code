//创建渲染器函数
function createRenderer() {
    //patch函数传入三个参数 第一个旧的vnode 第二个新的vnode 第三个挂载点
    //patch 打补丁 寻找变更节点 以及挂载操作
    function patch(n1, n2, container) { }


    //树形vnode节点 ，第二个参数是挂载节点
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
        //将vnode存储到container._vnode下面 【也就是旧的vnode节点】
        container._vnode = vnode
    }

    //服务端渲染使用
    function hydrate() { }


    return {
        render,
        hydrate
    }
}

const renderer = createRenderer()

//首次渲染 
renderer.render(vnode1, document.getElementById('app'))
//二次渲染 
renderer.render(vnode2, document.getElementById('app'))
//三次渲染 
renderer.render(null, document.getElementById('app'))



function patch(n1, n2, container) {

}