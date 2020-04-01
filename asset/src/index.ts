
import { LoadBalancerSettings, RandomWalkStrategy } from "@iota/client-load-balancer";
import { Server } from "http";
import SocketIO from "socket.io";
import { ServiceFactory } from "./factories/serviceFactory";
import { IRoute } from "./models/app/IRoute";
import { message } from "./socketSubscriptions/message";
import { AppHelper } from "./utils/appHelper";

const routes: IRoute[] = [
    { path: "/init", method: "get", func: "init" },
    { path: "/v0/publish", method: "post", folder: "v0", func: "publish" },
    { path: "/v0/fetch", method: "post", folder: "v0", func: "fetch" }
];

AppHelper.build(routes, async (app, config, websocketPort) => {
    const mainNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new RandomWalkStrategy(config.mainNetNodes)
    };

    ServiceFactory.register("mainnet-load-balancer-settings", () => mainNetLoadBalancerSettings);

    const devNetLoadBalancerSettings: LoadBalancerSettings = {
        nodeWalkStrategy: new RandomWalkStrategy(config.devNetNodes)
    };

    ServiceFactory.register("devnet-load-balancer-settings", () => devNetLoadBalancerSettings);

    const server = new Server(app);
    const socketServer = SocketIO(server);
    server.listen(websocketPort);
    socketServer.on("connection", socket => {
        console.log("marketplace connected");
        // socket.on("subscribe", data => socket.emit("subscribe", transactionsSubscribe(config, socket)));
        socket.on("message", message);
        socket.on("disconnect", () => console.log("marketplace disconnected"));
    });
});
