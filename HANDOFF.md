# 交接文档：ProseMirror 增量同步与空行保真

更新时间：2026-06-07

## 当前状态速览

当前工作区分支：`feat/prosemirror-wysiwyg-editor`

当前最新提交已推送到 `linonetwo/feat/prosemirror-wysiwyg-editor`：

```text
a9bd94565 fix: preserve blank lines after block rules
```

工作区应保持干净：

```bash
git status --short --branch
```

预期输出只有分支行，无 `M`/`??` 文件。

独立核心空行 PR 已创建：

```text
PR: https://github.com/TiddlyWiki/TiddlyWiki5/pull/9872
Title: Blank line paragraph preservation
Base: TiddlyWiki/TiddlyWiki5:master
Head: linonetwo:feat/wikitext-blankline-paragraphs
Commit: 63ecf97b3 feat: preserve blank lines as empty paragraphs
Status: OPEN, mergeable
```

这个 PR 是真正对 `master` 的独立 PR，不依赖 ProseMirror 分支。

## 问题根因

旧实现使用 wiki text 作为 ProseMirror 与 TiddlyWiki 之间的同步协议，但旧 wikitext parser/serializer 不能表达空段落：

```text
ProseMirror: [para("Hello"), para(empty), para(empty)]
  -> serialize -> "Hello\n\n"
  -> parse     -> [para("Hello")]
```

因此任何经过 wikitext roundtrip 的路径都会丢失空段落，进而造成：

- 用户在编辑器里打多个空行，保存或刷新后空行消失
- 外部 agent 修改 tiddler text 后，编辑器用全量重建恢复内容，undo/selection 容易受影响
- 保存回声和真实外部变更难以区分

当前方案分两层：

- 核心空行 PR：让 wikitext 可以 opt-in 解析/序列化额外空行为 `blankline` parse tree node
- ProseMirror 分支：使用增量同步，减少全量重建，并在 ProseMirror 插件里默认打开空行保真配置

## 当前提交栈重点

当前 ProseMirror 分支顶部附近：

```text
a9bd94565 fix: preserve blank lines after block rules
499ba2e25 fix(prosemirror): call renderViewMode after commitEdit to hide textarea
fb2eae5ec fix(prosemirror): use currentColor instead of inherit for ::selection in hideselection
fcf2068ad fix(prosemirror): inject hideselection CSS from JS as final override
aae834f31 fix(prosemirror): prevent link text turning white under NodeSelection
72048b169 Merge branch 'master' into feat/prosemirror-wysiwyg-editor
7bbdae8a2 feat: use fine-grained ProseMirror sync
91c868651 fix: make blank line preservation opt-in
6d4a6e061 feat: preserve blank lines as empty paragraphs
```

注意：`feat/wikitext-blankline-paragraphs` 已经被重建为 master 基单提交分支。不要再基于旧的 stacked 版本判断 PR 范围。

## 核心空行 PR 内容

PR #9872 改动文件：

| 文件 | 说明 |
|------|------|
| `core/modules/parsers/wikiparser/wikiparser.js` | opt-in 解析额外空行为 `blankline` 空段落节点 |
| `core/modules/wiki.js` | 将 `preserveBlankLines` 从 `wiki.parseText()` 透传给 parser |
| `plugins/tiddlywiki/wikitext-serialize/utils/parsetree.js` | 序列化 `blankline` 为额外换行 |
| `themes/tiddlywiki/vanilla/base.tid` | 给 `p.tc-blankline` 最小高度，让阅读态空段落可见 |
| `editions/test/tiddlers/tests/test-wikitext-blanklines.js` | 覆盖 parse/serialize/config/list/macro 场景 |

语义：

```text
A\n\nB      -> parseblock, parseblock
A\n\n\nB    -> parseblock, blankline, parseblock
A\n\n\n\nB  -> parseblock, blankline, blankline, parseblock
```

普通 `A\n\nB` 仍是普通段落分隔；额外空行才表示空 paragraph。

兼容策略：当前仍是 opt-in：

- parser option：`{ preserveBlankLines: true }`
- config tiddler：`$:/config/Parser/PreserveBlankLines` 为 `yes`

默认关闭时，旧 wikitext 行为不变。

### 最近修复的关键缺口

最初只覆盖了普通段落之间的额外空行，如 `A\n\n\nB`。

真实文档里常见的是列表、宏、typed block、widget block 等非段落块之间的空行。例如：

```tid
* one
* two



<<now YYYY>>
```

