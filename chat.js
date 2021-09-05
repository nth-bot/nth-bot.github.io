


window.onload = function() {



    ui.b("List", function() {

        let list = ui.s();
        list = list
            .filter(item => !item.includes("term_0_"))
            .map(item => "- "+item);
        alert("LOCALSTORAGE\nList of saved scripts:\n" + list.join('\n'));
    });



    ui.b("Open", function() {

        let name = prompt("LOCALSTORAGE OPEN\nOpen script");

        if (!name) return;

        if (ui.s().includes(name)) {
            
            ui.e(ui.e() + '\n' + ui.s(name));
            displayNeedRefresh();

        } else alert('LOCALSTORAGE\nUnknown path "' + name + '"');
    });



    ui.b("Save", function() {

        let name = prompt("LOCALSTORAGE SAVE\nSave script");

        if (!name) return;

        ui.s(name, ui.e());
    });



    ui.b("Dump", function() {

        ui.e(bot.db.join(''));
        displayDoneRefresh();
    });



    ui.b("Load", function() {

        bot.db = [];
        bot.load(ui.e());
        displayDoneRefresh();
    });



    ui.b("Disc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io/discussions", "_blank");
    });



    ui.b("Doc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io/wiki", "_blank");
    });
   

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

