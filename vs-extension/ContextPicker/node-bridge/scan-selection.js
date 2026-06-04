#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/comment-bear/dist/detectors/language-detector.js
var require_language_detector = __commonJS({
  "node_modules/comment-bear/dist/detectors/language-detector.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.detectLanguageByFilename = detectLanguageByFilename2;
    exports2.detectLanguageByContent = detectLanguageByContent;
    exports2.detectLanguage = detectLanguage;
    var EXTENSION_MAP = {
      // JavaScript/TypeScript
      ".js": "javascript",
      ".mjs": "javascript",
      ".cjs": "javascript",
      ".jsx": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".mts": "typescript",
      ".cts": "typescript",
      // Python
      ".py": "python",
      ".pyw": "python",
      ".pyi": "python",
      // Ruby
      ".rb": "ruby",
      ".rake": "ruby",
      // Java
      ".java": "java",
      // C#
      ".cs": "csharp",
      // C/C++
      ".c": "c",
      ".h": "c",
      ".cpp": "cpp",
      ".cc": "cpp",
      ".cxx": "cpp",
      ".hpp": "cpp",
      ".hh": "cpp",
      ".hxx": "cpp",
      // Web
      ".html": "html",
      ".htm": "html",
      ".css": "css",
      ".scss": "scss",
      ".sass": "sass",
      ".less": "less",
      // SQL
      ".sql": "sql",
      // Config/Data
      ".yaml": "yaml",
      ".yml": "yaml",
      ".json": "json",
      ".xml": "xml",
      // Other
      ".php": "php",
      ".go": "go",
      ".rs": "rust",
      ".swift": "swift",
      // Kotlin
      ".kt": "kotlin",
      ".kts": "kotlin",
      // Scala
      ".scala": "scala",
      ".sc": "scala",
      // Haskell
      ".hs": "haskell",
      ".lhs": "haskell",
      // Shell
      ".sh": "shell",
      ".bash": "shell",
      ".zsh": "shell",
      ".ksh": "shell",
      ".fish": "shell",
      // PowerShell
      ".ps1": "powershell",
      ".psm1": "powershell",
      ".psd1": "powershell",
      // Perl
      ".pl": "perl",
      ".pm": "perl",
      ".t": "perl",
      ".pod": "perl",
      // R (matched case-insensitively, so .R is covered too)
      ".r": "r",
      // TOML
      ".toml": "toml",
      // Makefile
      ".mk": "makefile",
      // INI
      ".ini": "ini",
      ".cfg": "ini",
      // GraphQL
      ".graphql": "graphql",
      ".gql": "graphql",
      // Elixir
      ".ex": "elixir",
      ".exs": "elixir",
      // Crystal
      ".cr": "crystal",
      // Julia
      ".jl": "julia",
      // Nim
      ".nim": "nim",
      // CoffeeScript
      ".coffee": "coffeescript",
      // Tcl
      ".tcl": "tcl",
      // CMake
      ".cmake": "cmake",
      // Java properties
      ".properties": "properties",
      // Puppet
      ".pp": "puppet",
      // HCL / Terraform
      ".tf": "hcl",
      ".hcl": "hcl",
      ".tfvars": "hcl",
      // Dart
      ".dart": "dart",
      // Groovy
      ".groovy": "groovy",
      ".gradle": "groovy",
      // Solidity
      ".sol": "solidity",
      // Protocol Buffers
      ".proto": "protobuf",
      // Objective-C
      ".m": "objectivec",
      ".mm": "objectivec",
      // Zig
      ".zig": "zig",
      // Vala
      ".vala": "vala",
      // D
      ".d": "d",
      // GLSL (shading languages)
      ".glsl": "glsl",
      ".vert": "glsl",
      ".frag": "glsl",
      ".comp": "glsl",
      // HLSL
      ".hlsl": "hlsl",
      // WGSL
      ".wgsl": "wgsl",
      // JSON5 / JSONC
      ".json5": "json5",
      ".jsonc": "json5",
      // Phase 3 languages.
      // Lua
      ".lua": "lua",
      // Elm
      ".elm": "elm",
      // Ada
      ".adb": "ada",
      ".ads": "ada",
      // VHDL
      ".vhd": "vhdl",
      ".vhdl": "vhdl",
      // AppleScript
      ".applescript": "applescript",
      // Clojure
      ".clj": "clojure",
      ".cljs": "clojure",
      ".cljc": "clojure",
      ".edn": "clojure",
      // Common Lisp
      ".lisp": "commonlisp",
      ".cl": "commonlisp",
      // Scheme (also Racket)
      ".scm": "scheme",
      ".ss": "scheme",
      ".rkt": "scheme",
      // Emacs Lisp
      ".el": "emacslisp",
      // Assembly
      ".asm": "assembly",
      ".s": "assembly",
      // Erlang
      ".erl": "erlang",
      ".hrl": "erlang",
      // LaTeX
      ".tex": "latex",
      ".sty": "latex",
      // OCaml
      ".ml": "ocaml",
      ".mli": "ocaml",
      // F#
      ".fs": "fsharp",
      ".fsx": "fsharp",
      ".fsi": "fsharp",
      // Standard ML
      ".sml": "sml",
      // Pascal / Delphi
      ".pas": "pascal",
      ".dpr": "pascal",
      ".lpr": "pascal",
      // Visual Basic
      ".vb": "vb",
      ".vba": "vb",
      ".bas": "vb",
      // Batch
      ".bat": "batch",
      ".cmd": "batch",
      // Fortran (free-form)
      ".f90": "fortran",
      ".f95": "fortran",
      ".f03": "fortran",
      ".f08": "fortran",
      ".f": "fortran",
      ".for": "fortran",
      // Vimscript
      ".vim": "vimscript",
      // Hybrid / templating languages.
      // Vue (Single-File Component)
      ".vue": "vue",
      // Svelte
      ".svelte": "svelte",
      // Markdown
      ".md": "markdown",
      ".markdown": "markdown",
      ".mdown": "markdown",
      ".mkd": "markdown"
      // NOTE: matlab and prolog get NO extension mapping on purpose. `.m` is
      // already mapped to Objective-C and `.pl` to Perl, so MATLAB and Prolog are
      // reachable only via an explicit `--language matlab` / `--language prolog`.
    };
    var SPECIAL_FILENAMES = {
      "makefile": "makefile",
      "gnumakefile": "makefile",
      "dockerfile": "dockerfile",
      "cmakelists.txt": "cmake",
      ".vimrc": "vimscript",
      "vimrc": "vimscript",
      "_vimrc": "vimscript",
      ".gvimrc": "vimscript"
    };
    function detectLanguageByFilename2(filename) {
      if (!filename)
        return void 0;
      if (typeof filename !== "string") {
        return void 0;
      }
      const normalized = filename.trim().replace(/\.+$/, "");
      const basename4 = normalized.replace(/^.*[\\/]/, "").toLowerCase();
      const specialName = SPECIAL_FILENAMES[basename4];
      if (specialName) {
        return specialName;
      }
      for (const [extension, lang] of Object.entries(EXTENSION_MAP)) {
        if (normalized.toLowerCase().endsWith(extension)) {
          return lang;
        }
      }
      return void 0;
    }
    function detectLanguageByShebang(shebangLine) {
      const lower = shebangLine.toLowerCase();
      if (/\b(bash|sh|zsh|ksh)\b/.test(lower)) {
        return "shell";
      }
      if (/\bpython[0-9.]*\b/.test(lower)) {
        return "python";
      }
      if (/\bperl\b/.test(lower)) {
        return "perl";
      }
      if (/\bruby\b/.test(lower)) {
        return "ruby";
      }
      if (/\bnode\b/.test(lower)) {
        return "javascript";
      }
      return void 0;
    }
    function detectLanguageByContent(code) {
      if (!code || code.trim().length === 0)
        return void 0;
      const trimmed = code.trim();
      if (trimmed.startsWith("#!")) {
        const firstLine = trimmed.split("\n")[0];
        const shebangLang = detectLanguageByShebang(firstLine);
        if (shebangLang) {
          return shebangLang;
        }
      }
      if (trimmed.includes("<!DOCTYPE") || /<html[\s>]/i.test(trimmed) || /<head[\s>]/i.test(trimmed) || /<body[\s>]/i.test(trimmed)) {
        return "html";
      }
      if (trimmed.startsWith("<?xml")) {
        return "xml";
      }
      if (trimmed.length > 4 && // Require minimum length for meaningful JSON
      (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          JSON.parse(trimmed);
          return "json";
        } catch {
        }
      }
      const hasEndLine = /^\s*end\b/m.test(trimmed);
      if (
        // Ruby's def/end pattern: a `def NAME` line and a standalone `end` line.
        /^\s*def\s+\w+/m.test(trimmed) && hasEndLine || // Ruby's class/module with end.
        /^\s*(class|module)\s+[\w:]+/m.test(trimmed) && hasEndLine || // Ruby's puts with string.
        /\bputs\s+["']/.test(trimmed) || // Ruby's begin/end blocks.
        /\bbegin\b/.test(trimmed) && /\bend\b/.test(trimmed) || // Ruby's do |...| blocks (the pipe section is bounded to one line).
        /\bdo\s*\|[^|\n]*\|/.test(trimmed) && hasEndLine || // Ruby's multi-line comments (=begin / =end on their own lines).
        /^=begin\b/m.test(trimmed) && /^=end\b/m.test(trimmed)
      ) {
        return "ruby";
      }
      if (/^\s*module\s+[A-Z][\w.]*\s+where/m.test(trimmed) || /^\s*\w+\s*::\s*.+->/.test(trimmed) || /^\s*import\s+(qualified\s+)?[A-Z]/m.test(trimmed) && !/[{};]/.test(trimmed) && !/from\s/m.test(trimmed)) {
        return "haskell";
      }
      if (/^\s*def\s+\w+\s*\([^)]*\)\s*:/m.test(trimmed) || // Python's class with colon and inheritance
      /^\s*class\s+\w+\s*(\([^)]*\))?\s*:/m.test(trimmed) || // Python's import/from with newline or end of string
      /^\s*(import|from)\s+\w+/m.test(trimmed) && !/[{};]/.test(trimmed)) {
        return "python";
      }
      if (trimmed.includes("<?php")) {
        return "php";
      }
      if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+/im.test(trimmed)) {
        return "sql";
      }
      if (/^(public|private|protected)\s+(class|interface|enum)/m.test(trimmed) || trimmed.includes("System.out.println")) {
        return "java";
      }
      if (trimmed.includes("using System;") || /namespace\s+\w+/m.test(trimmed)) {
        return "csharp";
      }
      if (/\bdata\s+class\b/m.test(trimmed) || /\bfun\s+\w+/m.test(trimmed) && /\bval\s+\w+/m.test(trimmed)) {
        return "kotlin";
      }
      if (/^\s*package\s+[\w.]+\.[\w.]+/m.test(trimmed) && (/\bfun\s+/m.test(trimmed) || /\bval\s+/m.test(trimmed))) {
        return "kotlin";
      }
      if (/\bcase\s+class\b/m.test(trimmed) || /^\s*(object|trait)\s+\w+/m.test(trimmed) && (/\bdef\s+\w+/m.test(trimmed) || /\bval\s+\w+/m.test(trimmed))) {
        return "scala";
      }
      if (/^\s*package\s+[\w.]+\.[\w.]+/m.test(trimmed) && (/\btrait\s+/m.test(trimmed) || /\bobject\s+/m.test(trimmed))) {
        return "scala";
      }
      if (/^(fn|pub fn|impl|mod|use)\s+/m.test(trimmed) || trimmed.includes("println!") || /^\s*trait\s+\w+/m.test(trimmed) && !(/\bdef\s+/m.test(trimmed) || /\bval\s+/m.test(trimmed))) {
        return "rust";
      }
      if (/^(func|var|let|class|struct|enum)\s+\w+/m.test(trimmed) && (trimmed.includes(": ") || trimmed.includes("-> "))) {
        return "swift";
      }
      if (/^package\s+\w+/m.test(trimmed) || /^func\s+\w+/m.test(trimmed) || trimmed.includes("fmt.Println")) {
        return "go";
      }
      if (/:\s*(string|number|boolean|any|void|never)\s*[=;,\)]/m.test(trimmed) || trimmed.includes("interface ") || trimmed.includes("type ")) {
        return "typescript";
      }
      if (/^(function|const|let|var|class|export|import)\s+/m.test(trimmed) || trimmed.includes("=>")) {
        return "javascript";
      }
      const braceIdx = trimmed.indexOf("{");
      if (braceIdx !== -1 && trimmed.indexOf("}", braceIdx) !== -1) {
        let k = braceIdx - 1;
        while (k >= 0 && (trimmed[k] === " " || trimmed[k] === "	"))
          k--;
        if (k >= 0 && /[\w.#*]/.test(trimmed[k])) {
          return "css";
        }
      }
      return void 0;
    }
    function detectLanguage(filename, code) {
      if (filename) {
        const langByFilename = detectLanguageByFilename2(filename);
        if (langByFilename)
          return langByFilename;
      }
      if (code) {
        return detectLanguageByContent(code);
      }
      return void 0;
    }
  }
});

