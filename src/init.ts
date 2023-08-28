import consola from 'consola';
import * as fs from 'fs-extra';
import path from 'path';

/**
 * 初始化配置文件
 * @param cwd 执行命令的目录
 * @param target 要生成的配置文件类型
 */
export default function init(cwd: string, target: 'ts' | 'js' = 'ts') {
	const configPath = path.resolve(cwd, `yam.config.${target}`);
	if (fs.existsSync(configPath)) {
		consola.warn(`配置文件已存在: ${configPath}`);
		return;
	}
	const templatePath = path.resolve(__dirname, `./assets/config.template`);
	fs.copyFileSync(templatePath, configPath);
	consola.success(`配置文件已生成: ${configPath}`);
}
