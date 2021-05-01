---
title: Ignoring Errors and Warnings
---
# Ignore errors and warnings on a per-line basis
In addition to disabling an entire class of errors in the `ignoreErrorCodes` array in `bsconfig.json`, you may also disable errors for a subset of the complier rules within a file with the following comment flags:
 - `brs:disable-next-line`
 - `brs:disable-next-line: code1 code2 code3`
 - `brs:disable-line`
 - `brs:disable-line: code1 code2 code3`

Here are some examples:

```brightscript
sub Main()
    'disable errors about invalid syntax here
    'brs:disable-next-line
    DoSomething(

    DoSomething( 'brs:disable-line

    'disable errors about wrong parameter count
    DoSomething(1,2,3) 'brs:disable-next-line

    DoSomething(1,2,3) 'brs:disable-next-line:1002
end sub

sub DoSomething()
end sub
```
