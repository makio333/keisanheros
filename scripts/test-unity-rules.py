#!/usr/bin/env python3
"""Run the native rules offline. Unity's actual assemblies are checked separately."""
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
engine = Path('/Applications/Unity/Hub/Editor/6000.6.3f1/Unity.app/Contents/Resources/Scripting')
sdk = engine / 'NetCoreRuntime/dotnet'
folder = Path(tempfile.gettempdir()) / 'legend-rules-tests'
folder.mkdir(exist_ok=True)
sources = list((root / 'unity-port/Tests').glob('*.cs'))
for section in ['Domain', 'Content', 'Persistence', 'Services']:
    sources.extend((root / 'unity-port/Assets/LegendHeroes/Runtime' / section).glob('*.cs'))
refs = next((engine / 'DotNetSdk/packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))
compiler = next((engine / 'DotNetSdk/sdk').glob('*/Roslyn/bincore/csc.dll'))
assembly = folder / 'Rules.dll'
rsp = folder / 'Rules.rsp'
lines = ['-nologo', '-target:exe', '-define:UNITY_EDITOR', '-out:"' + str(assembly) + '"']
lines += ['-r:"' + str(p) + '"' for p in refs.glob('*.dll')]
lines += ['"' + str(p) + '"' for p in sources]
rsp.write_text('\n'.join(lines))
(folder / 'Rules.runtimeconfig.json').write_text(json.dumps({'runtimeOptions': {'tfm': 'net8.0', 'framework': {'name': 'Microsoft.NETCore.App', 'version': '8.0.21'}}}))
subprocess.run([str(sdk), str(compiler), '@' + str(rsp)], cwd=folder, check=True)
subprocess.run([str(sdk), str(assembly), str(root / 'unity-port/Assets/LegendHeroes/Resources')], cwd=folder, check=True)
