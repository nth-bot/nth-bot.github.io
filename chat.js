


function updateScriptList() {

    let localList = ui.s();
    localList = localList
        .filter(item => !item.includes("term_0_"))
        .map(item => "- "+item);
    
    if (navigator.onLine) {
        try {
            portal.from("scripts").select("title").then(function(data) {
                window.scriptList = data.body.map(item => "- " + item.title);
                window.scriptList = window.scriptList.concat(localList);
            });
        } catch(e) {
            window.scriptList = localList;
        }
    } else {
        window.scriptList = localList;
    }
}



window.onload = function() {



    updateScriptList();


    
    ui.b("List", function() {
        
        alert("List of available scripts:\n" + window.scriptList.join('\n'));
    }, "Shows a list of available scripts");



    ui.b("Open", function() {

        let name = prompt("OPEN\nOpen script");

        if (!name) return;

        let open = function(name) {
            if (ui.s().includes(name)) {
            
                ui.e(ui.e() + '\n' + ui.s(name));
                displayNeedRefresh();
    
            } else {
                alert('OPEN\nUnknown path "' + name + '"');    
            }
        }

        if (navigator.onLine) {
            try {
                portal.from("scripts").select().eq("title", name).then(function(data) {
                    if (data.body[0]) {
                        ui.e(ui.e() + '\n' + data.body[0].script);
                        displayNeedRefresh();
                        console.log("[downloaded]", data);
                    } else {
                        open(name);
                    }
                });
            } catch(e) {
                open(name);
            }
        } else {
            open(name);
        }

    }, "Appends a script to the editor");



    ui.b("Save", function() {

        let name = prompt("SAVE\nSave script");

        if (!name) return;

        ui.s(name, ui.e());

        if (navigator.onLine) {
            try {
                portal.from("scripts").upsert([{ title: name, script: ui.e() }]).then(function(data) {
                    console.log("[uploaded]", data);
                });
            } catch(e) {}
        }
        setTimeout(updateScriptList, 3000);
    
    }, "Saves the current script");



    ui.b("Dump", function() {

        ui.e(bot.db.join(''));
        displayDoneRefresh();
    }, "Shows the bot's database");



    ui.b("Load", function() {

        bot.db = [];
        bot.load(ui.e());
        displayDoneRefresh();
    }, "Loads as bot's database");



    ui.b("Log", function() {

        $("#side-log").toggleClass("fullscreen");

    }, "Show introspection log panel");



    ui.b("Doc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io", "_blank");
    }, "Opens the NthBOT page on Github");
   

    ui.e(bot.db.join(''));

    displayDoneRefresh();
}



function displayNeedRefresh() {

    $("#Load").addClass("underline");
    $("#Dump").addClass("underline");
}

function displayDoneRefresh() {

    $("#Load").removeClass("underline");
    $("#Dump").removeClass("underline");
}


let source = `



# Script

< bonjour
> hello world

`;


window.translate = {
    "variable": { fr: "variable" },
    "input": { fr: "entrée" },
    "output": { fr: "sortie" },
    "selfput": { fr: "réflexion" },
    "add to db": { fr: "ajout bdd" },
    "if pattern": { fr: "pattern si" },
    "match": { fr: "correspondance" },
    "not pattern": { fr: "pattern non" },
    "remove pattern": { fr: "pattern oubli" },
};


window.tr = function(txt) { return navigator.languages.includes("fr") ? translate[txt].fr : txt };


let bot = new Bot({
    output: (txt) => {
        ui.t(txt.trim());
        bot.log({ event: "output", content: '<br>' + txt.trim() + '<br>' });
    },
    log: (data) => {
        let html = '';
        html += `<span class="log-command">${bot.currentCommand}</span><br>`;
        html += `<span class="log-event">${tr(data.event)} → </span> `;
        html += `<span class="log-content">${data.content}</span> `;
        html += "<br>";
        let sl = $("#side-log");
        sl[0].innerHTML += html;
        setTimeout(() => { sl[0].scrollTop = sl[0].scrollHeight; }, 10);
    },
    selfputTimeout: 100,
    interval: 20
});

bot.load(source);


bot.run();

