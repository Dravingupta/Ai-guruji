"""Build offline study HTML, Markdown and vector PDF from guide.json.
Requires reportlab for PDF. No application code, APIs or credentials are executed.
"""
from pathlib import Path
import json, re, html, math, textwrap, unicodedata, zlib
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Flowable, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
# Embed familiar fonts when available, keeping the produced PDF self-contained.
# Other hosts fall back to PDF standard fonts without changing the content model.
font_dir=Path('/System/Library/Fonts/Supplemental')
font_files={'Helvetica':'Arial.ttf','Helvetica-Bold':'Arial Bold.ttf','Helvetica-Oblique':'Arial Italic.ttf','Helvetica-BoldOblique':'Arial Bold Italic.ttf','Courier':'Courier New.ttf'}
if all((font_dir/f).is_file() for f in font_files.values()):
    for name,filename in font_files.items():pdfmetrics.registerFont(TTFont(name,str(font_dir/filename)))
    pdfmetrics.registerFontFamily('Helvetica',normal='Helvetica',bold='Helvetica-Bold',italic='Helvetica-Oblique',boldItalic='Helvetica-BoldOblique')

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
D=json.loads((HERE/'guide.json').read_text())
META=D['meta']; PAGES=D['pages']; REFS=D['refs']; GRAPHS=D['graphs']
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
INK='#24332b'; MUTED='#536257'; PAPER='#f6f5ee'; LIME='#c6f57b'; GREEN='#38634c'; LINE='#d3dacd'
TONES={'client':'#e5f0d6','server':'#e6ebe3','data':'#e0ede4','external':'#f1e5d6'}
W=A4[0]-96; H=A4[1]-121

def asc(s):
    return unicodedata.normalize('NFKD',str(s).translate(str.maketrans({'\u2019':"'",'\u2018':"'",'\u201c':'"','\u201d':'"','\u2013':'-','\u2014':' - ','\u2192':' -> ','\u00d7':'x','\u2264':'<=','\u2265':'>='}))).encode('ascii','ignore').decode()
def rich(s):
    s=escape(asc(s))
    return re.sub(r'`([^`]+)`',r'<font name="Courier">\1</font>',s)
ST={
 'h':ParagraphStyle('h',fontName='Helvetica-Bold',fontSize=23,leading=26,textColor=colors.HexColor(INK),spaceAfter=10),
 'goal':ParagraphStyle('goal',fontName='Helvetica',fontSize=11,leading=16,textColor=colors.HexColor(MUTED),spaceAfter=16),
 'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10.2,leading=14.3,textColor=colors.HexColor(INK),spaceAfter=9),
 'sub':ParagraphStyle('sub',fontName='Helvetica-Bold',fontSize=10.4,leading=14,textColor=colors.HexColor(GREEN),spaceBefore=4,spaceAfter=5),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=8.5,leading=11.6,textColor=colors.HexColor(MUTED),spaceAfter=5),
 'cell':ParagraphStyle('cell',fontName='Helvetica',fontSize=9,leading=12.5,textColor=colors.HexColor(INK)),
 'th':ParagraphStyle('th',fontName='Helvetica-Bold',fontSize=8.8,leading=12,textColor=colors.HexColor(INK)),
 'qa':ParagraphStyle('qa',fontName='Helvetica-Bold',fontSize=10.6,leading=14,textColor=colors.HexColor(INK),spaceBefore=3,spaceAfter=4),
 'code':ParagraphStyle('code',fontName='Courier',fontSize=8.1,leading=10.6,textColor=colors.HexColor(INK),backColor=colors.HexColor('#edf0e8'),borderPadding=10,spaceAfter=10),
}
def para(s,style='body'):return Paragraph(rich(s),ST[style])
def wrapped_table(title,headers,rows,widths=None):
    if widths is None:
        n=len(headers)
        if n==2: widths=[W*.28,W*.72]
        elif n==3: widths=[W*.23,W*.35,W*.42]
        else: widths=[W/n]*n
    data=[[para(x,'th') for x in headers]]+[[para(x,'cell') for x in row] for row in rows]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e3eacb')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor('#a9b39c')),('LINEBELOW',(0,1),(-1,-1),.4,colors.HexColor(LINE)),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#fafbf5'),colors.HexColor('#f0f3eb')])]))
    return ([para(title,'sub')] if title else [])+[t,Spacer(1,10)]

