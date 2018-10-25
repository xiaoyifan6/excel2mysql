#!/usr/bin/env node
const excel_mysql = require('./libs');

const path = require("path");
const fs = require("fs");
var opt = require('node-getopt').create([
    ['i', 'input=ARG', 'excel-file Path'],
    ['o', 'output=ARG', 'sql-file path'],
    ['', 'no-comment', 'no comment for table and columns in sql'],
    ['', 'show-sql', 'print sql to console'],
    ['S', '=', 'a number, print sql to console, and the string.length <= this number'],
    ['', 'ingnore-prefix=ARG', 'if the name field starts with that, it will be ignored'],
    ['', 'help', 'show Help'],
    ['v', 'version', 'show version'],
    ['m', 'model=ARG', 'model: create(default), delete, update'],

    ['P', 'port=ARG', 'mysql:port default: 3306'],
    ['h', 'host=ARG', 'mysql:host default: 127.0.0.1'],
    ['p', 'password=ARG', 'mysql:password default: root'],
    ['u', 'user=ARG', 'mysql:username default: root'],
    ['d', 'database=ARG', 'mysql:database'],
])
    .bindHelp()
    .parseSystem();

var version = opt.options['v'];
if (version) {
    console.log(require('./package.json').version);
    return;
}

var curPath = process.cwd();

var showSql = opt.options['show-sql'] || opt.options['S'];
var sqlLimit = opt.options['S'];
var output = opt.options['o'];

var config = {};

if (opt.options['d']) {
    config.mysql = {
        host: opt.options['h'] || '127.0.0.1',
        user: opt.options['u'] || 'root',
        password: opt.options['p'] || 'root',
        port: opt.options['P'] || '3306',
        database: opt.options['d']
    };
}

config.model = opt.options['m'] || "create";
config.input = opt.options['i'];
config.no_comment = opt.options['no-comment'];
config.ingnore_prefix = opt.options['ingnore-prefix'] || '_';

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
            if (state.isDirectory()) {//如果是已存在的路径 就加上sql文件
                // output += "/" + (config.database || "db") + ".sql";
                output = path.join(output, (config.database || "db") + ".sql");
            } else {
                fs.unlinkSync(output);
            }
            fs.writeFileSync(output, "# sql\r\n");
        } else {
            //直接写入 如果异常，则说明不是文件或者文件路径不存在
            fs.writeFileSync(output, "# sql\r\n");
        }
    }
} catch (e) {
    console.error(e);
    output = "";
}

excel_mysql(config, (err, sql, result) => {
    err && console.error(err);
    if (result && (typeof result == "string")) {
        console.log(result);
    }
    if (sql) {
        if (showSql) {
            var sqlStr = "[" + sql.type + "] - " + sql.sql;
            if (sqlLimit) {
                console.log(sqlStr.length > sqlLimit ? (sqlStr.substr(0, sqlLimit) + "...") : sqlStr);
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





