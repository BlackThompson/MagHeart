## **4.1 Design Rationales**

Enable Continuous and Embodied Remote Presence

在混合会议中，远程参与者往往仅在发声时才被注意到，其存在容易被本地环境淹没。为了让远程用户在不发言的间隙也能被持续感知，我们采用心率作为跨空间共享的核心线索。心率具有连续性和节奏性，并能反映一定程度的情绪状态；已有研究也表明，让用户看到自己的心率有助于缓解社交场景中的紧张感。基于这些特性，我们希望让远程参与者的身体节奏能够以稳定、轻量的方式被本地空间感知。

为了保证这一信号的实时性、连续性与可靠性，我们开发了一个独立的 Apple Watch 应用，用于直接从手表采集心率；同时配套 iOS 应用用于接收、上传与简单展示，使远程用户无需额外硬件或复杂设置，只需手表与手机即可参与。这种设计减少了进入门槛，也确保心率在整个会议过程中始终可用。

系统随后将这一节奏映射到界面中跳动的心率图标、悬浮装置的上下浮动强弱等多种模态，使其在视觉与物理层面都能被本地参与者感知。我们还加入一个简短的触觉环节：本地用户将手捏磁铁放在悬浮装置上方，可以感受到随心率变化的轻微跳动。这种直接的身体反馈帮助双方在对话开始前便建立基础联系，使远程参与者不再只在讲话时被关注，而是在整个活动过程中保持可感知的存在。

Support Structured and Equitable Identity-Making Co-Creation

为了让远程参与者在本地环境中获得更明确的存在感，我们采用 LEGO minifigure 作为其物理化身，并将共同构建这一化身的过程设计为破冰活动的核心。仅依赖语音往往难以高效启动跨空间对话，也容易产生冷场，因此我们引入了一个基于卡片的结构化 scaffold，使双方能够以清晰且逐步推进的方式建立对远程参与者的理解。参与者首先通过头像选择完成最初的轻量呈现，本地参会人员随后通过一系列对 LEGO minifigure 部件选择有帮助的卡片，remote回答问题，使其偏好能够自然映射到可构建的特征（如心情、服饰风格或颜色）。在许多混合会议中，本地参与者往往自然占据主导，而远程参与者容易被动地回答问题或等待指示。为了避免这种结构性不平等，我们加入远程用户可抽取的随机卡片，使其拥有对进度与内容产生实际影响，并提升过程的趣味性和不确定性。

在进入构建阶段后，我们希望远程参与者不仅“提供信息”，而是真正参与创作，因此允许其使用 LEGO 的数字工具同步制作自己的版本。为保持可见性和参与感，我们提供模糊化屏幕共享，使本地用户能够感知远端的创作过程，而不会让远程用户感到被监控或暴露过度。双方通过“完成”按钮标记进度，系统以特别设计的轻柔音效与简洁动画同步节奏，使协调过程不产生压力。最终，系统自动呈现远程用户的成品截图，本地用户通过摄像头展示实体版本，双方据此对齐并确定最终设计。本地用户将这一达成一致的小人放置到与远程用户心率相连的悬浮装置上，作为其在场的象征。放置动作与完成音效共同标记破冰活动的结束。

通过这一结构化但开放的共同构建过程，远程用户在本地空间中获得了可理解、可参与、可协商的表达方式；本地与远程双方在叙事和创作上保持了实际影响力，避免了角色不平等，使跨空间合作得以顺畅展开。

## **4.2 MagHeart App**

MagHeart App 由 Apple Watch 端与 iOS 端协作构成，其交互目标是让远程参与者以最小操作负担将自身的生理节奏带入会议，UI设计以现代化、简约易操作为主要原则。Watch 端承担主要的心率采集工作；应用启动后会显示当前心率并提示连接状态，确保用户能够确认系统正在正常运行。我们刻意减少界面操作，仅保留开始／结束测量的按钮，使参与者无需额外学习便能参与。iOS 端作为心率数据的接收(apple健康数据必须通过iPhone上传第三方)、展示与上传平台，在视觉反馈上，iOS 端以一个持续跳动的心率图标呈现上传节奏，并实时更新上传状态以避免远程用户出现“我是否还在线”的不确定感。

