


function Bot(options) {

    this.db = [];
    this.interval = 100;
    this.output = () => {};
    this.log = () => {};
    this.selfputTimeout = 1000;
    this.import = () => {};

    Object.assign(this, options);

    this.variables = {};
    this.currentCommand = '';
    this.inputQueue = [];

    this.history = [];
}





Bot.prototype.loadStrings = function (stringList) {

    let beforeImport = stringList.map(string => {
        let parsed = null;
        try {
            parsed = ruleParser.parse(string);
        } catch(e) {}
        return { string, parsed };
    });

    let result = [];
    for (let item of beforeImport) {
        
        if (item.parsed[0].operator === "import") {
            result = result.concat(
                this.loadStrings(
                    stringParser.parse(
                        (this.import(this.outputify(item.parsed[0].line)) || '') + '\n'
                    )
                )
            );
        } else {
            result.push(item);
        }
    }

    return result;
}





Bot.prototype.load = function (source) {

    let stringParsed = stringParser.parse(source + '\n');
    this.db = this.db.concat(this.loadStrings(stringParsed));
}





Bot.prototype.run = function (interval) {

    if (interval) this.interval = interval;

    this.running = true;
    this.step();
}





Bot.prototype.resume = Bot.prototype.run;





Bot.prototype.suspend = function () {

    this.running = false;
}





Bot.prototype.input = function (i) {

    this.history.push('< '+i);
    this.inputQueue.push(i);
}





Bot.prototype.executeLine = function(input, datum) {

    this.currentCommand = datum.string.trim();

    if (datum.parsed)
        for (let rule of datum.parsed)
            this.applyOperator[rule.operator].call(this, input, rule.line, rule.timeout);
}





Bot.prototype.dbRemove = function () {

    if (this.tmp.dbAfterRemove.length)
        this.db = this.tmp.dbAfterRemove;
}





Bot.prototype.dbAdd = function () {

    if (this.tmp.addToDb.length)
        this.load('\n' + this.tmp.addToDb.join('\n'));
}





Bot.prototype.consumeOutputCandidates = function () {

    if (this.tmp.outputCandidates.length) {

        let chosen = Math.floor(Math.random() * this.tmp.outputCandidates.length);
        this.history.push('> ' + this.tmp.outputCandidates[chosen]);
        this.output(this.tmp.outputCandidates[chosen]);
    }
}





Bot.prototype.consumeSelfputCandidates = function () {
    
    if (this.tmp.selfputCandidates.length) {

        let msg = [];

        for (let item of this.tmp.selfputCandidates)
            if (!msg.includes(item)) msg.push(item);

        this.log({ event: "selfput", content: '<br>' + msg.join('<br>') });
        
        setTimeout(() => {

            this.inputQueue = this.inputQueue.concat(msg);
            this.history = this.history.concat(msg.map(m => '@ '+m));

        }, this.selfputTimeout);
    }
}




        
Bot.prototype.step = function () {

    this.tmp = {
        inhibited: false,
        addToDb: [],
        dbAfterRemove: [],
        outputCandidates: [],
        selfputCandidates: [],
        storyIterator: 0
    };
                
    while (this.inputQueue.length > 0) {

        let input = this.inputQueue.shift();

        for (let datum of this.db) this.executeLine(input, datum);

        this.dbRemove();
        this.dbAdd();
    }

    this.currentCommand = '';

    this.consumeOutputCandidates();

    this.consumeSelfputCandidates();

    if (this.running)
        setTimeout(() => { this.step(); }, this.interval);
}





Bot.prototype.outputify = function (content, showCurlies) {

    let result = '';
    
    for (let item of content) {

        if (item.type === "text")
            result += item.content;

        else if (item.type === "insertion")
            result += this.variables[this.outputify(item.content)] || '';

        else if (item.type === "capture")
            result += showCurlies ?
                '{' + (this.outputify(item.content) || '') + '}' :
                this.outputify(item.content) || '';
    }

    let parsed;
    try { parsed = mathParser.parse(result.trim()); }
    catch (e) { }

    return (parsed || result).toString();
}





Bot.prototype.escapeRegexp = function (str) {

    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}





Bot.prototype.buildRegexp = function (ruleLine, prependSharp) {

    let regexpStr = '';
    let varNames = [];

    for (let item of ruleLine)
        if (item.type === "text")

            regexpStr += this.escapeRegexp(item.content.replace(/\n/g, ''));

        else if (item.type === "insertion") {

            regexpStr += this.variables[this.outputify(item.content)] || '';

        } else { // capture

            regexpStr += "([\\s\\S]*?)";
            varNames.push(this.outputify(item.content));
        }

    if (prependSharp)
        if (!['#', '<', '~', '>', '@', '*', '/', '+', '-', '|'].includes(regexpStr[0]))
            regexpStr = "# " + regexpStr;

    regexpStr = '^\\s*' + regexpStr.trim() + '\\s*$';

    console.log(regexpStr);

    return { varNames, regexp: new RegExp(regexpStr, 'i') };
}





