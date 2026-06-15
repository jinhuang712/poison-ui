# Poison UI/UX Single-word Taxonomy

这份文档整理了一套用于 UI/UX 设计审查的 `poison` 词表。

每一行包含：

- **UI/UX 缺陷**：具体设计问题
- **Poison word**：单词形式的负面诊断词
- **Healthy word**：单词形式的健康状态 / 反义词
- **问题描述模板**：可直接用于 review report、terminal finding 或 gate 输出

模板中的变量：

- `{screen}`：页面 / 截图 / 界面区域
- `{element}`：具体元素，例如按钮、表单、卡片、弹窗
- `{user_goal}`：用户当前要完成的任务
- `{evidence}`：截图、代码、文档或 gate 证据

---

## Core Vocabulary

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 视觉杂乱 | clutter | clarity | `{screen} 中元素、层级或视觉重量过多，导致用户难以快速识别主要任务。` |
| 视觉噪声 | noise | signal | `{screen} 中存在干扰主要任务的装饰、颜色、图标或次要信息，削弱了核心信号。` |
| 信息层级不清 | fog | hierarchy | `{screen} 的信息主次关系不清，用户需要额外推断才能判断什么最重要。` |
| 风格漂移 | drift | alignment | `{screen} 偏离了已确认的视觉或交互方向，导致产品体验不一致。` |
| 组件不一致 | taint | integrity | `{element} 的样式、语义或行为与同类组件不一致，污染了组件系统完整性。` |
| 模板感 | smell | specificity | `{screen} 看起来像通用模板，缺少和业务、用户角色或核心场景绑定的具体表达。` |
| 过度装饰 | gloss | utility | `{screen} 的视觉修饰超过了功能表达，导致界面看起来精致但不服务任务。` |
| 信息过密 | compression | balance | `{screen} 在有限空间内压入过多信息，导致阅读、比较或决策成本升高。` |
| 信息过稀 | sparsity | density | `{screen} 信息密度过低，空间利用不足，用户难以获得足够判断依据。` |
| 注意力被错误吸走 | leakage | focus | `{element} 吸走了本应属于核心任务的注意力，导致用户关注点偏移。` |
| 边界不清 | blur | grouping | `{screen} 中模块边界不清，用户难以判断哪些内容属于同一组。` |
| 对比度不足 | dimness | contrast | `{element} 的视觉对比度不足，影响阅读、识别或操作判断。` |
| 字体难读 | illegibility | readability | `{screen} 的字号、字重、行高或排版降低了文本可读性。` |
| 间距混乱 | jitter | rhythm | `{screen} 的 spacing 缺少稳定节奏，导致布局显得跳跃、不成体系。` |
| 色彩语义混乱 | contamination | semantics | `{element} 使用了与实际状态或操作语义不匹配的颜色，可能误导用户判断。` |

---

## Navigation / IA

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 难以导航 | friction | flow | `用户在 {screen} 中前往目标页面或完成 {user_goal} 时遇到不必要阻力。` |
| 不知道当前位置 | disorientation | orientation | `{screen} 没有清晰表达当前位置，用户难以判断自己处在产品结构的哪一层。` |
| 入口不清 | obscurity | discoverability | `{element} 的入口不明显，用户难以发现可以从这里开始或继续任务。` |
| 信息藏太深 | burial | accessibility | `{user_goal} 所需的关键信息或功能被埋得太深，增加了查找成本。` |
| 分类混乱 | rot | taxonomy | `{screen} 的分类标准不一致，导致用户无法稳定预测内容应该在哪里。` |
| 路径太深 | depth | shallowness | `{user_goal} 需要经过过多层级或步骤，导致路径成本过高。` |
| 返回路径不清 | trap | escape | `{screen} 缺少清晰的返回、取消或退出路径，用户容易被困在当前流程中。` |
| 结构不符合任务 | mismatch | fit | `{screen} 的信息结构与用户实际任务不匹配，导致操作路径不自然。` |
| 搜索筛选混乱 | entropy | precision | `{screen} 的搜索、筛选或排序逻辑缺少清晰规则，用户难以精确定位目标。` |
| 内容重复 | redundancy | concision | `{screen} 重复展示相似信息，增加阅读负担但没有提升判断质量。` |
| 关键上下文缺失 | gap | context | `{screen} 缺少用户做出判断所需的上下文信息。` |
| 页面主次不明 | ambiguity | priority | `{screen} 中多个区域争夺同等优先级，用户难以判断应该先看哪里。` |

