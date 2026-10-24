import express from 'express'
import { layDanhSachDichVu } from '../controllers/dichvu.controller.js'
import { authenticate,requireManager } from '../middleware/auth.middleware.js'
import { catalog,saveService,saveServiceType } from '../services/catalog.js'

const router = express.Router()

// Public - khong can dang nhap
router.get('/', layDanhSachDichVu)
router.get('/quan-ly',authenticate,requireManager,async(req,res,next)=>{try{res.json(await catalog())}catch(err){next(err)}})
router.post('/loai',authenticate,requireManager,async(req,res,next)=>{try{res.status(201).json(await saveServiceType(req.body))}catch(err){next(err)}})
router.post('/',authenticate,requireManager,async(req,res,next)=>{try{res.status(201).json(await saveService(null,req.body))}catch(err){next(err)}})
router.patch('/:id',authenticate,requireManager,async(req,res,next)=>{try{res.json(await saveService(req.params.id,req.body))}catch(err){next(err)}})

export default router