// node_modules/comment-bear/dist/stream.js
var require_stream = __commonJS({
  "node_modules/comment-bear/dist/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CommentRemoverStream = void 0;
    exports2.createCommentRemoverStream = createCommentRemoverStream;
    var stream_1 = require("stream");
    var index_1 = require_dist();
    var CommentRemoverStream = class extends stream_1.Transform {
      constructor(options = {}) {
        const { language, filename, preserveLicense, keepEmptyLines, ...transformOptions } = options;
        super({ ...transformOptions, objectMode: false });
        this.chunks = [];
        this.removeOptions = {
          language,
          filename,
          preserveLicense,
          keepEmptyLines
        };
      }
      _transform(chunk, encoding, callback) {
        this.chunks.push(chunk);
        callback();
      }
      _flush(callback) {
        try {
          const code = Buffer.concat(this.chunks).toString("utf-8");
          const result = (0, index_1.removeComments)(code, this.removeOptions);
          this.push(Buffer.from(result.code, "utf-8"));
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    exports2.CommentRemoverStream = CommentRemoverStream;
    function createCommentRemoverStream(options = {}) {
      return new CommentRemoverStream(options);
    }
  }
});

// node_modules/comment-bear/dist/config.js
var require_config = __commonJS({
  "node_modules/comment-bear/dist/config.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2)
            if (Object.prototype.hasOwnProperty.call(o2, k))
              ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule)
          return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++)
            if (k[i] !== "default")
              __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.findConfigFile = findConfigFile;
    exports2.loadConfig = loadConfig;
    exports2.validateConfig = validateConfig;
    exports2.mergeConfig = mergeConfig;
    var fs6 = __importStar(require("fs"));
    var path5 = __importStar(require("path"));
    var CONFIG_FILENAMES = [
      ".commentbearrc",
      ".commentbearrc.json"
    ];
    function findConfigFile(startDir) {
      let dir = startDir || process.cwd();
      const root = path5.parse(dir).root;
      while (true) {
        for (const filename of CONFIG_FILENAMES) {
          const configPath = path5.join(dir, filename);
          if (fs6.existsSync(configPath)) {
            return configPath;
          }
        }
        const parent = path5.dirname(dir);
        if (parent === dir || dir === root) {
          break;
        }
        dir = parent;
      }
      return void 0;
    }
    function loadConfig(configPath) {
      const resolvedPath = configPath || findConfigFile();
      if (!resolvedPath) {
        return {};
      }
      if (!fs6.existsSync(resolvedPath)) {
        throw new Error(`Config file not found: ${resolvedPath}`);
      }
      const content = fs6.readFileSync(resolvedPath, "utf-8").trim();
      if (!content) {
        return {};
      }
      try {
        const config = JSON.parse(content);
        return validateConfig(config);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in config file ${resolvedPath}: ${error.message}`);
        }
        throw error;
      }
    }
    function validateConfig(config) {
      if (typeof config !== "object" || config === null || Array.isArray(config)) {
        throw new Error("Config must be a JSON object");
      }
      const result = {};
      if (config.language !== void 0) {
        if (typeof config.language !== "string") {
          throw new Error('Config "language" must be a string');
        }
        result.language = config.language;
      }
      if (config.preserveLicense !== void 0) {
        if (typeof config.preserveLicense !== "boolean") {
          throw new Error('Config "preserveLicense" must be a boolean');
        }
        result.preserveLicense = config.preserveLicense;
      }
      if (config.keepEmptyLines !== void 0) {
        if (typeof config.keepEmptyLines !== "boolean") {
          throw new Error('Config "keepEmptyLines" must be a boolean');
        }
        result.keepEmptyLines = config.keepEmptyLines;
      }
      if (config.exclude !== void 0) {
        if (!Array.isArray(config.exclude) || !config.exclude.every((e) => typeof e === "string")) {
          throw new Error('Config "exclude" must be an array of strings');
        }
        result.exclude = config.exclude;
      }
      if (config.include !== void 0) {
        if (!Array.isArray(config.include) || !config.include.every((e) => typeof e === "string")) {
          throw new Error('Config "include" must be an array of strings');
        }
        result.include = config.include;
      }
      return result;
    }
    function mergeConfig(config, options) {
      return {
        ...config,
        ...Object.fromEntries(Object.entries(options).filter(([_, v]) => v !== void 0))
      };
    }
  }
});

// node_modules/comment-bear/dist/removers/_shared.js
var require_shared = __commonJS({
  "node_modules/comment-bear/dist/removers/_shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isLicenseComment = isLicenseComment;
    exports2.removeBySpec = removeBySpec;
    function isLicenseComment(comment) {
      const lower = comment.toLowerCase();
      return lower.includes("copyright") || lower.includes("license") || lower.includes("licence") || lower.includes("spdx") || lower.includes("@license") || lower.includes("@copyright") || lower.includes("@author") || lower.includes("author");
    }
    var DEFAULT_STRINGS = [
      { open: '"', close: '"', escape: "\\", multiline: false }
    ];
    function isLineTerminator(ch) {
      const code = ch.charCodeAt(0);
      return code === 10 || code === 13 || code === 8232 || code === 8233;
    }
    function dropBlankLines(text) {
      const lines = text.split("\n");
      const cleaned = [];
      for (const line of lines) {
        if (line.trim().length > 0) {
          cleaned.push(line);
        }
      }
      if (cleaned.length > 0) {
        cleaned[cleaned.length - 1] = cleaned[cleaned.length - 1].replace(/\r$/, "");
      }
      return cleaned.join("\n");
    }
    function trimTrailingWhitespaceOnLastLine(result) {
      const nl = result.lastIndexOf("\n");
      if (nl === -1) {
        return result.replace(/[ \t]+$/, "");
      }
      const head = result.substring(0, nl + 1);
      const tail = result.substring(nl + 1).replace(/[ \t]+$/, "");
      return head + tail;
    }
    function onlyWhitespaceBeforeOnLine(code, index) {
      let k = index - 1;
      while (k >= 0 && code[k] !== "\n") {
        if (code[k] !== " " && code[k] !== "	" && code[k] !== "\r") {
          return false;
        }
        k--;
      }
      return true;
    }
    var REGEX_PREFIX_CHARS = /* @__PURE__ */ new Set([
      "(",
      ",",
      "=",
      ":",
      "[",
      "!",
      "&",
      "|",
      "?",
      "{",
      "}",
      ";",
      "+",
      "-",
      "*",
      "%",
      "^",
      "~"
    ]);
    var REGEX_PREFIX_KEYWORDS = /* @__PURE__ */ new Set([
      "return",
      "typeof",
      "instanceof",
      "in",
      "of",
      "new",
      "delete",
      "void",
      "do",
      "else",
      "yield",
      "await",
      "case"
    ]);
    function isIdentChar(ch) {
      return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_" || ch === "$";
    }
    function updatePrevToken(state, ch) {
      if (ch === " " || ch === "	" || ch === "\r" || ch === "\n") {
        return;
      }
      if (isIdentChar(ch)) {
        if (state.prevKind === "word") {
          state.prevWord += ch;
        } else if (state.prevKind === "number") {
        } else {
          if (ch >= "0" && ch <= "9") {
            state.prevKind = "number";
          } else {
            state.prevKind = "word";
            state.prevWord = ch;
          }
        }
        state.prevChar = ch;
        return;
      }
      const prevChar = state.prevChar;
      const prevKind = state.prevKind;
      if ((ch === "+" || ch === "-") && prevChar === ch && prevKind === "__pre_incdec__") {
        state.prevKind = "value";
        state.prevChar = ch;
        return;
      }
      if (ch === "+" || ch === "-") {
        if (prevKind === "word" || prevKind === "number" || prevKind === "value") {
          state.prevKind = "__pre_incdec__";
        } else {
          state.prevKind = "punct";
        }
        state.prevChar = ch;
        return;
      }
      if (ch === ")" || ch === "]") {
        state.prevKind = "value";
        state.prevChar = ch;
        return;
      }
      state.prevKind = "punct";
      state.prevChar = ch;
    }
    function markValueLiteral(state, lastChar) {
      state.prevKind = "value";
      state.prevChar = lastChar || "x";
    }
    function regexCanStart(state) {
      switch (state.prevKind) {
        case "none":
          return true;
        case "value":
        case "number":
          return false;
        case "word":
          return REGEX_PREFIX_KEYWORDS.has(state.prevWord);
        case "punct":
        default:
          if (REGEX_PREFIX_CHARS.has(state.prevChar))
            return true;
          return false;
      }
    }
    function scanRegexLiteral(code, start) {
      const len = code.length;
      let j = start + 1;
      let inClass = false;
      while (j < len) {
        const c = code[j];
        if (c === "\\") {
          if (j + 1 >= len)
            return -1;
          j += 2;
          continue;
        }
        if (isLineTerminator(c)) {
          return -1;
        }
        if (inClass) {
          if (c === "]")
            inClass = false;
          j++;
          continue;
        }
        if (c === "[") {
          inClass = true;
          j++;
          continue;
        }
        if (c === "/") {
          j++;
          while (j < len && /[a-z]/i.test(code[j])) {
            j++;
          }
          return j;
        }
        j++;
      }
      return -1;
    }
    function removeBySpec(code, spec, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      try {
        const strings = spec.strings && spec.strings.length > 0 ? spec.strings : DEFAULT_STRINGS;
        const blocks = spec.block || [];
        const lines = spec.line || [];
        const preserve = spec.preserve || [];
        let result = "";
        let i = 0;
        const len = code.length;
        const regexLiterals = spec.regexLiterals === true;
        const preserveInlineBlockWhitespace = spec.preserveInlineBlockWhitespace === true;
        const charLiteralPrefixes = spec.charLiteralPrefixes || [];
        const maxIterations = len * 4 + 16;
        let iterations = 0;
        const state = { prevKind: "none", prevChar: "", prevWord: "" };
        while (i < len) {
          if (++iterations > maxIterations) {
            return code;
          }
          if (regexLiterals && code[i] === "/" && code[i + 1] !== "/" && code[i + 1] !== "*") {
            if (regexCanStart(state)) {
              const end = scanRegexLiteral(code, i);
              if (end !== -1) {
                result += code.substring(i, end);
                markValueLiteral(state, code[end - 1]);
                i = end;
                continue;
              }
            }
          }
          let matchedLineStart = false;
          for (const l of lines) {
            if (!l.onlyAtLineStart)
              continue;
            if (!code.startsWith(l.token, i))
              continue;
            if (!onlyWhitespaceBeforeOnLine(code, i))
              continue;
            if (l.notIfFollowedBy && l.notIfFollowedBy.length > 0) {
              const after = code.substring(i + l.token.length);
              if (l.notIfFollowedBy.some((s) => s.length > 0 && after.startsWith(s))) {
                continue;
              }
            }
            let j = i + l.token.length;
            let commentText = l.token;
            while (j < len && !isLineTerminator(code[j])) {
              commentText += code[j];
              j++;
            }
            const keep = preserveLicense && isLicenseComment(commentText) || preserve.some((re) => re.test(commentText));
            if (keep) {
              result += commentText;
            } else {
              result = trimTrailingWhitespaceOnLastLine(result);
            }
            i = j;
            matchedLineStart = true;
            break;
          }
          if (matchedLineStart)
            continue;
          if (charLiteralPrefixes.length > 0) {
            let matchedCharLiteral = false;
            for (const prefix of charLiteralPrefixes) {
              if (prefix.length === 0 || !code.startsWith(prefix, i))
                continue;
              const next = code[i + prefix.length];
              if (next === void 0)
                continue;
              if (next === " " || next === "	" || next === "\n" || next === "\r") {
                continue;
              }
              if (next === "\\" && code[i + prefix.length + 1] !== void 0) {
                result += code.substring(i, i + prefix.length + 2);
                i += prefix.length + 2;
              } else {
                result += code.substring(i, i + prefix.length + 1);
                i += prefix.length + 1;
              }
              if (regexLiterals)
                markValueLiteral(state, next);
              matchedCharLiteral = true;
              break;
            }
            if (matchedCharLiteral)
              continue;
          }
          let matchedString = false;
          for (const s of strings) {
            if (code.startsWith(s.open, i)) {
              const escape = s.escape === void 0 ? "\\" : s.escape;
              const multiline = s.multiline === true;
              let j = i + s.open.length;
              result += s.open;
              while (j < len) {
                if (escape !== null && code[j] === escape && j + 1 < len) {
                  result += code[j] + code[j + 1];
                  j += 2;
                  continue;
                }
                if (!multiline && code[j] === "\n") {
                  break;
                }
                if (code.startsWith(s.close, j)) {
                  result += s.close;
                  j += s.close.length;
                  break;
                }
                result += code[j];
                j++;
              }
              i = j;
              matchedString = true;
              if (regexLiterals)
                markValueLiteral(state, s.close);
              break;
            }
          }
          if (matchedString)
            continue;
          let matchedBlock = false;
          for (const b of blocks) {
            if (code.startsWith(b.open, i)) {
              let commentContent = b.open;
              let j = i + b.open.length;
              if (b.nested) {
                let depth = 1;
                const innerStrings = b.skipStringsInside || [];
                while (j < len && depth > 0) {
                  if (innerStrings.length > 0) {
                    let skippedString = false;
                    for (const s of innerStrings) {
                      if (!code.startsWith(s.open, j))
                        continue;
                      const escape = s.escape === void 0 ? "\\" : s.escape;
                      const multiline = s.multiline === true;
                      let q = j + s.open.length;
                      commentContent += s.open;
                      while (q < len) {
                        if (escape !== null && code[q] === escape && q + 1 < len) {
                          commentContent += code[q] + code[q + 1];
                          q += 2;
                          continue;
                        }
                        if (!multiline && code[q] === "\n") {
                          break;
                        }
                        if (code.startsWith(s.close, q)) {
                          commentContent += s.close;
                          q += s.close.length;
                          break;
                        }
                        commentContent += code[q];
                        q++;
                      }
                      j = q;
                      skippedString = true;
                      break;
                    }
                    if (skippedString)
                      continue;
                  }
                  if (code.startsWith(b.open, j)) {
                    depth++;
                    commentContent += b.open;
                    j += b.open.length;
                  } else if (code.startsWith(b.close, j)) {
                    depth--;
                    commentContent += b.close;
                    j += b.close.length;
                  } else {
                    commentContent += code[j];
                    j++;
                  }
                }
              } else {
                const closeAt = code.indexOf(b.close, j);
                if (closeAt === -1) {
                  commentContent += code.substring(j);
                  j = len;
                } else {
                  commentContent += code.substring(j, closeAt + b.close.length);
                  j = closeAt + b.close.length;
                }
              }
              const keep = preserveLicense && isLicenseComment(commentContent) || preserve.some((re) => re.test(commentContent));
              if (keep) {
                result += commentContent;
              } else {
                if (keepEmptyLines) {
                  const newlines = (commentContent.match(/\n/g) || []).length;
                  result += "\n".repeat(newlines);
                }
                if (!commentContent.includes("\n")) {
                  const fullLine = onlyWhitespaceBeforeOnLine(code, i);
                  if (fullLine || !preserveInlineBlockWhitespace) {
                    result = trimTrailingWhitespaceOnLastLine(result);
                  }
                }
              }
              i = j;
              matchedBlock = true;
              break;
            }
          }
          if (matchedBlock)
            continue;
          let matchedLine = false;
          for (const l of lines) {
            if (!code.startsWith(l.token, i))
              continue;
            if (l.ignoreIfEscaped && i > 0 && code[i - 1] === "\\") {
              continue;
            }
            if (l.requireWhitespaceBefore) {
              const prev = i > 0 ? code[i - 1] : "\n";
              const prevIsWs = prev === " " || prev === "	" || prev === "\r" || prev === "\n";
              if (!prevIsWs && !onlyWhitespaceBeforeOnLine(code, i)) {
                continue;
              }
            }
            if (l.onlyAtLineStart && !onlyWhitespaceBeforeOnLine(code, i)) {
              continue;
            }
            if (l.notIfFollowedBy && l.notIfFollowedBy.length > 0) {
              const after = code.substring(i + l.token.length);
              if (l.notIfFollowedBy.some((s) => s.length > 0 && after.startsWith(s))) {
                continue;
              }
            }
            let j = i + l.token.length;
            let commentText = l.token;
            while (j < len && !isLineTerminator(code[j])) {
              commentText += code[j];
              j++;
            }
            const keep = preserveLicense && isLicenseComment(commentText) || preserve.some((re) => re.test(commentText));
            if (keep) {
              result += commentText;
            } else {
              const fullLine = onlyWhitespaceBeforeOnLine(code, i);
              if (fullLine || !preserveInlineBlockWhitespace) {
                result = trimTrailingWhitespaceOnLastLine(result);
              }
            }
            i = j;
            matchedLine = true;
            break;
          }
          if (matchedLine)
            continue;
          result += code[i];
          if (regexLiterals)
            updatePrevToken(state, code[i]);
          i++;
        }
        if (!keepEmptyLines) {
          result = dropBlankLines(result);
        }
        return result;
      } catch (error) {
        return code;
      }
    }
  }
});

// node_modules/comment-bear/dist/removers/javascript-remover.js
var require_javascript_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/javascript-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeJavaScriptComments = removeJavaScriptComments;
    exports2.removeTypeScriptComments = removeTypeScriptComments;
    var _shared_1 = require_shared();
    function jsSpec(preserveLicense) {
      return {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/", nested: true }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" },
          { open: "`", close: "`", escape: "\\", multiline: true }
        ],
        regexLiterals: true,
        preserveInlineBlockWhitespace: true,
        preserve: preserveLicense ? [/^\/\*!/] : []
      };
    }
    function removeJavaScriptComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      let processedCode = code;
      if (preserveLicense) {
        processedCode = code.replace(/\/\*\*[\s\S]*?@license[\s\S]*?\*\//g, (match) => {
          return match.replace("/**", "/*!");
        });
        processedCode = processedCode.replace(/\/\*\*[\s\S]*?@(copyright|author)[\s\S]*?\*\//g, (match) => {
          return match.replace("/**", "/*!");
        });
        processedCode = processedCode.replace(/\/\/\s*@(license|copyright)[^\n]*/g, (match) => {
          return "/*!" + match.substring(2) + "*/";
        });
      }
      if (keepEmptyLines) {
        return removeCommentsPreservingLines(processedCode, preserveLicense);
      }
      const result = (0, _shared_1.removeBySpec)(processedCode, jsSpec(preserveLicense), preserveLicense, false);
      return trimEmptyLines(result);
    }
    function removeTypeScriptComments(code, preserveLicense = false, keepEmptyLines = false) {
      return removeJavaScriptComments(code, preserveLicense, keepEmptyLines);
    }
    function trimEmptyLines(code) {
      const lines = code.split("\n");
      while (lines.length > 0 && lines[0].trim() === "") {
        lines.shift();
      }
      while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
      }
      if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].replace(/\r$/, "");
      }
      return lines.join("\n");
    }
    function removeCommentsPreservingLines(code, preserveLicense) {
      const lines = code.split("\n");
      const result = [];
      let inMultilineComment = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inMultilineComment) {
          const commentStart = findCommentStart(line);
          if (commentStart !== -1 && line.substring(commentStart).startsWith("/*")) {
            const beforeComment = line.substring(0, commentStart).trimEnd();
            const isProtected = preserveLicense && (line.substring(commentStart).startsWith("/*!") || line.substring(commentStart).toLowerCase().includes("license") || line.substring(commentStart).toLowerCase().includes("copyright"));
            if (isProtected) {
              result.push(line);
              if (line.indexOf("*/", commentStart + 2) === -1) {
                inMultilineComment = true;
              }
              continue;
            }
            const commentEnd = line.indexOf("*/", commentStart + 2);
            if (commentEnd !== -1) {
              const afterComment = line.substring(commentEnd + 2);
              if (beforeComment.length === 0 && afterComment.trim().length === 0) {
                const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
                if (nextLine.trim().length === 0) {
                  continue;
                } else {
                  result.push("");
                }
              } else {
                result.push((beforeComment + afterComment).trimEnd());
              }
            } else {
              inMultilineComment = true;
              if (beforeComment.length > 0) {
                result.push(beforeComment);
              } else {
                const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
                if (nextLine.trim().length === 0) {
                  continue;
                } else {
                  result.push("");
                }
              }
            }
            continue;
          }
        } else {
          if (line.indexOf("*/") !== -1) {
            inMultilineComment = false;
            const afterComment = line.substring(line.indexOf("*/") + 2);
            if (afterComment.trim().length > 0) {
              result.push(afterComment.trimEnd());
            } else {
              const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
              if (nextLine.trim().length === 0) {
                continue;
              } else {
                result.push("");
              }
            }
          } else {
            continue;
          }
          continue;
        }
        const commentIndex = findCommentStart(line);
        if (commentIndex !== -1 && line.substring(commentIndex).startsWith("//")) {
          const beforeComment = line.substring(0, commentIndex).trimEnd();
          const comment = line.substring(commentIndex);
          const isLicense = preserveLicense && (comment.includes("@license") || comment.toLowerCase().includes("license") || comment.toLowerCase().includes("copyright"));
          if (isLicense) {
            result.push(line);
          } else if (beforeComment.length > 0) {
            result.push(beforeComment);
          } else {
            const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
            if (nextLine.trim().length === 0) {
              continue;
            } else {
              result.push("");
            }
          }
          continue;
        }
        result.push(line);
      }
      return result.join("\n");
    }
    function findCommentStart(line) {
      let inString = false;
      let stringChar = "";
      let inRegex = false;
      let escapeNext = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i < line.length - 1 ? line[i + 1] : "";
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\" && (inString || inRegex)) {
          escapeNext = true;
          continue;
        }
        if (char === '"' || char === "'" || char === "`") {
          if (!inString && !inRegex) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar) {
            inString = false;
          }
          continue;
        }
        if (char === "/" && !inString && !inRegex) {
          if (nextChar === "/" || nextChar === "*") {
            return i;
          }
          if (i > 0 && /[=,([]/.test(line[i - 1])) {
            inRegex = true;
          }
          continue;
        }
        if (char === "/" && inRegex) {
          inRegex = false;
          continue;
        }
      }
      return -1;
    }
  }
});

