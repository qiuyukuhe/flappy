"use strict";

var Flappy = function (text) {
    if (text) {
        text = text.replace(/\\/g, "");
        var obj = JSON.parse(text);
        this.username = obj.username;
        this.score = obj.score;
        this.createdate = new Date();
    } else {
        this.username = "";
        this.score = 0;
        this.createdate = new Date();
    }
};

Flappy.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

var FlappyContract = function () {
    //遗言字典
    LocalContractStorage.defineMapProperty(this, "dataMap");
    //index 到 字典key索引
    LocalContractStorage.defineMapProperty(this, "arrayMap");
    //字典size
    LocalContractStorage.defineProperty(this, "size");
};

FlappyContract.prototype = {
    init: function () {
        this.size = 0;
    },

    // 保存
    save: function (value) {
        var from = Blockchain.transaction.from;
        var dbFlappy = this.dataMap.get(from);
        //生成对象
        var flappy = new Flappy(value);
        //如果之前没有记录，初始化
        if (typeof(dbFlappy) == "undefined" || dbFlappy == null) {
            dbFlappy = flappy;
            var index = this.size;
            this.arrayMap.set(index, from);
            this.size += 1;
        }
        else {
            var score = parseInt(flappy.score);
            if (score > dbFlappy.score) {
                dbFlappy = flappy;
            }
        }

        //添加到数组
        this.dataMap.set(from, dbFlappy);
    },

    // 取最得分最靠前的三个
    top: function () {
        var from = Blockchain.transaction.from;
        if (from === "") {
            throw new Error("empty from")
        }

        var sortData = [];
        for (var i = 0; i < this.size; i++) {
            var _from = this.arrayMap.get(i);
            var data = this.dataMap.get(_from);
            if (i < 3) {
                sortData.push(data);
            }
            else {
                sortData.push(data);
                //从大到小排序
                sortData.sort(function (a, b) {
                    return a.score < b.score ? 1 : -1;
                });
                sortData = sortData.slice(0, 3);
            }

        }

        sortData.sort(function (a, b) {
            return a.score < b.score ? 1 : -1;
        });

        var flappy = this.dataMap.get(from);

        var data = {};
        data.top = sortData;
        data.size = this.size;

        if (typeof(flappy) != "undefined" && flappy != null) {
            data.self = flappy;
        }

        return data;
    },

    // 查询
    get: function () {
        var from = Blockchain.transaction.from;
        if (from === "") {
            throw new Error("empty from")
        }

        var flappy = this.dataMap.get(from);
        if (typeof(flappy) == "undefined" || flappy == null) {
            return flappy;
        }

        var scoreArray = [];
        var selfScore = 0;
        for (var i = 0; i < this.size; i++) {
            var _from = this.arrayMap.get(i)
            var data = this.dataMap.get(_from);
            if (_from == from) {
                selfScore = data.score;
            }
            scoreArray.push(data.score);
        }

        // 计算排名
        scoreArray.sort();
        flappy.index = scoreArray.indexOf(selfScore);

        return flappy;
    },

    //管理员分页查询
    forEach: function (limit, offset) {
        var master = 'n1MWYwsAJQDBjGL7kY5fwkfPcoJUb2HoD58';
        var from = Blockchain.transaction.from;
        //如果不是管理员,拒绝×
        // 来自地址
        if (master != from) {
            throw new Error("您没有权限读取");
        }

        limit = parseInt(limit);
        offset = parseInt(offset);
        if (offset > this.size) {
            throw new Error("offset is not valid");
        }
        var number = offset + limit;
        if (number > this.size) {
            number = this.size;
        }
        var result = [];
        for (var i = offset; i < number; i++) {
            var from = this.arrayMap.get(i);
            var object = this.dataMap.get(from);
            var temp = {
                index: i,
                key: from,
                value: object
            }
            result.push(temp);
        }
        return JSON.stringify(result);
    }

};
module.exports = FlappyContract;