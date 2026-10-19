#!/usr/bin/env python3
"""Run only this project's compiled development app and keep its own diagnostic log."""
import argparse,json,plistlib,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args();project=a.project.resolve();app=project/'Builds/macOS/LegendHeroes.app'
info=plistlib.loads((app/'Contents/Info.plist').read_bytes());assert info['CFBundleIdentifier']=='jp.treegames.legendheroes'
exe=app/'Contents/MacOS'/info['CFBundleExecutable'];assert exe.is_file()
folder=project/'Documentation/LegendHeroes/Verification';folder.mkdir(parents=True,exist_ok=True)
native_log=(folder/'mac-native.log').open('ab')
process=subprocess.Popen([str(exe),'-logFile',str(folder/'mac-player.log')],cwd=project,stdout=native_log,stderr=native_log,start_new_session=True)
native_log.close()
print(json.dumps({'app':str(app),'pid':process.pid}))
