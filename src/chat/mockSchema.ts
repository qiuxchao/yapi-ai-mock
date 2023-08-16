// Below is the definition used to generate mock code based on JSON Schema.

// Please strictly follow the examples in MockResponse to generate expected results.

export interface MockResponse {
	// key: The corresponding key in the input JSON object
	// value: The mock code corresponding to the key
	// example:
	// 	input: {"1384":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"itemCategoryId":{"type":"number","description":"商品类目 ID"},"itemCateGoryName":{"type":"string","description":"商品类目名称"}}}}}},"36310":{"type":"object","properties":{"code":{"type":"integer","description":"状态码:200成功，其他为失败"},"message":{"type":"string","description":"消息文案:成功为success，其他为失败原因"},"data":{"type":"object","properties":{"list":{"type":"array","items":{"type":"object","properties":{"nickname":{"type":"string","description":"用户昵称"},"avatar":{"type":"string","description":"头像"},"orderNum":{"type":"integer","description":"跟团人次"},"fansNum":{"type":"integer","description":"成员"},"id":{"type":"string","description":"三方用户表的ID"},"categoryNameList":{"type":"array","items":{"type":"string"},"description":"类目名称列表"}}},"description":"列表"},"endPage":{"type":"boolean","description":"是否为最后一页"}},"description":"成功返回结果"}}},"42448":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"list":{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer"},"activityId":{"type":"string","description":"呱呱团id"},"avatar":{"type":"string","description":"团长头像"},"nickname":{"type":"string","description":"团长昵称"},"activityTitle":{"type":"string","description":"团购活动标题"},"activityPic":{"type":"string","description":"团购图"},"maxPrice":{"type":"integer","description":"团购最高价 单位:分","default":"0"},"minPrice":{"type":"integer","description":"团购最低价 单位:分","default":"0"},"activityCreatedTime":{"type":"string","description":"活动创建时间","mock":{"mock":"@datetime"}}}}},"endPage":{"type":"boolean"},"totalCount":{"type":"integer","description":"结果总条目数"},"currentPage":{"type":"integer","description":"当前页"}}}}}}
	// 	output: {"1384":{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]},"36310":{"code":200,"message":"success","data":{"list|10-20":[{"nickname":"@cname","avatar":"@image(200x200)","orderNum|1-100":1,"fansNum|1-100":1,"id":"@guid","categoryNameList|1-5":["@ctitle(2, 5)"]}],"endPage":true}},"42448":{"code":200,"message":"success","data":{"list|10-20":[{"id|1-100":1,"activityId":"@guid","avatar":"@image(200x200)","nickname":"@cname","activityTitle":"@ctitle(2, 5)","activityPic":"@image(200x200)","maxPrice|1-100":1,"minPrice|1-100":1,"activityCreatedTime":"@datetime"}],"endPage":true,"totalCount|1-100":1,"currentPage":1}}}
	[key: number]: ResponseBodyType;
}

export interface ResponseBodyType {
	// response code (default: 200)
	code?: 200 | '200';
	// response message (default: success)
	message?: 'success';
	// response message data (default: null)
	// If it has currentPage field, its value is 1
	// If there is a field related to the name of the person in the data, it will be simulated as a Chinese name
	data: any;
}
