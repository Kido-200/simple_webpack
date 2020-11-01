(function(modules){

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
    {0:[
      function(require,exports,module){
      const app = require('./app.js')
const fu = require('./fu.js')
    },
      {"./app.js":1,"./fu.js":2}
    ],1:[
      function(require,exports,module){
      exports.a = 1
    },
      {}
    ],2:[
      function(require,exports,module){
      exports.b = 1
    },
      {}
    ],}
  )