列表 rule 会在内部消费尾随空白，导致外层 parser 看不到这些换行。最新修复会从 parse tree node 的 `end` 到 parser 当前 `pos` 的源码 gap 中恢复额外 blank lines，因此现在能得到：

```text
list, blankline, blankline, macrocallblock
```

## ProseMirror 分支核心设计

### 保存回声识别

旧实现依赖粗粒度 `saveLock`。当前方案使用：

- `pendingSavedText`：记录等待 wiki refresh 确认的具体保存文本
- `lastSavedDocJSON`：记录上次保存/外部同步后的 ProseMirror doc JSON

这样可以避免“docChanged 但序列化文本未变化”的保存尝试留下陈旧锁，从而误吞后续外部变更。

### 外部变更同步

`engine.js` 和独立 `$prosemirror` `widget.js` 都实现了：

- 未聚焦：立即 `applyExternalText()`
- 聚焦中：暂存到 `pendingExternalText` / `pendingExternalType`
- 用户继续编辑：本地编辑胜出，清掉暂存外部变更
- blur 后：应用暂存外部变更

外部同步 transaction 设置：

```js
tr.setMeta("addToHistory", false);
```

并使用 `applyingExternalText` 避免外部同步再次进入 debounced save 回路。

### 细粒度替换

共享 helper：`plugins/tiddlywiki/prosemirror/core/incremental-sync.js`

核心逻辑用 ProseMirror 的 `findDiffStart` / `findDiffEnd` 计算局部差异，然后使用官方推荐的 overlap 修正：

```js
const overlap = start - Math.min(oldEnd, newEnd);
if(overlap > 0) {
	oldEnd += overlap;
	newEnd += overlap;
}
```

最后用：

```js
newDoc.slice(start, newEnd)
tr.replace(start, oldEnd, slice)
```

做局部替换，而不是全文重建。

## 旧 core / 旧 Wiki 兼容性

用户会把 ProseMirror 编辑器插件和相关插件拖到尚未合并 PR #9872 的旧版 Wiki 里测试。

当前结论：ProseMirror 插件不应硬依赖 core 已经支持 `blankline` AST node。

已补测试：`plugins/tiddlywiki/prosemirror/tests/test-prosemirror-incremental-sync.js`

测试名称：

```text
should tolerate legacy parsers without blankline nodes
```

它用 `{ preserveBlankLines: false }` 模拟旧 parser 不产生 `blankline` 节点的情况，确认 ProseMirror AST 转换仍然可以工作，只是空行保真降级。

兼容边界要说清楚：

- 旧 core 不认识 `preserveBlankLines` 时，不应该导致编辑器启动或解析崩溃
- 旧 core parser 不产生 `blankline` 时，已有源码里的多空行会被旧 parser 吞掉，这是功能降级
- 如果用户一并拖入更新后的 `wikitext-serialize` 插件，ProseMirror 保存产生的 `blankline` parse tree 可以被序列化
- 但旧 core parser 仍无法在重新加载时从 wikitext 恢复这些空段落，直到 PR #9872 合并或用户也使用支持 blankline 的 core

不要重新添加 ProseMirror 插件内的 `blankline` serializer shim。之前试过这个方向，但不符合边界：`wikitext-serialize` 插件随编辑器一起带入是可以的；真正不能硬依赖的是 core parser AST 支持。

## 当前 ProseMirror 分支新增/相关文件

| 文件 | 说明 |
|------|------|
| `plugins/tiddlywiki/prosemirror/core/incremental-sync.js` | 共享局部 diff 替换 helper |
| `plugins/tiddlywiki/prosemirror/core/engine.js` | editor factory engine 的保存回声、外部同步、fallback |
| `plugins/tiddlywiki/prosemirror/core/widget.js` | 独立 `$prosemirror` widget 的同步路径 |
| `plugins/tiddlywiki/prosemirror/ast/from/paragraph.js` | ProseMirror 空段落输出 `blankline` parse tree node |
| `plugins/tiddlywiki/prosemirror/ast/to/paragraph.js` | 空 paragraph JSON 规范化，稳定 echo 比较 |
| `plugins/tiddlywiki/prosemirror/config/defaults.multids` | 当前分支默认 `Parser/PreserveBlankLines: yes` |
| `plugins/tiddlywiki/prosemirror/styles/structure.tid` | ProseMirror 空段落最小高度 |
| `plugins/tiddlywiki/prosemirror/tests/test-prosemirror-incremental-sync.js` | diff、roundtrip、legacy parser 降级测试 |
| `plugins/tiddlywiki/prosemirror/tests/specs/incremental-sync.spec.js` | Playwright 增量同步 E2E |