---

## Interaction

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 按钮意义不明确 | ambiguity | explicitness | `{element} 的含义或点击后果不明确，用户无法判断它会触发什么结果。` |
| 看起来能点但不能点 | deception | honesty | `{element} 的视觉表现暗示可交互，但实际不可点击或不可操作。` |
| 能点但看不出来 | invisibility | affordance | `{element} 可以交互，但缺少足够视觉提示，用户难以发现它的可操作性。` |
| 点完没反馈 | silence | feedback | `用户操作 {element} 后没有得到明确反馈，无法判断系统是否收到或完成操作。` |
| loading/empty/error 缺失 | hole | coverage | `{screen} 缺少必要状态设计，导致 loading、empty、error 或 success 场景不可用。` |
| 操作走到死路 | rupture | continuity | `{user_goal} 在 {screen} 处中断，用户无法自然继续、返回或恢复任务。` |
| 高风险操作没确认 | danger | safety | `{element} 会触发高风险结果，但缺少确认、预览或后果说明。` |
| 默认值诱导错误 | bias | neutrality | `{element} 的默认选项可能诱导用户做出非预期或高风险选择。` |
| 步骤太多 | drag | efficiency | `{user_goal} 需要过多点击、填写或确认步骤，降低任务效率。` |
| 用户必须猜 | guesswork | guidance | `{screen} 没有明确指导下一步，用户必须猜测如何继续。` |
| 反馈延迟 | latency | responsiveness | `{element} 操作后反馈出现延迟，且缺少 loading、progress 或状态提示。` |
| 成功状态不明确 | uncertainty | completion | `{user_goal} 完成后没有清晰成功反馈，用户无法确认任务是否已经结束。` |
| 错误不可恢复 | deadend | recoverability | `{screen} 的错误反馈没有提供可执行修复路径，用户无法恢复。` |
| 表单难填 | burden | ease | `{screen} 的输入、校验或提示设计增加了不必要填写负担。` |
| 批量操作风险高 | blast | control | `{element} 的批量操作影响范围过大，但缺少预览、撤销或控制机制。` |

---

## Cognition

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 认知负担过高 | overload | ease | `{screen} 同时要求用户理解过多信息、规则或选择，造成认知过载。` |
| 选择太多 | overload | guidance | `{screen} 给出过多并列选项，但缺少默认路径、推荐或决策辅助。` |
| 文案不清 | opacity | plainness | `{element} 的文案表达不透明，用户读完后仍难以理解含义或后果。` |
| 概念不一致 | drift | consistency | `{screen} 对同一对象或动作使用了不一致概念，破坏用户理解稳定性。` |
| 上下文泄漏 | leakage | context | `{screen} 中的信息脱离必要上下文，用户难以判断它为什么出现。` |
| 需要记忆前文 | burden | recognition | `{user_goal} 要求用户记住之前页面或步骤的信息，而不是在当前界面直接识别。` |
| 决策依据不足 | fog | clarity | `{screen} 缺少足够依据，用户难以判断哪个选项或动作更合适。` |
| 不符合心智模型 | mismatch | intuition | `{screen} 的组织方式不符合用户对该任务的自然理解。` |
| 术语过多 | jargon | accessibility | `{screen} 使用过多专业术语，增加非专家用户理解成本。` |
| 解释太多 | clutter | concision | `{screen} 的解释文本过多，反而掩盖了用户真正需要的行动信息。` |
| 抽象层级错误 | distortion | proportion | `{screen} 展示的信息过于底层或过于抽象，与当前任务所需层级不匹配。` |
| 多目标混杂 | contamination | focus | `{screen} 同时混入多个任务目标，稀释了用户当前主要意图。` |

---

