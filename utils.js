const pkgName = 'cc-alignment';
const $fs = require('fs');
const $path = require('path');
const $util = require('util');

function realpath(relativePath) {
  return $path.resolve(Editor.url(`db://assets/`), '..', relativePath);
}

function requireFromProjectRoot(relativePath, invalidate, defaultValue) {
  const path_ = realpath(relativePath)
  if (invalidate) {
    delete require.cache[require.resolve(path_)]
  }
  try {
    defaultValue = require(path_);
  } catch (e) {
    Editor.warn(`Failed to require ${path_}`);
  }
  return defaultValue;
}

function writeToProjectRoot(relativePath, content) {
  return $fs.writeFileSync(realpath(relativePath), content);
}

function existsInProject(relativePath) {
  return $fs.existsSync(realpath(relativePath));
}

function pathOf(relativePath) {
  return Editor.url(`packages://${pkgName}/${relativePath}`);
}

function read(relativePath) {
  return $fs.readFileSync(Editor.url(`packages://${pkgName}/${relativePath}`), 'utf-8');
}

function write(relativePath, data) {
  const path = Editor.url(`packages://${pkgName}/${relativePath}`);
  $fs.writeFileSync(path, data);
  return path;
}

function queryNodeByUuid(uuid) {
  return new Promise((rs, rj) => {
    const find = (nodes) => {
      if (!nodes) return null;
      for (let i in nodes) {
        const it = nodes[i];
        if (it.id === uuid) {
          return it;
        }
      }
      for (let i in nodes) {
        const it = nodes[i];
        const n = find(it.children);
        if (n) return n;
      }
      return null;
    }
    Editor.Ipc.sendToPanel('scene', 'scene:query-hierarchy', (err, sceneId, hierarchy) => {
      const found = find(hierarchy);
      found ? rs(found) : rj(null);
    });
  });
}

function queryNodeByPath(path) {
  const parts = path.split('/');
  return new Promise((rs, rj) => {
    const find = (nodes, parts) => {
      if (!nodes) return null;
      const name = parts.shift();
      for (let i in nodes) {
        const it = nodes[i];
        if (it.name === name) {
          if (parts.length === 0) {
            return it;
          } else {
            return find(it.children, parts);
          }
        }
      }
      for (let i in nodes) {
        const it = nodes[i];
        const n = find(it.children, parts);
        if (n) return n;
      }
      return null;
    }
    Editor.Ipc.sendToPanel('scene', 'scene:query-hierarchy', (err, sceneId, hierarchy) => {
      const found = find(hierarchy, parts);
      found ? rs(found) : rj(null);
    });
  });
}

function queryNodeInfo(nodeId) {
  return new Promise((rs, rj) => {
    Editor.Ipc.sendToPanel('scene', 'scene:query-node', nodeId, (error, dump) => {
      if (!error) {
        const info = JSON.parse(dump);
        rs(info);
      } else {
        rj(error);
      }
    });
  })
}

function queryComponent(nodeId, compName) {
  return new Promise((rs, rj) => {
    Editor.Ipc.sendToPanel('scene', 'scene:query-node', nodeId, (error, dump) => {
      if (!error) {
        const info = JSON.parse(dump);
        if (info.value && info.value.__comps__ && info.value.__comps__.find) {
          rs(info.value.__comps__.find(comp => comp.type == compName));
        } else {
          rj(new Error(`Query component failed`));
        }
      } else {
        rj(error);
      }
    });
  })
}

function addComponent(nodeId, compName) {
  return new Promise((rs, rj) => {
    Editor.Ipc.sendToPanel("scene", "scene:add-component", nodeId, compName);
    setTimeout(() => {
      rs(queryComponent(nodeId, compName));
    }, 200)
  });
}

const queryInfoByUuid = $util.promisify(Editor.assetdb.queryInfoByUuid);
const queryMetaInfoByUuid = $util.promisify(Editor.assetdb.queryMetaInfoByUuid);

function whenSceneReady() {
  return new Promise((rs, rj) => {
    const timer = setInterval(() => {
      Editor.Ipc.sendToPanel('scene', 'scene:is-ready', (err, res) => {
        if (res) {
          // Editor.log(`Scene is ready!`);
          clearInterval(timer);
          rs();
        } else {
          // Editor.log(`Scene is not ready`);
        }
      });
    }, 100);
  });
}

function queryPathByUuid (uuid) {
  return new Promise((rs, rj) => {
    queryInfoByUuid(uuid).then(info => {
      rs(info.path);
    }).catch(e => {
      rs(e);
    });
  });
}


module.exports = {
  read,
  write,
  pathOf,
  queryNodeByPath,
  queryNodeByUuid,
  queryNodeInfo,
  queryComponent,
  addComponent,
  queryInfoByUuid,
  queryMetaInfoByUuid,
  queryPathByUuid,
  requireFromProjectRoot,
  existsInProject,
  writeToProjectRoot,
  whenSceneReady,
  pkgName
};