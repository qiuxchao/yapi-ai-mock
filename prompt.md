⚠️：gpt 3.5 最多支持输入 2048 个字符

```json
{
	"messages": [
		{
			"role": "system",
			"content": "You are a MockJS expert."
		},
		{
			"role": "user",
			"content": "{\"/item/category/list\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"itemCategoryId\":{\"type\":\"number\",\"description\":\"商品类目 ID\"},\"itemCateGoryName\":{\"type\":\"string\",\"description\":\"商品类目名称\"}},\"required\":[\"itemCategoryId\",\"itemCateGoryName\"]}}}"
		},
		{
			"role": "assistant",
			"content": "{\"itemCategoryList\":{\"data|10-20\":[{\"itemCategoryId|1-100\":1,\"itemCateGoryName\":\"@ctitle(2, 5)\"}]}}"
		},
		{
			"role": "user",
			"content": "{\"/demand/contact\":{\"type\":\"object\",\"properties\":{\"contactsName\":{\"type\":\"string\",\"description\":\"联系人名称\"},\"contactsWxCode\":{\"type\":\"string\",\"description\":\"联系人微信\"},\"contactsWxImg\":{\"type\":\"string\",\"description\":\"联系人二维码\"}},\"description\":\"成功返回结果\"},\"/demand/reward/list\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"title\":{\"type\":\"string\",\"description\":\"需求名称\"},\"createTime\":{\"type\":\"object\",\"properties\":{},\"description\":\"奖励发放时间\"}}},\"description\":\"成功返回结果\"}}"
		},
		{
			"role": "assistant",
			"content": "{\"demandContact\":{\"contactsName\":\"@cname()\",\"contactsWxCode\":\"@word(5, 10)\",\"contactsWxImg\":\"@image(\\\"200x200\\\", \\\"#ccc\\\", \\\"#fff\\\", \\\"wxQrCode\\\")\"},\"demandRewardList\":{\"data|10-20\":[{\"title\":\"@ctitle(5, 10)\",\"createTime\":\"@datetime\"}]}}"
		},
		{
			"role": "user",
			"content": "{\"/third/item/detail\":{\"type\":\"object\",\"properties\":{\"itemId\":{\"type\":\"number\",\"description\":\"商品 id\"},\"rank\":{\"type\":\"number\",\"description\":\"商品排名\"},\"type\":{\"type\":\"number\",\"description\":\"榜单类型(1:社区团购)\"},\"goodsName\":{\"type\":\"string\",\"description\":\"商品名称\"},\"goodsCover\":{\"type\":\"string\",\"description\":\"商品封面图\"},\"goodsDesc\":{\"type\":\"string\",\"description\":\"商品描述\"},\"materialUrls\":{\"type\":\"array\",\"items\":{\"type\":\"string\"},\"description\":\"商品详情图\"},\"marketPrice\":{\"type\":\"number\",\"description\":\"划线价 单位:分\"},\"salePrice\":{\"type\":\"number\",\"description\":\"销售价 单位:分\"},\"maxPrice\":{\"type\":\"number\",\"description\":\"最大销售价 单位:分\"},\"minPrice\":{\"type\":\"number\",\"description\":\"最小销售价 单位:分\"},\"soldNum\":{\"type\":\"number\",\"description\":\"总销量\"},\"activityCreatedTime\":{\"type\":\"string\",\"description\":\"发布时间\",\"mock\":{\"mock\":\"@datetime\"}},\"estimatedSales\":{\"type\":\"number\",\"description\":\"预估销售额 单位:分\"},\"skuList\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"skuName\":{\"type\":\"string\",\"description\":\"sku 名称\"},\"salePrice\":{\"type\":\"number\",\"description\":\"销售价（单位分）\"},\"picUrl\":{\"type\":\"string\",\"description\":\"sku 默认图片 url（如 sku 无自己的图片，则是商品图片）\"},\"stock\":{\"type\":\"number\",\"description\":\"库存数\"}}},\"description\":\"商品 sku 列表\"},\"skuJson\":{\"type\":\"string\",\"description\":\"商品的 sku 信息\"},\"propertyList\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}}},\"description\":\"商品属性列表\"},\"platformType\":{\"type\":\"string\",\"description\":\"平台类型(zhzg:知花知果，jbj:九佰街)\"},\"collection\":{\"type\":\"boolean\",\"description\":\"是否被收藏\"}}}}"
		}
	]
}
```

