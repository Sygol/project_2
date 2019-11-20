
if (!localStorage.getItem('username'))
    localStorage.setItem('username', 0);

if (!localStorage.getItem('channel'))
    localStorage.setItem('channel', 0);

if (localStorage.getItem('username')!=0)
    layout()

var socket = io.connect('http://project2-chat.herokuapp.com');

//layout when user already has username
function layout(){
    document.querySelector('.welcome').style.top = '12vh';
    document.querySelector('.welcome').style.width = '90%';
    document.querySelector('.welcome').style.margin.bottom = '3vh';
    document.querySelector('.welcome').style.height = 'auto';
    document.querySelector('.display__username').innerHTML = '<i>Hello ' + localStorage.getItem('username')+'</i>';
}

function formatDate(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    var hour = String(today.getHours()).padStart(2, '0');
    var minute = String(today.getMinutes()).padStart(2, '0');
    var second = String(today.getSeconds()).padStart(2, '0');
    var millisecond = String(today.getMilliseconds()).padStart(2, '0');
    today = mm + '/' + dd + '/' + yyyy +' '+ hour + ':' + minute + ':' + second;
    return today
}

function connectSocket() {

    socket.on('announce message', data => {
        if (data.channel==document.querySelector('.messages__header').textContent){
            addMessage(data.author, data.date, data.message);
            }
    });

    socket.on('announce channel', data => {
        appendChannelName(data.channel);
    });

    socket.on('announce remove message', data => {
         var all_messages = document.querySelectorAll('.message');
         for (i=0; i<all_messages.length; i++){
            if (all_messages[i].children[0].children[0].textContent == data.user && all_messages[i].children[0].children[1].childNodes[0].textContent == data.date && all_messages[i].children[1].childNodes[0].textContent == data.message_text){
                all_messages[i].remove();
            }
         }
    });
}

function displayChannelList(){
    $("ul").each(
      function() {
        var elem = $(this);
        if (elem.children().length == 0)
          document.querySelector('.channels').style.display = 'none';
        else
          document.querySelector('.channels').style.display = 'block';
    });
}

function displayChannelWindow(channel){
    document.querySelector('.messages__header').textContent = channel.textContent;
    document.querySelector('.messages').style.display = 'block';
}

function newChannelAjax(channelName){
    $.ajax({
        type: 'GET',
        url: '/add_channel',
        data: {'channel': channelName},
        dataType: 'json'
    });
}

function appendChannelName(channelName){
    var a = document.createElement('a');
    var parent = document.querySelector('.channels__list')
    a.setAttribute('href', '#');
    parent.appendChild(a);
    a.innerHTML = '<li class="channel" onclick="getChannelMessages(this)">'+channelName+'</li>';
    document.querySelector('#new_channel__name').value = '';
    document.querySelector('.new_channel__form').style.display = 'none';
    document.querySelector('.channels').style.display = 'block';
}

//saves messages to global dict
function addMessageAjax(author, date, message) {
    $.ajax({
        type: 'GET',
        url: '/add_message',
        data: {
            channel_name: document.querySelector('.messages__header').textContent,
            username: author,
            message: message,
            date: date
        },
        dataType: 'json',
    });
}

//displays messages in window
function addMessage(author, date, message){
    var div = document.createElement('div');
    var messages_display = document.querySelector('.messages__display');
    div.setAttribute('class', 'message');
    messages_display.appendChild(div);
    var author_div = document.createElement('div');
    author_div.setAttribute('class', 'message__author');
    var text = document.createElement('div');
    text.setAttribute('class', 'message__text');
    div.appendChild(author_div);
    div.appendChild(text);
    author_div.innerHTML='<span class="author">'+author+'</span><span class="message__date">'+date+'<span class="remove__message" onclick="RemoveMessage(this)">x</span></span>';
    text.textContent=message;
    messages_display.scrollTop = messages_display.scrollHeight;
    document.querySelector('textarea').value = '';
    displayRemovalButton(author, author_div);
}

function clearMessageWindow(){
    divsToRemove = document.querySelectorAll('.message');
    for (i=0; i<divsToRemove.length; i++){
        divsToRemove[i].parentNode.removeChild(divsToRemove[i]);
    }
}

