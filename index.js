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

app.post('/deposit', function (req, res) {
    console.log(req.body);
    res.send("").status(200);

    let parseText = parseCommand(req.body.text);

    let deposit = parseText.deposit;
    let operator = parseText.operator;
    let reason = parseText.reason;

    // Find the current balance from the Slack channel
    let ts = JSON.parse(fs.readFileSync('./config.json')).ts;

    axios.post("https://slack.com/api/conversations.history", querystring.stringify({
        latest: ts,
        oldest: ts,
        inclusive: 1,
        limit: 1,
        channel: channel
    }), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json; charset=utf-8"
            }
        })
        .then(response => {
            console.log(response.data);

            let prevBalance = Number(response.data.messages[0].text.replace(/[^0-9]/g, '')); // Leave only digits
            let result = calcResult(deposit, operator, prevBalance);

            let summaryText = `<@${req.body.user_id}> ${operator}ed \`$${deposit}\`.  The reason was: _${reason}_`;
            postMessage(req.body.response_url, summaryText);

            let newBalanceText = `The current balance is: *$${result}*`
            let message = postMessage(req.body.response_url, newBalanceText);

            console.log(message);

        })
        .catch(error => {
            console.log(error.response.data);
        });
})

let parseCommand = (commandText) => {

    let valueList;
    if (commandText.includes(" ")) {

        // Split the commandText only at the first space
        valueList = [commandText.substr(0, commandText.indexOf(" ")), commandText.substr(commandText.indexOf(" ") + 1)];
    } else {
        valueList = [commandText];
    }

    let depositText = valueList[0];

    // Handle no reason provided which means one array element
    let reason;

    if (valueList.length == 1) {
        reason = "(None provided)"
    } else {
        reason = valueList[1];
    }
    let deposit = depositText.replace(/[^0-9]/g, ''); // Leave only digits 

    let operator;
    if (depositText.includes("-")) {
        operator = "subtract";

    } else {
        operator = "add";
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

let postMessage = (responseUrl, text) => {

    axios.post(responseUrl, {
        channel: channel,
        text: text
    }, {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        })
        .then(response => {
            console.log(response.data);
            return response.data
        })
        .catch(error => {
            console.log(error.response);
        });
}

app.listen(port, () => console.log(`Listening on port ${port}!`));