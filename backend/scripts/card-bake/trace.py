import cv2, numpy as np, json, sys
img=cv2.imread(sys.argv[1],0); H,W=img.shape
_,m=cv2.threshold(img,127,255,cv2.THRESH_BINARY)
cnts,hier=cv2.findContours(m,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
s=0.1/W
loops=[]
for i,c in enumerate(cnts):
    a=cv2.contourArea(c)
    if a<200: continue
    ap=cv2.approxPolyDP(c,0.8,True)[:,0,:].astype(float)
    pts=[[ (px-W/2+0.5)*s, -(py-H/2+0.5)*s ] for px,py in ap]
    loops.append({"hole": bool(hier[0][i][3]!=-1), "area_mm2": a*s*s*1e6, "pts": pts})
print([(l["hole"],round(l["area_mm2"],1),len(l["pts"])) for l in loops])
json.dump(loops,open(sys.argv[2],'w'))
