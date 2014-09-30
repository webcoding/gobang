var AI = function() {
    var root = this;

    var AI = function() {}

    var switchPlayer = function(crt) {
        return 1 - crt;
    }

    var maxList = [0x7fffffff + 1];
    for (var i = 1; i < 8; i++) {
        maxList.push(maxList[i - 1] / 8);
    }

    var genRules = function(crt) {
        var otr = switchPlayer(crt);
        return [
            [[crt, 5, 0], maxList[0]],
            [[crt, 5, 1], maxList[0]],
            [[crt, 5, 2], maxList[0]],
            [[otr, 5, 0], -maxList[1]], 
            [[otr, 5, 1], -maxList[1]],
            [[otr, 5, 2], -maxList[1]],
            [[crt, 4, 1], maxList[2]],
            [[crt, 4, 2], maxList[2]],
            [[otr, 4, 2], -maxList[3]],
            [[crt, 3, 2], maxList[4]],
            [[otr, 3, 2], -maxList[5]],
            [[otr, 4, 1], -maxList[5]],
            [[crt, 2, 2], maxList[6]],
            [[otr, 2, 2], -maxList[6]],
            [[crt, 2, 1], maxList[7]],
            [[otr, 2, 1], -maxList[7]]
        ];
    };
    var rules = [];
    rules[0] = genRules(0);
    rules[1] = genRules(1);

    var orgs = function(grid) {
        var row = grid.length;
        var col = grid[0].length;
        return [
            [_.map(_.range(0, col), function(v) {return [0, v];}), 
            [[1, 0], [1, 1], [1, -1]]],
            [_.map(_.range(0, col), function(v) {return [row - 1, v];}), 
            [[-1, 1], [-1, -1]]],
            [_.map(_.range(0, row), function(v) {return [v, 0];}), 
            [[0, 1]]]
        ];
    }

    var getRow = function(grid, org, dir) {
        var row = grid.length;
        var col = grid[0].length;
        var i = org[0];
        var j = org[1];
        var ret = [[]];
        var cnt = 0;
        while (i < row && j < col && i >= 0 && j >= 0) {
            if (_.isEmpty(ret[cnt]) || _.last(ret[cnt]) == grid[i][j])
                ret[cnt].push(grid[i][j]);
            else {
                cnt += 1;
                ret[cnt] = [];
                ret[cnt].push(grid[i][j]);
            }
            i += dir[0];
            j += dir[1];
        }
        return ret;
    }

    var calcState = function(grid) {
        var ret = {};
        var createOrIncrease = function(ctr, l, h) {
            if (!ret[ctr]) ret[ctr] = {};
            if (!ret[ctr][l]) ret[ctr][l] = {};
            if (!ret[ctr][l][h]) 
                ret[ctr][l][h] = 1;
            else
                ret[ctr][l][h]++;
        }
        _.each(orgs(grid), function(org) {
            for (var i = 0; i < org[0].length; i++) { // orgs
                for (var j = 0; j < org[1].length; j++) {  // dirs
                    var rows = getRow(grid, org[0][i], org[1][j]);
                    for (var k = 0; k < rows.length; k++) {
                        if (rows[k][0] == -1 || rows[k].length < 2) continue;
                        var head = 0;
                        if (k != 0 && rows[k - 1][0] == -1) head += 1;
                        if (k != rows.length - 1 && rows[k + 1][0] == -1) head += 1;
                        createOrIncrease(rows[k][0], rows[k].length, head);
                    }
                }
            }
        });
        return ret;
    }

    var chance = function(grid, crt) {
        var state = calcState(grid);
        var getInState = function(r) {
            var tmp = state[r[0]];
            if (!tmp) return 0;
            tmp = tmp[r[1]];
            if (!tmp) return 0;
            tmp = tmp[r[2]];
            if (!tmp) return 0;
            return tmp;
        };
        var ret = 0;
        _.each(rules[crt], function(rule) {
            ret += getInState(rule[0]) * rule[1];
        });
        return ret;
    }
    //chance = _.memoize(chance, function(grid, crt) {
    //    return [grid, crt];
    //});

    AI.play = function(grid, crtPlayer, depth, maxChance) {
        if (depth == 0)
            return [chance(grid, crtPlayer), null];
        var row = grid.length;
        var col = grid[0].length;

        var notAlone = function(grid, r, c) {
            for (var i = -1; i <= 1; i++)
                for (var j = -1; j <= 1; j++) {
                    var newi = i + r;
                    var newj = j + c;
                    if (newi < 0 || newj < 0 || newi >= grid.length || newj >= grid[0].length)
                        continue;
                    if ((i != 0 || j != 0) && 
                            (grid[i + r][j + c] == 0 || grid[i + r][j + c] == 1))
                        return true;
                }
            return false;
        }
        var ret = [-0x7fffffff, null];
        for (var i = 0; i < row; i++) {
            for (var j = 0; j < col; j++) {
                if (grid[i][j] != -1) continue;
                if (!notAlone(grid, i, j)) continue;
                grid[i][j] = crtPlayer;
                if (depth != 1) {
                    // FIXME: check the victory directly
                    var tmp_cs = chance(grid, crtPlayer);
                    if (tmp_cs >= maxList[0]) {
                        grid[i][j] = -1;
                        return [tmp_cs, [i, j]];
                    }
                }
                var enm_ret = AI.play(grid, switchPlayer(crtPlayer), depth - 1, -ret[0]);
                grid[i][j] = -1;

                // TODO: add random reaction
                var enm_cs = -enm_ret[0];
                if (maxChance && enm_cs >= maxChance)
                    return [0x7fffffff * 100, [i, j]];
                if (enm_cs > ret[0])
                    ret = [enm_cs, [i, j]];
            }
        }
        return ret;
    }
    return AI;
}();
