var should = require("should");
var excel2mysql = require("../");

describe("xlsx to mysql", function() {
  // it('should convert xlsx to sql ', function () {
  //     excel2mysql({
  //         input: './sample/sample.xls',
  //     }, function (err, sql, result) {
  //         should.not.exist(err)
  //         // result.should.be.an.instanceOf(Object)
  //         err && console.error(err);

  //         sql && console.log(sql);
  //     })
  // })

  it("should convert xlsx to mysql", function() {
    excel2mysql(
      {
        input: "./sample/sample.xls",
        model: "diff",
        mysql: {
          host: "127.0.0.1",
          user: "work",
          password: "work",
          port: "3306",
          database: "test"
        }
      },
      function(err, sql, result) {
        should.not.exist(err);
        // result.should.be.an.instanceOf(Object)
        err && console.error(err);

        sql && console.log(sql.sql);

        result && console.log(result);
      }
    );
  });
});
