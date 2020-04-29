import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application } from 'express';
import isEmpty from 'lodash/isEmpty';
import { serverPortNumber, websocketPortNumber } from '../config.json';
import { IDataResponse } from '../models/api/IDataResponse';
import { IRoute } from '../models/app/IRoute';
import { IConfiguration } from '../models/configuration/IConfiguration';
// import { EncryptionService, IKeys, IMessagePayload, IReceivedMessagePayload } from './encryptionHelper';

/**
 * Class to help with expressjs routing.
 */
export class AppHelper {
    /**
     * Build the application from the routes and the configuration.
     * @param routes The routes to build the application with.
     * @param onComplete Callback called when app is successfully built.
     * @param customListener If true uses a custom listener otherwise listens for you during build process.
     * @returns The express js application.
     */
    public static build(
        routes: IRoute[],
        onComplete?: (app: Application, config: IConfiguration, websocketPort: number) => void,
        customListener?: boolean): Application {
        // tslint:disable:no-var-requires no-require-imports
        const packageJson = require('../../package.json');
        const configId = process.env.CONFIG_ID || 'local';
        // tslint:disable-next-line:non-literal-require
        const config: IConfiguration = require(`../data/config.${configId}.json`);

        const app: Application = express();

        app.use(bodyParser.json({ limit: '10mb' }));
        app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
        app.use(bodyParser.json());

        app.use(cors({
            origin: config.allowedDomains && config.allowedDomains.length > 0 ? config.allowedDomains : '*',
            methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: 'content-type'
        }));

        routes.unshift(
            {
                path: '/',
                method: 'get',
                inline: async () => ({ name: packageJson.name, version: packageJson.version })
            });

        // app.use('/docs', express.static(path.resolve(__dirname , '../', 'docs')));

        AppHelper.buildRoutes(config, app, routes);

        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : serverPortNumber;
        const websocketPort = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : websocketPortNumber;
        if (!customListener) {
            app.listen(port, async err => {
                if (err) {
                    throw err;
                }

                console.log(`Started Asset module on port ${port} v${packageJson.version}`);
                console.log(`Running Config '${configId}'`);

                if (onComplete) {
                    onComplete(app, config, websocketPort);
                }
            });
        } else {
            if (onComplete) {
                onComplete(app, config, websocketPort);
            }
        }

        // try {
        //     console.log('Encryption');
        //     const encryptionService = new EncryptionService();
        //     const aliceKeys: IKeys = encryptionService.generateKeys();
        //     const bobKeys: IKeys = encryptionService.generateKeys();
            // const messageJSON: any = {
            //     name: 'Alice',
            //     messageTo: 'Bob',
            //     messageText: 'Hey, Bob!'
            // };

            // // Alice signs her message
            // const signature: Buffer = encryptionService.signMessage(
            //     aliceKeys?.privateKey, messageJSON
            // );
            // // console.log(222, signature);

            // // Alice encrypts payload with Bobs public key
            // const payload: IMessagePayload = { message: messageJSON, signature };
            // console.log(333, payload);

            // const encrypted: string = encryptionService.publicEncrypt(
            //     bobKeys?.publicKey, JSON.stringify(payload)
            // );
            // // console.log(444, encrypted);

            // // Bob decrypts message with his private key
            // const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
            //     bobKeys?.privateKey, encrypted
            // );
            // console.log(555, decrypted.message);

            // // Bob verifies Alice signature
            // const verificationResult: boolean = encryptionService.verifySignature(
            //     aliceKeys?.publicKey, decrypted?.message, decrypted?.signature
            // );
        // } catch (error) {
        //     throw new Error(error);
        // }

        return app;
    }

    /**
     * Build routes and connect them to express js.
     * @param config The configuration.
     * @param app The expressjs app.
     * @param routes The routes.
     */
    public static buildRoutes(config: IConfiguration, app: Application, routes: IRoute[]): void {
        for (let i = 0; i < routes.length; i++) {
            app[routes[i].method](routes[i].path, async (req, res) => {
                let response;
                const start = Date.now();
                try {
                    let params = { ...req.params, ...req.query };
                    let body;
                    if (routes[i].dataBody) {
                        body = req.body;
                    } else {
                        let bodyContent = req.body;
                        if (isEmpty(req.body)) {
                            bodyContent = JSON.parse(Object.keys(req.body)?.[0] || null);
                        }
                        params = { ...params, ...req.query, ...bodyContent };
                    }

                    const filteredParams = AppHelper.logParams(params);

                    console.log(`===> ${routes[i].method.toUpperCase()} ${routes[i].path}`, filteredParams);
                    if (routes[i].func) {
                        let modulePath = '../routes/';
                        if (routes[i].folder) {
                            modulePath += `${routes[i].folder}/`;
                        }
                        modulePath += routes[i].func;
                        // tslint:disable-next-line:non-literal-require
                        const mod = require(modulePath);
                        response = await mod[routes[i].func](config, params, body);
                    } else if (routes[i].inline) {
                        response = await routes[i].inline(config, params, body);
                    }
                } catch (err) {
                    res.status(err.httpCode || 400);
                    response = { success: false, message: err.message };
                }
                console.log(`<=== duration: ${Date.now() - start}ms`);
                console.log(response);
                if (routes[i].dataResponse) {
                    const dataResponse = <IDataResponse>response;
                    res.setHeader('Content-Type', dataResponse.contentType);
                    if (dataResponse.filename) {
                        res.setHeader('Content-Disposition', `attachment; filename='${dataResponse.filename}'`);
                    }
                    res.send(dataResponse.data);
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(response));
                }
                res.end();
            });
        }
    }

    /**
     * Convert the params to logable
     * @param obj The object to convert.
     * @returns The converted object.
     */
    private static logParams(obj: { [id: string]: any }): { [id: string]: any } {
        const newobj = {};
        for (const key in obj) {
            if (key.indexOf('pass') >= 0) {
                newobj[key] = '*************';
            } else if (key.indexOf('base64') >= 0) {
                newobj[key] = '<base64>';
            } else {
                if (obj[key].constructor.name === 'Object') {
                    newobj[key] = this.logParams(obj[key]);
                } else if (obj[key].constructor.name === 'Array') {
                    newobj[key] = obj[key].map(o => this.logParams(o));
                } else {
                    newobj[key] = obj[key];
                }
            }
        }
        return newobj;
    }
}