// node_modules/comment-bear/dist/removers/python-remover.js
var require_python_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/python-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removePythonComments = removePythonComments;
    var _shared_1 = require_shared();
    function removePythonComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const lines = code.split("\n");
      const result = [];
      let inMultilineString = false;
      let multilineQuote = "";
      let skipDocstring = false;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();
        if (!inMultilineString) {
          const tripleDoubleMatch = line.indexOf('"""');
          const tripleSingleMatch = line.indexOf("'''");
          let matchIndex = -1;
          let quote = "";
          if (tripleDoubleMatch !== -1 && (tripleSingleMatch === -1 || tripleDoubleMatch < tripleSingleMatch)) {
            matchIndex = tripleDoubleMatch;
            quote = '"""';
          } else if (tripleSingleMatch !== -1) {
            matchIndex = tripleSingleMatch;
            quote = "'''";
          }
          if (matchIndex !== -1) {
            const afterQuote = line.substring(matchIndex + 3);
            const closingIndex = afterQuote.indexOf(quote);
            if (closingIndex !== -1) {
              const beforeQuote = line.substring(0, matchIndex);
              const isDocstring = beforeQuote.trim().length === 0 && isDocstringContext(lines, i);
              if (isDocstring && !preserveLicense) {
                if (keepEmptyLines) {
                  result.push("");
                }
                continue;
              } else {
                result.push(line);
                continue;
              }
            } else {
              const beforeQuote = line.substring(0, matchIndex);
              const isDocstring = beforeQuote.trim().length === 0 && isDocstringContext(lines, i);
              if (isDocstring) {
                skipDocstring = !preserveLicense || !(0, _shared_1.isLicenseComment)(line);
                inMultilineString = true;
                multilineQuote = quote;
                if (!skipDocstring) {
                  result.push(line);
                } else if (keepEmptyLines) {
                  result.push("");
                }
                continue;
              } else {
                inMultilineString = true;
                multilineQuote = quote;
                result.push(line);
                continue;
              }
            }
          }
        } else {
          if (line.includes(multilineQuote)) {
            inMultilineString = false;
            multilineQuote = "";
            if (!skipDocstring) {
              result.push(line);
            }
            skipDocstring = false;
            continue;
          }
          if (!skipDocstring) {
            result.push(line);
          } else if (keepEmptyLines) {
            result.push("");
          }
          continue;
        }
        if (trimmed.startsWith("#")) {
          if (preserveLicense && (0, _shared_1.isLicenseComment)(trimmed)) {
            result.push(line);
          } else if (keepEmptyLines) {
            result.push("");
          }
          continue;
        }
        const commentIndex = findCommentIndex(line);
        if (commentIndex !== -1) {
          const codeBeforeComment = line.substring(0, commentIndex).trimEnd();
          if (codeBeforeComment.length > 0) {
            result.push(codeBeforeComment);
          } else if (keepEmptyLines) {
            result.push("");
          }
          continue;
        }
        result.push(line);
      }
      return result.join("\n");
    }
    function isDocstringContext(lines, index) {
      if (index === 0)
        return false;
      for (let i = index - 1; i >= 0; i--) {
        const prevLine = lines[i].trim();
        if (prevLine.length === 0) {
          continue;
        }
        if (prevLine.startsWith("def ") || prevLine.startsWith("class ") || prevLine.startsWith("async def ") || prevLine.endsWith(":")) {
          return true;
        }
        return false;
      }
      return false;
    }
    function findCommentIndex(line) {
      let inString = false;
      let stringChar = "";
      let escapeNext = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === '"' || char === "'") {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
          continue;
        }
        if (char === "#" && !inString) {
          return i;
        }
      }
      return -1;
    }
  }
});

// node_modules/comment-bear/dist/removers/css-html-remover.js
var require_css_html_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/css-html-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeCssComments = removeCssComments;
    exports2.removeHtmlComments = removeHtmlComments;
    exports2.removeXmlComments = removeXmlComments;
    function droppedReplacement(match, keepEmptyLines) {
      if (!keepEmptyLines) {
        return "";
      }
      const newlines = (match.match(/\n/g) || []).length;
      return "\n".repeat(newlines);
    }
    function removeCssComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const protectedStrings = [];
      let stringIndex = 0;
      const stringPattern = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
      const withProtectedStrings = code.replace(stringPattern, (match) => {
        const id = `__CSS_STRING_${stringIndex++}__`;
        protectedStrings.push({ id, content: match });
        return id;
      });
      const commentRegex = /\/\*[\s\S]*?\*\//g;
      let result;
      if (!preserveLicense) {
        result = withProtectedStrings.replace(commentRegex, (match) => droppedReplacement(match, keepEmptyLines));
      } else {
        result = withProtectedStrings.replace(commentRegex, (match) => {
          const lower = match.toLowerCase();
          if (lower.includes("copyright") || lower.includes("license") || lower.includes("licence") || lower.includes("author") || match.startsWith("/*!")) {
            return match;
          }
          return droppedReplacement(match, keepEmptyLines);
        });
      }
      return result.replace(/__CSS_STRING_(\d+)__/g, (_, index) => {
        const s = protectedStrings[parseInt(index)];
        return s ? s.content : "";
      });
    }
    function removeHtmlComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const commentRegex = /<!--[\s\S]*?-->/g;
      if (!preserveLicense) {
        return code.replace(commentRegex, (match) => droppedReplacement(match, keepEmptyLines));
      }
      return code.replace(commentRegex, (match) => {
        const lower = match.toLowerCase();
        if (lower.includes("copyright") || lower.includes("license") || lower.includes("licence") || lower.includes("author")) {
          return match;
        }
        return droppedReplacement(match, keepEmptyLines);
      });
    }
    function removeXmlComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const cdataSections = [];
      let cdataIndex = 0;
      const withCdataPlaceholders = code.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (match) => {
        const id = `__CDATA_${cdataIndex++}__`;
        cdataSections.push({ id, content: match });
        return id;
      });
      const commentRegex = /<!--[\s\S]*?-->/g;
      let processedCode;
      if (!preserveLicense) {
        processedCode = withCdataPlaceholders.replace(commentRegex, (match) => droppedReplacement(match, keepEmptyLines));
      } else {
        processedCode = withCdataPlaceholders.replace(commentRegex, (match) => {
          const lower = match.toLowerCase();
          if (lower.includes("copyright") || lower.includes("license") || lower.includes("licence") || lower.includes("author")) {
            return match;
          }
          return droppedReplacement(match, keepEmptyLines);
        });
      }
      return processedCode.replace(/__CDATA_(\d+)__/g, (_, index) => {
        const cdata = cdataSections[parseInt(index)];
        return cdata ? cdata.content : "";
      });
    }
  }
});

// node_modules/comment-bear/dist/removers/sql-remover.js
var require_sql_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/sql-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeSqlComments = removeSqlComments;
    var _shared_1 = require_shared();
    var SQL_SPEC = {
      line: [{ token: "--" }],
      block: [{ open: "/*", close: "*/" }],
      strings: [
        { open: "'", close: "'", escape: "\\" },
        { open: '"', close: '"', escape: "\\" }
      ]
    };
    function removeSqlComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      return (0, _shared_1.removeBySpec)(code, SQL_SPEC, preserveLicense, keepEmptyLines);
    }
  }
});

// node_modules/comment-bear/dist/removers/c-style-remover.js
var require_c_style_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/c-style-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeJavaComments = removeJavaComments;
    exports2.removeCSharpComments = removeCSharpComments;
    exports2.removeCComments = removeCComments;
    exports2.removeCppComments = removeCppComments;
    exports2.removePhpComments = removePhpComments;
    exports2.removeGoComments = removeGoComments;
    exports2.removeRustComments = removeRustComments;
    exports2.removeSwiftComments = removeSwiftComments;
    exports2.removeKotlinComments = removeKotlinComments;
    exports2.removeScalaComments = removeScalaComments;
    var javascript_remover_1 = require_javascript_remover();
    var _shared_1 = require_shared();
    function removeJavaComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function removeCSharpComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function removeCComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function removeCppComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const rawStringLiterals = [];
      let rawStringIndex = 0;
      const rawStringPattern = /R"([^()\r\n]*?)\(([\s\S]*?)\)\1"/g;
      const withProtectedLiterals = code.replace(rawStringPattern, (match) => {
        const id = `__RAW_STRING_${rawStringIndex++}__`;
        rawStringLiterals.push({ id, content: match });
        return id;
      });
      const processed = (0, javascript_remover_1.removeJavaScriptComments)(withProtectedLiterals, preserveLicense, keepEmptyLines);
      return processed.replace(/__RAW_STRING_(\d+)__/g, (_, index) => {
        const literal = rawStringLiterals[parseInt(index)];
        return literal ? literal.content : "";
      });
    }
    function removePhpComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const heredocPattern = /(<<<(['"]?)([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\2\s*\n[\s\S]*?\n\s*\3;?\n?)/g;
      const heredocMarkers = [];
      let heredocIndex = 0;
      const withProtectedHeredocs = code.replace(heredocPattern, (match) => {
        const id = `__HEREDOC_${heredocIndex++}__`;
        heredocMarkers.push({ id, content: match });
        return id;
      });
      let result = (0, javascript_remover_1.removeJavaScriptComments)(withProtectedHeredocs, preserveLicense, keepEmptyLines);
      const lines = result.split("\n");
      const finalLines = [];
      for (const line of lines) {
        const commentIndex = findHashCommentIndex(line);
        if (commentIndex === -1) {
          finalLines.push(line);
        } else {
          const codeBeforeComment = line.substring(0, commentIndex).trimEnd();
          const comment = line.substring(commentIndex);
          if (codeBeforeComment.length > 0) {
            if (preserveLicense && (0, _shared_1.isLicenseComment)(comment)) {
              finalLines.push(line);
            } else {
              finalLines.push(codeBeforeComment);
            }
          } else {
            if (preserveLicense && (0, _shared_1.isLicenseComment)(comment)) {
              finalLines.push(line);
            } else if (keepEmptyLines) {
              finalLines.push("");
            }
          }
        }
      }
      result = finalLines.join("\n");
      result = result.replace(/__HEREDOC_(\d+)__/g, (_, index) => {
        const marker = heredocMarkers[parseInt(index)];
        return marker ? marker.content : "";
      });
      return result;
    }
    function removeGoComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const buildTagPattern = /^(?:\/\/ \+build[^\n]*|\/\/go:[a-z]+[^\n]*)$/gm;
      const buildTags = [];
      let buildTagIndex = 0;
      const withProtectedBuildTags = code.replace(buildTagPattern, (match) => {
        const id = `__BUILD_TAG_${buildTagIndex++}__`;
        buildTags.push({ id, content: match });
        return id;
      });
      let result = (0, javascript_remover_1.removeJavaScriptComments)(withProtectedBuildTags, preserveLicense, keepEmptyLines);
      result = result.replace(/__BUILD_TAG_(\d+)__/g, (_, index) => {
        const tag = buildTags[parseInt(index)];
        return tag ? tag.content : "";
      });
      return result;
    }
    function removeRustComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const docCommentPattern = /(\/\/[/!].*$)/gm;
      const docComments = [];
      let docCommentIndex = 0;
      const withProtectedDocComments = code.replace(docCommentPattern, (match) => {
        if (preserveLicense && (0, _shared_1.isLicenseComment)(match)) {
          const id = `__DOC_COMMENT_${docCommentIndex++}__`;
          docComments.push({ id, content: match });
          return id;
        }
        return match;
      });
      let result = (0, javascript_remover_1.removeJavaScriptComments)(withProtectedDocComments, preserveLicense, keepEmptyLines);
      result = result.replace(/__DOC_COMMENT_(\d+)__/g, (_, index) => {
        const comment = docComments[parseInt(index)];
        return comment ? comment.content : "";
      });
      result = result.split("\n").map((line) => {
        if (line.includes("//") && line.includes("'")) {
          const commentIndex = line.indexOf("//");
          const codePart = line.substring(0, commentIndex);
          const commentPart = line.substring(commentIndex);
          const lifetimeMatch = codePart.match(/(['][a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
          if (lifetimeMatch) {
            const lifetimePart = lifetimeMatch[1];
            const beforeLifetime = codePart.substring(0, lifetimeMatch.index);
            return beforeLifetime + lifetimePart;
          }
          const quoteCount = (codePart.match(/"/g) || []).length;
          if (quoteCount % 2 === 0) {
            return codePart.trimEnd();
          }
        }
        return line;
      }).join("\n");
      return result;
    }
    function removeSwiftComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function removeKotlinComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function removeScalaComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
    }
    function findHashCommentIndex(line) {
      let inString = false;
      let stringChar = "";
      let escapeNext = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === '"' || char === "'") {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
          continue;
        }
        if (char === "#" && !inString) {
          if (line[i + 1] === "[") {
            continue;
          }
          return i;
        }
      }
      return -1;
    }
  }
});

