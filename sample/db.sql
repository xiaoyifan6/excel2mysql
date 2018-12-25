# sql
#[drop] 
drop table if exists `user`;

#[drop] 
drop table if exists `teacher`;

#[drop] 
drop table if exists `subject`;

#[create] 
create table if not exists `user` (  `id` int(11)  primary key  auto_increment  comment '学生id', `name` varchar(20)  default 'abc'  comment '学生姓名', `age` int(11)  comment '年龄', `gender` tinyint comment '性别' ) ENGINE=InnoDB DEFAULT CHARSET=utf8 comment='用户表';

#[create] 
create table if not exists `teacher` (  `id` int(11)  primary key  auto_increment  comment '教师id', `name` varchar(20)  comment '姓名', `subject` varchar(20)  comment '教授科目' ) ENGINE=InnoDB DEFAULT CHARSET=utf8 comment='教师表';

#[create] 
create table if not exists `subject` (  `desc` varchar(255)  default '未知'  comment '描述', `id` int(11)  primary key  unique  comment '科目id', `name` varchar(20)  unique  comment '名称' ) ENGINE=InnoDB DEFAULT CHARSET=utf8 comment='科目表';

#[insert] 
insert into `user` (`name`,`age`,`gender`) values ( 'tom',11,1),( 'asd123@aa.com',12,0),( 'abc',13,1),( 12,null,0);

#[insert] 
insert into `teacher` (`name`,`subject`) values ( 'are','math');

#[insert] 
insert into `subject` (`desc`,`id`,`name`) values ( '数学',1001,'math'),( '物理',1002,'physics'),( '历史',1003,'history');

