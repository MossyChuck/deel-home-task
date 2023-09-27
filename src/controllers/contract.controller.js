const {Op} = require('sequelize');
const {Router} = require('express');

async function findContractById(req, res) {
    const {Contract} = req.app.get('models');
    const {id} = req.params;
    const profile = req.profile;

    const contract = await Contract.findOne({
        where: {
            id,
            [Op.or]: [
                {ContractorId: profile.id},
                {ClientId: profile.id},
            ],
        },
    });

    if (!contract) {
        return res.status(404).end();
    }
    res.json(contract);
}

async function findContracts(req, res) {
    const {Contract} = req.app.get('models');
    const profile = req.profile;

    const contracts = await Contract.findAll({
        where: {
            status: {
                [Op.ne]: 'terminated',
            },
            [Op.or]: [
                {ContractorId: profile.id},
                {ClientId: profile.id},
            ],
        },
    });

    res.json(contracts);
}

module.exports.getRouter = function getRouter() {
    const router = Router();
    router.get('/', findContracts);
    router.get('/:id', findContractById);
    return router;
}
