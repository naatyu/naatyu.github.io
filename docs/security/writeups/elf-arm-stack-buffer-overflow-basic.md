---
title: "ELF ARM - Stack buffer overflow - basic"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cyber
  - writeup
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Stack Buffer Overflow:** a vulnerability where a program writes more data to a buffer on the stack than it can hold, potentially overwriting adjacent memory.
- **Segmentation Fault:** a fault raised by hardware when software attempts to access a restricted area of memory.
- **Shellcode:** a small piece of code used as the payload in the exploitation of a software vulnerability.

#CYBER 

[Challenges/App - System : ELF ARM - Stack buffer overflow - basic [Root Me : Hacking and Information Security learning platform] (root-me.org)](https://www.root-me.org/en/Challenges/App-System/ELF-ARM-Stack-buffer-overflow-basic)

EN COURS

a mon avis il faut trouver a cb de char on peut faire le segfault puis envoyer un sehllcode pour ouvrir un shell qui permettra de faire un cat du .passwd. 
Pour gdb il faut utiliser gdb server
