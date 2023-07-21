import Mock from 'mockjs';

const data = Mock.mock(
	JSON.parse(
		'{"thirdItemDetail":{"itemId|1-100":1,"rank|1-100":1,"type|1-1":1,"goodsName":"@ctitle(5, 10)","goodsCover":"@image(\\"200x200\\", \\"#ccc\\", \\"#fff\\", \\"goodsCover\\")","goodsDesc":"@cparagraph(1, 3)","materialUrls":["@image(\\"800x800\\", \\"#ccc\\", \\"#fff\\", \\"materialUrl\\")"],"marketPrice|100-1000":100,"salePrice|100-1000":100,"maxPrice|100-1000":100,"minPrice|100-1000":100,"soldNum|100-1000":100,"activityCreatedTime":"@datetime","estimatedSales|100-1000":100,"skuList|1-5":[{"skuName":"@ctitle(2, 5)","salePrice|100-1000":100,"picUrl":"@image(\\"200x200\\", \\"#ccc\\", \\"#fff\\", \\"picUrl\\")","stock|1-100":1}],"skuJson":"@string(10, 20)","propertyList":[{"name":"@ctitle(2, 5)","value":"@ctitle(2, 5)"}],"platformType":"@pick([\'zhzg\', \'jbj\'])","collection|1-1":true}}'
	)
);

console.log(data);