## Trust

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 文案误导 | deception | honesty | `{element} 的文案暗示了与真实结果不一致的信息，可能导致用户误解。` |
| CTA 和真实结果不一致 | betrayal | trust | `{element} 的 CTA 表达和实际发生结果不一致，破坏用户信任。` |
| 价格不透明 | opacity | transparency | `{screen} 没有清晰说明费用、扣款、试用或续费规则。` |
| 权限请求不清楚 | obscurity | consent | `{screen} 请求权限时没有明确说明用途、影响或可撤回方式。` |
| 后果不明确 | ambiguity | disclosure | `{element} 的操作后果不明确，用户无法判断风险或影响范围。` |
| 暗黑模式 | manipulation | choice | `{screen} 通过视觉、文案或流程诱导用户做出非自愿选择。` |
| 假紧迫感 | coercion | honesty | `{screen} 使用不真实或未解释的紧迫感推动用户行动。` |
| 取消困难 | trap | freedom | `{screen} 让用户容易进入订阅、提交或绑定流程，但难以退出或取消。` |
| 隐藏负面信息 | concealment | disclosure | `{screen} 隐藏了限制、风险、费用或不可逆后果。` |
| 隐私不透明 | opacity | privacy | `{screen} 没有清楚说明数据会如何被收集、使用或共享。` |
| 看起来不可靠 | doubt | credibility | `{screen} 的视觉、文案或状态表达降低了用户对系统可靠性的信心。` |
| AI 解释不可信 | opacity | explainability | `{screen} 展示 AI 结论但没有提供足够理由、证据或可验证依据。` |

---

## Content / Copy

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 占位内容太假 | placeholder | realism | `{screen} 使用明显占位或虚假内容，无法验证真实业务场景下的界面质量。` |
| Lorem ipsum | lorem | specificity | `{screen} 使用 lorem ipsum 或无领域意义文本，削弱了原型的业务可信度。` |
| 微文案缺失 | gap | guidance | `{element} 缺少必要 microcopy，用户无法获得足够行动指导。` |
| 空状态无价值 | emptiness | usefulness | `{screen} 的空状态没有解释原因、价值或下一步行动。` |
| 错误文案不可行动 | deadend | actionability | `{screen} 的错误文案只说明失败，但没有告诉用户如何修复。` |
| 标题不表达任务 | ambiguity | intent | `{screen} 的标题没有准确表达页面目的或用户当前任务。` |
| 标签不准确 | taint | precision | `{element} 的标签不够准确，可能导致用户错误理解内容或动作。` |
| 数据缺少单位 | ambiguity | units | `{element} 展示数值但缺少单位、时间范围或统计口径。` |
| 指标含义不明 | opacity | meaning | `{element} 展示指标但没有解释其含义、来源或用途。` |
| 语气不一致 | drift | voice | `{screen} 的文案语气与产品整体 voice 不一致。` |
| 内容过度营销 | noise | utility | `{screen} 的营销性文案干扰了用户完成实际任务。` |
| 内容不匹配用户 | mismatch | fit | `{screen} 的内容深度、语气或信息类型不符合目标用户。` |

---

## Flow / Task

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 核心任务不突出 | dilution | focus | `{screen} 没有突出核心 job，导致用户目标被弱化。` |
| 流程不闭环 | rupture | closure | `{user_goal} 的流程没有形成完整闭环，用户无法确认任务完成。` |
| 中断太多 | interruption | continuity | `{user_goal} 过程中出现过多弹窗、跳转或非必要确认，打断用户节奏。` |
| 步骤顺序错误 | inversion | sequence | `{user_goal} 的步骤顺序不符合用户自然预期或业务逻辑。` |
| 没有进度感 | fog | progress | `{screen} 没有表达当前进度，用户不知道还剩多少步骤或等待多久。` |
| 重要动作缺少确认 | gap | confirmation | `{element} 的重要操作缺少确认、预览或后果说明。` |
| 低风险动作确认过多 | noise | lightness | `{screen} 对低风险操作使用过多确认，增加流程负担。` |
| 无法恢复 | fragility | recoverability | `{screen} 缺少撤销、返回、重试或恢复机制，用户犯错后代价过高。` |
| 手动工作太多 | burden | automation | `{user_goal} 中存在过多重复手动操作，系统没有提供合理自动化辅助。` |
| 自动化不可控 | overreach | control | `{screen} 的自动化行为替用户做决定，但缺少控制、解释或撤销。` |
| 用户目标被打断 | hijack | intent | `{screen} 将用户从当前目标引向系统自己的目标，破坏任务连续性。` |
| 流程混入无关目标 | contamination | purity | `{user_goal} 中混入营销、教育、设置或其他无关目标，污染了流程纯度。` |

