# Homework 2 进化报告

## 1. 提示功能的实现

### 1.1 提示功能的归属

提示功能跨越两个类，Sudoku 负责计算，Game 负责管理。

| 方法 | 归属 | 职责 |
|------|------|------|
| `getCandidates(row, col)` | Sudoku | 计算某格子的候选数（纯领域规则） |
| `getNextMove()` | Sudoku | 找到"唯一候选数"推定步（纯领域规则） |
| `hint(type, row, col)` | Game | 提供提示入口，管理提示次数 |
| `useHint()` | Game | 消耗提示次数，限制使用频率 |

 `Sudoku` 是管理数独规则引擎
 `Game` 管理游戏状态


### 1.2 候选数提示的实现

只需要收集同行、同列、同宫中已出现的数字，剩下的就是候选数。

### 1.3 下一步提示的实现

找到一个**只能填一个数**的格子，直接告诉答案，并且问是否采纳。


## 2. 探索模式的实现

### 2.1 探索模式的本质

探索模式是Game 的一种临时状态分支。当用户无法通过逻辑推理继续时，可以尝试"猜测"。

**设计决策**：
使用快照与回滚机制
探索期间的操作记录在独立的历史栈中
提交或放弃时决定是否合并历史

### 2.2 结构设计

```javascript
// Game 新增字段
{
    _isExploring: false,           // 是否处于探索模式
    _exploreSnapshot: null,         // 进入探索时的盘面快照
    _exploreUndoStack: []           // 探索过程中的 undo 栈
}
```

### 2.3 提交与放弃：合并与回滚机制

#### 提交时如何合并？

当用户确认探索结果正确后点击"提交"，执行以下操作：

**1. 检查结果有效性**
   - 调用 `getConflicts()` 检查当前盘面是否存在冲突
   - 若有冲突 → 提交失败，提示用户修正

**2. 合并探索历史到主历史栈**
   - 将 `_exploreUndoStack` 中的每条 Move 记录逐一 push 到 `_undoStack`
   - 此时探索期间的操作变成了主 history 的一部分
   - 用户之后可以正常 undo/redo 这些步骤

**3. 清理探索状态**
   - 清空 `_exploreSnapshot`（快照已完成使命）
   - 清空 `_exploreUndoStack`
   - 清空 `_redoStack`（因为新操作打断了原来的 redo 序列）
   - 退出探索模式

探索期间的操作记录从"临时工"转为"正式工"，成为可 undo/redo 的正式历史。

---

#### 放弃时如何回滚？

当用户发现探索走不通，点击"放弃"，执行以下操作：

**1. 恢复盘面快照**
   - 从 `_exploreSnapshot.grid` 取出进入探索时保存的 grid 副本
   - 调用 `setGrid()` 恢复到那个时刻的状态
   - 所有填入的数字都被撤销

**2. 恢复主历史栈长度**
   - 从 `_exploreSnapshot.undoStackLength` 取出进入探索时的栈长度
   - 将 `_undoStack.length` 直接截断到这个长度
   - 这意味着探索前的所有操作记录保持不变

**3. 清理探索状态**
   - 清空 `_exploreSnapshot`
   - 清空 `_exploreUndoStack`
   - 退出探索模式

**回滚本质**：好像探索从未发生过——盘面恢复到进入探索的那一刻，undo 历史也完全保留探索前的状态。

### 2.4 探索模式下的操作分流

探索模式的关键设计：同一份代码，两条历史通道。

| 通道 | 触发条件 | 写入位置 |
|------|----------|----------|
| 探索历史 | `_isExploring === true` | `_exploreUndoStack` |
| 主历史 | 正常游戏模式 | `_undoStack` |

```javascript
guess(move) {
    if (this._isExploring) {
        // 探索期间 → 写入探索历史
        this._exploreUndoStack.push({ row, col, before, after: value });
    } else {
        // 正常模式 → 写入主历史
        this._undoStack.push({ row, col, before, after: value });
        this._redoStack = [];
    }
}
```

---

## 3. History 结构的演进

### 3.1 Homework 2 的变化

**结构没有根本性变化，都是用Move记录**，但增加了探索模式支持：

| 阶段 | History 行为 |
|------|-------------|
| 正常游戏 | 操作记录在 `_undoStack`，线性管理 |
| 探索中 | 探索操作记录在 `_exploreUndoStack`，不影响主 history |
| 提交探索 | `_exploreUndoStack` 合并到 `_undoStack`，清空 `_redoStack` |
| 放弃探索 | 恢复到探索前的 `_undoStack` 长度 |

核心仍是线性的 Move 记录，没有引入树状分支。探索模式只是在主栈旁边增加了一个临时栈。

---

## 4. Homework 1 暴露的设计局限

### 4.1 `_boxConflict()` 逻辑错误

**问题**：原逻辑要求 `r !== row && c !== col`（既不同行又不同列），导致在同宫但不同行或不同列时跳过检查。

**修复**：
```javascript
_boxConflict(row, col, val) {
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (r === row && c === col) continue; // 只跳过自己
            if (this._grid[r][c] === val) return true;
        }
    }
    return false;
}
```

### 4.2 Undo/Redo 绕过封装

**问题**：原实现使用 `_forceSet()` 直接修改 `Sudoku.grid`，破坏封装。

**修复**：直接调用 `guess()` 方法。

**理由**：能被 undo/redo 的操作一定是之前通过 `guess()` 校验的合法操作，绝不可能涉及 locked 格，因此可以安全地调用 `guess()`。

```javascript
undo() {
    const record = this._undoStack.pop();
    this._sudoku.guess({ row: record.row, col: record.col, value: record.before });
    this._redoStack.push(record);
}
```

### 4.3 状态双轨问题

**问题**：UI 组件仍依赖旧 store，领域对象只是被动同步者，导致状态分叉风险。

**修复**：
1. 创建 `gameStore` 作为领域对象与 Svelte UI 之间的适配层
2. 所有游戏操作必须通过 `gameStore`
3. UI 组件从 `gameStore` 订阅状态

### 4.4 缺少输入验证

**问题**：领域层的 `guess()` 方法没有完整的输入合法性校验。

**修复**：在 `Sudoku.guess()` 中添加验证：

```javascript
guess(move) {
    const { row, col, value } = move;
    
    // 输入验证
    if (!Number.isInteger(row) || row < 0 || row > 8 ||
        !Number.isInteger(col) || col < 0 || col > 8) {
        return false;
    }
    if (value !== null && value !== 0 &&
        (!Number.isInteger(value) || value < 1 || value > 9)) {
        return false;
    }
    if (this._locked[row][col]) return false;
    
    this._grid[row][col] = (value === 0) ? null : value;
    return true;
}
```

---

## 5. 如果重做 Homework 1

### 5.1 设计层面的修改

1.  在 `guess()` 中添加完整的边界检查， 防止负数、超范围坐标

2. 从一开始就设计 `gameStore` 作为唯一状态源，不依赖组件内部状态或 `setTimeout` 技巧

3. 使用自定义事件让领域层主动通知状态变化，而不是被动等待 UI 轮询


### 5.2 代码组织层面的修改

1. **分离 Sudoku 和 Game**
   - Sudoku 只负责数独规则
   - Game 管理游戏状态和历史

2. **明确的公开接口**
   - 通过 getter 暴露只读数据
   - 所有修改通过方法


