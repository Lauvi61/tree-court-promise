"""用独立级数乘法、莱布尼茨公式和有理数不等式核对泰勒应用草稿。"""
import copy,json,math,sys,unittest
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'knowledge'))
from calculus_reviewed import apply_reviewed,example,check
from calculus_reviewed_taylor_applications import plan

class TaylorApplicationsDraftTests(unittest.TestCase):
 def test_limit_coefficients_and_independent_numeric_checks(self):
  # 直接卷积两个对数的系数，独立检查全部四次配对。
  pos={k:F((-1)**(k-1),k) for k in range(1,5)}
  neg={k:F(-1,k) for k in range(1,5)}
  product={n:sum(pos[i]*neg[n-i] for i in pos if n-i in neg) for n in range(2,5)}
  self.assertEqual(product,{2:F(-1),3:F(0),4:F(-5,12)})
  with localcontext() as c:
   c.prec=65
   for x in [D('-.01'),D('-.001'),D('.001'),D('.01')]:
    result=((1+x).ln()*(1-x).ln()+x*x)/x**4
    self.assertLess(abs(result+D(5)/12),x*x)
    sine=sum(D((-1)**k)*x**(2*k+1)/D(math.factorial(2*k+1)) for k in range(12))
    cosine=sum(D((-1)**k)*x**(2*k)/D(math.factorial(2*k)) for k in range(12))
    self.assertLess(abs((sine-x*cosine)/x**3-D(1)/3),x*x/20)
    self.assertLess(abs((x-sine)/x**3-D(1)/6),x*x/100)

 def test_derivative_via_leibniz_and_bound_signs(self):
  for n in range(3,15):
   # x²的二阶导数为2，log(1+x)的(n−2)阶导数为(−1)^(n−3)(n−3)!。
   by_leibniz=math.comb(n,2)*2*(-1)**(n-3)*math.factorial(n-3)
   by_coefficient=F((-1)**(n-3)*math.factorial(n),n-2)
   self.assertEqual(by_leibniz,by_coefficient)
  self.assertEqual(F(math.factorial(5),3),40)
  for c in [F(i,100) for i in range(1,100)]:
   d=min(c,1-c)
   self.assertLessEqual(-4/d**2,-16)
   self.assertLessEqual(c*c+(1-c)**2,1)
  self.assertEqual(-4/F(1,2)**2,-16)
  # b=0时的线性反例，阻止把统一上界错误收紧为严格不等式。
  for a in [F(0),F(1,3),F(2)]:
   self.assertEqual(abs(2*a),2*a+F(0,2))
   self.assertTrue(all(abs(2*a*x-a)<=a for x in [F(i,10) for i in range(11)]))

 def test_staged_only_and_legacy_answers_remain_compatible(self):
  catalog=json.loads((ROOT/'data/curriculum/catalog.json').read_text(encoding='utf-8'))
  before=copy.deepcopy(catalog);pid='calculus-upper-taylor-errors'
  ids=apply_reviewed(catalog['points'],only={pid})
  self.assertEqual(ids,[pid])
  self.assertEqual([p for p in catalog['points'] if p['id']!=pid],[p for p in before['points'] if p['id']!=pid])
  old=next(p for p in before['points'] if p['id']==pid);new=next(p for p in catalog['points'] if p['id']==pid)
  self.assertEqual(old['review_status'],'reviewed_source_original_dialogue')
  for e in old['course']['exercises']:
   other=next(q for q in new['course']['exercises'] if q['id']==e['id'])
   self.assertEqual((e['question'],e['answer']),(other['question'],other['answer']))
  self.assertEqual(new['test']['answer'],old['test']['answer'])
  p=plan(example,check)
  self.assertEqual(len(p['stages']),3)
  self.assertEqual(len(p['formulas']),len(p['extra']))
  self.assertEqual(len(set(q['id'] for q in p['checks'])),10)
  self.assertEqual(p['source_example_indices'],list(range(1,7)))
  self.assertTrue(all(e.get('formula') for e in new['course']['additional_examples']))
  again=copy.deepcopy(catalog);apply_reviewed(again['points'],only={pid})
  self.assertEqual(again,catalog)

if __name__=='__main__':unittest.main()
