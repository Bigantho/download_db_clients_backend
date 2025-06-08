import jwt from "jsonwebtoken"


export const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization')
    const url = req.route.path    
    try {

        // Verifica el API_TOKEN para dejar que Twilio guarde los mensajes
        if (url == '/message/sms/callback' && authHeader == null) {


            const token = req.query.api_token
          
            if (token) {
                const API_TOKEN = process.env.API_TOKEN_CALL_BACK                
                if (token == API_TOKEN) {
                    req.userId = '7' // Se deja este por defecto que es el administrador Anthony Vasquez, para no crear un usuario Twilio
                    return next()
                } else {
                    return res.status(401).json({ date: new Date(), error: 'Access denied' })
                }
            }
        }

        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied' })
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.userId = decoded.userId
        next()
    } catch (error) {
        if (error.name == "TokenExpiredError") {
            res.status(401).json({
                msg: "Session expirada",
                error
            })
        } else {
            res.status(401).json({
                msg: "Algo salio mal, contacte soporte tecnico.",
                error
            })
        }
    }
}