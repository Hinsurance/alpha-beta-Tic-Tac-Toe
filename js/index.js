var MAX = 100,//玩家胜
	DRAW = 0,//平局
	MIN = -100,//电脑胜
	cmpBestMove = 0,//电脑最佳走步
	chess = [],//棋局
	dept = 0,//搜索深度
	isPlayerNow = true;// 判断当前是否为玩家下子 从html文件得到该布尔值

$(function() {
	//点击开始按钮开始游戏
	$('#start-game-btn').on('click',function() {
		//判断当前哪方下子
		var s2 = $("input[name='game']:checked").val();
		if (s2 == 'true') {
			isPlayerNow = true;
		} else if (s2 == 'false') {
			isPlayerNow = false;
		}

		//清空棋盘
		for (var i = 0;i < 9;i++) {
			$('#item'+i).html('');
		};

		layer.open({
		  	title: '提示信息',
		  	content: '游戏开始'
		});  
		
		//搜索深度
		dept = $('#dept').val();
		
		//当前棋局
		getCurChess();

		if (isPlayerNow) {
			//玩家下子
			playButtonClick();
		} else {
			//电脑下子
			cmpPlay();
		}
	})
})

/**
 * 获得当前棋局
 * @return {[type]} [description]
 */
function getCurChess() {
	for (var i = 0;i < 9;i++) {
		chess[i] = $('#item'+i).html();
	};
}

/**
 * 下子的函数
 * @return {[type]} [description]
 */
function playButtonClick() {
	var items = $('#items');
	items.on('click',function(e) {
		var cur_item = e.target;
		
		//非空节点不可再下子
		if (!!$(cur_item).html()) {
			return false;
		}

		if(isPlayerNow) {
			//玩家下'X'
			$(cur_item).html('X');
			isPlayerNow = false;
			getCurChess();
			cmpPlay();
		} else {
			//return false;
			//电脑下'O'
			$(cur_item).html('O');
			isPlayerNow = true;
			getCurChess();
		}
	})
}

/**
 * 判断是否三子成一线的函数
 * @param  {string}  item1 第一个子
 * @param  {string}  item2 第二个子
 * @param  {string}  item3 第三个子
 * @return {Boolean}       true/false
 */
function isALine(item1,item2,item3) {
	if (!item1) {
		return false;
	} else {
		var flag = (item1==item2)&&(item2==item3);
		return flag;
	}
}

/**
 * 判断棋盘是否满子
 * @param  {array}  chess  当前棋局
 * @return {Boolean}       true/false
 */
function isChessFull(chess) {
	var count = 0;
	for (var i = 0;i < 9;i++) {
		if (!chess[i]) {
			return false;
		} else {
			count++;
		}
	}
	if (count == 9) {
		return true;
	}
}

/**
 * 计算当前棋局评估值
 * @param  {array} chess 当前棋局
 * @param  {string} item  棋子
 * @return {number}       填满棋局时当前棋子三子成线总数
 */
function calculate(chess,item) {
	var count = 0,
		blank_arr = [];

	//填满当前棋局
	for (var i = 0;i < 9;i++) {
		if (!chess[i]) {
			blank_arr.push(i);//记录当前棋局空格的位置
			chess[i] = item;
		}
	}

	if (isALine(chess[0],chess[1],chess[2]) && chess[0] == item) {
		count++;
	}
	if (isALine(chess[0],chess[4],chess[8]) && chess[0] == item) {
		count++;
	}
	if (isALine(chess[0],chess[3],chess[6]) && chess[0] == item) {
		count++;
	}
	if (isALine(chess[2],chess[4],chess[6]) && chess[2] == item) {
		count++;
	}
	if (isALine(chess[2],chess[5],chess[8]) && chess[2] == item) {
		count++;
	}
	if (isALine(chess[3],chess[4],chess[5]) && chess[4] == item) {
		count++;
	}
	if (isALine(chess[1],chess[4],chess[7]) && chess[4] == item) {
		count++;
	}
	if (isALine(chess[6],chess[7],chess[8]) && chess[6] == item) {
		count++;
	}

	//恢复棋局
	for (var i = 0;i < blank_arr.length;i++) {
		chess[blank_arr[i]] = '';
	}
	return count;
}


/**
 * 分析棋局
 * @param  {array} chess 当前棋局
 * @return {[type]}       [description]
 */
