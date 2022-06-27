const template = `<div><p>Vue</p><p>Template</p></div>`


//定义状态机的状态
const State = {
    initial: 1, //初始状态
    tagOpen: 2, //标签开始的状态
    tagName: 3, //标签名称状态
    text: 4,   //文本状态
    tagEnd: 5, //标签结束的状态
    tagEndName: 6 //结束标签名称状态
}

//判断是否是字母 一个辅助函数
function isAlpha(char) {
    return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z'
}



//接收模板字符串作为参数，并将模板字符串切割为token返回
function tokenize(str) {
    //状态机的当前状态：初始状态
    let currentState = State.initial
    //用于缓存字符
    const chars = []
    //生成的token会存储到tokens数组中，并作为函数的返回值返回
    const tokens = []
    //while循环开启自动机，只要模板字符串没有被消费尽，自动机就会一直运行
    while (str) {
        //查看第一个字符  这里只是查看，而不是消费
        const char = str[0]
        //switch语句匹配当前的状态 
        switch (currentState) {
            //state处于初始状态
            case State.initial:
                //遇到字符 <
                if (char === '<') {
                    //1.将状态修改为标签开始状态
                    currentState = State.tagOpen
                    //2.消费字符<
                    str = str.slice(1)
                } else if (isAlpha(char)) {
                    //1.遇到字母，切换到文本状态
                    currentState = State.text
                    //2.将当前字母缓存到chars数组
                    chars.push(char)
                    //3.消费当前字符
                    str = str.slice(1)
                }
                break
            //状态机当前处于标签开始状态
            case State.tagOpen:
                if (isAlpha(char)) {
                    //1.遇到字母，切换到标签名称状态
                    currentState = State.tagName
                    //2.将当前字符缓存到chars数组
                    chars.push(char)
                    //3.消费当前字符
                    str = str.slice(1)
                } else if (char === '/') {
                    //1.遇到字符/ 切换到结束标签状态
                    currentState = State.tagEnd
                    //2.消费该字符
                    str = str.slice(1)
                }
                break
            //状态机当前处于标签名称状态
            case State.tagName:
                if (isAlpha(char)) {
                    //1.遇到字母，由于当前处于标签名称状态，所以不需要切换状态，
                    //但需要将但钱字符缓存到chars数组
                    chars.push(char)
                    //2.消费该字符
                    str = str.slice(1)
                } else if (char === '>') {
                    //1.遇到字符 >  切换到初始状态
                    currentState = State.initial
                    // 2.创建一个标签token并添加到数组之中 此时chars数组中缓存的字符就是token
                    tokens.push({
                        type: 'tag',
                        name: chars.join('')
                    })
                    //3.将chars归 0，因为数组中的内容已经清空
                    chars.length = 0
                    //4.消费该字符
                    str = str.slice(1)
                }
                break
            case State.text:
                //状态机当前处于文本状态
                if (isAlpha(char)) {
                    //1.遇到字母，保持状态不变，但应该将当前字符缓存到chars数组
                    chars.push(char)
                    //2.消费当前字符
                    str = str.slice(1)
                } else if (char === '<') {
                    //1.遇到字符 < 切换到初始状态
                    currentState = State.tagOpen
                    //2.从文本状态 ==> 标签开始状态，此时应该创建文本 Token，并添加到tokens数组之中
                    //注意 chars数组中的字符就是文本内容
                    tokens.push({
                        type: 'text',
                        content: chars.join('')
                    })
                    //3.chars数组的内容已经被消费，清空他
                    chars.length = 0
                    //4.消费字符
                    str = str.slice(1)
                }
                break
            //当状态机到标签结束状态
            case State.tagEnd:
                if (isAlpha(char)) {
                    //1.遇到字母,切换到结束标签名称状态
                    currentState = State.tagEndName
                    //2.将当前字符缓存到chars数组
                    chars.push(char)
                    //3.消费当前字符
                    str = str.slice(1)
                }
                break
            // 状态机当前处于结束标签名称状态
            case State.tagEndName:
                if (isAlpha(char)) {
                    //1.遇到字母 不需要切换状态，但需要将当前数组缓存到chars数组
                    chars.push(char)
                    //2.消费当前字符
                    str = str.slice(1)
                } else if (char === '>') {
                    //1.遇到字符 > 切换到初始状态
                    currentState = State.initial
                    //2.从而 结束标签名称状态--> 初始状态 应该保存结束标签名称Token
                    //注意 此时chars数组中缓存的内容就是标签名称
                    tokens.push({
                        type: 'tagEnd',
                        name: chars.join('')
                    })
                    //3.chars数组的内容已经被消费，清空
                    chars.length = 0
                    //4.消费当前字符
                    str = str.slice(1)
                }
                break
        }
    }
    //最后返回token
    return tokens
}

