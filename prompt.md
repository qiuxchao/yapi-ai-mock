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
Input: {\"/third/ranking/item/menu\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"itemCategoryId\":{\"type\":\"number\",\"description\":\"商品类目 ID\"},\"itemCateGoryName\":{\"type\":\"string\",\"description\":\"商品类目名称\"}},\"required\":[\"itemCategoryId\",\"itemCateGoryName\"]}}}\nOutput: {\"thirdRankingItemMenu\":{\"data|10-20\":[{\"itemCategoryId|1-100\":1,\"itemCateGoryName\":\"@ctitle(2, 5)\"}]}}\nInput: {\"/demand/contact\":{\"type\":\"object\",\"properties\":{\"contactsName\":{\"type\":\"string\",\"description\":\"联系人名称\"},\"contactsWxCode\":{\"type\":\"string\",\"description\":\"联系人微信\"},\"contactsWxImg\":{\"type\":\"string\",\"description\":\"联系人二维码\"}},\"description\":\"成功返回结果\"},\"/demand/reward/list\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"title\":{\"type\":\"string\",\"description\":\"需求名称\"},\"createTime\":{\"type\":\"object\",\"properties\":{},\"description\":\"奖励发放时间\"}}},\"description\":\"成功返回结果\"}}\nOutput: {\"demandContact\":{\"contactsName\":\"@cname()\",\"contactsWxCode\":\"@word(5, 10)\",\"contactsWxImg\":\"@image(\\\"200x200\\\", \\\"#ccc\\\", \\\"#fff\\\", \\\"wxQrCode\\\")\"},\"demandRewardList\":{\"data|10-20\":[{\"title\":\"@ctitle(5, 10)\",\"createTime\":\"@datetime\"}]}}\nInput: {\"/third/item/detail\":{\"type\":\"object\",\"properties\":{\"itemId\":{\"type\":\"number\",\"description\":\"商品 id\"},\"rank\":{\"type\":\"number\",\"description\":\"商品排名\"},\"type\":{\"type\":\"number\",\"description\":\"榜单类型(1:社区团购)\"},\"goodsName\":{\"type\":\"string\",\"description\":\"商品名称\"},\"goodsCover\":{\"type\":\"string\",\"description\":\"商品封面图\"},\"goodsDesc\":{\"type\":\"string\",\"description\":\"商品描述\"},\"materialUrls\":{\"type\":\"array\",\"items\":{\"type\":\"string\"},\"description\":\"商品详情图\"},\"marketPrice\":{\"type\":\"number\",\"description\":\"划线价 单位:分\"},\"salePrice\":{\"type\":\"number\",\"description\":\"销售价 单位:分\"},\"maxPrice\":{\"type\":\"number\",\"description\":\"最大销售价 单位:分\"},\"minPrice\":{\"type\":\"number\",\"description\":\"最小销售价 单位:分\"},\"soldNum\":{\"type\":\"number\",\"description\":\"总销量\"},\"activityCreatedTime\":{\"type\":\"string\",\"description\":\"发布时间\",\"mock\":{\"mock\":\"@datetime\"}},\"estimatedSales\":{\"type\":\"number\",\"description\":\"预估销售额 单位:分\"},\"skuList\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"skuName\":{\"type\":\"string\",\"description\":\"sku 名称\"},\"salePrice\":{\"type\":\"number\",\"description\":\"销售价（单位分）\"},\"picUrl\":{\"type\":\"string\",\"description\":\"sku 默认图片 url（如 sku 无自己的图片，则是商品图片）\"},\"stock\":{\"type\":\"number\",\"description\":\"库存数\"}}},\"description\":\"商品 sku 列表\"},\"skuJson\":{\"type\":\"string\",\"description\":\"商品的 sku 信息\"},\"propertyList\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}}},\"description\":\"商品属性列表\"},\"platformType\":{\"type\":\"string\",\"description\":\"平台类型(zhzg:知花知果，jbj:九佰街)\"},\"collection\":{\"type\":\"boolean\",\"description\":\"是否被收藏\"}}}}\nOutput:
```
