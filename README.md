MSCU的传输使用RabbitMQ服务器，发送和接收分别如下：
发送：
通过运行在内部的python脚本（?）读取pdf文件发送到RabbitMQ服务器；
接收：
使用本项目中的MSCUMqConsumer运行在接收端，从RabbitMQ服务器上接收文件；