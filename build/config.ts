export interface Config {
    root: string,
    customConfigFile: string,
    outputPath: string,
    templatePath: string,
    outputExt: string,
    routerFilePath: string
}

const config: Config = {
    root: process.cwd(),
    customConfigFile: 'create.config.js',
    outputPath: 'src/pages',
    templatePath: 'build/templates',
    outputExt: '.vue',
    routerFilePath: 'src/app.config.ts'
}

export default config
