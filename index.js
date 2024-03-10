const WebSocket = require('ws')
const path = require('path')
const express = require('express')
const app = express();


// setting static files on the server
app.use('/',express.static(path.join(__dirname,'client')))

const PORT = process.env.PORT || 5000

const server = app.listen(PORT ,() => console.log("express app is listening at port:"+PORT))


// creating websocket server
const wss = new WebSocket.Server({ server },() =>{
    console.log("Websocket is running.......")
})

const allclients = [];
const messages = [];
const typingusers = [];


function getTime(){
    const time = Date.now();
    return time;
}

function AddMessage(msg,userName,userTime, userColor){
    // if messages lenght is greater than 20 remove one from start
    if(messages.length == 20){
       messages.shift()
   }

   messages.push({
       message: msg,
       user:  userName,
       time : userTime,
       color: userColor
   })
}

// sending users info to the all client/users
function updateAllUsers(){
  allclients.forEach(client =>{
      if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify({
            event: "UserInfo",
            data : allclients.map(user =>({
                user: user._userdetails.user,
                onlineStatus: user._userdetails.onlineStatus,
                color:user._userdetails.color
            }))
        }))
      }
  })
}

function broadCastNewMessage(user, msg,msgtime, clr){
  allclients.forEach(client =>{
      if(client.readyState === WebSocket.OPEN){
          client.send(JSON.stringify({
              event: 'Message',
              data : {user,msg, time: msgtime, color: clr}
          }))
      }
  })

}

function broadCastTypingUser(){
    allclients.forEach(client =>{
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
                event: 'Typinguser',
                data: typingusers.map(userob=>({
                   user: userob._userdetails.user
                }))
            }))
        }
    })
}
wss.on('connection',(ws)=>{
    console.log("clinet connected")
    ws.on('message',(objdata)=>{
     
        const {event ,data} = JSON.parse(objdata.toString());
        
        // checking events one by one 

        switch(event){
          case 'UserInfo' :{
            const joinedTime = getTime();
            
            // adding data object to custom websocket property
            ws._userdetails = data;
            allclients.push(ws);
            
            updateAllUsers();
            // send current messages to the new client
            if(messages.length !== 0){
                ws.send(JSON.stringify({
                    event: "Message",
                    data: messages.map((msgobj)=>({
                        msg: msgobj.message,
                        user: msgobj.user,
                        time: msgobj.time,
                        color: msgobj.color

                    })
                    )
                }))
            }
           
            const joinedUser = `------ User ${ws._userdetails.user} joined ----------`

            AddMessage(joinedUser,'>>>>',joinedTime,ws._userdetails.color)
            
            broadCastNewMessage(">>>>",joinedUser,joinedTime,ws._userdetails.color)
          
            break
          }
          case 'Userstatus':{

          ws._userdetails.onlineStatus = data
          updateAllUsers();
            break
          }
         
          case 'Message':{
            const time = getTime();
            AddMessage(data.msg,ws._userdetails.user,time,ws._userdetails.color)
            broadCastNewMessage(ws._userdetails.user,data.msg,time,ws._userdetails.color)
              break
          }
     
          // add current typing user if it doen't exist

          case 'AddUserTyping':{
              const user = typingusers.findIndex(user => user === ws)
              if(user === -1){
                  typingusers.push(ws)
              }
             broadCastTypingUser()
             break
          } 
          case 'RemoveUserTyping':{
            const user = typingusers.findIndex(user => user === ws)
            if(user !== -1){
                typingusers.splice(user,1)
            }
           broadCastTypingUser()
           break
        } 

         // broadcast message when user leave chatroom

         case 'userleft':{
             const lefttime = getTime()
             const leftUserDetail = `-------- User ${ws._userdetails.user} left ---------`
             AddMessage(leftUserDetail,"xxxx",lefttime,ws._userdetails.color)

             // removing from allclients array 
             const user = allclients.findIndex(user => user === ws)
             if(user !== -1){
                broadCastNewMessage("xxxx",leftUserDetail,lefttime,ws._userdetails.color)
                allclients.splice(user,1)

                updateAllUsers();
             }


             break
         }






        }







    })
})