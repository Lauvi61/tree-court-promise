"""逐课审阅后的内容覆盖层；旧发布器重建时也保留已经核过的讲解。"""
import copy


def example(question, answer, steps):
    return dict(question=question, answer=answer, steps=[dict(label=a, text=b) for a, b in steps], origin='reviewed_video_math_rewritten_explanation')


def check(cid, stage, question, choices, answer, explanation):
    return dict(id=cid, stage=stage, type='choice', question=question, choices=choices, answer=answer, explanation=explanation)


FLOOR_TEXT = [
    ('先在数轴上认清方向', 'floor(x) 表示不超过 x 的最大整数。它向数轴左侧找整数，不是删掉小数：floor(1.2)=1，floor(6)=6，floor(-0.32)=-1。整数 k≤x<k+1 时 floor(x)=k，所以阶梯每段左闭右开。负数也遵守同一定义。'),
    ('两条工具结论及其理由', '写 x=floor(x)+r，其中 0≤r<1，则 x-1<floor(x)≤x<floor(x)+1。若 m 是整数，x+m 的小数部分仍为 r，故 floor(x+m)=floor(x)+m；m 不是整数时不可照搬。例如 floor(0.6+0.6)=1，但 floor(0.6)+floor(0.6)=0。'),
    ('从图像区分两个函数', 'floor(x) 在实数轴上单调不减，无界、非奇非偶，也不周期；小数部分 {x}=x-floor(x) 满足 0≤{x}<1，以 1 为周期，在每段 [k,k+1) 内递增，但在整数处回到 0，整体并不单调。负数的小数部分也非负，例如 {-1.6}=0.4。'),
    ('先解误差，再取整数门槛', '要让所有正整数 n>N 都满足 1/n<ε，先解得 n>1/ε。若 N 允许为非负整数，floor(1/ε) 已足够，因为 n≥floor(1/ε)+1>1/ε；若题目要求 N 是正整数，统一使用 floor(1/ε)+1，或更紧的 max(1,floor(1/ε))。门槛不唯一，不必求最小。'),
    ('适用条件与易错边界', 'ε 是任意正实数，不能默认 ε<1。ε=2 时 floor(1/ε)=0，虽然能保证后续误差，却不满足 N∈正整数的要求。还要分清 n>N 与 n≥N：ε=1/5 时，N=5 在前一种条件下可行，在后一种条件下 n=5 的误差恰好等于 ε，严格小于便失败。'),
]

FUNCTION_TEXT = [
    ('先观察，再说清研究对象', 'sin(x)/x 在 0 没有定义，但附近的函数值趋近 1。这个观察引出极限问题，并不是用几个小数证明极限。再看 f(x)=x（x≠0）、f(0)=1：当 x→0 时研究去心邻域内的值，故极限为 0，而点值是 1。极限与点值分开判断。'),
    ('把 ε 与 δ 分工说清', '设函数在 a 的某去心邻域有定义。lim(x→a)f(x)=L 的含义是：对每个 ε>0，存在 δ>0，使所有满足 0<|x-a|<δ 的 x 都有 |f(x)-L|<ε。ε 是输出误差要求；δ 是据此选择的输入范围。δ 是正实数，可依赖 ε 与固定的 a、函数，却不能随正在验证的 x 改动。'),
    ('证明分探索稿与正式稿', '探索时从 |f(x)-L|<ε 倒推足够条件；正式证明先给定任意 ε>0，明确选取 δ，再对所有 0<|x-a|<δ 的 x 正向验证误差。可以约分或放缩，但每次都保留成立条件。并非每道题都能机械化成常数乘 |x-a|；需要局部界时必须额外限制 δ。'),
    ('从线性到平方的三个台阶', '先做 2x-1 在 1 处：误差是 2|x-1|，取 δ=ε/2。再做 (x²-1)/(x-1) 在 1 处：去心条件保证可约分，误差为 |x-1|，取 δ=ε。最后做 x² 在 2 处：先约束 |x-2|<1，得 |x+2|<5，故取 δ=min(1,ε/5)，两个限制必须同时保留。'),
    ('左右极限及不存在的原因', 'x→a⁻ 取左侧表达式，x→a⁺ 取右侧表达式；双侧有限极限存在，当且仅当左右有限极限都存在且相等。分段函数 x<0 时为 x-1、x>0 时为 x+1，则左右极限分别为 -1、1，修改 f(0) 也不能补救。1/x 在 0 无有限极限，sin(1/x) 也无极限，但 x·sin(1/x) 可由 |x·sin(1/x)|≤|x| 证明趋零；振荡并不自动意味着不收敛。'),
    ('无穷远处换一种范围控制', '本课用 x→∞ 表示 |x|→∞，须同时核对正、负无穷方向；arctan(x) 两端分别趋于 π/2 与 -π/2，不能合成同一个极限。证明 1/x→0 可取 X=1/ε，使 |x|>X 时 1/|x|<ε。X 是正实数，不需要取整。根式差 √(x+2)-√(x-2) 在正无穷处，先有理化再估计为不超过 4/√x；取 X=max(2,16/ε²) 兼顾定义域与误差。'),
    ('适用条件与易错边界', '极限不要求取到目标点；连续性另需点值等于极限。直接代入要有连续性等依据；0/0 不是数值答案。平方例题中的局部限制不能丢，ε 可任意大。分段题按趋近方向选表达式，双侧结论不能只看一侧。'),
]

