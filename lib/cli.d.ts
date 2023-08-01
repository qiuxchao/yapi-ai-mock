import { b as ConfigWithHooks } from './types-5d5ddce2.js';
import 'vtils/types';

declare function ytm(config: ConfigWithHooks): Promise<void>;
declare function run(cmd: string | undefined, options?: {
    configFile?: string;
}): Promise<void>;

export { ytm as default, run };
