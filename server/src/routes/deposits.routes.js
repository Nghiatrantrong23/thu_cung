import express from 'express'
import rateLimit from 'express-rate-limit'
import {authenticate,requireCustomerOrReception,requireReception,requireManager} from '../middleware/auth.middleware.js'
import {depositPolicy,depositDetail,createDepositIntent,depositCallback,simulateDeposit,collectDeposit,refundDeposit,decideDeposit} from '../services/deposits.js'
import {reschedule} from '../services/care.js'
const router=express.Router()
const run=fn=>async(req,res,next)=>{try{res.json(await fn(req))}catch(error){next(error)}}
router.post('/sandbox/callback',rateLimit({windowMs:60000,limit:120,legacyHeaders:false,standardHeaders:true}),run(req=>depositCallback(req.body,req.headers['x-payment-signature'])))
router.use(authenticate,requireCustomerOrReception)
router.get('/policy',run(()=>depositPolicy()))
router.get('/:id',run(req=>depositDetail(req.params.id,req.user)))
router.post('/:id/intent',run(req=>createDepositIntent(req.params.id,req.body,req.user)))
router.post('/:id/simulate',run(req=>simulateDeposit(req.params.id,req.body,req.user)))
router.post('/:id/reschedule',run(req=>reschedule(req.params.id,req.body,req.user)))
router.post('/:id/collect',requireReception,run(req=>collectDeposit(req.params.id,req.body,req.user)))
router.post('/:id/refund',requireReception,run(req=>refundDeposit(req.params.id,req.body,req.user)))
router.post('/:id/decision',requireManager,run(req=>decideDeposit(req.params.id,req.body,req.user)))
export default router
