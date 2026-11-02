from pathlib import Path
# Reuse the checked figure primitives; do not execute the earlier artifact builder.
previous=Path(__file__).parent.parent/'design-exploration-2026-11-02/build_materials.py'
exec(previous.read_text().split('# board')[0])
import csv
with (O.parents[2]/'public/demo/reviews.csv').open() as f: review=next(csv.DictReader(f))
canvas('C方案细化  桌面对话与证据核验','1440px桌面布局示意  ·  模型回答为静态示例  ·  r001原文取自项目模拟CSV，不是真实消费者评论',1800,1250)
box(50,175,1700,80,'研究范围  美国 / 宠物饮水机 / 模拟数据 / 当前会话',n=28)
box(50,285,240,820,'研究步骤','范围已确认\n数据检查\n用户偏好\n核心风险\n可解决性\n验证计划',n=27)
box(320,285,710,820,'对话')
box(350,380,650,120,'你  清洗方面有哪些反馈？',n=26)
box(350,530,650,280,'助手  示例回答','这条模拟评论提到内部角落难以清洁。\n它只支持该条体验反馈，不能推断市场需求。\n\n[查看评论 r001 →]',fill='soft',n=26)
box(350,860,650,100,'输入追问……',n=25);pill(350,985,150,'发送')
box(1060,285,690,820,'原文证据  r001')
box(1090,380,630,120,'商品 p01  /  2星  /  2026-06-30','来源：模拟样本',n=25)
box(1090,530,630,270,'完整原文',review['review_text'],n=27)
box(1090,830,630,170,'当前标签  清洗困难','[修正标签]   [返回引用]',n=25)
txt(55,1150,'行为：点击引用 → 定位同一条原文；键盘可进入证据区并返回；统计与版本由程序提供。',25,'muted');save('01_桌面对话核验.png')
canvas('C方案细化  人工纠错与旧解释失效','对原标签的修改属于当前会话；原因必填；原始评论文本保持不变',1800,1250)
box(55,185,790,660,'编辑标签  r001')
box(85,280,730,120,'原标签  清洗困难','修改后标签：[由用户选择]',n=27)
box(85,435,730,160,'修改原因','[用户填写；空白不可应用]',n=27)
box(85,630,730,140,'尚未保存','[取消]    [应用并重算]\n切换评论前提示处理未保存修改。',fill='soft',n=27)
arrow([(845,500),(940,500)])
box(965,185,780,660,'应用后')
box(995,280,720,120,'标签已修改，结果已重算','保留本次修改原因。',n=27)
box(995,435,720,170,'上一条解释已失效','不能继续作为当前结论。\n[重新解释]',fill='soft',n=27)
box(995,640,720,140,'解释完成后','仅新版本的引用和统计可用于当前研究。',n=27)
box(55,900,1690,210,'中途变更与失败','数据更换或标签变更后，旧请求返回也不能覆盖当前结果。\n重算失败时明确提示，阻止依赖旧结果的继续分析；不把旧解释恢复为有效。\n刷新将丢失会话纠错记录，不显示“已永久保存”。',n=29);save('02_纠错与失效.png')
canvas('C方案细化  不可用  失败与证据不足','不同原因给出不同后续动作；不把静态答案当作模型结果',1800,1250)
for x,y,title,body in [(55,190,'模型尚未配置','对话暂不可用，可继续查看规则分析。\n[查看规则分析]\n发送不可用，不提供无效重试。'),(920,190,'本次请求未完成','输入与已有结果已保留。请稍后重试。\n[重试]  [返回编辑]\n重试前重新检查当前研究版本。'),(55,650,'结果未能核验','这次回答没有通过证据核验。\n[重试]  [查看原始证据]\n不展示未经核实的回答或引用。'),(920,650,'当前证据不足','还缺少判断所需的信息。\n[补充条件]  [查看验证事项]\n可以在证据不足状态结束研究。')]:box(x,y,825,375,title,body,n=31)
txt(55,1110,'发送中：显示处理状态并阻止重复提交；失败保留输入，证据不足保留缺口。',26,'muted');save('03_失败与不足.png')
canvas('C方案细化  窄屏对话与证据切换','390px视口布局意向  ·  本图不是响应式运行测试  ·  点击引用切到证据，返回时保留草稿与位置',1800,1250)
for x,title in [(190,'对话页签'),(1050,'证据页签')]:
 dr.rounded_rectangle((x,190,x+520,1100),radius=35,fill=C['white'],outline=C['line'],width=4)
 txt(x+28,220,title,30);box(x+22,290,476,110,'模拟数据 / 美国宠物饮水机','[范围详情]  [研究步骤]',n=23)
 pill(x+22,425,220,'对话','blue' if x==190 else 'muted');pill(x+260,425,230,'证据','blue' if x==1050 else 'muted')
 if x==190:
  box(x+22,500,476,250,'助手  示例解释','这条评论提到清洗困难。\n不外推为市场结论。\n\n[查看评论 r001 →]',fill='soft',n=25)
  box(x+22,820,476,110,'继续追问……',n=24);pill(x+22,960,180,'发送')
 else:
  box(x+22,500,476,120,'评论 r001 / p01','2星 / 2026-06-30',n=24)
  box(x+22,650,476,230,'模拟原文',review['review_text'],n=25)
  pill(x+22,920,260,'返回引用');txt(x+28,1000,'[修正标签]',24,'blue')
