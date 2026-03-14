# 自制 Markdown 语法新手指导

这份文档是给“准备新增一种自制 Markdown / MDX 语法”的同学看的。

如果你只是写文章内容，不需要看这里；如果你想给博客增加新的 `::xxx` 语法、行内语法，或者改现有语法的接入方式，就从这份文档开始。

## 先建立一个整体认识

当前项目的自制语法不是靠“先把整篇文章字符串替换完再丢给 MDX”来做的，而是走一套 remark AST 插件工厂。

核心入口在：

- `src/lib/content/mdx.tsx`
- `src/lib/content/custom-syntax/plugin.ts`

执行顺序大致是：

1. `renderMdx()` 调用 `compileMDX()`
2. `compileMDX()` 先跑 `remarkPlugins`
3. `createCustomSyntaxRemarkPlugin()` 在 AST 层扫描节点
4. 命中某个 handler 后，把原始 Markdown 片段转换成标准 MDX AST 节点
5. 后续 remark / rehype 插件继续正常处理
6. 最终交给 React 组件映射表去渲染

你可以把它理解成：

- `plugin.ts` 是“总调度中心”
- `handlers/` 里的每个文件是一条“独立语法规则”
- `utils.ts` 是“共享工具箱”

## 目录说明

自制语法相关代码集中在：

```text
src/lib/content/custom-syntax/
├── plugin.ts              # 工厂入口，统一调度所有 handler
├── types.ts               # handler 的接口定义
├── utils.ts               # YAML、AST 节点创建、源码切片等共享方法
└── handlers/
    ├── component-block.ts # ::ComponentName ... ::
    ├── details-block.ts   # :: details ... ::
    ├── tabs-block.ts      # ::tabs ... ::
    ├── inline-badge.ts    # :badge[text](...)
    └── legacy-guard.ts    # 旧语法报错拦截
```

## 先判断你要加的是哪一类语法

新增语法前，先判断它属于哪一类：

### 1. block / container 语法

适合这种形态：

```md
::Something
prop: value
---
body
::
```

或者：

```md
::tabs
tabs: ["A", "B"]
---
第一个
---
第二个
::
```

这类语法通常要新建一个 `handlers/*.ts`，实现 `CustomSyntaxBlockHandler`。

### 2. inline 语法

适合这种形态：

```md
这是一个 :badge[标签](shape=outline)
```

这类语法通常实现 `CustomSyntaxInlineHandler`。

### 3. 不是“新语法”，只是新组件

如果你只是想让：

```md
::MyComponent
title: hello
::
```

能够工作，而 `::ComponentName` 这类通用块语法本身已经满足需求，那你通常不需要新建 handler，只要：

1. 写 React 组件
2. 在 `src/lib/content/mdx.tsx` 的 `mdxComponents` 里注册组件名

这是一条很重要的判断标准：

- “新增组件”不一定等于“新增语法”
- 只有当语法结构本身和现有规则不同，才需要新建 handler

## 新增一种 block 语法的标准步骤

下面以新增 `::demo ... ::` 语法为例。

### 第一步：新建 handler 文件

在 `src/lib/content/custom-syntax/handlers/` 下新建文件，比如：

```text
src/lib/content/custom-syntax/handlers/demo-block.ts
```

基本骨架参考：

```ts
import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";

const DEMO_START_RE = /^::demo\s*$/i;

export const demoBlockHandler: CustomSyntaxBlockHandler = {
  kind: "container",
  name: "demo-block",
  priority: 10,
  match: ({ children, index, getNodeSource }) => {
    const node = children[index];
    if (!node) {
      return false;
    }

    const snippet = getNodeSource(node);
    const firstLine = snippet.split(/\r?\n/, 1)[0]?.trim() ?? "";
    return DEMO_START_RE.test(firstLine);
  },
  transform: (context) => {
    // 这里写命中后如何消费源码、如何产出 AST
    return {
      consumed: 1,
      nodes: [],
    };
  },
};
```

### 第二步：在 `plugin.ts` 注册

打开 `src/lib/content/custom-syntax/plugin.ts`，把它加入 `BLOCK_HANDLERS`：

```ts
const BLOCK_HANDLERS: CustomSyntaxBlockHandler[] = [
  legacyGuardBlockHandler,
  detailsBlockHandler,
  tabsBlockHandler,
  demoBlockHandler,
  componentBlockHandler,
].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
```

注意顺序和 `priority`：

- 更特殊的语法，优先级应该更高
- 越通用的语法，越应该靠后
- `component-block` 很通用，所以通常应该放得比较后

如果你的规则会和 `::ComponentName` 这种通用语法冲突，一定要让它优先命中。

### 第三步：把 Markdown 片段转换成标准 AST 节点

你不应该手写字符串形式的 `<Component />`，而应该用 `context` 提供的工厂方法：

- `createFlowElement(name, props, children)`
- `createInlineTextElement(name, props, text)`
- `createText(value)`
- `transformFragment(markdown)`
- `parseYamlProps(yamlSource)`

最常见的写法：

```ts
return {
  consumed: context.consumeThroughLine(endLine),
  nodes: [
    context.createFlowElement("MyComponent", { title: "Hello" }, [
      ...context.transformFragment(bodyMarkdown),
    ]),
  ],
};
```

这样做的好处是：