---

## Accessibility

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 对比度不足 | dimness | contrast | `{element} 对比度不足，影响低视力用户或弱光环境下的可读性。` |
| 字体太小 | illegibility | legibility | `{element} 字体尺寸、行高或字重导致阅读困难。` |
| 只靠颜色表达状态 | exclusion | redundancy | `{element} 仅依赖颜色传达状态，色觉障碍用户可能无法识别。` |
| 键盘不可用 | trap | access | `{screen} 无法通过键盘顺畅导航或完成关键操作。` |
| 焦点态缺失 | invisibility | focus | `{element} 缺少可见 focus state，键盘用户无法判断当前位置。` |
| 语义缺失 | gap | semantics | `{screen} 缺少必要语义结构，辅助技术难以正确读取。` |
| 点击区域太小 | friction | comfort | `{element} 点击或触控目标过小，容易误触或难以操作。` |
| 动效过强 | sickness | safety | `{screen} 的动效可能造成眩晕、干扰或无障碍风险。` |
| label 缺失 | ambiguity | labeling | `{element} 缺少清晰 label，用户或辅助技术无法判断输入含义。` |
| 错误提示不可访问 | exclusion | inclusion | `{screen} 的错误提示无法被辅助技术感知或定位。` |

---

## Responsive / Device

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 移动端布局崩坏 | rupture | integrity | `{screen} 在移动端布局断裂，影响阅读、导航或操作。` |
| 桌面信息被压缩 | compression | adaptation | `{screen} 在桌面端仍使用过度压缩的信息布局，没有适配大屏空间。` |
| 横向溢出 | overflow | containment | `{screen} 出现横向溢出或内容超出容器，破坏布局完整性。` |
| 触控困难 | friction | comfort | `{element} 在触控设备上操作困难，点击区域、间距或反馈不足。` |
| 不同设备能力断裂 | gap | parity | `{screen} 在不同设备上功能或信息缺失，且没有清楚解释。` |
| 桌面端太空 | sparsity | density | `{screen} 在大屏上信息过稀，空间利用不足。` |
| 移动端导航复杂 | maze | wayfinding | `{screen} 在移动端导航路径复杂，用户难以找到目标入口。` |
| 表格移动端不可读 | collapse | adaptation | `{screen} 的表格或密集数据没有转换成适合移动端的表达方式。` |
| 弹窗移动端失控 | overflow | containment | `{element} 在移动端弹窗中溢出、遮挡或滚动困难。` |
| sticky 遮挡内容 | obstruction | clearance | `{element} 固定定位后遮挡主要内容或操作区域。` |

---

## Performance Perception

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 加载无反馈 | void | feedback | `{screen} 加载期间没有反馈，用户无法判断系统是否正在工作。` |
| 骨架屏误导 | deception | honesty | `{screen} 的 skeleton 与真实内容结构不一致，造成错误预期。` |
| 长任务无进度 | opacity | progress | `{user_goal} 执行时间较长，但缺少进度、剩余时间或阶段提示。` |
| 页面跳动 | instability | stability | `{screen} 加载或刷新时发生明显布局跳动，影响阅读和操作稳定性。` |
| 局部刷新不明确 | ambiguity | freshness | `{screen} 数据更新后没有清楚表达哪些内容发生了变化。` |
| 慢操作无解释 | opacity | transparency | `{element} 操作耗时较长，但没有解释原因或提供状态反馈。` |
| 重复点击风险 | duplication | idempotence | `{element} 缺少防重复提交反馈，用户可能多次触发同一操作。` |
| 后台任务不可见 | invisibility | visibility | `{user_goal} 被放入后台执行后，用户无法追踪任务状态。` |
| 数据新鲜度不明 | fog | freshness | `{screen} 没有说明数据更新时间或实时性，用户难以判断可信度。` |
| 失败无法重试 | fragility | resilience | `{screen} 失败后缺少重试、恢复或替代路径。` |

---

## Design System

