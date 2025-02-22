import Bull from 'bull';
import { INodeConfiguration } from './INodeConfiguration';

/**
 * Definition of configuration file.
 */
export interface IConfiguration {
    /**
     * The providers to use for IOTA communication on mainnet.
     */
    mainNetNodes: INodeConfiguration[];

    /**
     * The providers to use for IOTA communication on devnet.
     */
    devNetNodes: INodeConfiguration[];

    /**
     * The providers to use for IOTA communication on comnet.
     */
    comNetNodes: INodeConfiguration[];

    /**
     * A list of domains allowed to access the api.
     */
    allowedDomains: string[];

    // Function name
    func: string;

    /**
     * A list of queues.
     */
    queues?: {
        [key: string]: Bull.Queue<any>;
    };
}