FLOOR_EX = example('设 ε>0，n、N 为正整数。选取 N，使 n>N 时必有 1/n<ε。', '可取 N=floor(1/ε)+1（不唯一）。', [
    ('解出实数门槛', 'n>0，故 1/n<ε 等价于 n>1/ε。'),
    ('利用取整夹住门槛', '由 t<floor(t)+1，令 t=1/ε，可取 N=floor(1/ε)+1>1/ε，且 N≥1。'),
    ('正向检查全部尾项', '任意正整数 n>N，都有 n>N>1/ε，因此 1/n<ε。ε=0.03 时可取 N=34；N=33 也可行，因为整数 n>33 至少是 34。'),
])
FUNCTION_EX = example('用 ε–δ 定义证明 lim(x→2)x²=4。', '任意 ε>0，取 δ=min(1,ε/5)>0，即可证明极限为 4。', [
    ('先控制另一因子', '当 |x-2|<1 时，1<x<3，故 |x+2|<5。'),
    ('再控制目标误差', '|x²-4|=|x+2|·|x-2|<5|x-2|。要小于 ε，充分条件是 |x-2|<ε/5。'),
    ('合并限制并验证', '给定任意 ε>0，取 δ=min(1,ε/5)。若 0<|x-2|<δ，则同时满足上述两限制，故 |x²-4|<5|x-2|<ε，证毕。'),
])