| UI/UX 缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 重复造组件 | debt | reuse | `{screen} 重复实现了已有组件能力，增加后续维护和一致性成本。` |
| token 不一致 | drift | integrity | `{element} 使用了偏离设计 token 的颜色、间距、圆角或阴影。` |
| 变体泛滥 | sprawl | discipline | `{element} 出现过多无约束变体，增加设计系统复杂度。` |
| 组件语义不清 | ambiguity | semantics | `{element} 的使用场景和语义不清，容易被错误复用。` |
| 规则全靠感觉 | implicitness | explicitness | `{screen} 的视觉或交互规则没有被明确记录，依赖个人感觉维持一致性。` |
| 状态设计不完整 | debt | coverage | `{element} 缺少 hover、active、disabled、loading、error 等必要状态。` |
| 图标体系混乱 | drift | consistency | `{screen} 混用了不同风格、线宽或语义规则的图标。` |
| 设计和代码脱节 | split | alignment | `{screen} 的设计表达和代码实现规则不一致，导致后续落地风险。` |
| 局部美化破坏整体 | overfitting | coherence | `{screen} 为了局部效果牺牲了全局系统一致性。` |
| 复用过度 | rigidity | purpose | `{element} 为了复用牺牲了当前场景的表达准确性。` |

---

## AI Prototype Specific

| AI 原型缺陷 | Poison word | Healthy word | 问题描述模板 |
|---|---|---|---|
| 看起来高级但业务不对 | mismatch | fit | `{screen} 视觉完成度较高，但与 product core 中定义的业务目标不匹配。` |
| 每轮风格变化 | drift | memory | `{screen} 相比上一轮发生了无解释的风格变化，破坏视觉记忆。` |
| agent 各自理解产品 | schism | kernel | `当前设计或 review 暗含了多个互相冲突的产品理解，没有服从统一 product core。` |
| 生成内容太泛 | genericity | specificity | `{screen} 使用了通用 SaaS 表达，缺少具体领域对象、数据和工作流特征。` |
| 页面很多但没有 flow | gallery | coherence | `当前原型生成了多个页面，但缺少能串联用户任务的完整 flow。` |
| AI 自己新增 scope | leakage | discipline | `{screen} 包含 spec 或 run contract 未要求的新功能、新页面或新模块。` |
| 把假设当事实 | contamination | traceability | `{screen} 将未确认假设当作确定事实写入了产品或界面。` |
| 只修表面 | gloss | substance | `当前修复只调整了视觉表面，没有解决 underlying product、UX 或 flow 问题。` |
| reviewer 互相打架 | conflict | arbitration | `多个 reviewer 给出了互相冲突的建议，且没有经过 arbiter 统一裁决。` |
| 上下文被稀释 | dilution | kernel | `当前任务引入了过多上下文，导致 product core 中的核心目标被稀释。` |
| 截图和代码不一致 | split | consistency | `截图、代码、报告或 gate 之间存在不一致，无法确认真实产物状态。` |
| 没证据就说完成 | hallucination | evidence | `当前产物声称完成，但缺少截图、运行结果、review 或 gate report 作为证据。` |
| 忽略已确认决策 | erosion | preservation | `{screen} 破坏了已确认产品、视觉或交互决策，但没有说明原因或申请变更。` |
| 原型越修越偏 | drift | convergence | `多轮修改后，原型逐渐偏离原始目标，而不是向 product core 收敛。` |
| 需求覆盖不完整 | gap | coverage | `当前原型没有覆盖 spec、screen inventory 或 run contract 中要求的关键内容。` |

---

## Terminal Output Examples

```text
☠ found a poison: ambiguity
screen: checkout-confirmation
element: primary CTA
antidote: explicitness
description: checkout-confirmation 的主按钮含义或点击后果不明确，用户无法判断它会触发什么结果。
```

```text
☠ found a poison: schism
antidote: kernel
description: 当前设计或 review 暗含了多个互相冲突的产品理解，没有服从统一 product core。
```

```text
☠ found a poison: hallucination
antidote: evidence
description: 当前产物声称完成，但缺少截图、运行结果、review 或 gate report 作为证据。
```

---

## Suggested File Location

如果将这份 taxonomy 放入 `poison` skill，建议路径为：

```text
.claude/skills/poison/references/poison-taxonomy.md
```
