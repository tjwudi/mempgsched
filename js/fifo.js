$(function() {
  var tool = {},
      logic = {},
      ins = {
        insNext: null,
        insCur: 0,
        usage: null
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
   * @param  {int} from 从哪一条指令寻找起
   * @return {integer|null}  下一条未使用的指令，如不存在返回null
   */
  ins._nextUnused = function(from) {
    var i = from + 1;
    for(; i < config.insCount; i ++) {
      if (!ins.usage[i]) {
        return i;
      }
    }
    return null;
  };

  /**
   * 寻找上一条未使用指令的编号
   * @param  {int} from 从哪一条指令寻找起
   * @return {integer|null}  上一条未使用的指令，如不存在返回null
   */
  ins._lastUnused = function(from) {
    var i = from - 1;
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
    if (ins.usage[base]) {
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
    var lastUnused = ins._lastUnused(ins.insCur),
        nextUnused = ins._nextUnused(ins.insCur);
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

  window.runTest = function() {
    ins.usage = tool.makeArray(false, config.insCount);
    ins.usage[ins.insCur] = true;
  };

});
