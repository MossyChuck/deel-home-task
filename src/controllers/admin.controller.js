const {Op, Sequelize} = require('sequelize');
const {Router} = require('express');

async function findBestProfession(req, res) {
    const sequelize = req.app.get('sequelize');
    const {Job, Contract, Profile} = req.app.get('models');

    const start = req.query.start ? new Date(req.query.start) : new Date(0);
    const end = req.query.end ? new Date(req.query.end) : new Date();

    const professionInfo = await Job.findOne({
        group: 'Contract.Contractor.profession',
        attributes: [
            [sequelize.col('Contract.Contractor.profession'), 'profession'],
            [sequelize.fn('SUM', sequelize.col('price')), 'totalAmount']
        ],
        where: {
            paid: true,
            paymentDate: {
                [Op.between]: [start, end],
            }
        },
        include: {
            model: Contract,
            attributes: [],
            include: {
                attributes: ['profession'],
                model: Profile,
                as: 'Contractor',
                where: {
                    type: 'contractor'
                }
            }
        },
        order: sequelize.literal('totalAmount DESC'),
        raw: true,
    });

    return res.json({profession: professionInfo.profession});
}

async function findBestClients(req, res) {
    const sequelize = req.app.get('sequelize');
    const {Job, Contract, Profile} = req.app.get('models');

    const start = req.query.start ? new Date(req.query.start) : new Date(0);
    const end = req.query.end ? new Date(req.query.end) : new Date();
    const limit = req.query.limit || 2; // todo: move to constants

    const bestClients = await Job.findAll({
        group: 'Contract.Client.id',
        attributes: [
            [sequelize.col('Contract.Client.id'), 'clientId'],
            [sequelize.col('Contract.Client.firstName'), 'firstName'],
            [sequelize.col('Contract.Client.lastName'), 'lastName'],
            [sequelize.fn('SUM', sequelize.col('price')), 'totalPaid']
        ],
        where: {
            paid: true,
            paymentDate: {
                [Op.between]: [start, end],
            }
        },
        include: {
            attributes: [],
            model: Contract,
            include: {
                attributes: [],
                model: Profile,
                as: 'Client',
                where: {
                    type: 'client'
                }
            }
        },
        order: sequelize.literal('totalPaid DESC'),
        raw: true,
        limit,
    });

    res.json({clients: bestClients});
}

module.exports.getRouter = function getRouter() {
    const router = Router();
    router.get('/best-profession', findBestProfession);
    router.get('/best-clients', findBestClients);
    return router;
}

