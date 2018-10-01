


//用于将excel导入到mysql
var mysql = require('mysql');
var exceltojson = require("xlsx-to-json-lc");
const fs = require("fs")

exports = module.exports = EXCEL_Mysql;

String.prototype.format = function () {
    a = this;
    for (k in arguments) {
        a = a.replace("{" + k + "}", arguments[k]);
    }
    return a;
}


function EXCEL_Mysql(config, callback) {
    var nomysql = false;
    if (!config.input) {
        callback && callback("err: You miss a input file");
        process.exit(1);
    } else if (!config.mysql) {
        callback && callback(null, null, "warn: You miss mysql config");
        nomysql = true;
    }

    new DB(config, callback, nomysql);

}


function DB(config, callback, nomysql) {
    var connect = null;
    try {
        if (!nomysql) {
            connect = mysql.createConnection(config.mysql);
            if (connect) {
                connect.connect();
            }
        }

        /**
         * create delete update
         */
        config.model = config.model || "create";
        config.ingnore_prefix = config.ingnore_prefix || "_";

        this.tableNames = [];
        var self = this;
        this.getTablesFromDB(connect).then(res => {
            callback && callback(null, null, res);
            if (res && res.length > 0) {
                self.tableNames = res;
            }
            self.run(config, connect, callback);
        }).catch(err => {
            console.log(err);
            callback && callback(err);
        });

    } catch (e) {
        console.error(e);
        callback && callback(e);
        this.closeConn(connect);
    }
}

// DB.prototype.createConn = function (mysqlConfig) {
//     return mysql.createConnection(mysqlConfig);
// }

DB.prototype.closeConn = function (connect) {
    var tmpFile = ".tmp.#json";
    if (fs.exists(tmpFile)) {
        fs.unlink(tmpFile);
    }
    connect && connect.end();
}

