var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
   if(path==='/register'){
      response.statusCode=200
      response.setHeader('Content-Type','text/html;charset=utf-8')
      const userString=fs.readFileSync('./db/users.json').toString()
      const userList=JSON.parse(userString)
      const arr=[]
      request.on('data',(chunk)=>{
          arr.push(chunk)
      })
      request.on('end',()=>{
        const str=Buffer.concat(arr).toString()
        const obj=JSON.parse(str)
        const lastUser=userList[userList.length-1]
        const newUser={
          id:lastUser? lastUser.id+1:1,
          name:obj.name,
          password:obj.password
        }
        userList.push(newUser)
        fs.writeFileSync('./db/users.json',JSON.stringify(userList))
      
         response.end('很好')
      })
      
      

   }else if(path==='/sign_in' && method==='POST'){
    response.statusCode=200
    const userString=fs.readFileSync('./db/users.json').toString()
    const userList=JSON.parse(userString)
    const arr=[]
    request.on('data',(chunk)=>{
        arr.push(chunk)
      })
    request.on('end',()=>{
      const str=Buffer.concat(arr).toString()
      const obj=JSON.parse(str)
      const user= userList.find(user=>obj.name===user.name && obj.password===user.password)
      if(user===undefined){
        response.setHeader('Content-Type','text/json;charset=utf-8')
        response.statusCode=404
         response.end(`{errorCode:5036}`)
         
      }else{
        const random=Math.random()
        const session=fs.readFileSync('./session.json').toString()
        const sessionObj=JSON.parse(session)
        sessionObj[random]={
           "id" : user.id,
          
        }
        fs.writeFileSync('./session.json',JSON.stringify(sessionObj))
        response.setHeader('Set-Cookie',`session=${random};HttpOnly`)//HttpOnly 
        response.end('登录成功')
      }
    
      
    })
    

   }else if(path==='/home'){
     response.setHeader('Content-Type','text/html;charset=utf-8')
     let htmlHome=fs.readFileSync('./public/home.html').toString()
     const cookie=request.headers['cookie']
     let sessionId;
     try {
        sessionId=cookie.split(';').filter(user=>user.indexOf('session')>0)[0].split('=')[1].toString()
       
     } catch (error) {
      htmlHome= htmlHome.replace('{{user_name}}','未登录')
       response.end(htmlHome)
        
     }
     const session=fs.readFileSync('./session.json').toString()
     const sessionObj=JSON.parse(session)
     const id=sessionObj[sessionId]['id'];
     console.log(id);
    const userString=fs.readFileSync('./db/users.json').toString()
    const userList=JSON.parse(userString)
    const user=userList.find(user=>user.id.toString()===id.toString())
    if(user){
      console.log(`用户存在`);
      htmlHome=htmlHome.replace('{{user_name}}',user.name)

    }else{
      htmlHome.replace('{{user_name}}','未登录')
    }
    
    response.end(htmlHome)
    
     




   }else{
    response.statusCode = 200

    const x=path;
    const filePath = path=== '/' ? '/index.html':path
    const index=filePath.lastIndexOf('.')
    const  suffix=filePath.substring(index)
    console.log(suffix);
    const fileTypes={
      ".html":"text/html",
      ".css" : "text/css",
      ".js" : "text/javascript",
      ".png":"image/png",
      ".jpg" : "image/jpeg"
    }
    response.setHeader('Content-Type', `${fileTypes[suffix] || fileTypes['.html']};charset=utf-8`)
    let content
  try {
    content=fs.readFileSync(`public/${filePath}`)
  } catch (error) {
    content='文件不存在'
    response.statusCode=404
    
  }

    response.write(content)


    // //模拟读数据库
    // let users=fs.readFileSync('./db/users.json').toString()
    // const array=JSON.parse(users)
    // console.log(array);

    // //模拟写数据库
    // const user={
    //   id:3,
    //   name: "rando",
    //   password:"rrr"
    // }
    // array.push(user)
    // console.log(array);
    // const datawirte=JSON.stringify(array)
    // fs.writeFileSync('./db/users.json',datawirte)
   
    response.end()
   }
 

   

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