//parse函数接收模板作为参数 转成AST语法树
function parse(str) {
    //先对模板进行标记拿到tokens
    const tokens = tokenize(str)

    //创建root根节点
    const root = {
        type: 'Root',
        children: []
    }
    //创建elementStack栈，起初只有root节点
    const elementStack = [root]

    //开启一个while循环扫描tokens，知道所有token都被扫描完毕为止
    while (tokens.length) {
        //获取当前栈顶节点作为父节点
        const parent = elementStack[elementStack.length - 1]
        //扫描当前的token
        const t = tokens[0]
        //判断当前token的类型
        switch (t.type) {
            case 'tag':
                //如果token是开始标签那么，创建Element类型的AST节点
                const elementNode = {
                    type: 'Element',
                    tag: t.name,
                    children: []
                }
                //将其添加到父级节点children中
                parent.children.push(elementNode)
                //将当前节点压入栈
                elementStack.push(elementNode)
                break
            case 'text':
                //如果当前token是文本，则创建Text类型的AST节点
                const textNode = {
                    type: 'Text',
                    content: t.content
                }
                //将其添加到父节点的children中
                parent.children.push(textNode)
                break
            case 'tagEnd':
                //遇到结束标签后 将当前栈顶节点弹出
                elementStack.pop()
                break
        }
        // 消费已经扫描过的token
        tokens.shift()
    }

    return root
}

//打印当前AST中节点的信息 tootls
function dump(node, indent = 0) {
    //节点的类型
    const type = node.type
    /* 
    节点的描述，如果是根节点就没有描述
    如果是Element类型的节点，则使用node.tag作为节点的描述
    如果是Text类型的节点，则使用node.content作为节点的描述
    */
    const desc = node.type === 'Root'
        ? ''
        : node.type === 'Element'
            ? node.tag
            : node.content

    //打印节点的类型和描述信息
    console.log(`${'-'.repeat(indent)}${type}: ${desc}`)

    //递归打印子节点
    if (node.children) {
        node.children.forEach(n => dump(n, indent + 2))
    }
}

//深度优先遍历 处理每一个节点
function traverseNode(ast, context) {
    //设置当前转换的节点信息context.currentNode
    context.currentNode = ast;

    //1.增加退出阶段的回调函数数组
    const exitFns = [];
    //context.nodeTransforms是一个数组，其中每一个元素都是一个函数
    const transforms = context.nodeTransforms
    for (let i = 0; i < transforms.length; i++) {

        //2.转换函数可以返回另外一个函数，该函数即作为退出阶段的回调函数
        //将当前节点都传入currentNode和context都传给nodeTransforms中注册的回调函数
        const onExit = transforms[i](context.currentNode, context)
        if (onExit) {
            //将退出阶段的回调函数添加到exitFns数组中
            exitFns.push(onExit)
        }
        //由于任何转换函数都可能移除当前节点，因此每个转换函数执行完毕后，
        //都应该检查当前节点是否已经被移除，如果被移除了，直接返回即可
        if (!context.currentNode) return
    }

    //如果有子节点递归调用
    const children = context.currentNode.children
    if (children) {
        for (let i = 0; i < children.length; i++) {
            //递归调用traverseNode转换子节点之前，将当前节点设置为父节点
            context.parent = context.currentNode
            //设置索引
            context.childIndex = i
            //递归调用 将context传入
            traverseNode(children[i], context)
        }
    }

    //节点处理的最后阶段执行缓存到exitFns中的回调函数
    // 反序执行
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}

