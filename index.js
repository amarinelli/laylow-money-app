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
                "Accept": "application/json"
            }
        })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => {
            console.log(error.response.data)
        });
})

app.listen(port, () => console.log(`Listening on port ${port}!`))