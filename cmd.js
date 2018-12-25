#!/usr/bin/env node
const excel_mysql = require("./libs");

const path = require("path");
const fs = require("fs");
var opt = require("node-getopt")
  .create([
    ["i", "input=ARG", "excel-file Path"],
    ["o", "output=ARG", "sql-file path or json-file path"],
    ["", "no-comment", "no comment for table and columns in sql"],
    ["", "show-sql", "print sql to console"],
    [
      "S",
      "=",
      "a number, print sql to console, and the string.length <= this number"
    ],
    [
      "",
      "ingnore-prefix=ARG",
      "if the name field starts with that, it will be ignored"
    ],
    ["", "help", "show Help"],
    ["v", "version", "show version"],
    ["m", "mode=ARG", "mode: create(default), delete, update, diff"],

    ["P", "port=ARG", "mysql:port default: 3306"],
    ["h", "host=ARG", "mysql:host default: 127.0.0.1"],
    ["p", "password=ARG", "mysql:password default: root"],
    ["u", "user=ARG", "mysql:username default: root"],
    ["d", "database=ARG", "mysql:database"],

    ["c", "config=ARG", "defualt: default.config.js"]
  ])
  .bindHelp()
  .parseSystem();

var version = opt.options["v"];
if (version) {
  console.log(require("./package.json").version);
  return;
}

var curPath = process.cwd();

var configFile = path.join(curPath, opt.options["c"] || "default.config.js");

let _config = {};
let _configDir = curPath;

if (fs.existsSync(configFile)) {
  _config = require(configFile);
  _configDir = path.dirname(configFile);
}

var showSql =
  _config["show-sql"] || opt.options["show-sql"] || opt.options["S"];
var sqlLimit = opt.options["S"];
var output = path.join(_configDir, _config["output"] || opt.options["o"]);

var config = {};

if (_config["mysql"] || opt.options["d"]) {
  if (!_config["mysql"]) {
    _config["mysql"] = {};
  }
  config.mysql = {
    host: _config["mysql"]["host"] || opt.options["h"] || "127.0.0.1",
    user: _config["mysql"]["user"] || opt.options["u"] || "root",
    password: _config["mysql"]["password"] || opt.options["p"] || "root",
    port: _config["mysql"]["port"] || opt.options["P"] || "3306",
    database: _config["mysql"]["database"] || opt.options["d"]
  };
}

config.mode = _config["mode"] || opt.options["m"] || "create";
config.input = path.join(_configDir, _config["input"] || opt.options["i"]);
config.no_comment = _config["no-comment"] || opt.options["no-comment"];
config.ingnore_prefix =
  _config["ingnore-prefix"] || opt.options["ingnore-prefix"] || "_";

if (config.input && !path.isAbsolute(config.input)) {
  config.input = path.join(curPath, config.input);
}

try {
  if (output) {
    if (!path.isAbsolute(output)) {
      output = path.join(curPath, output);
    }
    if (fs.existsSync(output)) {
      var state = fs.statSync(output);
      if (state.isDirectory()) {
        //如果是已存在的路径 就加上sql文件
        // output += "/" + (config.database || "db") + ".sql";
        if (config.mode === "diff") {
          output = path.join(output, (config.database || "db") + ".json");
        } else {
          output = path.join(output, (config.database || "db") + ".sql");
        }
      } else {
        fs.unlinkSync(output);
      }
      fs.writeFileSync(output, config.mode === "diff" ? "" : "# sql\r\n");
    } else {
      //直接写入 如果异常，则说明不是文件或者文件路径不存在
      fs.writeFileSync(output, config.mode === "diff" ? "" : "# sql\r\n");
    }
  }
} catch (e) {
  console.error(e);
  output = "";
}

(async () => {
  var jsonData = [];
  await excel_mysql(config, (err, sql, result) => {
    err && console.error(err);
    if (result && typeof result == "string") {
      console.log(result);
    } else if (result && result.type == "diff" && result.data) {
      if (output) {
        var diffStr =
          "#[ diff ] \r\n" + JSON.stringify(result.data) + ";\r\n\r\n";
        console.log(diffStr);
        jsonData = jsonData.concat(result.data);
      }
    }

    if (sql) {
      if (showSql) {
        var sqlStr = "[" + sql.type + "] - " + sql.sql;
        if (sqlLimit) {
          console.log(
            sqlStr.length > sqlLimit
              ? sqlStr.substr(0, sqlLimit) + "..."
              : sqlStr
          );
        } else {
          console.log(sqlStr);
        }
      }
      if (output) {
        var sqlStr = "#[" + sql.type + "] \r\n" + sql.sql + ";\r\n\r\n";
        fs.appendFileSync(output, sqlStr);
      }
    }
  });
  if (config.mode === "diff") {
    fs.appendFileSync(output, JSON.stringify(jsonData, null, "\t"));
  }
})();