//gets channel messages from global dict
function getChannelMessages(channel){
    displayChannelWindow(channel);
    var channel_name = channel.textContent;
    localStorage.setItem('channel', channel_name);
    clearMessageWindow();
    $.ajax({
       type: 'GET',
       url: '/get_channel_messages',
       data: {'channel': channel_name},
       dataType: 'json',
       success: function(channel){
          var author, date, textMessage;
          for (i=0; i<channel.length; i++){
             for (j=0; j<Object.keys(channel[i]).length; j++){
                if (Object.keys(channel[i])[j]!='date'){
                    author = Object.keys(channel[i])[j];
                    break
                }
             }
             date = channel[i]['date'];
             textMessage = channel[i][author];
             addMessage(author, date, textMessage);
          }
       }
    });
}

function displayRemovalButton(author, div){
    if (localStorage.getItem('username')==author){
        div.children[1].children[0].style.display = 'inline';
        console.log(div.parentElement);
        div.parentElement.style.marginLeft = '15%';
        div.parentElement.style.marginRight = '35px';
    }
}

function RemoveMessage(message){
    var channel = document.querySelector('.messages__header').textContent;
    var date = message.parentElement.childNodes[0].textContent;
    var message_text = message.parentElement.parentElement.parentElement.children[1].textContent;
    var user = localStorage.getItem('username')
    $.ajax ({
      type:'GET',
      url:'/remove_message',
      data: {'user': user,
             'date': date,
             'message': message_text,
             'channel': channel},
      dataType: 'json'
    });
    socket.emit('remove message', {'user': user, 'date': date, 'channel': channel, 'message_text': message_text});
}

function verifyChannelName(channelName){
      var channels = document.querySelectorAll('.channel');
      if (channelName.length<3){
            alert('Too short!');
            return false
      }
      for (i=0; i<channels.length; i++){
        if (channelName==channels[i].textContent){
            alert('This channel name already exists');
            return false
        }
      }
      document.querySelector('.messages__header').textContent = channelName;
      clearMessageWindow();
      document.querySelector('.messages').style.display = 'block';
      localStorage.setItem('channel', channelName);
      return true
}

window.onload = () => {
    if (localStorage.getItem('username') == 0){
        usernameForm = document.querySelectorAll('.username__form');
        document.querySelector('.channels').style.display = 'none';
        for (i=0; i<usernameForm.length; i++){
            usernameForm[i].style.display = 'block';
            document.querySelector('.new_channel__button').style.display = 'none';
        }
    }

    if (localStorage.getItem('channel') != 0){
        var channel = document.querySelectorAll('.channel')
        for (i=0; i<channel.length; i++){
            if (channel[i].textContent == localStorage.getItem('channel')){
                getChannelMessages(channel[i]);
                break
            }
        }
    }
    connectSocket();
}

document.querySelector('#username__button').onclick = () =>{
    usernameInput = document.querySelector('#username__input').value;
    localStorage.setItem('username', usernameInput);
    usernameForm = document.querySelectorAll('.username__form');
    for (i=0; i<usernameForm.length; i++){
        usernameForm[i].style.display = 'none';
    }
    document.querySelector('.new_channel__button').style.display = 'block';
    layout();
    displayChannelList();

}

document.querySelector('.new_channel__button').onclick = () =>{
    document.querySelector('.new_channel__button').style.display = 'none';
    document.querySelector('.new_channel__form').style.display = 'block';
}

document.querySelector('#send_message').onclick = () => {
      var author = localStorage.getItem('username');
      var date = formatDate()
      var message = document.querySelector('textarea').value;
      if (message == ''){
        return false
      }
      var channel = document.querySelector('.messages__header').textContent;
      socket.emit('send message', {'author': author, 'date': date, 'message': message, 'channel':channel});
      addMessageAjax(author, date, message);
};

document.querySelector('#new_channel__submit').onclick = () => {
      var newChannelName = document.querySelector('#new_channel__name').value;
      var isNewChannel = verifyChannelName(newChannelName);
      if (isNewChannel){
          document.querySelector('.new_channel__button').style.display = 'block';
          socket.emit('add channel', {'channel': newChannelName});
          newChannelAjax(newChannelName);
      }
}

