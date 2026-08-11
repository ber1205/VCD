# VCD AI 配音管线 — 当前实现基准 v1.10.52

> 以代码实现为准（frontend/worker），替代旧"pipeline流程图 v1.9.23"作为后续一切比对的基准。
> 原则：**流程图 = 代码现状**。任何与本文档不符的比对结论，以本文档（或更新的代码）为准。
> 更新日期：2026-08-11 ｜ 覆盖版本：v1.10.27（v3.0 合并）→ v1.10.52.2（去嵌套/熔断/续传）

---

## 一、当前环节流程图（9 活跃环节 + 3 人工暂停点）

```
[视频/SRT] → 1.extract_audio ─┬─ 火山MediaKit 人声分离×1 (统一直接分离, 失败降级 extract+separate)
                               └─ [人声vocal.wav] + [背景音bgm.wav]
                                          ↓
                              2.asr_recognize → Qwen-ASR×1 → [时间轴+识别字幕+角色标记]
                                          ↓
                              3.speaker_diarize → 本地声学特征 + DeepSeek×1 (ASR纠错+角色/性别/语境)
                                          ↓
                              4.voice_clone → CosyVoice enrollment (实时熔断, 单任务≤12次)
                                          ↓
                          【人工字幕校对】 manual_subtitle_review ← 恒自动放行 (开关保留)
                                          ↓
                              5.translate_unified → DeepSeek×1 (翻译+校对+情感标记+音节精算+时长预算+自检)
                                          ↓
                          【人工翻译校对】 manual_translation_review ← 恒自动放行 (开关保留)
                                          ↓
                              6.tts_synthesize → CosyVoice/Qwen×N (TTS Queue 块路径, DO 外执行)
                                          ↓
                              7.wsola_adjust → 本地 WASM 时间轴伸缩 (免费)
                                          ↓
                              8.unified_quality_check → 本地漂移检测+时间轴对齐校验 (免费)
                                          ↓
                              9.merge_output → R2 流式合并 (人声+背景音 mp3 / 纯人声 mp3 / 字幕 srt)
                                          ↓
                          【人工审核质检】 manual_final_review ← 恒自动放行 (开关保留)
```

**环节数：9 活跃 + 3 暂停点 = 12 步骤**（vs 旧流程图 16 步骤，减少 37.5%）

### 进度节点（STAGE_PROGRESS_NODE, types.ts:362）

```
extract 0% → asr 15% → speaker 22% → clone 32% → 字幕校对 37%(暂停)
→ translate_unified 52% → 翻译校对 55%(暂停)
→ tts 62% → wsola 72% → unified_quality 82%
→ merge 92% → 终审 100%(暂停)
```

---

## 二、环节与 API 调用清单

| # | 环节 | 步骤名 | API 调用 | 实现文件 |
|---|------|--------|---------|---------|
| 1 | 人声分离 | extract_audio | 火山 MediaKit×1(统一 direct separate,失败降级 extract+separate) | pipeline/stage-extract.ts |
| 2 | ASR 识别 | asr_recognize | Qwen-ASR×1(轮询不计费) | pipeline/stage-asr.ts |
| 3 | 说话人分析 | speaker_diarize | DeepSeek×1(ASR纠错+角色/性别/语境)+ 本地声学 | pipeline/stage-speaker.ts |
| 4 | 音色克隆 | voice_clone | CosyVoice enrollment(引擎层 3 次重试,任务级熔断 ≤12) | pipeline/stage-clone.ts + ai/clone.ts |
| 5 | 统一翻译 | translate_unified | DeepSeek×1(翻译+校对+情感+音节+时长+自检) | pipeline/stage-translate.ts |
| 6 | 配音合成 | tts_synthesize | CosyVoice/Qwen×N(Queue 块路径) | pipeline/stage-tts.ts + queue-workers.ts |
| 7 | 时间轴调整 | wsola_adjust | 本地 WASM(免费) | pipeline/stage-align.ts |
| 8 | 统一质量检查 | unified_quality_check | 本地(漂移检测+时间轴对齐) | pipeline/stage-align.ts |
| 9 | 合并输出 | merge_output | 本地(R2 流式,无整段内存) | pipeline/stage-merge.ts |

**API 总量（单任务,典型）**: 火山×1 + ASR×1 + DeepSeek×2 + CosyVoice×(克隆≤12 + TTS×N) + Qwen TTS×N

---

## 三、关键架构特性（超越旧流程图的设计）

### 3.1 翻译合并（v1.10.27 v3.0）
- `translate_unified` 单次 DeepSeek 调用 = 翻译 + 校对自检 + 情感标记 + 音节精算 + 时长预算 + 质量自检
- 旧独立步骤 `deepseek_proofread`/`subtitle_proofread_check`/`translate`/`translation_proofread_check`/`mfa_align`/`duration_budget` 全部并入或重定向
- 旧步骤名零写入点;存量任务经 `STEP_ALIAS_TO_NEW` 集中规范化映射兼容（v1.10.52.2 收敛散落 case）

