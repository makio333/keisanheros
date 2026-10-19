#!/usr/bin/env python3
"""Compile our macOS WebKit host using Apple's installed SDK, without downloads."""
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parent.parent
out=root/'unity-port/Assets/LegendHeroes/Plugins/macOS/libLegendHeroesWebKit.dylib'
out.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['xcrun','clang++','-std=c++17','-fobjc-arc','-dynamiclib','-arch','arm64','-arch','x86_64','-mmacosx-version-min=11.3','-framework','AppKit','-framework','WebKit','-framework','Foundation','-Wl,-install_name,@rpath/libLegendHeroesWebKit.dylib',str(root/'unity-port/Native/macOS/LegendHeroesWeb.mm'),'-o',str(out)],check=True)
print(out)
