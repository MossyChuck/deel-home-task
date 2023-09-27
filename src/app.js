const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const app = express();
const { setupRoutes } = require('./controllers');
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

setupRoutes(app);

module.exports = app;
