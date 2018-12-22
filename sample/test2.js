const changesets = require("diff-json");

const data = require("./data.json");

var excelData = {};
var mysqlData = {};

function genMysqlField(fields, arr) {
  if (!arr) return;
  arr.forEach(item => {
    let field = {};
    field.name = item["COLUMN_NAME"];
    let types = [];
    types.push(item["COLUMN_TYPE"]);
    if (item["EXTRA"]) {
      if (item["EXTRA"].includes("auto_increment")) {
        types.push("ai");
      }
    }

    if (item["COLUMN_KEY"] === "PRI") {
      types.push("pk");
    }

    if (item["COLUMN_KEY"] === "UNI") {
      types.push("uq");
    }

    if (item["IS_NULLABLE"] === "NO") {
      types.push("nn");
    }

    if (item["COLUMN_DEFAULT"]) {
      types.push("(" + item["COLUMN_DEFAULT"] + ")");
    }

    field.types = types.sort().join(",");
    field.comment = item["COLUMN_COMMENT"];
    fields[field.name] = field;
  });
}

function genExcelField(fields, arr) {
  if (!arr) return;
  arr.forEach(item => {
    let field = {};
    field.name = item.name;
    let types = [];
    if (item.type) {
      types = item.type.split(",");
      if (types[0]) {
        if (item.len) {
          types[0] += "(" + item.len + ")";
        } else if (types[0] === "tinyint") {
          types[0] += "(4)";
        }
      }

      if (item.type.includes(",pk") && !item.type.includes(",nn")) {
        types.push("nn");
      }
    }
    field.types = types.sort().join(",");
    field.comment = item.comment;
    // field.data = item.data;
    fields[field.name] = field;
  });
}

data.forEach(item => {
  if (item.mysql) {
    var table = {};
    table.type = "table";
    table.name = item.tableName;
    table.fields = {};

    genMysqlField(table.fields, item.mysql);

    mysqlData[item.tableName] = table;
  }
  if (item.excel) {
    var table = {};
    table.type = "table";
    table.name = item.tableName;
    table.fields = {};
    genExcelField(table.fields, item.excel.rows);
    excelData[item.tableName] = table;
  }
});

diffs = changesets.diff(excelData, mysqlData, {});
console.log(JSON.stringify(diffs, null, "\t"));
// console.log(JSON.stringify(excelData));
// console.log(JSON.stringify(mysqlData));
