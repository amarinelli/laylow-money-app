// Import modules
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

require('dotenv').config()
const token = process.env.TOKEN;
const channel = process.env.CHANNEL;
