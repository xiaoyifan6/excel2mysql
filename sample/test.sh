#bin/bash

excel2mysql -m delete  -i ./sample.xls -o ./db.json -S 100 -dtest -uwork -pwork

excel2mysql -m diff  -i ./sample.xls -o ./db.json -S 100 -dtest -uwork -pwork

excel2mysql -m create  -i ./sample.xls -o ./db.json -S 100 -dtest -uwork -pwork

excel2mysql -m delete -c default.config.js -S 100

excel2mysql -m diff -c default.config.js -S 100

