const template = `<p>Vue</p>`

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

console.log(tokenize(template))