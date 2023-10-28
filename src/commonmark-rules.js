import { repeat } from './utilities'

var rules = {}

rules.paragraph = {
  filter: 'p',

  replacement: function (content) {
    return '\n' + content + '\n' // 改行の数を２から１へ減らした
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
    return '' // ルビタグの互換のための()を除去
  }
}
rules.furigana = {
  filter: 'rt',

  replacement: function (content) {
    return '《' + content + '》' // ふりがな部分を《》で囲む
  }
}
rules.kanji = {
  filter: 'ruby',

  replacement: function (content) {
    return '｜' + content // ふりがなをつける部分を｜で区切る
  }
}
rules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  replacement: function (content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1)) // 見出しと字下げ
    const midashi = [{ 'start' : '［＃大見出し］' , 'end' : '［＃大見出し終わり］' },
    { 'start': '［＃中見出し］', 'end': '［＃中見出し終わり］'},
    { 'start':'［＃小見出し］','end':'［＃小見出し終わり］'}]
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
    return '\n［＃ここから２字下げ］\n' + content + '\n［＃ここで字下げ終わり］\n'
  }
}

rules.list = {
  filter: ['ul', 'ol'],

  replacement: function (content, node) {
    var parent = node.parentNode
    return '［＃ここから２字下げ、折り返して３字下げ］\n' + content + '\n［＃ここで字下げ終わり］'

  }
}

rules.listItem = {
  filter: 'li',

  replacement: function (content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, '\n    ') // indent
    var prefix = options.bulletListMarker
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
        return '\n［＃ここから２字下げ］\n' + content + '\n［＃ここで字下げ終わり］\n'
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

    return (
      '\n\n［＃ここから' + language + '言語］\n' +
      code.replace(/\n$/, '') +
      '\n［＃ここで' + language + '言語終わり］\n\n'
    )
  }
}

rules.horizontalRule = {
  filter: 'hr',

  replacement: function (content, node, options) {
    return '\n\n［＃改ページ］\n\n' // 区切りを改ページに
  }
}

rules.inlineLink = {
  filter: function (node, options) {
    return (
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node) {
    var href = node.getAttribute('href')
    var title = cleanAttribute(node.getAttribute('title'))
    if (title) title = ' title="' + title +'" '
    return '<a href="' + href + '"' + title+'>'+content + '</a>'
  }
}


rules.emphasis = {
  filter: ['em'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃'+ options.emDelimiter + '］'+ content + '［＃'+ options.emDelimiter + '終わり］'
  }
}

rules.italic = {
  filter: [ 'i'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃'+ options.italicDelimiter + '］'+ content + '［＃'+ options.italicDelimiter + '終わり］'
  }
}

rules.strong = {
  filter: ['strong'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃'+ options.strongDelimiter + '］'+ content + '［＃'+ options.strongDelimiter + '終わり］'
  }
}

rules.bold = {
  filter: ['b'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃'+ options.boldDelimiter + '］'+ content + '［＃'+ options.boldDelimiter + '終わり］'
  }
}

rules.underline = {
  filter: ['u'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃左に傍線］'+ content + '［＃左に傍線終わり］'
  }
}

rules.del = {
  filter: ['del'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃取消線］'+ content + '［＃取消線終わり］'
  }
}

rules.sup = {
  filter: ['sup'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃上付き小文字］'+ content + '［＃上付き小文字終わり］'
  }
}

rules.sub = {
  filter: ['sub'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return '［＃下付き小文字］'+ content + '［＃下付き小文字終わり］'
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
