# 交接文档：ProseMirror 增量同步重构

## 概述

将 ProseMirror 编辑器的文本同步机制从**全量重建**改为**增量更新**，解决编辑会话内保存回声导致空段落丢失的问题，并让外部 tiddler 变更通过 ProseMirror transaction 进入编辑器。

## 问题根因

编辑器使用 wiki 文本序列化作为同步协议，但 wiki 文本**无法表示空段落**：

```
ProseMirror: [para("Hello"), para(empty), para(empty)]
  → 序列化 → "Hello\n\n" (两个空段落变成一个空行)
  → 解析回 → [para("Hello")] (空段落丢失)
```

每次经过文本往返的代码路径都会丢失空段落。之前的修补（归一化比较、saveLock 三态）只是掩盖症状。

## 改动文件

### 核心改动（2 个文件）

| 文件 | 改动行数 | 说明 |
|------|---------|------|
| `plugins/tiddlywiki/prosemirror/core/engine.js` | +82 -45 | 工厂 widget 引擎路径 |
| `plugins/tiddlywiki/prosemirror/core/widget.js` | +92 -20 | 独立 `$prosemirror` widget 路径 |

### 新增测试（2 个文件）

| 文件 | 行数 | 说明 |
|------|------|------|
| `plugins/tiddlywiki/prosemirror/tests/test-prosemirror-incremental-sync.js` | 280 | 单元测试：diff 计算、doc.replace()、roundtrip echo |
| `plugins/tiddlywiki/prosemirror/tests/specs/incremental-sync.spec.js` | 322 | E2E 测试：空段落保留、外部变更、undo 历史 |

### 构建/配置（2 个文件）

| 文件 | 说明 |
|------|------|
| `package.json` | Playwright 依赖 `@playwright/test@1.49.1` → `@1.60.0` |
| `package-lock.json` | 锁文件更新 |

## 核心设计

### 新增字段

两个文件都新增：
- `lastSavedDocJSON` — 记录上次保存/外部同步后的 ProseMirror 文档 JSON，用于识别 wiki 文本 roundtrip echo
- `pendingSavedText` — 记录等待 wiki refresh 确认的保存文本，替代粗粒度 `saveLock`
- `pendingExternalText` / `pendingExternalType` — 编辑器聚焦时暂存外部变更，失焦后再应用
- `applyingExternalText` — 标记外部同步事务，避免它再次触发 debounced save

### engine.js 关键改动

**`debouncedSave`**：不再调用 `shouldRefreshAfterSave`，保存前记录 `lastSavedDocJSON`，并用 `pendingSavedText` 绑定具体保存文本。若 ProseMirror transaction 最终序列化文本未变化，则不会留下会误吞外部变更的锁。

**`setText`**：简化为：
- `nextText === pendingSavedText` → 跳过（自己的保存回声）
- 文本/type 未变化 → 跳过（metadata-only refresh）
- 未聚焦 → 调用 `applyExternalText`（增量更新）
- 聚焦中 → 暂存为 `pendingExternalText`，失焦后应用；如果用户继续编辑，则本地编辑胜出并清掉暂存外部变更

**新增 `applyExternalText`**：
1. 解析新文本 → 新 PM doc
2. 比较 `lastSavedDocJSON` → 相同则跳过（roundtrip echo）
3. 用 `doc.replace(0, oldSize, slice)` 做全文替换（ProseMirror step 系统）
4. 用 `tr.mapping.map()` 映射光标
5. 设置 `addToHistory=false`，避免外部同步污染用户 undo 栈，也避免触发二次保存
6. 失败时 fallback 到 `updateDomNodeText`（全量重建）

**删除**：`shouldRefreshAfterSave` 方法（不再需要归一化 hack）

**`updateDomNodeText`**：保留但标记为 fallback only（错误恢复）

**`handleTextOperationNatively`**：成功时记录 `pendingSavedText` 和 `lastSavedDocJSON`，让 toolbar 原生操作的即时 `saveChanges()` 也走同一套保存回声识别。

### widget.js 关键改动

与 engine.js 对称的改动：
- `pendingSavedText` 替代 `saveLock`/`"refresh"` 三态
- `lastKnownText` / `lastKnownType` 用于独立 `$prosemirror` widget 判断 tiddler refresh 是否真的改变了编辑内容
- `refresh` 不再调用 `refreshSelf()`，改用 `applyExternalText()`；聚焦时暂存外部变更，失焦后应用
- 新增 `_fullRebuildFromTiddler()` 作为 fallback

