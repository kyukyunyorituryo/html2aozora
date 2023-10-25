import { repeat } from './utilities'

var rules = {}

rules.paragraph = {
  filter: 'p',

  replacement: function (content) {
    return '\n' + content + '\n' //改行の数を２から１へ減らした
  }
}

rules.lineBreak = {
  filter: 'br',

  replacement: function (content, node, options) {
    return options.br + '\n'
  }
}
rules.kakko = {
  filter: 'rp',

  replacement: function (content) {
    return '' //ルビタグの互換のための()を除去
  }
}
rules.furigana = {
  filter: 'rt',

  replacement: function (content) {
    return '《' + content + '》' //ふりがな部分を《》で囲む
  }
}
rules.kanji = {
  filter: 'ruby',

  replacement: function (content) {
    return '｜' + content //ふりがなをつける部分を｜で区切る
  }
}
rules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  replacement: function (content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1)) //見出しと字下げ
    const midashi=[{'start':'［＃大見出し］','end':'［＃大見出し終わり］'},
    {'start':'［＃中見出し］','end':'［＃中見出し終わり］'},
    {'start':'［＃小見出し］','end':'［＃小見出し終わり］'}]
    var tophLevel = Number(options.headingStyle.charAt(1))

    if (tophLevel< hLevel+1 && hLevel< tophLevel+3) {
      var underline = repeat((hLevel === 1 ? '=' : '-'), content.length)
      return '\n［＃５字下げ］' + midashi[hLevel-1].start + content + midashi[hLevel-1].end + '\n'
    } else {
      return (
        '\n［＃３字下げ］' + content + '\n'
      )
    }
  }
}

rules.blockquote = {
  filter: 'blockquote',

  replacement: function (content) {
    content = content.replace(/^\n+|\n+$/g, '')
    content = content.replace(/^/gm, '> ')
    return '\n\n' + content + '\n\n'
  }
}

rules.list = {
  filter: ['ul', 'ol'],

  replacement: function (content, node) {
    var parent = node.parentNode
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content
    } else {
      return '\n\n' + content + '\n\n'
    }
  }
}

rules.listItem = {
  filter: 'li',

  replacement: function (content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, '\n    ') // indent
    var prefix = options.bulletListMarker + '   '
    var parent = node.parentNode
    if (parent.nodeName === 'OL') {
      var start = parent.getAttribute('start')
      var index = Array.prototype.indexOf.call(parent.children, node)
      prefix = (start ? Number(start) + index : index + 1) + '.  '
    }
    return (
      prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
    )
  }
}

rules.indentedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'indented' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    return (
      '\n\n    ' +
      node.firstChild.textContent.replace(/\n/g, '\n    ') +
      '\n\n'
    )
  }
}

rules.fencedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    var className = node.firstChild.getAttribute('class') || ''
    var language = (className.match(/language-(\S+)/) || [null, ''])[1]
    var code = node.firstChild.textContent

    var fenceChar = options.fence.charAt(0)
    var fenceSize = 3
    var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm')

    var match
    while ((match = fenceInCodeRegex.exec(code))) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1
      }
    }

    var fence = repeat(fenceChar, fenceSize)

    return (
      '\n\n' + fence + language + '\n' +
      code.replace(/\n$/, '') +
      '\n' + fence + '\n\n'
    )
  }
}

rules.horizontalRule = {
  filter: 'hr',

  replacement: function (content, node, options) {
    return '\n\n' + options.hr + '\n\n'
  }
}

rules.inlineLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node) {
    var href = node.getAttribute('href')
    var title = cleanAttribute(node.getAttribute('title'))
    if (title) title = ' "' + title + '"'
    return '[' + content + '](' + href + title + ')'
  }
}

rules.referenceLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'referenced' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node, options) {
    var href = node.getAttribute('href')
    var title = cleanAttribute(node.getAttribute('title'))
    if (title) title = ' "' + title + '"'
    var replacement
    var reference

    switch (options.linkReferenceStyle) {
      case 'collapsed':
        replacement = '[' + content + '][]'
        reference = '[' + content + ']: ' + href + title
        break
      case 'shortcut':
        replacement = '[' + content + ']'
        reference = '[' + content + ']: ' + href + title
        break
      default:
        var id = this.references.length + 1
        replacement = '[' + content + '][' + id + ']'
        reference = '[' + id + ']: ' + href + title
    }

    this.references.push(reference)
    return replacement
  },

  references: [],

  append: function (options) {
    var references = ''
    if (this.references.length) {
      references = '\n\n' + this.references.join('\n') + '\n\n'
      this.references = [] // Reset references
    }
    return references
  }
}

rules.emphasis = {
  filter: ['em', 'i'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.emDelimiter + content + options.emDelimiter
  }
}

rules.strong = {
  filter: ['strong', 'b'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.strongDelimiter + content + options.strongDelimiter
  }
}

rules.code = {
  filter: function (node) {
    var hasSiblings = node.previousSibling || node.nextSibling
    var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings

    return node.nodeName === 'CODE' && !isCodeBlock
  },

  replacement: function (content) {
    if (!content) return ''
    content = content.replace(/\r?\n|\r/g, ' ')

    var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : ''
    var delimiter = '`'
    var matches = content.match(/`+/gm) || []
    while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`'

    return delimiter + extraSpace + content + extraSpace + delimiter
  }
}

rules.image = {
  filter: 'img',

  replacement: function (content, node) {
    var alt = cleanAttribute(node.getAttribute('alt'))//［＃画像（image.jpg）入る］
    var src = node.getAttribute('src') || ''
    var title = cleanAttribute(node.getAttribute('title'))
    var titlePart = title ? ' "' + title + '"' : ''
    return src ? '［＃' + alt +'（' + src + titlePart + '）入る］' : ''
  }
}

function cleanAttribute (attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

export default rules
