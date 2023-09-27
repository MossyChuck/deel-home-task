const adminController = require('./admin.controller');
const balanceController = require('./balance.controller');
const contractController = require('./contract.controller');
const jobController = require('./job.controller');
const {getProfile} = require('../middleware/getProfile');

module.exports.setupRoutes = function setup(app) {
    app.use(getProfile);

    const adminRouter = adminController.getRouter();
    const balanceRouter = balanceController.getRouter();
    const contractRouter = contractController.getRouter();
    const jobRouter = jobController.getRouter();

    app.use('/admin', adminRouter);
    app.use('/balances', balanceRouter);
    app.use('/contracts', contractRouter);
    app.use('/jobs', jobRouter);
    return app;
}