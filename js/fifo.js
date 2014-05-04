$(function() {
  var tool = {},
      logic = {},
      ins = {
        insNext: null,
        insCur: null,
        usage: null
      },
      mem = {
        pages: [/* { num: 页编号, timestamp: 装入时间戳 } */],
        pageCapacity: 4,
        pageMissing: 0 /* 缺页次数 */
      },
      ui = {};

  var config = {
    insCount: 320,
    probJump: 0.5
  };

  /**
   * 生成一个固定长度，且填充默认值的数组
   * @param  {object} what 填充的默认值
   * @param  {integer} L   数组的长度
   * @return {array}       生成的数组
   */
  tool.makeArray = function(what, L) {
    var ret = [];
    while (L) {
      ret[--L] = what;
    }
    return ret;
  };

  /**
   * 寻找下一条未使用指令的编号
   * @return {integer|null}  下一条未使用的指令，如不存在返回null
   */
  ins._nextUnused = function() {
    var i = ins.insCur + 1;
    for(; i < config.insCount; i ++) {
      if (!ins.usage[i]) {
        return i;
      }
    }
    return null;
  };

  /**
   * 寻找上一条未使用指令的编号
   * @return {integer|null}  上一条未使用的指令，如不存在返回null
   */
  ins._lastUnused = function() {
    var i = ins.insCur - 1;
    for(; i >= 0; i --) {
      if (!ins.usage[i]) {
        return i;
      }
    }
    return null;
  };

  /**
   * 随意寻找一条未使用的指令
   * @return {integer} 一条随机未使用指令的编号
   */
  ins.findArb = function() {
    var base = Math.floor( Math.random() * 320 );
    if (!ins.usage[base]) {
      return base;
    }
    else {
      return ins._lastUnused(base) || ins._nextUnused(base);
    }
  };

  /**
   * 随机判断是否应该跳转
   * @return {boolean} 是否跳转指示
   */
  logic.shouldJump = function() {
    return Math.random() < config.probJump;
  };

  /**
   * 需要跳转的情况下，要跳转的目标指令编号
   * @return {integer} 目标指令编号
   */
  logic._genInsJumpNext = function() {
    return ins.findArb();
  };

  /**
   * 顺序执行的情况下，要跳转的目标指令编号
   * @return {integer} 目标指令编号
   */
  logic._genInsNext = function() {
    return ins.insCur + 1;
  };

  /**
   * 生成下一条要执行的指令编号
   */
  logic.genInsNext = function() {
    if (ins.insCur === null) {
      // 初始指令编号为0
      ins.insNext = 0;
      return;
    }

    var lastUnused = ins._lastUnused(),
        nextUnused = ins._nextUnused();
    if (lastUnused === null && nextUnused === null) {
      // 指令全部调用完毕，next设置为-1
      ins.insNext = -1;
      return;
    }
    
    // 两种情况下跳转
    // 第一种情况：逻辑要求跳转
    // 第二种情况：下一条指令已经使用
    var shouldJump = logic.shouldJump() || (nextUnused !== ins.insCur + 1);
    if (!shouldJump) {
      ins.insNext = logic._genInsNext();
    }
    else {
      ins.insNext = logic._genInsJumpNext();
    }
  };

  /**
   * 使用指令
   */
  logic.hunt = function() {
    var page = mem.pageOf(ins.insCur);
    mem.hunt(page);
  };

  /**
   * 获取一条指令对应的页编号
   * @param  {integer} ins 指令编号
   * @return {integer}     页面编号
   */ 
  mem.pageOf = function(ins) {
    return Math.floor( ins / 10 );
  };

  /**
   * 检查当前内存中是否存在此页面
   * @param  {[type]}  page [description]
   * @return {Boolean}      [description]
   */
  mem.hasPage = function(page) {
    for (var i = 0; i < mem.pageCapacity; i ++) {
      if (!!mem.pages[i] && mem.pages[i].num === page) {
        return true;
      }
    }
    return false;
  };

  /**
   * 获得当前装入页面数量
   * @return {[type]} [description]
   */
  mem.getPageSize = function() {
    var result = 0;
    for (var i = 0; i < mem.pageCapacity; i ++) {
      if (!!mem.pages[i]) {
        result ++;
      }
    }
    return result;
  }; 

  /**
   * 获取要替换的页面的编号
   */
  mem.getOutIndex = function() {
    var earliest = mem.pages[0],
        earliestIndex = 0;
    for (var i = 1; i < mem.pageCapacity; i ++) {
      if (mem.pages[i].timestamp < earliest.timestamp) {
        earliest = mem.pages[i];
        earliestIndex = i;
      }
    }
    return earliestIndex;
  };

  /**
   * 调用页面
   * @param  {integer} page 需要调用的页编号
   */
  mem.hunt = function(page) {
    if (!mem.hasPage(page)) {
      mem.pageMissing ++;
      var pageSize = mem.getPageSize(), outIndex;
      if (pageSize < mem.pageCapacity) {
        outIndex = pageSize;
      }
      else {
        outIndex = mem.getOutIndex();
      }
      mem.pages[outIndex] = { num: page, timestamp: new Date };
    };
  };

  /**
   * 刷新数据
   * @return {[type]} [description]
   */
  ui.refresh = function() {

  };

  /**
   * 输出至面板
   * @param  {[type]} str [description]
   * @return {[type]}     [description]
   */
  ui.outputConsole = function(str) {

  };

  // 初始化指令标识
  ins.usage = tool.makeArray(false, config.insCount);
  logic.genInsNext();

  window.work = function() {
    ins.insCur = ins.insNext;
    console.log('Ins: ' + ins.insCur);
    mem.hunt(mem.pageOf(ins.insCur));
    console.log(JSON.stringify(mem.pages));
    ui.refresh();
    logic.genInsNext();

    if (ins.insNext !== -1) {
      setTimeout(window.work, 3000);
    }
  }


});

