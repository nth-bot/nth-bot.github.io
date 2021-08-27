


function Bot(options) {

    this.db = [];
    this.interval = 100;
    this.output = (txt) => { document.body.innerHTML += txt + "<br>"; };
    this.selfputTimeout = 1000;

    Object.assign(this, options);

    this.inputQueue = [];
    this.state = {
        variables: {},
        addToDb: []
    };
}





Bot.prototype.load = function(source) {

    let stringParsed = stringParser.parse(source);

    this.db = this.db.concat(stringParsed);
}





Bot.prototype.run = function(interval) {

    this.runningLoop = setInterval(() => { this.step(); }, interval || this.interval);
}





Bot.prototype.suspend = function() {

    clearInterval(this.runningLoop);
}





Bot.prototype.input = function(i) {

    this.inputQueue.push(i);
}





Bot.prototype.step = function() {

    while (this.inputQueue.length > 0) {

        let input = this.inputQueue.shift();

        for (let datum of this.db) {

            let parsed;
            try { parsed = ruleParser.parse(datum); }
            catch(e) {}

            if (parsed) {

                for (let rule of parsed) {

                    // console.log("[input]", input);
                    // console.log("[rule]", rule);

                    this.applyOperator[rule.operator](input, rule.line, this);

                    // console.log("[state]", this.state);
                }
            }
        }
        this.db = this.state.addToDb.concat(this.db);
        this.state.addToDb = [];
    }
    // console.log("[state]", this.state);
}





Bot.prototype.outputify = function(content) {

    let result = '';

    for (let item of content) {

        if (item.type === "text") result += item.content;

        if (item.type === "insertion") result += this.state.variables[this.outputify(item.content)] || '';
    }

    return result;
}





Bot.prototype.applyOperator = {};





Bot.prototype.applyOperator["none"] = function(input, ruleLine, bot) {}





Bot.prototype.applyOperator["delimiter"] = function(input, ruleLine, bot) {

    bot.state.inhibited = false;
}





Bot.prototype.applyOperator["input"] = function(input, ruleLine, bot) {

    let regexpStr = '^';
    let varNames = [];

    for (let item of ruleLine)
        if (item.type === "text")
        
            regexpStr += item.content.replace(/\n/g, ''); // TODO enhance handling of whitespaces/newlines

        else {
            
            regexpStr += "(.*?)";
            varNames.push(bot.outputify(item.content));
        }

    regexpStr += '$';

    let regexp = new RegExp(regexpStr);

    let captures = input.trim().match(regexp);

    // console.log("[INPUT]", input);
    // console.log("[CAPTURES]", captures);

    if (captures) {

        for (let v = 0; v < varNames.length; v++)
            bot.state.variables[varNames[v]] = captures[v + 1];

    } else {

        bot.state.inhibited = true;
    }
}





Bot.prototype.applyOperator["output"] = function(input, ruleLine, bot) {

    if (!bot.state.inhibited) {

        bot.output(bot.outputify(ruleLine));
    }
}





Bot.prototype.applyOperator["selfput"] = function(input, ruleLine, bot) {

    if (!bot.state.inhibited) {
        
        setTimeout(() => {

            bot.input(bot.outputify(ruleLine));

        }, bot.selfputTimeout);
    }
}





Bot.prototype.applyOperator["if"] = function(input, ruleLine, bot) {

    if (bot.state.inhibited) return;

    for (let item of bot.db) {

        bot.state.inhibited = false;
        bot.applyOperator.input(item, ruleLine, bot);

        if (!bot.state.inhibited) return;
    }
}





Bot.prototype.applyOperator["not"] = function(input, ruleLine, bot) {

    bot.applyOperator["if"](input, ruleLine, bot);
    bot.state.inhibited = !bot.state.inhibited;
}





Bot.prototype.applyOperator["add"] = function(input, ruleLine, bot) {

    if (!bot.state.inhibited) {
        
        bot.state.addToDb.unshift(bot.outputify(ruleLine));
    }
}





Bot.prototype.applyOperator["remove"] = function(input, ruleLine, bot) {

    if (!bot.state.inhibited) {

        let newDb = [];
                
        for (let item of bot.db) {

            bot.state.inhibited = false;
            bot.applyOperator.input(item, ruleLine, bot);

            if (bot.state.inhibited) newDb.push(item);
        }
        bot.db = newDb;
        bot.state.inhibited = false;
    }
}



