```
Input:
{\"/third/ranking/item/menu\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"itemCategoryId\":{\"type\":\"number\",\"description\":\"商品类目 ID\"},\"itemCateGoryName\":{\"type\":\"string\",\"description\":\"商品类目名称\"}},\"required\":[\"itemCategoryId\",\"itemCateGoryName\"]}}}\n
Output:
{\"thirdRankingItemMenu\":{\"data|10-20\":[{\"itemCategoryId|1-100\":1,\"itemCateGoryName\":\"@ctitle(2, 5)\"}]}}\n
Input:
{\"/demand/contact\":{\"type\":\"object\",\"properties\":{\"contactsName\":{\"type\":\"string\",\"description\":\"联系人名称\"},\"contactsWxCode\":{\"type\":\"string\",\"description\":\"联系人微信\"},\"contactsWxImg\":{\"type\":\"string\",\"description\":\"联系人二维码\"}},\"description\":\"成功返回结果\"},\"/demand/reward/list\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"title\":{\"type\":\"string\",\"description\":\"需求名称\"},\"createTime\":{\"type\":\"object\",\"properties\":{},\"description\":\"奖励发放时间\"}}},\"description\":\"成功返回结果\"}}\n
Output:
{\"demandContact\":{\"contactsName\":\"@cname()\",\"contactsWxCode\":\"@word(5, 10)\",\"contactsWxImg\":\"@image(\\\"200x200\\\", \\\"#ccc\\\", \\\"#fff\\\", \\\"wxQrCode\\\")\"},\"demandRewardList\":{\"data|10-20\":[{\"title\":\"@ctitle(5, 10)\",\"createTime\":\"@datetime\"}]}}\n
Input:
{\"type\":\"object\",\"properties\":{\"list\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"id\":{\"type\":\"number\",\"description\":\"主键id\"},\"orderNo\":{\"type\":\"string\",\"description\":\"订单编号\"},\"parentOrderNo\":{\"type\":\"string\",\"description\":\"父订单编号\"},\"msgContent\":{\"type\":\"string\",\"description\":\"消息内容\"},\"itemTitle\":{\"type\":\"string\",\"description\":\"商品标题\"},\"consigneeName\":{\"type\":\"string\",\"description\":\"收货联系人\"},\"consigneeMobile\":{\"type\":\"string\",\"description\":\"收货联系手机号\"},\"consigneeAddress\":{\"type\":\"string\",\"description\":\"收货人地址\"},\"groupLeaderName\":{\"type\":\"string\",\"description\":\"团长昵称\"},\"groupLeaderWxGroupRelation\":{\"type\":\"string\",\"description\":\"团长关联群聊\"},\"companyName\":{\"type\":\"string\",\"description\":\"供应商名称\"},\"supplierWxGroupRelation\":{\"type\":\"string\",\"description\":\"供应商关联群聊\"},\"operatorName\":{\"type\":\"string\",\"description\":\"操作人姓名\"},\"processingStatus\":{\"type\":\"number\",\"description\":\"处理状态(1:未处理,2:已处理)\"},\"createTime\":{\"type\":\"string\",\"description\":\"创建时间\"},\"updateTime\":{\"type\":\"string\",\"description\":\"处理时间\"}}}},\"endPage\":{\"type\":\"boolean\"},\"totalCount\":{\"type\":\"number\"},\"currentPage\":{\"type\":\"number\"}},\"required\":[\"list\",\"currentPage\",\"totalCount\",\"endPage\"]}\nOutput:
```

```json
[{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"itemCategoryId":{"type":"number","description":"商品类目 ID"},"itemCateGoryName":{"type":"string","description":"商品类目名称"}},"required":["itemCategoryId","itemCateGoryName"]}}},"$schema":"http://json-schema.org/draft-04/schema#","description":""}]
[{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]}]

[{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"contactsName":{"type":"string","description":"联系人名称"},"contactsWxCode":{"type":"string","description":"联系人微信"},"contactsWxImg":{"type":"string","description":"联系人二维码"}},"description":"成功返回结果"}},"$schema":"http://json-schema.org/draft-04/schema#","description":""}, {"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string","description":"需求名称"},"createTime":{"type":"object","properties":{},"description":"奖励发放时间"}}},"description":"成功返回结果"}},"description":""}]
[{"code":200,"message":"success","data":{"contactsName":"@cname()","contactsWxCode":"@word(5, 10)","contactsWxImg":"@image(\"200x200\", \"#ccc\", \"#fff\", \"wxQrCode\")"}},{"code":200,"message":"success","data|10-20":[{"title":"@ctitle(5, 10)","createTime":"@datetime"}]}]

[{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"list":{"type":"array","items":{"type":"object","properties":{"id":{"type":"number","description":"主键id"},"orderNo":{"type":"string","description":"订单编号"},"parentOrderNo":{"type":"string","description":"父订单编号"},"msgContent":{"type":"string","description":"消息内容"},"itemTitle":{"type":"string","description":"商品标题"},"consigneeName":{"type":"string","description":"收货联系人"},"consigneeMobile":{"type":"string","description":"收货联系手机号"},"consigneeAddress":{"type":"string","description":"收货人地址"},"groupLeaderName":{"type":"string","description":"团长昵称"},"groupLeaderWxGroupRelation":{"type":"string","description":"团长关联群聊"},"companyName":{"type":"string","description":"供应商名称"},"supplierWxGroupRelation":{"type":"string","description":"供应商关联群聊"},"operatorName":{"type":"string","description":"操作人姓名"},"processingStatus":{"type":"number","description":"处理状态(1:未处理,2:已处理)"},"createTime":{"type":"string","description":"创建时间"},"updateTime":{"type":"string","description":"处理时间"}}}},"endPage":{"type":"boolean"},"totalCount":{"type":"number"},"currentPage":{"type":"number"}},"required":["list","currentPage","totalCount","endPage"]}},"description":""}]
[{"code":200,"message":"success","data":{"list|10-20":[{"id|1-100":1,"orderNo":"@word(10, 20)","parentOrderNo":"@word(10, 20)","msgContent":"@csentence(10, 20)","itemTitle":"@ctitle(5, 10)","consigneeName":"@cname()","consigneeMobile":"@integer(10000000000, 19999999999)","consigneeAddress":"@county(true)","groupLeaderName":"@cname()","groupLeaderWxGroupRelation":"@word(5, 10)","companyName":"@ctitle(5, 10)","supplierWxGroupRelation":"@word(5, 10)","operatorName":"@cname()","processingStatus|1-2":1,"createTime":"@datetime","updateTime":"@datetime"}],"endPage":true,"totalCount|100-200":100,"currentPage":1}}]

```