// node_modules/comment-bear/dist/removers/other-remover.js
var require_other_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/other-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeJsonComments = removeJsonComments;
    exports2.removeYamlComments = removeYamlComments;
    exports2.removeRubyComments = removeRubyComments;
    exports2.removeHaskellComments = removeHaskellComments;
    var _shared_1 = require_shared();
    function removeJsonComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      try {
        let result = "";
        let inString = false;
        let inSingleLineComment = false;
        let inMultiLineComment = false;
        let stringChar = "";
        for (let i = 0; i < code.length; i++) {
          const char = code[i];
          const nextChar = i < code.length - 1 ? code[i + 1] : "";
          if (inString) {
            result += char;
            if (char === stringChar && code[i - 1] !== "\\") {
              inString = false;
            }
            continue;
          }
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
            result += char;
            continue;
          }
          if (inSingleLineComment) {
            if (char === "\n") {
              inSingleLineComment = false;
              result += char;
            }
            continue;
          }
          if (inMultiLineComment) {
            if (char === "*" && nextChar === "/") {
              inMultiLineComment = false;
              i++;
            } else if (char === "\n" && keepEmptyLines) {
              result += char;
            }
            continue;
          }
          if (char === "/" && nextChar === "/") {
            inSingleLineComment = true;
            i++;
            continue;
          }
          if (char === "/" && nextChar === "*") {
            inMultiLineComment = true;
            i++;
            continue;
          }
          result += char;
        }
        return result;
      } catch (error) {
        console.error("Error removing JSON comments:", error);
        return code;
      }
    }
    function removeYamlComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const lines = code.split("\n");
      const result = [];
      let inBlockScalar = false;
      let blockIndent = 0;
      const indentOf = (s) => {
        let n = 0;
        while (n < s.length && (s[n] === " " || s[n] === "	"))
          n++;
        return n;
      };
      for (const line of lines) {
        const trimmed = line.trim();
        if (inBlockScalar) {
          if (trimmed.length === 0 || indentOf(line) > blockIndent) {
            result.push(line);
            continue;
          }
          inBlockScalar = false;
        }
        if (trimmed.startsWith("#")) {
          if (preserveLicense && (0, _shared_1.isLicenseComment)(trimmed)) {
            result.push(line);
          } else if (keepEmptyLines) {
            result.push("");
          }
          continue;
        }
        const commentIndex = findYamlCommentIndex(line);
        let emitted;
        if (commentIndex !== -1) {
          const codeBeforeComment = line.substring(0, commentIndex).trimEnd();
          if (codeBeforeComment.length > 0) {
            emitted = codeBeforeComment;
            result.push(emitted);
          } else {
            emitted = "";
            if (keepEmptyLines)
              result.push("");
          }
        } else {
          emitted = line;
          result.push(line);
        }
        if (/(^|[\s:])[|>][0-9]*[-+]?\s*$/.test(emitted)) {
          inBlockScalar = true;
          blockIndent = indentOf(line);
        }
      }
      return result.join("\n");
    }
    function findYamlCommentIndex(line) {
      let inString = false;
      let stringChar = "";
      let escapeNext = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === '"' || char === "'") {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
          continue;
        }
        if (char === "#" && !inString) {
          const prev = i > 0 ? line[i - 1] : "";
          const atLineStart = i === 0 || line.substring(0, i).trim().length === 0;
          const precededByWhitespace = prev === " " || prev === "	";
          if (atLineStart || precededByWhitespace) {
            return i;
          }
        }
      }
      return -1;
    }
    var RUBY_PAIRED_DELIMITERS = {
      "(": ")",
      "[": "]",
      "{": "}",
      "<": ">"
    };
    function protectRubyLiterals(code) {
      const literals = [];
      let out = "";
      let i = 0;
      const n = code.length;
      let prevSignificant = "";
      const addPlaceholder = (content) => {
        const id = `__PERCENT_LITERAL_${literals.length}__`;
        literals.push(content);
        return id;
      };
      while (i < n) {
        const ch = code[i];
        if (ch === "\n") {
          out += ch;
          prevSignificant = "";
          i++;
          continue;
        }
        if (ch === " " || ch === "	") {
          out += ch;
          i++;
          continue;
        }
        if (ch === "#") {
          const eol = code.indexOf("\n", i);
          const end = eol === -1 ? n : eol;
          out += code.substring(i, end);
          i = end;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
          const quote = ch;
          let j = i + 1;
          while (j < n) {
            if (code[j] === "\\") {
              j += 2;
              continue;
            }
            if (code[j] === quote) {
              j++;
              break;
            }
            j++;
          }
          out += code.substring(i, j);
          prevSignificant = quote;
          i = j;
          continue;
        }
        if (ch === "%") {
          const prevIsValue = prevSignificant !== "" && isRubyValueChar(prevSignificant);
          let p = i + 1;
          if (p < n && /[qQrRwWiIsx]/.test(code[p])) {
            p++;
          }
          const delim = p < n ? code[p] : "";
          const delimIsValid = delim !== "" && /[^\w\s]/.test(delim);
          if (!prevIsValue && delimIsValid) {
            const close = RUBY_PAIRED_DELIMITERS[delim];
            let j = p + 1;
            let found = -1;
            if (close) {
              let depth = 1;
              while (j < n) {
                const c = code[j];
                if (c === "\\") {
                  j += 2;
                  continue;
                }
                if (c === delim) {
                  depth++;
                } else if (c === close) {
                  depth--;
                  if (depth === 0) {
                    found = j;
                    break;
                  }
                }
                j++;
              }
            } else {
              while (j < n) {
                const c = code[j];
                if (c === "\\") {
                  j += 2;
                  continue;
                }
                if (c === delim) {
                  found = j;
                  break;
                }
                j++;
              }
            }
            if (found !== -1) {
              out += addPlaceholder(code.substring(i, found + 1));
              prevSignificant = "a";
              i = found + 1;
              continue;
            }
          }
          out += ch;
          prevSignificant = "%";
          i++;
          continue;
        }
        if (ch === "<" && i + 1 < n && code[i + 1] === "<") {
          const prevIsValue = prevSignificant !== "" && isRubyValueChar(prevSignificant);
          const m = code.substring(i).match(/^<<([~-]?)(?:(['"])([A-Za-z_]\w*)\2|([A-Za-z_]\w*))/);
          if (!prevIsValue && m) {
            const squiggly = m[1];
            const tag = m[3] !== void 0 ? m[3] : m[4];
            const allowIndent = squiggly === "~" || squiggly === "-";
            const headerEnd = i + m[0].length;
            const bodyStart = code.indexOf("\n", headerEnd);
            if (bodyStart !== -1) {
              let lineStart = bodyStart + 1;
              let bodyEnd = -1;
              while (lineStart <= n) {
                let lineEnd = code.indexOf("\n", lineStart);
                if (lineEnd === -1)
                  lineEnd = n;
                const lineText = code.substring(lineStart, lineEnd);
                const matchesTag = allowIndent ? lineText.trim() === tag : lineText === tag;
                if (matchesTag) {
                  bodyEnd = lineEnd;
                  break;
                }
                if (lineEnd === n)
                  break;
                lineStart = lineEnd + 1;
              }
              if (bodyEnd !== -1) {
                out += code.substring(i, bodyStart + 1);
                out += addPlaceholder(code.substring(bodyStart + 1, bodyEnd));
                prevSignificant = "";
                i = bodyEnd;
                continue;
              }
            }
          }
          out += "<<";
          prevSignificant = "<";
          i += 2;
          continue;
        }
        out += ch;
        prevSignificant = ch;
        i++;
      }
      return { text: out, literals };
    }
    function removeRubyComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const { text: withProtectedLiterals, literals: percentLiterals } = protectRubyLiterals(code);
      let result = "";
      const lines = withProtectedLiterals.split("\n");
      let inMultilineComment = false;
      let multilineBuffer = [];
      let isLicenseBlock = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("=begin")) {
          inMultilineComment = true;
          multilineBuffer = [line];
          isLicenseBlock = preserveLicense && (0, _shared_1.isLicenseComment)(line);
          if (!isLicenseBlock && keepEmptyLines) {
            result += "\n";
          }
          continue;
        }
        if (inMultilineComment) {
          multilineBuffer.push(line);
          if (trimmed.startsWith("=end")) {
            inMultilineComment = false;
            if (preserveLicense) {
              const blockContent = multilineBuffer.join("\n");
              if (isLicenseBlock || (0, _shared_1.isLicenseComment)(blockContent)) {
                result += multilineBuffer.join("\n") + "\n";
              } else if (keepEmptyLines) {
                result += "\n".repeat(multilineBuffer.length);
              }
            } else if (keepEmptyLines) {
              result += "\n".repeat(multilineBuffer.length);
            }
            multilineBuffer = [];
            isLicenseBlock = false;
          }
          continue;
        }
        const commentIndex = findCommentIndex(line);
        if (commentIndex !== -1) {
          const codeBeforeComment = line.substring(0, commentIndex).trimEnd();
          const comment = line.substring(commentIndex);
          if (codeBeforeComment.length > 0) {
            if (preserveLicense && (0, _shared_1.isLicenseComment)(comment)) {
              result += line + "\n";
            } else {
              result += codeBeforeComment + "\n";
            }
          } else {
            if (preserveLicense && (0, _shared_1.isLicenseComment)(comment)) {
              result += line + "\n";
            } else if (keepEmptyLines) {
              result += "\n";
            }
          }
          continue;
        }
        result += line + "\n";
      }
      result = result.replace(/__PERCENT_LITERAL_(\d+)__/g, (_, index) => {
        const literal = percentLiterals[parseInt(index)];
        return literal !== void 0 ? literal : "";
      });
      return result.trimEnd();
    }
    function removeHaskellComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      let result = "";
      let i = 0;
      const len = code.length;
      while (i < len) {
        const char = code[i];
        const next = i + 1 < len ? code[i + 1] : "";
        if (char === '"') {
          let j = i + 1;
          result += char;
          while (j < len && code[j] !== '"') {
            if (code[j] === "\\" && j + 1 < len) {
              result += code[j] + code[j + 1];
              j += 2;
            } else {
              result += code[j];
              j++;
            }
          }
          if (j < len) {
            result += code[j];
            j++;
          }
          i = j;
          continue;
        }
        if (char === "'" && i + 2 < len) {
          if (code[i + 1] === "\\" && i + 3 < len && code[i + 3] === "'") {
            result += code.substring(i, i + 4);
            i += 4;
            continue;
          }
          if (code[i + 2] === "'") {
            result += code.substring(i, i + 3);
            i += 3;
            continue;
          }
        }
        if (char === "{" && next === "-" && i + 2 < len && code[i + 2] === "#") {
          const pragmaEnd = code.indexOf("#-}", i + 3);
          if (pragmaEnd !== -1) {
            result += code.substring(i, pragmaEnd + 3);
            i = pragmaEnd + 3;
            continue;
          }
        }
        if (char === "{" && next === "-") {
          let depth = 1;
          let j = i + 2;
          let commentContent = "{-";
          while (j < len && depth > 0) {
            if (code[j] === "{" && j + 1 < len && code[j + 1] === "-") {
              depth++;
              commentContent += "{-";
              j += 2;
            } else if (code[j] === "-" && j + 1 < len && code[j + 1] === "}") {
              depth--;
              commentContent += "-}";
              j += 2;
            } else {
              commentContent += code[j];
              j++;
            }
          }
          if (preserveLicense && (0, _shared_1.isLicenseComment)(commentContent)) {
            result += commentContent;
          } else if (keepEmptyLines) {
            const newlines = (commentContent.match(/\n/g) || []).length;
            result += "\n".repeat(newlines);
          }
          i = j;
          continue;
        }
        if (char === "-" && next === "-") {
          const afterDashes = i + 2 < len ? code[i + 2] : "\n";
          if (afterDashes === " " || afterDashes === "\n" || afterDashes === "\r" || afterDashes === "	" || i + 2 >= len || !/[!#$%&*+./<=>?@\\^|~:]/.test(afterDashes)) {
            let j = i + 2;
            let commentText = "--";
            while (j < len && code[j] !== "\n") {
              commentText += code[j];
              j++;
            }
            if (preserveLicense && (0, _shared_1.isLicenseComment)(commentText)) {
              result += commentText;
            }
            i = j;
            continue;
          }
        }
        result += char;
        i++;
      }
      if (!keepEmptyLines) {
        const lines = result.split("\n");
        const cleaned = [];
        for (const line of lines) {
          if (line.trim().length > 0) {
            cleaned.push(line);
          }
        }
        result = cleaned.join("\n");
      }
      return result;
    }
    function isRubyValueChar(ch) {
      return /[\w)\]}]/.test(ch) || ch.charCodeAt(0) > 127;
    }
    var RUBY_REGEX_KEYWORDS = /* @__PURE__ */ new Set([
      "when",
      "and",
      "or",
      "not",
      "if",
      "unless",
      "while",
      "until",
      "return",
      "then",
      "do",
      "else",
      "elsif",
      "case",
      "in",
      "begin"
    ]);
    function findCommentIndex(line) {
      let escapeNext = false;
      let prevSignificant = "";
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escapeNext) {
          escapeNext = false;
          prevSignificant = char;
          continue;
        }
        if (char === " " || char === "	") {
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          prevSignificant = char;
          continue;
        }
        if (char === '"' || char === "'" || char === "`") {
          const stringChar = char;
          i++;
          while (i < line.length) {
            const c = line[i];
            if (c === "\\") {
              i++;
            } else if (c === stringChar) {
              break;
            }
            i++;
          }
          prevSignificant = stringChar;
          continue;
        }
        if (char === "?") {
          const next = i + 1 < line.length ? line[i + 1] : "";
          const prevIsValue = prevSignificant !== "" && isRubyValueChar(prevSignificant);
          if (!prevIsValue && next !== "" && next !== " " && next !== "	") {
            if (next === "\\") {
              i += 2;
            } else {
              i += 1;
            }
            prevSignificant = "a";
            continue;
          }
          prevSignificant = "?";
          continue;
        }
        if (char === "/") {
          const prevIsValue = prevSignificant !== "" && isRubyValueChar(prevSignificant);
          let prevIsKeyword = false;
          if (prevIsValue) {
            const before = line.substring(0, i).trimEnd();
            const m = before.match(/(?:^|[^\w])([a-z]+)$/);
            if (m && RUBY_REGEX_KEYWORDS.has(m[1])) {
              prevIsKeyword = true;
            }
          }
          if (!prevIsValue || prevIsKeyword) {
            let j = i + 1;
            let inClass = false;
            let closed = false;
            while (j < line.length) {
              const c = line[j];
              if (c === "\\") {
                j += 2;
                continue;
              }
              if (c === "[") {
                inClass = true;
              } else if (c === "]") {
                inClass = false;
              } else if (c === "/" && !inClass) {
                closed = true;
                break;
              }
              j++;
            }
            if (closed) {
              i = j;
              prevSignificant = "/";
              continue;
            }
          }
          prevSignificant = "/";
          continue;
        }
        if (char === "#") {
          return i;
        }
        prevSignificant = char;
      }
      return -1;
    }
  }
});

