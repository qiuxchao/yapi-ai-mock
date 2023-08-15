// Below is the definition used to generate mock code based on JSON Schema.

export interface MockResponse {
	// key: The corresponding key in the input JSON object
	// value: The mock code corresponding to the key
	// example:
	// 	input: {"1384":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"itemCategoryId":{"type":"number","description":"商品类目 ID"},"itemCateGoryName":{"type":"string","description":"商品类目名称"}}}}}}}
	// 	result: {"1384":{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]}}
	[key: number]: ResponseBodyType;
}

export interface ResponseBodyType {
	// response code (default: 200)
	code: number;
	// response message (default: 'success')
	message: string;
	// response message data (default: null)
	// If it has currentPage field, its value is 1
	// If there is a field related to the name of the person in the data, it will be simulated as a Chinese name
	data: any;
}
