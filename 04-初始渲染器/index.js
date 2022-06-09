const vnode = {
    tag: 'button',
    props: {
        onClick: () => {
            alert('我是div')
        }
    },
    children: '再点一遍'
}


/* 渲染器的精髓都在更新节点的时候 会进行diff  可以说是渲染器的精髓
    
*/
//vnode 是虚拟dom对象 container为挂载的节点
function renderer(vnode, container) {
    //使用vnode tag名称创建标签名称
    const el = document.createElement(vnode.tag)
    //遍历vnode.props 将属性和事件添加到 Dom元素
    for (const key in vnode.props) {
        if (key.startsWith("on")) {
            el.addEventListener(key.substr(2).toLowerCase(),  //添加事件名称
                vnode.props[key] //事件处理函数
            )
        }
    }
    //处理children
    if (typeof vnode.children === 'string') {
        //如果children是string类型 那就表示是一个文字 写在内部就可以
        el.appendChild(document.createTextNode(vnode.children))
        //判断是否是其他内容 如果里面还包含着其他标签 那么就递归调用 eg:<div><span>xxx</span></div>
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            renderer(child, el)
        });
    }
    //挂在元素
    container.appendChild(el)
}

renderer(vnode, document.body)
