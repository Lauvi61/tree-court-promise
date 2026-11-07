"""泰勒课的独立数学核对；不改课程表或用户数据。"""
import copy,json,math,sys,unittest
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'knowledge'))
from calculus_reviewed import example,check,apply_reviewed
from calculus_reviewed_taylor import plan

class TaylorDraftTests(unittest.TestCase):
 def test_staging_changes_only_taylor_and_preserves_old_answers(self):
  c=json.loads((ROOT/'data/curriculum/catalog.json').read_text(encoding='utf-8'));staged=copy.deepcopy(c['points'])
  ids=apply_reviewed(staged,only={'calculus-upper-taylor'})
  self.assertEqual(ids,['calculus-upper-taylor'])
  self.assertEqual([p for p in staged if p['id'] not in ids],[p for p in c['points'] if p['id'] not in ids])
  old=next(p for p in c['points'] if p['id'] in ids);new=next(p for p in staged if p['id'] in ids)
  for ex in old['course']['exercises']:
   current=next(e for e in new['course']['exercises'] if e['id']==ex['id'])
   self.assertEqual(current['question'],ex['question']);self.assertEqual(current['answer'],ex['answer'])
  self.assertEqual(old['test']['answer'],new['test']['answer'])
  repeat=copy.deepcopy(staged);apply_reviewed(repeat,only=set(ids));self.assertEqual(repeat,staged)
  self.assertTrue(all(e.get('formula') for e in new['course']['additional_examples']))
 def test_coefficients_and_remainder_estimates(self):
  self.assertEqual(1-F(1,6)+F(1,120),F(101,120))
  self.assertLess(abs(float(F(101,120))-math.sin(1)),1/math.factorial(7))
  self.assertGreater(abs(4-4**3/6-math.sin(4)),abs(4-math.sin(4)))
  self.assertEqual(F(1,2)*(F(1,2)-1)/2,F(-1,8))
  self.assertEqual(F(1,3)*(F(1,3)-1)/2,F(-1,9))
  with localcontext() as ctx:
   ctx.prec=60
   for h in [D('-.02'),D('-.001'),D('.001'),D('.02')]:
    x=1+h;actual=x*x*x.ln();poly=h+D(3)*h*h/2
    self.assertLessEqual(abs(actual-poly),abs(h)**3/(3*min(D(1),x)))
    y=2+h;poly=D(2).ln()+h/2-h*h/8+h**3/24
    self.assertLess(abs(y.ln()-poly),abs(h)**4)
   for n in range(1,6):
    h=D('.0001');p=sum(h**k/D(math.factorial(k-1)) for k in range(1,n+1))
    remainder=h*h.exp()-p
    self.assertLess(abs(remainder),2*abs(h)**(n+1)/D(math.factorial(n)))
   for x in [D('-.5'),D('.2'),D('2')]:
    for n in [1,2,5]:
     self.assertEqual(1/(1-x),sum(x**k for k in range(n+1))+x**(n+1)/(1-x))
 def test_lesson_structure_is_complete(self):
  p=plan(example,check);self.assertEqual(len(p['formulas']),len(p['extra']))
  self.assertEqual(len(p['stages']),3)
  self.assertEqual(len({q['id'] for q in p['checks']}),len(p['checks']))
  for q in p['checks']:
   self.assertTrue(0<=q['answer']<len(q['choices']));self.assertTrue(q['explanation'])
  for ex in [p['ex'],*p['extra']]:self.assertGreaterEqual(len(ex['steps']),3)
  catalog=json.loads((ROOT/'data/curriculum/catalog.json').read_text(encoding='utf-8'))
  row=next(p for p in catalog['points'] if p['id']=='calculus-upper-taylor')
  self.assertEqual(row.get('review_status'),'reviewed_source_original_dialogue')

if __name__=='__main__':unittest.main()
