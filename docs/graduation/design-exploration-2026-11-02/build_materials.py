from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import math
O=Path(__file__).parent; F=O/'figures'; FONT='/System/Library/Fonts/Hiragino Sans GB.ttc'
C={'bg':'#F4F6F8','white':'#FFFFFF','ink':'#24313E','muted':'#687586','line':'#D8E0E6','blue':'#376D9E','soft':'#EAF1F7','green':'#2E7462','amber':'#9A6B1F','red':'#A4473D'}
def font(n):return ImageFont.truetype(FONT,n)
def canvas(title,sub,w=1800,h=1200):
 global im,dr
 im=Image.new('RGB',(w,h),C['bg']);dr=ImageDraw.Draw(im);txt(60,36,title,46);txt(60,108,sub,24,'muted');return im
def txt(x,y,t,n=27,col='ink'):
 dr.multiline_text((x,y),t,font=font(n),fill=C.get(col,col),spacing=12)
def wrap(t,n,width):
 ls=[];s=''
 for ch in t:
  if ch=='\n':ls.append(s);s='';continue
  if dr.textlength(s+ch,font=font(n))>width:ls.append(s);s=ch
  else:s+=ch
 ls.append(s);return '\n'.join(ls)
def box(x,y,w,h,title,body='',fill='white',n=27):
 dr.rounded_rectangle((x,y,x+w,y+h),radius=12,fill=C[fill],outline=C['line'],width=2);txt(x+22,y+17,title,n)
 if body:txt(x+22,y+64,wrap(body,23,w-44),23,'muted')
def pill(x,y,w,t,col='blue'):
 dr.rounded_rectangle((x,y,x+w,y+44),radius=8,fill=C['soft']);txt(x+14,y+7,t,21,col)
def arrow(points,label=None):
 dr.line(points,fill=C['blue'],width=4)
 a,b=points[-2:];ang=math.atan2(b[1]-a[1],b[0]-a[0]);tri=[b,(b[0]-17*math.cos(ang-.5),b[1]-17*math.sin(ang-.5)),(b[0]-17*math.cos(ang+.5),b[1]-17*math.sin(ang+.5))];dr.polygon(tri,fill=C['blue'])
 if label:txt(points[0][0]+15,points[0][1]+5,label,21,'blue')
def save(name):im.save(F/name)
# board
canvas('产品意向板  证据可见的研究助手','设计探索初稿  ·  2026年11月2日  ·  色彩为既有代码取值，感受与效果尚未做用户验证')
box(60,175,510,310,'01 任务气质','清晰、克制、便于抽查。\n助手组织材料，用户确认范围与判断。\n依据：P1访谈；映射M1、M3、M4。')
box(600,175,550,310,'02 信息层级','研究范围常驻 → 主题摘要 → 原文证据。\n观察、假设、待验证事项分层呈现。\n依据：映射M1、M2、M4、M8。')
box(1180,175,560,310,'03 角色与语气','像可核验的研究助理：解释依据、承认缺失、询问条件。\n不宣称“必然好卖”，不使用虚构真人身份。\n依据：P1访谈；映射M4、M8。')
colors=[('画布','bg'),('正文','ink'),('操作','blue'),('可用','green'),('待确认','amber'),('阻塞','red')]
for i,(name,k) in enumerate(colors):
 x=60+i*285;dr.rounded_rectangle((x,530,x+245,625),10,fill=C[k],outline=C['line'],width=2);txt(x,645,name+' '+C[k],22)