- 输出的是标准 MDX AST
- 后面的 Markdown / GFM / KaTeX / rehype 流程还能继续工作
- body 里的嵌套 Markdown 不会失效

## 新增一种 inline 语法的标准步骤

行内语法的处理方式和 block 不一样。

它通常发生在某个段落节点的 `children` 中，工厂会在 `transformInlineChildren()` 里逐个匹配。

你需要：

1. 在 `handlers/` 下新建文件
2. 实现 `CustomSyntaxInlineHandler`
3. 在 `plugin.ts` 里的 `INLINE_HANDLERS` 注册

可以直接参考：

- `src/lib/content/custom-syntax/handlers/inline-badge.ts`

这个文件展示了怎么把：

```md
:badge[标签](shape=outline)
```

转换成一个 `mdxJsxTextElement`。

## 什么时候该用 `transformFragment()`

这是最容易踩坑的地方。

### 有 body 内容时

如果你的语法允许用户在里面继续写 Markdown：

```md
::Card
---
### 标题

这里有列表、代码块和别的自制语法
::
```

那就应该把 body 交给：

```ts
context.transformFragment(bodyMarkdown)
```

这样里面的标题、列表、代码块、自制语法还能继续递归处理。

### 只是纯文本时

如果你只想放一个纯文本标题，直接：

```ts
context.createText("标题")
```

就够了。

## 什么时候该用 YAML

如果你的块语法需要参数，优先复用 YAML：

```md
::Notice
type: warning
icon: ph:warning
---
这是一段提醒内容
::
```

对应解析：

```ts
const props = context.parseYamlProps(yamlLines.join("\n"));
```

这样好处很多：

- 写法对内容作者友好
- 和现有 `::ComponentName` 语法保持一致
- 不需要重新发明一套参数格式

## 如何确定一个 block 消费了多少节点

block handler 在 AST 层工作，但你的语法在源码里可能跨很多行、甚至跨多个 AST 节点。

所以不要假设“命中一个节点就只消费一个节点”。

通常做法是：

1. 根据起始行找到结束行
2. 使用 `context.consumeThroughLine(endLine)` 计算应该吞掉多少个兄弟节点

例如：

```ts
return {
  consumed: context.consumeThroughLine(endLine),
  nodes: [newNode],
};
```

这能避免“只替换了开头节点，后半段正文还残留在页面里”的问题。

## 如何处理代码块嵌套

如果你的 block 语法内部允许出现 fenced code block，一定要像现有 handler 那样跳过内层围栏，不要在代码块里误识别：

- ` ``` `
- ` ~~~ `
- `---`
- `::`

建议直接参考：

- `details-block.ts`
- `tabs-block.ts`

这两个文件都处理了“块内还有代码块”的情况。

## 错误信息怎么写

报错尽量保持这几个特点：

1. 直接说清楚哪类语法有问题
2. 带上行号
3. 如果有替代写法，直接告诉用户

例如当前项目里的风格：

```ts
throw new Error(`Unclosed "::tabs" block at line ${startLine}`);
```

或者：

```ts
throw new Error(
  `Legacy chart block syntax "::${componentName}" is not supported. Use \`\`\`chart JSON code blocks instead. (line ${startLine})`,
);
```

## 新增语法后要同步做的事

新增 handler 后，通常还需要顺手做这几件事：

1. 在 `content/posts/markdown-syntax-showcase.mdx` 增加示例
2. 如果需要新的 React 组件，在 `src/lib/content/mdx.tsx` 里注册到 `mdxComponents`
3. 跑一次构建确认没有把整站静态生成打坏

建议至少执行：

```bash
npx biome check src/lib/content/custom-syntax src/lib/content/remark-colon-components.ts
npm run build
```

如果你改了示例文章，也建议把对应内容一起检查。

## 一个最实用的判断清单

准备新增语法时，可以先快速问自己这几个问题：

1. 这是“新增组件”还是“新增语法”？
2. 它属于 block/container 还是 inline？
3. 会不会和 `::ComponentName` 这种通用规则冲突？
4. 它内部会不会嵌套代码块？
5. 它的 body 里需不需要继续支持 Markdown？
6. 它的参数能不能直接用 YAML？
7. 出错时我能不能给出足够清晰的报错？

如果这 7 个问题都想清楚了，基本就能开始写了。

## 推荐的阅读顺序

第一次接触这套系统，建议按这个顺序读代码：

1. `src/lib/content/custom-syntax/plugin.ts`
2. `src/lib/content/custom-syntax/types.ts`
3. `src/lib/content/custom-syntax/utils.ts`
4. `src/lib/content/custom-syntax/handlers/component-block.ts`
5. `src/lib/content/custom-syntax/handlers/tabs-block.ts`
6. `src/lib/content/custom-syntax/handlers/inline-badge.ts`

这个顺序比较容易建立整体认知，不会一上来就陷进某个具体规则里。

## 最后一个建议

第一次新增语法时，不要一上来设计得太“通用”。

优先做法是：

- 先让语法稳定工作
- 再考虑抽公共逻辑
- 最后再考虑是否需要进一步统一多个 handler

这套工厂的目标不是“看起来很抽象”，而是“以后加规则时不需要去改一整坨核心逻辑”。

只要你能做到：

- 新语法只改自己的 handler
- `plugin.ts` 只负责注册
- 共享逻辑都放 `utils.ts`

那这套结构就是健康的。
