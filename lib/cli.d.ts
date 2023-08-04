import { b as ConfigWithHooks } from './types-b64475b8.js';
import 'path';
import 'vtils/types';

declare function ytm(config: ConfigWithHooks): Promise<void>;
declare function run(cmd: string | undefined, options?: {
    configFile?: string;
}): Promise<void>;

export { ytm as default, run };
