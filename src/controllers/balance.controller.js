const {Router} = require('express');
const {MAX_DEPOSIT_AMOUNT_COEFFICIENT} = require('../constants');

async function deposit(req, res) {
    const sequelize = req.app.get('sequelize');
    const {Job, Contract, Profile} = req.app.get('models');

    const profile = req.profile;
    const userId = parseInt(req.params.userId);
    const {amount} = req.body;

    if (profile.id !== userId) {
        return res.status(401).json({message: 'Trying to deposit to another user'})
    }
    if (profile.type !== 'client') {
        return res.status(400).json({message: 'Only clients can deposit money'})
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({message: 'Invalid deposit amount'})
    }

    const transaction = await sequelize.transaction();

    try {
        const totalUnpaidJobs = await Job.sum('price', {
            where: {
                paid: false,
            },
            include: {
                model: Contract,
                attributes: [],
                where: {
                    ClientId: profile.id,
                    status: 'in_progress'
                },
            },
            transaction,
        });

        if (totalUnpaidJobs * MAX_DEPOSIT_AMOUNT_COEFFICIENT < amount) {
            await transaction.rollback();
            return res.status(400).json({message: 'Invalid deposit amount'})
        }

        await Profile.increment({
            balance: amount,
        }, {
            where: {
                id: profile.id,
            },
            transaction,
        });


        await transaction.commit();

        return res.status(200).json({success: true});
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({message: err.message});
    }
}

module.exports.getRouter = function getRouter() {
    const router = Router();
    router.post('/deposit/:userId', deposit);
    return router;
}