### 已解决
1. 为什么要用$去监测数据？
上下文：$的意思是表示一个检测信号，当前面的数据发生改变时，$标记的变量会自然监控信号的改变，在前驱变量改变之后，自动修改后方的变量，这样可以便于改变整个盘面
解决手段：查阅相关资料

2. 为什么改用move去存取，而不是snapshot？
上下文：采用move去存储用户操作，可以有效地降低内存消耗，也能让用户做了什么这个语义更加清楚明确
解决手段：问CA，然后优化

3. 为什么要设计一个纯粹的OOD/OOP层，有啥作用
上下文： coding Agent： 逃离“框架绑架”（Framework Agnostic）
旧系统的痛点： 旧系统的逻辑通常是和 Svelte 的原生 Store（writable, derived）死死绑定在一起的。游戏规则、数据、视图更新全部揉成一团。如果明天老板说：“我们要把这个数独游戏做成微信小程序，或者用 React 重写”，旧系统的代码几乎要全部作废，因为 React 里没有 Svelte 的 Store。
OOP 的降维打击： 我们写的 Sudoku.js 和 Game.js 是纯粹的、没有任何框架依赖的 Vanilla JavaScript（原生 JS）。它们可以在浏览器跑，可以在 Node.js 后端跑，可以无缝移植到 React、Vue、Unity 甚至改写成 Java。这就叫“核心领域模型（Domain Model）”

解决手段： 问CA

### 未解决
1. 如何将旧系统完全去除并且接入新系统？
上下文： @sudoku/game.js @sudoku/sudoku.js旧系统 新系统domain/Sudoku.js domain/gameStore.js
尝试解决： 问CA后结果变得四不像，最后为了Sudoku能正常运行，改着改着变成了双轨制，自己并未发觉，甚至用了个setTimeout去管理两个系统的冲突

2. 怎样叫做Sudoku 的公开接口与约束？
上下文： domain/Game.js,中依赖Sudoku内部方法去修改了Sudoku的内部值，导致了强依赖，然后我并不太了解这个具体的问题在哪里，然后如何修改
尝试解决：问CA，回答很含糊