//封装transform函数，用来对AST进行转换
function transform(ast) {
    //在这里注册context对象
    const context = {
        //增加currentNode，用来存储当前正在转换的节点
        currentNode: null,
        //增加parent，用来存储当前转换节点的父节点
        parent: null,
        //节点替换函数
        replaceNode(node) {
            //为了替换节点我们需要修改AST
            //找到当前节点在父节点的children中的位置：context.childIndex
            //使用新节点替换即可
            context.parent.children[context.childIndex] = node
            //由于当前节点已经被新节点替换掉了，因此我们需要将currentNode更新为新节点
            context.currentNode = node;
        },
        //用于删除节点
        removeNode() {
            if (context.parent) {
                //数组splice方法,根绝当前节点的索引删除当前节点
                context.parent.children.splice(context.childIndex, 1)
                context.currentNode = null
            }
        },
        nodeTransforms: [
            transformElement,
            transformText2
        ]
    }
    //调用traverseNode
    traverseNode(ast, context)
    //打印信息
    console.log(dump(ast));
}

// =============================== AST 工具函数 用来进行JavaScript AST的转换 ===============================
function createStringLiteral(value) {
    return {
        type: 'StringLiteral',
        value
    }
}

function createIdentifier(name) {
    return {
        type: 'Identifier',
        name
    }
}

function createArrayExpression(elements) {
    return {
        type: 'ArrayExpression',
        elements
    }
}

function createCallExpression(callee, arguments) {
    return {
        type: 'CallExpression',
        callee: createIdentifier(callee),
        arguments
    }
}

//转换文本节点
function transformText(node) {
    //如果不是文本节点 那么什么都不做
    if (node.type !== 'Text') {
        return
    }
    //文本节点对应的JavaScript AST节点其实就是一个字符串字面量
    // 因此只需要使用node.content.创建一个stringLiteral类型的节点就可以
    // 最后将文本节点对应的JavaScript AST节点添加到node.jsNode属性下
    node.jsNode = createStringLiteral(node.content)
}

//转换标签节点
function transformElement(node) {
    //将转换代码编写在退出阶段的回调中，
    //这样可以保证该标签节点的子节点全部被处理完毕
    return () => {
        //如果被转换的节点不是元素节点，则什么都不做
        if (node.type !== 'Element') {
            return
        }
        /* 
        1.创建h函数调用语句
        h函数调用的第一个参数是标签名称，因此我们以node.tag来创建一个字符串字面量节点
        作为第一个参数
        */
        const callExp = createCallExpression('h', [
            createStringLiteral(node.tag)
        ])
        node.children.length === 1
            ? callExp.arguments.push(node.children[0].jsNode)
            : callExp.arguments.push(
                createArrayExpression(node.children.map(c => c.jsNode))
            )

        node.jsNode = callExp
    }
}

//转换root根节点
function transformRoot(node) {
    return () => {
        if (node.type !== 'Root') {
            return
        }

        const vnodeJSAST = node.children[0].jsNode

        node.jsNode = {
            type: 'FunctionDecl',
            id: { type: 'Identifier', name: 'render' },
            params: [],
            body: [
                {
                    type: 'ReturnStatement',
                    return: vnodeJSAST
                }
            ]
        }
    }
}




const ast = parse(`<div><p>Vue</p><p>Template</p></div>`)

transform(ast)