// node_modules/comment-bear/dist/removers/hash-remover.js
var require_hash_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/hash-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeShellComments = removeShellComments;
    exports2.removePowerShellComments = removePowerShellComments;
    exports2.removePerlComments = removePerlComments;
    exports2.removeRComments = removeRComments;
    exports2.removeTomlComments = removeTomlComments;
    exports2.removeMakefileComments = removeMakefileComments;
    exports2.removeDockerfileComments = removeDockerfileComments;
    exports2.removeIniComments = removeIniComments;
    exports2.removeGraphqlComments = removeGraphqlComments;
    exports2.removeElixirComments = removeElixirComments;
    exports2.removeCrystalComments = removeCrystalComments;
    exports2.removeJuliaComments = removeJuliaComments;
    exports2.removeNimComments = removeNimComments;
    exports2.removeCoffeeScriptComments = removeCoffeeScriptComments;
    exports2.removeTclComments = removeTclComments;
    exports2.removeCMakeComments = removeCMakeComments;
    exports2.removePropertiesComments = removePropertiesComments;
    exports2.removePuppetComments = removePuppetComments;
    exports2.removeHclComments = removeHclComments;
    exports2.removeScssComments = removeScssComments;
    exports2.removeLessComments = removeLessComments;
    exports2.removeSassComments = removeSassComments;
    var _shared_1 = require_shared();
    function removeShellComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        // In shell a `#` only starts a comment at the start of a word, i.e. at the
        // start of a line or immediately after whitespace. This protects `$#`,
        // `${#arr}`, `$((2#101))` and mid-word `a#b`.
        line: [{ token: "#", requireWhitespaceBefore: true }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: null }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removePowerShellComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const { masked, regions } = maskPowerShellHereStrings(code);
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "<#", close: "#>" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'", escape: null }
        ]
      };
      let out = (0, _shared_1.removeBySpec)(masked, spec, preserveLicense, keepEmptyLines);
      for (let k = 0; k < regions.length; k++) {
        const re = new RegExp(" ?" + placeholderCore(k) + " ?");
        out = out.replace(re, () => regions[k]);
      }
      return out;
    }
    function placeholderCore(k) {
      return "CBHERESTRING" + String(k);
    }
    function herePlaceholder(k) {
      return " " + placeholderCore(k) + " ";
    }
    function maskPowerShellHereStrings(code) {
      const regions = [];
      let masked = "";
      let i = 0;
      const len = code.length;
      while (i < len) {
        if (code[i] === "@" && (code[i + 1] === '"' || code[i + 1] === "'")) {
          const quote = code[i + 1];
          let k = i + 2;
          while (k < len && code[k] !== "\n" && (code[k] === " " || code[k] === "	" || code[k] === "\r")) {
            k++;
          }
          if (k >= len || code[k] === "\n") {
            const closer = quote + "@";
            let lineStart = code.indexOf("\n", i);
            if (lineStart !== -1) {
              lineStart += 1;
              let end = -1;
              let p = lineStart;
              while (p <= len) {
                if (code.startsWith(closer, p)) {
                  end = p + closer.length;
                  break;
                }
                const nextNl = code.indexOf("\n", p);
                if (nextNl === -1)
                  break;
                p = nextNl + 1;
              }
              if (end !== -1) {
                const region = code.substring(i, end);
                masked += herePlaceholder(regions.length);
                regions.push(region);
                i = end;
                continue;
              }
            }
          }
        }
        masked += code[i];
        i++;
      }
      return { masked, regions };
    }
    function removePerlComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const withoutPod = removePodBlocks(code, preserveLicense, keepEmptyLines);
      const spec = {
        line: [{ token: "#" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'", escape: null }
        ]
      };
      return (0, _shared_1.removeBySpec)(withoutPod, spec, preserveLicense, keepEmptyLines);
    }
    function removePodBlocks(code, preserveLicense, keepEmptyLines) {
      const lines = code.split("\n");
      const result = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (/^=[a-zA-Z]\w*/.test(line)) {
          const block = [];
          while (i < lines.length) {
            block.push(lines[i]);
            if (/^=cut\b/.test(lines[i])) {
              i++;
              break;
            }
            i++;
          }
          const blockText = block.join("\n");
          if (preserveLicense && (0, _shared_1.isLicenseComment)(blockText)) {
            result.push(...block);
          } else if (keepEmptyLines) {
            for (let k = 0; k < block.length; k++) {
              result.push("");
            }
          }
          continue;
        }
        result.push(line);
        i++;
      }
      return result.join("\n");
    }
    function removeRComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeTomlComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        strings: [
          { open: '"""', close: '"""', multiline: true },
          { open: "'''", close: "'''", multiline: true, escape: null },
          { open: '"', close: '"' },
          { open: "'", close: "'", escape: null }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeMakefileComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        // In a Makefile a backslash escapes the `#` to a literal (`a\#b`), so an
        // escaped `#` is not a comment.
        line: [{ token: "#", ignoreIfEscaped: true }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeDockerfileComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        preserve: [/^#\s*(syntax|escape)=/i]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeIniComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }, { token: ";" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeGraphqlComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        strings: [
          { open: '"""', close: '"""', multiline: true },
          { open: '"', close: '"' }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeElixirComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        // Elixir char literals are written `?X` (or `?\n`); `?#` is the char `#`,
        // not a comment. Protect the `?` + next-char pair.
        charLiteralPrefixes: ["?"],
        strings: [
          { open: '"""', close: '"""', multiline: true },
          { open: '"', close: '"' }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeCrystalComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeJuliaComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "#=", close: "=#", nested: true }],
        strings: [
          { open: '"""', close: '"""', multiline: true },
          { open: '"', close: '"' }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeNimComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "#[", close: "]#", nested: true }],
        strings: [
          { open: '"""', close: '"""', multiline: true },
          { open: '"', close: '"' }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeCoffeeScriptComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "###", close: "###" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeTclComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        strings: [{ open: '"', close: '"' }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeCMakeComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "#[[", close: "]]" }],
        strings: [{ open: '"', close: '"' }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removePropertiesComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        // In a `.properties` file a backslash escapes the comment char to a
        // literal (`a\#b`), so an escaped `#`/`!` is not a comment.
        line: [
          { token: "#", ignoreIfEscaped: true },
          { token: "!", ignoreIfEscaped: true }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removePuppetComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeHclComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "#" }, { token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [{ open: '"', close: '"' }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    var CSS_PREPROCESSOR_SPEC = {
      line: [{ token: "//" }],
      block: [{ open: "/*", close: "*/" }],
      strings: [
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    };
    function removeScssComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, CSS_PREPROCESSOR_SPEC, preserveLicense, keepEmptyLines);
    }
    function removeLessComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, CSS_PREPROCESSOR_SPEC, preserveLicense, keepEmptyLines);
    }
    function removeSassComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, CSS_PREPROCESSOR_SPEC, preserveLicense, keepEmptyLines);
    }
  }
});

// node_modules/comment-bear/dist/removers/cstyle-extra-remover.js
var require_cstyle_extra_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/cstyle-extra-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeDartComments = removeDartComments;
    exports2.removeGroovyComments = removeGroovyComments;
    exports2.removeSolidityComments = removeSolidityComments;
    exports2.removeProtobufComments = removeProtobufComments;
    exports2.removeObjectiveCComments = removeObjectiveCComments;
    exports2.removeZigComments = removeZigComments;
    exports2.removeValaComments = removeValaComments;
    exports2.removeDComments = removeDComments;
    exports2.removeGlslComments = removeGlslComments;
    exports2.removeHlslComments = removeHlslComments;
    exports2.removeWgslComments = removeWgslComments;
    exports2.removeJson5Comments = removeJson5Comments;
    var _shared_1 = require_shared();
    function removeDartComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/", nested: true }],
        strings: [
          // Triple-quoted strings must be matched BEFORE the single-char forms so
          // a `//` inside them (e.g. a SQL/URL in a multi-line string) is not
          // mistaken for a comment.
          { open: '"""', close: '"""', multiline: true, escape: "\\" },
          { open: "'''", close: "'''", multiline: true, escape: "\\" },
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeGroovyComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          // Dollar-slashy strings `$/ ... /$` are matched first: they are multi-line
          // and their body may contain `//` (slashy/regex-like content).
          { open: "$/", close: "/$", multiline: true, escape: null },
          { open: '"""', close: '"""', multiline: true, escape: "\\" },
          { open: "'''", close: "'''", multiline: true, escape: "\\" },
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeSolidityComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeProtobufComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeObjectiveCComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '@"', close: '"', escape: "\\" },
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeZigComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeValaComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          // Verbatim strings `""" ... """` are multi-line and matched before the
          // single `"` form so a `//` (e.g. a URL) inside them is preserved.
          { open: '"""', close: '"""', multiline: true, escape: null },
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeDComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [
          { open: "/*", close: "*/" },
          { open: "/+", close: "+/", nested: true }
        ],
        strings: [
          // Token strings `q{ ... }` carry arbitrary code-looking text (incl. `//`)
          // that must be preserved. Matched before the other string forms.
          { open: "q{", close: "}", escape: null, multiline: true },
          { open: '"', close: '"', escape: "\\" },
          { open: "`", close: "`", escape: null }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    var SHADER_SPEC = {
      line: [{ token: "//" }],
      block: [{ open: "/*", close: "*/" }],
      strings: [{ open: '"', close: '"', escape: "\\" }]
    };
    function removeGlslComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, SHADER_SPEC, preserveLicense, keepEmptyLines);
    }
    function removeHlslComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, SHADER_SPEC, preserveLicense, keepEmptyLines);
    }
    function removeWgslComments(code, preserveLicense = false, keepEmptyLines = false) {
      return (0, _shared_1.removeBySpec)(code, SHADER_SPEC, preserveLicense, keepEmptyLines);
    }
    function removeJson5Comments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
  }
});

// node_modules/comment-bear/dist/removers/phase3-remover.js
var require_phase3_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/phase3-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeLuaComments = removeLuaComments;
    exports2.removeElmComments = removeElmComments;
    exports2.removeAdaComments = removeAdaComments;
    exports2.removeVhdlComments = removeVhdlComments;
    exports2.removeAppleScriptComments = removeAppleScriptComments;
    exports2.removeClojureComments = removeClojureComments;
    exports2.removeCommonLispComments = removeCommonLispComments;
    exports2.removeSchemeComments = removeSchemeComments;
    exports2.removeEmacsLispComments = removeEmacsLispComments;
    exports2.removeAssemblyComments = removeAssemblyComments;
    exports2.removeErlangComments = removeErlangComments;
    exports2.removeLatexComments = removeLatexComments;
    exports2.removeMatlabComments = removeMatlabComments;
    exports2.removePrologComments = removePrologComments;
    exports2.removeOcamlComments = removeOcamlComments;
    exports2.removeFSharpComments = removeFSharpComments;
    exports2.removeSmlComments = removeSmlComments;
    exports2.removePascalComments = removePascalComments;
    exports2.removeVbComments = removeVbComments;
    exports2.removeBatchComments = removeBatchComments;
    exports2.removeFortranComments = removeFortranComments;
    exports2.removeVimComments = removeVimComments;
    var _shared_1 = require_shared();
    function removeLuaComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      try {
        let result = "";
        let i = 0;
        const len = code.length;
        while (i < len) {
          const char = code[i];
          const openLevel = matchLongBracketOpen(code, i);
          if (openLevel !== null) {
            const close = "]" + "=".repeat(openLevel) + "]";
            const open = "[" + "=".repeat(openLevel) + "[";
            const closeAt = code.indexOf(close, i + open.length);
            const end = closeAt === -1 ? len : closeAt + close.length;
            result += code.substring(i, end);
            i = end;
            continue;
          }
          if (char === "-" && code[i + 1] === "-") {
            const afterDashes = i + 2;
            const commentLevel = matchLongBracketOpen(code, afterDashes);
            if (commentLevel !== null) {
              const open = "[" + "=".repeat(commentLevel) + "[";
              const close = "]" + "=".repeat(commentLevel) + "]";
              const closeAt = code.indexOf(close, afterDashes + open.length);
              const end = closeAt === -1 ? len : closeAt + close.length;
              const commentContent = code.substring(i, end);
              if (preserveLicense && (0, _shared_1.isLicenseComment)(commentContent)) {
                result += commentContent;
              } else if (keepEmptyLines) {
                const newlines = (commentContent.match(/\n/g) || []).length;
                result += "\n".repeat(newlines);
              }
              i = end;
              continue;
            }
            let j = afterDashes;
            let commentText = "--";
            while (j < len && code[j] !== "\n") {
              commentText += code[j];
              j++;
            }
            if (preserveLicense && (0, _shared_1.isLicenseComment)(commentText)) {
              result += commentText;
            } else {
              result = trimTrailingWsOnLastLine(result);
            }
            i = j;
            continue;
          }
          if (char === '"' || char === "'") {
            let j = i + 1;
            result += char;
            while (j < len) {
              if (code[j] === "\\" && j + 1 < len) {
                result += code[j] + code[j + 1];
                j += 2;
                continue;
              }
              if (code[j] === "\n")
                break;
              if (code[j] === char) {
                result += code[j];
                j++;
                break;
              }
              result += code[j];
              j++;
            }
            i = j;
            continue;
          }
          result += char;
          i++;
        }
        if (!keepEmptyLines) {
          result = dropBlankLinesLocal(result);
        }
        return result;
      } catch (error) {
        return code;
      }
    }
    function matchLongBracketOpen(code, index) {
      if (code[index] !== "[")
        return null;
      let k = index + 1;
      while (code[k] === "=")
        k++;
      if (code[k] === "[")
        return k - (index + 1);
      return null;
    }
    function trimTrailingWsOnLastLine(result) {
      const nl = result.lastIndexOf("\n");
      if (nl === -1) {
        return result.replace(/[ \t]+$/, "");
      }
      const head = result.substring(0, nl + 1);
      const tail = result.substring(nl + 1).replace(/[ \t]+$/, "");
      return head + tail;
    }
    function dropBlankLinesLocal(text) {
      const lines = text.split("\n");
      const cleaned = [];
      for (const line of lines) {
        if (line.trim().length > 0) {
          cleaned.push(line);
        }
      }
      return cleaned.join("\n");
    }
    function removeElmComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "--" }],
        block: [{ open: "{-", close: "-}", nested: true }],
        strings: [
          { open: '"""', close: '"""', multiline: true, escape: "\\" },
          { open: '"', close: '"', escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeAdaComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "--" }],
        strings: [{ open: '"', close: '"', escape: null }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeVhdlComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "--" }],
        strings: [{ open: '"', close: '"', escape: null }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeAppleScriptComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "--" }, { token: "#" }],
        block: [{ open: "(*", close: "*)", nested: true }],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeClojureComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: ";" }],
        // Clojure char literals are written `\X` (e.g. `\;`, `\newline`); `\;` is
        // the semicolon char, not a comment. Protect the `\` + next-char pair.
        charLiteralPrefixes: ["\\"],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeCommonLispComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: ";" }],
        block: [{ open: "#|", close: "|#", nested: true }],
        // Common Lisp character literals are written `#\X` (e.g. `#\;`); the
        // trailing `\;` here is the semicolon char, not a comment. Protect the
        // `\` + next-char pair.
        charLiteralPrefixes: ["\\"],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeSchemeComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: ";" }],
        block: [{ open: "#|", close: "|#", nested: true }],
        // Scheme character literals are written `#\X` (e.g. `#\;`); the trailing
        // `\;` here is the semicolon char, not a comment. Protect the `\` +
        // next-char pair.
        charLiteralPrefixes: ["\\"],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeEmacsLispComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: ";" }],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeAssemblyComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: ";" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeErlangComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "%" }],
        // Erlang char literals are written `$X` (or `$\n`); `$%` is the char `%`,
        // not a comment. Protect the `$` + next-char pair.
        charLiteralPrefixes: ["$"],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeLatexComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      try {
        const lines = code.split("\n");
        const result = [];
        for (const line of lines) {
          const commentIndex = findLatexCommentIndex(line);
          if (commentIndex === -1) {
            result.push(line);
            continue;
          }
          const comment = line.substring(commentIndex);
          const before = line.substring(0, commentIndex);
          if (preserveLicense && (0, _shared_1.isLicenseComment)(comment)) {
            result.push(line);
            continue;
          }
          const codeBefore = before.replace(/[ \t]+$/, "");
          if (codeBefore.length > 0) {
            result.push(codeBefore);
          } else if (keepEmptyLines) {
            result.push("");
          }
        }
        let out = result.join("\n");
        if (!keepEmptyLines) {
          out = dropBlankLinesLocal(out);
        }
        return out;
      } catch (error) {
        return code;
      }
    }
    function findLatexCommentIndex(line) {
      let escaped = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === "\\") {
          escaped = true;
          continue;
        }
        if (char === "%") {
          return i;
        }
      }
      return -1;
    }
    function removeMatlabComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "%" }],
        block: [{ open: "%{", close: "%}" }],
        strings: [{ open: '"', close: '"', escape: null }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removePrologComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "%" }],
        block: [{ open: "/*", close: "*/" }],
        strings: [
          { open: '"', close: '"', escape: "\\" },
          { open: "'", close: "'", escape: "\\" }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeOcamlComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        block: [
          {
            open: "(*",
            close: "*)",
            nested: true,
            // In OCaml a string inside a comment is honoured: `(* "*)" *)` is one
            // comment because the first `*)` is inside the string.
            skipStringsInside: [{ open: '"', close: '"', escape: "\\" }]
          }
        ],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeFSharpComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [{ open: "(*", close: "*)", nested: true }],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeSmlComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        block: [
          {
            open: "(*",
            close: "*)",
            nested: true,
            // SML honours strings inside comments: `(* "*)" *)` is one comment.
            skipStringsInside: [{ open: '"', close: '"', escape: "\\" }]
          }
        ],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removePascalComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "//" }],
        block: [
          { open: "(*", close: "*)" },
          { open: "{", close: "}" }
        ],
        strings: [{ open: "'", close: "'", escape: null }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeVbComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const lines = code.split("\n");
      const kept = [];
      for (const line of lines) {
        if (/^(\s*)REM\b.*$/i.test(line)) {
          if (preserveLicense && (0, _shared_1.isLicenseComment)(line)) {
            kept.push(line);
          } else if (keepEmptyLines) {
            kept.push("");
          }
          continue;
        }
        kept.push(line);
      }
      const withoutRem = kept.join("\n");
      const spec = {
        line: [{ token: "'" }],
        strings: [{ open: '"', close: '"', escape: null }]
      };
      return (0, _shared_1.removeBySpec)(withoutRem, spec, preserveLicense, keepEmptyLines);
    }
    function removeBatchComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      try {
        const lines = code.split("\n");
        const result = [];
        for (const line of lines) {
          if (/^\s*(REM\b.*|::.*)$/i.test(line)) {
            if (preserveLicense && (0, _shared_1.isLicenseComment)(line)) {
              result.push(line);
            } else if (keepEmptyLines) {
              result.push("");
            }
            continue;
          }
          result.push(line);
        }
        let out = result.join("\n");
        if (!keepEmptyLines) {
          out = dropBlankLinesLocal(out);
        }
        return out;
      } catch (error) {
        return code;
      }
    }
    function removeFortranComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: "!" }],
        strings: [
          { open: '"', close: '"', escape: null },
          { open: "'", close: "'", escape: null }
        ]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
    function removeVimComments(code, preserveLicense = false, keepEmptyLines = false) {
      const spec = {
        line: [{ token: '"', onlyAtLineStart: true }],
        strings: [{ open: '"', close: '"', escape: "\\" }]
      };
      return (0, _shared_1.removeBySpec)(code, spec, preserveLicense, keepEmptyLines);
    }
  }
});