class Diagram(Flowable):
    def __init__(self,g):Flowable.__init__(self);self.g=g;self.width=W;self.height=g['height']
    def draw(self):
        c=self.canv;g=self.g;nodes={n[0]:n for n in g['nodes']};sx=W/507
        c.saveState();c.scale(sx,1)
        for a,b in g['edges']:
            A=nodes[a];B=nodes[b];ax,ay,aw,ah=A[1:5];bx,by,bw,bh=B[1:5]
            if abs((bx+bw/2)-(ax+aw/2))>=abs((by+bh/2)-(ay+ah/2)):
                x1=ax+aw if bx>ax else ax;y1=ay+ah/2;x2=bx if bx>ax else bx+bw;y2=by+bh/2
            else:
                x1=ax+aw/2;y1=ay+ah if by>ay else ay;x2=bx+bw/2;y2=by if by>ay else by+bh
            c.setStrokeColor(colors.HexColor('#71816f'));c.setLineWidth(.9);c.line(x1,y1,x2,y2)
            angle=math.atan2(y2-y1,x2-x1);l=5
            p=c.beginPath();p.moveTo(x2,y2);p.lineTo(x2-l*math.cos(angle-.45),y2-l*math.sin(angle-.45));p.moveTo(x2,y2);p.lineTo(x2-l*math.cos(angle+.45),y2-l*math.sin(angle+.45));c.drawPath(p)
        for n in g['nodes']:
            _,x,y,w,h,title,lines,tone=n
            c.setFillColor(colors.HexColor(TONES[tone]));c.roundRect(x,y,w,h,8,fill=1,stroke=0)
            c.setFillColor(colors.HexColor(INK));c.setFont('Helvetica-Bold',9);c.drawCentredString(x+w/2,y+h-17,asc(title))
            c.setFillColor(colors.HexColor(MUTED));c.setFont('Helvetica',7.8)
            for i,line in enumerate(lines):c.drawCentredString(x+w/2,y+h-31-i*10,asc(line))
        c.restoreState()

class PageGroup(Flowable):
    def __init__(self,elements,number,title,scale=1):
        Flowable.__init__(self);self.elements=elements;self.number=number;self.title=title;self.scale=scale;self.height=0;self.width=W
    def measure(self,c):
        self.measurements=[];height=0
        for e in self.elements:
            _,h=e.wrapOn(c,W,10000);self.measurements.append(h);height+=h+e.getSpaceBefore()+e.getSpaceAfter()
        self.rawHeight=height;self.height=height*self.scale
        return self.height
    def draw(self):
        c=self.canv;c.bookmarkPage(f'section-{self.number}');c.addOutlineEntry(asc(self.title),f'section-{self.number}',0,False)
        c.saveState();c.scale(self.scale,self.scale);y=self.rawHeight
        for e,h in zip(self.elements,self.measurements):
            y-=e.getSpaceBefore()+h;e.drawOn(c,0,y);y-=e.getSpaceAfter()
        c.restoreState()
    def wrap(self,availW,availH):return self.width,self.height

