const { read, pathOf, queryNodeInfo } = require_('utils.js');
const $get = require_('lodash.get.js');

const vm = (el) => {
  return new Vue({
    el,
    name: 'cc-alignment-panel',
    template: read('panel/panel.html'),
    data () {
      return {}
    },
    created() {
        window.ccAlignment = this;
    },
    compiled(){

    },
    methods: {
      $t(key) {
        return Editor.T("cc-alignment." + key);
      },
      async operate(e, min = 1) {
        const action = e.target.id;
        const selectedUuid = Editor.Selection.curSelection('node');
        const nodeInfos = await Promise.all(selectedUuid.map(queryNodeInfo));
        if (nodeInfos && nodeInfos.length > min) this[action](nodeInfos);
      },
      // x2 = x1 + w1*(a2-a1) + (w2 - w1) / 2
      // x2 = x1 +     p1     +     sign * diff
      ['align-left'](nodeInfos) {
        const first = nodeInfos[0];
        const w1 = widthOf(first);
        const a1 = valOf(first, '.anchor.x');
        const x1 = valOf(first,'.position.x');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const w2 = widthOf(n);
          const a2 = valOf(n, '.anchor.x');

          const diff =(w2 - w1) / 2;
          const p1 = w2*a2 - w1*a1 - diff;

          this.set(n.value.uuid, 'position.x', x1 + p1 + diff);
        });
      },
      'align-right'(nodeInfos) {
        const first = nodeInfos[0];
        const w1 = widthOf(first);
        const a1 = valOf(first, '.anchor.x');
        const x1 = valOf(first,'.position.x');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const w2 = widthOf(n);
          const a2 = valOf(n, '.anchor.x');

          const diff =(w2 - w1) / 2;
          const p1 = w2*a2 - w1*a1 - diff;

          this.set(n.value.uuid, 'position.x', x1 + p1 + -diff);
        });
      },
      'align-horizontal-middle'(nodeInfos) {
        const first = nodeInfos[0];
        const w1 = widthOf(first);
        const a1 = valOf(first, '.anchor.x');
        const x1 = valOf(first,'.position.x');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const w2 = widthOf(n);
          const a2 = valOf(n, '.anchor.x');
          
          const diff =(w2 - w1) / 2;
          const p1 = w2*a2 - w1*a1 - diff;

          this.set(n.value.uuid, 'position.x', x1 + p1 + 0);
        });
      },
      ['align-bottom'](nodeInfos) {
        const first = nodeInfos[0];
        const h1 = heightOf(first);
        const a1 = valOf(first, '.anchor.y');
        const y1 = valOf(first,'.position.y');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const h2 = heightOf(n);
          const a2 = valOf(n, '.anchor.y');

          const diff =(h2 - h1) / 2;
          const p1 = h2*a2 - h1*a1 - diff;

          this.set(n.value.uuid, 'position.y', y1 + p1 + diff);
        });
      },
      ['align-top'](nodeInfos) {
        const first = nodeInfos[0];
        const h1 = heightOf(first);
        const a1 = valOf(first, '.anchor.y');
        const y1 = valOf(first,'.position.y');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const h2 = heightOf(n);
          const a2 = valOf(n, '.anchor.y');

          const diff =(h2 - h1) / 2;
          const p1 = h2*a2 - h1*a1 - diff;

          this.set(n.value.uuid, 'position.y', y1 + p1 + -diff);
        });
      },
      ['align-vertical-middle'](nodeInfos) {
        const first = nodeInfos[0];
        const h1 = heightOf(first);
        const a1 = valOf(first, '.anchor.y');
        const y1 = valOf(first,'.position.y');
        nodeInfos.forEach(n => {
          if (n === first) return;
          const h2 = heightOf(n);
          const a2 = valOf(n, '.anchor.y');
          
          const diff =(h2 - h1) / 2;
          const p1 = h2*a2 - h1*a1 - diff;

          this.set(n.value.uuid, 'position.y', y1 + p1 + 0);
        });
      },
      ['distribute-left'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, leftOf);
        // first is the left-most one
        const first = nodeInfos[0], last = nodeInfos[nodeInfos.length -1];
        const firstLeft = leftOf(first), lastLeft = leftOf(last);
        const distance = Math.abs(lastLeft - firstLeft) / (nodeInfos.length - 1);
        for (let i = 1; i < nodeInfos.length - 1; i++) {
          const n = nodeInfos[i];
          const x =  firstLeft + distance * i + anchorOffsetX(n);
          this.set(n.value.uuid, 'position.x', x);
        }
      },
      ['distribute-right'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, rightOf);
        // first is the right-most one
        const last = nodeInfos[0], first = nodeInfos[nodeInfos.length -1];
        const firstRight = rightOf(first), lastRight = rightOf(last);
        const distance = Math.abs(lastRight - firstRight) / (nodeInfos.length - 1);
        for (let i = nodeInfos.length - 2; i > 0; i--) {
          const n = nodeInfos[i];
          const x = firstRight - distance * (nodeInfos.length - i - 1) + anchorOffsetX(n) - widthOf(n);
          this.set(n.value.uuid, 'position.x', x);
        }
      },
      ['distribute-horizontal-middle'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, leftOf);
        const sumWidth = nodeInfos.reduce((all,n) => all += widthOf(n), 0);
        const first = nodeInfos[0], last = nodeInfos[nodeInfos.length -1];
        const left = leftOf(first), right = rightOf(last);
        const ctnWidth = right - left;
        const available = ctnWidth - sumWidth;
        const margin = available / (nodeInfos.length - 1);
        let preRight = left + widthOf(first);
        for (let i = 1; i < nodeInfos.length - 1; i++) {
          const n = nodeInfos[i];
          const x = preRight + margin + anchorOffsetX(n);
          this.set(n.value.uuid, 'position.x', x);
          preRight = x + widthOf(n) - anchorOffsetX(n);
        }
      },
      ['distribute-bottom'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, bottomOf);
        // first is the bottom-most one
        const first = nodeInfos[0], last = nodeInfos[nodeInfos.length -1];
        const firstBottom = bottomOf(first), lastBottom = bottomOf(last);
        const distance = Math.abs(lastBottom - firstBottom) / (nodeInfos.length - 1);
        for (let i = 1; i < nodeInfos.length - 1; i++) {
          const n = nodeInfos[i];
          const y =  firstBottom + distance * i + anchorOffsetY(n);
          this.set(n.value.uuid, 'position.y', y);
        }
      },
      ['distribute-top'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, topOf);
        // first is the right-most one
        const last = nodeInfos[0], first = nodeInfos[nodeInfos.length -1];
        const firstTop = topOf(first), lastTop = topOf(last);
        const distance = Math.abs(lastTop - firstTop) / (nodeInfos.length - 1);
        for (let i = nodeInfos.length - 2; i > 0; i--) {
          const n = nodeInfos[i];
          const y = firstTop - distance * (nodeInfos.length - i - 1) + anchorOffsetY(n) - heightOf(n);
          this.set(n.value.uuid, 'position.y', y);
        }
      },
      ['distribute-vertical-middle'](nodeInfos) {
        nodeInfos = sortBy(nodeInfos, topOf);
        const sumHeight = nodeInfos.reduce((all,n) => all += heightOf(n), 0);
        const first = nodeInfos[0], last = nodeInfos[nodeInfos.length -1];
        const bottom = bottomOf(first), top = topOf(last);
        const ctnHeight = top - bottom;
        const available = ctnHeight - sumHeight;
        const margin = available / (nodeInfos.length - 1);
        let preBottom = bottom + heightOf(first);
        for (let i = 1; i < nodeInfos.length - 1; i++) {
          const n = nodeInfos[i];
          const y = preBottom + margin + anchorOffsetY(n);
          this.set(n.value.uuid, 'position.y', y);
          preBottom = y + heightOf(n) - anchorOffsetY(n);
        }
      },
      ['equal-width'](nodeInfos) {
        const first = nodeInfos[0];
        const w1 = widthOf(first)
        nodeInfos.forEach(n => {
          if (n === first) return;
          const s2 = valOf(n, '.scale.x');
          this.set(n.value.uuid, 'size.width', Math.floor(w1 / s2));
        });
      },
      ['equal-height'](nodeInfos) {
        const first = nodeInfos[0];
        const h1 = heightOf(first);
        nodeInfos.forEach(n => {
          if (n === first) return;
          const s2 = valOf(n, '.scale.y');
          this.set(n.value.uuid, 'size.height', Math.floor(h1 / s2));
        });
      },
      ['reset-scale'](nodeInfos) {
        nodeInfos.forEach(n => {
          this.set(n.value.uuid, 'scale.x', 1);
          this.set(n.value.uuid, 'scale.y', 1);
        });
      },
      ['reset-anchor'](nodeInfos) {
        nodeInfos.forEach(n => {
          this.set(n.value.uuid, 'anchor.x', 0.5);
          this.set(n.value.uuid, 'anchor.y', 0.5);
        });
      },
      set(uuid, path, val) {
        Editor.Ipc.sendToPanel('scene', 'scene:set-property', {
          id: uuid,
          path: path,
          value: val
        });
      }
    }
  })
};