## 最新验证结果

### 当前 ProseMirror 分支

```bash
node ./tiddlywiki.js ./editions/test --verbose --test
```

结果：

```text
1668 specs, 0 failures, 5 pending specs
```

```bash
npm run lint
```

结果：通过，无输出。

Playwright 在本轮修复中跑过：

```bash
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/specs/incremental-sync.spec.js" --project=chromium
```

结果：`16 passed`

```bash
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/specs/basic-editing.spec.js" --project=chromium
```

结果：`12 passed`

```bash
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/smoke.spec.js" --project=chromium
```

结果：`1 passed`

### 独立核心空行 PR 分支

分支：`feat/wikitext-blankline-paragraphs`

```bash
node ./tiddlywiki.js ./editions/test --verbose --test
```

结果：

```text
1535 specs, 0 failures, 5 pending specs
```

changed-file ESLint 通过，检查文件：

```text
core/modules/wiki.js
core/modules/parsers/wikiparser/wikiparser.js
editions/test/tiddlers/tests/test-wikitext-blanklines.js
plugins/tiddlywiki/wikitext-serialize/utils/parsetree.js
```

注意：该 master 基 worktree 上 full `npm run lint` 会被当前 `origin/master` 已存在的 `plugins/tiddlywiki/dom-to-image/startup.js` 缩进错误挡住，和 PR #9872 无关。

## 已知限制

1. **旧 core 上空行保真会降级**

   编辑器不应崩，但旧 parser 不会从 wikitext 解析出 `blankline`，所以 reload 后仍可能丢空段落。

2. **冲突策略仍然简单**

   聚焦时外部变更暂存；如果用户继续编辑，本地编辑胜出并清掉暂存外部变更。没有三方 merge。

3. **`engine.js` 和 `widget.js` 有重复同步逻辑**

   两条路径都实现了 `applyExternalText()`。行为现在应一致，但后续可考虑提取共享模块。

4. **复杂节点 diff 覆盖仍可加强**

   目前重点覆盖文本、空段落、外部 append/modify、undo、独立 widget。table、opaque block、typed block、widget block 的局部 diff E2E 还可以补。

5. **核心空行 PR 合并后需要同步当前分支**

   PR #9872 合并后，ProseMirror 分支里重复的 core parser/style/test 改动需要通过 merge/rebase 消化，避免重复提交或冲突。

## 建议交给后续代理的任务

1. **旧版 Wiki 手工/自动兼容验证**

   在未合并 PR #9872 的旧版 TiddlyWiki 中拖入 ProseMirror 编辑器相关插件，确认：

   - 插件能启动
   - 普通 tiddler 能编辑/保存
   - 旧 parser 忽略空行时不会抛错
   - reload 后空段落保真降级符合预期

2. **复杂节点局部 diff E2E**

   补 Playwright 场景：

   - agent 修改 table cell
   - agent 替换整个 widget block
   - agent 修改 typed block / opaque block 附近内容
   - selection mapping 在复杂块附近是否稳定

3. **抽取同步共享逻辑**

   评估将 `engine.js` 和 `widget.js` 中重复的 `applyExternalText()` / pending external 逻辑抽到共享模块。

4. **PR #9872 合并后的清理**

   如果核心空行 PR 被接受：

   - 合并 master 到 ProseMirror 分支
   - 检查 `preserveBlankLines` 默认配置是否仍需要留在插件里
   - 若团队决定未来默认开启空行保真，按 PR #9872 描述移除 feature option 并更新测试

5. **依赖变更拆分决策**

   当前历史里有 Playwright 依赖更新和 lockfile 刷新。review 时仍需决定是否保留在同一 PR 栈，还是拆成独立维护提交。

## 常用命令

```bash
# 当前 ProseMirror 分支状态
git status --short --branch

# Jasmine
node ./tiddlywiki.js ./editions/test --verbose --test

# Lint
npm run lint

# 构建测试 HTML
node ./tiddlywiki.js ./editions/test --build

# 增量同步 E2E
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/specs/incremental-sync.spec.js" --project=chromium

# 基础编辑 E2E
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/specs/basic-editing.spec.js" --project=chromium

# Smoke E2E
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "plugins/tiddlywiki/prosemirror/tests/smoke.spec.js" --project=chromium
```

9300 端口通常已有用户用 dev server 启动的页面，会自动重载。不要另起新 server，除非 9300 不可用。