class Cover(Flowable):
    def __init__(self):Flowable.__init__(self);self.width=W;self.height=H-1
    def draw(self):
        c=self.canv
        c.setFillColor(colors.HexColor(GREEN));c.setFont('Helvetica-Bold',12);c.drawString(0,H-30,'AI GURUJI / INTERVIEW FIELD GUIDE')
        c.setFillColor(colors.HexColor(LIME));c.roundRect(0,H-207,W,126,14,fill=1,stroke=0)
        c.setFillColor(colors.HexColor(INK));c.setFont('Helvetica-Bold',54);c.drawString(23,H-136,'OWN THE');c.drawString(23,H-191,'CODE.')
        c.setFont('Helvetica',18);c.drawString(0,H-251,'Visual architecture notes.');c.drawString(0,H-278,'Code walkthroughs. Interview practice.')
        y=H-325
        for line in ['Understand the system. Explain the decisions.','Defend the tradeoffs without hiding AI assistance.']:
            c.setFillColor(colors.HexColor(MUTED));c.setFont('Helvetica',11);c.drawString(0,y,line);y-=18
        qa_count=sum(b['kind']=='qa' for p in PAGES for b in p['blocks'])
        for i,(v,label) in enumerate([(str(len(PAGES)),'study sections'),(str(qa_count),'answered questions'),(str(len(GRAPHS)),'vector diagrams')]):
            x=i*(W/3+3);c.setFillColor(colors.HexColor('#e6ebe0'));c.roundRect(x,H-450,W/3-10,72,8,fill=1,stroke=0)
            c.setFillColor(colors.HexColor(GREEN));c.setFont('Helvetica-Bold',26);c.drawString(x+14,H-412,v);c.setFillColor(colors.HexColor(MUTED));c.setFont('Helvetica',10);c.drawString(x+14,H-434,label)
        c.setFont('Helvetica-Bold',10);c.setFillColor(colors.HexColor(INK));c.drawString(0,115,'SOURCE SNAPSHOT  '+META['commit']+'  |  AUDITED  '+META['date'].upper())
        c.setFont('Helvetica',10);c.setFillColor(colors.HexColor(MUTED))
        for i,line in enumerate(['Current implementation: Gemini, personalized meal schedules,','reusable nutrition targets and a browser/server persistence split.','73 automated tests passed; no paid model or live account test in this audit.']):c.drawString(0,94-i*16,line)
        c.setStrokeColor(colors.HexColor(LINE));c.line(0,26,W,26);c.setFont('Helvetica',9);c.drawString(0,10,'A learning guide, not a script to memorize. Practice on the actual source.')

def elements_for(page,i):
    es=[para(f'{i:02d} / '+page['tag'],'small'),para(page['title'],'h'),para(page['goal'],'goal')]
    for b in page['blocks']:
        k=b['kind']
        if k=='text':es += [para(b['title'],'sub'),para(b['body'])]
        elif k=='bullets':
            es.append(para(b['title'],'sub'))
            for item in b['items']:es.append(Paragraph('• '+rich(item),ParagraphStyle('bullet',parent=ST['body'],leftIndent=10,firstLineIndent=-9,spaceAfter=5)))
        elif k=='table':es += wrapped_table(b['title'],b['headers'],b['rows'])
        elif k=='note':
            t=Table([[Paragraph('<b>'+rich(b['title'])+'</b><br/>'+rich(b['body']),ST['body'])]],colWidths=[W])
            t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e9efdc')),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),3)]));es +=[t,Spacer(1,9)]
        elif k=='refs':
            es.append(para('OPEN THE CODE','small'))
            for key in b['ids']:
                r=REFS[key];es.append(para(f'{key}: {r["path"]}:{r["line"]}','small'))
        elif k=='code':
            r=REFS[b['ref']];es.append(para(f'SOURCE EXCERPT / {r["path"]}:{r["line"]}','small'))
            lines=[]
            for line in asc(b['text']).splitlines():
                indent=len(line)-len(line.lstrip()); wraps=textwrap.wrap(line,width=94,replace_whitespace=False,drop_whitespace=False,subsequent_indent=' '*min(indent+2,22)) if len(line)>94 else [line]
                lines.extend(wraps or [''])
            es +=[Preformatted('\n'.join(lines),ST['code']),Spacer(1,8)]
        elif k=='diagram':es +=[Diagram(GRAPHS[b['name']]),para(GRAPHS[b['name']]['caption'],'small'),Spacer(1,7)]
        elif k=='qa':
            es +=[para(b['q'],'qa'),para(b['a'])]
            if b['probe']:es.append(para('Follow-up: '+b['probe'],'small'))
        elif k=='source_index':
            rows=[[key,REFS[key]['path']+':'+str(REFS[key]['line']),REFS[key]['label']] for key in b['ids']]
            es+=wrapped_table('', ['Key','File and line','Read for'],rows,[W*.16,W*.54,W*.30])
    return es

pdf=OUT/'AI-Guruji-Interview-Guide.pdf'
dummy=canvas.Canvas(str(ROOT/'tmp/pdfs/layout-measure.pdf'))
groups=[];report=[]
for i,p in enumerate(PAGES,1):
    g=PageGroup(elements_for(p,i),i,p['title']);h=g.measure(dummy)
    if h>H:
        g.scale=H/h;g.measure(dummy)
    report.append(dict(section=i,title=p['title'],height=round(h,1),scale=round(g.scale,3)))
    if g.scale<.87:raise ValueError(f'Section {i} too dense: {p["title"]}, height {h}, scale {g.scale}')
    groups.append(g)
