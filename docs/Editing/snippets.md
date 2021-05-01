# Snippets

This extension adds some basic snippets for Roku development.

## Example snippets in .bs/.brs files:

Typing `sub<tab>` generates:
```brs
sub subName(params)

end sub
```
with "subName" and "params" editable, and cursor inside the block

Typing `for-each<tab>` generates:
```brs
for each item in collection

end for
```
with "item" and "collection" editable and cursor inside the block

## Example snippets in .xml files:

Typing `<component<tab>` generates
```xml
<component name="ComponentName">
  <script type="text/brightscript" uri="ComponentName.brs" />
  
</component>
```
with "ComponentName" editable and cursor inside the block

Typing `<field<tab>` generates
```xml
<field id="id" type="integer" />
```
with "name" editable, and the type is a dropdown of possible values
