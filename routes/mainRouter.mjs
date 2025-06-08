import mainController from '../controllers/mainController.mjs'
import { Router } from "express"
import Call from "../utils/Call.mjs"
import { verifyToken } from "../utils/middleware/authMiddleware.mjs"
const router = Router()

router.post('/test', mainController.index)
router.get('/crm/client/total', verifyToken, mainController.getTotalClientsCRM)
router.get('/message/sms/total', verifyToken, mainController.getTotalSMS)
router.get('/phones/restricted', verifyToken, mainController.showRestrictedNumbers)
router.get('/query/executed', verifyToken, mainController.getBitacoraQueries)

router.post('/message/sms/callback', verifyToken, mainController.SMSCallBack)
router.post('/message/sms/send', verifyToken, mainController.sendSMS)
router.post('/message/sms/send_bulk/customize', verifyToken, mainController.sendBulkSMSCustomize)
router.post('/message/sms/send_bulk', verifyToken, mainController.sendBulkSMS)

// router.post('/message/sms/call_back', mainController.callBackSMS)
router.post('/user/save', verifyToken, mainController.saveUser)
router.post('/auth/login', mainController.login)
router.post('/auth/register', verifyToken, mainController.register)
export default router