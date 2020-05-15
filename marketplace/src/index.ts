
import { LoadBalancerSettings, LinearWalkStrategy, SuccessMode } from '@iota/client-load-balancer';
import { ServiceFactory } from './factories/serviceFactory';
import { IRoute } from './models/app/IRoute';
import { init } from './routes/init';
import { AppHelper } from './utils/appHelper';

const routes: IRoute[] = [
    { path: '/register', method: 'post', func: 'register' },
    { path: '/request', method: 'post', func: 'offerOrRequest' },
    { path: '/offer', method: 'post', func: 'offerOrRequest' },
    { path: '/match', method: 'post', func: 'match' },
    { path: '/provision', method: 'post', func: 'provision' }
];

AppHelper.build(routes, async (app, config, websocketPort) => {
    const mainNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new LinearWalkStrategy(config.mainNetNodes),
        successMode: SuccessMode.keep,
        timeoutMs: 10000
    };
    ServiceFactory.register('mainnet-load-balancer-settings', () => mainNetLoadBalancerSettings);

    const devNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new LinearWalkStrategy(config.devNetNodes),
        // successMode: SuccessMode.keep,
        timeoutMs: 10000
    };
    ServiceFactory.register('devnet-load-balancer-settings', () => devNetLoadBalancerSettings);
});

init();
