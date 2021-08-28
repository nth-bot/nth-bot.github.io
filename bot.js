


function Bot(options) {

    this.db = [];
    this.interval = 100;
    this.output = (txt) => { document.body.innerHTML += txt + "<br>"; };
    this.selfputTimeout = 1000;

    Object.assign(this, options);

    this.inputQueue = [];
    this.state = {
        variables: {},
        addToDb: [],
        dbAfterRemove: [],
        outputCandidates: []
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
            try { parsed = ruleParser.parse(datum.trim()); }
            catch(e) {}

            if (parsed) {

                for (let rule of parsed) {

                    this.applyOperator[rule.operator](input, rule.line, this);
                }
            }
        }
        if (this.state.dbAfterRemove.length) {
            this.db = this.state.dbAfterRemove;
            this.state.dbAfterRemove = [];
        }
        this.db = this.state.addToDb.concat(this.db);
        this.state.addToDb = [];
    }

    if (this.state.outputCandidates.length) {
        
        let chosen = Math.floor(Math.random() * this.state.outputCandidates.length);
        this.output(this.state.outputCandidates[chosen]);

        this.state.outputCandidates = [];
    }
}





Bot.prototype.outputify = function(content) {

    let result = '';

    for (let item of content) {

        if (item.type === "text") result += item.content;

        if (item.type === "insertion") result += this.state.variables[this.outputify(item.content)] || '';
    }

    return result;
}





Bot.prototype.buildRegexp = function(ruleLine) {

    let regexpStr = '^';
    let varNames = [];

    for (let item of ruleLine)
        if (item.type === "text")
        
            regexpStr += item.content.replace(/\n/g, '');
            
        else {
            
            regexpStr += "(.*?)";
            varNames.push(bot.outputify(item.content));
        }

    regexpStr += '$';

    return { varNames, regexp: new RegExp(regexpStr, 'i') };
}





Bot.prototype.applyOperator = {};





Bot.prototype.applyOperator["none"] = function(input, ruleLine, bot) {}





Bot.prototype.applyOperator["delimiter"] = function(input, ruleLine, bot) {

    bot.state.inhibited = false;
}





Bot.prototype.applyOperator["input"] = function(input, ruleLine, bot) {

    let { varNames, regexp } = bot.buildRegexp(ruleLine);

    let captures = input.trim().match(regexp);

    if (captures) {

        for (let v = 0; v < varNames.length; v++)
            bot.state.variables[varNames[v]] = captures[v + 1];

    } else {

        bot.state.inhibited = true;
    }
}





Bot.prototype.applyOperator["output"] = function(input, ruleLine, bot) {

    if (!bot.state.inhibited) {

        bot.state.outputCandidates.push(bot.outputify(ruleLine));
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

    if (bot.state.inhibited) return;

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

        let thingToRemove = [];
        let text = '';

        for (let item of ruleLine) {
            if (item.type === "text") text += item.content;
            if (item.type === "insertion") text += bot.state.variables[bot.outputify(item.content)] || '';
            if (item.type === "capture") {
                thingToRemove.push({ type: "text", content: text });
                thingToRemove.push(item);
                text = '';
            }
        }
        if (text.length) thingToRemove.push({ type: "text", content: text });

        let { varNames, regexp } = bot.buildRegexp(thingToRemove);

        console.log(thingToRemove);
        console.log(regexp);
        
        for (let item of bot.db) {

            let captures = item.trim().match(regexp);

            if (captures) {

                for (let v = 0; v < varNames.length; v++)
                bot.state.variables[varNames[v]] = captures[v + 1];
    
            } else {

                bot.state.dbAfterRemove.push(item);
            }
        }
    }
}



