arrow([(735,620),(1010,620)],'点击引用');txt(55,1160,'无引用时显示选择提示；页签切换保留消息、未发送草稿和当前选中评论。',25,'muted');save('04_窄屏切换.png')
# document
D=Document();s=D.sections[0];s.page_width=Cm(21);s.page_height=Cm(29.7);s.top_margin=Cm(1.7);s.bottom_margin=Cm(1.6);s.left_margin=Cm(2);s.right_margin=Cm(2)
for st in D.styles:
 if st.type==1:
  st.font.name='Hiragino Sans GB';st._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'Hiragino Sans GB')
  pp=st.element.find(qn('w:pPr'))
  if pp is not None:
   for el in list(pp):
    if el.tag==qn('w:pBdr'):pp.remove(el)
D.styles['Normal'].font.size=Pt(10.5);D.styles['Normal'].paragraph_format.line_spacing=1.2
D.styles['Normal'].paragraph_format.space_after=Pt(8)
D.styles['Title'].font.size=Pt(22);D.styles['Title'].font.color.rgb=RGBColor(0,0,0)
D.styles['Heading 1'].font.size=Pt(16);D.styles['Heading 1'].font.color.rgb=RGBColor(0,0,0)
def p(t):D.add_paragraph(t)
def h(t):D.add_heading(t,1)
def pic(n):
 pp=D.add_paragraph();pp.alignment=1;pp.add_run().add_picture(str(F/n),width=Cm(16.8))
def page():D.add_page_break()
D.add_paragraph('Mercata Lens C方案交互细化','Title');p('对话与证据双栏  核心状态与窄屏适配\n薛雅利  智能交互设计  2026年11月2日')
h('一 桌面对话与引用核验');p('用户已同意沿C方向继续细化。本轮将双栏方案展开为核心交互与异常状态，仍属于设计稿，未修改应用代码、未接入模型或开展用户测试。配图的助手回答为静态示例，r001原文来自现有模拟CSV，不是真实消费者评论。');pic('01_桌面对话核验.png');p('导航、任务对话和证据区共同构成桌面布局。点击回答中的引用后，证据区显示相同ID的原文、商品、星级、日期与来源。引用没有通过校验时不展示候选回答。通过键盘触发后可进入证据区，并返回原引用。');p('用户看到研究来源与当前范围；统计从程序读取，模型解释不改变原文、分母和规则版本。对话页不是独立于研究数据的通用聊天窗口。')
page();h('二 标签纠错与解释失效');pic('02_纠错与失效.png');p('原有规则模块保留人工纠错能力，新增对话解释需要随数据版本更新。修改原因必填，无改动或空原因不能提交。用户可取消修改；切换评论时不能无提示丢弃未保存编辑。');p('应用后先重算，再使受影响的旧解释失效。用户可要求重新解释，新请求必须绑定新的数据与规则版本。旧请求即使较晚返回也不得覆盖当前研究结果。');p('纠错仅在当前会话保留，刷新会丢失。此限制应明确呈现，不能把当前内存状态表述为长期保存。')
page();h('三 模型不可用  请求失败与证据不足');pic('03_失败与不足.png');p('四类状态分别对应未配置、调用失败、引用不通过与信息不足。它们的原因和下一步不同，不能共用一个含糊的“出错了”。发送中阻止重复提交，失败保留输入与研究数据。');p('模型未配置时发送不可用，但规则分析仍可操作。证据不足是允许的研究结果：展示缺失项、补充入口与验证事项，而不是反复重试直到生成确定结论。');p('重算失败时阻止使用旧结果继续分析；无效引用拦截候选答案。密钥、堆栈和内部调试信息不进入用户文案。')
page();h('四 窄屏引用与返回');pic('04_窄屏切换.png');p('拟在可读宽度不足时切换为“对话／证据”页签，暂以1024px作为实现时待验证的切换起点。图示390px仅说明结构，不代表已通过响应式测试。');p('点击引用自动切到证据页签并定位原文；返回引用后恢复消息位置。切换页签保留草稿、选中评论与阶段。没有选择引用时给出选择提示。输入框不遮挡正文或失败反馈。');p('后续至少核验390、900、1440px三个视口，并检查键盘焦点、文字换行、横向溢出及状态反馈。')
page();h('五 开发交付与验收对应');p('本轮交付桌面正常态、纠错失效态、失败与不足、窄屏页签四组设计图，并形成独立交互规格。流程沿用上轮六状态与异常回退图。当前完成的是设计材料，不作为功能或课程验收已通过的证据。')
t=D.add_table(rows=1,cols=3);t.style='Table Grid'
for c,v in zip(t.rows[0].cells,['验收点','需检查的行为','当前状态']):c.text=v
for row in [('引用一致','回答引用打开当前研究的同一评论','设计已描述 未执行'),('纠错闭环','原因必填 重算后旧解释失效','设计已描述 未执行'),('请求顺序','旧版本响应不能覆盖新研究','拟实现 未执行'),('失败恢复','保留输入 可重试且无重复提交','设计已描述 未执行'),('窄屏可用','页签保留状态 引用与返回位置正确','设计已描述 未执行'),('模型三轮','真实调用 上下文与证据一致','等待模型接入条件')]:
 for c,v in zip(t.add_row().cells,row):c.text=v
h('下一步');p('在此规格基础上编写具体实施任务，先落实会话、数据版本和证据校验契约，再连接前端与模型。模型服务商、费用及真实调用仍待确认；暂不发起付费调用或上传用户数据。');p('完整规格见同项目docs/superpowers/specs/2026-11-02-c-dialogue-evidence-interaction.md。来源为现有调研与证据映射、前轮方案比较、AGENTS.md及模拟样本public/demo/reviews.csv。')
ft=s.footer.paragraphs[0];ft.alignment=2;ft.add_run('Mercata Lens C方案交互细化  ·  ');field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');ft._p.append(field)
D.core_properties.title='Mercata Lens C方案交互细化';D.core_properties.author='薛雅利';D.save(O/'Mercata-Lens_C方案交互细化.docx');print('created 4 figures and DOCX')
