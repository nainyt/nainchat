const chatContainer = document.querySelector('.chat-container');
const OnlineUserCont = document.querySelector('.online-user');
const modelBox = document.querySelector('.model-box');
const mbinput = document.querySelector('.model-box input');
const joinbtn = document.querySelector('#join');
const error = document.querySelector('.error');



joinbtn.onclick = () =>{
    const username = mbinput.value.replace(/(<([^>]+)>)/gi,"");

    // if input value is null ,error msg will be displayed for 2 secs
    if(username === ''){
        error.style.opacity = '100';
        setTimeout(() =>{
            error.style.opacity = '0'; 
        },2000);

        return;
    }
    // else get data
    getData(username);
}



function getData(username){

// hide model-box
modelBox.style.display = "none";

// unhide containers
OnlineUserCont.style.display = "flex";
chatContainer.style.display = "flex";

// initializing variables
const onlineUsers = document.querySelector('.online-user ul');
const onlineUserH4 = document.querySelector('.online-user h4');
const chtarea = document.querySelector('.chat-area');
const typinguser = document.querySelector('#typing-user');
const iptxt = document.querySelector('#msgtxt');
const sndbtn = document.querySelector('#sendbtn');

// creating colors array which will uniquely identify the user
const color = ['lime','deeppink','chartreuse','turquoise','greenyellow',
'fuchsia','cyan','red','crimson','yellow','springgreen','tomato'];

// temproray user
//const username = prompt("Enter your name");

// creating websocket object port must be matched to server port number

const ws = new WebSocket('ws://localhost:5000');

//adding custom function to websocket Class
WebSocket.prototype.emit = function(event, data){
    this.send(JSON.stringify({event,data}));
}

// adding custom listener object to websocket class
WebSocket.prototype.listen = function(event,callback){
    this._SocketListener = this._SocketListener || {};
    this._SocketListener[event] = callback;
}

sndbtn.disabled = true;


//checking ws connection 
ws.onopen = () =>{
    sndbtn.disabled = false;
    
    // this will pick up one random color between 1 and 12 indexes
    const useColor = color[Math.floor(Math.random()*12)];

    //sending user details to the websocket server
    ws.emit("UserInfo",{user:username, onlineStatus:"green", color:useColor});


    //when window is focused,blured or left by the user these will be emitted
    window.onfocus = () =>{
        ws.emit("Userstatus","green");
    }

    window.onblur = () =>{
        ws.emit("Userstatus","yellow");
    }

    window.onbeforeunload = () =>{
        ws.emit("userleft",null);
    }
}

// sending message to the websocket server
sndbtn.onclick = (e)=>{
  // stripping html tags using regular expression
  let msg = iptxt.value.replace(/(<([^>]+)>)/gi,"");
  if(msg !== ""){
      ws.emit("Message",{msg})
  }
  // if user sent message
  iptxt.value = "";
  ws.emit("RemoveUserTyping",null);
}

// sending typing-user details
iptxt.onkeyup = () =>{
    if(iptxt.value !== ''){
        ws.emit("AddUserTyping",null);
    }else{
        ws.emit("RemoveUserTyping",null);
    }
}

// websocket server respone 
ws.onmessage = (message)=>{
     
    //console.log(message);
    const {event , data} = JSON.parse(message.data);

     
    ws._SocketListener[event](data);
}

ws.listen('UserInfo',function(data){
    
    // console.log(data.length)

     onlineUserH4.innerText = "Online User "+data.length;
     onlineUsers.innerHTML = "";

     data.forEach(userObj => {
         onlineUsers.innerHTML += `
         <li>
         <span>${userObj.user}</span>
         <span id="${userObj.onlineStatus}">●</span>
       </li>`
     });

});

ws.listen('Message',function(data){
   console.log(data);
   if(data.length > 0){
       for(let i= 0; i<data.length; i++){
           chtarea.innerHTML += `
           <div class="msg-box">
            <span>
                <span id="username" style="color:${data[i].color}">${data[i].user}</span>
                ${data[i].msg}
            </span>
            <span id="time">${getMsgTime(data[i].time)}</span>
         </div>`;

         // scroll down when receive new msg
         chtarea.scrollTop = chtarea.scrollHeight;
       }
   }else{
            chtarea.innerHTML += `
            <div class="msg-box">
                <span>
                    <span id="username" style="color:${data.color}">${data.user}</span>
                    ${data.msg}
                </span>
                <span id="time">${getMsgTime(data.time)}</span>
        </div>`;

        chtarea.scrollTop = chtarea.scrollHeight;
   } 

});

ws.listen('Typinguser',function(data){
    // if the array length is greater than 0 and array element doesn't match the current username
    // then show the last element in the typinguser div
    if(data.length > 0 && data[data.length-1].user !== username ){
        typinguser.innerHTML = data[data.length-1].user + ' is typing...';
    // if the array lenght is greater than 1 and array element and username are same then
    // pick out 2nd last element and show in the typinguser div    
    }else if (data.length > 1 && data[data.length-1].user === username ){
        typinguser.innerHTML = data[data.length-2].user + ' is typing...';
    }else{
        typinguser.innerHTML = '';
    }
})


}


//converting milliseconds to the clinet timezone
function getMsgTime(milli){
    const time = new Date(milli);
    const hr = time.getHours();
    const min = time.getMinutes();
    const sec = time.getSeconds();

    return `${hr}:${min}:${sec}`
}

// themes 
function changetheme(e){
   //console.log(e.classList.value);
   const themeClass = e.classList.value;
   const themes = ['a1','a2' ,'a3', 'a4'];
   switch(themeClass){
        case themes[0]:
        setTheme('background1.png');
        break;

        case themes[1]:
        setTheme('background2.png');
        break;

        case themes[2]:
        setTheme('background3.png');
        break;

        case themes[3]:
        setTheme('background4.png');
        break;
   }
}

// set theme/ image to the background if it's loaded fully
function setTheme(img){
    const bodyStyle = document.body.style;
    var image = new Image();
    image.onload = () => {
        bodyStyle.backgroundImage = `url(${img})`;
    }
    image.src = img;
    if(image.complete) img.onload();
}











