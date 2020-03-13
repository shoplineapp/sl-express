class PluginService {
  constructor({
    dirs = [],
  } = {}) {
    this.dirs = dirs
    this.importedPluginKeys = []
    this.importedPluginMap = {}
  }

  add(key) {
    const errorWhenImportPlugins = [];
    const plugin = this.dirs.reduce( (acc, dir) => {
      if (acc) return acc

      let plugin = null

      try {
        plugin = require(`${dir}/${key}`)
      } catch (err) {
        errorWhenImportPlugins.push({ [key]: err.stack });
      } finally {
        return plugin
      }
    }, null)

    if (!plugin) {
      this.importedPluginMap = {
        ...this.importedPluginMap,
        [key]: errorWhenImportPlugins.filter( (ele) => ele[key])
      };
    } else {
      this.importedPluginMap = {
        ...this.importedPluginMap,
        [key]: plugin,
    }}

    this.importedPluginKeys = [
      ...this.importedPluginKeys,
      key,
    ]
  }

  async executePluginPhase({ phase, reversed = false, context }) {
    const {
      importedPluginKeys,
      importedPluginMap,
    } = this

    const plugins = reversed ? importedPluginKeys.slice().reverse() : importedPluginKeys

    return Promise.each( plugins, async (key) => {
      const plugin = importedPluginMap[key]

      if (!plugin) {
        throw new Error('plugin not exist')
      }

      if (Array.isArray(plugin)) {
        throw new Error(`plugin import error \n${JSON.stringify(plugin)}`)
      }

      if (typeof plugin[phase] !== 'function') return plugin

      await plugin[phase](context)
    })
  }
}

module.exports = PluginService
