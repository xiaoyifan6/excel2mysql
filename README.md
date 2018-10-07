
### Useage：

## Install

```
  npm install excel2mysql
```

## Use

just get sql:

```
var excel2mysql = require('excel2mysql');

var excelPath = "./sample.xls";

var excelPath = "./sample.xls";

excel2mysql({
    input: excelPath,
    model: 'create'
}, function (err, sql, result) {
    err && console.error(err);
    sql && console.log(sql.sql);
});

```

connect mysql:

```
var excel2mysql = require('excel2mysql');

var excelPath = "./sample.xls";

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
});

```

### param

- mysql: config for mysql
- model: 
```
delete: just drop table
update: just add new table , and import data to a new table
create: drop all table, then create tables and import data to tables
```

### excel fromat

config for table
![](./sample/imgs/1.png)

config for create table and import data to table

![](./sample/imgs/2.png)


data type(row:3):`[type],[pk,ai,nn,uq,(0)]...`

```
(0) = default 0 
ai = auto_increment
nn = not null
up = unique
pk = primary key
```

if use `ai`, this col will be ignored

![](./sample/imgs/3.png)