import express from 'express'
import { authenticate,requireReception,requireCustomerOrReception } from '../middleware/auth.middleware.js'
import { createInvoice,collectPayment,invoiceList,invoiceDetail } from '../services/invoices.js'
import { invoiceTransfer } from '../services/paymentTransfers.js'
const router=express.Router()
router.use(authenticate)
router.get('/',requireCustomerOrReception,async(req,res,next)=>{try{res.json({hoaDon:await invoiceList(req.user)})}catch(err){next(err)}})
router.get('/:id',requireCustomerOrReception,async(req,res,next)=>{try{res.json(await invoiceDetail(req.params.id,req.user))}catch(err){next(err)}})
router.post('/',requireReception,async(req,res,next)=>{try{res.status(201).json(await createInvoice(req.body,req.user))}catch(err){next(err)}})
router.post('/:id/thanh-toan',requireReception,async(req,res,next)=>{try{res.json(await collectPayment(req.params.id,req.body,req.user))}catch(err){next(err)}})
router.get('/:id/qr',requireReception,async(req,res,next)=>{try{res.json(await invoiceTransfer(req.params.id,'BankQR',req.user))}catch(error){next(error)}})
export default router
