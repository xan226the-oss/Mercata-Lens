#!/usr/bin/env python3
# 生成 40 条独立评论样本 + AI 初标（2026-11-20）
# 覆盖：主题清晰负面15 / 主题清晰正面9 / 多主题混合6 / 目录未覆盖4 / 反向表述防误标2 / 补充主题4
import csv, json

with open('public/demo/products.csv') as f:
    products = list(csv.DictReader(f))
pids = [p['product_id'] for p in products]

# (评论原文, 星级, [主题|情感|逐字证据|判定说明])
pool = [
    # 主题清晰·负面（15）
    ("Hard water spots build up on the bowl within two days and I wipe it constantly.", 3,
     ['积污残留|负面|Hard water spots build up on the bowl within two days|水垢两日即积聚，积污残留负面']),
    ("Taking it apart for a deep clean is a two-person job. The pump housing will not budge.", 2,
     ['拆装便利性|负面|The pump housing will not budge|水泵壳难拆，拆装便利负面']),
    ("The pump quit after five weeks. Just past the return window, of course.", 1,
     ['水泵寿命|负面|The pump quit after five weeks|五周水泵损坏，寿命负面']),
    ("It gurgles and rattles at 2am and I cannot sleep with it running in the room.", 2,
     ['振动与异响|负面|It gurgles and rattles at 2am|夜间咕噜声与共振，异响负面']),
    ("My senior cat refuses to go anywhere near it. Total waste for us.", 1,
     ['宠物接受度|负面|My senior cat refuses to go anywhere near it|老猫拒绝靠近，接受度负面']),
    ("Water seeps from the base seam onto my hardwood every single day.", 1,
     ['密封防漏|负面|Water seeps from the base seam|底座接缝日日渗水，防漏负面']),
    ("Replacement filters cost more than I expected and I am buying them monthly.", 3,
     ['滤芯支出|负面|I am buying them monthly|滤芯月月购买，支出负面']),
    ("The reservoir is tiny; I am refilling it every morning before work.", 2,
     ['储水容量|负面|The reservoir is tiny|容量小需每日加水，容量负面',
      '补水频率|负面|refilling it every morning|每晨补水，频率负面']),
    ("Slimy film coats the tube inside and I have to pull the whole thing apart to reach it.", 2,
     ['内部结构与可达性|负面|pull the whole thing apart to reach it|管内生物膜需整机拆解，可达性负面',
      '积污残留|负面|Slimy film coats the tube inside|管内生物膜积聚，残留负面']),
    ("There is a musty smell after a week even with fresh filters.", 2,
     ['气味表现|负面|a musty smell after a week|换芯后仍有霉味，气味负面']),
    ("It hums louder than my old fountain. I keep it in the hallway now.", 3,
     ['运行噪声|负面|It hums louder than my old fountain|比旧机更响被迫移位，噪声负面']),
    ("The filter slot is so tight that seating a new cartridge takes real force.", 2,
     ['外形与开口设计|负面|filter slot is so tight|滤芯槽过紧，设计负面']),
    ("The pump cuts out randomly and I have to tap it to restart.", 2,
     ['水泵运行稳定性|负面|The pump cuts out randomly|水泵随机停转需拍打重启，稳定性负面']),
    ("Finding this exact filter size locally is impossible; everything is online only.", 3,
     ['滤芯购买便利性|负面|impossible; everything is online only|本地无从购买，便利负面']),
    ("Opening the lid to refill means detaching the cord each time. Annoying design.", 3,
     ['外形与开口设计|负面|detaching the cord each time|加水需先拔线，设计负面']),
    # 主题清晰·正面（9）
    ("Cleanup is genuinely quick - one rinse and a wipe and it is done.", 5,
     ['清洗便利性|正面|one rinse and a wipe and it is done|一冲一擦即净，便利正面']),
    ("Whisper quiet. I only hear a faint trickle if the room is silent.", 5,
     ['运行噪声|正面|Whisper quiet|近乎无声，噪声正面']),
    ("Both of my cats took to it within an hour, even the picky one.", 5,
     ['宠物接受度|正面|took to it within an hour|挑剔的猫一小时内接受，接受度正面']),
    ("Three weeks in and zero leaks. The seal is solid.", 4,
     ['密封防漏|正面|zero leaks. The seal is solid|三周零渗漏，防漏正面']),
    ("The wide opening makes refilling from a pitcher completely mess-free.", 4,
     ['外形与开口设计|正面|wide opening makes refilling mess-free|宽口加水不洒，设计正面']),
    ("Going on month four with the original pump still running strong.", 5,
     ['水泵寿命|正面|month four with the original pump still running strong|原装泵四月强劲，寿命正面']),
    ("Filters last about six weeks here, better than my previous fountain.", 4,
     ['滤芯更换频率|正面|Filters last about six weeks|滤芯六周寿命优于旧机，频率正面']),
    ("A steady output with no stuttering, even when the water level drops.", 4,
     ['水泵运行稳定性|正面|steady output with no stuttering|低水位仍稳定出水，稳定性正面']),
    ("No film buildup inside after two weeks. Much better than our old plastic one.", 4,
     ['积污残留|正面|No film buildup inside after two weeks|两周无生物膜，残留正面']),
    # 多主题·混合情感（6）——同评论内分主题分情感
    ("Love how quiet it is, but cleaning the corners is a weekly fight.", 3,
     ['运行噪声|正面|Love how quiet it is|安静获好评，噪声正面',
      '清洗便利性|负面|cleaning the corners is a weekly fight|角落清理费劲，便利负面']),
    ("My oversized cat drinks from it happily, though it leaks a little underneath.", 3,
     ['宠物接受度|正面|drinks from it happily|大型猫正常饮用，接受度正面',
      '密封防漏|负面|it leaks a little underneath|底部轻微渗漏，防漏负面']),
    ("Pump is holding up well, but filters are pricey and hard to find in stores.", 3,
     ['水泵寿命|正面|Pump is holding up well|水泵耐用，寿命正面',
      '滤芯支出|负面|filters are pricey|滤芯偏贵，支出负面',
      '滤芯购买便利性|负面|hard to find in stores|门店难寻，便利负面']),
    ("Easy to refill thanks to the big opening, but it does hum at night.", 3,
     ['外形与开口设计|正面|Easy to refill thanks to the big opening|宽口易加水，设计正面',
      '运行噪声|负面|it does hum at night|夜间嗡鸣，噪声负面']),
    ("No leaks at all, yet my skittish cat still will not approach it.", 2,
     ['密封防漏|正面|No leaks at all|完全不漏，防漏正面',
      '宠物接受度|负面|my skittish cat still will not approach it|胆小猫仍不靠近，接受度负面']),
    ("Deep cleaning takes effort, but the pump has been flawless for months.", 4,
     ['清洗便利性|负面|Deep cleaning takes effort|深度清洁费力，便利负面',
      '水泵寿命|正面|the pump has been flawless for months|数月零故障，寿命正面']),
    # 目录未覆盖（4）——AI初标留空，考察"不硬塞标签"
    ("Shipping box arrived crushed but the fountain itself was fine.", 4, []),
    ("The app that pairs with it stopped syncing after an update.", 2, []),
    ("Customer service took ten days to reply to my email.", 2, []),
    ("It arrived with a EU plug adapter instead of a US one.", 3, []),
    # 反向表述防误标（2）——否定词+标签词
    ("Not hard to clean at all - the smooth bowl wipes clean in seconds.", 5,
     ['清洗便利性|正面|wipes clean in seconds|存在否定结构"not hard to clean"，实为正面；勿因短语误判负面']),
    ("Zero noise complaints from us; if anything it is too quiet to notice.", 5,
     ['运行噪声|正面|too quiet to notice|零投诉且安静到察觉不到；勿被 noise 词面误导为负面']),
    # 补充主题（4）——拉齐至40条
    ("The carbon dust from the new filter settled on the floor around it.", 2,
     ['滤芯包装收纳|负面|carbon dust from the new filter settled on the floor|滤芯碳尘散落，包装收纳负面']),
    ("The replacement impeller is cheap but the shipping fee doubles the cost.", 3,
     ['配件更换成本|负面|the shipping fee doubles the cost|运费使配件成本翻倍，成本负面']),
    ("Refilling daily is fine for me since I am home all day anyway.", 3,
     ['补水频率|中性|Refilling daily is fine for me|仅陈述每日补水且表示可接受，按弱正面处理需依据原文"fine"，此处中性',
      '储水容量|中性|Refilling daily|容量小导致每日补水的客观陈述，中性']),
    ("My kitten was startled by the first splash but plays with the stream now.", 4,
     ['宠物接受度|正面|plays with the stream now|起初受惊后现已主动玩水，接受度正面（分时间：初期负面已转变）']),
]
assert len(pool) == 40, f'总数={len(pool)}'

