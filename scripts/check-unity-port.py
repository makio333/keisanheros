#!/usr/bin/env python3
"""Compile native runtime/editor C# with the installed project's real Unity references, outputs only to temp."""
import argparse,subprocess,tempfile,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args();project=a.project.resolve()
version=(project/'ProjectSettings/ProjectVersion.txt').read_text().splitlines()[0].split(': ')[1]
engine=Path('/Applications/Unity/Hub/Editor')/version/'Unity.app/Contents/Resources/Scripting'
runtime=engine/'NetCoreRuntime/dotnet';compiler=next((engine/'DotNetSdk/sdk').glob('*/Roslyn/bincore/csc.dll'))
original=next((project/'Library/Bee/artifacts').rglob('Assembly-CSharp.rsp'))
folder=Path(tempfile.gettempdir())/'legend-native-compile';folder.mkdir(exist_ok=True)
def args(rsp):return [l for l in rsp.read_text().splitlines() if not l.startswith(('"Assets/','-out:','-refout:','/additionalfile:','-analyzer:','/analyzer:'))]
def compile(name,lines,source):
    lines+=['-out:"'+str(folder/(name+'.dll'))+'"','-refout:"'+str(folder/(name+'.ref.dll'))+'"']
    lines+=['"'+str(f)+'"' for f in source.rglob('*.cs')]
    rsp=folder/(name+'.rsp');rsp.write_text('\n'.join(lines));r=subprocess.run([str(runtime),str(compiler),'@'+str(rsp)],cwd=project,text=True,capture_output=True)
    print(r.stdout+r.stderr,end='');
    if r.returncode:raise SystemExit(r.returncode)
    print('PASS: '+name)
compile('LegendRuntime',args(original)+['-define:UNITY_EDITOR,UNITY_EDITOR_OSX,UNITY_STANDALONE_OSX'],root/'unity-port/Assets/LegendHeroes/Runtime')
editor=next((project/'Library/Bee/artifacts').rglob('Assembly-CSharp-Editor.rsp'));lines=args(editor)
lines=[re.sub(r'Library/Bee/artifacts/[^\"]+/Assembly-CSharp(?:\.ref)?\.dll',str(folder/'LegendRuntime.ref.dll'),l) for l in lines]
compile('LegendEditor',lines,root/'unity-port/Assets/LegendHeroes/Editor')
lines=[l for l in args(original) if not (l.startswith('-define:') and 'UNITY_EDITOR' in l)]+['-define:UNITY_STANDALONE_OSX,UNITY_STANDALONE']
compile('LegendPlayer',lines,root/'unity-port/Assets/LegendHeroes/Runtime')
