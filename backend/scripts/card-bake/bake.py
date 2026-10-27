import bpy, bmesh, sys, json, mathutils, time
args=sys.argv[sys.argv.index('--')+1:]
OUT=args[0]; RES_W=int(args[1]); RES_H=int(args[2]); STAGE=args[3]
ZT, ZB = 0.00104, -0.00076
s=bpy.context.scene; hi=bpy.data.objects['card']
for o in list(bpy.data.objects):
    if o.name!='card': bpy.data.objects.remove(o)
loops=json.load(open(OUT+'/outline.json'))
bm=bmesh.new(); edges=[]
for L in loops:
    vs=[bm.verts.new((x,y,ZT)) for x,y in L['pts']]
    for k in range(len(vs)): edges.append(bm.edges.new((vs[k],vs[(k+1)%len(vs)])))
bmesh.ops.triangle_fill(bm,use_beauty=True,use_dissolve=False,edges=edges)
top=list(bm.faces)
for f in top:
    if f.normal.z<0: f.normal_flip()
ext=bmesh.ops.extrude_face_region(bm,geom=top)
for g in ext['geom']:
    if isinstance(g,bmesh.types.BMVert): g.co.z=ZB
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
bmesh.ops.triangulate(bm,faces=bm.faces)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]
MINX,MAXX,MINY,MAXY=min(xs),max(xs),min(ys),max(ys); W=MAXX-MINX; H=MAXY-MINY
print("BOUNDS",MINX,MAXX,MINY,MAXY,"aspect",W/H)
uv=bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    f.normal_update()
    n=f.normal.z
    f.material_index = 0 if n>0.5 else (1 if n<-0.5 else 2)
    for l in f.loops:
        u=(l.vert.co.x-MINX)/W; v=(l.vert.co.y-MINY)/H
        if f.material_index==1: u=1-u
        if f.material_index==2: u,v=0.5,0.5
        l[uv].uv=(u,v)
print("LO tris",len(bm.faces),"verts",len(bm.verts))
me=bpy.data.meshes.new('card_lo'); bm.to_mesh(me); bm.free()
for f in me.polygons: f.use_smooth=False
lo=bpy.data.objects.new('card_lo',me); s.collection.objects.link(lo)
lo.matrix_world=hi.matrix_world.copy()
json.dump({"minx":MINX,"maxx":MAXX,"miny":MINY,"maxy":MAXY,"zt":ZT,"zb":ZB},open(OUT+'/bounds.json','w'))

def mkmat(name, img):
    m=bpy.data.materials.new(name); m.use_nodes=True
    nt=m.node_tree; n=nt.nodes.new('ShaderNodeTexImage'); n.image=img; nt.nodes.active=n
    return m
imgs={}
for name,(w,h) in {'front':(RES_W,RES_H),'back':(RES_W,RES_H),'edge':(16,16)}.items():
    im=bpy.data.images.new(f'{name}_{STAGE}',w,h,alpha=False,float_buffer=False)
    im.colorspace_settings.name='Non-Color'
    imgs[name]=im
    me.materials.append(mkmat(name,im))

# cycles setup
s.render.engine='CYCLES'
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type=('NONE' if __import__('os').environ.get('BAKE_CPU') else 'METAL'); prefs.get_devices()
    for d in prefs.devices: d.use=True
    s.cycles.device='GPU'; print("DEVICES",[(d.name,d.type) for d in prefs.devices])
except Exception as e: print("GPU fail",e)
s.cycles.samples = {'normal':4,'ao':16,'height':4}[STAGE]
s.render.bake.use_selected_to_active=True
s.render.bake.cage_extrusion=0.0004
s.render.bake.max_ray_distance=0.0025
s.render.bake.margin=12
s.render.bake.margin_type='EXTEND'
s.world.light_settings.distance=0.0012
bpy.ops.object.select_all(action='DESELECT')
hi.select_set(True); lo.select_set(True); bpy.context.view_layer.objects.active=lo
t=time.time()
if STAGE=='normal':
    bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', use_selected_to_active=True)
elif STAGE=='height':
    # Emission = object-space Z remapped to 0..1 over [ZB-0.0006, ZT+0.0003]
    hm=bpy.data.materials.new('height'); hm.use_nodes=True; nt=hm.node_tree; nt.nodes.clear()
    tc=nt.nodes.new('ShaderNodeTexCoord'); sep=nt.nodes.new('ShaderNodeSeparateXYZ'); mr=nt.nodes.new('ShaderNodeMapRange')
    em=nt.nodes.new('ShaderNodeEmission'); out=nt.nodes.new('ShaderNodeOutputMaterial')
    mr.inputs[1].default_value=ZB-0.0006; mr.inputs[2].default_value=ZT+0.0003
    nt.links.new(tc.outputs['Object'],sep.inputs[0]); nt.links.new(sep.outputs[2],mr.inputs[0])
    nt.links.new(mr.outputs[0],em.inputs[0]); nt.links.new(em.outputs[0],out.inputs[0])
    hi.data.materials.clear(); hi.data.materials.append(hm)
    s.view_settings.view_transform='Standard'
    bpy.ops.object.bake(type='EMIT', use_selected_to_active=True)
else:
    bpy.ops.object.bake(type='AO', use_selected_to_active=True)
print("BAKE",STAGE,"secs",round(time.time()-t,1))
for name in ('front','back'):
    im=imgs[name]; im.filepath_raw=f'{OUT}/{name}_{STAGE}.png'; im.file_format='PNG'; im.save()
if STAGE=='normal':
    bpy.data.objects.remove(hi)
    lo.matrix_world=mathutils.Matrix.Identity(4)
    for m in me.materials:
        m.node_tree.nodes.clear()
        o=m.node_tree.nodes.new('ShaderNodeOutputMaterial'); p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        m.node_tree.links.new(p.outputs[0],o.inputs[0])
    bpy.ops.object.select_all(action='DESELECT'); lo.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT+'/card.glb', use_selection=True, export_yup=False, export_format='GLB',
        export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE')
    print("EXPORTED")