dates = [f'2026-10-{d:02d}' for d in range(1, 29)]
rows, records = [], []
for i, (text, rating, anns) in enumerate(pool):
    rid = f'r{77 + i:03d}'
    row = {
        'review_id': rid, 'product_id': pids[i % len(pids)], 'rating': rating,
        'review_text': text, 'review_date': dates[(i * 3) % len(dates)],
        'verified_purchase': 'true' if i % 4 != 3 else 'false',
        'source_url': f'https://example.com/independent/review/{rid}',
    }
    rows.append(row)
    annotations = []
    for a in anns:
        topic, senti, evidence, reason = a.split('|', 3)
        annotations.append({'topic': topic, 'sentiment': senti, 'evidence': evidence,
                            'reason': 'AI初标：' + reason + '。以原文为依据，不延伸未提供的事实。'})
    records.append({'reviewId': rid, 'text': text, 'source': 'Codex',
                    'userConfirmed': False, 'annotations': annotations})

with open('/tmp/independent-reviews.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['review_id', 'product_id', 'rating', 'review_text',
                                      'review_date', 'verified_purchase', 'source_url'])
    w.writeheader()
    w.writerows(rows)

with open('/tmp/independent-ai-labels.json', 'w') as f:
    json.dump({'revision': 'independent-2026-11-20-r1', 'records': records}, f, ensure_ascii=False, indent=1)

# 校验标签都在目录内
guide = {'清洗便利性', '积污残留', '拆装便利性', '内部结构与可达性', '外形与开口设计', '密封防漏',
         '补水频率', '储水容量', '水泵寿命', '水泵运行稳定性', '运行噪声', '振动与异响',
         '宠物接受度', '气味表现', '滤芯更换频率', '滤芯支出', '滤芯购买便利性', '滤芯包装收纳', '配件更换成本'}
used = set()
for r in records:
    for a in r['annotations']:
        used.add(a['topic'])
bad = used - guide
print('rows=40, 记录=40')
print('越界标签:', bad if bad else '无 ✓')
print('使用标签数:', len(used), '/ 目录19')
print('空标注(目录未覆盖):', sum(1 for r in records if not r['annotations']), '条')
print('含混合情感:', sum(1 for r in records if len({a['sentiment'] for a in r['annotations']}) > 1), '条')