box(60,730,810,250,'04 形态与排版','浅色平面卡片、明确边界、4至8px圆角；正文优先可读。\n低饱和背景服务长时阅读，但舒适性仍待验证。\n红色只表示阻塞或需确认的风险，不自动作安全结论。')
box(900,730,840,250,'05 可核验的表达组件','[来源与范围]  [主题 + 证据入口]  [修改原因]\n统计来自程序；解释必须关联当前证据。\n修改后重算，数据变更后提示旧解释失效。')
txt(60,1040,'图像素材取向：评论卡片、范围条、证据连线、标注与修订；产品意向以真实任务构件为主。',25)
txt(60,1100,'依据层级：1份真人访谈为需求线索；模拟角色材料只作假设补充；视觉偏好不视为已验证。',23,'muted');save('01_产品意向板.png')
# sketch shared
for mode,title,sub in [('A','引导式对话','每轮只推进一个任务；证据按需展开'),('B','分析工作台','直接查看主题与比较；对话作为辅助入口'),('C','对话与证据双栏','一侧推进任务，一侧固定核验依据；建议进一步细化')]:
 canvas('方案'+mode+'  '+title,sub+'  ·  低保真概念草图，所有内容为示意，非运行截图',1800,1180)
 box(55,175,1690,75,'研究范围  美国 / 宠物饮水机 / 模拟样本 / 数量待程序读取',n=25)
 if mode=='A':
  box(55,280,295,750,'任务步骤','1 确认范围\n2 数据检查\n3 用户偏好\n4 核心风险\n5 可解决性\n6 验证事项')
  box(380,280,1040,750,'研究对话')
  box(420,370,940,130,'助手  请确认本次研究范围','可使用现有演示样本或导入本地CSV。',fill='soft')
  box(650,530,700,100,'用户  使用演示样本',n=25)
  box(420,660,940,160,'助手  数据检查后再进入分析','[查看范围]   [查看原文证据]   [继续下一步]',fill='soft')
  box(420,875,940,100,'输入问题或补充条件……',n=24)
  box(1450,280,295,750,'证据抽屉','点击引用后展开。\n\n优势：步骤清楚。\n\n注意：需要来回展开，\n不便持续对照。',n=25)
 elif mode=='B':
  box(55,280,270,750,'研究导航','数据质量\n类目概览\n评论痛点\n机会比较\n验证计划')
  box(355,280,1390,100,'当前分析  主题与样本口径','[筛选]  [查看规则]  [询问助手]',n=26)
  for i in range(3):box(355+i*470,410,450,190,['主题A','主题B','待核验风险'][i],'数量：待计算\n[查看证据]',n=26)
  box(355,630,850,350,'评论队列与证据','主题 → 命中评论 → 原文片段\n\n[修正标签]  [填写原因]  [重算]')
  box(1230,630,515,350,'辅助对话面板','询问当前结果、口径与限制。\n对话入口按需打开。',fill='soft')
 else:
  box(55,280,250,750,'任务状态','S1 范围\nS2 数据\nS3 偏好\nS4 风险\nS5 可解决性\nS6 判断')
  box(335,280,700,750,'对话与阶段结果')
  box(365,365,640,150,'用户  清洗方面有哪些问题？','使用当前研究，不切换分母。',fill='soft')
  box(365,550,640,200,'助手  待证据校验后展示','主题摘要 + 有效引用入口\n统计由程序读取，不预填数字。')
  pill(365,790,290,'打开引用 → 右侧证据')
  box(365,875,640,100,'继续追问或补充条件……',n=24)
  box(1065,280,680,750,'证据核验区')
  box(1095,365,620,150,'当前引用  待选择有效评论','商品 / 日期 / 星级 / 来源',fill='soft')
  box(1095,550,620,170,'完整原文与命中片段','原文保持不变，不由模型生成。')
  box(1095,750,620,210,'人工修正','[标签]  [原因]\n[应用并重算]  →  旧解释失效')
 txt(60,1080,{'A':'任务路径：逐轮确认 → 模型分析 → 点开证据 → 继续；需验证步骤成本和返回定位。','B':'任务路径：直接看主题 → 抽查原文 → 调整条件 → 按需追问；需验证流程完整性。','C':'任务路径：提出问题 → 生成候选 → 校验引用 → 同屏核验 → 追问或纠错；需验证窄屏切换。'}[mode],24,'muted');save('0'+str('ABC'.index(mode)+2)+'_方案'+mode+'.png')
# main flow
canvas('对话主流程  六状态与证据校验','方案C的进一步细化建议  ·  状态与页面不是一一对应  ·  未接入模型、未完成运行验证',1800,1830)
steps=[('S1 确认研究范围','输入：商品、市场、研究目的；用户确认后推进。'),('S2 检查有效数据','程序检查字段、重复、归属；阻塞则修正导入。'),('S3 识别用户偏好','模型候选 + 程序统计 + 有效评论引用。'),('S4 核验核心风险','分开呈现普通痛点、风险线索与不确定项。'),('S5 判断问题可解决性','结合产品参数、支持与反对证据；形成假设。'),('S6 输出条件性判断','继续研究 / 证据不足 / 暂缓 + 验证计划。')]
for i,(a,b) in enumerate(steps):
 y=200+i*220;box(290,y,1120,150,a,b,'white',32)
 if i<5:arrow([(850,y+150),(850,y+210)])