Editor.Panel.extend({
  style: read('panel/style.css'),
  template: read('panel/index.html'),
  $: {
    root: '#cc-alignment-panel'
  },
  ready () {
    this.vm = vm(this.$root);
  },
  messages: {
    changeText(sender, text) {
      this.vm.text = text;
    }
  }
});

function sortBy(nodeInfos, cb) {
  return nodeInfos.sort((a, b) => {
    const diff = cb(a) -cb(b);
    return diff === 0 ? 0 : (diff > 0 ? 1 : -1);
  });

}

/* visual width of node */
function widthOf(node) {
  return valOf(node, `.size.width`) * valOf(node, `.scale.x`);
}

/* visual height of node */
function heightOf(node) {
  return valOf(node, `.size.height`) * valOf(node, `.scale.y`);
}

function anchorOffsetX(node) {
  return widthOf(node) * valOf(node, '.anchor.x');
}

function anchorOffsetY(node) {
  return heightOf(node) * valOf(node, '.anchor.y');
}

function leftOf(node) {
  return valOf(node, '.position.x') - anchorOffsetX(node);
}

function rightOf(node) {
  return valOf(node, '.position.x') - anchorOffsetX(node) + widthOf(node);
}

function bottomOf(node) {
  return valOf(node, '.position.y') - anchorOffsetY(node);
}

function topOf(node) {
  return valOf(node, '.position.y') - anchorOffsetY(node) + heightOf(node);
}

function require_(relativePath) {
  return Editor.require(`packages://cc-alignment/${relativePath}`);
}
function valOf(node, path) {
  const p = path.replace(/\./g, '.value.').replace('.', '');
  return $get(node, p);
}
