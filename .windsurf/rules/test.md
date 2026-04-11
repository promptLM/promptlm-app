---
trigger: always_on
description: 
globs: 
---

Execute the `build-jdk.sh` in the root dir to verify that the Maven build succeeds.

After successfully running the Maven build the app can be acceptance tested with  `test.sh` in the root dir

Do not create fallbacks ot worarounds that introduce additional paths through the applicaiton.

Favour compistion overinheritance /only model IS-A relations as sub-class and otherise delegate)

When implementing tests add some inline documentation, e.g. javdoc on method that describes the intent of the test.

When editing tests verify that the inline docs of the test are still correct and fix them if not.