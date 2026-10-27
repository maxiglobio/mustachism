import bpy, sys, mathutils
OUT=sys.argv[sys.argv.index('--')+1]
s=bpy.context.scene; hi=bpy.data.objects['card']
for o in list(bpy.data.objects):
    if o.name not in ('card','Camera'): bpy.data.objects.remove(o)
CX,CY=0.0,0.0
cam=bpy.data.objects['Camera']; cam.data.type='ORTHO'; cam.data.ortho_scale=0.1
cam.data.clip_start=0.01; cam.data.clip_end=1
cam.matrix_world = hi.matrix_world @ mathutils.Matrix.Translation((CX,CY,0.2))
s.camera=cam
s.render.engine='BLENDER_WORKBENCH'; s.render.resolution_x=8000; s.render.resolution_y=5000; s.render.resolution_percentage=100
sh=s.display.shading; sh.light='FLAT'; sh.color_type='SINGLE'; sh.single_color=(1,1,1)
s.render.film_transparent=False
s.world.color=(0,0,0)
sh.background_type='VIEWPORT'; sh.background_color=(0,0,0)
s.view_settings.view_transform='Standard'
s.render.image_settings.color_mode='BW'
s.render.filepath=OUT+'/sil.png'; bpy.ops.render.render(write_still=True)