def apply_reviewed(points, *, only=None):
    """仅覆盖已审阅的稳定知识点 ID，不改变章节、人物资料或用户事件。"""
    by={p['id']:p for p in points}
    plans = {
      'calculus-upper-floor': dict(text=FLOOR_TEXT, ex=FLOOR_EX, minutes=25, bvid='BV1TptPeQEsW',
        summary='取整向下，不等式保留端点；选门槛前先核对 N 的整数类型与 n>N 的严格性。',
        board='floor(x)≤x<floor(x)+1\nfloor(x+m)=floor(x)+m（m∈Z）\nN=floor(1/ε)+1∈正整数；n>N ⇒ 1/n<ε',
        stages=[
          ('辨清取整', '先别急着背极限证明。负零点三二取整是多少？如果你答零，删掉小数的习惯已经代替定义了。在数轴上向左找不超过它的最大整数，再用夹逼不等式检查。数学不接受“看起来差不多”。'),
          ('找门槛并验算', '现在才选门槛。先把误差要求解成 n 大于一除以 ε，再决定 N 取哪个整数。注意题面写的是正整数。ε 等于二时，单写取整会得到零；这个小条件足以否决一份自以为完整的证明。'),
          ('换条件独立检验', '把一除以 n 换成一除以 n 平方，先解 n 的范围，再选正整数 N。答案可以不唯一，但每个条件都得过关。最后再检查严格大于若换成大于等于，原来的端点还能不能保留。'),
        ],
        sides={
          'hyacine':'我们把两件事分开检查，好吗？先看误差是否够小，再看门槛是否符合正整数要求。ε 等于二时，零确实能挡住不合格的尾项，可题目还要求 N 至少为一。补上这一步，你的思路就完整了。',
          'castor':'请看端点。n 大于 N，下一项是 N 加一；n 大于等于 N，则必须检查 N 本身。',
          'phainon':'我刚想把负零点三二的小数削掉，结果走反方向了。再来：向左先遇到负一！门槛也一样，选完不能就走，得让下一位整数同学试着跨过去。',
        },
        checks=[
          check('guided-negative',0,'白厄把 floor(-0.32) 写成 0。哪条推理能修正它？',['删去小数，所以仍是 0','-1≤-0.32<0，故取 -1','四舍五入得到 0'],1,'floor 要不超过原数。0>-0.32 不合格；-1 是合格整数中最大的一个。'),
          check('guided-integer-shift',0,'若要把 floor(x+m) 拆成 floor(x)+m，必须保留哪个条件？',['x 必须为正数','m 可以是任意实数','m 必须是整数'],2,'整数平移不改变小数部分；例如 m=x=0.6 时随意拆分会得到 0，而原式为 1。'),
          check('guided-positive-N',1,'ε=2，N 必须为正整数。N=floor(1/ε) 的问题出在哪里？',['N=0，不满足正整数要求','N 太大，所有尾项都不能使用','取整函数不能处理正数'],0,'误差条件与 N 的类型是两项独立要求。可改取 floor(1/ε)+1=1。'),
          check('guided-strict-endpoint',1,'ε=1/5，若条件改为 n≥N，N=5 是否能保证 1/n<ε？',['能，因 1/5=ε','不能，n=5 时只有等号','不能，因为 N 必须为偶数'],1,'严格误差要求不能接受等号；可取 N=6。'),
          check('guided-square-threshold',2,'若要求 1/n²<ε，且 n、N 均为正整数，哪种选取对所有 ε>0 都稳妥？',['N=floor(1/ε)','N=floor(1/√ε)+1','N=ε'],1,'正数范围内，1/n²<ε 等价于 n>1/√ε，再取整加一即可兼顾正整数要求。'),
        ],
        extra=[example('求 floor(-1.6) 与 {-1.6}。','-2 与 0.4。',[('夹住原数','-2≤-1.6<-1。'),('向下取整','floor(-1.6)=-2。'),('求小数部分','{-1.6}=-1.6-(-2)=0.4。')])]),
      'calculus-upper-function-limit': dict(text=FUNCTION_TEXT, ex=FUNCTION_EX, minutes=45, bvid='BV1xhmnYFEir',
        summary='极限控制全部去心邻域值；定义证明先选范围再验误差，双侧极限须两侧存在且相等。',
        board='∀ε>0，∃δ>0：0<|x-a|<δ ⇒ |f(x)-L|<ε\nδ=min(1,ε/5)：同时保留局部界与误差界\n双侧有限极限存在 ⇔ 左右有限极限存在且相等',
        stages=[
          ('邻近值与点值', '把零点的函数值改成一，附近仍是 y 等于 x，那极限该跟谁走？先看去心条件，别让一个点替整片邻域作证。接下来，把 ε 当作输出误差要求，再找能控制所有邻近输入的 δ。量词顺序不许颠倒。'),
          ('从误差倒推到证明', '线性题能直接解出 δ，平方题就多了一项 x 加二。不能把它当常数抹掉。先限制 x 在一到三之间，再把误差估成五倍的输入距离。现在你告诉我：选 δ 时，刚才亲手加的范围限制还算不算数？'),
          ('左右检验与迁移', '遐蝶已经把左右表达式分别标好了。请你各算一次，再决定能否合并。一个点值不能修复两个不同的趋近结果。做完后，展开无穷远例题：方向变了，误差要求没有变，控制输入的方式却必须跟着变。'),
        ],
        sides={
          'hyacine':'先别把整段定义一次吞下。你先给一个误差要求，我再帮你圈出输入范围。平方例题要同时照顾两件事：靠近二，好让另一因子小于五；还要足够靠近，好让最终误差小于 ε。所以选两种半径里较小的那个。',
          'castor':'请分开写。左边用 x 减一，右边用 x 加一。结果不同，双侧极限不存在。零点取什么，不改变它。',
          'phainon':'我刚算出 δ 等于 ε 除以五，差点就收笔了。老师一把 ε 换成五百，范围立刻跑远！这次我先把“距离小于一”圈住，再跟误差条件取较小值。你来检查我的两道条件都还在不在。',
        },
        checks=[
          check('guided-punctured',0,'f(x)=x（x≠0），f(0)=1。x→0 时，哪条观察与极限定义一致？',['只看 f(0)，极限是 1','去心邻域里 f(x)=x，极限是 0','只要点值变了，极限就不存在'],1,'0<|x| 排除了 x=0，邻近函数值仍趋于 0。点值是否等于它，是下一步连续性的问题。'),
          check('guided-quantifiers',0,'要保证所有足够靠近 a 的输入都合格，应该怎样安排 ε 和 δ？',['先给任意 ε>0，再选一个 δ>0 控制该范围内所有 x','每遇到一个 x 就重选 δ，使它合格','只固定 ε=0.01 检查一次'],0,'同一个 δ 必须控制该去心邻域中的全部 x，且对每个 ε 都能如此选取。'),
          check('guided-local-bound',1,'证明 x² 在 2 处趋于 4：得到 |x+2|<5 的前提是什么？',['x 可以是任意实数','先有 |x-2|<1，所以 1<x<3','先假设已经知道极限等于 4'],1,'放缩中的局部界来自输入范围，不能脱离范围使用。'),
          check('guided-delta-min',1,'要同时保证 |x-2|<1 与 |x-2|<ε/5，δ 应怎样选？',['δ=max(1,ε/5)','δ=ε/5，对任意 ε 都不必再检查','δ=min(1,ε/5)'],2,'取较小值能同时满足两项上限。单用 ε/5，当 ε 很大时不能保证此前使用的局部界。'),
          check('guided-two-sides',2,'f(x)=x-1（x<0）、x+1（x>0）。哪份结论有完整依据？',['右极限为 1，所以双侧极限为 1','左右极限为 -1 和 1，不相等，所以双侧不存在','把 f(0) 改成 0，就能使双侧存在'],1,'左右各自存在并不足够，还必须相等。修改单个点值不改变邻域里的两段表达式。'),
          check('guided-infinity-domain',2,'对 √(x+2)-√(x-2) 在 +∞ 处的定义证明，X=max(2,16/ε²) 同时照顾什么？',['实数定义域和 4/√x<ε 的要求','把两个无穷大的差直接当作零','让 x 同时趋于正、负无穷'],0,'x>X 保证 x>2，并使 4/√x<ε。有理化和正项估计是在这个范围上成立的。'),
        ],
        extra=[
          example('用定义证明 lim(x→1)(2x-1)=1。','δ=ε/2 可行。',[('写目标误差','|(2x-1)-1|=2|x-1|。'),('选择半径','给定任意 ε>0，取 δ=ε/2。'),('正向验证','0<|x-1|<δ ⇒ 2|x-1|<2δ=ε。')]),
          example('用定义证明 lim(x→1)(x²-1)/(x-1)=2。','δ=ε 可行；原式在 1 无定义不妨碍极限。',[('先用去心条件','x≠1，可约去 x-1，原式等于 x+1。'),('计算误差','|(x+1)-2|=|x-1|。'),('选取并验证','任意 ε>0，取 δ=ε，则 0<|x-1|<δ 时误差小于 ε。')]),
          example('f(x)=x-1（x<0）、0（x=0）、x+1（x>0）。求 x→0 的极限。','双侧极限不存在。',[('左侧','x→0⁻ 使用 x-1，极限为 -1。'),('右侧','x→0⁺ 使用 x+1，极限为 1。'),('比较后作结论','-1≠1，故双侧极限不存在，与 f(0)=0 无关。')]),
          example('用定义证明 lim(|x|→∞)1/x=0。','可取 X=1/ε>0。',[('化为距离','|1/x-0|=1/|x|。'),('解出范围','要求 1/|x|<ε，只需 |x|>1/ε。'),('验证两端','任意 ε>0，取 X=1/ε；|x|>X 时误差小于 ε，正、负两端均成立。')]),
          example('用定义证明 lim(x→+∞)[√(x+2)-√(x-2)]=0。','取 X=max(2,16/ε²)，极限为 0。',[('先保证定义域并有理化','x>2 时，根式差为 4/[√(x+2)+√(x-2)]。'),('用简单上界控制误差','分母大于 √x，所以 0<根式差<4/√x。'),('保留定义域与误差两项限制','任意 ε>0，取 X=max(2,16/ε²)。x>X 时 x>2 且 4/√x<ε，故误差小于 ε。')]),
        ]),
    }
    from calculus_reviewed_sequence import plan as sequence_plan
    plans['calculus-upper-sequence-limit']=sequence_plan(example,check)
    from calculus_reviewed_inverse import plan as inverse_plan
    plans['calculus-upper-inverse-trig']=inverse_plan(example,check)
    from calculus_reviewed_infinitesimal import plan as infinitesimal_plan
    plans['calculus-upper-infinitesimal']=infinitesimal_plan(example,check)
    from calculus_reviewed_squeeze import plan as squeeze_plan
    plans['calculus-upper-squeeze']=squeeze_plan(example,check)
    from calculus_reviewed_limit_methods import plan as methods_plan
    plans['calculus-upper-limit-methods']=methods_plan(example,check)
    from calculus_reviewed_continuity import plan as continuity_plan
    plans['calculus-upper-continuity']=continuity_plan(example,check)
    from calculus_reviewed_derivative import plan as derivative_plan
    plans['calculus-upper-derivative-definition']=derivative_plan(example,check)
    from calculus_reviewed_mean_value import plan as mean_value_plan
    plans['calculus-upper-mean-value']=mean_value_plan(example,check)
    from calculus_reviewed_taylor import plan as taylor_plan
    plans['calculus-upper-taylor']=taylor_plan(example,check)
    from calculus_reviewed_taylor_applications import plan as taylor_applications_plan
    plans['calculus-upper-taylor-errors']=taylor_applications_plan(example,check)
    from calculus_reviewed_double_integral import plan as double_integral_plan
    plans['calculus-lower-double-integral']=double_integral_plan(example,check)
    if only is not None:
        unknown=set(only)-set(plans)
        if unknown:raise ValueError('未知审阅课时：'+','.join(sorted(unknown)))
        plans={pid:p for pid,p in plans.items() if pid in only}
    # 固定打散新增线索，避免玩家仅靠记住同一按钮位置作答。
    import hashlib
    for pid in ('calculus-upper-sequence-limit','calculus-upper-inverse-trig','calculus-upper-infinitesimal','calculus-upper-squeeze','calculus-upper-limit-methods','calculus-upper-continuity','calculus-upper-derivative-definition','calculus-upper-mean-value'):
        if pid not in plans:continue
        for q in plans[pid]['checks']:
            shift=hashlib.sha256(q['id'].encode()).digest()[0]%len(q['choices'])
            q['choices']=q['choices'][shift:]+q['choices'][:shift]
            q['answer']=(q['answer']-shift)%len(q['choices'])
    for pid in ('calculus-upper-taylor','calculus-upper-taylor-errors','calculus-lower-double-integral'):
        if pid not in plans:continue
        for q in plans[pid]['checks']:
            shift=hashlib.sha256(q['id'].encode()).digest()[0]%len(q['choices'])
            q['choices']=q['choices'][shift:]+q['choices'][:shift]
            q['answer']=(q['answer']-shift)%len(q['choices'])
    for pid, plan in plans.items():
        if pid not in by:
            raise ValueError('已审阅课时不存在：'+pid)
        p=by[pid];co=p['course'];co.update(version=2,estimated_minutes=plan['minutes'],textbook=[dict(heading=h,text=t) for h,t in plan['text']],board=plan['board'],worked_example=copy.deepcopy(plan['ex']),additional_examples=copy.deepcopy(plan['extra']))
        if plan.get('source_board_examples'):
            co['worked_example']['origin']='source_board_question_original_explanation'
            for ex in co['additional_examples'][:-1]:ex['origin']='source_board_question_original_explanation'
        for index,ex in enumerate([co['worked_example'],*co['additional_examples']]):
            if index in plan.get('source_example_indices',[]):ex['origin']='source_board_question_original_explanation'
        formulas=['|f(x)-L|<ε；选 δ 后正向验证']*len(co['additional_examples'])
        if pid.endswith('-function-limit'):
            formulas=['|(2x-1)-1|=2|x-1|；δ=ε/2','x≠1 ⇒ (x²-1)/(x-1)=x+1；δ=ε','双侧有限极限存在 ⇔ 左右有限极限存在且相等','∀ε>0，∃X>0：|x|>X ⇒ |f(x)-L|<ε','x>2；根式差=4/[√(x+2)+√(x-2)]<4/√x；X=max(2,16/ε²)']
        elif pid.endswith('-floor'):
            formulas=['floor(x)≤x<floor(x)+1；{x}=x-floor(x)，0≤{x}<1']
        else:
            formulas=['0≤[1+(-1)ⁿ]/(2n)≤1/n','1/(n+1)²<1/n²；N=floor(1/√ε)+1','q=0 单独处理；0<|q|<1 时 ln|q|<0；N=max(1,floor(ln ε/ln|q|)+1)','|(2n²-1)/(n²+n+1)-2|<5/n（n≥1）','√(n+1)-√n=1/[√(n+1)+√n]<1/√n']
        for ex,formula in zip(co['additional_examples'],plan.get('formulas',formulas)):ex['formula']=formula
        if plan.get('visualization'):co['visualization']=plan['visualization']
        if plan.get('condition'):co['board_condition']=plan['condition']
        co['stages']=[dict(id=sid,name=name,speaker='anaxa',dialogue=line) for sid,(name,line) in zip(('textbook','worked','practice'),plan['stages'])]
        co['dialogue']={'anaxa':co['stages'][0]['dialogue'],**plan['sides']}
        co['objectives']=['先说清对象、方向与适用条件','补全每一步的推理依据','用反例检验条件，再独立完成变式']
        co['checkpoints']=copy.deepcopy(plan['checks'])
        co['exercises']=[e for e in co['exercises'] if not e['id'].startswith('guided-')]+[{k:v for k,v in e.items() if k!='stage'} for e in plan['checks']]
        note='已逐段阅读本集完整音频转录，并对照全片每 45 秒采样板书与关键公式大图；数学识别错误已人工纠正。保留教学顺序，台词、解释与迁移问题为树庭原创；并非逐字复刻或逐帧观看。'
        co['source'].update(review_status='transcript_and_sampled_boards_reviewed',review_file=f'knowledge/build/calculus-reteach/lessons/{plan["bvid"]}-p1/review.json',lesson_origin='reviewed_sequence_original_dialogue',note=note,transcript_verified=False)
        if plan.get('source_title'):
            # 原先的先修补课引用入口视频，审阅具体课后改为真实来源，旧链接保留在补充列表。
            co['source'].update(id='calculus-bili-'+plan['bvid'],title=plan['source_title'],bvid=plan['bvid'],url=f'https://www.bilibili.com/video/{plan["bvid"]}/')
            if co['source']['url'] not in co['source']['supplement_urls']:co['source']['supplement_urls'].append(co['source']['url'])
        if plan.get('primary_check_url') and plan['primary_check_url'] not in co['source']['supplement_urls']:co['source']['supplement_urls'].append(plan['primary_check_url'])
        co['syllabus']['selection']=note
        co['teaching_style']=dict(sequence=['观察反例','拆解定义','逆向探索','正向证明','停笔检验','独立变式'],evidence='完整转录与采样板书审阅；转录不作为精确字幕公开')
        p.update(summary=plan['summary'],quick_meaning=plan['board'],prompt=co['stages'][0]['dialogue'],assistant_hint=plan['sides']['hyacine'],classmate=dict(character='castor',text=plan['sides']['castor']),dialogue=copy.deepcopy(co['dialogue']),review_status='reviewed_source_original_dialogue')
        p['source'].update(type='reviewed_calculus_course',note=note)
        if plan.get('source_title'):
            p['source']['course_url']=co['source']['url']
            p['source_refs']=[co['source']['id']]
        p['example']=dict(en=plan['ex']['question'],zh='；'.join(s['text'] for s in plan['ex']['steps'])+' 结论：'+plan['ex']['answer'])
        # 保留旧迁移题及答案，避免让历史答题被新题重新解释；新增检验用新 ID。
        p['micro_lesson']=dict(concept=plan['text'][0][1],scenario=plan['ex']['question'],reasoning=p['example']['zh'],common_traps=[plan['text'][-1][1]],steps=[dict(label=h,text=t) for h,t in plan['text']])
        p['memoryHook']=plan['board']
        old_choice_answer=co['exercises'][1]['answer']
        if pid.endswith('-floor'):
            co['exercises'][0]['explanation']='floor(-1.2)=-2，因为 -2≤-1.2<-1；向零截断得到 -1 不符合“不超过原数”。'
            co['exercises'][1].update(choices=['向零截断，得到 -1','沿数轴向左，-2≤-1.2<-1'],answer=1,explanation=co['exercises'][0]['explanation'])
        elif pid.endswith('-function-limit'):
            co['exercises'][0]['explanation']='x<0 时 |x|/x=-1，x>0 时为 1；左右极限不相等，故双侧极限不存在。'
            co['exercises'][1].update(choices=['先分左右：左 -1、右 1，不能合并','把 x=0 代入，认为结果是 0'],answer=0,explanation=co['exercises'][0]['explanation'])
        elif pid.endswith('-sequence-limit'):
            co['exercises'][0]['explanation']='a_n=2+1/n 与 2 的误差为 1/n。任意 ε>0，取 N=floor(1/ε)+1，n>N 时误差小于 ε，故极限为 2。'
            co['exercises'][1].update(choices=['误差 |a_n-2|=1/n，可用正整数门槛控制全部尾项','只看第一项 a_1=3，就把它当作极限'],answer=0,explanation=co['exercises'][0]['explanation'])
        elif pid.endswith('-inverse-trig'):
            co['exercises'][0]['explanation']='arccos 的输出在 [0,π] 内；该区间余弦为 -1 的角是 π，故 arccos(-1)=π。可输入 pi 或 π。'
            co['exercises'][1].update(choices=['在 [0,π] 内找余弦为 -1 的角，得到 π','把反余弦误当奇函数，直接将负号提出来'],answer=0,explanation=co['exercises'][0]['explanation'])
        else:
            co['exercises'][0]['explanation']=plan['legacy_explanation']
            co['exercises'][1].update(choices=plan['legacy_choices'],answer=0,explanation=plan['legacy_explanation'])
        # 旧二选一的正误位置也保留，历史选择索引仍按同一结论回放。
        if co['exercises'][1]['answer']!=old_choice_answer:
            co['exercises'][1]['choices'].reverse();co['exercises'][1]['answer']=old_choice_answer
        p['test']={k:co['exercises'][1][k] for k in ('question','choices','answer','explanation')}
        p['clues']=[dict(id='reason-'+str(i),type='推理线索',text=t,correct=i==p['test']['answer']) for i,t in enumerate(p['test']['choices'])]
        p['feedback']={'matched':'条件与结论对应上了。'+co['exercises'][0]['explanation'],'redirect':'先检查决定结果的条件。'+co['exercises'][0]['explanation']}
    return list(plans)

