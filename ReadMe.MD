
# Code for allowing offsetting in paper.js - *currently using paper-jsdom*

better accuracy than inkscape for offsetting

takes into account paths overlapping, when paths intersect when offset etc

Now with path stroking and variable width offsetting!

please report any bugs
Known issues :
  1. stroke path doesnt return valid path - paper boolean operations sometimes reverses windings, which means unite methods dont work properly
  2. paths with overlapping identical curves
  

all code is commented, all questions and ideas welcomed

theres alot of places where code can be made better but it took me 6 months just to get all the techniques right

some parts might seem more complicated than they need to be, most often for edge cases
offsetting is very tricky, floating point errors aggrigate and thus often cant use detection methods.
such as curve A ends at point Z curve B starts at point Z, so when offset new Z should be the same for both
but they are not :'( so then could try epsilon but then point Z can be confused with point Z for another pair of curves

So had to keep things in logicall order, and keep track of where a curve decendid from. This adds alot of complication and forces use
of techniques which allow this.

Cheers

Examples - *original shape in black*
-------------------------------------------
example type | -20 to + 20  | -100 to + 100
------------ | -------------|--------------
complicated shape | <img src="/example1-10.svg" width="300" height="300" />|<img src="/example1-100.svg" width="300" height="300" />
shape that will self intersect | <img src="/example2-10.svg" width="300" height="300" />|<img src="/example2-100.svg" width="300" height="300" />
shape that will lose lines | <img src="/example3-10.svg" width="300" height="300" />|<img src="/example3-100.svg" width="300" height="300" />
shape with holes that will combine| <img src="/example4-10.svg" width="300" height="300" />|<img src="/example4-100.svg" width="300" height="300" />
shape with multiple paths that will combine | <img src="/example5-10.svg" width="300" height="300" />|<img src="/example5-100.svg" width="300" height="300" />
--------------------------------------------

Stroke examples
------------------------------------------------
Normal stroke | Variable stroke | Inverse stroke
--------------|-----------------|---------------
<img src="/Stroke.SVG" width="300" height="300" />|<img src="/VariableWidthstroke.SVG" width="300" height="300" />|<img src="/InverseStroke.SVG" width="300" height="300" />
--------------------------------------------