Bot.prototype.iterateStory = function (ruleLine) {

    let { varNames, regexp } = this.buildRegexp(ruleLine);

    while (this.tmp.storyIterator < bot.history.length) {

        let item = bot.history[this.tmp.storyIterator].trim();

        let captures = item.match(regexp);

        if (captures) {

            this.log({ event: "story pattern", content: this.outputify(ruleLine, true) });
            this.log({ event: "match", content: item });

            for (let v = 0; v < varNames.length; v++) {
                this.variables[varNames[v]] = captures[v + 1];
                this.log({ event: "variable", content: varNames[v] + " = " + captures[v + 1] });
            }
            return true;
        }
        ++this.tmp.storyIterator;
    }
    return false;
}





Bot.prototype.iterateDb = function (ruleLine, removeLast, eventName) {

    let last = -1;
    let { varNames, regexp } = this.buildRegexp(ruleLine, true);

    for (let i = 0; i < bot.db.length; i++) {

        let item = bot.db[i].string.trim();

        let captures = item.match(regexp);

        if (captures) {

            this.log({ event: eventName + " pattern", content: this.outputify(ruleLine, true) });
            this.log({ event: "match", content: item });

            for (let v = 0; v < varNames.length; v++) {
                this.variables[varNames[v]] = captures[v + 1];
                this.log({ event: "variable", content: varNames[v] + " = " + captures[v + 1] });
            }
            last = i;
        }
    }

    if (removeLast) {
        
        if (last >= 0) {

            let keep = true;

            for (let i = 0; i < bot.db.length; i++) {

                if (bot.db[i].parsed[0].operator === "delimiter") keep = true;
                if (i === last) keep = false;

                if (keep) bot.tmp.dbAfterRemove.push(bot.db[i]);
            }

        } else {

            // this.tmp.inhibited = true; // this is shit
        }
    }
    return last >= 0;
}





Bot.prototype.dataize = function (ruleLine) {

    let strLine = this.outputify(ruleLine);
    let parsed = ruleParser.parse(strLine + '\n');

    if (!parsed || parsed[0].operator === "none")
        strLine = "# " + strLine;

    return strLine;
}





Bot.prototype.applyOperator = {};





Bot.prototype.applyOperator["none"] = function (input, ruleLine) { }





Bot.prototype.applyOperator["import"] = function (input, ruleLine) { }





Bot.prototype.applyOperator["delimiter"] = function (input, ruleLine) {

    this.tmp.inhibited = false;
    this.tmp.storyIterator = 0;
}





Bot.prototype.applyOperator["input"] = function (input, ruleLine) {

    if (this.tmp.inhibited) return;

    let { varNames, regexp } = this.buildRegexp(ruleLine);

    let captures = input.trim().match(regexp);

    if (captures)
        for (let v = 0; v < varNames.length; v++) {
            this.variables[varNames[v]] = captures[v + 1];
            this.log({ event: "variable", content: varNames[v] + " = " + captures[v + 1] });
        }
    else
        this.tmp.inhibited = true;
}





Bot.prototype.applyOperator["ninput"] = function (input, ruleLine) {

    if (this.tmp.inhibited) return;

    this.applyOperator["input"].call(this, input, ruleLine);
    this.tmp.inhibited = !this.tmp.inhibited;
}





Bot.prototype.applyOperator["output"] = function (input, ruleLine) {

    if (!this.tmp.inhibited)
        this.tmp.outputCandidates.push(this.outputify(ruleLine));
}





Bot.prototype.applyOperator["selfput"] = function (input, ruleLine, timeout) {

    if (!this.tmp.inhibited) {

        if (timeout) {

            setTimeout(() => {
                let msg = bot.outputify(ruleLine);
                this.log({ event: "selfput", content: '<br>' + msg });
                bot.input(msg);
            }, timeout * 1000);

        } else {

            this.tmp.selfputCandidates.push(this.outputify(ruleLine));
        }
    }
}





Bot.prototype.applyOperator["if"] = function (input, ruleLine, eventName) {

    if (this.tmp.inhibited) return;

    let found = this.iterateDb(ruleLine, false, eventName || "if");

    if (!found) this.tmp.inhibited = true;
}





Bot.prototype.applyOperator["not"] = function (input, ruleLine) {

    if (this.tmp.inhibited) return;

    this.applyOperator["if"].call(this, input, ruleLine, "not");
    this.tmp.inhibited = !this.tmp.inhibited;
}





Bot.prototype.applyOperator["add"] = function (input, ruleLine) {

    if (!this.tmp.inhibited) {

        let data = this.dataize(ruleLine);
        this.log({ event: "add to db", content: '<br>' + data });

        this.tmp.addToDb.unshift(data);

        displayNeedRefresh();
    }
}





Bot.prototype.applyOperator["remove"] = function (input, ruleLine) {

    if (!this.tmp.inhibited) {
        
        this.iterateDb(ruleLine, true, "remove");
        displayNeedRefresh();
    }
}





Bot.prototype.applyOperator["story"] = function (input, ruleLine) {

    if (this.tmp.inhibited) return;

    let found = this.iterateStory(ruleLine);

    if (!found) this.tmp.inhibited = true;
}













