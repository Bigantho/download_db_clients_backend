import express from 'express'
import {createServer} from "node:http";

class Server {
    constructor() {

        this.app = express();
        this.server = createServer(this.app);
        this.port = "3000"
        this.host = "localhost"
        this.middlewares();
        
    }

    start() {
        this.server.listen(this.port, this.host, () => {
            console.log(`https://${this.host}:${this.port}`);
        })
    }

    middlewares(){
        // this.app.use(cors(corsConfig))
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))
    }
}

export default new Server()