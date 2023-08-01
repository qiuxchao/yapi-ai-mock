import { b as ConfigWithHooks } from './types-12d5a0e6.js';
import 'vtils/types';

declare function ytm(config: ConfigWithHooks): Promise<void>;
declare function run(cmd: string | undefined, options?: {
    configFile?: string;
}): Promise<void>;

export { ytm as default, run };