在整个设计中，我们希望心率的共享不被理解为“监控”，而是作为构建跨空间联系的基础节奏。因此 iOS 界面在传达状态时保持低信息密度，不显示历史、趋势或解释性文本，而只呈现实时性与连通性，让用户明确知道 “我的节奏正在被传递”，避免额外的情绪负担。

iOS 应用还承担了连接会议空间的入口角色：远程用户在打开 App 后进入设置页面，设置姓名，测试连通性。无需其他操作，心率数据自动上传。

这一部分心率以视觉模态呈现。

## **3.3 Icebreaking Interface**

我们设计了 Icebreaking Interface 作为一个共享的数字环境，使本地与远程参会者能够合作构建一个 LEGO minifigure，而该 minifigure 将作为远程参与者在会议中的物理化身。整个界面被设计为线性推进但低压力的流程，界面通过四个阶段引导参与者从相遇、理解，到共同创造并对齐最终成果。每个阶段都结合了轻量的交互方式与多模态提示。

------

## **3.3.1 Establishing Presence**

这一初始阶段用于聚集所有参与者，并为早期的跨空间感知奠定基础。参与者首先从预设头像库中选择一个头像，作为初始表达。界面将每位参与者呈现为轻轻漂浮的气泡，其上下浮动的动作微妙地呼应了悬浮装置的节奏。

远程参与者的心率以跳动图标和数字显示。本地参会者通过手捏磁铁靠近装置，感受到磁力跟随心率变化，带来一种类似脉搏的触觉反馈体验。这种多模态组合，使双方在正式交流之前便形成“对方正在这里”的基础认识，降低跨空间陌生感

## **3.3.2 Building Shared Context**

这一阶段通过一组结构化的提示卡片帮助双方建立与 minifigure 构建相关的共享语境。第一部分，本地参会人员从卡堆里面选择卡片，当一张卡片被选择时，它会同步放大至双方屏幕中央，远程参与者的回答被转化为界面中可视化的偏好标签，并逐步累积，为后续的实体构建提供依据。

根据DR2多角色对等原则，第二部分，界面为远程参与者提供一组仅供其抽取的随机卡片。这些随机卡带来了轻量的不可预测性，使远程参与者能主动影响互动方向，而不只是被动回应。两个部分的卡片都可以被取消选择，保证参会人员对过程的掌控感。

## **3.3.3 Collaborative Construction**

在协同构建阶段，现场参会人员根据前一阶段构建的共享语境拼装实体 LEGO minifigure，而远程参与者则使用官方minifigure数字工具构建他们的版本。为了在提升参与感的同时避免过度暴露，我们提供了模糊化的屏幕共享功能，使现场参与者能看到“正在进行某项构建活动”，但无法分辨具体细节。该模糊化可以被远程参会人员根据自己的意愿随时开关，高度自由。

当共享开始后，双方界面都会出现 “Mark Complete” 按钮。点击后会播放柔和的音效，提示对方进度变化但不会造成任何催促。双方均完成后，界面会出现轻量的完成动画，并前往下一阶段。

## **3.3.4 Joint Presentation and Closure**

在最后阶段，界面会将双方的作品并置展示。系统会自动截取远程参与者的最终数字版本，而现场参与者通过摄像头展示实体构建成果。双方讨论差异并协商确定最终设计。

达成一致后，本地参与者将最终 minifigure 放置到悬浮装置上，使其与远程人员的心率节奏同步浮动，象征远程参与者在活动中的持续存在。点击 “complete session” 按钮时，会播放一个简短、积极的完成音效，标志着破冰活动的结束。

