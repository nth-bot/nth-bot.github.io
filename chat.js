


window.onload = function() {



    ui.b("List", function() {

        let list = ui.s();
        list = list
            .filter(item => !item.includes("term_0_"))
            .map(item => "- "+item);
        alert("LOCALSTORAGE\nList of saved editors:\n" + list.join('\n'));
    });



    ui.b("Load", function() {

        let name = prompt("LOCALSTORAGE\nLoad from path");

        if (ui.s().includes(name)) ui.e(ui.s(name));

        else alert('LOCALSTORAGE\nUnknown path "' + name + '"');
    });



    ui.b("Save", function() {

        let name = prompt("LOCALSTORAGE\nSave to path");

        ui.s(name, ui.e());
    });



    ui.b("Dump", function() {

        ui.e(bot.db.join(''));
    });



    ui.b("Refresh", function() {

        bot.db = [];
        bot.load(ui.e());
    });



    ui.b("Help", function() {

        ui.e(`

        Welcome to Zero's NthBOT, a minimalist & 'not too high' chatbot engine.

            op    type         description
            --    ----         -----------
            
            #     delimiter    rule
            <     condition    input
            >     action       output
            @     action       selfput
            *     condition    is in db
            /     condition    is not in db
            +     action       add to db
            -     action       remove from db
            {}    inline       capture
            []    inline       insert
            
        In the toolbar:
        - Clear, clears the terminal
        - List, shows a list of editors saved in the browser's Localstorage
        - Load, loads an editor from the browser's Localstorage
        - Save, saves the current editor to the browser's Localstorage
        - Dump, writes in the editor the current content of the bot's database
        - Refresh, replaces the bot's database by the current editor
        - Help, shows this help file in the editor
        - Doc, opens the NthBOT documentation page on Github

        `);
    });



    ui.b("Doc", function() {

        window.open("https://github.com/nth-bot/nth-bot.github.io", "_blank");
    });



    

    ui.e(bot.db.join(''));
}




let source = `

# Minimal
< hello
> hi

`;

let bot = new Bot({
    output: (txt) => { ui.t(txt.trim()); },
    selfputTimeout: 500
});

bot.load(source);


bot.run();