### 3.2 TTS Queue 化（v1.10.42）
- TTS 块消息分发到 `vcd-tts-queue`,消费者独立执行权(自动重试 + DLQ)
- DO 内仅轻量聚合轮询(D1 查询 + R2 合并,每次 alarm 毫秒级),根治"55% 永久卡死"
- 动态批次:≥2min 视频 10 句/块,短视频 5 句/块;块内并发 2 + 全局令牌桶 6 兜底 429

### 3.3 B 波三路并发（v1.10.37）
- `speaker_diarize` 步骤内并行执行:speaker ∥ translate_unified ∥ voice_clone（Promise.allSettled）
- 合并 patch 含 `voiceId`（v1.10.42.5 修复漏合）;翻译失败透传增量检查点续传（v1.10.52.1）
- 克隆失败 `resolveStockVoice` 兜底 + 3 分钟 voiceId 等待上限（v1.10.52/52.1）

### 3.4 翻译增量检查点续传（v1.10.52.1）
- unified 每批(100句)成功后立即写 D1 `task_checkpoints`(translate_partial)+ state 字段
- 批失败保留 partial → 降级 `stepTranslate` 从断点续传,消除"全量重译重复计费"
- 读取端优先级:state 字段 → D1 → R2 旧键兜底

### 3.5 克隆去嵌套 + 实时熔断（v1.10.52.2）
- 外层 1 轮(原 3 轮) + 引擎层 3 次重试(1s/2s/4s 退避)
- `MAX_CLONE_CALLS_PER_TASK=12` 从入口闸门升级为每次 enrollment 前实时熔断(B 波/5 路并行全覆盖)
- 失败降级统一为 `qwen_system` 标记(杜绝 zeroshot_ 占位污染)

### 3.6 人工校对（v1.10.29/52）
- 3 个暂停点恒自动放行(`ENABLE_MANUAL_REVIEW=false`,用户决策"人工环节全部自动放行")
- 暂停点骨架与开关保留,恢复成本约 60 行(重建订单状态机)

### 3.7 成本预检（v1.10.52）
- Pass 1 后、TTS 前执行 `checkPreExecutionBudget`(D1 segments 表精确数据源)
- $4.20 闸门降级 / $5.00 闸门阻断;降级含 15% 压缩 + 次要角色 Qwen-Audio

---

## 四、与旧流程图（v1.9.23）差异对照

| 维度 | 旧流程图 | 当前实现 | 状态 |
|------|---------|---------|------|
| 环节数 | 16 | 12(9 活跃 + 3 暂停点) | 合并 |
| DeepSeek 调用 | 5 次 | 2 次(speaker + translate_unified) | 合并 |
| 人声分离 | trim+separate 2 次 | 统一 direct separate 1 次(失败降级) | 合并 |
| 翻译校对 | 3 次独立调用 | 并入 translate_unified | 合并 |
| 质量评分 | drift+quality+final_qc 3 次 | unified_quality_check 1 次 | 合并 |
| 人工校对 | 3 个显式暂停点 | 3 个暂停点保留但恒自动放行 | 设计决策 |
| SRT 优先 | 跳过 ASR | ASR 仍执行,SRT 走翻译快速通道 | **未实现(差距)** |
| speaker 阶段 DeepSeek | 合并到翻译 | 保留在 speaker(ASR纠错+角色分析) | **未实现(差距)** |

### 已知差距（有意保留或待办）
1. **SRT 跳过 ASR**:上传 SRT 时 Qwen-ASR 仍执行(架构级改动,待评估)
2. **speaker_diarize 的 DeepSeek**:保留(克隆前需要性别/角色信息,合并收益低)
3. **mp3 队列化**:DO 内 lamejs 编码已禁用(`if(false)`,v1.10.50.2 OOM 后),mp3 产物待 DO 外队列化恢复
4. **克隆策略链 6→2 级**:`lastResortClone` 6 策略仍保留(质量敏感,待评估简化)

---

## 五、变更历史（v1.10.27 之后关键版本）

| 版本 | 变更 |
|------|------|
| v1.10.27 | v3.0 合并:translate_unified / unified_quality_check / 统一人声分离 / 12 步骤 |
| v1.10.29 | 人工校对总开关 ENABLE_MANUAL_REVIEW=false |
| v1.10.37 | B 波三路并发 |
| v1.10.42 | TTS Queue 化(块路径);ttsBatchStart 状态字段 |
| v1.10.42.5 | B 波 voiceId 漏合修复 |
| v1.10.48 | Two-Pass 管线移除(two-pass-orchestrator.ts 删除) |
| v1.10.50.2 | mp3 编码禁用(DO OOM) |
| v1.10.52 | 大规模死代码清理;成本预检数据源修复(D1 segments);B 波克隆失败兜底;voiceId 等待上限;检查点读取端修复 |
| v1.10.52.1 | 翻译增量检查点续传(每批落点);B 波降级透传 partial;JSON 校验部分放行;段失败降级链(段级重试→缓存兜底) |
| v1.10.52.2 | 克隆去嵌套(外层 3→1)+ 实时熔断(≤12);zeroshot→qwen_system;enrollment 401 域名可配置+分流;旧步骤别名规范化 |

---

*基准版本：v1.10.52.2 ｜ 本文档为"以代码为准"的权威基准,后续比对请以本文档为参照*