// node_modules/comment-bear/dist/removers/hybrid-remover.js
var require_hybrid_remover = __commonJS({
  "node_modules/comment-bear/dist/removers/hybrid-remover.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeVueComments = removeVueComments;
    exports2.removeSvelteComments = removeSvelteComments;
    exports2.removeMarkdownComments = removeMarkdownComments;
    var css_html_remover_1 = require_css_html_remover();
    var javascript_remover_1 = require_javascript_remover();
    var SFC_BLOCK_REGEX = /(<(template|script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
    function removeSfcComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      let found = false;
      const result = code.replace(SFC_BLOCK_REGEX, (_match, openTag, tagName, inner, closeTag) => {
        found = true;
        const tag = tagName.toLowerCase();
        let processedInner;
        if (tag === "template") {
          processedInner = (0, css_html_remover_1.removeHtmlComments)(inner, preserveLicense, keepEmptyLines);
        } else if (tag === "script") {
          processedInner = (0, javascript_remover_1.removeJavaScriptComments)(inner, preserveLicense, keepEmptyLines);
        } else {
          processedInner = (0, css_html_remover_1.removeCssComments)(inner, preserveLicense, keepEmptyLines);
        }
        return openTag + processedInner + closeTag;
      });
      if (!found) {
        return (0, css_html_remover_1.removeHtmlComments)(code, preserveLicense, keepEmptyLines);
      }
      return result;
    }
    function removeVueComments(code, preserveLicense = false, keepEmptyLines = false) {
      return removeSfcComments(code, preserveLicense, keepEmptyLines);
    }
    function removeSvelteComments(code, preserveLicense = false, keepEmptyLines = false) {
      return removeSfcComments(code, preserveLicense, keepEmptyLines);
    }
    var MD_PLACEHOLDER_RESTORE = /@@MDPROT(\d+)@@/g;
    function removeMarkdownComments(code, preserveLicense = false, keepEmptyLines = false) {
      if (!code)
        return code;
      const protectedRegions = [];
      const placeholder = (content) => {
        const id = protectedRegions.length;
        protectedRegions.push(content);
        return "@@MDPROT" + id + "@@";
      };
      const lines = code.split("\n");
      const masked = [];
      let fenceMarker = null;
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (fenceMarker === null) {
          const open = /^(`{3,}|~{3,})/.exec(trimmed);
          if (open) {
            fenceMarker = open[1][0];
            masked.push(placeholder(line));
            continue;
          }
          masked.push(line);
        } else {
          masked.push(placeholder(line));
          const close = /^(`{3,}|~{3,})\s*$/.exec(trimmed);
          if (close && close[1][0] === fenceMarker) {
            fenceMarker = null;
          }
        }
      }
      let working = masked.join("\n");
      working = working.replace(/(`+)(?:(?!\1)[^\n])+?\1/g, (match) => placeholder(match));
      let result = (0, css_html_remover_1.removeHtmlComments)(working, preserveLicense, keepEmptyLines);
      result = result.replace(MD_PLACEHOLDER_RESTORE, (_, index) => {
        const region = protectedRegions[parseInt(index, 10)];
        return region !== void 0 ? region : "";
      });
      return result;
    }
  }
});

// node_modules/comment-bear/dist/index.js
var require_dist = __commonJS({
  "node_modules/comment-bear/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.validateConfig = exports2.mergeConfig = exports2.findConfigFile = exports2.loadConfig = exports2.CommentRemoverStream = exports2.createCommentRemoverStream = exports2.detectLanguageByContent = exports2.detectLanguageByFilename = exports2.detectLanguage = void 0;
    exports2.removeComments = removeComments2;
    var language_detector_1 = require_language_detector();
    Object.defineProperty(exports2, "detectLanguage", { enumerable: true, get: function() {
      return language_detector_1.detectLanguage;
    } });
    Object.defineProperty(exports2, "detectLanguageByFilename", { enumerable: true, get: function() {
      return language_detector_1.detectLanguageByFilename;
    } });
    Object.defineProperty(exports2, "detectLanguageByContent", { enumerable: true, get: function() {
      return language_detector_1.detectLanguageByContent;
    } });
    var stream_1 = require_stream();
    Object.defineProperty(exports2, "createCommentRemoverStream", { enumerable: true, get: function() {
      return stream_1.createCommentRemoverStream;
    } });
    Object.defineProperty(exports2, "CommentRemoverStream", { enumerable: true, get: function() {
      return stream_1.CommentRemoverStream;
    } });
    var config_1 = require_config();
    Object.defineProperty(exports2, "loadConfig", { enumerable: true, get: function() {
      return config_1.loadConfig;
    } });
    Object.defineProperty(exports2, "findConfigFile", { enumerable: true, get: function() {
      return config_1.findConfigFile;
    } });
    Object.defineProperty(exports2, "mergeConfig", { enumerable: true, get: function() {
      return config_1.mergeConfig;
    } });
    Object.defineProperty(exports2, "validateConfig", { enumerable: true, get: function() {
      return config_1.validateConfig;
    } });
    var javascript_remover_1 = require_javascript_remover();
    var python_remover_1 = require_python_remover();
    var css_html_remover_1 = require_css_html_remover();
    var sql_remover_1 = require_sql_remover();
    var c_style_remover_1 = require_c_style_remover();
    var other_remover_1 = require_other_remover();
    var hash_remover_1 = require_hash_remover();
    var cstyle_extra_remover_1 = require_cstyle_extra_remover();
    var phase3_remover_1 = require_phase3_remover();
    var hybrid_remover_1 = require_hybrid_remover();
    var language_detector_2 = require_language_detector();
    function removeComments2(code, options = {}) {
      if (options === null || typeof options !== "object") {
        options = {};
      }
      if (typeof code !== "string") {
        if (code === null || code === void 0) {
          return {
            code,
            removedCount: 0,
            detectedLanguage: void 0
          };
        }
        let stringValue;
        try {
          const raw = typeof code.toString === "function" ? code.toString() : String(code);
          stringValue = typeof raw === "string" ? raw : String(raw);
        } catch {
          try {
            stringValue = String(code);
          } catch {
            stringValue = "";
          }
        }
        return {
          code: stringValue,
          removedCount: 0,
          detectedLanguage: void 0
        };
      }
      if (code.trim().length === 0) {
        return {
          code,
          removedCount: 0,
          detectedLanguage: void 0
        };
      }
      let language = options.language;
      if (options.filename) {
        const detectedByFilename = (0, language_detector_2.detectLanguageByFilename)(options.filename);
        if (detectedByFilename) {
          language = detectedByFilename;
        }
      }
      if (!language) {
        language = (0, language_detector_2.detectLanguage)(void 0, code);
      }
      if (!language) {
        return {
          code,
          removedCount: 0,
          detectedLanguage: void 0
        };
      }
      if (options.dryRun) {
        const commentCount = countComments(code, language, options.preserveLicense || false);
        return {
          code,
          removedCount: commentCount,
          detectedLanguage: language
        };
      }
      const preserveLicense = options.preserveLicense || false;
      const keepEmptyLines = options.keepEmptyLines || false;
      let processedCode = code;
      try {
        switch (language) {
          case "javascript":
            processedCode = (0, javascript_remover_1.removeJavaScriptComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "typescript":
            processedCode = (0, javascript_remover_1.removeTypeScriptComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "python":
            processedCode = (0, python_remover_1.removePythonComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "ruby":
            processedCode = (0, other_remover_1.removeRubyComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "java":
            processedCode = (0, c_style_remover_1.removeJavaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "csharp":
            processedCode = (0, c_style_remover_1.removeCSharpComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "c":
            processedCode = (0, c_style_remover_1.removeCComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "cpp":
            processedCode = (0, c_style_remover_1.removeCppComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "php":
            processedCode = (0, c_style_remover_1.removePhpComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "go":
            processedCode = (0, c_style_remover_1.removeGoComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "rust":
            processedCode = (0, c_style_remover_1.removeRustComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "swift":
            processedCode = (0, c_style_remover_1.removeSwiftComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "kotlin":
            processedCode = (0, c_style_remover_1.removeKotlinComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "scala":
            processedCode = (0, c_style_remover_1.removeScalaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "haskell":
            processedCode = (0, other_remover_1.removeHaskellComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "yaml":
            processedCode = (0, other_remover_1.removeYamlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "html":
            processedCode = (0, css_html_remover_1.removeHtmlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "css":
            processedCode = (0, css_html_remover_1.removeCssComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "sql":
            processedCode = (0, sql_remover_1.removeSqlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "json":
            processedCode = (0, other_remover_1.removeJsonComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "xml":
            processedCode = (0, css_html_remover_1.removeXmlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "shell":
            processedCode = (0, hash_remover_1.removeShellComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "powershell":
            processedCode = (0, hash_remover_1.removePowerShellComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "perl":
            processedCode = (0, hash_remover_1.removePerlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "r":
            processedCode = (0, hash_remover_1.removeRComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "toml":
            processedCode = (0, hash_remover_1.removeTomlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "makefile":
            processedCode = (0, hash_remover_1.removeMakefileComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "dockerfile":
            processedCode = (0, hash_remover_1.removeDockerfileComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "ini":
            processedCode = (0, hash_remover_1.removeIniComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "graphql":
            processedCode = (0, hash_remover_1.removeGraphqlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "elixir":
            processedCode = (0, hash_remover_1.removeElixirComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "crystal":
            processedCode = (0, hash_remover_1.removeCrystalComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "julia":
            processedCode = (0, hash_remover_1.removeJuliaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "nim":
            processedCode = (0, hash_remover_1.removeNimComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "coffeescript":
            processedCode = (0, hash_remover_1.removeCoffeeScriptComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "tcl":
            processedCode = (0, hash_remover_1.removeTclComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "cmake":
            processedCode = (0, hash_remover_1.removeCMakeComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "properties":
            processedCode = (0, hash_remover_1.removePropertiesComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "puppet":
            processedCode = (0, hash_remover_1.removePuppetComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "hcl":
            processedCode = (0, hash_remover_1.removeHclComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "scss":
            processedCode = (0, hash_remover_1.removeScssComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "less":
            processedCode = (0, hash_remover_1.removeLessComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "sass":
            processedCode = (0, hash_remover_1.removeSassComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "dart":
            processedCode = (0, cstyle_extra_remover_1.removeDartComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "groovy":
            processedCode = (0, cstyle_extra_remover_1.removeGroovyComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "solidity":
            processedCode = (0, cstyle_extra_remover_1.removeSolidityComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "protobuf":
            processedCode = (0, cstyle_extra_remover_1.removeProtobufComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "objectivec":
            processedCode = (0, cstyle_extra_remover_1.removeObjectiveCComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "zig":
            processedCode = (0, cstyle_extra_remover_1.removeZigComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "vala":
            processedCode = (0, cstyle_extra_remover_1.removeValaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "d":
            processedCode = (0, cstyle_extra_remover_1.removeDComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "glsl":
            processedCode = (0, cstyle_extra_remover_1.removeGlslComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "hlsl":
            processedCode = (0, cstyle_extra_remover_1.removeHlslComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "wgsl":
            processedCode = (0, cstyle_extra_remover_1.removeWgslComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "json5":
            processedCode = (0, cstyle_extra_remover_1.removeJson5Comments)(code, preserveLicense, keepEmptyLines);
            break;
          case "lua":
            processedCode = (0, phase3_remover_1.removeLuaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "elm":
            processedCode = (0, phase3_remover_1.removeElmComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "ada":
            processedCode = (0, phase3_remover_1.removeAdaComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "vhdl":
            processedCode = (0, phase3_remover_1.removeVhdlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "applescript":
            processedCode = (0, phase3_remover_1.removeAppleScriptComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "clojure":
            processedCode = (0, phase3_remover_1.removeClojureComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "commonlisp":
            processedCode = (0, phase3_remover_1.removeCommonLispComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "scheme":
            processedCode = (0, phase3_remover_1.removeSchemeComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "emacslisp":
            processedCode = (0, phase3_remover_1.removeEmacsLispComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "assembly":
            processedCode = (0, phase3_remover_1.removeAssemblyComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "erlang":
            processedCode = (0, phase3_remover_1.removeErlangComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "latex":
            processedCode = (0, phase3_remover_1.removeLatexComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "matlab":
            processedCode = (0, phase3_remover_1.removeMatlabComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "prolog":
            processedCode = (0, phase3_remover_1.removePrologComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "ocaml":
            processedCode = (0, phase3_remover_1.removeOcamlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "fsharp":
            processedCode = (0, phase3_remover_1.removeFSharpComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "sml":
            processedCode = (0, phase3_remover_1.removeSmlComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "pascal":
            processedCode = (0, phase3_remover_1.removePascalComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "vb":
            processedCode = (0, phase3_remover_1.removeVbComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "batch":
            processedCode = (0, phase3_remover_1.removeBatchComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "fortran":
            processedCode = (0, phase3_remover_1.removeFortranComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "vimscript":
            processedCode = (0, phase3_remover_1.removeVimComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "vue":
            processedCode = (0, hybrid_remover_1.removeVueComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "svelte":
            processedCode = (0, hybrid_remover_1.removeSvelteComments)(code, preserveLicense, keepEmptyLines);
            break;
          case "markdown":
            processedCode = (0, hybrid_remover_1.removeMarkdownComments)(code, preserveLicense, keepEmptyLines);
            break;
        }
      } catch (error) {
        console.error(`Error removing comments for language ${language}:`, error);
        return {
          code,
          removedCount: 0,
          detectedLanguage: language
        };
      }
      const removedCount = estimateRemovedComments(code, processedCode);
      return {
        code: processedCode,
        removedCount,
        detectedLanguage: language
      };
    }
    function countComments(code, language, preserveLicense = false) {
      const lines = code.split("\n");
      let count = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (preserveLicense && isLicenseLine(trimmed)) {
          continue;
        }
        switch (language) {
          case "javascript":
          case "typescript":
          case "java":
          case "csharp":
          case "c":
          case "cpp":
          case "go":
          case "rust":
          case "swift":
          case "php":
          case "kotlin":
          case "scala":
          case "dart":
          case "groovy":
          case "solidity":
          case "protobuf":
          case "objectivec":
          case "zig":
          case "vala":
          case "d":
          case "glsl":
          case "hlsl":
          case "wgsl":
          case "json5":
            if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
              count++;
            }
            break;
          case "haskell":
            if (trimmed.startsWith("--") || trimmed.startsWith("{-")) {
              if (!trimmed.startsWith("{-#")) {
                count++;
              }
            }
            break;
          case "python":
          case "ruby":
          case "yaml":
            if (trimmed.startsWith("#") || trimmed.startsWith("=begin")) {
              count++;
            }
            break;
          case "html":
          case "xml":
            if (trimmed.startsWith("<!--")) {
              count++;
            }
            break;
          case "css":
            if (trimmed.startsWith("/*")) {
              count++;
            }
            break;
          case "sql":
            if (trimmed.startsWith("--") || trimmed.startsWith("/*")) {
              count++;
            }
            break;
          case "shell":
          case "powershell":
          case "perl":
          case "r":
          case "toml":
          case "makefile":
          case "dockerfile":
          case "ini":
          case "graphql":
          case "elixir":
          case "crystal":
          case "julia":
          case "nim":
          case "coffeescript":
          case "tcl":
          case "cmake":
          case "properties":
            if (trimmed.startsWith("#") || trimmed.startsWith(";") || trimmed.startsWith("!")) {
              count++;
            }
            break;
          case "scss":
          case "less":
          case "sass":
          case "hcl":
          case "puppet":
            if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
              count++;
            }
            break;
          case "lua":
          case "elm":
          case "ada":
          case "vhdl":
          case "applescript":
            if (trimmed.startsWith("--")) {
              count++;
            }
            break;
          case "clojure":
          case "commonlisp":
          case "scheme":
          case "emacslisp":
          case "assembly":
            if (trimmed.startsWith(";")) {
              count++;
            }
            break;
          case "erlang":
          case "latex":
          case "matlab":
          case "prolog":
            if (trimmed.startsWith("%")) {
              count++;
            }
            break;
          case "ocaml":
          case "fsharp":
          case "sml":
          case "pascal":
            if (trimmed.startsWith("(*") || trimmed.startsWith("//") || trimmed.startsWith("{")) {
              count++;
            }
            break;
          case "vb":
            if (trimmed.startsWith("'") || /^REM\b/i.test(trimmed)) {
              count++;
            }
            break;
          case "batch":
            if (/^REM\b/i.test(trimmed) || trimmed.startsWith("::")) {
              count++;
            }
            break;
          case "fortran":
            if (trimmed.startsWith("!")) {
              count++;
            }
            break;
          case "vimscript":
            if (trimmed.startsWith('"')) {
              count++;
            }
            break;
          case "vue":
          case "svelte":
          case "markdown":
            if (trimmed.startsWith("<!--")) {
              count++;
            }
            break;
        }
      }
      return count;
    }
    function isLicenseLine(line) {
      const lower = line.toLowerCase();
      return lower.includes("license") || lower.includes("copyright") || lower.includes("licence") || lower.includes("author") || line.startsWith("/*!") || line.includes("@license") || line.includes("@copyright") || line.includes("@author");
    }
    function estimateRemovedComments(original, processed) {
      const originalLines = original.split("\n").filter((l) => l.trim().length > 0);
      const processedLines = processed.split("\n").filter((l) => l.trim().length > 0);
      return Math.max(0, originalLines.length - processedLines.length);
    }
    exports2.default = removeComments2;
  }
});

// node_modules/ignore/index.js
var require_ignore = __commonJS({
  "node_modules/ignore/index.js"(exports2, module2) {
    function makeArray(subject) {
      return Array.isArray(subject) ? subject : [subject];
    }
    var EMPTY = "";
    var SPACE = " ";
    var ESCAPE = "\\";
    var REGEX_TEST_BLANK_LINE = /^\s+$/;
    var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
    var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
    var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
    var REGEX_SPLITALL_CRLF = /\r?\n/g;
    var REGEX_TEST_INVALID_PATH = /^\.*\/|^\.+$/;
    var SLASH = "/";
    var TMP_KEY_IGNORE = "node-ignore";
    if (typeof Symbol !== "undefined") {
      TMP_KEY_IGNORE = Symbol.for("node-ignore");
    }
    var KEY_IGNORE = TMP_KEY_IGNORE;
    var define = (object, key, value) => Object.defineProperty(object, key, { value });
    var REGEX_REGEXP_RANGE = /([0-z])-([0-z])/g;
    var RETURN_FALSE = () => false;
    var sanitizeRange = (range) => range.replace(
      REGEX_REGEXP_RANGE,
      (match, from, to) => from.charCodeAt(0) <= to.charCodeAt(0) ? match : EMPTY
    );
    var cleanRangeBackSlash = (slashes) => {
      const { length } = slashes;
      return slashes.slice(0, length - length % 2);
    };
    var REPLACERS = [
      [
        // remove BOM
        // TODO:
        // Other similar zero-width characters?
        /^\uFEFF/,
        () => EMPTY
      ],
      // > Trailing spaces are ignored unless they are quoted with backslash ("\")
      [
        // (a\ ) -> (a )
        // (a  ) -> (a)
        // (a ) -> (a)
        // (a \ ) -> (a  )
        /((?:\\\\)*?)(\\?\s+)$/,
        (_, m1, m2) => m1 + (m2.indexOf("\\") === 0 ? SPACE : EMPTY)
      ],
      // replace (\ ) with ' '
      // (\ ) -> ' '
      // (\\ ) -> '\\ '
      // (\\\ ) -> '\\ '
      [
        /(\\+?)\s/g,
        (_, m1) => {
          const { length } = m1;
          return m1.slice(0, length - length % 2) + SPACE;
        }
      ],
      // Escape metacharacters
      // which is written down by users but means special for regular expressions.
      // > There are 12 characters with special meanings:
      // > - the backslash \,
      // > - the caret ^,
      // > - the dollar sign $,
      // > - the period or dot .,
      // > - the vertical bar or pipe symbol |,
      // > - the question mark ?,
      // > - the asterisk or star *,
      // > - the plus sign +,
      // > - the opening parenthesis (,
      // > - the closing parenthesis ),
      // > - and the opening square bracket [,
      // > - the opening curly brace {,
      // > These special characters are often called "metacharacters".
      [
        /[\\$.|*+(){^]/g,
        (match) => `\\${match}`
      ],
      [
        // > a question mark (?) matches a single character
        /(?!\\)\?/g,
        () => "[^/]"
      ],
      // leading slash
      [
        // > A leading slash matches the beginning of the pathname.
        // > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
        // A leading slash matches the beginning of the pathname
        /^\//,
        () => "^"
      ],
      // replace special metacharacter slash after the leading slash
      [
        /\//g,
        () => "\\/"
      ],
      [
        // > A leading "**" followed by a slash means match in all directories.
        // > For example, "**/foo" matches file or directory "foo" anywhere,
        // > the same as pattern "foo".
        // > "**/foo/bar" matches file or directory "bar" anywhere that is directly
        // >   under directory "foo".
        // Notice that the '*'s have been replaced as '\\*'
        /^\^*\\\*\\\*\\\//,
        // '**/foo' <-> 'foo'
        () => "^(?:.*\\/)?"
      ],
      // starting
      [
        // there will be no leading '/'
        //   (which has been replaced by section "leading slash")
        // If starts with '**', adding a '^' to the regular expression also works
        /^(?=[^^])/,
        function startingReplacer() {
          return !/\/(?!$)/.test(this) ? "(?:^|\\/)" : "^";
        }
      ],
      // two globstars
      [
        // Use lookahead assertions so that we could match more than one `'/**'`
        /\\\/\\\*\\\*(?=\\\/|$)/g,
        // Zero, one or several directories
        // should not use '*', or it will be replaced by the next replacer
        // Check if it is not the last `'/**'`
        (_, index, str) => index + 6 < str.length ? "(?:\\/[^\\/]+)*" : "\\/.+"
      ],
      // normal intermediate wildcards
      [
        // Never replace escaped '*'
        // ignore rule '\*' will match the path '*'
        // 'abc.*/' -> go
        // 'abc.*'  -> skip this rule,
        //    coz trailing single wildcard will be handed by [trailing wildcard]
        /(^|[^\\]+)(\\\*)+(?=.+)/g,
        // '*.js' matches '.js'
        // '*.js' doesn't match 'abc'
        (_, p1, p2) => {
          const unescaped = p2.replace(/\\\*/g, "[^\\/]*");
          return p1 + unescaped;
        }
      ],
      [
        // unescape, revert step 3 except for back slash
        // For example, if a user escape a '\\*',
        // after step 3, the result will be '\\\\\\*'
        /\\\\\\(?=[$.|*+(){^])/g,
        () => ESCAPE
      ],
      [
        // '\\\\' -> '\\'
        /\\\\/g,
        () => ESCAPE
      ],
      [
        // > The range notation, e.g. [a-zA-Z],
        // > can be used to match one of the characters in a range.
        // `\` is escaped by step 3
        /(\\)?\[([^\]/]*?)(\\*)($|\])/g,
        (match, leadEscape, range, endEscape, close) => leadEscape === ESCAPE ? `\\[${range}${cleanRangeBackSlash(endEscape)}${close}` : close === "]" ? endEscape.length % 2 === 0 ? `[${sanitizeRange(range)}${endEscape}]` : "[]" : "[]"
      ],
      // ending
      [
        // 'js' will not match 'js.'
        // 'ab' will not match 'abc'
        /(?:[^*])$/,
        // WTF!
        // https://git-scm.com/docs/gitignore
        // changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
        // which re-fixes #24, #38
        // > If there is a separator at the end of the pattern then the pattern
        // > will only match directories, otherwise the pattern can match both
        // > files and directories.
        // 'js*' will not match 'a.js'
        // 'js/' will not match 'a.js'
        // 'js' will match 'a.js' and 'a.js/'
        (match) => /\/$/.test(match) ? `${match}$` : `${match}(?=$|\\/$)`
      ],
      // trailing wildcard
      [
        /(\^|\\\/)?\\\*$/,
        (_, p1) => {
          const prefix = p1 ? `${p1}[^/]+` : "[^/]*";
          return `${prefix}(?=$|\\/$)`;
        }
      ]
    ];
    var regexCache = /* @__PURE__ */ Object.create(null);
    var makeRegex = (pattern, ignoreCase) => {
      let source = regexCache[pattern];
      if (!source) {
        source = REPLACERS.reduce(
          (prev, [matcher, replacer]) => prev.replace(matcher, replacer.bind(pattern)),
          pattern
        );
        regexCache[pattern] = source;
      }
      return ignoreCase ? new RegExp(source, "i") : new RegExp(source);
    };
    var isString = (subject) => typeof subject === "string";
    var checkPattern = (pattern) => pattern && isString(pattern) && !REGEX_TEST_BLANK_LINE.test(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern) && pattern.indexOf("#") !== 0;
    var splitPattern = (pattern) => pattern.split(REGEX_SPLITALL_CRLF);
    var IgnoreRule = class {
      constructor(origin, pattern, negative, regex) {
        this.origin = origin;
        this.pattern = pattern;
        this.negative = negative;
        this.regex = regex;
      }
    };
    var createRule = (pattern, ignoreCase) => {
      const origin = pattern;
      let negative = false;
      if (pattern.indexOf("!") === 0) {
        negative = true;
        pattern = pattern.substr(1);
      }
      pattern = pattern.replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, "!").replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, "#");
      const regex = makeRegex(pattern, ignoreCase);
      return new IgnoreRule(
        origin,
        pattern,
        negative,
        regex
      );
    };
    var throwError = (message, Ctor) => {
      throw new Ctor(message);
    };
    var checkPath = (path5, originalPath, doThrow) => {
      if (!isString(path5)) {
        return doThrow(
          `path must be a string, but got \`${originalPath}\``,
          TypeError
        );
      }
      if (!path5) {
        return doThrow(`path must not be empty`, TypeError);
      }
      if (checkPath.isNotRelative(path5)) {
        const r = "`path.relative()`d";
        return doThrow(
          `path should be a ${r} string, but got "${originalPath}"`,
          RangeError
        );
      }
      return true;
    };
    var isNotRelative = (path5) => REGEX_TEST_INVALID_PATH.test(path5);
    checkPath.isNotRelative = isNotRelative;
    checkPath.convert = (p) => p;
    var Ignore = class {
      constructor({
        ignorecase = true,
        ignoreCase = ignorecase,
        allowRelativePaths = false
      } = {}) {
        define(this, KEY_IGNORE, true);
        this._rules = [];
        this._ignoreCase = ignoreCase;
        this._allowRelativePaths = allowRelativePaths;
        this._initCache();
      }
      _initCache() {
        this._ignoreCache = /* @__PURE__ */ Object.create(null);
        this._testCache = /* @__PURE__ */ Object.create(null);
      }
      _addPattern(pattern) {
        if (pattern && pattern[KEY_IGNORE]) {
          this._rules = this._rules.concat(pattern._rules);
          this._added = true;
          return;
        }
        if (checkPattern(pattern)) {
          const rule = createRule(pattern, this._ignoreCase);
          this._added = true;
          this._rules.push(rule);
        }
      }
      // @param {Array<string> | string | Ignore} pattern
      add(pattern) {
        this._added = false;
        makeArray(
          isString(pattern) ? splitPattern(pattern) : pattern
        ).forEach(this._addPattern, this);
        if (this._added) {
          this._initCache();
        }
        return this;
      }
      // legacy
      addPattern(pattern) {
        return this.add(pattern);
      }
      //          |           ignored : unignored
      // negative |   0:0   |   0:1   |   1:0   |   1:1
      // -------- | ------- | ------- | ------- | --------
      //     0    |  TEST   |  TEST   |  SKIP   |    X
      //     1    |  TESTIF |  SKIP   |  TEST   |    X
      // - SKIP: always skip
      // - TEST: always test
      // - TESTIF: only test if checkUnignored
      // - X: that never happen
      // @param {boolean} whether should check if the path is unignored,
      //   setting `checkUnignored` to `false` could reduce additional
      //   path matching.
      // @returns {TestResult} true if a file is ignored
      _testOne(path5, checkUnignored) {
        let ignored = false;
        let unignored = false;
        this._rules.forEach((rule) => {
          const { negative } = rule;
          if (unignored === negative && ignored !== unignored || negative && !ignored && !unignored && !checkUnignored) {
            return;
          }
          const matched = rule.regex.test(path5);
          if (matched) {
            ignored = !negative;
            unignored = negative;
          }
        });
        return {
          ignored,
          unignored
        };
      }
      // @returns {TestResult}
      _test(originalPath, cache, checkUnignored, slices) {
        const path5 = originalPath && checkPath.convert(originalPath);
        checkPath(
          path5,
          originalPath,
          this._allowRelativePaths ? RETURN_FALSE : throwError
        );
        return this._t(path5, cache, checkUnignored, slices);
      }
      _t(path5, cache, checkUnignored, slices) {
        if (path5 in cache) {
          return cache[path5];
        }
        if (!slices) {
          slices = path5.split(SLASH);
        }
        slices.pop();
        if (!slices.length) {
          return cache[path5] = this._testOne(path5, checkUnignored);
        }
        const parent = this._t(
          slices.join(SLASH) + SLASH,
          cache,
          checkUnignored,
          slices
        );
        return cache[path5] = parent.ignored ? parent : this._testOne(path5, checkUnignored);
      }
      ignores(path5) {
        return this._test(path5, this._ignoreCache, false).ignored;
      }
      createFilter() {
        return (path5) => !this.ignores(path5);
      }
      filter(paths) {
        return makeArray(paths).filter(this.createFilter());
      }
      // @returns {TestResult}
      test(path5) {
        return this._test(path5, this._testCache, true);
      }
    };
    var factory = (options) => new Ignore(options);
    var isPathValid = (path5) => checkPath(path5 && checkPath.convert(path5), path5, RETURN_FALSE);
    factory.isPathValid = isPathValid;
    factory.default = factory;
    module2.exports = factory;
    if (
      // Detect `process` so that it can run in browsers.
      typeof process !== "undefined" && (process.env && process.env.IGNORE_TEST_WIN32 || process.platform === "win32")
    ) {
      const makePosix = (str) => /^\\\\\?\\/.test(str) || /["<>|\u0000-\u001F]+/u.test(str) ? str : str.replace(/\\/g, "/");
      checkPath.convert = makePosix;
      const REGIX_IS_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
      checkPath.isNotRelative = (path5) => REGIX_IS_WINDOWS_PATH_ABSOLUTE.test(path5) || isNotRelative(path5);
    }
  }
});

// src/scan-selection-cli.ts
var scan_selection_cli_exports = {};
__export(scan_selection_cli_exports, {
  main: () => main
});
module.exports = __toCommonJS(scan_selection_cli_exports);
var fs5 = __toESM(require("fs"));

// src/scan-core.ts
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));

