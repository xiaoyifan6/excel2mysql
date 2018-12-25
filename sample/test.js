var excel2mysql = require("../");
var fs = require("fs");
var excelPath = "./sample.xls";
if (!fs.existsSync(excelPath)) {
  excelPath = "./sample/sample.xls";
}

(async function(excelPath) {
  var start = new Date().getTime();
  await excel2mysql(
    {
      input: excelPath,
      mode: "diff",
      mysql: {
        host: "127.0.0.1",
        user: "work",
        password: "work",
        port: "3306",
        database: "test"
      }
    },
    function(err, sql, result) {
      err && console.error(err);
      // sql && console.log(sql.sql);
      result && result.type && console.log(JSON.stringify(result.data) + " \n");
    }
  );

  console.log(
    "end. use time: " + (new Date().getTime() - start) / 1000 + " s."
  );
})(excelPath);
