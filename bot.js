


function Bot(options) {

    this.db = [];
    this.interval = 100;
    this.output = (txt) => { document.body.innerHTML += txt + "<br>"; };
    this.log = (data) => { console.log(data); };
    this.selfputTimeout = 1000;

    Object.assign(this, options);

    this.inputQueue = [];
    this.state = {
        variables: {},
        addToDb: [],
        dbAfterRemove: [],
        outputCandidates: [],
        selfputCandidates: []
    };
}





Bot.prototype.load = function (source) {

    let stringParsed = stringParser.parse(source + '\n');
    this.db = this.db.concat(stringParsed);
}





Bot.prototype.run = function (interval) {

    if (interval) this.interval = interval;

    this.running = true;
    this.step();
}





Bot.prototype.suspend = function () {

    this.running = false;
}





Bot.prototype.input = function (i) {

    this.inputQueue.push(i);
}





Bot.prototype.step = function () {

    while (this.inputQueue.length > 0) {

        let input = this.inputQueue.shift();

        for (let datum of this.db) {

            let parsed;
            try { parsed = ruleParser.parse(datum.trim() + '\n'); }
            catch (e) { }

            if (parsed)
                for (let rule of parsed)
                    this.applyOperator[rule.operator].call(this, input, rule.line, rule.timeout);
        }
        if (this.state.dbAfterRemove.length) {
            this.db = this.state.dbAfterRemove;
            this.state.dbAfterRemove = [];
        }
        if (this.state.addToDb.length) {
            this.load('\n' + this.state.addToDb.join('\n'));
            this.state.addToDb = [];
        }
    }

    if (this.state.outputCandidates.length) {

        let chosen = Math.floor(Math.random() * this.state.outputCandidates.length);
        this.output(this.state.outputCandidates[chosen]);

        this.state.outputCandidates = [];
    }

    if (this.state.selfputCandidates.length) {

        let msg = [];
        for (let item of this.state.selfputCandidates)
            if (!msg.includes(item)) msg.push(item);
        this.log({ event: "selfput", content: '<br>' + msg.join('<br>') });
        setTimeout(() => { this.inputQueue = this.inputQueue.concat(msg); }, this.selfputTimeout);

        this.state.selfputCandidates = [];
    }

    if (this.running)
        setTimeout(() => { this.step(); }, this.interval);
}





Bot.prototype.outputify = function (content, showCurlies) {

    let result = '';

    for (let item of content) {

        if (item.type === "text")
            result += item.content;

        if (item.type === "insertion")
            result += this.state.variables[this.outputify(item.content)] || '';

        if (item.type === "capture")
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





Bot.prototype.buildRegexp = function (ruleLine, appendSharp) {

    let regexpStr = '';
    let varNames = [];

    for (let item of ruleLine)
        if (item.type === "text")

            regexpStr += this.escapeRegexp(item.content.replace(/\n/g, ''));

        else if (item.type === "insertion") {

            regexpStr += this.state.variables[this.outputify(item.content)] || '';

        } else { // capture

            regexpStr += "([\\s\\S]*?)";
            varNames.push(this.outputify(item.content));
        }

    if (appendSharp)
        if (!['#', '<', '>', '@', '*', '/', '+', '-'].includes(regexpStr[0]))
            regexpStr = "# " + regexpStr;

    regexpStr = '^' + regexpStr + '$';

    return { varNames, regexp: new RegExp(regexpStr, 'i') };
}





Bot.prototype.iterateDb = function (ruleLine, removeLast, eventName) {

    let last = -1;
    let { varNames, regexp } = this.buildRegexp(ruleLine, true);

    for (let i = 0; i < bot.db.length; i++) {

        let item = bot.db[i];

        let captures = item.trim().match(regexp);

        if (captures) {

            this.log({ event: eventName + " pattern", content: this.outputify(ruleLine, true) });
            this.log({ event: "match", content: item });

            for (let v = 0; v < varNames.length; v++) {
                this.state.variables[varNames[v]] = captures[v + 1];
                this.log({ event: "variable", content: varNames[v] + " = " + captures[v + 1] });
            }
            last = i;
        }
    }

    if (removeLast && last >= 0) {

        let keep = true;

        for (let i = 0; i < bot.db.length; i++) {

            if (ruleParser.parse(bot.db[i])[0].operator === "delimiter") keep = true;
            if (i === last) keep = false;

            if (keep) bot.state.dbAfterRemove.push(bot.db[i]);
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





Bot.prototype.applyOperator["delimiter"] = function (input, ruleLine) {

    this.state.inhibited = false;
}





Bot.prototype.applyOperator["input"] = function (input, ruleLine) {

    let { varNames, regexp } = this.buildRegexp(ruleLine);

    let captures = input.trim().match(regexp);

    if (captures)
        for (let v = 0; v < varNames.length; v++) {
            this.state.variables[varNames[v]] = captures[v + 1];
            this.log({ event: "variable", content: varNames[v] + " = " + captures[v + 1] });
        }
    else
        this.state.inhibited = true;
}





Bot.prototype.applyOperator["output"] = function (input, ruleLine) {

    if (!this.state.inhibited)
        this.state.outputCandidates.push(this.outputify(ruleLine));
}





Bot.prototype.applyOperator["selfput"] = function (input, ruleLine, timeout) {

    if (!this.state.inhibited) {

        if (timeout) {

            setTimeout(() => {
                let msg = bot.outputify(ruleLine);
                this.log({ event: "selfput", content: '<br>' + msg.join('<br>') });
                bot.input(msg);
            }, timeout * 1000);

        } else {

            this.state.selfputCandidates.push(this.outputify(ruleLine));
        }
    }
}





Bot.prototype.applyOperator["if"] = function (input, ruleLine, eventName) {

    if (this.state.inhibited) return;

    let found = this.iterateDb(ruleLine, false, eventName || "if");

    if (!found) this.state.inhibited = true;
}





Bot.prototype.applyOperator["not"] = function (input, ruleLine) {

    if (this.state.inhibited) return;

    this.applyOperator["if"].call(this, input, ruleLine, "not");
    this.state.inhibited = !this.state.inhibited;
}





Bot.prototype.applyOperator["add"] = function (input, ruleLine) {

    if (!this.state.inhibited) {

        let data = this.dataize(ruleLine);
        this.log({ event: "add to db", content: '<br>' + data });

        this.state.addToDb.unshift(data);

        displayNeedRefresh();
    }
}





Bot.prototype.applyOperator["remove"] = function (input, ruleLine) {

    if (!this.state.inhibited) {
        
        this.iterateDb(ruleLine, true, "remove");
        displayNeedRefresh();
    }
}













