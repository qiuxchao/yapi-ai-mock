"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJsonValidator = void 0;
const ts = __importStar(require("typescript"));
const result_1 = require("./result");
const libText = `interface Array<T> { length: number, [n: number]: T }
interface Object { toString(): string }
interface Function { prototype: unknown }
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface String { readonly length: number }
interface Boolean { valueOf(): boolean }
interface Number { valueOf(): number }
interface RegExp { test(string: string): boolean }`;
/**
 * Returns a JSON validator for a given TypeScript schema. Validation is performed by an in-memory instance of
 * the TypeScript compiler. The specified type argument `T` must be the same type as `typeName` in the given `schema`.
 * @param schema A string containing the TypeScript source code for the JSON schema.
 * @param typeName The name of the JSON target type in the schema.
 * @returns A `TypeChatJsonValidator<T>` instance.
 */
function createJsonValidator(schema, typeName) {
    const options = {
        ...ts.getDefaultCompilerOptions(),
        strict: true,
        skipLibCheck: true,
        noLib: true,
        types: []
    };
    const rootProgram = createProgramFromModuleText("");
    const validator = {
        schema,
        typeName,
        stripNulls: false,
        createModuleTextFromJson,
        validate
    };
    return validator;
    function validate(jsonText) {
        let jsonObject;
        try {
            jsonObject = JSON.parse(jsonText);
        }
        catch (e) {
            return (0, result_1.error)(e instanceof SyntaxError ? e.message : "JSON parse error");
        }
        if (validator.stripNulls) {
            stripNulls(jsonObject);
        }
        const moduleResult = validator.createModuleTextFromJson(jsonObject);
        if (!moduleResult.success) {
            return moduleResult;
        }
        const program = createProgramFromModuleText(moduleResult.data, rootProgram);
        const syntacticDiagnostics = program.getSyntacticDiagnostics();
        const programDiagnostics = syntacticDiagnostics.length ? syntacticDiagnostics : program.getSemanticDiagnostics();
        if (programDiagnostics.length) {
            const diagnostics = programDiagnostics.map(d => typeof d.messageText === "string" ? d.messageText : d.messageText.messageText).join("\n");
            return (0, result_1.error)(diagnostics);
        }
        return (0, result_1.success)(jsonObject);
    }
    function createModuleTextFromJson(jsonObject) {
        return (0, result_1.success)(`import { ${typeName} } from './schema';\nconst json: ${typeName} = ${JSON.stringify(jsonObject, undefined, 2)};\n`);
    }
    function createProgramFromModuleText(moduleText, oldProgram) {
        const fileMap = new Map([
            createFileMapEntry("/lib.d.ts", libText),
            createFileMapEntry("/schema.ts", schema),
            createFileMapEntry("/json.ts", moduleText)
        ]);
        const host = {
            getSourceFile: fileName => fileMap.get(fileName),
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => { },
            getCurrentDirectory: () => "/",
            getCanonicalFileName: fileName => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: fileName => fileMap.has(fileName),
            readFile: fileName => "",
        };
        return ts.createProgram(Array.from(fileMap.keys()), options, host, oldProgram);
    }
    function createFileMapEntry(filePath, fileText) {
        return [filePath, ts.createSourceFile(filePath, fileText, ts.ScriptTarget.Latest)];
    }
}
exports.createJsonValidator = createJsonValidator;
/**
 * Recursively delete properties with null values from the given object. This function assumes there are no
 * circular references in the object.
 * @param obj The object in which to strip null valued properties.
 */
function stripNulls(obj) {
    let keysToDelete;
    for (const k in obj) {
        const value = obj[k];
        if (value === null) {
            (keysToDelete ??= []).push(k);
        }
        else {
            if (Array.isArray(value)) {
                if (value.some(x => x === null)) {
                    obj[k] = value.filter(x => x !== null);
                }
            }
            if (typeof value === "object") {
                stripNulls(value);
            }
        }
    }
    if (keysToDelete) {
        for (const k of keysToDelete) {
            delete obj[k];
        }
    }
}