print('Layout scales:',[(r['section'],r['scale']) for r in report if r['scale']<1])
(ROOT/'tmp/pdfs/layout-report.json').write_text(json.dumps(report,indent=2))
TOTAL=len(PAGES)+2

def page_chrome(c,doc):
    c.setFillColor(colors.HexColor(PAPER));c.rect(0,0,*A4,fill=1,stroke=0)
    if doc.page==1:return
    c.setFillColor(colors.HexColor(MUTED));c.setFont('Helvetica',8)
    c.drawString(42,A4[1]-29,'AI GURUJI  /  OWN THE CODE')
    c.drawRightString(A4[0]-42,A4[1]-29,'SOURCE '+META['commit'])
    c.setStrokeColor(colors.HexColor(LINE));c.setLineWidth(.5);c.line(42,A4[1]-40,A4[0]-42,A4[1]-40);c.line(42,34,A4[0]-42,34)
    c.drawString(42,21,'Study. Trace. Test. Explain.');c.drawRightString(A4[0]-42,21,f'{doc.page:02d} / {TOTAL:02d}')

# A two-column, linked reading map.
toc_es=[para('READING MAP','small'),para('A practical route through the code','h'),para('Read core walkthroughs first. Use the question bank with answers closed in the companion study page.','goal')]
half=(len(PAGES)+1)//2;rows=[]
for idx in range(half):
    cells=[]
    for n in [idx,idx+half]:
        if n<len(PAGES):
            pp=PAGES[n];cells.append(Paragraph(f'<link href="#section-{n+1}" color="{GREEN}"><b>{n+1:02d}</b>  {escape(asc(pp["title"]))}</link><br/><font size="7.8" color="{MUTED}">PAGE {n+3}</font>',ST['cell']))
        else:cells.append('')
    rows.append(cells)
toc=Table(rows,colWidths=[W/2,W/2]);toc.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),14)]))
toc_es.append(toc);toc_group=PageGroup(toc_es,0,'Reading map');h=toc_group.measure(dummy)
if h>H:toc_group.scale=H/h;toc_group.measure(dummy)
dummy.save()
story=[Cover(),PageBreak(),toc_group]
for g in groups:story.extend([PageBreak(),g])
doc=SimpleDocTemplate(str(pdf),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=53,bottomMargin=54,title='AI Guruji - Own the Code',author='AI Guruji project study guide',subject='Source-backed architecture and interview preparation')
doc.build(story,onFirstPage=page_chrome,onLaterPages=page_chrome)

# Shared inline rendering for offline HTML and editable Markdown.
def hrich(s):return re.sub(r'`([^`]+)`',r'<code>\1</code>',html.escape(str(s)))
def source_link(key,prefix='../../'):
    r=REFS[key];return f'<a href="{prefix}{html.escape(r["path"])}#L{r["line"]}"><code>{html.escape(r["path"])}:{r["line"]}</code></a>'
def svg(g):
    ns={n[0]:n for n in g['nodes']};shapes=[];aid='arrow-'+str(zlib.crc32(g['caption'].encode()))
    for a,b in g['edges']:
        A=ns[a];B=ns[b];ax,ay,aw,ah=A[1:5];bx,by,bw,bh=B[1:5]
        if abs(bx+bw/2-ax-aw/2)>=abs(by+bh/2-ay-ah/2):x1=ax+aw if bx>ax else ax;y1=ay+ah/2;x2=bx if bx>ax else bx+bw;y2=by+bh/2
        else:x1=ax+aw/2;y1=ay+ah if by>ay else ay;x2=bx+bw/2;y2=by if by>ay else by+bh
        shapes.append(f'<path d="M{x1} {g["height"]-y1} L{x2} {g["height"]-y2}" stroke="#71816f" stroke-width="1" marker-end="url(#{aid})" fill="none"/>')
    for n in g['nodes']:
        _,x,y,w,h,title,lines,tone=n;sy=g['height']-y-h
        shapes.append(f'<rect x="{x}" y="{sy}" width="{w}" height="{h}" rx="8" fill="{TONES[tone]}"/>')
        shapes.append(f'<text x="{x+w/2}" y="{sy+17}" text-anchor="middle" font-size="9" font-weight="700">{html.escape(title)}</text>')
        for i,line in enumerate(lines):shapes.append(f'<text x="{x+w/2}" y="{sy+31+i*10}" text-anchor="middle" font-size="7.8" fill="{MUTED}">{html.escape(line)}</text>')
    return f'<svg role="img" aria-label="{html.escape(g["caption"])}" viewBox="0 0 507 {g["height"]}"><defs><marker id="{aid}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8" fill="#71816f"/></marker></defs>{"".join(shapes)}</svg><figcaption>{html.escape(g["caption"])}</figcaption>'

