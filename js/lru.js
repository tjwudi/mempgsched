$(function() {
  var tool = {},
      logic = {},
      ins = {
        insNext: null,
        insCur: null,
        usage: null
      },
      mem = {
        pages: [/* { num: 页编号, timestamp: 最近访问时间戳 } */],
        pageCapacity: 4,
        pageMissing: 0 /* 缺页次数 */,
        huntCount: 0 /* 寻指令次数 */
      },
      ui = {
        $console: $('#console'),
        $pageMissing: $('#page-missing'),
        $nextIns: $('#next-ins'),
        pages: [/* jdom: jQuery DOM */]
      };

  var config = {
    insCount: 320,
    probJump: 0.1
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
   * 开始运行全部程序
   */
  logic.run = function() {
    ins.insCur = ins.insNext;
    ins.usage[ins.insCur] = true;
    ui.outputConsole('准备载入【指令'+ins.insCur+'】');
    mem.hunt(mem.pageOf(ins.insCur));
    logic.genInsNext();
    ui.setInsNext();

    if (ins.insNext !== -1) {
      setTimeout(logic.run, 20);
    }
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
    mem.huntCount ++;
    ui.outputConsole('查找页面' + page);
    if (!mem.hasPage(page)) {
      ui.outputConsole('发生缺页');
      mem.pageMissing ++;
      var pageSize = mem.getPageSize(), outIndex;
      if (pageSize < mem.pageCapacity) {
        outIndex = pageSize;
      }
      else {
        outIndex = mem.getOutIndex();
      }
      mem.pages[outIndex] = { num: page, timestamp: new Date() };
      ui.outputConsole('页面已经调到内存空间' + outIndex);
      ui.setPage(outIndex, page);  // 更新UI内存页
    }
    else {
      mem.touchPage(page); // 刷新页面访问时间
      ui.outputConsole('无缺页发生');
    }
    ui.setPageMissing(); // 更新UI缺页率
  };

  /**
   * 更新页面最近访问时间
   * @param  {integer} page 页面编号
   */
  mem.touchPage = function(page) {
    var index = mem.getPageIndex(page);
    if (!!index) {
      mem.pages[index].timestamp = new Date();
    }
  };

  /**
   * 获取页面对应的内存块编号
   * @param  {integer} page 页面编号
   */
  mem.getPageIndex = function(page) {
    for (var i = 0; i < mem.pageCapacity; i ++) {
      if (!!mem.pages[i] && mem.pages[i].num === page) {
        return i;
      }
    }
    return null;
  };

  /**
   * 输出至面板
   * @param  {[type]} str [description]
   * @return {[type]}     [description]
   */
  ui.outputConsole = function(str) {
    ui.$console.val(str + '\n' + ui.$console.val());
  };

  /**
   * 初始化界面元素绑定
   */
  ui.init = function() {
    for (var i = 0; i < mem.pageCapacity; i ++) {
      ui.pages[i] = $('#page-' + i);
    }
  };

  /**
   * 将第index块设置为第page页
   * @param {integer} index 块编号
   * @param {integer} page  页编号
   */
  ui.setPage = function(index, page) {
    ui.pages[index].find('.pid').text(page);
    ui.pages[index].find('.range').text((page * 10) + ' ~ ' + (page * 10 + 9));
  };

  /**
   * 更新缺页率
   */
  ui.setPageMissing = function() {
    ui.$pageMissing.text(mem.pageMissing + '/' + mem.huntCount + ' = ' + mem.pageMissing * 100 / mem.huntCount);
  };

  /**
   * 更新下条指令编号
   */
  ui.setInsNext = function() {
    ui.$nextIns.text(ins.insNext);
  };

  // 初始化指令标识
  ui.init();
  ins.usage = tool.makeArray(false, config.insCount);
  logic.genInsNext();
  ui.setInsNext();

  $('#btn-run').click(function(event) {
    event.preventDefault();
    $(this).attr('disabled', true);
    logic.run();
  });

});

