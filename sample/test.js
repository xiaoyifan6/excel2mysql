var excel2mysql = require('../');
var fs = require('fs');
var excelPath = "./sample.xls";
if (!fs.existsSync(excelPath)) {
    excelPath = "./sample/sample.xls";
}
excel2mysql({
    input: excelPath,
    model: 'create',
    mysql: {
        host: '127.0.0.1',
        user: 'work',
        password: 'work',
        port: '3306',
        database: 'test'
    }
}, function (err, sql, result) {
    err && console.error(err);
    sql && console.log(sql.sql);
    // result && console.log(result);
});