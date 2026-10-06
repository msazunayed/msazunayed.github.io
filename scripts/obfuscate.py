"""Usage: python scripts/obfuscate.py index.src.html index.html
Packs a readable HTML file into a gzip+base64 self-unpacking page (SEO meta kept readable)."""
import re,gzip,base64,sys
src,dst=sys.argv[1],sys.argv[2]
s=open(src,encoding='utf8').read()
raw=s.encode('utf8')
b64=base64.b64encode(gzip.compress(raw,9,mtime=0)).decode()
payload='"+\n"'.join(b64[i:i+4000] for i in range(0,len(b64),4000))
keep=[re.search(r'<meta name="viewport"[^>]*>',s).group()]
for pat in [r'<meta name="theme-color"[^>]*>',r'<meta name="apple-mobile-web-app-capable"[^>]*>',r'<meta name="apple-mobile-web-app-status-bar-style"[^>]*>',r'<title>.*?</title>',r'<meta name="description"\s+content="[^"]*">',r'<meta property="og:[a-z]+"\s+content="[^"]*">',r'<meta name="twitter:card"[^>]*>',r'<link rel="(?:icon|apple-touch-icon)"[^>]*>',r'<script\s+type="application/ld\+json">.*?</script>']:
    keep+=re.findall(pat,s,re.S)
out='''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
%s
<style>html,body{margin:0;background:#f0eee6}</style>
</head>
<body>
<noscript>Please enable JavaScript to view this portfolio.</noscript>
<script>
(function(){
var d="%s";
function b(s){var r=atob(s),n=r.length,u=new Uint8Array(n);while(n--)u[n]=r.charCodeAt(n);return u}
function go(t){document.open();document.write(t);document.close()}
if(!window.DecompressionStream){document.body.textContent="Please update your browser to view this portfolio.";return}
new Response(new Blob([b(d)]).stream().pipeThrough(new DecompressionStream("gzip"))).text().then(go);
})();
</script>
</body>
</html>
'''%("\n".join(keep),payload)
open(dst,'w',encoding='utf8').write(out)