def html_block(b):
    k=b['kind']
    if k=='text':return f'<h3>{hrich(b["title"])}</h3><p>{hrich(b["body"])}</p>'
    if k=='bullets':return f'<h3>{hrich(b["title"])}</h3><ul>'+''.join('<li>'+hrich(t)+'</li>' for t in b['items'])+'</ul>'
    if k=='table':return f'<h3>{hrich(b["title"])}</h3><div class="table-wrap"><table><thead><tr>'+''.join('<th>'+hrich(c)+'</th>' for c in b['headers'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+hrich(c)+'</td>' for c in row)+'</tr>' for row in b['rows'])+'</tbody></table></div>'
    if k=='note':return f'<aside class="note"><h3>{hrich(b["title"])}</h3><p>{hrich(b["body"])}</p></aside>'
    if k=='refs':return '<div class="source-refs"><strong>Open the code</strong>'+''.join(source_link(x) for x in b['ids'])+'</div>'
    if k=='code':return '<div class="code-caption">Source excerpt: '+source_link(b['ref'])+'</div><pre><code>'+html.escape(b['text'])+'</code></pre>'
    if k=='diagram':return '<figure>'+svg(GRAPHS[b['name']])+'</figure>'
    if k=='qa':return '<details class="qa"><summary>'+hrich(b['q'])+'</summary><div class="answer"><p>'+hrich(b['a'])+'</p>'+('<p class="probe">Follow-up: '+hrich(b['probe'])+'</p>' if b['probe'] else '')+'</div></details>'
    if k=='source_index':return '<div class="table-wrap"><table><thead><tr><th>Key</th><th>Source</th><th>Purpose</th></tr></thead><tbody>'+''.join('<tr><td>'+hrich(key)+'</td><td>'+source_link(key)+'</td><td>'+hrich(REFS[key]['label'])+'</td></tr>' for key in b['ids'])+'</tbody></table></div>'
    return ''
