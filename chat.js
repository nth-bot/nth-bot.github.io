


window.onload = function() {



    ui.b("List", function() {

        let list = ui.s();
        list = list
            .filter(item => !item.includes("term_0_"))
            .map(item => "- "+item);
        alert("LOCALSTORAGE\nList of saved scripts:\n" + list.join('\n'));
    }, "Shows a list of scripts saved in the browser's Localstorage");



    ui.b("Open", function() {

        let name = prompt("LOCALSTORAGE OPEN\nOpen script");

        if (!name) return;

        if (ui.s().includes(name)) {
            
            ui.e(ui.e() + '\n' + ui.s(name));
            displayNeedRefresh();

        } else alert('LOCALSTORAGE\nUnknown path "' + name + '"');
    }, "Opens a script from the browser's Localstorage");



    ui.b("Save", function() {

        let name = prompt("LOCALSTORAGE SAVE\nSave script");

        if (!name) return;

        ui.s(name, ui.e());
    }, "Saves the current script to the browser's Localstorage");



    ui.b("Dump", function() {

        ui.e(bot.db.join(''));
        displayDoneRefresh();
    }, "Replaces the current script by the content of the bot's database");



    ui.b("Load", function() {

        bot.db = [];
        bot.load(ui.e());
        displayDoneRefresh();
    }, "Replaces the bot's database by the current script");



    ui.b("Disc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io/discussions", "_blank");
    }, "Opens the NthBOT discussion page on Github");



    ui.b("Doc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io/wiki", "_blank");
    }, "Opens the NthBOT documentation page on Github");
   

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

# Source code

< hello
> hi

`;

let bot = new Bot({
    output: (txt) => { ui.t(txt.trim()); },
    selfputTimeout: 100,
    interval: 20
});

bot.load(source);


bot.run();