// src/comment-stripper.ts
var import_comment_bear = __toESM(require_dist());
var import_comment_bear2 = __toESM(require_dist());
function stripCommentsFromFile(content, filePath) {
  try {
    const result = (0, import_comment_bear.removeComments)(content, {
      filename: filePath,
      preserveLicense: false,
      keepEmptyLines: false
    });
    if (result.removedCount > 0 && process.env.DEBUG) {
      console.log(`Stripped ${result.removedCount} comments from ${filePath} (detected: ${result.detectedLanguage || "unknown"})`);
    }
    return result.code;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Warning: Failed to strip comments from ${filePath}: ${error.message}`);
    }
    return content;
  }
}

// src/file-utils.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
function isEnvFile(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName === ".env" || fileName.startsWith(".env.") || fileName.endsWith(".env");
}
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".txt",
  ".md",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".css",
  ".scss",
  ".html",
  ".htm",
  ".xml",
  ".json",
  ".yaml",
  ".yml",
  ".csv",
  ".ini",
  ".conf",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".pl",
  ".sh",
  ".bat",
  ".ps1",
  ".sql",
  ".gitignore",
  ".env",
  ".config",
  ".toml",
  ".dockerfile"
]);
var TEXT_FILENAMES = /* @__PURE__ */ new Set([
  "dockerfile",
  "makefile",
  "jenkinsfile",
  "vagrantfile",
  "readme",
  "license",
  "gemfile",
  "rakefile",
  "procfile",
  ".gitignore",
  ".dockerignore",
  ".npmignore"
]);
function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || TEXT_FILENAMES.has(filename);
}
async function safeReadFile(filePath) {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      return `[Error reading file: ${error.message}]`;
    }
    return "[Unexpected error reading file]";
  }
}

// src/scan-core.ts
async function renderFileBody(filePath, includeEnvFiles, stripComments, removeBlankLines = false) {
  if (isEnvFile(filePath)) {
    if (!includeEnvFiles) {
      return `[.env file - content skipped according to settings]

`;
    }
    const content2 = await safeReadFile(filePath);
    return `### .env file content ###
${content2}
### End of .env file ###

`;
  }
  if (!isTextFile(filePath)) {
    return `[Binary or non-text content not shown]

`;
  }
  let content = await safeReadFile(filePath);
  if (stripComments) {
    content = stripCommentsFromFile(content, filePath);
  }
  if (removeBlankLines) {
    content = stripBlankLines(content);
  }
  return `${content}

`;
}
function stripBlankLines(content) {
  return content.split("\n").filter((line) => line.trim() !== "").join("\n");
}
async function processFileForCopy(filePath, stripComments, removeBlankLines) {
  if (!stripComments && !removeBlankLines) {
    return null;
  }
  if (isEnvFile(filePath) || !isTextFile(filePath)) {
    return null;
  }
  let content = await safeReadFile(filePath);
  if (stripComments) {
    content = stripCommentsFromFile(content, filePath);
  }
  if (removeBlankLines) {
    content = stripBlankLines(content);
  }
  return content;
}
function uniqueFlatName(filePath, used) {
  const base = path2.basename(filePath);
  let name = base;
  if (used.has(name.toLowerCase())) {
    const parent = path2.basename(path2.dirname(filePath));
    if (parent) {
      name = `${parent}_${base}`;
    }
  }
  let candidate = name;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const ext = path2.extname(name);
    const stem = name.slice(0, name.length - ext.length);
    candidate = `${stem}_${i}${ext}`;
    i += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
async function copySelectionToDir(options) {
  const { targetDir, includedFiles, stripComments, removeBlankLines } = options;
  await fs2.promises.mkdir(targetDir, { recursive: true });
  for (const entry of await fs2.promises.readdir(targetDir)) {
    await fs2.promises.rm(path2.join(targetDir, entry), { recursive: true, force: true });
  }
  const used = /* @__PURE__ */ new Set();
  let written = 0;
  for (const file of includedFiles) {
    const dest = path2.join(targetDir, uniqueFlatName(file, used));
    const processed = await processFileForCopy(file, stripComments, removeBlankLines);
    if (processed === null) {
      await fs2.promises.copyFile(file, dest);
    } else {
      await fs2.promises.writeFile(dest, processed, "utf8");
    }
    written += 1;
  }
  return written;
}
async function scanSelectionToString(options) {
  const {
    rootDir,
    includedFiles,
    includeEnvFiles,
    stripComments,
    removeBlankLines = false,
    onProgress,
    isCancelled
  } = options;
  const entries = includedFiles.map((file) => ({ file, rel: path2.relative(rootDir, file).replace(/\\/g, "/") })).sort((a, b) => a.rel.localeCompare(b.rel));
  const total = entries.length;
  let done = 0;
  let output = "";
  for (const { file, rel } of entries) {
    if (isCancelled?.()) {
      break;
    }
    const body = await renderFileBody(file, includeEnvFiles, stripComments, removeBlankLines);
    output += `${rel}
${body}`;
    done++;
    onProgress?.(done, total);
  }
  return output;
}

// src/tree-core.ts
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));

// src/blacklist.ts
var DEFAULT_IGNORE = [
  // Version control & dependency caches
  "node_modules",
  ".git",
  // Generated build output & IDE caches (never useful as context)
  "bin",
  // compiled output (.NET and many other build tools)
  "obj",
  // intermediate build files (.NET)
  ".vs"
  // Visual Studio's hidden solution cache (often the largest folder)
];
function isDirectoryPattern(normalizedItem) {
  const endsWithSlash = normalizedItem.endsWith("/");
  const isHiddenDir = normalizedItem.startsWith(".") && !normalizedItem.includes(".", 1);
  const hasNoExtension = !normalizedItem.includes(".");
  return endsWithSlash || isHiddenDir || hasNoExtension;
}
function isBlacklisted(currentPath, blacklist) {
  const normalizedPath = currentPath.replace(/\\/g, "/");
  const pathSegments = normalizedPath.split("/");
  for (const item of blacklist) {
    const normalizedItem = item.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!normalizedItem) {
      continue;
    }
    if (normalizedPath === normalizedItem) {
      return true;
    }
    if (isDirectoryPattern(normalizedItem)) {
      if (normalizedPath.startsWith(normalizedItem + "/")) {
        return true;
      }
      if (pathSegments.includes(normalizedItem)) {
        return true;
      }
    } else {
      const fileName = pathSegments[pathSegments.length - 1];
      if (fileName === normalizedItem) {
        return true;
      }
    }
  }
  return false;
}

// src/tree-core.ts
function compareEntries(a, b) {
  const aDir = a.isDirectory();
  const bDir = b.isDirectory();
  if (aDir !== bDir) {
    return aDir ? -1 : 1;
  }
  return a.name.localeCompare(b.name, void 0, { sensitivity: "accent" });
}
async function buildTree(dirPath, basePath, options = {}, depth = 1) {
  const { blacklist = [], maxDepth = Infinity, isIgnored } = options;
  let entries;
  try {
    entries = await fs3.promises.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
  entries.sort(compareEntries);
  const nodes = [];
  for (const entry of entries) {
    const fullPath = path3.join(dirPath, entry.name);
    const relativePath = path3.relative(basePath, fullPath).replace(/\\/g, "/");
    const isDirectory = entry.isDirectory() && !entry.isSymbolicLink();
    if (isBlacklisted(relativePath, blacklist) || isIgnored?.(fullPath, isDirectory)) {
      continue;
    }
    const node = { name: entry.name, isDirectory, children: [], path: fullPath };
    if (isDirectory && depth < maxDepth) {
      node.children = await buildTree(fullPath, basePath, options, depth + 1);
    }
    nodes.push(node);
  }
  return nodes;
}
function renderTree(root, options = {}) {
  const { dirSuffix = "/" } = options;
  const lines = [root.name];
  const label = (node) => node.isDirectory ? `${node.name}${dirSuffix}` : node.name;
  const walk = (children, prefix) => {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
      lines.push(`${prefix}${connector}${label(child)}`);
      if (child.children.length > 0) {
        const childPrefix = `${prefix}${isLast ? "    " : "\u2502   "}`;
        walk(child.children, childPrefix);
      }
    });
  };
  walk(root.children, "");
  return lines.join("\n");
}
function resolveRootName(targetDir, explicitName) {
  if (explicitName) {
    return explicitName;
  }
  const resolved = path3.resolve(targetDir);
  return path3.basename(resolved) || resolved;
}

// src/gitignore.ts
var fs4 = __toESM(require("fs"));
var path4 = __toESM(require("path"));
var import_ignore = __toESM(require_ignore());
var ALLOW_ALL = () => false;
async function loadMatcher(root) {
  try {
    const content = await fs4.promises.readFile(path4.join(root, ".gitignore"), "utf-8");
    return (0, import_ignore.default)().add(content);
  } catch {
    return null;
  }
}
async function createGitignorePredicate(roots, respect) {
  if (!respect || roots.length === 0) {
    return ALLOW_ALL;
  }
  const matchers = (await Promise.all(roots.map(async (root) => ({ root, ig: await loadMatcher(root) })))).filter((m) => m.ig !== null);
  if (matchers.length === 0) {
    return ALLOW_ALL;
  }
  return (fsPath, isDirectory) => {
    for (const { root, ig } of matchers) {
      if (fsPath === root) {
        continue;
      }
      if (fsPath.startsWith(root + path4.sep)) {
        const rel = path4.relative(root, fsPath).replace(/\\/g, "/");
        if (!rel) {
          continue;
        }
        const ignored = isDirectory ? ig.ignores(rel) || ig.ignores(rel + "/") : ig.ignores(rel);
        if (ignored) {
          return true;
        }
      }
    }
    return false;
  };
}

// src/scan-selection-cli.ts
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
function flattenTree(nodes, out) {
  for (const node of nodes) {
    out.push(`${node.isDirectory ? "D" : "F"}	${node.path ?? ""}`);
    if (node.isDirectory) {
      flattenTree(node.children, out);
    }
  }
}
async function main(argv = process.argv) {
  const fileArg = argv[2];
  const raw = fileArg ? fs5.readFileSync(fileArg, "utf-8") : await readStdin();
  let req;
  try {
    req = JSON.parse(raw);
  } catch (error) {
    process.stderr.write(`scan-selection: invalid JSON request: ${String(error)}
`);
    process.exitCode = 2;
    return;
  }
  const rootDir = req.rootDir ?? process.cwd();
  const mode = req.mode ?? "scan";
  if (mode === "scan" || mode === "count") {
    const text = await scanSelectionToString({
      rootDir,
      includedFiles: req.includedFiles ?? [],
      includeEnvFiles: req.includeEnvFiles ?? false,
      stripComments: req.stripComments ?? false,
      removeBlankLines: req.removeBlankLines ?? false
    });
    if (mode === "count") {
      const chars = text.length;
      const lines = chars === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
      process.stdout.write(lines + "	" + chars);
    } else {
      process.stdout.write(text);
    }
    return;
  }
  if (mode === "copyfiles") {
    if (!req.targetDir) {
      process.stderr.write("scan-selection: copyfiles requires a targetDir\n");
      process.exitCode = 2;
      return;
    }
    const written = await copySelectionToDir({
      targetDir: req.targetDir,
      includedFiles: req.includedFiles ?? [],
      stripComments: req.stripComments ?? false,
      removeBlankLines: req.removeBlankLines ?? false
    });
    process.stdout.write(String(written));
    return;
  }
  const isIgnored = await createGitignorePredicate([rootDir], req.respectGitignore ?? true);
  const blacklist = mode === "skeleton" && Array.isArray(req.excludeFolders) ? req.excludeFolders : [...DEFAULT_IGNORE];
  const children = await buildTree(rootDir, rootDir, { blacklist, isIgnored });
  if (mode === "tree") {
    const lines = [];
    flattenTree(children, lines);
    process.stdout.write(lines.join("\n"));
    return;
  }
  if (mode === "skeleton") {
    const root = { name: resolveRootName(rootDir), isDirectory: true, children };
    process.stdout.write(renderTree(root));
    return;
  }
  process.stderr.write(`scan-selection: unknown mode "${mode}"
`);
  process.exitCode = 2;
}
if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}
`);
    process.exitCode = 1;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
