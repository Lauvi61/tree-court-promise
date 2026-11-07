"""源课计算用有理数原函数、独立数值积分和区域归属交叉核对。"""
import copy,json,math,sys,unittest
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'knowledge'))
from calculus_reviewed import apply_reviewed,example,check
from calculus_reviewed_double_integral import plan

def simpson(f,a,b,n=800):
 h=(b-a)/n
 return h/3*(f(a)+f(b)+sum((4 if i%2 else 2)*f(a+i*h) for i in range(1,n)))

class ReviewedDoubleIntegralTests(unittest.TestCase):
 def test_exact_polynomial_and_numerical_answers(self):
  primitive=lambda y:y**4/F(8)+2*y**3/F(3)+y*y-y**6/F(12)
  self.assertEqual(primitive(F(2))-primitive(F(-1)),F(45,8))
  self.assertEqual(F(1,5)-F(1,3)+F(1,2),F(11,30))
  prim=lambda y:y/2+1/(4*y*y)
  self.assertEqual(prim(F(2))-prim(F(1)),F(5,16))
  self.assertAlmostEqual(simpson(lambda y:y**3*math.exp(-y*y)/3,0,1),(1-2/math.e)/6,places=10)
  self.assertAlmostEqual(1+simpson(lambda x:2*x+1/(2*x),.5,2),19/4+math.log(2),places=9)
  self.assertAlmostEqual(simpson(lambda x:x*(math.sin(2*x)-math.sin(x)),0,math.pi),-3*math.pi/2,places=9)
  self.assertAlmostEqual(math.pi/4*simpson(lambda r:r*math.sin(math.pi*r),1,2),-.75,places=10)
  for a in [.25,1,2,3]:
   self.assertAlmostEqual(2*math.pi*simpson(lambda r:r*math.exp(-r*r),0,a),math.pi*(1-math.exp(-a*a)),places=8)
  direct=2*simpson(lambda x:(2-x)/x,1,2)
  polar=2*simpson(lambda t:2/(math.cos(t)*(math.cos(t)+math.sin(t)))-1/math.cos(t)**2,0,math.pi/4)
  self.assertAlmostEqual(direct,4*math.log(2)-2,places=10);self.assertAlmostEqual(direct,polar,places=10)
  # 半径2漏Jacobian数值碰巧正确，换半径1或3立即不相等。
  for a in [1,3]:self.assertNotEqual(2*math.pi*a,math.pi*a*a)

 def test_region_partitions_and_back_transform(self):
  for i in range(-10,11):
   x=F(i,10)
   for j in range(-30,41):
    y=F(j,10);inside=-3*x<=y<=4-x*x
    cap=3*abs(x)<=y<=4-x*x
    wedge=x>=0 and -3*x<=y<=3*x
    self.assertEqual(inside,cap or wedge)
    if cap:self.assertTrue(3*abs(-x)<=y<=4-(-x)**2)
    if wedge:self.assertTrue(-3*x<=-y<=3*x)
  self.assertAlmostEqual(simpson(lambda t:2*math.sin(t)**2,0,math.pi/2),math.pi/2,places=10)
  for k in range(1,20):
   t=k*math.pi/40;lo=2*math.cos(t)
   for r in [lo,(lo+2)/2,2]:
    x,y=r*math.cos(t),r*math.sin(t)
    self.assertGreaterEqual(y+1e-12,math.sqrt(max(0,2*x-x*x)))
    self.assertLessEqual(y,math.sqrt(max(0,4-x*x))+1e-12)
  for x,y in [(F(1,3),F(2,3)),(F(1),F(0)),(F(3,2),F(1,4))]:
   q=lambda z:1+z*z
   u,v=math.sqrt(q(x)),math.sqrt(q(y))
   a,b=-2,3
   self.assertAlmostEqual((a*u+b*v)/(u+v)+(a*v+b*u)/(u+v),a+b)

 def test_scope_sources_and_old_answer_compatibility(self):
  catalog=json.loads((ROOT/'data/curriculum/catalog.json').read_text(encoding='utf-8'));before=copy.deepcopy(catalog)
  pid='calculus-lower-double-integral';ids=apply_reviewed(catalog['points'],only={pid});self.assertEqual(ids,[pid])
  self.assertEqual([p for p in catalog['points'] if p['id']!=pid],[p for p in before['points'] if p['id']!=pid])
  old=next(p for p in before['points'] if p['id']==pid);new=next(p for p in catalog['points'] if p['id']==pid)
  for e in old['course']['exercises']:
   if e['id'].startswith('guided-'):continue
   r=next(q for q in new['course']['exercises'] if q['id']==e['id']);self.assertEqual((e['question'],e['answer']),(r['question'],r['answer']))
  p=plan(example,check);self.assertEqual(len(p['checks']),14);self.assertEqual(len(p['extra']),len(p['formulas']))
  self.assertEqual(len(p['extra'])+1,17);self.assertTrue(all(e.get('formula') for e in new['course']['additional_examples']))
  again=copy.deepcopy(catalog);apply_reviewed(again['points'],only={pid});self.assertEqual(again,catalog)

if __name__=='__main__':unittest.main()
