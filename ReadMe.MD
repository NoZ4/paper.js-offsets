
#Code for allowing offsetting in paper.js - currently using paper-jsdom

better accuracy than inkscape for offsetting

takes into account paths overlapping, when paths intersect when offset etc

please report any bugs

all code is commented, all questions and ideas welcomed

theres alot of places where code can be made better but it took me 6 months just to get all the techniques right

some parts might seem more complicated than they need to be, most often for edge cases
offsetting is very tricky, floating point errors aggrigate and thus often cant use detection methods.
such as curve A ends at point Z curve B starts at point Z, so when offset new Z should be the same for both
but they are not :'( so then could try epsilon but then point Z can be confused with point Z for another pair of curves

So had to keep things in logicall order, and keep track of where a curve decendid from. This adds alot of complication and forces use
of techniques which allow this.

Cheers




