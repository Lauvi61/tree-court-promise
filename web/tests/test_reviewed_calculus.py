"""审阅覆盖层的数学边界、旧档案回放与变更范围验收。"""
import copy,json,math,sys,unittest
from pathlib import Path
from datetime import datetime,timezone
from uuid import uuid4
from web.backend.course_exercises import evaluate
from web.backend.domain import replay
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'knowledge'))
from calculus_reviewed import apply_reviewed
C=json.loads((ROOT/'data/curriculum/catalog.json').read_text(encoding='utf-8'))
B=json.loads((ROOT/'knowledge/build/calculus-reteach/before-reviewed/catalog.json').read_text(encoding='utf-8'))
POLICY=json.loads((ROOT/'data/teaching-policy.json').read_text(encoding='utf-8'))
IDS={'calculus-upper-floor','calculus-upper-function-limit','calculus-upper-sequence-limit','calculus-upper-inverse-trig','calculus-upper-infinitesimal','calculus-upper-squeeze','calculus-upper-limit-methods','calculus-upper-continuity','calculus-upper-derivative-definition','calculus-upper-mean-value','calculus-upper-taylor','calculus-upper-taylor-errors','calculus-lower-double-integral','calculus-upper-indefinite','calculus-upper-integration-techniques','calculus-upper-rational-integrals'}
IDS.add('calculus-upper-definite')