DB.prototype.getExcelData = function (excelPath, sheepName, tmpFile) {
    return new Promise((resolve, reject) => {
        if (!excelPath) {
            reject("You miss a input file!");
            return;
        }
        exceltojson && exceltojson({
            input: excelPath, //要转换的excel文件，如"/Users/chenyihui/文件/matt/1_2.xlsx"
            output: tmpFile,//"if you want output to be stored in a file", //输出的json文件，可以不写。如"./yeap.json"
            sheet: sheepName,  // 如果有多个表单的话，制定一个表单（excel下面那些标签），可以忽略
            lowerCaseHeaders: true //所有英文表头转成大写，可以忽略
        }, function (err, result) {
            if (fs.exists(tmpFile)) {
                fs.unlink(tmpFile);
            }
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

DB.prototype.println = function (sql, type, callback) {
    callback && callback(null, {
        type: type,
        sql: sql
    });
}

DB.prototype.run = function (config, connect, callback) {
    var tmpFile = ".tmp.#json";//tmp file
    this.getExcelData(config.input, null, tmpFile).then(res => {

        if (!res) {
            callback && callback(null, null, "warn: no tables");
            return;
        }

        var arr = [];
        var names = [];
        res.forEach(line => {
            var tableName = line[1] || line['sheetName'] || line['name'] || line['label'] || line["表名"];
            var comment = line[2] || line['comment'] || line['注释'] || line['中文名'] || line["说明"];
            if (config.model != "update") {//删除表
                arr.push(this.dropTable(connect, tableName, callback));
            }
            names.push({
                name: tableName,
                comment: comment
            });
        });

        if (arr.length == 0) {
            if (config.model == "delete") {
                this.closeConn(connect);
            } else {
                var arr0 = [];
                names.forEach(tb => {
                    arr0.push(this.createTableBySheet(connect, callback, config, tb.name, tb.comment));
                });
                if (arr0.length == 0) {
                    this.closeConn(connect);
                    return;
                }

                Promise.all(arr0).then(res => {
                    callback && callback(null, null, res);
                    this.closeConn(connect);
                }).catch(err => {
                    callback && callback(err);
                    this.closeConn(connect);
                });
            }
            return;
        }

        Promise.all(arr).then(res => {
            callback && callback(null, null, res);
            var arr0 = [];
            if (config.model != "delete") {
                names.forEach(tb => {
                    arr0.push(this.createTableBySheet(connect, callback, config, tb.name, tb.comment));
                });
            }

            if (arr0.length == 0) {
                this.closeConn(connect);
                return;
            }

            Promise.all(arr0).then(res => {
                callback && callback(null, null, res);
                this.closeConn(connect);
            }).catch(err => {
                callback && callback(err);
                this.closeConn(connect);
            });

        }).catch(err => {
            callback && callback(err);
            this.closeConn(connect);
        });

    }).catch(err => {
        callback && callback(err);
        this.closeConn(connect);
    });
}

/**
 * 创建表
 * @param {表名} tableName 
 * @param {*} rows 
 */
DB.prototype.createTable = function (connect, callback, tableName, rows, comment) {
    return new Promise((resolv, reject) => {
        if (!tableName || !rows || rows.length == 0) {
            reject("tableName cannot be null or empty string and please confirm there have one field at least");
            return;
        }

        var getType = function (type, len) {
            var types = type
                .toLowerCase()
                .trim()
                .replace(",pk", ",primary key ")
                .replace(",nn", ",not null ")
                .replace(",uk", ",unique")
                .replace(",ai", ",auto_increment")
                .replace(",(null)", "")
                .replace(/,[(](.*)[)]/, "default '$1'")
                .split(",");

            switch (types[0].toLowerCase()) {
                case 'string': types[0] = "varchar"; break;
                case 'boolean': types[0] = "tinyint"; break;
            }

            if (len) {
                types[0] += '(' + len + ') ';
            } else if (types[0].toLowerCase() == 'varcher') {
                types[0] += '(255) ';
            }
            return types.join(' ');
        }

        var sql = "create table if not exists {0} ( {1} ) ENGINE=InnoDB DEFAULT CHARSET=utf8";
        if (comment) {
            sql += " comment='" + comment + "'";
        }
        var lines = [];
        for (var key in rows) {
            var line = "";
            var row = rows[key];
            if (row && row.name) {
                line += " `" + row.name + "` ";
                var _type = getType(row.type, row.len); // row.len ? row.type + ("(" + row.len + ")") : row.type;
                if (row.name == "id" && _type.indexOf("primary key") < 0) {
                    _type += " primary key ";
                }
                line += _type;
                if (row.comment) {
                    line += " comment '" + row.comment + "'"
                }
            }
            lines.push(line);
        }

        this.println(sql.format(tableName, lines.join(",")), "create", callback);
        if (!connect) {
            resolv();
            return;
        }
        connect.query(sql.format(tableName, lines.join(",")), (err, result, field) => {
            if (err) {
                reject(err);
            } else {
                resolv(result);
            }
        });
    });
}

/**
 * 删除表
 * @param {表名} tableName 
 */
DB.prototype.dropTable = function (connect, tableName, callback) {
    return new Promise((resolve, reject) => {
        if (!tableName) {
            reject("tableName cannot be null or empty string");
            return;
        }
        var sql = "drop table if exists " + tableName;
        this.println(sql, "drop", callback);
        if (!connect) {
            resolve();
            return;
        }
        connect && connect.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * 添加元素
 * @param {表名} tableName 
 * @param {*} dataItems 
 */
DB.prototype.insertData = function (connect, tableName, dataItems, callback, ignoreID) {
    return new Promise((resolve, reject) => {
        if (!tableName || !dataItems || dataItems.length == 0) {
            reject("tableName cannot be null or empty string and there is no data to import");
            return;
        }
        var sql = "insert into {0} {1} values {2}";
        var keys = [];
        var keys0 = [];

        for (var key in dataItems[0]) {
            if (key && !key.startsWith("_") && key != ignoreID) {
                keys.push(key);
                keys0.push('`' + key + '`');
            }
        }
        var values = [];

        var parseVal = function (val) {

            if (val == null || val == 'null') return "null";
            else if (val.trim().length == 0) return "''";
            try {
                if (isNaN(parseFloat(val))) {
                    return "'" + val + "'";
                }
                return val;
            } catch (e) {
                return "'" + val + "'";
            }
        }

        for (var i = 0; i < dataItems.length; i++) {
            var value = "( ";
            var v = [];
            for (var key of keys) {
                key && v.push(parseVal(dataItems[i][key]));
            }
            value += v.join(",");
            value += ")";

            values.push(value);
        }

        this.println(sql.format(tableName, "(" + keys0.join(",") + ")", values), "insert", callback);
        if (!connect) {
            resolve();
            return;
        }
        connect.query(sql.format(tableName, "(" + keys0.join(",") + ")", values), (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}


DB.prototype.createTableBySheet = function (connect, callback, config, tableName, comment) {
    return new Promise((resolve, reject) => {
        var tmpFile = ".tmp.#json";//tmp file
        this.getExcelData(config.input, tableName, tmpFile).then(res => {
            if (!res || res.length == 0) {
                reject("no such database:" + tableName);
                return;
            }
            var rows = [];
            var datas = [];
            var ignoreID = "";
            Object.keys(res[0]).forEach((v) => {
                if (!v || v.startsWith(config.ingnore_prefix)) return;
                rows.push({
                    name: v,
                    comment: res[0][v],
                    type: res[1][v],
                    len: res[2][v],
                });
                if (res[1][v].indexOf(",ai") >= 0 || res[1][v].indexOf(",auto_increment") >= 0) {
                    ignoreID = v;
                }
            });
            for (var i = 3; i < res.length; i++) {
                datas.push(res[i]);
            }
            this.createTable(connect, callback, tableName, rows, comment).then(res => {
                callback && callback(null, null, res);
                if (datas.length > 0) {
                    if (config.model == "update") {
                        var res1 = this.tableNames;
                        if (res1 && res1.indexOf(tableName) >= 0) {
                            resolve(res1);
                        } else {
                            this.insertData(connect, tableName, datas, callback, ignoreID).then(res0 => {
                                resolve(res0);
                            }).catch(err0 => {
                                reject(err0);
                            });
                        }
                        // this.getTablesFromDB(connect).then(res1 => {
                        //     if (res1 && res1.indexOf(tableName) >= 0) {
                        //         resolve(res1);
                        //     } else {
                        //         this.insertData(connect, tableName, datas, callback).then(res0 => {
                        //             resolve(res0);
                        //         }).catch(err0 => {
                        //             reject(err0);
                        //         });
                        //     }
                        // }).catch(err1 => {
                        //     reject(err1);
                        // });
                    } else {
                        this.insertData(connect, tableName, datas, callback, ignoreID).then(res0 => {
                            resolve(res0);
                        }).catch(err0 => {
                            reject(err0);
                        });
                    }
                    // resolve(res);
                } else {
                    resolve(res);
                }
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err);
        });
    });
}


/**
 * 从数据库获取所有表
 */
DB.prototype.getTablesFromDB = function (connect) {
    return new Promise((resolve, reject) => {
        if (!connect) {
            resolve([]);
        }
        connect.query("show tables", (err, result, fields) => {
            if (err) {
                reject(err);
            } else {
                var tables = [];
                if (result || result.length > 0) {
                    result.forEach(row => {
                        tables.push(row[fields[0].name]);
                    });
                }
                resolve(tables);
            }
        });
    });
}

DB.prototype.mkdir = function (path) {
    return new Promise((resolve, reject) => {
        fs.exists(path, exists => {
            if (exists) {
                resolve();
            } else {
                fs.mkdir(sqlPath, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        })
    });
}