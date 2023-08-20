module.exports = {
	env: {
		node: true,
		es2021: true,
	},
	extends: ['@qiuxc', '@qiuxc/eslint-config/typescript'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {},
	globals: {},
	includes: ['**/*.js', '**/*.ts'],
};
