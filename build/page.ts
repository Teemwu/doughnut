// import { resolve } from 'path'
// import { outputFileSync } from 'fs-extra'
import * as stringifyObject from 'stringify-object'
import appConfig from '../src/app.config'

appConfig.pages.push('aa')

const appConfigStr = `export default ${stringifyObject(appConfig, { indent: '  ' })}`

// TODO
// outputFileSync(resolve(__dirname, '..', 'src/app.config.ts'), appConfigStr)

