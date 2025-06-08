import server from "./config/server.mjs"


import express from "express"
import * as http2 from "node:http2"
import mainRouter from './routes/mainRouter.mjs'
import cors from 'cors'
export default class Main {
    constructor(){
        this.server = server
        this.server.start()

        this.server.app.set('views', './views')
        this.server.app.set('view engine', 'ejs')
        this.server.app.use(express.static('public')) 
        this.server.app.use(express.json())
        this.server.app.use(cors())
        this.routes()
    }

    routes(){
        this.server.app.use('/api/v1', mainRouter )
        // this.server.app.use()
        this.server.app.all('*', (req, res) => {
            const errorMsg = 'Resource route not found'
            res.status(http2.constants.HTTP_STATUS_NOT_FOUND).json({'message': errorMsg})

            console.log();
            
        })
    }
}

