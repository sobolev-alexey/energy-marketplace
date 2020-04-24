
import { LoadBalancerSettings, RandomWalkStrategy } from '@iota/client-load-balancer';
import { Server } from 'http';
import SocketIO from 'socket.io';
import configFile from './config.json';
import { ServiceFactory } from './factories/serviceFactory';
import { IRoute } from './models/app/IRoute';
import { message } from './socketSubscriptions/message';
import { AppHelper } from './utils/appHelper';
import { publish } from './utils/mamHelper';

const routes: IRoute[] = [
    { path: '/init', method: 'get', func: 'init' },
    { path: '/v0/publish', method: 'post', folder: 'v0', func: 'publish' },
    { path: '/v0/fetch', method: 'post', folder: 'v0', func: 'fetch' }
];

AppHelper.build(routes, async (app, config, websocketPort) => {
    const mainNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new RandomWalkStrategy(config.mainNetNodes),
        timeoutMs: 10000
    };
    ServiceFactory.register('mainnet-load-balancer-settings', () => mainNetLoadBalancerSettings);

    const devNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new RandomWalkStrategy(config.devNetNodes),
        timeoutMs: 10000
    };
    ServiceFactory.register('devnet-load-balancer-settings', () => devNetLoadBalancerSettings);

    const server = new Server(app);
    const socketServer = SocketIO(server);
    server.listen(websocketPort);
    socketServer.on('connection', socket => {
        console.log('marketplace connected');
        // socket.on('subscribe', data => socket.emit('subscribe', transactionsSubscribe(config, socket)));
        socket.on('message', message);
        socket.on('disconnect', () => console.log('marketplace disconnected'));
    });

    // const alldata = await readAllData('mam');
    // console.log('alldata', alldata);
    // const mam = await publish('22-33', { ...configFile, param: 2 } );
    // console.log('mam', mam);

    await publish('111-222-333', configFile);
});
