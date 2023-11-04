var TurndownService = require('./lib/turndown.cjs.js')
option={
    "headingStyle": "h1",
    "hr": "* * *",
    "bulletListMarker": "*",
    "codeBlockStyle": "fenced",
    "fence": "```",
    "emDelimiter": "_",
    "strongDelimiter": "**",
    "linkStyle": "inlined",
    "linkReferenceStyle": "full"
}
var turndownService = new TurndownService(option)
var markdown = turndownService.turndown('<h1>Hello world!</h1><h2>Hello world!</h2><h3>Hello world!</h3>')
console.log(markdown)