// Below is the definition used to generate mock code based on JSON Schema.

/**
 * Mock Response is an object, its key is the id of the interface, and the value is the mock result of the interface.
 *
 * user request example 1:
 * {"38932":{"type":"object","properties":{"code":{"type":"number"},"message":{"type":"string"},"data":{"type":"string"}}},"38938":{"type":"object","properties":{"code":{"type":"number"},"message":{"type":"string"},"data":{"type":"string"}}}}
 *
 * system output example 1:
 * {\n\t"38932": {\n\t\t"code": 200,\n\t\t"message": "success",\n\t\t"data": "@string"\n\t},\n\t"38938": {\n\t\t"code": 200,\n\t\t"message": "success",\n\t\t"data": "@string"\n\t}\n}
 *
 * user request example 2:
 * {"42334":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"list":{"type":"array","items":{"type":"object","properties":{"activityId":{"type":"string","description":"活动id"},"avatar":{"type":"string","description":"头像"},"nickname":{"type":"string","description":"昵称"},"cooperated":{"type":"boolean","description":"是否合作"},"activityTitle":{"type":"string","description":"活动标题"},"maxPrice":{"type":"integer","description":"最高价单位:分"}}}},"endPage":{"type":"boolean"},"totalCount":{"type":"integer","description":"结果总条目数"},"currentPage":{"type":"integer","description":"当前页"}}}}}}
 *
 * system output example 2:
 * {\n\t"42334": {\n\t\t"code": 200,\n\t\t"message": "success",\n\t\t"data": {\n\t\t\t"list|10-20": [{\n\t\t\t\t"activityId": "@guid",\n\t\t\t\t"avatar": "@image(200x200)",\n\t\t\t\t"nickname": "@cname",\n\t\t\t\t"cooperated": "@boolean",\n\t\t\t\t"activityTitle": "@ctitle(2, 5)",\n\t\t\t\t"maxPrice|1-100": 1\n\t\t\t}],\n\t\t\t"endPage": true,\n\t\t\t"totalCount|1-100": 1,\n\t\t\t"currentPage": 1\n\t\t}\n\t}\n}
 */
export interface MockResponse {
	// key: The corresponding key in the object entered by the user.
	// value: The mock code corresponding to the key.
	[key: number]: ResponseBodyType;
}

/**
 * ResponseBodyType is the mock code corresponding to the key in MockResponse object.
 */
type ResponseBodyType = any;