chapters=[]
for i,p in enumerate(PAGES,1):chapters.append(f'<section class="chapter" id="section-{i}" data-section="{i}"><div class="chapter-top"><span>{i:02d} / {p["tag"]}</span><button type="button" class="known" aria-pressed="false">Mark understood</button></div><h2>{hrich(p["title"])}</h2><p class="goal">{hrich(p["goal"])}</p>'+''.join(html_block(b) for b in p['blocks'])+'</section>')
nav=''.join(f'<a href="#section-{i}" data-nav="{i}"><span>{i:02d}</span> {html.escape(p["title"])}</a>' for i,p in enumerate(PAGES,1))
css='''
:root{color-scheme:light;--paper:#f6f5ee;--ink:#24332b;--muted:#536257;--line:#d3dacd;--green:#38634c;--lime:#c6f57b}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 system-ui,-apple-system,sans-serif}button,input{font:inherit}button,a,input,summary{outline-offset:4px}a{color:var(--green)}button{cursor:pointer;border:1px solid var(--line);background:#edf0e6;color:var(--ink);border-radius:8px;padding:8px 12px;font-size:13px}button:hover{background:#e2e9d6}button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible{outline:3px solid #638842}button.primary{background:var(--ink);color:var(--paper);border-color:var(--ink)}.hero{background:#1c2c24;color:#f1f3e9;padding:62px max(28px,calc((100vw - 1340px)/2)) 46px}.hero .eyebrow{font-size:12px;letter-spacing:2px;color:#d4e8bd}.hero h1{font-size:clamp(42px,6vw,78px);letter-spacing:-3px;line-height:1.05;margin:22px 0}.hero h1 span{color:var(--lime)}.hero p{max-width:750px;color:#c9d4c7;font-size:18px}.hero .meta{font-size:13px;color:#c4d6b5}.stats{display:flex;flex-wrap:wrap;gap:26px;margin-top:30px;font-size:13px}.stats b{color:var(--lime);font-size:26px;display:block;line-height:1.4}.layout{max-width:1400px;margin:auto;display:grid;grid-template-columns:270px minmax(0,1fr);gap:36px;padding:32px 28px}.sidebar{position:sticky;top:16px;align-self:start;max-height:95vh;overflow:auto;padding-right:16px}.sidebar label{font-size:13px;font-weight:600}.sidebar input{width:100%;background:#fffdf7;border:1px solid #aebba9;border-radius:8px;padding:10px 12px;margin:8px 0}.tools{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.progress{font-size:12px;color:var(--muted);margin:14px 0}.track{height:5px;background:#dce3d3;border-radius:4px}.track span{display:block;height:100%;width:0;background:var(--green);border-radius:4px}.sidebar nav a{display:flex;gap:12px;padding:8px 0;text-decoration:none;font-size:12px;line-height:1.45;border-bottom:1px solid #e0e5da}.sidebar nav span{font-variant-numeric:tabular-nums;color:#627359}.chapter{background:#fffdf7;border:1px solid var(--line);border-radius:15px;padding:32px 36px;margin-bottom:26px;box-shadow:0 8px 24px #22331e05}.chapter-top{display:flex;justify-content:space-between;align-items:center;gap:16px;font-size:11px;letter-spacing:1.3px;color:var(--muted)}.known{letter-spacing:0;white-space:nowrap;font-size:11px}.known[aria-pressed=true]{background:#e3efce;color:#2f512e}.chapter h2{font-size:30px;line-height:1.18;letter-spacing:-1px;margin:20px 0 10px}.goal{font-size:15px;color:var(--muted);margin-bottom:25px}.chapter h3{font-size:17px;margin:24px 0 8px;line-height:1.4}.chapter p{margin:10px 0 18px}.chapter li{padding:3px 0}.chapter ul{padding-left:22px}.table-wrap{overflow:auto;margin:14px 0 22px}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.65}th{text-align:left;background:#e7edda;font-size:12px}th,td{padding:12px;vertical-align:top;border-bottom:1px solid var(--line)}td{min-width:110px}tr:nth-child(even) td{background:#f4f6ee}.note{background:#eaf0dc;border-radius:10px;padding:17px 22px;margin:23px 0}.note h3{margin:0 0 8px;font-size:15px}.note p{margin:0;font-size:14px}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;background:#edf0e6;border-radius:3px;padding:2px 4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.8;background:#eef1e8;border-radius:9px;padding:20px}pre code{padding:0;background:none;font-size:inherit}.code-caption{font-size:11px;margin-top:22px;color:var(--muted)}.source-refs{padding-top:14px;margin-top:22px;border-top:1px solid var(--line);font-size:11px;line-height:1.8}.source-refs strong{display:block}.source-refs a{display:block;overflow-wrap:anywhere}figure{margin:25px 0}figure svg{width:100%;height:auto;font-family:system-ui,sans-serif;color:var(--ink)}figcaption{font-size:12px;color:var(--muted);line-height:1.7;margin-top:9px}.qa{border-bottom:1px solid var(--line);padding:13px 0}.qa summary{cursor:pointer;font-weight:650;font-size:16px}.qa .answer{font-size:14px;padding:4px 0 0 18px}.qa .probe{font-size:12px;color:var(--green)}.no-results{display:none;padding:28px;border:1px dashed var(--line)}dialog{max-width:620px;width:calc(100% - 32px);background:#fffdf7;color:var(--ink);padding:30px;border:1px solid var(--line);border-radius:15px}dialog::backdrop{background:#16251dcc;backdrop-filter:blur(5px)}.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:20px}.dialog-head h2{font-size:20px}.practice-answer{padding:18px;background:#eaf0dc;border-radius:10px}.practice-actions{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}.footnote{font-size:12px;color:var(--muted);padding:15px 0 35px} [hidden]{display:none!important}
@media(max-width:900px){.layout{display:block;padding:20px}.sidebar{position:static;max-height:none;padding:0}.sidebar nav{display:none}.tools{margin-bottom:15px}.chapter{padding:24px}.hero{padding:35px 24px}.chapter h2{font-size:26px}}
@media print{body{background:white;font-size:11px}.hero{padding:20px;background:none;color:black}.hero h1,.hero h1 span,.hero p,.hero .meta{color:black}.hero h1{font-size:36px}.layout{display:block;padding:0}.sidebar,.known,.stats{display:none}.chapter{border:0;box-shadow:none;padding:12px 0;break-before:page}.chapter h2{font-size:23px}table{font-size:10px}.qa .answer{display:block}pre{font-size:9px}figure{break-inside:avoid}a{color:inherit;text-decoration:none}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
'''
js='''
(()=>{
const chapters=[...document.querySelectorAll('.chapter')],qas=[...document.querySelectorAll('.qa')],input=document.getElementById('search'),status=document.getElementById('result-count');
const key='ai-guruji-study-16c4932';let known=new Set();try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved)) known=new Set(saved.map(String));}catch{}
function paint(){chapters.forEach(el=>{const done=known.has(el.dataset.section),b=el.querySelector('.known');b.setAttribute('aria-pressed',String(done));b.textContent=done?'Understood':'Mark understood';});document.getElementById('known-count').textContent=known.size+' / '+chapters.length+' sections marked understood';document.getElementById('known-bar').style.width=(known.size/chapters.length*100)+'%';}
chapters.forEach(el=>el.querySelector('.known').addEventListener('click',()=>{const id=el.dataset.section;known.has(id)?known.delete(id):known.add(id);try{localStorage.setItem(key,JSON.stringify([...known]));}catch{}paint();}));paint();
function search(){const q=input.value.trim().toLowerCase();let count=0;chapters.forEach(el=>{const show=!q||el.textContent.toLowerCase().includes(q);el.hidden=!show;document.querySelector('[data-nav="'+el.dataset.section+'"]').hidden=!show;if(show)count++;});status.textContent=count+' sections match';document.getElementById('no-results').style.display=count?'none':'block';}
input.addEventListener('input',search);search();
const all=document.getElementById('all-answers');all.addEventListener('click',()=>{const open=all.getAttribute('aria-expanded')!=='true';qas.forEach(q=>q.open=open);all.setAttribute('aria-expanded',String(open));all.textContent=open?'Close all answers':'Open all answers';});
const dialog=document.getElementById('practice-dialog'),question=document.getElementById('practice-question'),answer=document.getElementById('practice-answer'),show=document.getElementById('show-answer');let last=-1;
function next(){let n=Math.floor(Math.random()*qas.length);if(n===last)n=(n+1)%qas.length;last=n;question.textContent=qas[n].querySelector('summary').textContent;answer.innerHTML=qas[n].querySelector('.answer').innerHTML;answer.hidden=true;show.textContent='Show answer';show.setAttribute('aria-expanded','false');}
document.getElementById('practice').addEventListener('click',()=>{next();dialog.showModal();});show.addEventListener('click',()=>{answer.hidden=!answer.hidden;show.textContent=answer.hidden?'Show answer':'Hide answer';show.setAttribute('aria-expanded',String(!answer.hidden));});document.getElementById('next-question').addEventListener('click',next);document.getElementById('close-practice').addEventListener('click',()=>dialog.close());
let prior=[];window.addEventListener('beforeprint',()=>{prior=qas.map(q=>q.open);qas.forEach(q=>q.open=true);chapters.forEach(c=>c.hidden=false);});window.addEventListener('afterprint',()=>{qas.forEach((q,i)=>q.open=prior[i]);search();});document.getElementById('print').addEventListener('click',()=>window.print());
})();
'''
html_doc='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Guruji - Own the Code</title><style>'+css+'</style></head><body><header class="hero"><div class="eyebrow">AI GURUJI / INTERVIEW FIELD GUIDE</div><h1>OWN THE <span>CODE.</span></h1><p>Visual architecture notes, source walkthroughs and interview practice for your AI-assisted main project.</p><div class="meta">Source '+META['commit']+' / audited '+META['date']+' / Current provider: Gemini</div><div class="stats"><div><b>'+str(len(PAGES))+'</b>study sections</div><div><b>'+str(sum(b['kind']=='qa' for p in PAGES for b in p['blocks']))+'</b>answered questions</div><div><b>'+str(len(GRAPHS))+'</b>vector diagrams</div><div><b>73</b>passing automated tests in this audit</div></div></header><div class="layout"><aside class="sidebar"><label for="search">Find a topic or question</label><input id="search" type="search" placeholder="e.g. JWT, snack, 429"><div id="result-count" role="status" class="progress"></div><div class="tools"><button id="practice" class="primary">Random question</button><button id="all-answers" aria-expanded="false">Open all answers</button><button id="print">Print</button></div><div class="progress" id="known-count"></div><div class="track" aria-hidden="true"><span id="known-bar"></span></div><p class="progress">Study progress stays only in this browser. Source links work from this local file inside the repository.</p><nav aria-label="Study chapters">'+nav+'</nav></aside><main><div class="no-results" id="no-results">No matching sections. Try a shorter search.</div>'+''.join(chapters)+'<footer class="footnote">Source-backed learning notes. No application behavior or roadmap item was implemented by this document.</footer></main></div><dialog id="practice-dialog" aria-labelledby="practice-title"><div class="dialog-head"><h2 id="practice-title">Explain it without notes</h2><button id="close-practice" aria-label="Close practice">Close</button></div><h3 id="practice-question"></h3><div id="practice-answer" class="practice-answer" hidden></div><div class="practice-actions"><button id="show-answer" aria-expanded="false" class="primary">Show answer</button><button id="next-question">Next question</button></div></dialog><script>'+js+'</script></body></html>'
(HERE/'index.html').write_text(html_doc)
(HERE/'study.js').write_text(js)
# The standalone HTML embeds the same JS; separate copy permits node --check.
md=['# AI Guruji - Own the Code','',f'Visual study guide. Audited {META["date"]}; source `{META["commit"]}`.','', '[Visual PDF](../output/pdf/AI-Guruji-Interview-Guide.pdf) | [Searchable study companion](interview/index.html)','', '## Reading map','']
for i,p in enumerate(PAGES,1):md.append(f'{i}. {p["title"]}')
for i,p in enumerate(PAGES,1):
    md += ['',f'## {i:02d}. {p["title"]}','',f'*{p["tag"]} - {p["goal"]}*','']
    for b in p['blocks']:
        k=b['kind']
        if k in ['text','note']:md += ['### '+b['title'],'',b['body'],'']
        elif k=='bullets':md += ['### '+b['title'],'']+['- '+t for t in b['items']]+['']
        elif k=='table':md += ['### '+b['title'],'','| '+' | '.join(b['headers'])+' |','| '+' | '.join(['---']*len(b['headers']))+' |']+['| '+' | '.join(c.replace('|','/') for c in row)+' |' for row in b['rows']]+['']
        elif k=='refs':
            md += ['**Open the code:**']
            for key in b['ids']:
                r=REFS[key];md.append(f'- [{r["path"]}:{r["line"]}](../{r["path"]}) - {r["label"]}')
            md.append('')
        elif k=='code':
            r=REFS[b['ref']];md += [f'Source excerpt: `{r["path"]}:{r["line"]}`','','```javascript',b['text'],'```','']
        elif k=='qa':
            md += ['### '+b['q'],'',b['a'],'']
            if b['probe']:md += ['**Follow-up:** '+b['probe'],'']
        elif k=='diagram':
            g=GRAPHS[b['name']];md += ['```mermaid','flowchart TD']
            for n in g['nodes']:md.append(f'  {n[0]}["{n[5]}<br/>'+ '<br/>'.join(n[6])+'"]')
            for a,bb in g['edges']:md.append(f'  {a} --> {bb}')
            md += ['```','',g['caption'],'']
        elif k=='source_index':
            for key in b['ids']:
                r=REFS[key];md.append(f'- **{key}**: [{r["path"]}:{r["line"]}](../{r["path"]}) - {r["label"]}')
            md.append('')
(ROOT/'docs/INTERVIEW_PREP.md').write_text('\n'.join(md)+'\n')
print(f'Created {pdf}; {TOTAL} pages expected; HTML and Markdown generated.')