def sync_reviewed_sources(root, points):
    """将先修补课改用的真实来源同步到目录，避免索引仍指向旧入口视频。"""
    import json
    path=root/'knowledge/calculus_series_mapping.json'
    m=json.loads(path.read_text(encoding='utf-8'))
    inventory=json.loads((root/'knowledge/build/calculus-reteach/inventory.json').read_text(encoding='utf-8'))
    reviewed=[p for p in points if p.get('review_status')=='reviewed_source_original_dialogue']
    lookup={p['id']:p['course']['source']['bvid'] for p in reviewed}
    for v in m['videos']:v['lesson_ids']=[pid for pid in v['lesson_ids'] if pid not in lookup or lookup[pid]==v['bvid']]
    by={v['bvid']:v for v in m['videos']}
    for p in reviewed:
        src=p['course']['source'];bv=src['bvid']
        if bv not in by:
            r=next(r for r in inventory['rows'] if r['bvid']==bv)
            by[bv]=dict(bvid=bv,title=r['title'],section='连续性',volume='upper' if r['season_id']==1919321 else 'lower',cid=r['cid'],duration=r['duration'],url=src['url'],lesson_ids=[],verification='public_catalog_metadata_verified',transcript_verified=False)
            m['videos'].append(by[bv])
        if p['id'] not in by[bv]['lesson_ids']:by[bv]['lesson_ids'].append(p['id'])
    m.update(checked_date=inventory['checked_on'],video_count=len(m['videos']),active_video_count=sum(not v.get('excluded_reason') for v in m['videos']))
    m['supplement_count']=sum(p.get('subject')=='calculus' for p in points)-m['active_video_count']
    for s in m['series']:
        s['returned_count']=sum(v['volume']==s['volume'] for v in m['videos'])
        view=json.loads((root/f'knowledge/build/calculus-reteach/{"BV1xhmnYFEir" if s["volume"]=="upper" else "BV11t42177s1"}-view.json').read_text(encoding='utf-8'))
        s['reported_count']=view['data']['ugc_season']['ep_count']
    path.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    refs_path=root/'data/references/sources.json';refs=json.loads(refs_path.read_text(encoding='utf-8'));known={r['id'] for r in refs['sources']}
    for p in reviewed:
        s=p['course']['source']
        if s['id'] not in known:
            refs['sources'].append(dict(id=s['id'],title='一高数 · '+s['title'],url=s['url'],status='transcript_and_sampled_boards_reviewed',note=s['note']));known.add(s['id'])
    refs_path.write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return m