## 4.4 implmation

We implemented the core system in Python running on a FastAPI [35] server that provides REST APIs for both MagHeart App and Icebreaking Interface. 心率采集由 watchOS 调用 HealthKit（workout session API）持续监测 BPM，经 Connectivity 传到配对的 iOS 客户端；iOS 端做时间戳校验后，POST 到后端。后端用 Redis 做“最新心率”缓存与 pub/sub，将每次心率事件同时推送给 SSE 订阅者，并写入WebSocket 广播。

Icebreaking Interface 以 React 开发，主要通过 WebSocket 接收会议状态与心率更新（会议状态由 SQLite 持久化）。

物理悬浮装置通过串口与本地 FastAPI server 连接；订阅云端 SSE 把收到的 BPM 转为串口指令发给 ESP32，使其在多通道上输出对应强度信号驱动悬浮装置。

















# MagHeart 项目描述（HCI / DIS 语境）

MagHeart 把“身体信号”转化为“协作媒介”：远程伙伴的心率被实时“托举”为漂浮的实体节奏，同时映射到屏幕上的共创界面(作为icebreaker)，让身体感知、情感共鸣与协同决策同场出现。

## 设计愿景
- **把生理节奏变成社交线索**：心率不是数据点，而是一种在场感——看得见、听得见，也能被触达（磁悬浮装置）。
- **双场域共创**：线上界面与线下物理装置同步响应，同一份心跳在屏幕与空气中呼应。
- **角色平等、节奏共享**：本地与远程都有可见的行动空间；主持人引导节奏，远程伙伴也能主导抽牌、讲述、展示。

## 体验旅程（叙事化）
1) **相遇**：参与者用 Apple Watch / iPhone 打开 MagHeart，留名、选角（Host / Local / Remote），进入同一“房间”。
2) **等候心跳**：在 Lobby，大家看到彼此的心率气泡和身份标签，装置开始微弱漂浮，提示连通。
3) **共创前奏**：Shared Context 阶段，本地侧翻开卡轮，远程侧回答卡片提示；问题从情绪、身份到偏好，逐步堆叠共享上下文。
4) **远程抽牌**：Draw 阶段，远程伙伴点击一张“背面向上”的卡片，它会在中心放大、可被回答；本地侧能看到正在回答的卡与提示。
5) **共创搭建**：Co-creation 阶段，远程侧可共享屏幕（通过lego create a minifigure 网站进行创作），本地侧跟随或复刻。心率与互动同步广播，界面通过视觉和声音显示完成情况与庆祝动画。
6) **展示与收束**：Showcase 阶段，远程的最终画面/截图与本地摄像头视角并置；本地以及远程用户进行协商，brainstorm，商量最终在本地代表远程用户的minifigure。点击complete 后 有一个完成的音效。振奋人心。预示着ice的break。

## 交互要点
- **卡片轮与放大视图**：无论“翻牌”还是“抽牌”，都是同一套视觉语言——扇形卡轮 + 中央放大。远程点击背面卡即可在中心揭示并回答。
- **心率的多重呈现**：界面上的心率标签、列表节奏提示，物理装置的磁悬浮强弱，同步强化“在场”感。
- **轻量的社交信号**：悬停、选择、取消都会广播给对方（发光、放大、提示），降低异步误解。
- **阶段化导航**：Lobby → Context → Draw → Co-creation → Showcase，主持人可推进，远程随阶段自动跳转。

## 系统骨架（保持设计语境的简述）
- **感知端**：Apple Watch + iPhone/Watch 应用，持续采集心率并上送；应用内可一键体检连通性。
- **协作端**：Web 界面承载身份、心率可视化、卡片互动、屏幕共享与结果展示。
- **物理端**：磁悬浮装置以力度与节奏对应心率；需要串口或本地桥接脚本连接。
- **云端**：实时转发与状态同步的“心跳中枢”，将心率、会议状态、互动事件送往界面与装置。

