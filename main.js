


var jQueryTerminal = $('#terminal').terminal(function (command) {
    if (command !== '') {
        try {
            bot.input(command);
            //var result = command;
            //if (typeof result != "undefined") this.echo(JSON.stringify(result, null, 4));
        } catch (e) {
            this.echo(e.message);
            this.echo("Ready");
        }
    }
}, {
    greetings: 'Ready',
    name: 'term',
    prompt: '',
    historySize: 100
});


//new EnhancedTextarea(document.getElementById("editor"));


CodeMirror.defineSimpleMode("mymode", {
    // The start state contains the rules that are initially used
    start: [
        { regex: /(\[\[+|\]\]+|\{\{+|\}\}+|\-\-+|\+\++|\/\/+|\*\*+|\@\@+|\<\<+|\>\>+)/, token: "normal" },

        { regex: /\[/, token: "insertion", push: "insertion" },
        { regex: /\{/, token: "capture", push: "capture" },

        { regex: /[-+\/*@<>]+/, token: "operator" },

        { regex: /#/, token: "operator", next: "delimiter" },
        { regex: /./, token: "normal" }
    ],
    insertion: [
        { regex: /\[/, token: "insertion", push: "insertion" },
        { regex: /\{/, token: "capture", push: "capture" },
        { regex: /\]/, token: "insertion", pop: true },
        { regex: /./, token: "insertion" }
    ],
    capture: [
        { regex: /\[/, token: "insertion", push: "insertion" },
        { regex: /\{/, token: "capture", push: "capture" },
        { regex: /\}/, token: "capture", pop: true },
        { regex: /./, token: "capture" }
    ],
    delimiter: [
        { regex: /[-+\/*@<>]+/, token: "operator", next: "start" },
        { regex: /#/, token: "operator" },
        { regex: /./, token: "delimiter" }
    ],
    meta: {
    }
});


var codeMirror = CodeMirror.fromTextArea(document.getElementById("editor"), {
    indentUnit: 4,
    indentWithTabs: false,
    //lineNumbers: true,
    theme: "blackboard",
    mode: "mymode"
});


Split([".CodeMirror", "#terminal"], {
    gutterSize: 5,
    direction: "vertical",
    elementStyle: function (dimension, size, gutterSize) {
        return {
            'height': 'calc(' + size + 'vh - ' + gutterSize + 'px - 2em)',
        }
    },
});


var ui = {
    toolbarButtons: {},
    e: function (txt) { // editor
        try {
            if (typeof txt == "undefined") return codeMirror.getValue();
            codeMirror.setValue(txt);
        } catch (e) {
            console.error(e.message);
        }
    },
    b: function (name, code) { // buttons
        try {
            if (typeof code == "undefined") {
                document.getElementById(name).outerHTML = '';
                delete ui.toolbarButtons[name];
            } else {
                document.getElementById("toolbar").innerHTML +=
                    `<span id="${name}" class="button" onclick="ui.toolbarButtons['${name}']()">${name}</span>`;
                ui.toolbarButtons[name] = code;
            }
        } catch (e) {
            console.error(e.message);
        }
    },
    t: function (txt, handler) { // terminal
        try {
            if (typeof handler == "undefined") {
                if (typeof txt == "undefined") {
                    jQueryTerminal.clear();
                    jQueryTerminal.echo("Ready");
                } else {
                    jQueryTerminal.echo(txt);
                }
            } else {
                jQueryTerminal.read(txt, input => { handler(input); });
            }
        } catch (e) {
            console.error(e.message);
        }
    },
    s: function (k, v) { // storage
        try {
            if (typeof v == "undefined") {
                if (typeof k == "undefined") {
                    return Object.keys(localStorage);
                } else {
                    if (arguments.length == 1)
                        return JSON.parse(localStorage[k]);
                    else
                        delete localStorage[k];
                }
            } else {
                return localStorage[k] = JSON.stringify(v);
            }
        } catch (e) {
            console.error(e.message);
        }
    },
};


//ui.b("Clear editor", () => { ui.e(''); });
//ui.b("Clear", () => { ui.t(); });


setInterval(function () {
    var time = new Date();
    document.getElementById("time").innerHTML = time.getHours().toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ':' + time.getMinutes().toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '.' + time.getSeconds().toLocaleString(undefined, { minimumIntegerDigits: 2 });
}, 1000);