function gameAnalysis(chess) {
	var state = 'UNDETERMINED';
	if (isALine(chess[0],chess[1],chess[2]) || isALine(chess[0],chess[4],chess[8]) || isALine(chess[0],chess[3],chess[6])) {
		state = chess[0];
	} else if (isALine(chess[1],chess[4],chess[7]) || isALine(chess[3],chess[4],chess[5])) {
		state = chess[4];
	} else if (isALine(chess[2],chess[4],chess[6]) || isALine(chess[2],chess[5],chess[8])) {
		state = chess[2];
	} else if(isALine(chess[6],chess[7],chess[8])) {
		state = chess[6];
	}

	if (state == 'X') {//玩家胜
		return MAX;
	} else if (state == 'O') {//电脑胜
		return MIN;
	} else if (state == 'UNDETERMINED') {
		if (isChessFull(chess)) {//棋盘已满 平局
			return DRAW;
		} else {//未决出胜负且棋盘未满
			return calculate(chess,'X') - calculate(chess,'O');
		}
	}
}

/**
 * 电脑下子估值
 * @param  {[type]}  chess      当前棋局
 * @param  {[type]}  alpha      父节点α，用来进行剪枝
 * @param  {[type]}  maxborder  当前节点估值倒推值的上确界
 * @param  {[type]}  dept       搜索深度
 * @param  {Boolean} isRootNode 是否为根节点
 * @return {[type]}             返回MIN节点的β值
 */
function findCmpMove(chess,alpha,maxborder,dept,isRootNode) {
	var isFirstChild = true,//第一个子节点
		beta = maxborder;

	//到达搜索深度 计算估值
	if (dept == 0) {
		return gameAnalysis(chess);
	}
	//棋盘已满
	if (isChessFull(chess)) {
		if (gameAnalysis(chess) == DRAW) {
			layer.open({
			  	title: '提示信息',
			  	content: '平局'
			});
			return DRAW;
		}
	}
	//玩家胜
	if (gameAnalysis(chess) == MAX) {
		layer.open({
		  	title: '提示信息',
		  	content: '玩家获胜'
		});
		return MAX;
	}
	
	for (var i = 0;i < 9 && beta > alpha;i++) {
		if (!chess[i]) {
			chess[i] = 'O';//先试子 再展开子节点
			var response = findPlayerMove(chess,alpha,beta,dept-1);//展开子节点 并返回其倒推值
			chess[i] = '';
			if (isFirstChild) {//第一个子节点的值必须记录
				beta = response;
				isFirstChild = false;
				if (isRootNode) {//是根节点才记录最佳的下子位置，避免后辈的MIN节点改变了全局变量cmpBestMove
					cmpBestMove = i;
				}
			} else if (response < beta) {//子节点的倒推值小于beta 更新MIN节点的β值
				beta = response;
				if (isRootNode) {
					cmpBestMove = i;
				}
			}
		}
	}
	return beta;
}

/**
 * 玩家下子估值
 * @param  {[type]} chess     当前棋局
 * @param  {[type]} minborder 当前节点估值倒推值的下确界
 * @param  {[type]} beta      父节点的β值，用于进行剪枝
 * @param  {[type]} dept      搜索深度
 * @return {[type]}           返回MAX节点的α值
 */
function findPlayerMove(chess,minborder,beta,dept) {
	var isFirstChild = true,
		alpha = minborder;

	//到达指定搜索深度 计算估值
	if (dept == 0) {
		return gameAnalysis(chess);
	}
	//棋盘已满
	if (isChessFull(chess)) {
		if (gameAnalysis(chess) == DRAW) {
			layer.open({
			  	title: '提示信息',
			  	content: '平局'
			});
			return DRAW;
		}
	}
	//电脑获胜
	if (gameAnalysis(chess) == MIN) {
		layer.open({
		  	title: '提示信息',
		  	content: '电脑获胜'
		});
		return MIN;
	}

	for (var i = 0;i < 9 && alpha < beta;i++) {
		if (!chess[i]) {
			chess[i] = 'X';
			var response = findCmpMove(chess,alpha,beta,dept-1,false);
			chess[i] = '';
			if (isFirstChild) {
				alpha = response;
				isFirstChild = false;
			} else if (response > alpha) {
				alpha = response;
			}
		}
	}
	return alpha;
}

/**
 * 电脑下子
 * @return {[type]} [description]
 */
function cmpPlay() {
	var dept = $('#dept').val();
	findCmpMove(chess,MIN,MAX,dept,true);
	$('#item'+cmpBestMove).html('O');
	isPlayerNow = true;
	getCurChess();
}