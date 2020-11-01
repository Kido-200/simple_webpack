const fs = require('fs')
const path = require('path')

let fileContent = fs.readFileSync('./src/index.js')

function getDependencies(str){
  let reg = /require\(['"](.+?)['"]\)/g;
  let result = null;
  let dependencies = []
  //exec一次只会匹配一个
  //reg是g的时候第二次执行会沿着上次往下找，找不到时返回null
  while(result = reg.exec(str)){
    //第一个表示整个正则表达式所匹配的内容；第二个表示()内容的子表达式所匹配的内容
    //所以push result[1]
    dependencies.push(result[1])
  }
  return dependencies
} 

let ID = 0;

function createAsset(filename){
  let fileContent = fs.readFileSync(filename,'utf-8')
  const id = ID++
  return {
    id:id,
    filename: filename,
    dependencies:getDependencies(fileContent),
    code:`function(require,exports,module){
      ${fileContent}
    }`
  }
}




/*
queue
[
  {
    id:0,
    filename:'./src/index.js,
    dependencies:['./action.js','./name'],
    mapping:{'./action.js':1,'./name':2},
    code:'省略，
  }，
  {
    id:1,
    filename:'./action.js',
    ...
  }
]
得到queue
*/
function createGraph(filename){
  let asset = createAsset(filename)
  let queue = [asset]
  //let of 可以让数组在动态增加时也可以照常执行
  for(let asset of queue){
    //得到绝对路径
    const dirname = path.dirname(asset.filename)
    asset.mapping = {}
    asset.dependencies.forEach(relativePath => {
      //这个dependencies里的路径是相对index.js的，所以要做拼接
      const absolutePath = path.join(dirname,relativePath)
      //通过绝对路径创建出文件对象
      const child = createAsset(absolutePath)
      queue.push(child)
      //给mapping里各个dependncies赋值上对应的queue里的下标(因为是按顺序的所以与id++保持一致)
      asset.mapping[relativePath] = child.id
    })
  }
  return queue
}

function createBundle(graph){
  let modules = ''
  graph.forEach(mod => {
    modules += `${mod.id}:[
      ${mod.code},
      ${JSON.stringify(mod.mapping)}
    ],`
  })

  //立即执行函数，modules的字符串作为对象里的内容传进去
  const result = `(function(modules){

    function exec(id){
      let [fn,mapping] = modules[id]
      let module = {exporets:{}}
      fn && fn(require,exports,module)

      function require(path){
        //根据模块路径，返回模块执行的结果(其实是返回模块exports的东西)
        return exec(mapping[path])
      }
      return module.exports
    }

    exec(0)
  })(
    {${modules}}
  )`
  //最后把这个立即执行函数写入js文件,以后调用这一个文件就等于调用那么多文件了
  fs.writeFileSync('./dist/bundle.js',result)
}
let graph = createGraph('./src/index.js')
createBundle(graph)