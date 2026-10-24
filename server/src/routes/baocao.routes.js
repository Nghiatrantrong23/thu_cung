import express from 'express'
import { authenticate,requireManager } from '../middleware/auth.middleware.js'
import { revenue } from '../services/reports.js'
const router=express.Router()
router.use(authenticate,requireManager)
router.get('/doanh-thu',async(req,res,next)=>{try{res.json(await revenue(req.query.tuNgay,req.query.denNgay))}catch(err){next(err)}})
export default router
