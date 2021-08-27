


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

        Welcome to Zero's nthBOT, a minimalist & 'not too high' chatbot engine.

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
            
        https://aidreams.co.uk/forum/general-chatbots-and-software/my-vision-of-a-pure-chatbot-engine/
        `);
    });



    ui.b("Github", function() {

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
    output: (txt) => { ui.t(txt.trim()); }
});

bot.load(source);


bot.run();

