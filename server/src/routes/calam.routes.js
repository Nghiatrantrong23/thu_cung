import express from 'express'
import { authenticate, requireManager, requireAppointmentReader } from '../middleware/auth.middleware.js'
import { listShifts, caregivers, saveShift } from '../services/shifts.js'
const router=express.Router()
router.use(authenticate)
router.get('/nhan-vien',requireManager,async(req,res,next)=>{try{res.json({nhanVien:await caregivers()})}catch(err){next(err)}})
router.get('/',requireAppointmentReader,async(req,res,next)=>{try{
    if(req.user.role==='KhachHang') return res.status(403).json({error:'Chỉ nhân sự được xem ca làm.'})
    res.json({caLam:await listShifts(req.query.ngay,req.user)})
}catch(err){next(err)}})
router.post('/',requireManager,async(req,res,next)=>{try{res.status(201).json(await saveShift(null,req.body))}catch(err){next(err)}})
router.patch('/:id',requireManager,async(req,res,next)=>{try{res.json(await saveShift(req.params.id,req.body))}catch(err){next(err)}})
router.post('/:id/huy',requireManager,async(req,res,next)=>{try{res.json(await saveShift(req.params.id,req.body,true))}catch(err){next(err)}})
export default router
