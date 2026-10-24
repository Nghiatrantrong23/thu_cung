import express from 'express'
import { authenticate,requireReception,requireCustomerOrReception } from '../middleware/auth.middleware.js'
import { createInvoice,collectPayment,invoiceList,invoiceDetail } from '../services/invoices.js'
const router=express.Router()
router.use(authenticate)
router.get('/',requireCustomerOrReception,async(req,res,next)=>{try{res.json({hoaDon:await invoiceList(req.user)})}catch(err){next(err)}})
router.get('/:id',requireCustomerOrReception,async(req,res,next)=>{try{res.json(await invoiceDetail(req.params.id,req.user))}catch(err){next(err)}})
router.post('/',requireReception,async(req,res,next)=>{try{res.status(201).json(await createInvoice(req.body,req.user))}catch(err){next(err)}})
router.post('/:id/thanh-toan',requireReception,async(req,res,next)=>{try{res.json(await collectPayment(req.params.id,req.body,req.user))}catch(err){next(err)}})
router.get('/:id/qr',requireReception,(req,res)=>res.status(503).json({error:'Chưa cấu hình ngân hàng nhận tiền. Bạn có thể ghi nhận chuyển khoản đã nhận và nhập mã tham chiếu.',code:'QR_NOT_CONFIGURED'}))
export default router
