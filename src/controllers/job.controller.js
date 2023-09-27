const {Op} = require('sequelize');
const {Router} = require('express');
const {DEFAULT_LIMIT} = require('../constants');

async function findUnpaidJobs(req, res) {
    const {Job, Contract} = req.app.get('models');
    const profile = req.profile;

    const unpaidJobs = await Job.findAll({
        where: {
            paid: false,
        },
        include: {
            model: Contract,
            attributes: [],
            where: {
                status: 'in_progress',
                [Op.or]: [
                    {ContractorId: profile.id},
                    {ClientId: profile.id},
                ],
            },
        },
        limit: DEFAULT_LIMIT,
    });

    return res.json(unpaidJobs);
}

async function payJob(req, res) {
    const sequelize = req.app.get('sequelize');
    const {Job, Contract, Profile} = req.app.get('models');
    const {jobId} = req.params;
    const profile = req.profile;

    const transaction = await sequelize.transaction();

    try {
        const job = await Job.findOne(
            {
                where: {
                    id: jobId,
                },
                include: [{
                    model: Contract,
                    where: {
                        ClientId: profile.id,
                    },
                    include: [
                        {model: Profile, as: 'Contractor'},
                        {model: Profile, as: 'Client'}
                    ],
                }],
                transaction,
            },
        );
        if (!job) {
            return res.status(404).end();
        }
        if (job.paid) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Job is paid' });
        }

        const contract = job.Contract;
        const contractor = contract.Contractor;
        const client = contract.Client;

        if (client.balance < job.price) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        client.balance -= job.price;
        contractor.balance += job.price;
        job.paid = true;
        job.paymentDate = new Date();

        await Promise.all([
            client.save({transaction}),
            contractor.save({transaction}),
            job.save({transaction}),
        ]);

        await transaction.commit();

        return res.status(200).json({success: true});
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({message: err.message});
    }
}

module.exports.getRouter = function getRouter() {
    const router = Router();
    router.get('/unpaid', findUnpaidJobs);
    router.post('/:jobId/pay', payJob);
    return router;
}