### 为什么用 `doc.replace()` 而非 `findDiffStart`/`findDiffEnd` + `ReplaceStep`

调试发现 `findDiffStart`/`findDiffEnd` 在 append/insert 场景产生**反向范围**（`from > to`），导致 `ReplaceStep` 产生空 slice（size=-1）。`doc.replace()` 由 ProseMirror 内部正确处理所有边界情况，仍然是单个 undo 步骤。

## 测试结果

### 单元测试（Jasmine）
```
1597 specs, 0 failures, 2 pending specs
```

### E2E 测试（Playwright + Chromium）

```
incremental-sync.spec.js: 15 passed (2.5m)
basic-editing.spec.js:    12 passed (30.8s)
smoke.spec.js:             1 passed (10.6s)
```

E2E 覆盖场景：
1. ✅ Enter 后空段落在 save 周期后保留
2. ✅ Select All + Bold 后空段落保留
3. ✅ 中间空段落保留
4. ✅ Agent 修改文本 → 编辑器增量更新
5. ✅ Roundtrip echo → 不触发重建
6. ✅ Agent 追加内容 → 正确显示
7. ✅ Agent 修改已有内容 → 正确替换
8. ✅ `applyExternalText` 方法存在
9. ✅ `lastSavedDocJSON` 在 save 后设置
10. ✅ Save 后 echo 被阻止（段落数不减少）
11. ✅ 跨 save 周期保留 undo/redo
12. ✅ 序列化文本未变化的 docChanged 不会留下陈旧锁并误吞后续外部变更
13. ✅ 编辑器聚焦时外部变更暂存，失焦后应用
14. ✅ 独立 `$prosemirror` widget 也走增量外部同步
15. ✅ 外部同步 transaction 不进入 undo/save 回路

## Review 重点

### 1. `doc.replace()` 的正确性

`applyExternalText` 使用 `tr.replace(0, oldDoc.content.size, slice)` 做全文替换。这是 ProseMirror 的标准 API，但 reviewer 应确认：
- 对于只修改了一个段落的场景，这是否会产生不必要的 DOM 更新？
- 是否需要更细粒度的 diff（如 ProseMirror 的 `Fragment.findDiffStart`）？

### 2. 两条代码路径的一致性

engine.js（工厂 widget）和 widget.js（独立 widget）有**重复的 `applyExternalText` 实现**。Reviewer 应确认：
- 两条路径的行为是否一致？
- 是否应该提取为共享函数？

### 3. 保存回声识别的时序

旧的 `saveLock` 是瞬态布尔/三态标志，容易在“docChanged 但序列化文本没变”的保存尝试后残留。当前方案改为 `pendingSavedText`：
- 只有 wiki refresh 文本等于待确认保存文本时才跳过
- 序列化文本未变化时清理 pending 状态
- 工厂的直接 `saveChanges` 和 debounced save 共用同一套文本绑定确认

### 4. 空段落的最终命运

空段落在编辑器中保留，但**保存到 wiki 文本时仍会丢失**。这是 wiki 文本格式的限制，不是 bug。Reviewer 应确认：
- 用户重新打开 tiddler 时，空段落丢失是否可接受？
- 是否需要在 wiki 文本中用某种标记保留空段落？

### 5. E2E 测试环境 / 依赖变更

E2E 测试需要 `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64` 环境变量。当前工作区还包含 `@playwright/test` 版本更新和 `package-lock.json` 大范围刷新；这部分更像测试环境/锁文件维护，建议 reviewer 决定是否和同步修复同一个 PR 保留，或拆成单独变更。

## 已知限制

1. **空段落在保存后丢失**：wiki 文本格式无法表示空段落，重新打开 tiddler 时会丢失
2. **全文替换**：`doc.replace()` 替换整个文档内容，对于只修改一个词的场景，可能比精确 diff 效率低
3. **冲突策略简单**：编辑器聚焦时外部变更暂存；如果用户继续编辑，本地编辑胜出并清掉暂存外部变更。没有做三方 merge。

## 运行测试

```bash
# 单元测试
node ./tiddlywiki.js ./editions/test --verbose --test

# 构建测试 HTML
node ./tiddlywiki.js ./editions/test --build

# E2E 测试（需要 PLAYWRIGHT_HOST_PLATFORM_OVERRIDE）
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test "incremental-sync.spec.js" --project=chromium

# 全量 E2E
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright test --project=chromium
```
