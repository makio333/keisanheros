#!/usr/bin/env python3
"""Launch the requested saved Unity project; never closes another project."""
import argparse,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args();project=a.project.resolve()
version=(project/'ProjectSettings/ProjectVersion.txt').read_text().splitlines()[0].split(': ')[1]
folder=project/'Temp/LegendHeroesQA';folder.mkdir(parents=True,exist_ok=True)
# Discard only unconsumed commands from our interrupted QA session.
(folder/'editor-command.json').unlink(missing_ok=True)
process=subprocess.Popen(['/Applications/Unity/Hub/Editor/'+version+'/Unity.app/Contents/MacOS/Unity','-projectPath',str(project),'-logFile',str(project/'Logs/Editor.log')],cwd=project,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
print(json.dumps({'project':str(project),'pid':process.pid}))
