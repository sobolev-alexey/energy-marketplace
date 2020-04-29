
import { LoadBalancerSettings, RandomWalkStrategy } from '@iota/client-load-balancer';
import { ServiceFactory } from './factories/serviceFactory';
import { IRoute } from './models/app/IRoute';
import { init } from './routes/init';
import { AppHelper } from './utils/appHelper';

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
});

init();
