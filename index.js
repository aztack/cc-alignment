'use strict';
/**
 * Package Entry
 * @see https://docs.cocos.com/creator/manual/zh/extension/your-first-extension.html
 */
module.exports = {
  load() {
    Editor.log(`Loading Package "cc-alignment" from ${__dirname}`);
  },
  unload() {
    Editor.log('Unloading Package "cc-alignment"');
  },
  /**
   * Package Message Handlers
   * @see https://docs.cocos.com/creator/manual/zh/extension/entry-point.html#ipc-消息注册
   */
  messages: {
    ['cc-alignment:clicked']() {
      Editor.log('cc-alignment:clicked'); // Printed in Cocos Creator Console
      Editor.Ipc.sendToPanel('cc-alignment', 'changeText', 'Wow!');
    }
  }
};