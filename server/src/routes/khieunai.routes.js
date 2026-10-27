import express from 'express'
import { authenticate,requireRole,requireReception,requireManager,requireCustomerOrReception } from '../middleware/auth.middleware.js'
import { createComplaint,decideComplaint,executeRefund,complaintList } from '../services/complaints.js'
const router=express.Router()
router.use(authenticate)
router.get('/',requireCustomerOrReception,async(req,res,next)=>{try{res.json({khieuNai:await complaintList(req.user)})}catch(err){next(err)}})
router.get('/:id',requireCustomerOrReception,async(req,res,next)=>{try{const rows=await complaintList(req.user,req.params.id);if(!rows.length)return res.status(404).json({error:'Không tìm thấy khiếu nại.'});res.json({khieuNai:rows[0]})}catch(err){next(err)}})
router.post('/',requireReception,async(req,res,next)=>{try{res.status(201).json(await createComplaint(req.body,req.user))}catch(err){next(err)}})
router.post('/cua-toi',requireRole('KhachHang'),async(req,res,next)=>{try{
    const {maLichHen,noiDung}=req.body??{}
    res.status(201).json(await createComplaint({maLichHen,noiDung},req.user,{customer:true}))
}catch(err){next(err)}})
router.patch('/:id/quyet-dinh',requireManager,async(req,res,next)=>{try{res.json(await decideComplaint(req.params.id,req.body,req.user))}catch(err){next(err)}})
router.post('/:id/chi-hoan',requireReception,async(req,res,next)=>{try{res.json(await executeRefund(req.params.id,req.body,req.user))}catch(err){next(err)}})
export default router
