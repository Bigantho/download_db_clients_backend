// import axios from "axios"
import { Op } from "sequelize"
import twilio from "twilio"
import { users, messages_sent, executed_queries } from "../models/index.mjs"
import axios from "axios"
import restricted_phones from "../models/restricted_phones.mjs"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
export default class mainController {
    static async index(req, res) {
        const body = req.body
        try {
            // console.log(body);
            // let recordMsgToSave = {
            //     id_user: 4,
            //     message: "El Salvador",
            //     phone_to: "78985547898",
            //     phone_from: "89658965896",
            //     delivered: 1

            // }
            // await mainController.saveMessage(recordMsgToSave, false)

            return res.status(200).json({ msg: "Mensaje enviado con exito." })
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })
        }
    }

    static async sendSMS(req, res) {
        const data = req.body
        try {
            const accountSid = '';
            const authToken = '';
            const client = twilio(accountSid, authToken);
            // Se envia dos veces el parametro para que forme un array y no de problemas el metodo de verificacion.
            let filterNumbers = await mainController.checkExistMsg([data.phone_to, data.phone_to])
            if (filterNumbers.length == 0) {
                return res.status(400).json({ mgs: "No hay ningun número nuevo al cual enviar mensajes." })
            }
            const msg = await client.messages
                .create({
                    body: data.message,
                    from: data.phone_from,
                    to: data.phone_to
                })

            // Se quitan los caracteres especiales de la cadena de texto: ñ y tildes
            const msgFormatted = await mainController.removeExpecialCaracters(data.message)

            let recordMsgToSave = {
                id_user: req.userId,
                message: msgFormatted,
                phone_to: data.phone_to,
                phone_from: data.phone_from,
                delivered: true
            }
            const recordMsg = await mainController.saveMessage(recordMsgToSave, false, false, false)

            return res.status(200).json({ message: "Message sent successfully.", recordMsg })
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", errMsg: error })
        }
    }

    static async sendBulkSMS(req, res) {

        const data = req.body

        // Se quitan los caracteres especiales de la cadena de texto: ñ y tildes
        const msgFormatted = await mainController.removeExpecialCaracters(data.message)

        try {
            const phoneNumbers = data.phone_numbers

            let numbersRestricted = await mainController.checkIsRestrictedNumber(phoneNumbers)

            if (numbersRestricted.length >= 1) {
                return res.status(400).json({ mgs: "Existen números restringidos.", numbers: numbersRestricted })
            }


            let filterNumbers = await mainController.checkExistMsg(phoneNumbers)
            if (filterNumbers.length == 0) {
                return res.status(400).json({ mgs: "No hay ningun número nuevo al cual enviar mensajes." })
            }

            let totalMessages = {
                success: 0,
                error: 0,
                total: 0
            }
            let phoneNumbersSuccess = []
            let phoneNumbersError = []
            const accountSid = '';
            const authToken = '';
            const client = twilio(accountSid, authToken);

            for (const number of filterNumbers) {
                try {
                    const message = await client.messages.create({
                        body: `${msgFormatted}`,
                        from: data.phone_from, // Your Twilio number
                        to: number
                    });
                    totalMessages.success++
                    phoneNumbersSuccess.push(number)
                } catch (error) {
                    totalMessages.error++
                    phoneNumbersError.push(number)
                }
                // Add a delay of 1 second (1000 ms) between messages to avoid hitting rate limits
                totalMessages.total++
            }

            mainController.saveMessage({
                id_user: req.userId,
                message: msgFormatted,
                totalMessages,
                phone_from: data.phone_from,
                phoneNumbersSuccess,
                phoneNumbersError
            }, true, false, false)


            return res.status(200).json({ ...totalMessages, phone_numbers_success: phoneNumbersSuccess, phone_numbers_error: phoneNumbersError })
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })

        }
    }

    static async saveUser(req, res) {
        const dataUser = req.body
        try {
            const userSaved = await users.create(dataUser)
            return res.status(200).json(userSaved)
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })
        }
    }

    static async saveMessage(data, isBulk, isCustomMsg = false, isCallBack = false) {
        try {
            // If it is not bulksave, just one record
            if (!isBulk) {
                const msgSaved = await messages_sent.create({ ...data, is_callback: isCallBack })
                return msgSaved
            } else if (isBulk && isCustomMsg == false) {
                //Si son varios mensajes, pero no es un mensaje personalizado
                let totalMessages = []
                data.phoneNumbersSuccess.map((e) => {
                    totalMessages.push({
                        id_user: data.id_user,
                        message: data.message,
                        phone_to: e,
                        phone_from: data.phone_from,
                        is_callback: false,
                        delivered: true
                    })
                })
                data.phoneNumbersError.map((f) => {
                    totalMessages.push({
                        id_user: data.id_user,
                        message: data.message,
                        phone_to: f,
                        phone_from: data.phone_from,
                        is_callback: false,
                        delivered: false
                    })
                })
                const msgSaved = await messages_sent.bulkCreate(totalMessages)
                return msgSaved
            } else {
                //Si son varios mensajes, pero es un mensaje personalizado
                let totalMessages = []
                data.phoneNumbersSuccess.map((e) => {
                    totalMessages.push({
                        id_user: data.id_user,
                        message: e.message,
                        phone_to: e.phone_number,
                        phone_from: data.phone_from,
                        is_callback: false,
                        delivered: true
                    })
                })
                data.phoneNumbersError.map((f) => {
                    totalMessages.push({
                        id_user: data.id_user,
                        message: f.message,
                        phone_to: f.phone_number,
                        phone_from: data.phone_from,
                        is_callback: false,
                        delivered: false
                    })
                })
                const msgSaved = await messages_sent.bulkCreate(totalMessages)
                return msgSaved;
            }
        } catch (error) {

            return error

        }
    }

    static async getTotalClientsCRM(req, res) {
        const paramsObj = req.query

        try {
            const resAPI = await axios.get('https://contact-center-api.red5g.com/api/third-party-access/customers', {
                params: { ...paramsObj, api_token: process.env.CRM_TOKEN }
            }).then(response => {
                const clients = response.data.data
                let filterData = clients.map(client => ({
                    address: [client.address.city, client.address.state, client.address.zip].join(' '),
                    fullName: client.fullname,
                    cellPhone: client.cell_phone.replace('+', ''),
                    lastActivity: client.latest_activity.activity_type_name,
                    lastActivityDate: client.latest_activity.created_at,
                    email: client.email
                }))

                let filterDataDuplicated = filterData.filter((item, index, self) => index === self.findIndex((t) => t.cellPhone === item.cellPhone))
                return filterDataDuplicated;

            }).catch(error => {
                return error
            });

            let { ...queryToBitacora } = paramsObj


            delete queryToBitacora.api_token
            delete queryToBitacora.page
            delete queryToBitacora.per_page
            delete queryToBitacora.sort
            delete queryToBitacora.has_order
            delete queryToBitacora.supplier_id
            delete queryToBitacora.activity_type_id
            delete queryToBitacora.log_suppliers
            delete queryToBitacora.log_statuses

            queryToBitacora = { ...queryToBitacora, tiene_orden: paramsObj.has_order == 'true' ? "Sí" : "No", companias: paramsObj.log_suppliers, estados_seguimiento: paramsObj.log_statuses }

            if (Object.keys(queryToBitacora).length != 0) {
                await mainController.saveBitacoraQueries(queryToBitacora, req.userId)
            }


            return res.status(200).json(resAPI)

        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })
        }
    }

    static async getTotalSMS(req, res) {
        const { startDate, endDate } = req.query

        try {
            let filter = {}
            if (startDate != null && endDate != null) {
                filter = {
                    where: {
                        created_at: {
                            [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
                        }
                    }
                }
            }

            const data = await messages_sent.findAll({ include: { model: users }, ...filter, order: [['created_at', 'DESC']] })

            const dataFormatted = data.map((e) => ({
                sender: [e.User.name.charAt(0).toUpperCase() + e.User.name.slice(1), e.User.last_name.charAt(0).toUpperCase() + e.User.last_name.slice(1)].join(" "),
                message: e.message,
                phoneTo: e.phone_to,
                phoneFrom: e.phone_from,
                isCallback: e.is_callback ? "Sí" : "No",
                delivered: e.delivered ? "Sí" : "No",
                dateCreated: e.created_at,
                dateUpdated: e.updated_at
            }))
            return res.status(200).json(dataFormatted)
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })

        }
    }

    static async sendBulkSMSCustomize(req, res) {
        const data = req.body
        try {
            const messages = data.messages

            const phoneNumbers = messages.map(e => e.phone_number)

            let filterNumbers = await mainController.checkExistMsg(phoneNumbers)
            if (filterNumbers.length == 0) {
                return res.status(400).json({ mgs: "No hay ningun número nuevo al cual enviar mensajes." })
            }

            let totalMessages = {
                success: 0,
                error: 0,
                total: 0
            }
            let phoneNumbersSuccess = []
            let phoneNumbersError = []
            const accountSid = '';
            const authToken = '';
            const client = twilio(accountSid, authToken);

            for (const message of messages) {
                // Se quitan los caracteres especiales de la cadena de texto: ñ y tildes
                let msgFormatted = await mainController.removeExpecialCaracters(message.message)
                try {
                    let resMsg = await client.messages.create({
                        body: msgFormatted,
                        from: data.phone_from, // Your Twilio number
                        to: message.phone_number
                    });
                    // 
                    totalMessages.success++
                    phoneNumbersSuccess.push({ phone_number: message.phone_number, message: msgFormatted })
                } catch (error) {
                    totalMessages.error++
                    phoneNumbersError.push({ phone_number: message.phone_number, message: msgFormatted })
                }
                // Add a delay of 1 second (1000 ms) between messages to avoid hitting rate limits
                // await new Promise(resolve => setTimeout(resolve, 1000));
                totalMessages.total++
            }


            mainController.saveMessage({
                id_user: req.userId,
                // message: msgToSend,
                totalMessages,
                phone_from: data.phone_from,
                phoneNumbersSuccess,
                phoneNumbersError
            }, true, true, false)
            return res.status(200).json({ ...totalMessages, phone_numbers_success: phoneNumbersSuccess, phone_numbers_error: phoneNumbersError })
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })

        }
    }

    static async SMSCallBack(req, res) {

        const body = req.body
        const words = [
            "stop",
            "no gracias",
            "alto",
            "detente",
            "no me interesa",
            "spam",
            "cancelled",
            "cancelar",
            "detener",
            "unsubscribe",
            "block",
            "bloquear",
            "desuscribirse",
            "discontinue",
            "disable",
            "salir"
        ]
        let shouldBeRestricted = false

        let regex = ""
        for (let i = 0; i < words.length; i++) {
            regex = new RegExp(`\\b${words[i]}\\b`, 'i');
            if (regex.test(body.Body)) {
                shouldBeRestricted = true
                break;
            } else {
                shouldBeRestricted = false
            }
        }

        try {
            let recordMsgToSave = {
                id_user: req.userId,
                message: body.Body,
                phone_to: body.To,
                phone_from: body.From,
                delivered: 1
            }
            console.log("rec 1",recordMsgToSave);
            
            let isCallBack = true
            const msg = await mainController.saveMessage(recordMsgToSave, false, false, isCallBack)
            if (shouldBeRestricted) {
                await mainController.saveRestrictedNumbers(recordMsgToSave)
            }
            return res.status(200).json({ msg: "Mensaje guardado con exito.", body: msg })
        } catch (error) {
            return res.status(500).json({ msg: "Algo salio mal, contacte soporte tecnico.", error })
        }
    }

    static async saveRestrictedNumbers(data) {

        let recorToSave = {
            phone: data.phone_from,
            blocked_at: new Date(),
            message_received: data.message,
            active: true,
        }
        console.log("rec 2",recorToSave);

        const record = await restricted_phones.create(recorToSave)
    }

    static async checkIsRestrictedNumber(arrayPhoneNumbers) {
        try {

            let restrictedNumbersDB = await restricted_phones.findAll({
                where: {
                    active: 1
                }
            });
            let restrictedNumbers = []
            restrictedNumbersDB.map((e) => {
                restrictedNumbers.push(e.phone)
            })
            restrictedNumbers = await mainController.changeToNumberType(restrictedNumbers)
            arrayPhoneNumbers = await mainController.changeToNumberType(arrayPhoneNumbers)

            // Crear un conjunto combinado con todos los valores únicos
            const allValues = new Set([...restrictedNumbers, ...arrayPhoneNumbers]);

            // Filtrar los valores que están en ambos
            const differentValues = [...allValues].filter(
                value => (restrictedNumbers.includes(value) && arrayPhoneNumbers.includes(value))
            );

            return differentValues
        } catch (error) {
            console.log(error);
            return res.status(500).json(error)
        }
    }

    static async showRestrictedNumbers(req, res) {
        try {
            const numbersRestricted = await restricted_phones.findAll()

            return res.status(200).json(numbersRestricted)
        } catch (error) {
            return res.status(500).json({
                msg: "Mensajes restringidos",
                error
            })

        }
    }

    static async changeToNumberType(arrayNumbers) {
        return [...arrayNumbers].map(valor => Number(valor))
    }

    static async login(req, res) {
        const { user, password } = req.body

        try {
            const userRecord = await users.findOne({ where: { user } })

            if (!userRecord) {
                return res.status(400).json({ error: "Authentication failed" })
            }

            const passwordMatch = await bcrypt.compare(password, userRecord.password)

            if (!passwordMatch) {
                return res.status(400).json({ error: "Authentication failed" })
            }

            const token = jwt.sign({ userId: userRecord.id }, process.env.SECRET_KEY, {
                expiresIn: process.env.TOKEN_TIME
            })

            return res.status(200).json({
                msg: "Login Success",
                data: {
                    token: token
                }
            })
        } catch (error) {
            return res.status(500).json({
                msg: "Algo salio mal",
                error
            })
        }
    }

    static async register(req, res) {

        const { user, password, name, last_name } = req.body
        try {
            const hashedPassword = await bcrypt.hash(password, 10)

            const userRecord = await users.create({
                name,
                last_name,
                user,
                password: hashedPassword,
                active: true

            })

            return res.status(200).json({
                msg: "Login Success",
                data: {
                    id: userRecord.id,
                    name: [userRecord.name, userRecord.last_name].join(" "),
                    user: userRecord.user

                }
            })
        } catch (error) {
            return res.status(500).json({
                msg: "Algo salio mal, contacte soporte tecnico.",
                error: error
            })
        }
    }

    static async saveBitacoraQueries(data, idUser) {

        const recordQuery = await executed_queries.create({
            query: JSON.stringify(data),
            id_user: idUser
        })
        return recordQuery
    }

    static async getBitacoraQueries(req, res) {
        const bitacoraQueries = await executed_queries.findAll({
            include: {
                model: users,
                attributes: ['name', 'last_name']
            }
        })

        const bitacoraQueriesFormatted = bitacoraQueries.map((e) => {
            return {
                id: e.id,
                query: JSON.parse(e.query),
                user: [e.User.name.charAt(0).toUpperCase() + e.User.name.slice(1), e.User.last_name.charAt(0).toUpperCase() + e.User.last_name.slice(1)].join(" "),
                created_at: e.created_at,
                updated_at: e.updated_at
            }
        })

        return res.status(200).json(bitacoraQueriesFormatted)
    }

    static async checkExistMsg(phoneNumbers) {
        try {
            let currentPhoneNumbers = (await messages_sent.findAll({
                attributes: ['phone_to']
            })).map(f => f.phone_to.replace('+', ''))            
            
            let parsedPhoneNumbers = await mainController.changeToStringType(phoneNumbers)
            
            const newPhoneNumbers = parsedPhoneNumbers.map(e => e.replace('+', ''))

            // Junta ambos arreglos y mantiene solo los que sean unicos 
            const allPhoneNumbers = new Set([...currentPhoneNumbers, ...newPhoneNumbers])

            // Verifica que numeros son iguales en ambos arreglos
            const samePhoneNumbers = [...allPhoneNumbers].filter(phone => (currentPhoneNumbers.includes(phone)) && (newPhoneNumbers.includes(phone)))
            
            // Remueve del arreglo de numeros a enviar aquellos numeros que ya existan
            const newPhoneNumbresPure = [...newPhoneNumbers].filter(phone => !samePhoneNumbers.includes(phone))
            
            return newPhoneNumbresPure

        } catch (error) {
            console.log(error);

        }
    }

    static async changeToStringType(arrayNumbers) {
        return [...arrayNumbers].map(valor => String(valor))
    }

    static async removeExpecialCaracters(textToErase) {
        return textToErase.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n").replace(/Ñ/g, "N");;

    }
}