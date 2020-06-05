
import { LoadBalancerSettings, LinearWalkStrategy /*, SuccessMode */ } from '@iota/client-load-balancer';
import { Server } from 'http';
import SocketIO from 'socket.io';
import { ServiceFactory } from './factories/serviceFactory';
import { IRoute } from './models/app/IRoute';
import { init } from './routes/init';
import { message } from './socketSubscriptions/message';
import { AppHelper } from './utils/appHelper';
import { BusinessLogic } from './utils/businessLogicHelper';
import { redisStatus } from './utils/queueHelper';
  
const routes: IRoute[] = [
    { path: '/init', method: 'post', func: 'init' },
    { path: '/contract', method: 'post', func: 'contract' },
    { path: '/payment', method: 'post', func: 'payment' },
    { path: '/payment_sent', method: 'post', func: 'payment_sent' },
    { path: '/payment_confirmed', method: 'post', func: 'payment_confirmed' },
    { path: '/cancel', method: 'post', func: 'cancel' },
    { path: '/claim', method: 'post', func: 'claim' }
];

AppHelper.build(routes, async (app, config, websocketPort) => {
    const mainNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new LinearWalkStrategy(config.mainNetNodes),
        timeoutMs: 10000
    };
    ServiceFactory.register('mainnet-load-balancer-settings', () => mainNetLoadBalancerSettings);

    const devNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new LinearWalkStrategy(config.devNetNodes),
        // successMode: SuccessMode.keep,
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

    ServiceFactory.register('businessLogic', () => new BusinessLogic());

    // tslint:disable-next-line:no-unused-expression
    new BusinessLogic();
});

(async () => {
    await new Promise(resolveSleep => setTimeout(resolveSleep, 5000));
    console.log('INITIALIZING', redisStatus.connected);
    init();
})();
