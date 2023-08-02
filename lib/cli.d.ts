import { b as ConfigWithHooks } from './types-c9dc7ebf.js';
import 'vtils/types';

declare function ytm(config: ConfigWithHooks): Promise<void>;
declare function run(cmd: string | undefined, options?: {
    configFile?: string;
}): Promise<void>;

export { ytm as default, run };