box(70,1550,1660,180,'跨状态规则','生成结果先经结构、引用归属和统计一致性校验，再进入界面。\n数据或标签变化使相关旧解释失效，重新计算并回到受影响状态。',fill='soft',n=31)
save('05_对话主流程.png')
# exceptions graphic
canvas('异常与回退  每个结果都有退出条件','与六状态主流程配套  ·  本图为设计方案，处理路径尚未编码',1800,1300)
items=[('缺范围 / 超出范围','追问缺失字段或说明边界','回S1确认'),('数据校验阻塞','保留原有效数据，修正导入','回S2重检'),('模型未配置 / 超时','提示不可用，保留输入与规则结果','重试或规则模式'),('引用无效 / 数量冲突','拦截候选，不展示未通过结论','校验后重生成'),('证据不足 / 观点矛盾','保留不确定性并列出缺口','补信息或带限制退出'),('用户纠错 / 更换数据','旧解释标失效，程序先重算','返回受影响状态')]
for i,(a,b,c) in enumerate(items):
 y=190+i*155;box(55,y,460,115,a,n=27);box(605,y,690,115,b,n=27);box(1390,y,355,115,c,n=25);arrow([(515,y+57),(590,y+57)]);arrow([(1295,y+57),(1375,y+57)])
txt(60,1170,'用户可暂停并保留待验证项；“证据不足”是允许的阶段结果，不以强行生成确定答案为成功。',26,'muted');save('06_异常回退.png')
# editable diagram
(O/'对话流程.mmd').write_text('''flowchart TD
 S1[确认范围] -->|用户确认| S2[程序检查数据]
 S2 -->|有效| S3[识别偏好候选]
 S3 --> V[结构 引用 统计校验]
 V -->|通过| S4[核验风险]
 S4 --> S5[可解决性假设]
 S5 --> S6[条件性判断与验证计划]
 S2 -->|阻塞| R[修正导入]
 R --> S2
 V -->|不通过| E[拦截与修正候选]
 E --> S3
 S5 -->|缺参数| Q[追问补充]
 Q --> S5
 S6 -->|数据或标签变更| I[旧解释失效并重算]
 I --> S2
''')
# report
D=Document();sec=D.sections[0];sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.top_margin=Cm(1.65);sec.bottom_margin=Cm(1.6);sec.left_margin=Cm(2);sec.right_margin=Cm(2)
for st in D.styles:
 if st.type==1:
  st.font.name='Hiragino Sans GB';st._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'Hiragino Sans GB')
  pp=st.element.find(qn('w:pPr'))
  if pp is not None:
   for e in list(pp):
    if e.tag==qn('w:pBdr'):pp.remove(e)
D.styles['Normal'].font.size=Pt(10.5);D.styles['Normal'].paragraph_format.line_spacing=1.2;D.styles['Normal'].paragraph_format.space_after=Pt(7)
D.styles['Title'].font.size=Pt(22);D.styles['Title'].font.color.rgb=RGBColor(0,0,0)
D.styles['Heading 1'].font.size=Pt(16);D.styles['Heading 1'].font.color.rgb=RGBColor(0,0,0)
def h(t):D.add_heading(t,1)
def p(t):D.add_paragraph(t)
def pic(n,w=16.8):
 pp=D.add_paragraph();pp.alignment=1;pp.add_run().add_picture(str(F/n),width=Cm(w))
def page():D.add_page_break()
D.add_paragraph('Mercata Lens 产品设计探索','Title');p('产品意向板  三方向概念草图  对话流程\n薛雅利  智能交互设计  2026年11月2日')
h('一 产品意向与依据')
p('本轮设计沿用现有“候选商品形成后的评论核验”定位，将原型中的范围条、评论、引用和人工纠错作为视觉与交互素材。老师意见据用户转述为“继续往下做”。以下为本次新增设计探索，未开展用户验证，也不是已实现的模型功能。')
pic('01_产品意向板.png')
p('意向板的需求依据主要来自P1访谈及证据映射M1至M5、M8。颜色取自现有styles.css：画布#F4F6F8、正文#24313E、操作#376D9E；卡片、状态色和角色语气为设计建议。没有证据证明用户偏爱该配色，也不把长时阅读舒适度写成已验证效果。')
p('接下来用相同研究范围、相同问题与相同证据要求比较三种布局，避免把颜色变化误当作交互方案差异。')
for mode,name,img,adv,lim,task in [
 ('A','引导式对话','02_方案A.png','每轮任务与退出条件明确，适合对研究流程不熟悉的用户。','原文需要频繁展开；多主题比较与返回定位可能增加操作。','检查能否在三轮对话内找到同一主题的原文、解释口径并提出验证事项。'),
 ('B','分析工作台','03_方案B.png','延续当前工作台，主题、范围与比较信息可以快速浏览。','用户可能跳过范围与数据检查；模型入口容易弱化为附属聊天。','检查用户能否直接抽查主题、理解范围，并在必要时调用助手而不遗漏步骤。'),
 ('C','对话与证据双栏','04_方案C.png','把追问与原文核验放在同一任务环境中，契合“抽查不了就没有区别”的线索。','需要处理两栏选中关系、失效状态与窄屏切换，不能堆满所有信息。','检查用户能否从回答打开原文、修正标签、理解重算后旧解释失效。')]:
 page();h('二 概念方案'+mode+' '+name);p('此页为本次新增低保真草图，不是运行截图。示意内容不预填分析数量、模型回答或业务结果。');pic(img);p('预期优势：'+adv);p('主要代价：'+lim);p('待验证任务：'+task)
 if mode=='C':p('建议以C作为后续细化候选：保留B的工作台导航，并吸收A的阶段提示。本建议来自任务与现有原型的匹配分析，尚未经过用户选择或效果验证。窄屏建议使用“对话／证据”页签，并保留当前引用与返回位置；尚未绘制窄屏稿。')
