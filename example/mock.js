import Mock from 'mockjs';

const data = Mock.mock({
	code: 200,
	message: 'success',
	'data|10-20': [{ 'itemCategoryId|1-100': 1, itemCateGoryName: '@ctitle(2, 5)' }],
});

console.log(data);
