module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1773060727026, function(require, module, exports) {
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });var __TEMP__ = require('./filter/index.js');Object.keys(__TEMP__).forEach(function(k) { if (k === "default" || k === "__esModule") return; Object.defineProperty(exports, k, { enumerable: true, configurable: true, get: function() { return __TEMP__[k]; } }); });

}, function(modId) {var map = {"./filter/index.js":1773060727027}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773060727027, function(require, module, exports) {
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });var __TEMP__ = require('./composable-filters.js');Object.keys(__TEMP__).forEach(function(k) { if (k === "default" || k === "__esModule") return; Object.defineProperty(exports, k, { enumerable: true, configurable: true, get: function() { return __TEMP__[k]; } }); });
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });var __TEMP__ = require('./filter-vite-plugins.js');Object.keys(__TEMP__).forEach(function(k) { if (k === "default" || k === "__esModule") return; Object.defineProperty(exports, k, { enumerable: true, configurable: true, get: function() { return __TEMP__[k]; } }); });
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });var __TEMP__ = require('./simple-filters.js');Object.keys(__TEMP__).forEach(function(k) { if (k === "default" || k === "__esModule") return; Object.defineProperty(exports, k, { enumerable: true, configurable: true, get: function() { return __TEMP__[k]; } }); });

}, function(modId) { var map = {"./simple-filters.js":1773060727030}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773060727030, function(require, module, exports) {
/**
 * Constructs a RegExp that matches the exact string specified.
 *
 * This is useful for plugin hook filters.
 *
 * @param str the string to match.
 * @param flags flags for the RegExp.
 *
 * @example
 * ```ts
 * import { exactRegex } from '@rolldown/pluginutils';
 * const plugin = {
 *   name: 'plugin',
 *   resolveId: {
 *     filter: { id: exactRegex('foo') },
 *     handler(id) {} // will only be called for `foo`
 *   }
 * }
 * ```
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function exactRegex(str, flags) {
    return new RegExp(`^${escapeRegex(str)}$`, flags);
};exports.exactRegex = exactRegex
/**
 * Constructs a RegExp that matches a value that has the specified prefix.
 *
 * This is useful for plugin hook filters.
 *
 * @param str the string to match.
 * @param flags flags for the RegExp.
 *
 * @example
 * ```ts
 * import { prefixRegex } from '@rolldown/pluginutils';
 * const plugin = {
 *   name: 'plugin',
 *   resolveId: {
 *     filter: { id: prefixRegex('foo') },
 *     handler(id) {} // will only be called for IDs starting with `foo`
 *   }
 * }
 * ```
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function prefixRegex(str, flags) {
    return new RegExp(`^${escapeRegex(str)}`, flags);
};exports.prefixRegex = prefixRegex
const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g;
function escapeRegex(str) {
    return str.replace(escapeRegexRE, '\\$&');
}
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function makeIdFiltersToMatchWithQuery(input) {
    if (!Array.isArray(input)) {
        return makeIdFilterToMatchWithQuery(
        // Array.isArray cannot narrow the type
        // https://github.com/microsoft/TypeScript/issues/17002
        input);
    }
    return input.map((i) => makeIdFilterToMatchWithQuery(i));
};exports.makeIdFiltersToMatchWithQuery = makeIdFiltersToMatchWithQuery
function makeIdFilterToMatchWithQuery(input) {
    if (typeof input === 'string') {
        return `${input}{?*,}`;
    }
    return makeRegexIdFilterToMatchWithQuery(input);
}
function makeRegexIdFilterToMatchWithQuery(input) {
    return new RegExp(
    // replace `$` with `(?:\?.*)?$` (ignore `\$`)
    input.source.replace(/(?<!\\)\$/g, '(?:\\?.*)?$'), input.flags);
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1773060727026);
})()
//miniprogram-npm-outsideDeps=["./composable-filters.js","./filter-vite-plugins.js"]
//# sourceMappingURL=index.js.map