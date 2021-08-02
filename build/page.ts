import { resolve } from 'path'
import { outputFileSync, readFileSync, pathExistsSync, statSync, readdirSync, existsSync } from 'fs-extra'
import * as ora from 'ora'
import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ejs from 'ejs'
import * as changeCase from 'change-case'
import * as stringifyObject from 'stringify-object'
import config, { Config } from './config'
import appConfig from '../src/app.config'

const spinner = ora('生成页面中...')

/**
 * 初始化配置信息
 * @param config 默认配置信息
 * @returns 配置信息
 */
function initConfig(config: Config) {
    const _path = resolve(config.root, config.customConfigFile)

    if (existsSync(_path)) return Object.assign(config, require(_path))

    return config
}

const { outputPath, templatePath, root, outputExt } = initConfig(config)

const appConfigStr = `export default ${stringifyObject(appConfig, { indent: '  ' })}`

console.log('appConfigStr:', appConfigStr)

/**
 * 目录遍历
 * @param { string } folderPath 文件夹路径
 * @param { Function } callback 回调
 * @param { number } index 目录层级 
 */
function scanFolderSync(folderPath, callback, index = 1) {

    if (!statSync(folderPath).isDirectory()) callback(folderPath, index)

    readdirSync(folderPath).forEach(file => {
        const tempPath = `${folderPath}/${file}`

        if (statSync(tempPath).isDirectory()) {
            scanFolderSync(tempPath, callback, index + 1)
        } else {
            callback(tempPath, index)
        }
    })
}

/**
 * 获取模板路径
 * @param {string} templatePath 模板目录路径
 * @returns 模板路径
 */
function getTemplates(templatePath) {
    const paths: string[] = []

    spinner.text = '扫描页面模板'

    scanFolderSync(templatePath, (filePath: string) => {
        const ejsFile = filePath.match(/\.ejs/i)
        if (ejsFile) paths.push(filePath)
    })

    spinner.text = '扫描完成'

    return [...new Set(paths)]
}

const templatePaths = getTemplates(resolve(root, templatePath))
const templateNames = templatePaths.map(p => {
    const tempArr = p.split('/')
    return tempArr[tempArr.length - 1].split('.')[0]
})

inquirer.prompt([
    {
        name: 'filepath',
        type: 'input',
        message: `页面位置：${outputPath}/`,
        validate: text => !!text
    },
    {
        name: 'component',
        type: 'list',
        message: '请选择页面模板:',
        choices: templateNames
    }
]).then(({ filepath, component }) => {
    console.log('\n')

    spinner.start()
    const arr = filepath.split('/')
    const last = arr[arr.length - 1]

    if (last.indexOf('_') !== -1) {
        arr[arr.length - 1] = last.substring(last.indexOf('_') + 1,)
    }

    const dirname = arr.length > 1 ? arr.slice(0, arr.length - 1).join('/') : ''
    const filename = arr[arr.length - 1]
    const ejsParams = { filename, dirname, filepath, ...changeCase }
    const template = readFileSync((`${resolve(root, templatePath)}/${component}.ejs`), 'utf-8')
    const templateStr = ejs.render(template, ejsParams)
    const _outputPath = `${resolve(root, outputPath)}/${arr.join('/')}${outputExt}`

    if (!pathExistsSync(_outputPath)) {
        outputFileSync(_outputPath, templateStr)

        spinner.succeed(chalk.blue('页面生成成功\n'))

        console.log(chalk.gray(_outputPath))

    } else {
        spinner.fail()
        console.log(chalk.red('\n创建失败，文件已存在！'))
    }
}).catch(error => { throw error })
