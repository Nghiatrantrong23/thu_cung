import express from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, requireCustomerOrReception } from '../middleware/auth.middleware.js'
import { sandboxEnabled, createIntent, readIntent, settleCallback, simulatePayment } from '../services/paymentSandbox.js'
const router=express.Router()
const handler=fn=>async(req,res,next)=>{try{res.json(await fn(req))}catch(error){next(error)}}
router.post('/sandbox/callback',rateLimit({windowMs:60000,limit:120,standardHeaders:true,legacyHeaders:false,message:{error:'Quá nhiều callback. Vui lòng thử lại sau.'}}),handler(req=>settleCallback(req.body,req.headers['x-payment-signature'])))
router.use(authenticate,requireCustomerOrReception)
router.get('/config',handler(async()=>({mode:await sandboxEnabled()?'sandbox':'unconfigured',methods:['BankQR','MoMo','COD']})))
router.post('/invoices/:id',handler(req=>createIntent(req.params.id,req.body,req.user)))
router.get('/intents/:id',handler(req=>readIntent(req.params.id,req.user)))
router.post('/intents/:id/simulate',handler(req=>simulatePayment(req.params.id,req.body?.result,req.user)))
export default router