## 角色与场景
- **Host / Local**：现场操作者，翻牌、搭建、推进阶段；承担物理装置观察者。
- **Remote**：远程创作者，抽牌、回答、分享屏幕；其心率驱动装置变化。
- **观众 / 旁听**：可只看心率节奏与共创结果，用于展示与汇报。

## 物理-数字耦合
- 磁悬浮心跳：三通道电磁与节奏映射，强弱/频率与心率同步；长时间无数据会缓缓停歇。
- 视觉-触觉呼应：屏幕上的卡片放大和装置的力度变化共同提示“有人在讲述/思考”。
- 3D 外壳与结构：`Device/Model/` 提供外壳与罩体模型，支持展陈或实验室环境。

## 数据与伦理（简述）
- 心率仅用于当场的在场感与情感线索，不做长期分析；会议结束可清空。
- 角色明确与阶段提示，降低“被监控”感：用户可随时手表停止心率记录、停止上传。

## 参考素材
- 体验流程与卡片内容：`docs/cards.md`
- 硬件装配与快速上手：`docs/QUICKSTART_ARDUINO.md`
- 部署与展陈搭建示例：`docs/deploy.md`

# MagHeart (ACM DIS-style English Summary)

MagHeart turns heartbeat data into a shared collaboration medium. Remote partners’ heart rates are lifted into a floating physical rhythm and mirrored in a co-creation interface, letting bodily presence and joint decision-making co-exist.

## Design Intent
- **Physiological rhythm as social cue**: Heart rate is rendered as presence, not just data—visual, audible, and tangible through a levitating actuator.
- **Dual arenas**: A synchronized digital canvas and a physical object let the same heartbeat be seen on-screen and felt in the air.
- **Balanced agency**: Host and remote participants both act: hosting tempo vs. drawing/answering cards, sharing screens, showcasing outcomes.

## Experience Arc
1) **Arrival**: Participants name themselves, pick roles (Host / Local / Remote), and enter the shared “room.”
2) **Heartbeat check-in**: In the lobby, identities and heart-rate bubbles appear; the device begins a gentle pulse to signal connectivity.
3) **Context building**: In Shared Context, the local side flips card prompts; the remote side answers, layering mood/identity/preferences.
4) **Remote draw**: In Draw, the remote partner clicks a face-down card; it enlarges centrally and is answered while the host observes.
5) **Co-creation**: The remote side can screen-share (e.g., LEGO build, sketch); the local side mirrors or follows along. Completion status and celebrations are broadcast.
6) **Showcase**: Remote snapshots and the local camera view are juxtaposed; the physical device settles into a steady rhythm, marking closure.

## Interaction Grammar
- **Card wheel + central enlargement**: One visual language for “flip” and “draw,” keeping continuity for both sides.
- **Multimodal heartbeat**: UI tags, list rhythms, and actuator intensity co-express presence.
- **Lightweight social signals**: Hover, select, cancel events are broadcast (glow, lift, prompts) to reduce ambiguity.
- **Phased navigation**: Lobby → Context → Draw → Co-creation → Showcase; host advances, remote follows automatically.

## System Sketch (concise)
- **Sensing**: Apple Watch + iPhone/watch app continuously capture and upload heart rate; connectivity checks are built-in.
- **Collaboration surface**: Web client handles identity, card interactions, screen share, completion and celebration cues.
- **Physical channel**: Levitating actuator maps intensity/tempo to heart rate; connects via serial or a local SSE-to-serial bridge.
- **Cloud relay**: A “heartbeat hub” that forwards heart rate, meeting state, and interaction events to both UI and device.

## Roles & Scenarios
- **Host / Local**: Drives pacing, flips cards, builds physically, observes the device.
- **Remote**: Draws cards, answers, shares screen; their heart rate animates the device.
- **Audience**: Views rhythms and outcomes for demos or reporting.

