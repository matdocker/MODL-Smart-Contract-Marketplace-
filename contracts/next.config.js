// next.config.js
module.exports = {
    webpack(config) {
      // e.g. for .json imports
      config.module.rules.push({
        test: /\.bigdata\.json$/,
        type: 'asset',
        parser: { dataUrlCondition: false },
        generator: {
          // emit as binary so the cache uses Buffers
          dataUrl: content => `module.exports = Buffer.from(${JSON.stringify(content)}, 'utf8')`
        }
      })
      return config
    }
  }
  