page();h('三 对话主流程');p('以下在方案C上作可审阅的细化建议。六状态沿用开题设计，不把六个页面等同于Agent状态。完整处理应先检查数据，再分析、核验，最终形成带限制的判断。');pic('05_对话主流程.png',14.8);p('用户可返回补充、纠错或暂停。S3至S6各阶段的模型候选均需先校验再显示；主图中的校验规则适用于所有生成阶段。状态退出条件详见既有对话流程与验收清单。')
page();h('四 异常回退与界面状态');p('失败或不确定状态须有明确后续动作。模型不可用时保留规则工作台，但不得用静态示例冒充模型响应；用户评论是待分析数据，不作为系统指令执行。');pic('06_异常回退.png');p('正常路径需要输入、发送中、回答完成、引用选中、纠错与重算反馈。异常路径还需空输入、无有效样本、调用失败、引用无效与旧结果失效。图中路径需在后续设计稿、接口及测试中逐一对应。');p('重试保留输入，避免重复提交；更换数据后应清除或标识旧上下文，不能引用前一研究的评论。模型密钥、原始日志与其他实现细节不进入面向用户的界面。')
page();h('五 方案比较与下一步')
t=D.add_table(rows=1,cols=4);t.style='Table Grid'
for c,v in zip(t.rows[0].cells,['维度','A 引导式对话','B 分析工作台','C 对话与证据双栏']):c.text=v
for row in [('任务推进','逐轮引导','用户自主浏览','阶段提示与追问并行'),('证据核验','按需抽屉','主题与队列直接查看','回答与证据保持关联'),('主要风险','步骤成本与反复展开','跳步或模型入口边缘化','密度与窄屏关系复杂'),('复用现有原型','需重组入口','较直接','复用导航与证据模块'),('当前建议','保留其阶段提示','保留其分析模块','建议进一步细化 待审阅')]:
 for c,v in zip(t.add_row().cells,row):c.text=v
p('比较为设计判断，不设未经测试的分数，不声称C比其他方案提高效率。选择C的理由是它能直接回应同一任务下的追问、原文抽查与纠错需求，同时复用现有工程；它的实际可用性仍需任务测试。')
h('设计推导对应')
p('M1证据追溯→结论旁引用入口与固定证据区；M2口径透明→常驻研究范围；M3分层→先主题后详情；M4洞察分级→区分观察、假设与验证；M5人工纠错→修改原因及重算；M8验证任务→条件性输出与待验证清单。模拟角色材料仅作假设补充。')
h('后续需要完成')
p('先审阅三种交互方向，再将选定方案展开为核心页面与异常状态设计稿。完善模型选型、接口和实现计划后开展开发；真实模型调用、至少三轮对话、注释率与用户效果另行验收。本轮没有修改应用代码，也没有开展模型或用户测试。')
h('材料来源')
p('毕设/调研：P1访谈、调研摘要、证据—痛点—机会点—功能映射、用户画像与旅程。关联工程：src/app/styles.css、六步路由、11月2日对话流程与验收清单。配图均为本轮绘制的设计示意，不使用既有截图冒充新方案实现。')
ft=sec.footer.paragraphs[0];ft.alignment=2;ft.add_run('Mercata Lens 设计探索  ·  ');f=OxmlElement('w:fldSimple');f.set(qn('w:instr'),'PAGE');ft._p.append(f)
D.core_properties.title='Mercata Lens 产品意向与三方案设计探索';D.core_properties.author='薛雅利';D.save(O/'Mercata-Lens_产品意向与三方案设计探索.docx')
print('created 6 PNG figures, Mermaid source, DOCX')
