"""发布逐集审阅覆盖层，并校验未触及其他知识点和用户数据。"""
import copy,json,shutil
from pathlib import Path
from calculus_reviewed import apply_reviewed,sync_reviewed_sources
ROOT=Path(__file__).resolve().parents[1]

def main():
    path=ROOT/'data/curriculum/catalog.json';data=json.loads(path.read_text(encoding='utf-8'));before=copy.deepcopy(data)
    backup=ROOT/'knowledge/build/calculus-reteach/before-reviewed/catalog.json';backup.parent.mkdir(parents=True,exist_ok=True)
    if not backup.exists():shutil.copy2(path,backup)
    ids=apply_reviewed(data['points'])
    assert [p for p in data['points'] if p['id'] not in ids]==[p for p in before['points'] if p['id'] not in ids]
    assert {k:v for k,v in data.items() if k!='points'}=={k:v for k,v in before.items() if k!='points'}
    # 两个消费端共用同一份课时，防止再发布时回退到目录级摘要。
    for target,value in [(path,data),(ROOT/'knowledge/calculus_lessons.json',dict(subject=next(s for s in data['subjects'] if s['id']=='calculus'),points=[p for p in data['points'] if p['subject']=='calculus']))]:
        temp=target.with_suffix('.tmp');temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(target)
    sync_reviewed_sources(ROOT,data['points'])
    print(json.dumps(dict(updated=ids,other_points_unchanged=True),ensure_ascii=False))

if __name__=='__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8');main()
