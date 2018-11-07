// Import modules
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');

require('dotenv').config()
const token = process.env.TOKEN;
const channel = process.env.CHANNEL;

const app = express()
const port = 4390

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Laylow Brewery'))

app.post('/cash', function (req, res) {

    console.log("\nSlash Command\n");

    console.log(req.body);
    res.send("").status(200);

    let parseText = parseCommand(req.body.text);

    if (parseText.error) {
        postMessage(req.body.response_url, `_${parseText.error}. Please try again._`)
        throw new Error(parseText.error)
    }

    let deposit = parseText.deposit;
    let operator = parseText.operator;
    let reason = parseText.reason;

    let ts = JSON.parse(fs.readFileSync('./config.json')).ts;

    getPrevBalance(token, ts, ts, 1, 1, channel)
        .then(response => {
            console.log(response.data);

            let prevBalance = Number(response.data.messages[0].text.replace(/[^0-9]/g, '')); // Leave only digits
            let result = calcResult(deposit, operator, prevBalance);

            let summaryText = `<@${req.body.user_id}> ${operator}ed \`$${deposit}\`.  The reason was: _${reason}_`;

            postMessage(req.body.response_url, summaryText, "in_channel")
                .then(response => {
                    console.log(response.data);
                    let newBalanceText = `The current balance is: *$${result}*`;

                    postMessage(req.body.response_url, newBalanceText, "in_channel")
                        .then(response => {
                            console.log(response.data);
                        })
                        .catch(error => {
                            console.log(error.response.data);
                        });
                })
                .catch(error => {
                    console.log(error.response.data);
                });
        })
        .catch(error => {
            console.log(error.response.data);
        });
})

let getPrevBalance = (token, latest, oldest, inclusive, limit, channel) => {

    console.log("\nConversations History\n");

    return axios.post("https://slack.com/api/conversations.history", querystring.stringify({
        latest: latest,
        oldest: oldest,
        inclusive: inclusive,
        limit: limit,
        channel: channel
    }), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json; charset=utf-8"
            }
        })
}

let parseCommand = (commandText) => {

    let valueList;
    if (commandText.includes(" ")) {

        // Split the commandText only at the first space
        valueList = [commandText.substr(0, commandText.indexOf(" ")), commandText.substr(commandText.indexOf(" ") + 1)];
    } else {
        valueList = [commandText];
    }

    let depositText = valueList[0];
    let deposit = depositText.replace(/[^0-9]/g, ''); // Leave only digits

    if (deposit === "") {
        return {
            error: "The input did not start with a number"
        }
    }

    let operator;
    if (depositText.includes("-")) {
        operator = "subtract";

    } else {
        operator = "add";
    }

    // Handle no reason provided which means one array element
    let reason;

    if (valueList.length == 1) {
        reason = "(None provided)"
    } else {
        reason = valueList[1];
    }

    return {
        deposit: Number(deposit),
        operator: operator,
        reason: reason
    }
}

let calcResult = (deposit, operator, prevBalance) => {

    if (operator == "add") {
        return prevBalance + deposit
    } else {
        return prevBalance - deposit
    }
}

let postMessage = (responseUrl, text, response_type) => {

    console.log("\nPost Message\n");

    return axios.post(responseUrl, {
        channel: channel,
        text: text,
        response_type: response_type
    }, {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        })
}

let postEphemeral = (text, user, as_user) => {

    console.log("\nPost Ephemeral\n");

    axios.post("https://slack.com/api/chat.postEphemeral", {
        channel: channel,
        text: text,
        user: user,
        as_user: as_user
    }, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${token}`,
            }
        })
        .then(response => {
            console.log(response.data);
        })
}

app.listen(port, () => console.log(`Listening on port ${port}!`));