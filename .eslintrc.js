module.exports = {
	extends: ['@qiuxc', '@qiuxc/eslint-config/typescript'],
	env: {
		// 你的环境变量（包含多个预定义的全局变量）
		browser: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		// 自定义你的规则
	},
};