## Material-Interaction Coupling
- Three-channel electromagnetic actuation maps strength/frequency to heart rate; idles gracefully on silence.
- Screen magnification and physical intensity co-signal “someone is speaking/thinking.”
- 3D enclosure and shell models under `Device/Model/` support exhibition or lab setups.

## Data & Ethics (brief)
- Heart rate is used for in-the-moment presence, not long-term profiling; sessions can be cleared.
- Role clarity and phase prompts reduce surveillance anxiety; users can stop streaming anytime.
- Cloud or local-bridge paths allow choosing between low-latency sharing and tighter data locality.

###### 



感觉可以这样，一节强调Physiological Cues相关的设计，一节强调卡片和共创的设计，一节专注于多模态的设计，包括感受力，视觉设计，音效设计，结合我的思考过程，注意细节：
界面设计的时候，我告诉你我的设计想法。就是我们需要icebreak。并与lego结合，我们用lego minifigure 作为remote 用户的现实存在载体。那我就想我们可以把这个共创过程 给设计出来 做一个web界面。类似于一个zoom 插件/游戏。本地会议人员的特殊性，作为host。创建一个meeting。每个用户都能选头像（其实我设想选头像的过程就已经是一个ice break过程，一个design 的cue了 但是似乎无人在意） 然后远程人员加进来，有一个类似于大厅的地方展示人员（上下浮动的动画也暗示了设备） 以及心率列表，确认状态。然后进入下一部分，叫做shared context。因为我想核心是本地人为远程人搭建一个小人。但是随机搭就无法反馈出remote的想法。所以两端协商。但是zoom语音已经有这个协商功能了，那么我的界面存在的意义是什么呢，而且语音的话又太随机了，ice存在，如何聊呢？我就想做一个类似于卡片的游戏，然后来定context。lego小人对应就是几个部件（头、帽子/头发、上装、下装、左手和右手上拿的饰品）设计一些卡片，让其能够将回答至少映射到一件物品或一套风格。这一部分很自然的就想到让本地人问，remote答。然后我又想到这样太无聊，想增加一些随机性的元素，就再设计一些卡片，让remote抽。我想的是“为remote制作小人，当然主要是以remote为核心，但是也不能让另一方失去fair的感觉”。都分别有点掌控感。 然后到了shared contetx定下来的部分，要创造小人了。我想创造小人这个部分其实已经有成熟的网站，lego官方也有机器。创造的时候remote人看着也怪无聊的，没有参与感。所以我想是不是可以让远程人员也参与进去，打开create a minifigue 网站，按照自己的想法捏一个小人。期间可以投屏，显示马赛克处理的模糊的创造界面，制造神秘感，增加远端存在感给本地人员（可以自由控制模糊开关，虽然实际测下来几乎无人使用）。然后有两个“mark complete”按钮，用于每端用户标记完成，这样一端完成，另一端能知道，通过音效和按钮变化来形成，音效确保不给对方带来焦虑，又能带来告知效果，和流程推进作用。两方都完成显示动画和双方完成音效。最后是一个showcare阶段，这样远端人员也会有一个展示机会，双方可以进行对比交流，远端人员的设计自动截图，本地人员通过摄像头进行展示，双方确定最终设计方法，一定程度上也起到了可能远端配件更全，本地配件不匹配等情况，当然理想情况是所有配件双方全部匹配。该过程更是起到破冰的高潮。最后“complete session” 带来一个高扬的振奋人心的音效，标志着minifgure的设计完成，也标志着破冰来的高潮，破冰结束，冰碎了（我没有用冰碎的音效，是一个小号的音效）。 
app设计的时候，主要原则就是能够实时收到准确且连续的心率，所以选择了自己开发watchApp，以及配套的IOS app用于接收、发送和展示心率。app遵循易用、好看、简约等原则，这样远程人员完全不需要任何硬件和lego配件，无论何时无论何地只要有手机和手表就行。就能参与进来。
