#!/usr/bin/env node
var config = require('config');
var amqp = require('amqplib/callback_api');
const fs = require('fs');

let rabbitMQServer = config.get('rabbitMQServer');
let { server, port, VHost, user, password } = rabbitMQServer;
let rabbitMQXQ = config.get('rabbitMQXQ');
let { exchange, queue, binding_key } = rabbitMQXQ;
let savePathSetting = config.get('savePath');

let connectionstring = `amqp://${user}:${password}@${server}:${port}/${VHost}`;
amqp.connect(connectionstring, function (error0, connection) {
    if (error0) {
        throw error0;
    }

    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue, {
            exclusive: true
        }, function (error2, q) {
            if (error2) {
                throw error2;
            }

            console.log(' [*] Waiting for logs. To exit press CTRL+C');

            channel.bindQueue(q.queue, exchange, binding_key);
            channel.consume(q.queue, function (msg) {
                let { fields, content } = msg;
                console.log(" [x] %s", fields.routingKey);
                if (content.byteLength > 200) {
                    let metaString = content.subarray(0, 200).toString();
                    let meta = metaString.trimEnd().split('|');
                    if (meta.length === 2) {
                        let fileName = meta[1], fileType = meta[0];
                        let savePath = savePathSetting[fileType];
                        if (fileType === 'msds') {
                            // MSDS 文件的名称格式为 xxxxx_[CN|EN|DE|FR].pdf
                            let lang = fileName.substring(fileName.indexOf('_') + 1, fileName.indexOf('.')).toUpperCase();
                            savePath = savePath[lang];
                        }
                        if (savePath !== undefined) {
                            fs.writeFile(savePath + fileName, content.subarray(200), (err) => {
                                if (err) throw err;
                                console.log('the file has been saved!');
                            });
                        }
                    }
                }
            }, {
                noAck: true
            });
        });
    });
});