class ReviewedCalculusTests(unittest.TestCase):
 def test_mean_value_source_examples_and_distinct_point_logic(self):
  from fractions import Fraction as F
  # 同一个点不是两次分别存在的点；直接计算例子的三份等式。
  c=F(14,9);self.assertEqual((2*c)/(3*c*c),F(3,7))
  self.assertNotEqual(F(3,2)**2,F(7,3))
  for c in [F(1,8),F(1,3),F(1,2),F(5,6)]:
   left=(1-c)/c;right=c/(1-c);self.assertEqual(left*right,1)
   self.assertGreater(c,0);self.assertLess(c,1)
  for a,b in [(1,4),(2,8),(-4,-1),(-8,-2)]:
   c=math.copysign(math.sqrt(a*b),a)
   self.assertTrue(a<c<b)
   lhs=F(a*b*b-b*a*a,a-b)
   self.assertAlmostEqual(float(lhs),-c*c)
  # 第一题的 ξ 系数绝不能漏：f=1−2x，c=1/2，正确驻点为3/8。
  c=F(3,8);self.assertEqual(c*(-2)+3*(1-2*c),0)
  self.assertNotEqual((-2)+3*(1-2*c),0)
  self.assertEqual(F(0)**3*(1-2*F(0)),F(1,2)**3*(1-2*F(1,2)))
  # 第二题取满足题设的4x(1−x)，先得η=3/4，再在(0,η)求目标零点。
  eta=F(3,4);self.assertEqual(4*eta*(1-eta),eta)
  phi=lambda x:3-8*x+6*x*x-8*x*x*x
  lo,hi=0,float(eta)
  for _ in range(70):
   mid=(lo+hi)/2
   if phi(mid)>0:lo=mid
   else:hi=mid
  xi=(lo+hi)/2;self.assertTrue(0<xi<float(eta));self.assertLess(abs(phi(xi)),1e-12)
  for x in [1e-6,.01,.5,1,4,100]:
   self.assertLess(x/(1+x),math.log1p(x));self.assertLess(math.log1p(x),x)
  for x in [-1000,-100,-10,10,100,1000]:
   self.assertAlmostEqual(x*x*(math.tan(1/x)-math.tan(1/(x+1))),1,delta=2/abs(x))
  for c in [-1/math.sqrt(3),1/math.sqrt(3)]:self.assertAlmostEqual(3*c*c,1)
 def test_derivative_definition_and_nonconverse_examples(self):
  from fractions import Fraction as F
  for h in [F(1,10),F(-1,10),F(1,1000),F(-1,1000)]:
   self.assertEqual(((2+h)**2-4)/h,4+h)
   self.assertEqual(((2+2*h)**2-4)/h,8+4*h)
   self.assertEqual(((2+2*h)**2-4)/(2*h),4+2*h)
   linear=lambda x:2*x+7
   self.assertEqual((linear(3-h)-linear(3))/(2*h),-1)
   self.assertEqual((abs(h)-abs(-h))/(2*h),0)
   self.assertEqual(abs(h)/h,1 if h>0 else -1)
   self.assertEqual(abs(h*h)/(h*h),1)
   point=lambda x:int(x==0)
   self.assertEqual((point(h)-point(-h))/(2*h),0)
   self.assertNotEqual((point(h)-point(0))/h,0)
  for n in [1,2,4,8]:
   h=1e-5
   f=lambda x:x*math.prod(x+k for k in range(1,n+1))
   self.assertAlmostEqual(f(h)/h,math.factorial(n),delta=math.factorial(n)*h*4)
  for h in [.01,-.01,.0001,-.0001]:
   self.assertLessEqual(abs(h*math.sin(1/h)),abs(h))
   self.assertAlmostEqual((2*(3+h*math.sin(h))-6)/(1-math.cos(h)),4,delta=.001)
  for n in [1,3,10,100]:
   h=1/(2*n+.5);k=1/(2*n+1.5)
   self.assertAlmostEqual(math.sin(math.pi/h),1);self.assertAlmostEqual(math.sin(math.pi/k),-1)
   self.assertAlmostEqual(math.sin(n*math.pi),0)
   x=1/(2*math.pi*n);y=1/((2*n+1)*math.pi)
   self.assertAlmostEqual(2*x*math.sin(1/x)-math.cos(1/x),-1)
   self.assertAlmostEqual(2*y*math.sin(1/y)-math.cos(1/y),1)
 def test_continuity_counterexamples_include_actual_point_values(self):
  s=lambda x:1 if x>=0 else -1
  sign=lambda x:1 if x>0 else -1 if x<0 else 0
  F=lambda u:1 if abs(u)>=1 else 0
  G=lambda u:1 if u>=1 else 0
  reciprocal=lambda x:1/x if x else 0
  for x in [-.5,-.01,-.0001,0,.0001,.01,.5]:
   self.assertEqual(s(x*x),1);self.assertEqual(F(s(x)),1)
   self.assertEqual(G(s(x)),int(x>=0));self.assertEqual(s(x)**2,1)
   self.assertEqual(x*s(x),abs(x))
   self.assertEqual(sign(x*x),int(x!=0))
   self.assertEqual(x*reciprocal(x),int(x!=0))
   self.assertEqual(s(x)*(2+s(x)),2*s(x)+1)
  for x in [.1,.01,.001]:
   self.assertLessEqual(abs((-x)/2),x);self.assertLessEqual(abs(x),x)
   self.assertEqual(abs(x)/x,1);self.assertEqual(abs(-x)/(-x),-1)
  # 相同前提下结果相反，是“不一定”的证明；并检查外层真正的研究位置。
  self.assertEqual(s(0),1);self.assertEqual(F(1),1);self.assertEqual(F(.999),0)
  for n in [1,3,10,100]:
   xn=1/(2*math.pi*n+math.pi/2);yn=1/(2*math.pi*n+3*math.pi/2)
   self.assertAlmostEqual(math.sin(1/xn),1);self.assertAlmostEqual(math.sin(1/yn),-1)
  p=next(p for p in C['points'] if p['id']=='calculus-upper-continuity')
  self.assertEqual(p['course']['source']['bvid'],'BV1LUx368E1L')
 def test_method_examples_with_high_precision_and_counterexamples(self):
  # 高精度直接计算原式，专门捕捉相减抵消、指数符号和指数还原错误。
  from decimal import Decimal as D,localcontext
  with localcontext() as ctx:
   ctx.prec=65
   def sin(x):
    term=total=x
    for k in range(1,40):term*=-x*x/D((2*k)*(2*k+1));total+=term
    return total
   def cos(x):
    term=total=D(1)
    for k in range(1,40):term*=-x*x/D((2*k-1)*(2*k));total+=term
    return total
   def atan(x):
    return sum((-1)**k*x**(2*k+1)/D(2*k+1) for k in range(40))
   for x in [D('0.00001'),D('-0.00001')]:
    sx,cx=sin(x),cos(x)
    cases=[(1/(x*sx)-cx/(x*sx),D(1)/2),
     ((x-sx)/((1-cx)*sx/cx),D(1)/3),
     ((((1+2*x*x).ln()+(1-x*x).ln())/(x*sx)),D(1)),
     (((x*x).exp()-(2-2*cx).exp())/(x**4),D(1)/12),
     ((sin(x)-x*cx)/(x**3),D(1)/3),
     (((1+x)*((1+x).ln())-x)/(x*(1+x).ln()),D(1)/2),
     (((((1+x).ln()/x).ln())/(x.exp()-1)).exp(),(-D(1)/2).exp()),
     (((((1+x)/(1-x)).ln())/x).exp(),D(2).exp())]
    cases.append((((1-atan(2*x)).ln()+x*x)/((1+x).sqrt()-1),D(-4)))
    for actual,target in cases:self.assertLess(abs(actual-target),D('0.0002'))
   # 三个固定正数的数列幂指题，正负对数抵消时也成立。
   n=D(1000000)
   for values in [('1','1','1'),('2','.5','1'),('2','3','4')]:
    vals=[D(v) for v in values];u=sum((a.ln()/n).exp() for a in vals)/3
    target=(sum(a.ln() for a in vals)/3).exp()
    self.assertLess(abs((n*u.ln()).exp()-target),D('.00001'))
  for k in [10,100,1000]:
   self.assertAlmostEqual((k*math.tau+math.sin(k*math.tau))/(k*math.tau),1)
   self.assertAlmostEqual(1+math.cos(k*math.tau),2)
   self.assertAlmostEqual(1+math.cos(k*math.tau+math.pi),0)
 def test_squeeze_bounds_for_sums_products_and_factorials(self):
  from fractions import Fraction as F
  for n in [1,2,3,5,10,25,80]:
   a=sum(F(k,n*n+n+k) for k in range(1,n+1))
   self.assertLessEqual(F(n*(n+1),2*(n*n+2*n)),a)
   self.assertLessEqual(a,F(n*(n+1),2*(n*n+n+1)))
   b=sum(1/math.sqrt(n*n+k) for k in range(1,n+1))
   self.assertLessEqual(n/math.sqrt(n*n+n)-1e-12,b)
   self.assertLessEqual(b,n/math.sqrt(n*n+1)+1e-12)
   square=sum(F(1,(n+k)**2) for k in range(1,n+1))
   self.assertLessEqual(square,F(n,(n+1)**2))
   product=math.prod(F(2*k-1,2*k) for k in range(1,n+1))
   self.assertLessEqual(F(1,2*n),product);self.assertLessEqual(product,F(1,2))
   if n>=3:
    fact=F(sum(math.factorial(k) for k in range(1,n+1)),math.factorial(n))
    self.assertGreaterEqual(fact,1);self.assertLess(fact,1+F(2,n))
   task1=sum(F(k,4*n*n+k) for k in range(1,n+1))
   self.assertLessEqual(F(n*(n+1),2*(4*n*n+n)),task1)
   self.assertLessEqual(task1,F(n*(n+1),2*(4*n*n+1)))
   numerator=n*(n+1)*(2*n+1)//6
   task2=sum(F(k*k,n**3+n*n+n+k) for k in range(1,n+1))
   self.assertLessEqual(F(numerator,n**3+n*n+2*n),task2)
   self.assertLessEqual(task2,F(numerator,n**3+n*n+n+1))
  # 宽度趋零仍可整体漂移；此时中间量没有有限极限。
  self.assertLess(2/1000,.01);self.assertGreater(1000,100)
  for eps in [.001,.01,.2,2]:
   n=math.ceil(1+2/eps**2)+1
   self.assertGreater((n-1)*eps**2/2,1)
   self.assertGreater(n*math.log1p(eps),math.log(n))
  # 固定项数假设不可删：2^n个1开n次根为2，不是最大项1。
  for n in [1,2,5,10]:self.assertAlmostEqual((2**n)**(1/n),2)
 def test_scope_idempotence_and_old_answers(self):
  self.assertEqual({k:v for k,v in C.items() if k!='points'},{k:v for k,v in B.items() if k!='points'})
  self.assertEqual([p for p in C['points'] if p['id'] not in IDS],[p for p in B['points'] if p['id'] not in IDS])
  old={p['id']:p for p in B['points']}
  repeat=copy.deepcopy(C['points']);apply_reviewed(repeat);self.assertEqual(repeat,C['points'])
  for p in C['points']:
   if p['id'] in IDS:
    for ex in old[p['id']]['course']['exercises']:
     current=next(e for e in p['course']['exercises'] if e['id']==ex['id'])
     self.assertEqual(current['answer'],ex['answer']);self.assertEqual(current['question'],ex['question'])
    self.assertEqual(p['test']['answer'],old[p['id']]['test']['answer'])

 def test_positive_integer_threshold_for_arbitrary_epsilon(self):
  # 包括 ε 大于1、倒数恰是整数，以及需要取整的情况。
  for eps in [0.001,0.03,0.2,0.5,1,2,500]:
   N=math.floor(1/eps)+1;self.assertGreaterEqual(N,1)
   for n in range(N+1,N+21):self.assertLess(1/n,eps)
   N2=math.floor(1/math.sqrt(eps))+1
   for n in range(N2+1,N2+21):self.assertLess(1/n**2,eps)
  self.assertEqual(math.floor(1/2),0)
  self.assertEqual(1/5,0.2) # n≥N 的端点不能满足严格误差。

 def test_delta_proof_and_missing_local_bound_counterexample(self):
  for eps in [1e-7,0.03,1,5,500]:
   delta=min(1,eps/5)
   for sign in [-1,1]:
    for fraction in [0.001,0.1,0.5,0.999]:
     x=2+sign*delta*fraction;self.assertLess(abs(x*x-4),eps)
  # 只写 δ=ε/5 时，ε=500，x=50 在去心邻域内却不满足目标。
  self.assertLess(abs(50-2),500/5);self.assertGreater(abs(50**2-4),500)
  for eps in [0.01,1,100]:
   X=max(2,16/eps**2)
   for x in [X+1,2*X+1]:
    # 使用有理化式避免大数相减的浮点消去，独立验算目标误差。
    error=4/(math.sqrt(x+2)+math.sqrt(x-2));self.assertLess(error,eps)

 def test_geometric_threshold_including_zero_and_large_precision(self):
  for q in [0,-0.99,-0.5,0.5,0.99]:
   for eps in [1e-6,0.01,1,2,100]:
    N=1 if q==0 else max(1,math.floor(math.log(eps)/math.log(abs(q)))+1)
    self.assertGreaterEqual(N,1)
    for n in range(N+1,N+10):self.assertLess(abs(q)**n,eps)
  for eps in [0.03,0.2,2]:
   N=math.floor(5/eps)+1
   for n in range(N+1,N+20):self.assertLess(abs((2*n*n-1)/(n*n+n+1)-2),eps)

 def test_checks_grade_on_server_without_completing_or_penalizing(self):
  for p in C['points']:
   if p['id'] not in IDS:continue
   for q in p['course']['checkpoints']:
    self.assertIn(q['stage'],range(len(p['course']['stages'])))
    ex=next(e for e in p['course']['exercises'] if e['id']==q['id'])
    self.assertTrue(evaluate(ex,q['answer']))
    wrong=(q['answer']+1)%len(q['choices'])
    self.assertFalse(evaluate(ex,wrong))
    event={'event_id':str(uuid4()),'type':'course_attempt','at':datetime.now(timezone.utc).isoformat(),'payload':dict(policy_version=2,point_id=p['id'],exercise_id=q['id'],response=wrong,response_ms=0,correct=True)}
    before=replay([],C,POLICY);after=replay([event],C,POLICY)
    self.assertFalse(after['course_attempts'][p['id']+':'+q['id']][-1]['correct'])
    self.assertEqual(before['affection'],after['affection']);self.assertFalse(after['completed'])

 def test_inverse_branch_and_endpoint_conditions(self):
  for i in range(101):
   u=-1+i/50
   self.assertAlmostEqual(math.asin(u)+math.acos(u),math.pi/2)
   x=math.pi-math.asin(u);self.assertGreaterEqual(x,math.pi/2);self.assertLessEqual(x,3*math.pi/2);self.assertAlmostEqual(math.sin(x),u)
   self.assertAlmostEqual(math.cos(math.asin(u)),math.sqrt(max(0,1-u*u)))
  self.assertAlmostEqual(math.acos(math.cos(11*math.pi/6)),math.pi/6)
  self.assertAlmostEqual(math.asin(math.sin(2)),math.pi-2)
  self.assertNotEqual(math.acos(-1),math.acos(1))
  for x in [-10,-1,-.1,.1,1,10]:self.assertAlmostEqual(math.atan(x)+math.atan(1/x),math.copysign(math.pi/2,x))
  for k in range(-3,4):
   for fraction in [-.49,-.1,.1,.49]:
    theta=(k+fraction)*math.pi
    self.assertAlmostEqual(math.atan(math.tan(theta)),theta-k*math.pi)

 def test_unbounded_is_not_eventual_escape_and_denominator_is_squared(self):
  p=next(p for p in C['points'] if p['id']=='calculus-upper-infinitesimal')
  self.assertIn('/x²',p['course']['worked_example']['question'])
  for M in [1,10,10000]:
   # 峰值点为精确的 π 倍有理式；用恒等式 sin(2πn+π/2)=1，避免高频采样错认极值。
   n=max(1,math.ceil(math.sqrt(M)/(2*math.pi)))
   self.assertGreater((2*math.pi*n+math.pi/2)**2,M)
   for N in [1,100,100000]:
    later_even=2*(N+1)
    self.assertGreater(later_even,N);self.assertEqual(0 if later_even%2==0 else later_even,0)
  for delta in [.1,.001,1e-6]:
   n=math.ceil(1/(math.pi*delta))+1
   self.assertLess(1/(n*math.pi),delta) # 任意右侧邻域仍有精确零点。
  # 分母/分子都趋零时，不能依类别确定商。
  for x in [.1,.01,.001]:
   self.assertAlmostEqual(2*x/x,2);self.assertAlmostEqual(2*x*x/x,2*x);self.assertAlmostEqual(2*x/(x*x),2/x)

if __name__=='__main__':unittest.main()
