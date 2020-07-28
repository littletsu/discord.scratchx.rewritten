(function(ext) {
    var WebSocket = null;
    var WS_URL = "wss://gateway.discord.gg";
    var Client = {ready: false, wsopen: false};

    // Utils

    var IsForEachActive = false;
    var ForEachElement = null;
    var ForEachIndex = 0;

    function checkWs(next) {
        if(window.WebSocket) {
            next();
        };
    };

    function log(msg) {
        console.log("%c [discord.scratchx.rewritten]: " + msg, "color: #7289DA;font-weight: 900;");
    }

    function fetch(endpoint, method = "GET", data = {}, headers = {}) {
        switch(method) {
            case "GET":
                return new Promise((res, rej) => {
                    if (!Client.token) rej({
                        msg: 'Bot is not authenticated.'
                    })
                    headers.Authorization = 'Bot ' + Client.token
                    $.ajax({
                        url: 'https://discordapp.com/api/v7/' + endpoint,
                        headers: headers,
                        method: 'GET',
        
                        success: (resp) => {
                            console.log(resp)
                            res(resp)
                        },
        
                        error: (err) => {
                            console.warn(err)
                            rej(err)
                        }
                    })
                })
                break;
            case "DELETE":
                return new Promise((res, rej) => {
                    if (!Client.token) rej({
                        msg: 'Bot is not authenticated.'
                    })
                    headers.Authorization = 'Bot ' + Client.token
                    $.ajax({
                        url: 'https://discordapp.com/api/v7/' + endpoint,
                        headers: headers,
                        method: 'DELETE',
        
                        success: (resp) => {
                            console.log(resp)
                            res(resp)
                        },
        
                        error: (err) => {
                            console.warn(err)
                            rej(err)
                        }
                    })
                })
                break;
            default:
                return new Promise((res, rej) => {
                    if (!auth) rej({
                        msg: 'Bot is not authenticated.'
                    })
                    headers.Authorization = 'Bot ' + auth
                    $.ajax({
                        url: 'https://discordapp.com/api/v7/' + endpoint,
                        headers: headers,
                        method: method,
                        data: data,
                        success: (resp) => {
                            console.log(resp)
                            res(resp)
                        },
        
                        error: (err) => {
                            console.warn(err)
                            rej(err)
                        }
                    })
                })
        }
    };

    // Built-in Functions

    ext._shutdown = function() {
        if(WebSocket) WebSocket.close()
    };

    ext._getStatus = function() {
        if(!window.WebSocket) {
            return {status: 0, msg: "Your browser doesn't support websockets."};
        } else if(!Client.ready) {
            return {status: 1, msg: "Not connected to Discord."}
        } else {
            return {status: 2, msg: `Ready as ${Client.user.username}`}
        };
    };

    // Block Functions

    // Auth
    function auth(token, status) {
        if(!token || token == "") return;
        Client.token = token;
        log("Authentificating...");

        WebSocket = new window.WebSocket(WS_URL);

        WebSocket.onopen = () => {
            log("WebSocket Open.");
            Client.wsopen = true;
        }

        WebSocket.onclose = (err) => {
            Client = {ready: false, wsopen: false};
            if(err.reason == "Authentication failed.") return log("Invalid token provided.");
            log("WebSocket Closed. " + err.reason);
        }

        WebSocket.onmessage = (message) => {
            let data = JSON.parse(message.data);
            let seq = data.s;
            let parsed = data.d;

     
            function send(opcode, d) {
                if(!Client.wsopen) return;
                WebSocket.send(JSON.stringify({
                    op: opcode,
                    d: d
                }));
            }

            if(data.op == 10) {
                let interval = parsed.heartbeat_interval
                //console.log(parsed)
                setInterval(() => {
                    send(1, seq)
                }, interval)

                send(2, {
                    token: token,
                    "properties": {
                        "$os": "linux",
                        "$browser": "scratchx",
                        "$device": "scratchx"
                    },
                    compress: false,
                    large_threshold: 250,
                    presence: {
                        status: status,
                        since: new Date().valueOf(),
                        afk: false
                    }
                })
                log("Sent auth")
            } else if(data.op == 0) {
                let event = data.t;
                if(event == "READY") {
                    Object.assign(Client, parsed);
                    Client.ready = true;
                    log("Logged in as " + Client.user.username);
                }
            };
        }


    }
    ext.auth = function(token, status) {
        checkWs(auth(token, status));
    }

    // Access_prop
    ext.access_prop = function(prop1, prop2) {
        if(!prop1 || !prop2) return -5;
        var res = JSON.parse(prop2)[prop1];
        if(typeof res == "object") return JSON.stringify(res);
        else return res; 
    }

    // Get Client
    ext.get_client = function() {
        return JSON.stringify(Client);
    }

    // Ready Event
    ext.event_ready = function() {
        return Client.ready;
    }

    // Disconnect from Discord
    ext.disconnect = function() {
        WebSocket.close()
    }

    // Debug Logging
    ext.log = function(message) {
        log(message);
    }

    // get_l
    ext.get_l = function(array) {
        let parsedArray = JSON.parse(array);
        return parsedArray.length;
    }

    // Register extension

    var descriptor = {
        blocks: [
            [' ', "Login to Discord with %s (Bot Token) then change status to %m.status ", "auth"],
            ['r', "Access property %s of %s", "access_prop", "a", '{"a": "Hi!"}'],
            ['r', "client", "get_client"],
            ['h', "ready", "event_ready"],
            [' ', "Disconnect", "disconnect"],
            ['r', "Get length of array %s", "get_l", "[1, 2, 3]"],
            [' ', "(Debug) Log %s", "log"]
        ],

        menus: {
            status: ['online', 'idle', 'dnd', 'offline']
        }
    };

    ScratchExtensions.register('discord.scratchx.rewritten', descriptor, ext);
})({});