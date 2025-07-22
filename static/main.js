let socket = null;
let o = document.getElementById("output")
let userField = document.getElementById("username");
let messageField = document.getElementById("message");
let userColors = {};

window.onbeforeunload = function () {
    console.log("Leaving");
    let jsonData = {};
    jsonData["action"] = "left";
    socket.send(JSON.stringify(jsonData));
}

document.addEventListener("DOMContentLoaded", function() {
    socket = new ReconnectingWebSocket("ws://127.0.0.1:8080/ws", null, {debug: true, reconnectInterval: 3000});

    const offline = `<span class="badge bg-danger">Not connected</span>`
    const online = `<span class="badge bg-success">Connected</span>`
    let statusDiv = document.getElementById("status");

    socket.onopen = () => {
        console.log("Successfully Connected");
        statusDiv.innerHTML = online
    }

    socket.onclose = () => {
        console.log("Connection Closed");
        statusDiv.innerHTML = offline
    }

    socket.onerror = error => {
        console.log("There was an error");
        statusDiv.innerHTML = offline
    }

    socket.onmessage = msg => {
        // console.log(msg);
        // let j = JSON.parse(msg.data);
        // console.log(j);

        let data = JSON.parse(msg.data);
        console.log("Action is", data.action);

        switch (data.action) {
            case "list_users":
                let ul = document.getElementById("online_users");
                while (ul.firstChild) ul.removeChild(ul.firstChild);

                if (data.connected_users.length > 0) {
                    data.connected_users.forEach(function (item) {
                        let li = document.createElement("li");
                        li.appendChild(document.createTextNode(item));
                        ul.appendChild(li);
                    })
                }
                break;

            case "broadcast":
                // iMessage-style rendering with avatar, username, and timestamp
                // data.message is in the format: <strong>username</strong>: message
                let match = data.message.match(/^<strong>(.*?)<\/strong>: (.*)$/);
                let isSelf = false;
                let username = "";
                let msgText = data.message;
                if (match) {
                    username = match[1];
                    msgText = match[2];
                    isSelf = (userField.value === username);
                }
                let bubble = document.createElement("div");
                bubble.className = "bubble" + (isSelf ? " bubble-self" : "");

                // Avatar
                let avatar = document.createElement("div");
                avatar.className = "bubble-avatar";
                avatar.style.background = getUserColor(username);
                avatar.textContent = username ? username[0].toUpperCase() : "?";
                bubble.appendChild(avatar);

                // Content (username + message)
                let content = document.createElement("div");
                content.className = "bubble-content";
                let userSpan = document.createElement("span");
                userSpan.className = "bubble-username";
                userSpan.textContent = username;
                content.appendChild(userSpan);
                let msgSpan = document.createElement("span");
                msgSpan.innerHTML = msgText;
                content.appendChild(msgSpan);
                // Timestamp
                let timeSpan = document.createElement("div");
                timeSpan.className = "bubble-timestamp";
                let now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                let ampm = hours >= 12 ? 'PM' : 'AM';
                let displayHours = hours % 12 || 12;
                let displayMinutes = minutes < 10 ? '0' + minutes : minutes;
                timeSpan.textContent = displayHours + ':' + displayMinutes + ' ' + ampm;
                content.appendChild(timeSpan);
                bubble.appendChild(content);

                o.appendChild(bubble);
                o.scrollTop = o.scrollHeight;
                break;
        }
    }

    userField.addEventListener("change", function() {
        let jsonData = {};
        jsonData["action"] = "username";
        jsonData["username"] = this.value;
        socket.send(JSON.stringify(jsonData));
    })

    messageField.addEventListener("keydown", function(event) {
        if (event.code === 'Enter') {
            if (!socket) {
                console.log("No connection");
                return false
            }
            if (userField.value === "" || messageField.value === "") {
                errorMessage("Fill out both username and message");
                return false;
            } else {
                sendMessage();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    })

    document.getElementById("sendBtn").addEventListener("click", function () {
        if (userField.value === "" || messageField.value === "") {
            errorMessage("Fill out both username and message");
            return false;
        } else {
            sendMessage();
        }
    })
})

function sendMessage() {
    let jsonData = {};
    jsonData["action"] = "broadcast";
    jsonData["username"] = userField.value;
    jsonData["message"] = messageField.value;
    socket.send(JSON.stringify(jsonData));
    messageField.value = "";
}

function errorMessage(msg) {
    notie.alert({
        type: 'error',
        text: msg,
      })
}

function getUserColor(username) {
    if (!userColors[username]) {
        // Generate a random pastel color
        const colors = [
            '#e57373', '#f06292', '#ba68c8', '#64b5f6', '#4dd0e1', '#81c784', '#ffd54f', '#ffb74d', '#a1887f', '#90a4ae',
            '#7986cb', '#ff8a65', '#d4e157', '#ffd600', '#00bfae', '#00bcd4', '#ff5252', '#ff4081', '#536dfe', '#69f0ae'
        ];
        userColors[username] = colors[Math.floor(Math.random() * colors.length)];
    }
    return userColors[username];
}