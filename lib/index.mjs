import ora from 'ora';
import consola from 'consola';

const a = 1;

var Method = /* @__PURE__ */ ((Method2) => {
  Method2["GET"] = "GET";
  Method2["POST"] = "POST";
  Method2["PUT"] = "PUT";
  Method2["DELETE"] = "DELETE";
  Method2["HEAD"] = "HEAD";
  Method2["OPTIONS"] = "OPTIONS";
  Method2["PATCH"] = "PATCH";
  return Method2;
})(Method || {});
var RequestBodyType = /* @__PURE__ */ ((RequestBodyType2) => {
  RequestBodyType2["query"] = "query";
  RequestBodyType2["form"] = "form";
  RequestBodyType2["json"] = "json";
  RequestBodyType2["text"] = "text";
  RequestBodyType2["file"] = "file";
  RequestBodyType2["raw"] = "raw";
  RequestBodyType2["none"] = "none";
  return RequestBodyType2;
})(RequestBodyType || {});
var RequestParamType = /* @__PURE__ */ ((RequestParamType2) => {
  RequestParamType2["string"] = "string";
  RequestParamType2["number"] = "number";
  return RequestParamType2;
})(RequestParamType || {});
var RequestQueryType = /* @__PURE__ */ ((RequestQueryType2) => {
  RequestQueryType2["string"] = "string";
  RequestQueryType2["number"] = "number";
  return RequestQueryType2;
})(RequestQueryType || {});
var RequestFormItemType = /* @__PURE__ */ ((RequestFormItemType2) => {
  RequestFormItemType2["text"] = "text";
  RequestFormItemType2["file"] = "file";
  return RequestFormItemType2;
})(RequestFormItemType || {});
var ResponseBodyType = /* @__PURE__ */ ((ResponseBodyType2) => {
  ResponseBodyType2["json"] = "json";
  ResponseBodyType2["text"] = "text";
  ResponseBodyType2["xml"] = "xml";
  ResponseBodyType2["raw"] = "raw";
  return ResponseBodyType2;
})(ResponseBodyType || {});
var Required = /* @__PURE__ */ ((Required2) => {
  Required2["false"] = "0";
  Required2["true"] = "1";
  return Required2;
})(Required || {});
const defineConfig = (config) => config;

consola.info("Using consola 3.0.0");
consola.start("Building project...");
consola.warn("A new version of consola is available: 3.0.1");
consola.success("Project built!");
consola.error(new Error("This is an example error. Everything is fine!"));
consola.box("I am a simple box");
consola.prompt("Deploy to the production?", {
  type: "confirm"
});
const spinner = ora("Loading unicorns").start();
setTimeout(() => {
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
  spinner.clear();
}, 1e3);
console.log(a);

export { Method, RequestBodyType, RequestFormItemType, RequestParamType, RequestQueryType, Required, ResponseBodyType, defineConfig };
